import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set('demo_day_user', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0, // 立即过期
  });
  
  return NextResponse.json({ success: true });
}
