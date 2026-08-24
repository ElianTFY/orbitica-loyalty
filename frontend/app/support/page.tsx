import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Soporte",
  description: "Centro de soporte de Orbítica Loyalty.",
};

export default function SupportPage() {
  return (
    <main className="public-page">
      <div className="public-page-inner">
        <Link className="public-back" href="/">← Volver a Orbítica Loyalty</Link>
        <span className="eyebrow">CENTRO DE SOPORTE</span>
        <h1>¿En qué podemos ayudarte?</h1>
        <p className="public-lead">
          Si tenés un problema con una tarjeta de fidelidad, acceso al panel,
          sellos, canjes o configuración del programa, podés contactarnos por
          cualquiera de estos medios.
        </p>

        <div className="support-grid">
          <section className="support-card">
            <span>EMAIL</span>
            <h2>Soporte por correo</h2>
            <p>Ideal para problemas de acceso, configuración o consultas que requieran seguimiento.</p>
            <a className="button primary" href="mailto:ogongua40@gmail.com">Enviar correo</a>
          </section>

          <section className="support-card">
            <span>TELÉFONO</span>
            <h2>Atención directa</h2>
            <p>Para consultas operativas y ayuda con el uso de Orbítica Loyalty.</p>
            <a className="button" href="tel:+50684980235">+506 8498-0235</a>
          </section>

          <section className="support-card">
            <span>CLIENTES</span>
            <h2>Problemas con una tarjeta</h2>
            <p>Indicá el nombre del negocio, tu nombre y el teléfono usado para registrar la tarjeta.</p>
          </section>

          <section className="support-card">
            <span>NEGOCIOS</span>
            <h2>Ayuda con el panel</h2>
            <p>Incluí el nombre del negocio y una descripción del problema. Nunca envíes contraseñas por correo.</p>
          </section>
        </div>

        <div className="support-note">
          <strong>Seguridad:</strong> Orbítica nunca te pedirá por correo la contraseña de tu cuenta,
          llaves privadas, secretos de API ni credenciales de Wallet.
        </div>
      </div>
    </main>
  );
}
