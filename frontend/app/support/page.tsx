import type { Metadata } from "next";
import Link from "next/link";
import Brand from "@/components/Brand";

export const metadata: Metadata = {
  title: "Soporte",
  description: "Centro de soporte de Orbítica Loyalty.",
};

export default function SupportPage() {
  return (
    <main className="public-page support-v2">
      <div className="public-page-inner">
        <div className="public-brand"><Brand product="Loyalty" /><Link className="public-back" href="/">← Volver al inicio</Link></div>
        <span className="eyebrow">SOPORTE / ORBÍTICA LOYALTY</span>
        <h1>Soporte humano para una operación que no puede detenerse.</h1>
        <p className="public-lead">Ayuda para clientes, negocios y administradores con tarjetas, acceso, sellos, canjes, Wallet, notificaciones o configuración del programa.</p>

        <div className="support-grid">
          <section className="support-card">
            <span>01 / EMAIL</span>
            <h2>Soporte por correo</h2>
            <p>Para problemas de acceso, configuración o consultas que necesiten seguimiento.</p>
            <a className="button primary" href="mailto:ogongua40@gmail.com">Enviar correo</a>
          </section>
          <section className="support-card">
            <span>02 / TELÉFONO</span>
            <h2>Atención directa</h2>
            <p>Para consultas operativas y ayuda con el uso diario de Orbítica Loyalty.</p>
            <a className="button" href="tel:+50684980235">+506 8498-0235</a>
          </section>
          <section className="support-card">
            <span>03 / CLIENTES</span>
            <h2>Problemas con una tarjeta</h2>
            <p>Indicá el nombre del negocio, tu nombre y el teléfono utilizado para registrar la tarjeta.</p>
          </section>
          <section className="support-card">
            <span>04 / NEGOCIOS</span>
            <h2>Ayuda con el panel</h2>
            <p>Incluí el nombre del negocio y una descripción del problema. Nunca enviés contraseñas por correo.</p>
          </section>
        </div>

        <div className="support-note"><strong>Seguridad:</strong> Orbítica nunca te pedirá por correo contraseñas, llaves privadas, secretos de API ni credenciales de Wallet.</div>
      </div>
    </main>
  );
}
