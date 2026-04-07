import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { name } = await request.json();
  
  if (!name) {
    return NextResponse.json({ error: '请输入姓名' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, department, role')
    .eq('name', name)
    .single() as { data: { id: number; name: string; department: string; role: string } | null; error: any };

  if (error || !user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  // 设置 cookie
  const cookieStore = await cookies();
  cookieStore.set('demo_day_user', String(user.id), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return NextResponse.json({ user });
}
