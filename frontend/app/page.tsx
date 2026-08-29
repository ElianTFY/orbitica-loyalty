import Link from 'next/link';
import BrandLogo from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-[#E5E6EA]">
      {/* Header */}
      <header className="border-b border-[#1A1B1F] bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <BrandLogo product="LOYALTY" size="md" />
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="primary" size="sm">
                Comenzar Gratis →
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="relative py-20 lg:py-28 overflow-hidden">
          {/* Subtle Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#0EA5FF]/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto px-6 text-center relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A1B1F] border border-[#27282D] text-xs font-semibold text-[#0EA5FF] mb-6">
              <span className="w-2 h-2 rounded-full bg-[#0EA5FF] animate-pulse" />
              SaaS de Fidelización Digital Multiempresa
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl font-display">
              Fidelizá a tus clientes con <span className="text-[#0EA5FF]">tarjetas digitales</span> en su celular
            </h1>

            <p className="text-base sm:text-lg text-[#8F9098] max-w-2xl mt-6 leading-relaxed">
              Eliminá las tarjetas de papel. Sellos, puntos, catálogo de recompensas, Apple Wallet, Google Wallet y notificaciones Web Push automáticas.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <Link href="/login">
                <Button variant="primary" size="lg">
                  Explorar Plataforma Demo →
                </Button>
              </Link>
              <Link href="/join/demo">
                <Button variant="secondary" size="lg">
                  Ver Experiencia de Cliente (Join)
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 border-t border-[#1A1B1F] bg-[#121316]/40">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#121316] border border-[#27282D]">
                <span className="text-3xl block mb-3">🎫</span>
                <h3 className="text-lg font-bold text-white mb-2">Sellos y Puntos Flexibles</h3>
                <p className="text-xs text-[#8F9098] leading-relaxed">
                  Configurá sellos por visita o puntos por monto de consumo. Múltiples recompensas con control de inventario.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#121316] border border-[#27282D]">
                <span className="text-3xl block mb-3">📱</span>
                <h3 className="text-lg font-bold text-white mb-2">Apple & Google Wallet</h3>
                <p className="text-xs text-[#8F9098] leading-relaxed">
                  Tus clientes pueden guardar su pase en la billetera nativa de su iPhone o Android sin descargar ninguna app.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#121316] border border-[#27282D]">
                <span className="text-3xl block mb-3">🔔</span>
                <h3 className="text-lg font-bold text-white mb-2">Web Push & Notificaciones</h3>
                <p className="text-xs text-[#8F9098] leading-relaxed">
                  Avisá a tus clientes cada vez que acumulan sellos o cuando desbloquean un premio listo para canjear.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A1B1F] py-8 text-center text-xs text-[#64656A]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo product="LOYALTY" size="sm" />
          <span>© 2026 Orbítica Studio. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
