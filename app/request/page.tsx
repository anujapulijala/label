'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RequestPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [event, setEvent] = useState('');
  const [color, setColor] = useState('');
  const [look, setLook] = useState('');
  const [material, setMaterial] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/requests/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, color, look, material })
    });
    if (res.ok) {
      setMsg('Request submitted. I will get back to you soon!');
      setEvent(''); setColor(''); setLook(''); setMaterial('');
    } else {
      setMsg('Failed to submit request.');
    }
  }

  return (
    <div className="card" style={{ maxWidth: 620, margin: '0 auto' }}>
      <h2>New Design Request</h2>
      {!me && <div className="muted" style={{ marginBottom: 12 }}>Please login to submit a request.</div>}
      <form onSubmit={submit}>
        <label>Event</label>
        <input value={event} onChange={e => setEvent(e.target.value)} placeholder="Wedding, party, formal..." required />
        <label>Color (optional)</label>
        <input value={color} onChange={e => setColor(e.target.value)} placeholder="e.g., red, gold, black" />
        <label>Material (optional)</label>
        <input value={material} onChange={e => setMaterial(e.target.value)} placeholder="e.g., silk, chiffon, organza" />
        <label>Look / Style</label>
        <input value={look} onChange={e => setLook(e.target.value)} placeholder="e.g., elegant, modern, princess" required />
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={!me}>Submit Request</button>
        </div>
      </form>
      {msg && <div style={{ marginTop: 12 }}>{msg}</div>}
    </div>
  );
}


