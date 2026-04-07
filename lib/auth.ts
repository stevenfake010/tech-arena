import { cookies } from 'next/headers';
import { createHmac } from 'crypto';
import { getSupabaseAdmin } from './supabase';

const COOKIE_NAME = 'demo_day_user';
const COOKIE_SECRET = process.env.COOKIE_SECRET || '';

/**
 * Sign a user ID with HMAC-SHA256 to prevent tampering.
 * Value format: "${userId}.${signature}"
 */
function signCookie(userId: number): string {
  const signature = createHmac('sha256', COOKIE_SECRET)
    .update(String(userId))
    .digest('hex');
  return `${userId}.${signature}`;
}

/**
 * Verify and extract user ID from a signed cookie value.
 * Returns null if cookie is missing, malformed, or signature mismatch.
 */
function verifyCookie(value: string): number | null {
  const lastDot = value.lastIndexOf('.');
  if (lastDot === -1) return null;
  const userIdPart = value.slice(0, lastDot);
  const signaturePart = value.slice(lastDot + 1);
  if (!userIdPart || !signaturePart) return null;

  const expectedSig = createHmac('sha256', COOKIE_SECRET)
    .update(userIdPart)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  if (signaturePart.length !== expectedSig.length) return null;
  let mismatch = 0;
  for (let i = 0; i < signaturePart.length; i++) {
    mismatch |= signaturePart.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  if (mismatch !== 0) return null;

  const userId = parseInt(userIdPart, 10);
  return isNaN(userId) ? null : userId;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  const userId = verifyCookie(cookie.value);
  if (userId === null) return null;

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from('users')
    .select('id, name, department, role')
    .eq('id', userId)
    .single();

  return user || null;
}

export function setUserCookie(userId: number) {
  return {
    name: COOKIE_NAME,
    value: signCookie(userId),
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
}

export const COOKIE_KEY = COOKIE_NAME;
