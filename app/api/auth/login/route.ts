import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Find user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, department, role, password_hash, is_active')
    .eq('email', email.toLowerCase().trim())
    .single() as { data: { id: number; name: string; department: string; role: string; password_hash: string; is_active: boolean } | null; error: any };

  if (error || !user) {
    return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
  }

  // Check if account is active
  if (!user.is_active) {
    return NextResponse.json({ error: '账号待审核，请联系管理员' }, { status: 403 });
  }

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set('demo_day_user', String(user.id), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, department: user.department, role: user.role }
  });
}
