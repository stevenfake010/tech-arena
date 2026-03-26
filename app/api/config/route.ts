import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// 获取当前登录用户
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

// 获取投票配置（公开接口）
export async function GET() {
  const supabase = getSupabaseAdmin();

  // 从数据库获取配置
  const { data: config, error } = await supabase
    .from('site_config')
    .select('*')
    .in('key', ['voting_enabled', 'voting_notice', 'submission_enabled']) as { data: any[]; error: any };

  // 表不存在的错误
  if (error && error.code === '42P01') {
    return NextResponse.json({
      isVotingOpen: false,
      isSubmissionOpen: true,
      notice: '投票系统未初始化',
      error: 'TABLE_NOT_FOUND',
    });
  }

  if (error) {
    console.error('Error fetching config:', error);
  }

  // 解析配置
  const configMap: Record<string, string> = {};
  if (config && Array.isArray(config)) {
    config.forEach((item: any) => {
      configMap[item.key] = item.value || '';
    });
  }

  const isVotingOpen = configMap['voting_enabled'] === 'true';
  const notice = configMap['voting_notice'] || (isVotingOpen ? '' : '投票暂未开始，敬请期待');
  // submission_enabled 默认为 true（未配置时视为开放）
  const isSubmissionOpen = configMap['submission_enabled'] !== 'false';

  return NextResponse.json({
    isVotingOpen,
    isSubmissionOpen,
    notice,
  });
}

// 更新投票配置（仅 admin）
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }
  
  const { enabled, notice, submissionEnabled } = await request.json();

  const supabase = getSupabaseAdmin();

  // 检查表是否存在
  const { error: checkError } = await supabase
    .from('site_config')
    .select('id')
    .limit(1);

  if (checkError && checkError.code === '42P01') {
    return NextResponse.json({
      error: '配置表不存在，请先点击"初始化配置"按钮',
      code: 'TABLE_NOT_FOUND'
    }, { status: 400 });
  }

  const updates: Array<{key: string; value: string}> = [];

  if (enabled !== undefined) {
    updates.push({ key: 'voting_enabled', value: enabled ? 'true' : 'false' });
  }

  if (notice !== undefined) {
    updates.push({ key: 'voting_notice', value: notice });
  }

  if (submissionEnabled !== undefined) {
    updates.push({ key: 'submission_enabled', value: submissionEnabled ? 'true' : 'false' });
  }
  
  // 批量 upsert
  for (const update of updates) {
    const { error } = await supabase
      .from('site_config')
      .upsert(
        { key: update.key, value: update.value, updated_at: new Date().toISOString() } as any,
        { onConflict: 'key' }
      );
    
    if (error) {
      console.error('Error updating config:', error);
      return NextResponse.json({ error: `更新失败: ${error.message}` }, { status: 500 });
    }
  }
  
  return NextResponse.json({ 
    success: true, 
    message: '配置已更新'
  });
}
