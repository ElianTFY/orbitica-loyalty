import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { ToastContainer } from '@/components/ui/Toast';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ORBÍTICA LOYALTY — Plataforma SaaS de Fidelización Digital',
  description: 'Infraestructura SaaS multiempresa de fidelización digital con sellos, puntos, Apple Wallet, Google Wallet y Web Push.',
  icons: {
    icon: '/brand/orbitica-symbol.svg',
    shortcut: '/brand/favicon-32x32.png',
    apple: '/brand/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-[#0A0A0A] text-[#E5E6EA] font-sans antialiased min-h-screen flex flex-col">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
