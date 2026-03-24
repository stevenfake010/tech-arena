import { cookies } from 'next/headers';
import { getSupabaseAdmin } from './supabase';

const COOKIE_NAME = 'demo_day_user';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  const userId = parseInt(cookie.value, 10);
  if (isNaN(userId)) return null;

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
    value: String(userId),
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
}

export const COOKIE_KEY = COOKIE_NAME;
