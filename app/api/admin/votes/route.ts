import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// 验证是否是管理员
async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('demo_day_user')?.value;
  if (!userId) return null;

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from('users')
    .select('id, name, role')
    .eq('id', parseInt(userId))
    .single() as { data: any; error: any };

  if (!user || user.role !== 'admin') return null;
  return user;
}

// 清空所有投票记录
export async function DELETE() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  // 先查总数
  const { count } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true }) as { count: number | null };

  // 清空所有投票
  const { error } = await supabase
    .from('votes')
    .delete()
    .neq('id', 0); // 匹配所有行

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deleted: count ?? 0,
    message: `已清空所有投票记录，共 ${count ?? 0} 条`,
  });
}
