"use client";

import { FormEvent, useEffect, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, readError } from "@/lib/api";
import type { PublicBusiness } from "@/lib/types";

export default function JoinPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSavedToken(localStorage.getItem(`orbitica_card_${slug}`));
    apiFetch(`/public/business/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await readError(r, "Negocio no encontrado."));
        return r.json();
      })
      .then(setBusiness)
      .catch((e) => setError(e.message));
  }, [slug]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(event.currentTarget);
    const response = await apiFetch(`/public/business/${slug}/join`, {
      method: "POST",
      body: JSON.stringify({
        name: fd.get("name"),
        phone: fd.get("phone"),
        email: fd.get("email") || null,
      }),
    });

    if (!response.ok) {
      setError(await readError(response, "No pudimos crear tu tarjeta."));
      setLoading(false);
      return;
    }

    const data = await response.json();
    localStorage.setItem(`orbitica_card_${slug}`, data.public_token);
    router.push(`/card/${data.public_token}`);
  }

  if (!business && !error) {
    return <main className="customer-page"><div className="customer-shell"><p>Cargando…</p></div></main>;
  }

  if (!business) {
    return <main className="customer-page"><div className="customer-shell"><div className="alert error">{error}</div></div></main>;
  }

  return (
    <main className="customer-page" style={{ "--business": business.primary_color } as CSSProperties}>
      <section className="join-card">
        <div className="business-badge">{business.name.slice(0, 2).toUpperCase()}</div>
        <span className="eyebrow">CLIENTE FRECUENTE</span>
        <h1>{business.name}</h1>
        <p>Registrate una sola vez y empezá a acumular sellos en cada visita.</p>

        {savedToken && (
          <button className="button soft full" onClick={() => router.push(`/card/${savedToken}`)}>
            Abrir mi tarjeta guardada
          </button>
        )}

        <form onSubmit={submit} className="form">
          <label>Nombre<input name="name" required minLength={2} placeholder="Tu nombre" /></label>
          <label>Teléfono<input name="phone" required minLength={6} placeholder="8888-8888" /></label>
          <label>Email <span className="optional">(opcional)</span><input name="email" type="email" placeholder="correo@ejemplo.com" /></label>
          <button className="button primary full" disabled={loading}>
            {loading ? "Creando tarjeta…" : "Obtener mi tarjeta"}
          </button>
        </form>
        {error && <div className="alert error">{error}</div>}
        <p className="privacy-note">Tus puntos solo pueden ser modificados por personal autorizado del negocio.</p>
      </section>
    </main>
  );
}
