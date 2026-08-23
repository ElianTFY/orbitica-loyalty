"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import { apiFetch, readError } from "@/lib/api";
import type { PublicCard } from "@/lib/types";

export default function CardPage() {
  const { token } = useParams<{ token: string }>();
  const [card, setCard] = useState<PublicCard | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const response = await apiFetch(`/public/card/${token}`);
    if (!response.ok) {
      setError(await readError(response, "No pudimos cargar la tarjeta."));
      return;
    }
    setCard(await response.json());
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (!card) {
    return (
      <main className="customer-page">
        <div className="customer-shell">
          {error ? <div className="alert error">{error}</div> : <p>Cargando tarjeta…</p>}
        </div>
      </main>
    );
  }

  const count = Math.min(card.stamp_balance, card.business.stamps_required);
  const stamps = Array.from({ length: card.business.stamps_required }, (_, i) => i < count);
  const ready = card.stamp_balance >= card.business.stamps_required;

  return (
    <main className="customer-page" style={{ "--business": card.business.primary_color } as CSSProperties}>
      <section className="digital-card">
        <div className="card-head">
          <div className="business-badge">{card.business.name.slice(0, 2).toUpperCase()}</div>
          <button className="refresh" onClick={load}>Actualizar</button>
        </div>
        <span className="eyebrow">TARJETA DIGITAL</span>
        <h1>{card.business.name}</h1>
        <p className="customer-name">{card.customer_name}</p>

        <div className={`stamp-grid ${card.business.stamps_required > 12 ? "compact" : ""}`}>
          {stamps.map((on, i) => (
            <div key={i} className={`stamp ${on ? "on" : ""}`}>{i + 1}</div>
          ))}
        </div>

        <div className={`reward-callout ${ready ? "ready" : ""}`}>
          <div>
            <span>Progreso</span>
            <strong>{card.stamp_balance}/{card.business.stamps_required}</strong>
          </div>
          <div>
            <span>Premio</span>
            <strong>{card.business.reward_name}</strong>
          </div>
        </div>

        {ready && <div className="reward-ready">🎉 Ya podés canjear tu premio</div>}

        <div className="code-box">
          <span>Código de tarjeta</span>
          <strong>{card.card_code}</strong>
        </div>

        <p className="micro">Mostrá este código al personal. No compartás tu enlace de tarjeta.</p>
      </section>
    </main>
  );
}
