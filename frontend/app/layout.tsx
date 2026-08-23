import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orbítica Loyalty",
  description: "Fidelización digital con QR y NFC",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
