import "./site.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Matter: plano de cargos e salários",
  description: "Cargos, faixas salariais e trilhas de carreira da Matter",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
