"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/session/me", { cache: "no-store" }).then(async (r) => {
      if (!r.ok) return;
      const user = await r.json();
      router.replace(user.role === "superadmin" ? "/superadmin" : "/admin");
    });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(event.currentTarget);
    const response = await fetch("/api/session/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.detail || "No pudimos iniciar sesión.");
      setLoading(false);
      return;
    }

    router.replace(data.user.role === "superadmin" ? "/superadmin" : "/admin");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark">O</div>
        <span className="eyebrow">ORBÍTICA LOYALTY</span>
        <h1>Entrar al panel</h1>
        <p>Ingresá con tu cuenta de dueño o empleado.</p>
        <form onSubmit={submit} className="form">
          <label>Correo<input name="email" type="email" autoComplete="email" required /></label>
          <label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="button primary full" disabled={loading}>{loading ? "Entrando…" : "Entrar"}</button>
        </form>
        {error && <div className="alert error">{error}</div>}
      </section>
    </main>
  );
}
