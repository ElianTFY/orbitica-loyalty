import Link from "next/link";

const capabilities = [
  ["01", "Entrada", "QR + NFC", "Un solo gesto abre el programa correcto del negocio, sin descargar una app."],
  ["02", "Identidad", "Tarjeta viva", "Cada cliente recibe una tarjeta propia con saldo, premio, código y Wallet."],
  ["03", "Operación", "Panel en tiempo real", "El equipo acredita sellos, canjea premios y consulta actividad desde un solo lugar."],
  ["04", "Retención", "Push + Wallet", "Los cambios pueden reflejarse en el teléfono y activar recordatorios relevantes."],
];

export default function Home() {
  return (
    <main className="orb-page">
      <header className="orb-nav">
        <div className="orb-wrap orb-nav-inner">
          <Link href="/" className="orb-wordmark" aria-label="Orbítica Loyalty">
            <span className="orb-symbol"><i /><b /></span>
            <span><strong>ORBÍTICA</strong><small>LOYALTY SYSTEM</small></span>
          </Link>
          <div className="orb-nav-center">
            <a href="#sistema">Sistema</a>
            <a href="#operacion">Operación</a>
            <Link href="/support">Soporte</Link>
          </div>
          <div className="orb-nav-actions">
            <Link className="orb-link" href="/join/porras">Demo ↗</Link>
            <Link className="orb-button" href="/login">Entrar al panel</Link>
          </div>
        </div>
      </header>

      <div className="orb-wrap">
        <section className="orb-hero">
          <div className="orb-hero-copy">
            <div className="orb-kicker"><span>01 / FIDELIZACIÓN</span><i /></div>
            <h1>La relación con tu cliente no debería terminar cuando sale del local.</h1>
            <p>
              Orbítica convierte cada visita en una señal: registro, sello, recompensa,
              recordatorio y regreso. Todo bajo la identidad de cada negocio.
            </p>
            <div className="orb-hero-actions">
              <Link className="orb-button strong" href="/join/porras">Ver experiencia real</Link>
              <Link className="orb-text-action" href="/login">Explorar panel <span>↗</span></Link>
            </div>
            <div className="orb-metrics">
              <div><span>Entrada</span><strong>QR / NFC</strong></div>
              <div><span>Retención</span><strong>Push / Wallet</strong></div>
              <div><span>Arquitectura</span><strong>Multi-negocio</strong></div>
            </div>
          </div>

          <div className="orb-console" aria-label="Vista de Orbítica Loyalty">
            <div className="console-top">
              <span className="console-id">ORBIT/CLIENT-017</span>
              <span className="console-status"><i /> EN LÍNEA</span>
            </div>
            <div className="console-grid">
              <div className="console-side">
                <span>NEGOCIO</span>
                <strong>PORRAS</strong>
                <small>BARBER SHOP</small>
              </div>
              <div className="console-card">
                <div className="console-card-head">
                  <div><small>PROGRAMA ACTIVO</small><h3>Cliente frecuente</h3></div>
                  <span className="console-chip">CR</span>
                </div>
                <div className="orbit-progress">
                  <div className="orbit-ring">
                    <span className="orbit-center"><strong>7</strong><small>DE 10</small></span>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <i key={i} className={i < 7 ? "done" : ""} style={{ "--i": i } as React.CSSProperties} />
                    ))}
                  </div>
                </div>
                <div className="console-reward"><span>PRÓXIMA RECOMPENSA</span><strong>Corte gratis</strong></div>
                <div className="console-footer"><span>Wallet listo</span><span>Push activo</span><b>•••</b></div>
              </div>
            </div>
            <div className="console-event">
              <span>10:24:18</span><b>+1 sello acreditado</b><small>Sincronización completada</small>
            </div>
          </div>
        </section>

        <section id="sistema" className="orb-section orb-system">
          <div className="orb-section-index">02</div>
          <div className="orb-section-intro">
            <span>SISTEMA</span>
            <h2>No es una página con una tarjeta bonita. Es una operación completa detrás.</h2>
          </div>
          <div className="capability-list">
            {capabilities.map(([n, eyebrow, title, text]) => (
              <article className="capability-row" key={n}>
                <span className="cap-number">{n}</span>
                <div className="cap-title"><small>{eyebrow}</small><h3>{title}</h3></div>
                <p>{text}</p>
                <span className="cap-arrow">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section id="operacion" className="orb-section orb-operation">
          <div className="orb-section-index">03</div>
          <div className="operation-grid">
            <div className="operation-copy">
              <span className="orb-overline">OPERACIÓN DIARIA</span>
              <h2>Diseñado para que el negocio lo use en segundos, no para que tenga que aprender un software.</h2>
              <p>Buscar cliente, acreditar, canjear, revisar actividad y continuar atendiendo.</p>
              <Link className="orb-text-action" href="/login">Abrir panel de operación <span>↗</span></Link>
            </div>
            <div className="operation-terminal">
              <div className="terminal-head"><span>CLIENTES / HOY</span><b>24 AGO · 10:27</b></div>
              <div className="terminal-search">⌕ &nbsp; Buscar nombre, teléfono o código</div>
              <div className="terminal-row active"><span>EP</span><div><strong>Erick P.</strong><small>8 / 10 sellos</small></div><button>+ SELLO</button></div>
              <div className="terminal-row"><span>MG</span><div><strong>María G.</strong><small>10 / 10 · premio listo</small></div><button>CANJEAR</button></div>
              <div className="terminal-row"><span>JR</span><div><strong>José R.</strong><small>3 / 10 sellos</small></div><button>+ SELLO</button></div>
              <div className="terminal-foot"><span>3 movimientos recientes</span><span>Todo sincronizado ✓</span></div>
            </div>
          </div>
        </section>

        <section className="orb-statement">
          <div className="statement-mark">O</div>
          <div>
            <span>ORBÍTICA / PRINCIPIO DE PRODUCTO</span>
            <h2>La tecnología desaparece. La experiencia del negocio queda.</h2>
          </div>
          <div className="statement-actions">
            <Link className="orb-button strong" href="/join/porras">Probar demo</Link>
            <Link className="orb-link" href="/support">Hablar con soporte ↗</Link>
          </div>
        </section>
      </div>

      <footer className="orb-footer">
        <div className="orb-wrap orb-footer-inner">
          <div className="orb-wordmark muted"><span className="orb-symbol"><i /><b /></span><span><strong>ORBÍTICA</strong><small>LOYALTY SYSTEM</small></span></div>
          <span>© {new Date().getFullYear()} Orbítica Studio</span>
          <div><Link href="/support">Soporte</Link><Link href="/login">Panel</Link></div>
        </div>
      </footer>
    </main>
  );
}
