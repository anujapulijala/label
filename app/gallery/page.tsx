'use client';
import React, { useEffect, useState } from 'react';

type Design = { name: string; filename: string; url: string };

export default function GalleryPage() {
  const [items, setItems] = useState<Design[]>([]);
  useEffect(() => {
    fetch('/api/designs/list').then(r => r.json()).then(d => setItems(d.items || []));
  }, []);
  return (
    <div>
      <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 18 }}>
        <div
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1503342452485-86ff0a9d7c2e?q=80&w=1600&auto=format&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: 220,
            position: 'relative'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.55))' }} />
          <div style={{ position: 'absolute', bottom: 16, left: 16, color: 'white' }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>Signature Fashion Sketches</div>
            <div style={{ opacity: 0.8 }}>Hand-drawn concepts brought to life for your events</div>
          </div>
        </div>
      </div>
      <div className="grid" style={{ marginTop: 16 }}>
        {items.map(d => (
          <div className="card" key={d.filename}>
            <img src={d.url} alt={d.name} style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ marginTop: 8, fontWeight: 600 }}>{d.name}</div>
          </div>
        ))}
      </div>
      {items.length === 0 && <div className="muted">No designs found in the designs folder.</div>}
    </div>
  );
}


