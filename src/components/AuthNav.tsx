 'use client';
 import React, { useEffect, useState } from 'react';
 import Link from 'next/link';
 
 export default function AuthNav() {
   const [user, setUser] = useState<any>(null);
   useEffect(() => {
     fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json()).then(d => setUser(d.user));
   }, []);
 
   async function logout() {
     await fetch('/api/auth/logout', { method: 'POST' });
     window.location.href = '/';
   }
 
   if (!user) {
     return (
       <>
         <Link href="/login" style={{ marginRight: 12 }}>Login</Link>
         <Link href="/signup">Sign up</Link>
       </>
     );
   }
   const display = user.username || user.name || user.email;
   const initials = String(display || '?').trim().split(/\s+/).map((p: string) => p[0]).slice(0,2).join('').toUpperCase();
   return (
     <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
       {user.isAdmin && <Link href="/admin" className="muted" style={{ marginRight: 8 }}>Admin</Link>}
       <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', border: '1px solid #eee', borderRadius: 999 }}>
         <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
           {initials}
         </div>
         <span style={{ fontSize: 14 }}>{display}</span>
       </div>
       <button onClick={logout} style={{ background: '#f3f4f6', color: '#333' }}>Logout</button>
     </div>
   );
 }
 

