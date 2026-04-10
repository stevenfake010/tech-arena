import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('demo_day_user')?.value;
  if (!userId) return null;
  
  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from('users')
    .select('id, name, department, role')
    .eq('id', parseInt(userId))
    .single() as { data: any; error: any };
  
  return user;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  
  // 获取我提交的 Demo（作为第一提交人）和我作为第二提交人的 Demo
  const { data: demos, error } = await supabase
    .from('demos')
    .select('*')
    .or(`submitter1_name.eq.${user.name},and(submitter2_name.eq.${user.name},submitter2_name.not.is.null)`)
    .order('created_at', { ascending: false }) as { data: any[]; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch submitter info explicitly
  const submitterIds = [...new Set((demos || []).map(d => d.submitted_by).filter(Boolean))];
  let submitters: Record<number, { name: string; department: string }> = {};
  if (submitterIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, department')
      .in('id', submitterIds) as { data: any[]; error: any };
    submitters = Object.fromEntries((users || []).map(u => [u.id, u]));
  }

  // 格式化数据
  const formattedDemos = demos?.map(d => ({
    ...d,
    submitter_name: submitters[d.submitted_by]?.name,
    submitter_department: submitters[d.submitted_by]?.department,
    // 判断当前用户是第几提交人
    isPrimarySubmitter: d.submitter1_name === user.name,
    isSecondarySubmitter: d.submitter2_name === user.name,
  })) || [];

  return NextResponse.json({ demos: formattedDemos });
}
