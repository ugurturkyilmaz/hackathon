import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retroflow — Takım Retrospektif Platformu",
  description: "Ekiplerin retrospektif toplantılarını dijital olarak yönettiği MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
