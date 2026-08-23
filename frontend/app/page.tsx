import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">ORBÍTICA LOYALTY</span>
          <h1>Clientes que vuelven.<br />Recompensas que sí se usan.</h1>
          <p>
            Plataforma de fidelización para negocios con tarjetas digitales,
            QR y NFC.
          </p>
          <div className="actions">
            <Link className="button primary" href="/join/porras">Ver experiencia del cliente</Link>
            <Link className="button" href="/login">Entrar al panel</Link>
          </div>
        </div>
        <div className="hero-card-preview">
          <div className="preview-logo">OP</div>
          <small>TARJETA DIGITAL</small>
          <strong>Barbería Porras</strong>
          <div className="preview-stamps">
            {Array.from({ length: 10 }).map((_, i) => (
              <span className={i < 6 ? "filled" : ""} key={i}>{i + 1}</span>
            ))}
          </div>
          <div className="preview-bottom">
            <b>6/10 sellos</b>
            <span>Premio: Corte gratis</span>
          </div>
        </div>
      </section>
    </main>
  );
}
