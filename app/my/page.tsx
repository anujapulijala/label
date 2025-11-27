'use client';
import React, { useEffect, useState } from 'react';

type RequestItem = {
  id: number;
  event: string | null;
  colors: string | null;
  material: string | null;
  look: string | null;
  status: string;
  created_at: string;
};
type Asset = { id: number; request_id: number; kind: 'sketch' | 'ai'; filename: string; created_at: string };

export default function MyRequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  useEffect(() => {
    fetch('/api/requests/my').then(async r => {
      if (!r.ok) return;
      const d = await r.json();
      setItems(d.items || []);
      setAssets(d.assets || []);
    });
  }, []);
  const forReq = (id: number, kind?: 'sketch' | 'ai') =>
    assets.filter(a => a.request_id === id && (!kind || a.kind === kind));

  return (
    <div>
      <h2>My Requests</h2>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>ID</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>Request</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>Status</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>Admin Image</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const adminImg = forReq(item.id).find(a => a.kind === 'sketch' || a.kind === 'ai');
              return (
                <tr key={item.id}>
                  <td style={{ padding: 8 }}>#{item.id}</td>
                  <td style={{ padding: 8 }}>
                    <div><b>Event:</b> {item.event || '-'}</div>
                    <div><b>Color:</b> {item.colors || '-'}</div>
                    <div><b>Material:</b> {item.material || '-'}</div>
                    <div><b>Look:</b> {item.look || '-'}</div>
                  </td>
                  <td style={{ padding: 8, textTransform: 'capitalize' }}>{item.status}</td>
                  <td style={{ padding: 8 }}>
                    {adminImg ? (
                      <img src={`/api/uploads?type=${adminImg.kind === 'sketch' ? 'sketch' : 'ai'}&name=${encodeURIComponent(adminImg.filename)}`} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                    ) : <span className="muted">—</span>}
                  </td>
                  <td style={{ padding: 8 }}>
                    <a href={`/my/${item.id}`} style={{ textDecoration: 'none' }}>View</a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <div className="muted" style={{ marginTop: 12 }}>You have no requests yet.</div>}
    </div>
  );
}


