import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { VOTE_TYPES, BEST_DEMO_AWARDS, SPECIAL_AWARDS, type VoteTypeId } from '@/lib/constants';

// 检查投票是否开放
async function isVotingOpen(supabase: any): Promise<{ open: boolean; notice: string }> {
  // 从数据库获取配置
  const { data: config } = await supabase
    .from('site_config')
    .select('*')
    .in('key', ['voting_enabled', 'voting_notice']) as { data: any[]; error: any };
  
  // 解析配置
  const configMap: Record<string, string> = {};
  if (config && Array.isArray(config)) {
    config.forEach((item: any) => {
      configMap[item.key] = item.value || '';
    });
  }
  
  const enabled = configMap['voting_enabled'] === 'true';
  const notice = configMap['voting_notice'] || '投票暂未开始，敬请期待';
  
  return { open: enabled, notice };
}

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
  
  const { data: votes, error } = await supabase
    .from('votes')
    .select('*')
    .eq('voter_id', user.id) as { data: any[]; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ votes: votes || [] });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // 检查投票是否开放
  const votingCheck = await isVotingOpen(supabase);
  if (!votingCheck.open) {
    return NextResponse.json({ error: votingCheck.notice }, { status: 403 });
  }

  const { demo_id, vote_type } = await request.json();

  if (!demo_id || !vote_type) {
    return NextResponse.json({ error: '参数缺失' }, { status: 400 });
  }

  const voteConfig = VOTE_TYPES[vote_type as VoteTypeId];
  if (!voteConfig) {
    return NextResponse.json({ error: '无效的投票类型' }, { status: 400 });
  }

  // 验证 demo 存在
  const { data: demo, error: demoError } = await supabase
    .from('demos')
    .select('id, track, submitted_by')
    .eq('id', demo_id)
    .single() as { data: any; error: any };

  if (demoError || !demo) {
    return NextResponse.json({ error: 'Demo 不存在' }, { status: 404 });
  }

  // 最佳Demo奖需要验证赛道匹配
  if (vote_type in BEST_DEMO_AWARDS && voteConfig.track) {
    if (demo.track !== voteConfig.track) {
      return NextResponse.json({ error: '赛道不匹配' }, { status: 400 });
    }
  }

  // 检查投票数限制
  const { data: existingVotes, error: countError } = await supabase
    .from('votes')
    .select('id')
    .eq('voter_id', user.id)
    .eq('vote_type', vote_type) as { data: any[]; error: any };

  if (existingVotes && existingVotes.length >= voteConfig.maxVotes) {
    return NextResponse.json({ 
      error: `该奖项最多投 ${voteConfig.maxVotes} 票` 
    }, { status: 400 });
  }

  // 不能给自己的项目投票
  if (demo.submitted_by === user.id) {
    return NextResponse.json({ error: '不能给自己的项目投票' }, { status: 400 });
  }

  // 插入投票
  const voteData: any = {
    voter_id: user.id,
    demo_id,
    vote_type,
  };
  
  console.log('插入投票:', voteData);
  
  const { error: insertError } = await supabase
    .from('votes')
    .insert(voteData);

  if (insertError) {
    console.error('投票插入失败:', insertError);
    if (insertError.code === '23505') { // unique violation
      return NextResponse.json({ error: '已经投过这个项目了' }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { demo_id, vote_type } = await request.json();
  
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('voter_id', user.id)
    .eq('demo_id', demo_id)
    .eq('vote_type', vote_type);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
