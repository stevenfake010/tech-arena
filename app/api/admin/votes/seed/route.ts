import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { BEST_DEMO_AWARDS, SPECIAL_AWARDS } from '@/lib/constants';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('demo_day_user')?.value;
  if (!userId) return null;
  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', parseInt(userId))
    .single() as { data: any; error: any };
  return user?.role === 'admin' ? user : null;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function POST() {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: '无权访问' }, { status: 403 });

  const supabase = getSupabaseAdmin();

  // 获取所有 demos（按赛道分组）
  const { data: allDemos, error: demosError } = await supabase
    .from('demos')
    .select('id, track, submitted_by') as { data: any[]; error: any };

  if (demosError || !allDemos?.length) {
    return NextResponse.json({ error: '没有找到 Demo 项目，请先生成测试项目' }, { status: 400 });
  }

  const optimizerDemos = allDemos.filter(d => d.track === 'optimizer');
  const builderDemos   = allDemos.filter(d => d.track === 'builder');

  // 获取所有非 admin 用户
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .neq('role', 'admin') as { data: any[]; error: any };

  if (usersError || !users?.length) {
    return NextResponse.json({ error: '没有找到普通用户' }, { status: 400 });
  }

  // 获取已有投票（避免重复插入）
  const { data: existingVotes } = await supabase
    .from('votes')
    .select('voter_id, vote_type') as { data: any[]; error: any };

  // 已投票的 (voter_id + vote_type) 集合
  const alreadyVoted = new Set(
    (existingVotes || []).map((v: any) => `${v.voter_id}:${v.vote_type}`)
  );

  const VOTE_CONFIGS = [
    { voteType: 'best_optimizer', maxVotes: BEST_DEMO_AWARDS.best_optimizer.maxVotes, pool: optimizerDemos },
    { voteType: 'best_builder',   maxVotes: BEST_DEMO_AWARDS.best_builder.maxVotes,   pool: builderDemos   },
    { voteType: 'special_brain',       maxVotes: SPECIAL_AWARDS.special_brain.maxVotes,       pool: allDemos },
    { voteType: 'special_infectious',  maxVotes: SPECIAL_AWARDS.special_infectious.maxVotes,  pool: allDemos },
    { voteType: 'special_useful',      maxVotes: SPECIAL_AWARDS.special_useful.maxVotes,       pool: allDemos },
  ];

  const toInsert: { voter_id: number; demo_id: number; vote_type: string }[] = [];
  let skippedUsers = 0;

  for (const user of users) {
    for (const cfg of VOTE_CONFIGS) {
      // 已经投过这个奖项则跳过
      if (alreadyVoted.has(`${user.id}:${cfg.voteType}`)) {
        skippedUsers++;
        continue;
      }
      // 排除自己提交的项目
      const eligible = cfg.pool.filter((d: any) => d.submitted_by !== user.id);
      if (eligible.length === 0) continue;

      const picks = pickRandom(eligible, Math.min(cfg.maxVotes, eligible.length));
      for (const demo of picks) {
        toInsert.push({ voter_id: user.id, demo_id: demo.id, vote_type: cfg.voteType });
      }
    }
  }

  if (toInsert.length === 0) {
    return NextResponse.json({
      success: true,
      message: `所有用户已有投票记录，未生成新数据（跳过 ${skippedUsers} 条）`,
      inserted: 0,
    });
  }

  // 批量插入（忽略重复冲突）
  const BATCH = 200;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const { error } = await supabase
      .from('votes')
      .insert(toInsert.slice(i, i + BATCH) as any);
    if (!error) inserted += Math.min(BATCH, toInsert.length - i);
  }

  return NextResponse.json({
    success: true,
    message: `已为 ${users.length} 位用户生成测试投票，共插入 ${inserted} 条记录`,
    inserted,
  });
}
