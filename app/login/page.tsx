'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get('redirect') || '/gallery';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    if (res.ok) {
      window.location.href = redirectTo;
    } else {
      const j = await res.json();
      setError(j.error || 'Login failed');
    }
    setLoading(false);
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <label>Email or Username</label>
        <input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="you@example.com or yourusername" required />
        <label>Password</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        {error && <div className="muted" style={{ color: 'crimson', marginTop: 10 }}>{error}</div>}
        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </div>
      </form>
      <div style={{ marginTop: 12 }} className="muted">
        New here? <a href={`/signup?redirect=${encodeURIComponent(redirectTo)}`}>Create an account</a>
      </div>
    </div>
  );
}


