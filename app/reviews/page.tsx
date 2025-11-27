'use client';
import React, { useEffect, useState } from 'react';

type Review = { id: number; user_id: number; text: string; filename?: string; created_at: string; name?: string; username?: string };

export default function ReviewsPage() {
  const [me, setMe] = useState<any>(null);
  const [items, setItems] = useState<Review[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  function load() {
    fetch('/api/reviews/list').then(r => r.json()).then(d => setItems(d.items || []));
  }
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user));
    load();
  }, []);
  async function submit() {
    if (!text.trim() && !file) return;
    const fd = new FormData();
    fd.append('text', text);
    if (file) fd.append('file', file);
    const r = await fetch('/api/reviews/add', { method: 'POST', body: fd });
    if (r.ok) {
      setText('');
      setFile(null);
      load();
    }
  }
  return (
    <div>
      <h2>Client Reviews</h2>
      {(me) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Share your experience..." style={{ width: '100%' }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
            <button onClick={submit}>Post Review</button>
          </div>
        </div>
      )}
      <div className="grid">
        {items.map(rv => (
          <div key={rv.id} className="card">
            <div className="muted" style={{ fontSize: 12 }}>{rv.username || rv.name}</div>
            <div style={{ marginTop: 6 }}>{rv.text}</div>
            {rv.filename && <img src={`/api/uploads?type=review&name=${encodeURIComponent(rv.filename)}`} alt="review" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />}
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{new Date(rv.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


