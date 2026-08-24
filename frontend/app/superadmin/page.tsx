"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, readError } from "@/lib/api";
import type { Business, User } from "@/lib/types";

type Filter = "all" | "active" | "inactive";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const values = crypto.getRandomValues(new Uint32Array(18));
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

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

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return businesses.filter((business) => {
      if (filter === "active" && !business.active) return false;
      if (filter === "inactive" && business.active) return false;
      if (!needle) return true;
      return `${business.name} ${business.slug} ${business.reward_name}`.toLowerCase().includes(needle);
    });
  }, [businesses, filter, query]);

  function updateBusinessName(value: string) {
    setBusinessName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

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
    setBusinessName("");
    setSlug("");
    setPassword("");
    setSlugTouched(false);
    setNotice("Negocio y cuenta de dueño creados.");
    await load();
  }

  async function toggleBusiness(business: Business) {
    const next = business.active ? "desactivar" : "activar";
    if (!window.confirm(`¿Querés ${next} ${business.name}?`)) return;
    setBusy(business.id);
    setError("");
    setNotice("");
    const response = await apiFetch(`/superadmin/businesses/${business.id}/toggle`, { method: "PATCH" });
    if (!response.ok) setError(await readError(response));
    else setNotice(business.active ? "Negocio desactivado." : "Negocio activado.");
    await load();
    setBusy(null);
  }

  async function copyPublicLink(business: Business) {
    const url = `${window.location.origin}/join/${business.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Enlace público copiado.");
      setError("");
    } catch {
      setError("No se pudo copiar el enlace. Podés abrirlo y copiarlo manualmente.");
    }
  }

  function exportCsv() {
    const rows = [
      ["Negocio", "Slug", "Estado", "Sellos", "Premio", "Creado"],
      ...businesses.map((business) => [
        business.name,
        business.slug,
        business.active ? "Activo" : "Inactivo",
        String(business.stamps_required),
        business.reward_name,
        new Date(business.created_at).toLocaleDateString("es-CR"),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `orbitica-negocios-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
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

  const active = businesses.filter((business) => business.active).length;
  const inactive = businesses.length - active;

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="brand-mark small">O</div><div><strong>Orbítica</strong><span>Superadmin</span></div></div>
        <nav>
          <button className="nav-item active" type="button">Negocios</button>
          <a className="nav-item" href="/support" target="_blank">Soporte público ↗</a>
        </nav>
        <div className="sidebar-footer"><span>{me.full_name}</span><small>Superadmin</small><button onClick={logout}>Cerrar sesión</button></div>
      </aside>

      <section className="admin-main">
        <header className="admin-top">
          <div><span className="eyebrow">SUPERPANEL</span><h1>Negocios</h1></div>
          <button className="button" type="button" onClick={exportCsv}>Exportar CSV</button>
        </header>
        {(error || notice) && <div className={`alert ${error ? "error" : "success"}`}>{error || notice}</div>}

        <div className="stats-grid">
          <Stat label="Negocios creados" value={businesses.length} />
          <Stat label="Activos" value={active} />
          <Stat label="Inactivos" value={inactive} />
          <Stat label="Programas distintos" value={new Set(businesses.map((business) => business.stamps_required)).size} />
        </div>

        <div className="two-column">
          <section className="panel">
            <div className="panel-head"><div><h2>Empresas</h2><p>Buscá, administrá y abrí el programa público de cada negocio.</p></div></div>
            <div className="super-toolbar" style={{ padding: "0 20px" }}>
              <div className="super-toolbar-left">
                <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar negocio, slug o premio…" />
                <select className="select-control" value={filter} onChange={(event) => setFilter(event.target.value as Filter)}>
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
              <span className="micro">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</span>
            </div>

            <div className="business-card-grid">
              {filtered.map((business) => (
                <article className="business-card" key={business.id}>
                  <div className="business-card-head">
                    <div>
                      <h3>{business.name}</h3>
                      <span className="slug">/join/{business.slug}</span>
                    </div>
                    <span className={`status-dot ${business.active ? "active" : "inactive"}`}>{business.active ? "Activo" : "Inactivo"}</span>
                  </div>
                  <div className="business-card-meta">
                    <div><span>Programa</span><strong>{business.stamps_required} sellos</strong></div>
                    <div><span>Premio</span><strong>{business.reward_name}</strong></div>
                    <div><span>Creado</span><strong>{new Date(business.created_at).toLocaleDateString("es-CR")}</strong></div>
                    <div><span>Color</span><strong>{business.primary_color}</strong></div>
                  </div>
                  <div className="business-card-actions">
                    <a className="mini primary" href={`/join/${business.slug}`} target="_blank">Abrir</a>
                    <button className="mini" type="button" onClick={() => copyPublicLink(business)}>Copiar enlace</button>
                    <button
                      className={`mini ${business.active ? "danger-soft" : ""}`}
                      type="button"
                      disabled={busy === business.id}
                      onClick={() => toggleBusiness(business)}
                    >
                      {business.active ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </article>
              ))}
              {!filtered.length && <div className="empty-state">No encontramos negocios con esos filtros.</div>}
            </div>
          </section>

          <section className="panel side-form">
            <div className="panel-head"><div><h2>Nuevo negocio</h2><p>Crea el programa y su primera cuenta de dueño.</p></div></div>
            <form className="form" onSubmit={create}>
              <label>
                Negocio
                <input name="business_name" value={businessName} onChange={(event) => updateBusinessName(event.target.value)} placeholder="Ej. Café Central" required />
              </label>
              <label>
                Slug
                <input
                  name="slug"
                  value={slug}
                  onChange={(event) => { setSlug(slugify(event.target.value)); setSlugTouched(true); }}
                  placeholder="cafe-central"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                />
                <span className="form-help">Se usa en el QR, NFC y enlace público. Se genera automáticamente y podés cambiarlo antes de crear.</span>
              </label>
              <div className="section-divider" />
              <label>Premio<input name="reward_name" defaultValue="Premio" required /></label>
              <label>Sellos<input name="stamps_required" type="number" min={2} max={50} defaultValue={10} required /></label>
              <div className="section-divider" />
              <label>Nombre del dueño<input name="owner_name" required /></label>
              <label>Correo del dueño<input name="owner_email" type="email" required /></label>
              <label className="inline-field">
                Contraseña inicial
                <div className="inline-field-row">
                  <input name="owner_password" type="text" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} autoComplete="new-password" required />
                  <button className="mini" type="button" onClick={() => setPassword(makePassword())}>Generar</button>
                </div>
                <span className="form-help">Entregala al dueño por un canal seguro y pedile que la cambie al iniciar.</span>
              </label>
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
