import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { PRELIM_CONFIG_KEYS, parsePrelimConfig } from '@/lib/constants';

async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('demo_day_user')?.value;
  if (!userId) return null;

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from('users')
    .select('id, name, role')
    .eq('id', parseInt(userId))
    .single() as { data: any; error: any };

  return user;
}

// GET /api/preliminary/results — 聚合海选结果（仅限有权限角色）
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // 读取配置
  const { data: config } = await supabase
    .from('site_config')
    .select('*')
    .in('key', PRELIM_CONFIG_KEYS) as { data: any[]; error: any };

  const configMap: Record<string, string> = {};
  if (config && Array.isArray(config)) {
    config.forEach((item: any) => { configMap[item.key] = item.value || ''; });
  }

  const parsed = parsePrelimConfig(configMap, user.role);
  if (!parsed.canViewResults) {
    return NextResponse.json({ error: '无权查看结果' }, { status: 403 });
  }

  // 聚合票数
  const { data: voteCounts, error: countError } = await supabase
    .from('preliminary_votes')
    .select('demo_id')
    .eq('submitted', true) as { data: any[]; error: any };

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  // 在应用层聚合（Supabase JS client 不直接支持 GROUP BY）
  const countMap: Record<number, number> = {};
  (voteCounts || []).forEach((row: any) => {
    countMap[row.demo_id] = (countMap[row.demo_id] || 0) + 1;
  });

  if (Object.keys(countMap).length === 0) {
    return NextResponse.json({ results: [], totalVoters: 0 });
  }

  // 获取 demo 详情
  const demoIds = Object.keys(countMap).map(Number);
  const { data: demos, error: demosError } = await supabase
    .from('demos')
    .select('id, name, track, submitter1_name, submitter1_dept, submitter2_name, submitter2_dept')
    .in('id', demoIds) as { data: any[]; error: any };

  if (demosError) {
    return NextResponse.json({ error: demosError.message }, { status: 500 });
  }

  // 获取总投票人数（已提交的不重复 voter_id 数量）
  const { data: voterRows } = await supabase
    .from('preliminary_votes')
    .select('voter_id')
    .eq('submitted', true) as { data: any[]; error: any };

  const totalVoters = new Set((voterRows || []).map((r: any) => r.voter_id)).size;

  const results = (demos || [])
    .map((demo: any) => ({
      demo_id: demo.id,
      name: demo.name,
      track: demo.track,
      submitter1_name: demo.submitter1_name,
      submitter1_dept: demo.submitter1_dept,
      submitter2_name: demo.submitter2_name || null,
      submitter2_dept: demo.submitter2_dept || null,
      vote_count: countMap[demo.id] || 0,
    }))
    .sort((a: any, b: any) => b.vote_count - a.vote_count);

  return NextResponse.json({ results, totalVoters });
}
