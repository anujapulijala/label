'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Asset = { id: number; request_id: number; kind: 'sketch' | 'ai'; filename: string; created_at: string };
type Comment = { id: number; text: string; created_at: string; name?: string; username?: string };

export default function MyRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [item, setItem] = useState<any>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  async function load() {
    const r = await fetch(`/api/requests/get?id=${id}`);
    if (!r.ok) return;
    const d = await r.json();
    setItem(d.item);
    setAssets(d.assets || []);
    const cr = await fetch(`/api/requests/comments?id=${id}`);
    if (cr.ok) {
      const c = await cr.json();
      setComments(c.items || []);
    }
  }
  useEffect(() => {
    load();
  }, [id]);

  async function markProcessed() {
    setSaving(true);
    const r = await fetch('/api/requests/mark-processed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    setSaving(false);
    if (r.ok) load();
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

  if (!item) return <div className="muted">Loading...</div>;
  return (
    <div>
      <h2>Request #{item.id}</h2>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <div><b>Event:</b> {item.event || '-'}</div>
          <div><b>Color:</b> {item.colors || '-'}</div>
          <div><b>Material:</b> {item.material || '-'}</div>
          <div><b>Look:</b> {item.look || '-'}</div>
          <div><b>Status:</b> {item.status}</div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
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
      <div className="grid" style={{ marginBottom: 16 }}>
        {assets.map(a => (
          <img key={a.id} src={`/api/uploads?type=${a.kind === 'sketch' ? 'sketch' : 'ai'}&name=${encodeURIComponent(a.filename)}`} alt={a.kind} style={{ width: '100%', height: 'clamp(200px, 35vh, 320px)', objectFit: 'cover', borderRadius: 10 }} />
        ))}
      </div>
      <div>
        <button onClick={markProcessed} disabled={saving || item.status === 'processed'}>
          {item.status === 'processed' ? 'Processed' : (saving ? 'Saving...' : 'Satisfied')}
        </button>
      </div>
    </div>
  );
}


