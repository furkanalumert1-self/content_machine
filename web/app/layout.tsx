import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'İçerik Makinesi',
  description: 'Callypso Engage için Reels üretim ve yayın paneli',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
