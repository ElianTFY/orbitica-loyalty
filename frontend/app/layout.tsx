import "./globals.css";
import "./enhancements.css";
import "./identity-v2.css";
import "./ops-v2.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "Orbítica Loyalty",
    template: "%s | Orbítica Loyalty",
  },
  description: "Fidelización digital con QR, NFC, Wallet y notificaciones para negocios.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/brand/orbitica-mark.svg" },
  appleWebApp: {
    capable: true,
    title: "Orbítica",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#080a0f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
