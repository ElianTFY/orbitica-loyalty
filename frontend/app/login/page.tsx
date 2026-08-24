"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch("/api/session/me", { cache: "no-store" }).then(async (r) => {
      if (!r.ok) return;
      const user = await r.json();
      router.replace(user.role === "superadmin" ? "/superadmin" : "/admin");
    });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const fd = new FormData(event.currentTarget);
    const response = await fetch("/api/session/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.detail || "No pudimos iniciar sesión."); setLoading(false); return; }
    router.replace(data.user.role === "superadmin" ? "/superadmin" : "/admin"); router.refresh();
  }

  return (
    <main className="auth-page auth-v2">
      <section className="auth-card auth-card-v2">
        <div className="auth-brand-lockup"><Brand product="Loyalty" /></div>
        <div className="auth-context"><span>SECURE ACCESS</span><i /><span>ORBÍTICA CONTROL ROOM</span></div>
        <h1>Entrar al panel</h1>
        <p>Acceso operativo para dueños, personal autorizado y administración de la plataforma.</p>
        <form onSubmit={submit} className="form">
          <label>Correo<input name="email" type="email" autoComplete="email" placeholder="nombre@negocio.com" required /></label>
          <label>Contraseña<div className="password-wrap"><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required /><button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Ocultar" : "Ver"}</button></div></label>
          <button className="button primary full" disabled={loading}>{loading ? "Validando acceso…" : "Entrar"}</button>
        </form>
        {error && <div className="alert error">{error}</div>}
        <div className="auth-help"><Link href="/">← Inicio</Link><Link href="/support">Soporte ↗</Link></div>
        <div className="auth-security-note"><span>SESSION</span><strong>Protegida</strong><span>ACCESS</span><strong>Por rol</strong></div>
      </section>
    </main>
  );
}
