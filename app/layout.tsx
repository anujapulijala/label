import React from 'react';
import './globals.css';
import Header from '@/src/components/Header';

export const metadata = {
  title: 'Anuja Pulijala',
  description: 'Custom fashion sketches and couture requests'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>{children}</main>
      </body>
    </html>
  );
}


