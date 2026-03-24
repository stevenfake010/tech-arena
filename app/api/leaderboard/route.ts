import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { PRO_JUDGE_WEIGHT, NORMAL_WEIGHT } from '@/lib/constants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const voteType = searchParams.get('vote_type') || 'best_optimizer';

  const supabase = getSupabaseAdmin();

  // 获取指定 track 的所有 demos
  const track = voteType === 'best_optimizer' ? 'optimizer' : 'builder';
  
  const { data: demos, error } = await supabase
    .from('demos')
    .select('*')
    .eq('track', track);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 获取这些 demos 的投票
  const demoIds = demos?.map(d => d.id) || [];
  
  if (demoIds.length === 0) {
    return NextResponse.json({ leaderboard: [] });
  }

  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select(`
      demo_id,
      vote_type,
      voter:voter_id(id, role)
    `)
    .eq('vote_type', voteType)
    .in('demo_id', demoIds);

  if (votesError) {
    return NextResponse.json({ error: votesError.message }, { status: 500 });
  }

  // 计算分数
  const scores: Record<number, { score: number; vote_count: number }> = {};
  
  for (const vote of (votes || [])) {
    const demoId = vote.demo_id;
    if (!scores[demoId]) {
      scores[demoId] = { score: 0, vote_count: 0 };
    }
    const weight = (vote.voter as any)?.role === 'pro_judge' ? PRO_JUDGE_WEIGHT : NORMAL_WEIGHT;
    scores[demoId].score += weight;
    scores[demoId].vote_count += 1;
  }

  // 组装 leaderboard
  const leaderboard = (demos || []).map(demo => ({
    id: demo.id,
    name: demo.name,
    summary: demo.summary,
    track: demo.track,
    submitter1_name: demo.submitter1_name,
    submitter1_dept: demo.submitter1_dept,
    submitter2_name: demo.submitter2_name,
    score: scores[demo.id]?.score || 0,
    vote_count: scores[demo.id]?.vote_count || 0,
  }));

  // 按分数排序
  leaderboard.sort((a, b) => b.score - a.score);

  return NextResponse.json({ leaderboard });
}
