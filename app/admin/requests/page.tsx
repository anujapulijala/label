'use client';
import React, { useEffect, useState } from 'react';

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

export default function AdminRequestsPage() {
  const [me, setMe] = useState<any>(null);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [assets, setAssets] = useState<any[]>([]);

  function load() {
    fetch('/api/requests/list').then(async r => {
      if (!r.ok) return;
      const d = await r.json();
      setItems(d.items || []);
      setAssets(d.assets || []);
    });
  }
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user));
    load();
  }, []);

  async function uploadSketch(requestId: number, file: File) {
    const form = new FormData();
    form.append('requestId', String(requestId));
    form.append('file', file);
    const res = await fetch('/api/requests/upload-sketch', { method: 'POST', body: form });
    if (res.ok) load();
  }

  if (!me) return <div className="muted">Please login.</div>;
  if (!me.isAdmin) return <div className="muted">Admin only.</div>;
  return (
    <div>
      <h2>Requests</h2>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>ID</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>Client</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>Request</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>Status</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>Image</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>View</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <React.Fragment key={item.id}>
                <tr>
                  <td style={{ padding: 8 }}>
                    #{item.id}
                  </td>
                  <td style={{ padding: 8 }}>{item.name} ({item.email})</td>
                  <td style={{ padding: 8 }}>
                    <div><b>Event:</b> {item.event || '-'}</div>
                    <div><b>Color:</b> {item.colors || '-'}</div>
                    <div><b>Material:</b> {item.material || '-'}</div>
                    <div><b>Look:</b> {item.look || '-'}</div>
                  </td>
                  <td style={{ padding: 8, textTransform: 'capitalize' }}>{item.status}</td>
                  <td style={{ padding: 8 }}>
                    {(() => {
                      const img = (assets || []).find(a => a.request_id === item.id);
                      return img ? (
                        <img src={`/api/uploads?type=${img.kind === 'sketch' ? 'sketch' : 'ai'}&name=${encodeURIComponent(img.filename)}`} alt="preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                      ) : <span className="muted">—</span>;
                    })()}
                  </td>
                  <td style={{ padding: 8 }}>
                    <a href={`/admin/requests/${item.id}`} style={{ textDecoration: 'none' }}>View</a>
                  </td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                      {expanded === item.id ? 'Hide' : 'Upload'}
                    </button>
                  </td>
                </tr>
                {expanded === item.id && (
                  <tr>
                    <td colSpan={5} style={{ padding: 8, background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="file" accept="image/*" onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) uploadSketch(item.id, f);
                        }} />
                        <span className="muted">Upload a sketch to respond</span>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <div className="muted">No requests yet.</div>}
    </div>
  );
}


