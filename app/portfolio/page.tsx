'use client';
import React, { useEffect, useState } from 'react';

type Item = { name: string; filename: string; url: string };

export default function PortfolioPage() {
  const [me, setMe] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [uploading, setUploading] = useState(false);
  function load() {
    fetch('/api/outfits/list').then(r => r.json()).then(d => setItems(d.items || []));
  }
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user));
    load();
  }, []);
  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    await fetch('/api/outfits/upload', { method: 'POST', body: fd });
    setUploading(false);
    load();
  }
  async function remove(filename: string) {
    await fetch('/api/outfits/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename })
    });
    load();
  }
  return (
    <div>
      <h2>Portfolio</h2>
      <p className="muted">Real outfits crafted for clients.</p>
      {me?.isAdmin && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ cursor: 'pointer', border: '1px dashed #bbb', borderRadius: 8, padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>+</span>
            <span>{uploading ? 'Uploading...' : 'Upload outfit photo'}</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }} />
          </label>
        </div>
      )}
      <div className="grid">
        {items.map(it => (
          <div key={it.filename} className="card">
            <img src={it.url} alt={it.name} style={{ width: '100%', height: 'clamp(160px, 28vh, 240px)', objectFit: 'cover', borderRadius: 8 }} />
            {me?.isAdmin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => remove(it.filename)} style={{ background: '#fef2f2', color: '#b91c1c' }}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


