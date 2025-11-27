'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type RequestItem = {
  id: number;
  user_id: number;
  event: string | null;
  colors: string | null;
  material: string | null;
  look: string | null;
  status: string;
  created_at: string;
  email?: string;
  name?: string;
};
type Asset = { id: number; request_id: number; kind: 'sketch' | 'ai'; filename: string; created_at: string };
type Comment = { id: number; text: string; created_at: string; name?: string; username?: string };

export default function AdminRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [me, setMe] = useState<any>(null);
  const [item, setItem] = useState<RequestItem | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [color, setColor] = useState('#8b5cf6');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  async function load() {
    const r = await fetch('/api/requests/list');
    if (!r.ok) return;
    const d = await r.json();
    const found = (d.items || []).find((x: any) => x.id === id) || null;
    setItem(found);
    setAssets((d.assets || []).filter((a: any) => a.request_id === id));
    const cr = await fetch(`/api/requests/comments?id=${id}`);
    if (cr.ok) {
      const c = await cr.json();
      setComments(c.items || []);
    }
  }
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user));
    load();
  }, [id]);

  async function uploadSketch(file: File) {
    const form = new FormData();
    form.append('requestId', String(id));
    form.append('file', file);
    const res = await fetch('/api/requests/upload-sketch', { method: 'POST', body: form });
    if (res.ok) load();
  }
  async function generateAi() {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id, primaryColor: color })
    });
    if (res.ok) load();
  }
  async function addComment() {
    if (!newComment.trim()) return;
    const r = await fetch('/api/requests/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id, text: newComment })
    });
    if (r.ok) {
      setNewComment('');
      load();
    }
  }

  if (!me) return <div className="muted">Please login.</div>;
  if (!me.isAdmin) return <div className="muted">Admin only.</div>;
  if (!item) return <div className="muted">Request not found.</div>;

  return (
    <div>
      <h2>Request #{item.id}</h2>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <div><b>Client:</b> {item.name} ({item.email})</div>
          <div><b>Event:</b> {item.event || '-'}</div>
          <div><b>Color:</b> {item.colors || '-'}</div>
          <div><b>Material:</b> {item.material || '-'}</div>
          <div><b>Look:</b> {item.look || '-'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ margin: 0 }}>Upload sketch</label>
        <label style={{ cursor: 'pointer', border: '1px dashed #bbb', borderRadius: 8, padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>+</span>
          <span>Add image</span>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
            const f = e.target.files?.[0];
            if (f) uploadSketch(f);
          }} />
        </label>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ margin: 0 }}>AI Color</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} />
          <button onClick={generateAi}>Generate AI</button>
        </div>
      </div>
      <div className="grid">
        {assets.map(a => (
          <img key={a.id} src={`/api/uploads?type=${a.kind === 'sketch' ? 'sketch' : 'ai'}&name=${encodeURIComponent(a.filename)}`} alt={a.kind} style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 8 }} />
        ))}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Comments</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." style={{ flex: 1 }} />
          <button onClick={addComment}>Send</button>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {comments.map(c => (
            <div key={c.id} className="card" style={{ padding: 10 }}>
              <div style={{ fontSize: 12 }} className="muted">{c.username || c.name}</div>
              <div>{c.text}</div>
              <div className="muted" style={{ fontSize: 12 }}>{new Date(c.created_at).toLocaleString()}</div>
            </div>
          ))}
          {comments.length === 0 && <div className="muted">No comments yet.</div>}
        </div>
      </div>
    </div>
  );
}


