"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";
import { apiFetch, readError } from "@/lib/api";
import type { Customer, Dashboard, User } from "@/lib/types";

type Tab = "resumen" | "clientes" | "programa" | "equipo" | "seguridad";

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("resumen");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const meResponse = await fetch("/api/session/me", { cache: "no-store" });
    if (!meResponse.ok) { router.replace("/login"); return; }
    const user: User = await meResponse.json();
    if (user.role === "superadmin") { router.replace("/superadmin"); return; }
    setMe(user);

    const [d, c] = await Promise.all([apiFetch("/admin/dashboard"), apiFetch("/admin/customers")]);
    if (d.ok) setDashboard(await d.json());
    if (c.ok) setCustomers(await c.json());
    if (user.role === "owner") {
      const s = await apiFetch("/admin/staff");
      if (s.ok) setStaff(await s.json());
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((c) => `${c.name} ${c.phone} ${c.card_code}`.toLowerCase().includes(q));
  }, [customers, query]);

  async function action(customerId: string, kind: "stamp" | "redeem") {
    setBusy(customerId); setNotice(""); setError("");
    const response = await apiFetch(`/admin/customers/${customerId}/${kind}`, {
      method: "POST",
      ...(kind === "stamp" ? { body: JSON.stringify({ amount: 1 }) } : {}),
    });
    if (!response.ok) setError(await readError(response));
    else setNotice(kind === "stamp" ? "Sello agregado." : "Premio canjeado.");
    await load(); setBusy(null);
  }

  async function rotateCardToken(customerId: string) {
    if (!window.confirm("Esto invalidará el enlace anterior de la tarjeta. ¿Continuar?")) return;
    setBusy(customerId); setError(""); setNotice("");
    const response = await apiFetch(`/admin/customers/${customerId}/rotate-token`, { method: "POST" });
    if (!response.ok) setError(await readError(response)); else setNotice("Enlace de tarjeta renovado.");
    await load(); setBusy(null);
  }

  async function createCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = event.currentTarget; const fd = new FormData(form);
    const response = await apiFetch("/admin/customers", { method: "POST", body: JSON.stringify({ name: fd.get("name"), phone: fd.get("phone"), email: fd.get("email") || null }) });
    if (!response.ok) { setError(await readError(response)); return; }
    form.reset(); setNotice("Cliente creado."); await load();
  }

  async function updateProgram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fd = new FormData(event.currentTarget);
    const response = await apiFetch("/admin/business", { method: "PATCH", body: JSON.stringify({ name: fd.get("name"), reward_name: fd.get("reward_name"), stamps_required: Number(fd.get("stamps_required")), primary_color: fd.get("primary_color") }) });
    if (!response.ok) { setError(await readError(response)); return; }
    setNotice("Programa actualizado."); await load();
  }

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const fd = new FormData(form);
    const response = await apiFetch("/admin/staff", { method: "POST", body: JSON.stringify({ full_name: fd.get("full_name"), email: fd.get("email"), password: fd.get("password") }) });
    if (!response.ok) { setError(await readError(response)); return; }
    form.reset(); setNotice("Empleado creado."); await load();
  }

  async function toggleStaff(id: string) {
    const response = await apiFetch(`/admin/staff/${id}/toggle`, { method: "PATCH" });
    if (!response.ok) setError(await readError(response)); else setNotice("Empleado actualizado.");
    await load();
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const form = event.currentTarget; const fd = new FormData(form);
    const next = String(fd.get("new_password") || ""); const confirm = String(fd.get("confirm_password") || "");
    if (next !== confirm) { setError("Las contraseñas nuevas no coinciden."); return; }
    const response = await apiFetch("/auth/change-password", { method: "POST", body: JSON.stringify({ current_password: fd.get("current_password"), new_password: next }) });
    if (!response.ok) { setError(await readError(response)); return; }
    await fetch("/api/session/logout", { method: "POST" }); router.replace("/login");
  }

  async function copyJoinLink() {
    if (!dashboard) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/join/${dashboard.business.slug}`); setNotice("Enlace del programa copiado."); }
    catch { setError("No se pudo copiar el enlace."); }
  }

  async function logout() { await fetch("/api/session/logout", { method: "POST" }); router.replace("/login"); }

  if (!dashboard || !me) return <main className="admin-loading">Cargando panel…</main>;

  const business = dashboard.business;
  const readyRewards = customers.filter((c) => c.stamp_balance >= business.stamps_required).length;
  const averageProgress = customers.length ? Math.round(customers.reduce((sum, c) => sum + Math.min(c.stamp_balance, business.stamps_required), 0) / (customers.length * business.stamps_required) * 100) : 0;

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><Brand href="/" product="Loyalty" compact /></div>
        <nav>
          <Nav index="01" active={tab === "resumen"} onClick={() => setTab("resumen")}>Resumen</Nav>
          <Nav index="02" active={tab === "clientes"} onClick={() => setTab("clientes")}>Clientes</Nav>
          <Nav index="03" active={tab === "programa"} onClick={() => setTab("programa")}>Programa</Nav>
          {me.role === "owner" && <Nav index="04" active={tab === "equipo"} onClick={() => setTab("equipo")}>Equipo</Nav>}
          <Nav index={me.role === "owner" ? "05" : "04"} active={tab === "seguridad"} onClick={() => setTab("seguridad")}>Seguridad</Nav>
        </nav>
        <div className="sidebar-footer"><span>{me.full_name}</span><small>{me.role === "owner" ? "Dueño" : "Empleado"}</small><button onClick={logout}>Cerrar sesión</button></div>
      </aside>

      <section className="admin-main">
        <header className="admin-top">
          <div><span className="eyebrow">CONTROL ROOM / {business.slug.toUpperCase()}</span><h1>{business.name}</h1></div>
          <div className="admin-head-actions"><button className="button soft" type="button" onClick={copyJoinLink}>Copiar enlace</button><a className="button" href={`/join/${business.slug}`} target="_blank">Abrir experiencia ↗</a></div>
        </header>

        {(notice || error) && <div className={`alert ${error ? "error" : "success"}`}>{error || notice}</div>}

        {tab === "resumen" && <>
          <div className="stats-grid">
            <Stat label="Clientes" value={dashboard.customers} hint={`+${dashboard.new_customers_month} este mes`} />
            <Stat label="Premios listos" value={readyRewards} />
            <Stat label="Progreso medio" value={`${averageProgress}%`} />
            <Stat label="Canjes" value={dashboard.rewards_redeemed} />
          </div>
          <div className="dashboard-grid">
            <section className="panel"><div className="panel-head"><div><h2>Actividad reciente</h2><p>Movimientos registrados en el programa.</p></div><span className="panel-code">LIVE FEED</span></div><div className="activity-list">
              {dashboard.recent_activity.map((a) => <div className="activity-item" key={a.id}><div className={`activity-icon ${a.type}`}>{a.type === "redeem" ? "★" : "+"}</div><div><strong>{a.customer_name}</strong><span>{a.type === "redeem" ? "Canjeó un premio" : `Recibió ${a.amount} sello${a.amount === 1 ? "" : "s"}`}</span></div><div className="activity-meta"><span>{a.actor_name || "Sistema"}</span><small>{new Date(a.created_at).toLocaleString("es-CR")}</small></div></div>)}
              {!dashboard.recent_activity.length && <div className="empty-state">Todavía no hay movimientos.</div>}
            </div></section>
            <section className="panel qr-panel"><div className="panel-head"><div><h2>Punto de entrada</h2><p>Este QR y el NFC comparten el mismo destino.</p></div><span className="panel-code">QR / NFC</span></div><img src={`/api/backend/public/business/${business.slug}/qr`} alt={`QR ${business.name}`} /><code>/join/{business.slug}</code><a className="button full" href={`/api/backend/public/business/${business.slug}/qr`} target="_blank">Abrir QR</a></section>
          </div>
        </>}

        {tab === "clientes" && <div className="two-column">
          <section className="panel"><div className="panel-head"><div><h2>Clientes</h2><p>Buscá por nombre, teléfono o código.</p></div><input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" /></div><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Teléfono</th><th>Código</th><th>Sellos</th><th>Canjes</th><th>Acciones</th></tr></thead><tbody>
            {filtered.map((c) => <tr key={c.id}><td><strong>{c.name}</strong><small>{c.email || ""}</small></td><td>{c.phone}</td><td><code>{c.card_code}</code></td><td><span className="pill">{c.stamp_balance}/{business.stamps_required}</span></td><td>{c.rewards_redeemed}</td><td className="row-actions"><button className="mini primary" disabled={busy === c.id} onClick={() => action(c.id, "stamp")}>+ Sello</button><button className="mini" disabled={busy === c.id} onClick={() => action(c.id, "redeem")}>Canjear</button><a className="mini" href={`/card/${c.public_token}`} target="_blank">Tarjeta</a>{me.role === "owner" && <button className="mini" disabled={busy === c.id} onClick={() => rotateCardToken(c.id)}>Reemitir</button>}</td></tr>)}
            {!filtered.length && <tr><td className="empty-cell" colSpan={6}>No hay clientes.</td></tr>}
          </tbody></table></div></section>
          <section className="panel side-form"><div className="panel-head"><div><h2>Nuevo cliente</h2><p>Alta manual desde el mostrador.</p></div></div><form className="form" onSubmit={createCustomer}><label>Nombre<input name="name" required /></label><label>Teléfono<input name="phone" required /></label><label>Email<input name="email" type="email" /></label><button className="button primary full">Crear cliente</button></form></section>
        </div>}

        {tab === "programa" && <div className="two-column">
          <section className="panel side-form wide-form"><div className="panel-head"><div><h2>Configuración del programa</h2><p>Estos cambios se reflejan en las tarjetas.</p></div></div><form className="form" onSubmit={updateProgram}><label>Nombre del negocio<input name="name" defaultValue={business.name} required /></label><label>Premio<input name="reward_name" defaultValue={business.reward_name} required /></label><label>Sellos necesarios<input name="stamps_required" type="number" min={2} max={50} defaultValue={business.stamps_required} required /></label><label>Color principal<input name="primary_color" type="color" defaultValue={business.primary_color} /></label><button className="button primary">Guardar cambios</button></form></section>
          <section className="panel preview-program"><span className="eyebrow">VISTA DE SISTEMA</span><h3>{business.name}</h3><div className="small-stamps">{Array.from({ length: Math.min(business.stamps_required, 20) }).map((_, i) => <span key={i}>{i + 1}</span>)}</div><p>Premio: <strong>{business.reward_name}</strong></p><p className="micro">La tarjeta final mantiene la identidad del negocio y la firma tecnológica de Orbítica.</p></section>
        </div>}

        {tab === "equipo" && me.role === "owner" && <div className="two-column"><section className="panel"><div className="panel-head"><div><h2>Equipo</h2><p>Personas autorizadas para operar el programa.</p></div></div><div className="staff-list">{staff.map((u) => <div className="staff-row" key={u.id}><div><strong>{u.full_name}</strong><span>{u.email}</span></div><span className={`status ${u.active ? "on" : "off"}`}>{u.active ? "Activo" : "Inactivo"}</span>{u.role === "staff" ? <button className="mini" onClick={() => toggleStaff(u.id)}>{u.active ? "Desactivar" : "Activar"}</button> : <span className="owner-badge">Dueño</span>}</div>)}</div></section><section className="panel side-form"><div className="panel-head"><div><h2>Agregar empleado</h2><p>Usá una contraseña temporal fuerte.</p></div></div><form className="form" onSubmit={createStaff}><label>Nombre<input name="full_name" required /></label><label>Correo<input name="email" type="email" required /></label><label>Contraseña temporal<input name="password" type="password" minLength={12} required /></label><button className="button primary full">Crear empleado</button></form></section></div>}

        {tab === "seguridad" && <div className="two-column"><section className="panel side-form"><div className="panel-head"><div><h2>Cambiar contraseña</h2><p>Al cambiarla se cerrarán las sesiones activas.</p></div></div><form className="form" onSubmit={changePassword}><label>Contraseña actual<input name="current_password" type="password" autoComplete="current-password" required /></label><label>Nueva contraseña<input name="new_password" type="password" minLength={12} autoComplete="new-password" required /></label><label>Confirmar nueva contraseña<input name="confirm_password" type="password" minLength={12} autoComplete="new-password" required /></label><p className="micro">Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo.</p><button className="button primary full">Cambiar contraseña</button></form></section></div>}
      </section>
    </main>
  );
}

function Nav({ index, active, onClick, children }: { index: string; active: boolean; onClick: () => void; children: React.ReactNode }) { return <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}><span className="nav-index">{index}</span>{children}</button>; }
function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) { return <div className="stat-card"><span>{label}</span><strong>{typeof value === "number" ? value.toLocaleString("es-CR") : value}</strong>{hint && <small>{hint}</small>}</div>; }
