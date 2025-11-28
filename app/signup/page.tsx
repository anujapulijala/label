'use client';
import React, { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

function SignupContent() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get('redirect') || '/gallery';
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, email, password })
    });
    if (res.status === 409) {
      // Show popup and offer to go to Login
      const go = typeof window !== 'undefined' && window.confirm('An account with this email/username already exists. Go to Login?');
      if (go) {
        window.location.href = `/login?redirect=${encodeURIComponent(redirectTo)}`;
        return;
      } else {
        setError('Email or username already registered');
      }
      setLoading(false);
      return;
    }
    if (res.ok) {
      window.location.href = redirectTo;
    } else {
      const j = await res.json();
      setError(j.error || 'Signup failed');
    }
    setLoading(false);
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Sign up</h2>
      <form onSubmit={onSubmit}>
        <label>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} required />
        <label>Username</label>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="yourusername" required />
        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        <label>Password</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        {error && <div className="muted" style={{ color: 'crimson', marginTop: 10 }}>{error}</div>}
        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        </div>
      </form>
      <div style={{ marginTop: 12 }} className="muted">
        Already have an account? <a href={`/login?redirect=${encodeURIComponent(redirectTo)}`}>Login</a>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="card" style={{ maxWidth: 420, margin: '40px auto' }}>Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}


