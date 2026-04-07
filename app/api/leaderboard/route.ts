import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { BEST_DEMO_AWARDS, SPECIAL_AWARDS } from '@/lib/constants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const voteType = searchParams.get('vote_type') || 'best_optimizer';

  const supabase = getSupabaseAdmin();

  // 判断是最佳Demo奖还是专项奖
  const isBestDemo = voteType in BEST_DEMO_AWARDS;
  const isSpecial = voteType in SPECIAL_AWARDS;

  let demos: any[] = [];

  // 只查询 leaderboard 需要的字段，减少数据传输
  const selectFields = 'id, name, summary, track, submitter1_name, submitter1_dept, submitter2_name, submitter2_dept, keywords, submitted_by';

  if (isBestDemo) {
    // 最佳Demo奖：只获取对应赛道的项目
    const track = BEST_DEMO_AWARDS[voteType as keyof typeof BEST_DEMO_AWARDS].track;
    const { data, error } = await supabase
      .from('demos')
      .select(selectFields)
      .eq('track', track) as { data: any[]; error: any };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    demos = data || [];
  } else if (isSpecial) {
    // 专项奖：获取所有项目（不分赛道）
    const { data, error } = await supabase
      .from('demos')
      .select(selectFields) as { data: any[]; error: any };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    demos = data || [];
  } else {
    return NextResponse.json({ error: '无效的投票类型' }, { status: 400 });
  }

  if (demos.length === 0) {
    return NextResponse.json({ leaderboard: [] });
  }

  // 获取这些 demos 的投票
  const demoIds = demos.map(d => d.id);
  
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('demo_id')
    .eq('vote_type', voteType)
    .in('demo_id', demoIds) as { data: any[]; error: any };

  if (votesError) {
    return NextResponse.json({ error: votesError.message }, { status: 500 });
  }

  // 计算分数（每票均等权重 1）
  const scores: Record<number, { score: number; vote_count: number }> = {};

  for (const vote of (votes || [])) {
    const demoId = vote.demo_id;
    if (!scores[demoId]) {
      scores[demoId] = { score: 0, vote_count: 0 };
    }
    scores[demoId].score += 1;
    scores[demoId].vote_count += 1;
  }

  // 读取管理员加票配置
  const { data: bonusConfig } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'bonus_votes')
    .maybeSingle() as { data: { value: string } | null };

  if (bonusConfig?.value) {
    try {
      const bonusVotes: Array<{ demo_id: number; vote_type: string; bonus: number }> = JSON.parse(bonusConfig.value);
      for (const bv of bonusVotes) {
        if (bv.vote_type === voteType && demoIds.includes(bv.demo_id) && bv.bonus > 0) {
          if (!scores[bv.demo_id]) {
            scores[bv.demo_id] = { score: 0, vote_count: 0 };
          }
          scores[bv.demo_id].score += bv.bonus;
        }
      }
    } catch {}
  }

  // 组装 leaderboard
  const leaderboard = demos.map(demo => ({
    id: demo.id,
    name: demo.name,
    summary: demo.summary,
    track: demo.track,
    submitter1_name: demo.submitter1_name,
    submitter1_dept: demo.submitter1_dept,
    submitter2_name: demo.submitter2_name,
    submitter2_dept: demo.submitter2_dept,
    keywords: demo.keywords,
    submitted_by: demo.submitted_by,
    score: scores[demo.id]?.score || 0,
    vote_count: scores[demo.id]?.vote_count || 0,
  }));

  // 按拼音排序（前端会根据投票状态重新排序）
  leaderboard.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

  return NextResponse.json(
    { leaderboard },
    {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
      },
    }
  );
}
