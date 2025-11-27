'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthNav from '@/src/components/AuthNav';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['600','700','800'] });

export default function Header() {
  const pathname = usePathname();
  // undefined = loading, null = not logged in, object = logged in
  const [me, setMe] = useState<any | null | undefined>(undefined);
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json()).then(d => setMe(d.user ?? null));
  }, []);
  // Hide header completely on home, login and signup
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return null;
  }
  return (
    <header style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', gap: 16, alignItems: 'center', position: 'sticky', top: 0, background: 'linear-gradient(90deg,#fff, #faf7ff)', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="28" height="28" viewBox="0 0 48 48" aria-hidden="true">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8b5cf6"/>
              <stop offset="1" stopColor="#ec4899"/>
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="22" fill="url(#g1)" />
          <text x="24" y="29" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">AP</text>
        </svg>
        <div className={playfair.className} style={{ fontWeight: 800, letterSpacing: 0.5, fontSize: 18 }}>Anuja Pulijala</div>
      </div>
      <nav style={{ display: 'flex', gap: 14 }}>
        <Link href="/gallery">Gallery</Link>
        <Link href="/portfolio">Portfolio</Link>
        <Link href="/reviews">Reviews</Link>
        {me && me.isAdmin ? (
          <>
            <Link href="/admin/requests">User Requests</Link>
            <Link href="/admin/designs">Designs</Link>
          </>
        ) : me === undefined || me ? (
          <>
            <Link href="/request">New Request</Link>
            <Link href="/my">My Requests</Link>
          </>
        ) : null}
      </nav>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <AuthNav />
      </div>
    </header>
  );
}


