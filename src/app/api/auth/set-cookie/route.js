/**
 * Sets HttpOnly cookie pxi_paseto so Edge middleware can read and verify PASETO.
 * Call this after login/register/OAuth when the backend returns a token.
 */

import { NextResponse } from 'next/server';

const COOKIE_NAME = 'pxi_paseto';
const MAX_AGE = 60 * 60 * 24; // 1 day

export async function POST(request) {
  try {
    const body = await request.json();
    const token = body?.token;
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE,
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
