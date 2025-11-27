'use client';
import React, { useEffect, useState } from 'react';

type Design = { name: string; filename: string; url: string };

export default function AdminDesignsPage() {
  const [me, setMe] = useState<any>(null);
  const [items, setItems] = useState<Design[]>([]);
  const [uploading, setUploading] = useState(false);

  function load() {
    fetch('/api/designs/list').then(r => r.json()).then(d => setItems(d.items || []));
  }
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user));
    load();
  }, []);

  async function upload(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    await fetch('/api/designs/upload', { method: 'POST', body: form });
    setUploading(false);
    load();
  }
  async function remove(filename: string) {
    await fetch('/api/designs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename })
    });
    load();
  }

  if (!me) return <div className="muted">Please login.</div>;
  if (!me.isAdmin) return <div className="muted">Admin only.</div>;
  return (
    <div>
      <h2>Designs</h2>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ cursor: 'pointer', border: '1px dashed #bbb', borderRadius: 8, padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>+</span>
          <span>{uploading ? 'Uploading...' : 'Upload new design'}</span>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }} />
        </label>
      </div>
      <div className="grid">
        {items.map(d => (
          <div className="card" key={d.filename}>
            <img src={d.url} alt={d.name} style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ marginTop: 8, fontWeight: 600 }}>{d.name}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              {/* can only delete uploaded designs (not static in designs/) */}
              {d.url.startsWith('/api/uploads?type=design') && (
                <button onClick={() => remove(d.filename)} style={{ background: '#fef2f2', color: '#b91c1c' }}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


