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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// POST /api/preliminary/seed — 生成海选测试投票数据（仅管理员）
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  // 获取海选配置
  const { data: configRows } = await supabase
    .from('site_config')
    .select('*')
    .in('key', PRELIM_CONFIG_KEYS) as { data: any[]; error: any };

  const configMap: Record<string, string> = {};
  if (configRows && Array.isArray(configRows)) {
    configRows.forEach((item: any) => { configMap[item.key] = item.value || ''; });
  }
  const config = parsePrelimConfig(configMap);

  // 获取所有 demo
  const { data: demos, error: demosError } = await supabase
    .from('demos')
    .select('id, track, submitted_by') as { data: any[]; error: any };

  if (demosError || !demos || demos.length === 0) {
    return NextResponse.json({ error: '没有 Demo 项目，请先生成测试数据' }, { status: 400 });
  }

  // 获取所有普通用户（排除 admin）
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .neq('role', 'admin') as { data: any[]; error: any };

  if (usersError || !users || users.length === 0) {
    return NextResponse.json({ error: '没有可用的普通用户' }, { status: 400 });
  }

  // 检查已有的海选投票，排除已投票的用户
  const { data: existingVotes } = await supabase
    .from('preliminary_votes')
    .select('voter_id')
    .eq('submitted', true) as { data: any[]; error: any };

  const existingVoterIds = new Set((existingVotes || []).map((r: any) => r.voter_id));
  const availableUsers = users.filter((u: any) => !existingVoterIds.has(u.id));

  if (availableUsers.length === 0) {
    return NextResponse.json({ error: '所有用户都已投过票，请先清空海选投票再生成' }, { status: 400 });
  }

  const optimizerDemos = demos.filter((d: any) => d.track === 'optimizer');
  const builderDemos = demos.filter((d: any) => d.track === 'builder');

  let totalVoters = 0;
  let totalVotes = 0;
  const errors: string[] = [];

  for (const voter of availableUsers) {
    // 为每个用户随机选择 demo
    let selectedIds: number[];

    if (config.mode === 'A') {
      // 模式 A: 从所有 demo 中随机选 totalRequired 个（排除自己提交的）
      const eligible = demos.filter((d: any) => d.submitted_by !== voter.id);
      const count = Math.min(config.totalRequired, eligible.length);
      if (count === 0) continue;
      selectedIds = shuffle(eligible).slice(0, count).map((d: any) => d.id);
    } else {
      // 模式 B: 分赛道各选指定数量
      const eligibleOpt = optimizerDemos.filter((d: any) => d.submitted_by !== voter.id);
      const eligibleBld = builderDemos.filter((d: any) => d.submitted_by !== voter.id);
      const optCount = Math.min(config.optimizerRequired, eligibleOpt.length);
      const bldCount = Math.min(config.builderRequired, eligibleBld.length);
      if (optCount === 0 && bldCount === 0) continue;
      const optSelected = shuffle(eligibleOpt).slice(0, optCount).map((d: any) => d.id);
      const bldSelected = shuffle(eligibleBld).slice(0, bldCount).map((d: any) => d.id);
      selectedIds = [...optSelected, ...bldSelected];
    }

    if (selectedIds.length === 0) continue;

    const rows = selectedIds.map((demoId: number) => ({
      voter_id: voter.id,
      demo_id: demoId,
      submitted: true,
    }));

    const { error: insertError } = await supabase
      .from('preliminary_votes')
      .insert(rows as any);

    if (insertError) {
      errors.push(`用户 ${voter.id}: ${insertError.message}`);
    } else {
      totalVoters++;
      totalVotes += selectedIds.length;
    }
  }

  return NextResponse.json({
    success: true,
    message: `已为 ${totalVoters} 位用户生成 ${totalVotes} 条海选投票记录。${errors.length > 0 ? ` (${errors.length} 个错误)` : ''}`,
    totalVoters,
    totalVotes,
    errors: errors.length > 0 ? errors : undefined,
  });
}
