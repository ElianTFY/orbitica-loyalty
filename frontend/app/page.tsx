import Link from "next/link";

const features = [
  ["01", "Tarjetas digitales", "Cada cliente recibe su tarjeta con sellos, premio y código único, lista para usar desde el teléfono."],
  ["02", "QR + NFC", "Un solo enlace para registrar clientes desde un código QR, una placa NFC o cualquier material impreso."],
  ["03", "Notificaciones", "Avisos cuando el cliente recibe sellos, alcanza su premio o el negocio necesita comunicar una novedad."],
  ["04", "Apple y Google Wallet", "La plataforma queda preparada para guardar la tarjeta en Wallet y mantener el saldo sincronizado."],
  ["05", "Panel para el negocio", "Clientes, empleados, sellos, canjes, actividad y configuración del programa desde un solo panel."],
  ["06", "Multi-negocio", "Cada empresa opera en un espacio separado, con sus propias reglas, clientes, colores y recompensas."],
];

const flow = [
  ["El cliente escanea", "Abre el QR o acerca el teléfono al NFC del negocio."],
  ["Crea su tarjeta", "Se registra una sola vez y recibe una tarjeta digital única."],
  ["Acumula sellos", "El personal acredita cada visita desde el panel del negocio."],
  ["Canjea y vuelve", "Al llegar a la meta, el premio queda listo para canjear."],
];

export default function Home() {
  return (
    <main className="marketing-page">
      <header className="site-header">
        <div className="marketing-wrap">
          <Link href="/" className="site-brand" aria-label="Orbítica Loyalty">
            <span className="site-brand-mark">O</span>
            <span>Orbítica<small>LOYALTY</small></span>
          </Link>
          <nav className="site-nav" aria-label="Navegación principal">
            <a href="#funciones">Funciones</a>
            <a href="#como-funciona">Cómo funciona</a>
            <Link href="/support">Soporte</Link>
          </nav>
          <div className="site-header-actions">
            <Link className="button soft" href="/join/porras">Ver demo</Link>
            <Link className="button primary" href="/login">Entrar</Link>
          </div>
        </div>
      </header>

      <div className="marketing-wrap">
        <section className="marketing-hero">
          <div className="hero-copy">
            <span className="eyebrow">FIDELIZACIÓN DIGITAL PARA NEGOCIOS</span>
            <h1>Convertí cada visita en una razón para <em>volver.</em></h1>
            <p>
              Orbítica Loyalty reúne tarjetas digitales, QR, NFC, recompensas,
              notificaciones y Wallet en una experiencia simple para el cliente
              y fácil de administrar para el negocio.
            </p>
            <div className="actions">
              <Link className="button primary" href="/join/porras">Probar experiencia cliente</Link>
              <Link className="button" href="/login">Abrir panel</Link>
            </div>
            <div className="hero-proof">
              <span><i /> Sin app obligatoria</span>
              <span><i /> Funciona desde navegador</span>
              <span><i /> Datos separados por negocio</span>
            </div>
          </div>

          <div className="product-mockup" aria-label="Vista previa de tarjeta digital">
            <div className="phone-shell">
              <div className="phone-inner">
                <div className="phone-top"><span>TARJETA DIGITAL</span><span>•••</span></div>
                <div className="phone-business">
                  <small>PROGRAMA DE FIDELIDAD</small>
                  <h3>Barbería Porras</h3>
                  <div className="phone-stamps">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <span className={index < 7 ? "on" : ""} key={index}>{index + 1}</span>
                    ))}
                  </div>
                  <div className="phone-reward">
                    <span>Tu progreso</span>
                    <strong>7 / 10 sellos</strong>
                    <small>Premio: Corte gratis</small>
                  </div>
                  <div className="wallet-row">
                    <div className="wallet-chip">Apple Wallet</div>
                    <div className="wallet-chip">Google Wallet</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mockup-float">
              <strong>🔔 Nuevo sello</strong>
              <span>Tu tarjeta se actualizó. Ahora tenés 7 de 10 sellos.</span>
            </div>
          </div>
        </section>

        <section id="funciones" className="marketing-section">
          <div className="section-heading">
            <span className="eyebrow">TODO EN UN SOLO SISTEMA</span>
            <h2>Más que una tarjeta de sellos.</h2>
            <p>La experiencia pública y la operación interna viven en la misma plataforma.</p>
          </div>
          <div className="feature-grid">
            {features.map(([icon, title, description]) => (
              <article className="feature-card" key={title}>
                <div className="feature-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="marketing-section">
          <div className="section-heading">
            <span className="eyebrow">EXPERIENCIA SIMPLE</span>
            <h2>Del primer escaneo al premio.</h2>
            <p>Sin tarjetas físicas que se pierden y sin pedirle al cliente que descargue una aplicación para empezar.</p>
          </div>
          <div className="flow-grid">
            {flow.map(([title, description]) => (
              <article className="flow-card" key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section">
          <div className="platform-band">
            <div>
              <span className="eyebrow">CRECE CON EL NEGOCIO</span>
              <h3>Una base lista para operar y seguir ampliando.</h3>
              <p>
                Control de empleados, historial de movimientos, seguridad por roles,
                tarjetas públicas, Web Push y soporte para Wallet forman parte de la misma arquitectura.
              </p>
            </div>
            <div className="platform-pills">
              <span>QR</span><span>NFC</span><span>Wallet</span><span>Push</span><span>Multi-tenant</span>
            </div>
          </div>
        </section>

        <section className="marketing-cta">
          <div>
            <h2>La fidelidad debería sentirse fácil.</h2>
            <p>Probá la experiencia de cliente o entrá al panel para administrar el programa.</p>
          </div>
          <div className="actions">
            <Link className="button primary" href="/join/porras">Ver demo</Link>
            <Link className="button" href="/login">Entrar al panel</Link>
          </div>
        </section>
      </div>

      <footer className="site-footer">
        <div className="marketing-wrap footer-inner">
          <span>© {new Date().getFullYear()} Orbítica Studio · Orbítica Loyalty</span>
          <div className="footer-links">
            <Link href="/support">Soporte</Link>
            <Link href="/login">Panel</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
