import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me');
const COOKIE_NAME = 'session_token';

export type SessionPayload = {
  userId: number;
  email: string;
  username?: string;
  name: string;
  isAdmin: boolean;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const cookie = cookies().get(COOKIE_NAME);
  if (!cookie) return null;
  try {
    const { payload } = await jwtVerify(cookie.value, secret);
    return {
      userId: payload.userId as number,
      email: payload.email as string,
      name: payload.name as string,
      isAdmin: payload.isAdmin as boolean
    };
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
}


