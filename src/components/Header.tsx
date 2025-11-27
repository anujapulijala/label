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
  const [open, setOpen] = useState(false);
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
      <nav className="desktopNav" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
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
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="mobileMenuButton" aria-label="Open menu" onClick={() => setOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="#555" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <div className="authDesktop">
          <AuthNav />
        </div>
      </div>
      <div className={`drawerBackdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open} role="dialog" aria-label="Navigation">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className={playfair.className} style={{ fontWeight: 800 }}>Menu</div>
          <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ background: 'transparent', border: 'none' }}>
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6l-12 12" stroke="#555" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ display: 'grid' }}>
          <Link href="/gallery" onClick={() => setOpen(false)}>Gallery</Link>
          <Link href="/portfolio" onClick={() => setOpen(false)}>Portfolio</Link>
          <Link href="/reviews" onClick={() => setOpen(false)}>Reviews</Link>
          {me && me.isAdmin ? (
            <>
              <Link href="/admin/requests" onClick={() => setOpen(false)}>User Requests</Link>
              <Link href="/admin/designs" onClick={() => setOpen(false)}>Designs</Link>
            </>
          ) : me ? (
            <>
              <Link href="/request" onClick={() => setOpen(false)}>New Request</Link>
              <Link href="/my" onClick={() => setOpen(false)}>My Requests</Link>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
              <Link href="/signup" onClick={() => setOpen(false)}>Sign up</Link>
            </>
          )}
        </div>
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <AuthNav />
        </div>
      </aside>
    </header>
  );
}


