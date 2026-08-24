"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import Brand from "@/components/Brand";
import { apiFetch, readError } from "@/lib/api";
import type { PublicCard } from "@/lib/types";

type WalletStatus = { apple: boolean; google: boolean };
type PushStatus = { enabled: boolean; vapid_public_key: string };

function vapidKey(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function isIosDevice() { return /iphone|ipad|ipod/i.test(window.navigator.userAgent); }
function isStandalone() {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export default function CardPage() {
  const { token } = useParams<{ token: string }>();
  const [card, setCard] = useState<PublicCard | null>(null);
  const [wallets, setWallets] = useState<WalletStatus>({ apple: false, google: false });
  const [push, setPush] = useState<PushStatus>({ enabled: false, vapid_public_key: "" });
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [walletBusy, setWalletBusy] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const [cardResponse, walletResponse, pushResponse] = await Promise.all([
      apiFetch(`/public/card/${token}`),
      apiFetch(`/public/card/${token}/wallet/status`),
      apiFetch(`/public/card/${token}/push/status`),
    ]);
    if (!cardResponse.ok) { setError(await readError(cardResponse, "No pudimos cargar la tarjeta.")); return; }
    setCard(await cardResponse.json());
    if (walletResponse.ok) setWallets(await walletResponse.json());
    if (pushResponse.ok) setPush(await pushResponse.json());
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!push.enabled) return;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setPushSupported(supported);
    setIosNeedsInstall(isIosDevice() && !isStandalone());
    if (!supported || (isIosDevice() && !isStandalone())) return;
    let cancelled = false;
    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();
      if (!cancelled) setPushSubscribed(Boolean(subscription));
    }).catch(() => { if (!cancelled) setPushSupported(false); });
    return () => { cancelled = true; };
  }, [push.enabled]);

  async function addGoogleWallet() {
    setWalletBusy(true); setError("");
    const response = await apiFetch(`/public/card/${token}/wallet/google`);
    if (!response.ok) { setError(await readError(response, "No pudimos preparar Google Wallet.")); setWalletBusy(false); return; }
    const data = await response.json(); window.location.assign(data.url);
  }

  async function enablePush() {
    setPushBusy(true); setError(""); setNotice("");
    try {
      if (!push.enabled || !push.vapid_public_key) throw new Error("Las notificaciones todavía no están disponibles.");
      if (iosNeedsInstall) throw new Error("En iPhone, primero agregá esta tarjeta a la pantalla de inicio y abrila desde ahí.");
      if (!pushSupported) throw new Error("Este navegador no admite notificaciones push.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Necesitamos tu permiso para activar las notificaciones.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey(push.vapid_public_key) });
      const response = await apiFetch(`/public/card/${token}/push/subscribe`, { method: "POST", body: JSON.stringify(subscription.toJSON()) });
      if (!response.ok) throw new Error(await readError(response, "No pudimos activar las notificaciones."));
      setPushSubscribed(true); setNotice("Notificaciones activadas. Te avisaremos cuando cambien tus sellos o tengas un premio.");
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos activar las notificaciones."); }
    finally { setPushBusy(false); }
  }

  async function disablePush() {
    setPushBusy(true); setError(""); setNotice("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await apiFetch(`/public/card/${token}/push/subscribe`, { method: "DELETE", body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
      }
      setPushSubscribed(false); setNotice("Notificaciones desactivadas en este dispositivo.");
    } catch { setError("No pudimos desactivar las notificaciones. Intentá nuevamente."); }
    finally { setPushBusy(false); }
  }

  if (!card) return <main className="customer-page"><div className="customer-shell">{error ? <div className="alert error">{error}</div> : <p>Cargando tarjeta…</p>}</div></main>;

  const count = Math.min(card.stamp_balance, card.business.stamps_required);
  const stamps = Array.from({ length: card.business.stamps_required }, (_, i) => i < count);
  const ready = card.stamp_balance >= card.business.stamps_required;

  return (
    <main className="customer-page card-v2" style={{ "--business": card.business.primary_color } as CSSProperties}>
      <div className="card-v2-shell">
        <header className="card-v2-top"><Brand product="Loyalty" compact /><span>MEMBER CARD / {card.card_code}</span></header>
        <section className="digital-card digital-card-v2">
          <div className="card-v2-head">
            <div className="business-badge">{card.business.name.slice(0, 2).toUpperCase()}</div>
            <div><span className="eyebrow">TARJETA DIGITAL</span><h1>{card.business.name}</h1><p className="customer-name">{card.customer_name}</p></div>
            <button className="refresh" onClick={load}>Actualizar</button>
          </div>

          <div className="card-v2-progress-head"><span>PROGRESO DEL PROGRAMA</span><strong>{card.stamp_balance}<small> / {card.business.stamps_required}</small></strong></div>
          <div className={`stamp-grid ${card.business.stamps_required > 12 ? "compact" : ""}`}>{stamps.map((on, i) => <div key={i} className={`stamp ${on ? "on" : ""}`}><span>{String(i + 1).padStart(2, "0")}</span></div>)}</div>

          <div className={`reward-callout ${ready ? "ready" : ""}`}>
            <div><span>Estado</span><strong>{ready ? "Premio disponible" : `${Math.max(card.business.stamps_required - card.stamp_balance, 0)} sellos restantes`}</strong></div>
            <div><span>Recompensa</span><strong>{card.business.reward_name}</strong></div>
          </div>
          {ready && <div className="reward-ready">Premio desbloqueado · mostrale esta tarjeta al personal</div>}

          <div className="code-box"><span>Código de miembro</span><strong>{card.card_code}</strong></div>

          {(wallets.apple || wallets.google) && <section className="card-v2-module"><div className="card-v2-module-head"><span>WALLET</span><small>Guardá tu tarjeta en el teléfono</small></div><div className="wallet-actions">
            {wallets.apple && <a className="wallet-button apple" href={`/api/backend/public/card/${token}/wallet/apple`}> <span>Agregar a Apple Wallet</span></a>}
            {wallets.google && <button className="wallet-button google" disabled={walletBusy} onClick={addGoogleWallet}><span>{walletBusy ? "Preparando…" : "Agregar a Google Wallet"}</span></button>}
          </div></section>}

          {push.enabled && <section className="card-v2-module push-card"><div className="card-v2-module-head"><span>NOTIFICACIONES</span><small>Recibí cambios importantes del programa</small></div>
            {iosNeedsInstall ? <p className="push-help">En iPhone: Compartir → Agregar a pantalla de inicio → abrí la tarjeta desde el ícono y activá los avisos.</p> : pushSubscribed ? <button className="button full soft" disabled={pushBusy} onClick={disablePush}>{pushBusy ? "Procesando…" : "Notificaciones activadas · Desactivar"}</button> : <button className="button full primary" disabled={pushBusy || !pushSupported} onClick={enablePush}>{pushBusy ? "Activando…" : "Activar notificaciones"}</button>}
            {!iosNeedsInstall && !pushSupported && <p className="push-help">Este navegador no permite notificaciones push.</p>}
          </section>}

          {notice && <div className="alert success">{notice}</div>}
          {error && <div className="alert error">{error}</div>}
          <div className="customer-brand-signature"><span>Infraestructura de fidelización</span><Brand href="/" product="Loyalty" compact /></div>
        </section>
      </div>
    </main>
  );
}
