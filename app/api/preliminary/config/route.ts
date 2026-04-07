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
    .select('id, name, role')
    .eq('id', parseInt(userId))
    .single() as { data: any; error: any };

  return user;
}

// POST /api/preliminary/config — 管理员更新海选配置
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const body = await request.json();
  const { enabled, mode, totalRequired, optimizerCount, builderCount, resultsRoles, notice } = body;

  const updates: Array<{ key: string; value: string }> = [];

  if (enabled !== undefined) {
    updates.push({ key: 'preliminary_enabled', value: enabled ? 'true' : 'false' });
  }
  if (mode !== undefined) {
    updates.push({ key: 'preliminary_mode', value: mode === 'B' ? 'B' : 'A' });
  }
  if (totalRequired !== undefined) {
    updates.push({ key: 'preliminary_total', value: String(parseInt(totalRequired, 10) || 30) });
  }
  if (optimizerCount !== undefined) {
    updates.push({ key: 'preliminary_optimizer_count', value: String(parseInt(optimizerCount, 10) || 15) });
  }
  if (builderCount !== undefined) {
    updates.push({ key: 'preliminary_builder_count', value: String(parseInt(builderCount, 10) || 15) });
  }
  if (resultsRoles !== undefined) {
    const roles = Array.isArray(resultsRoles) ? resultsRoles.join(',') : String(resultsRoles);
    updates.push({ key: 'preliminary_results_roles', value: roles });
  }
  if (notice !== undefined) {
    updates.push({ key: 'preliminary_notice', value: String(notice) });
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: '没有提供要更新的字段' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  for (const update of updates) {
    const { error } = await supabase
      .from('site_config')
      .upsert(
        { key: update.key, value: update.value, updated_at: new Date().toISOString() } as any,
        { onConflict: 'key' }
      );

    if (error) {
      return NextResponse.json({ error: `更新失败: ${error.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, message: '海选配置已更新' });
}

// DELETE /api/preliminary/config — 清空所有海选投票记录（管理员专用）
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('preliminary_votes')
    .delete()
    .neq('id', 0); // delete all rows

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: '所有海选投票记录已清空' });
}
