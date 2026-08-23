"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, readError } from "@/lib/api";
import type { Business, User } from "@/lib/types";

export default function SuperAdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const meResponse = await fetch("/api/session/me", { cache: "no-store" });
    if (!meResponse.ok) { router.replace("/login"); return; }
    const user: User = await meResponse.json();
    if (user.role !== "superadmin") { router.replace("/admin"); return; }
    setMe(user);

    const response = await apiFetch("/superadmin/businesses");
    if (response.ok) setBusinesses(await response.json());
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const fd = new FormData(form);

    const response = await apiFetch("/superadmin/businesses", {
      method: "POST",
      body: JSON.stringify({
        business_name: fd.get("business_name"),
        slug: fd.get("slug"),
        reward_name: fd.get("reward_name"),
        stamps_required: Number(fd.get("stamps_required")),
        owner_name: fd.get("owner_name"),
        owner_email: fd.get("owner_email"),
        owner_password: fd.get("owner_password"),
      }),
    });
    if (!response.ok) {
      setError(await readError(response));
      return;
    }
    form.reset();
    setNotice("Negocio creado.");
    await load();
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const fd = new FormData(form);
    const next = String(fd.get("new_password") || "");
    if (next !== String(fd.get("confirm_password") || "")) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    const response = await apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password: fd.get("current_password"), new_password: next }),
    });
    if (!response.ok) { setError(await readError(response)); return; }
    await fetch("/api/session/logout", { method: "POST" });
    router.replace("/login");
  }

  async function logout() {
    await fetch("/api/session/logout", { method: "POST" });
    router.replace("/login");
  }

  if (!me) return <main className="admin-loading">Cargando superpanel…</main>;

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="brand-mark small">O</div><div><strong>Orbítica</strong><span>Superadmin</span></div></div>
        <div className="sidebar-footer"><span>{me.full_name}</span><small>Superadmin</small><button onClick={logout}>Cerrar sesión</button></div>
      </aside>
      <section className="admin-main">
        <header className="admin-top"><div><span className="eyebrow">SUPERPANEL</span><h1>Negocios</h1></div></header>
        {(error || notice) && <div className={`alert ${error ? "error" : "success"}`}>{error || notice}</div>}

        <div className="stats-grid">
          <Stat label="Negocios creados" value={businesses.length} />
          <Stat label="Activos" value={businesses.filter((b) => b.active).length} />
        </div>

        <div className="two-column">
          <section className="panel">
            <div className="panel-head"><div><h2>Empresas</h2><p>Cada negocio mantiene sus clientes separados.</p></div></div>
            <div className="business-list">
              {businesses.map((b) => (
                <div className="business-row" key={b.id}>
                  <div><strong>{b.name}</strong><span>/{b.slug}</span></div>
                  <span>{b.stamps_required} sellos → {b.reward_name}</span>
                  <a className="mini" href={`/join/${b.slug}`} target="_blank">Abrir</a>
                </div>
              ))}
            </div>
          </section>

          <section className="panel side-form">
            <div className="panel-head"><div><h2>Nuevo negocio</h2><p>Crea el negocio y su cuenta de dueño.</p></div></div>
            <form className="form" onSubmit={create}>
              <label>Negocio<input name="business_name" required /></label>
              <label>Slug<input name="slug" placeholder="barberia-centro" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
              <label>Premio<input name="reward_name" defaultValue="Premio" required /></label>
              <label>Sellos<input name="stamps_required" type="number" min={2} max={50} defaultValue={10} required /></label>
              <label>Nombre del dueño<input name="owner_name" required /></label>
              <label>Correo del dueño<input name="owner_email" type="email" required /></label>
              <label>Contraseña inicial<input name="owner_password" type="password" minLength={12} required /></label>
              <button className="button primary full">Crear negocio</button>
            </form>
          </section>
        </div>

        <section className="panel side-form" style={{ marginTop: 20, maxWidth: 620 }}>
          <div className="panel-head"><div><h2>Seguridad de la cuenta</h2><p>Cambiar la contraseña revoca todas las sesiones anteriores.</p></div></div>
          <form className="form" onSubmit={changePassword}>
            <label>Contraseña actual<input name="current_password" type="password" autoComplete="current-password" required /></label>
            <label>Nueva contraseña<input name="new_password" type="password" minLength={12} autoComplete="new-password" required /></label>
            <label>Confirmar contraseña<input name="confirm_password" type="password" minLength={12} autoComplete="new-password" required /></label>
            <button className="button primary full">Cambiar contraseña</button>
          </form>
        </section>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>;
}
