import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import fs from 'fs';
import path from 'path';
import { designsUploadDir } from '@/src/lib/uploads';

export default function Home() {
  const cookie = cookies().get('session_token');
  if (!cookie) {
    return <Landing />;
  }
  // best-effort decode; if fails, show landing
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me');
    jwtVerify(cookie.value, secret);
    return redirect('/gallery');
  } catch {
    return <Landing />;
  }
}

function Landing() {
  const designsDir = path.join(process.cwd(), 'designs');
  let logoUrl: string | null = null;
  try {
    // search order: uploads/designs, uploads root, designs folder, public/
    const candidates: Array<{ type: 'uploadDesign' | 'upload' | 'designs' | 'public' | 'logoDir' | 'designsLogo'; path: string; toUrl: (f: string) => string }> = [
      { type: 'logoDir', path: path.join(process.cwd(), 'logo'), toUrl: f => `/api/logo?file=${encodeURIComponent(f)}` },
      { type: 'designsLogo', path: path.join(designsDir, 'logo'), toUrl: f => `/api/designs/image?file=${encodeURIComponent(`logo/${f}`)}` },
      { type: 'uploadDesign', path: designsUploadDir, toUrl: f => `/api/uploads?type=design&name=${encodeURIComponent(f)}` },
      { type: 'upload', path: path.join(process.cwd(), 'uploads'), toUrl: f => `/api/uploads?type=design&name=${encodeURIComponent(f)}` },
      { type: 'designs', path: designsDir, toUrl: f => `/api/designs/image?file=${encodeURIComponent(f)}` },
      { type: 'public', path: path.join(process.cwd(), 'public'), toUrl: f => `/${f}` }
    ];
    for (const c of candidates) {
      try {
        const files = fs.readdirSync(c.path);
        const match = files.find(f => /^logo\.(png|jpg|jpeg|webp|svg)$/i.test(f));
        if (match) {
          logoUrl = c.toUrl(match);
          break;
        }
      } catch {}
    }
  } catch {}
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        {logoUrl && <img src={logoUrl} alt="logo" style={{ height: 280, objectFit: 'contain', mixBlendMode: 'multiply' as any }} />}
        <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6 }}>LAUNCHING SOON!</div>
        <div className="muted">Welcome to my page</div>
        <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
          <a href="/login" style={{ padding: '12px 18px', background: '#111', color: '#fff', borderRadius: 999, textDecoration: 'none' }}>Login</a>
          <a href="/signup" style={{ padding: '12px 18px', background: '#8b5cf6', color: '#fff', borderRadius: 999, textDecoration: 'none' }}>Sign up</a>
        </div>
      </div>
    </div>
  );
}


