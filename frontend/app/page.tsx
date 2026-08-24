import Link from "next/link";
import Brand from "@/components/Brand";

const systems = [
  ["01", "Entrada", "QR y NFC convierten cualquier mostrador, mesa o empaque en un punto de entrada al programa."],
  ["02", "Identidad", "Cada cliente obtiene una tarjeta única, con progreso, código y acceso desde el teléfono."],
  ["03", "Operación", "El negocio acredita sellos, canjes y movimientos desde un panel con roles y trazabilidad."],
  ["04", "Retorno", "Wallet y notificaciones mantienen el programa visible incluso después de que el cliente se va."],
];

const useCases = [
  ["Barberías", "Visitas recurrentes, premio por frecuencia y registro rápido desde el mostrador."],
  ["Cafeterías", "Acumulación simple por compra, campañas y una experiencia sin app obligatoria."],
  ["Retail", "Programas por categoría, recompensas y una tarjeta de marca que vive en el teléfono."],
];

export default function Home() {
  return (
    <main className="o-site">
      <header className="o-nav">
        <div className="o-wrap o-nav-inner">
          <Brand product="Loyalty" />
          <nav className="o-nav-links" aria-label="Navegación principal">
            <a href="#sistema">Sistema</a>
            <a href="#casos">Casos</a>
            <Link href="/support">Soporte</Link>
          </nav>
          <div className="o-nav-actions">
            <Link className="o-text-link" href="/join/porras">Demo cliente</Link>
            <Link className="o-button" href="/login">Entrar al panel</Link>
          </div>
        </div>
      </header>

      <div className="o-wrap">
        <section className="o-hero">
          <div className="o-hero-copy">
            <div className="o-kicker"><span>ORBÍTICA LOYALTY</span><i /> SISTEMA DE RETENCIÓN</div>
            <h1>Una experiencia de fidelidad que se siente como parte de tu marca.</h1>
            <p>
              Tarjetas digitales, QR, NFC, Wallet y notificaciones conectadas en una sola operación.
              Sin obligar al cliente a descargar una app y sin convertir el programa en otra tarea para el negocio.
            </p>
            <div className="o-hero-actions">
              <Link className="o-button o-button-primary" href="/join/porras">Probar la experiencia</Link>
              <Link className="o-button o-button-ghost" href="/login">Ver el panel</Link>
            </div>
            <div className="o-hero-meta">
              <span>Multi-negocio</span>
              <span>Web Push</span>
              <span>Apple / Google Wallet</span>
              <span>QR + NFC</span>
            </div>
          </div>

          <div className="o-orbit-stage" aria-label="Vista del producto">
            <div className="o-orbit-ring o-ring-one" />
            <div className="o-orbit-ring o-ring-two" />
            <div className="o-orbit-ring o-ring-three" />
            <div className="o-stage-card">
              <div className="o-stage-head">
                <span className="o-live-dot">LIVE</span>
                <small>CLIENT PROFILE / 00041</small>
              </div>
              <div className="o-stage-business">Barbería Porras</div>
              <div className="o-stage-progress">
                <div><span>PROGRESO</span><strong>07</strong><small>/ 10</small></div>
                <div><span>PREMIO</span><strong>Corte gratis</strong></div>
              </div>
              <div className="o-stage-stamps">
                {Array.from({ length: 10 }).map((_, index) => <span className={index < 7 ? "on" : ""} key={index}>{String(index + 1).padStart(2, "0")}</span>)}
              </div>
              <div className="o-stage-footer"><span>Última actividad</span><strong>+1 sello · hace 2 min</strong></div>
            </div>
            <div className="o-stage-note note-a"><span>01</span><strong>QR / NFC</strong><small>punto de entrada</small></div>
            <div className="o-stage-note note-b"><span>02</span><strong>Wallet</strong><small>presencia persistente</small></div>
            <div className="o-stage-note note-c"><span>03</span><strong>Push</strong><small>reactivación</small></div>
          </div>
        </section>

        <section className="o-statement">
          <div className="o-statement-index">/01</div>
          <div>
            <p className="o-statement-big">La fidelidad no debería verse como una promoción pegada encima del negocio.</p>
            <p className="o-statement-small">Orbítica conecta la experiencia del cliente con la operación interna para que el programa se sienta propio, medible y fácil de mantener.</p>
          </div>
        </section>

        <section id="sistema" className="o-section">
          <div className="o-section-head">
            <div><span className="o-section-number">/02</span><h2>Un sistema, cuatro momentos.</h2></div>
            <p>Diseñado alrededor del recorrido real del cliente: entrar, identificarse, acumular y volver.</p>
          </div>
          <div className="o-system-list">
            {systems.map(([number, title, description]) => (
              <article className="o-system-row" key={number}>
                <span>{number}</span><h3>{title}</h3><p>{description}</p><i>↗</i>
              </article>
            ))}
          </div>
        </section>

        <section className="o-product-frame">
          <div className="o-product-topline"><span>ORBÍTICA CONTROL ROOM</span><span>PRODUCTION</span><span>SECURE SESSION</span></div>
          <div className="o-product-grid">
            <div className="o-product-panel major">
              <div className="o-product-label">ACTIVIDAD DEL PROGRAMA</div>
              <div className="o-product-chart">
                {[24, 34, 29, 52, 46, 72, 66, 82, 76, 94, 86, 100].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}
              </div>
              <div className="o-product-axis"><span>SEM 01</span><span>SEM 06</span><span>SEM 12</span></div>
            </div>
            <div className="o-product-panel"><div className="o-product-label">CLIENTES</div><strong className="o-metric">128</strong><small>+18 este mes</small></div>
            <div className="o-product-panel"><div className="o-product-label">CANJES</div><strong className="o-metric">23</strong><small>18.0% conversión</small></div>
            <div className="o-product-panel wide"><div className="o-product-label">CANAL ACTIVO</div><div className="o-channel-row"><span>QR</span><b>ONLINE</b><span>NFC</span><b>ONLINE</b><span>WALLET</span><b>READY</b><span>PUSH</span><b>READY</b></div></div>
          </div>
        </section>

        <section id="casos" className="o-section">
          <div className="o-section-head">
            <div><span className="o-section-number">/03</span><h2>Se adapta al negocio, no al revés.</h2></div>
            <p>La misma infraestructura puede sentirse completamente distinta según la marca y la lógica de recompensa.</p>
          </div>
          <div className="o-use-grid">
            {useCases.map(([title, description], index) => (
              <article className="o-use-case" key={title}>
                <span>0{index + 1}</span><h3>{title}</h3><p>{description}</p><div className="o-use-line" />
              </article>
            ))}
          </div>
        </section>

        <section className="o-final-cta">
          <div className="o-final-logo"><Brand product="Loyalty" compact /></div>
          <h2>Más retorno. Menos fricción.</h2>
          <p>Una infraestructura de fidelización lista para operar, medir y crecer con cada negocio.</p>
          <div className="o-hero-actions">
            <Link className="o-button o-button-primary" href="/join/porras">Ver demo</Link>
            <Link className="o-button o-button-ghost" href="/login">Entrar al panel</Link>
          </div>
        </section>
      </div>

      <footer className="o-footer"><div className="o-wrap"><span>Orbítica Studio © {new Date().getFullYear()}</span><div><Link href="/support">Soporte</Link><Link href="/login">Panel</Link></div></div></footer>
    </main>
  );
}
