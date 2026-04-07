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
    .select('id, name, department, role')
    .eq('id', parseInt(userId))
    .single() as { data: any; error: any };

  return user;
}

async function getPrelimConfig(supabase: any) {
  const { data: config } = await supabase
    .from('site_config')
    .select('*')
    .in('key', PRELIM_CONFIG_KEYS) as { data: any[]; error: any };

  const configMap: Record<string, string> = {};
  if (config && Array.isArray(config)) {
    config.forEach((item: any) => { configMap[item.key] = item.value || ''; });
  }
  return configMap;
}

// GET /api/preliminary — config + whether user has already submitted
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const configMap = await getPrelimConfig(supabase);
  const config = parsePrelimConfig(configMap, user.role);

  const { data: rows, error } = await supabase
    .from('preliminary_votes')
    .select('demo_id')
    .eq('voter_id', user.id)
    .eq('submitted', true) as { data: any[]; error: any };

  // Table not yet created
  if (error && (error.code === 'PGRST200' || error.code === '42P01')) {
    return NextResponse.json({ config, submitted: false, submittedIds: [], _tableNotFound: true });
  }

  const submittedIds = (rows || []).map((r: any) => r.demo_id);
  return NextResponse.json({ config, submitted: submittedIds.length > 0, submittedIds });
}

// POST /api/preliminary — batch submit all selections at once
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const configMap = await getPrelimConfig(supabase);
  const config = parsePrelimConfig(configMap, user.role);

  if (!config.enabled) {
    return NextResponse.json({ error: config.notice }, { status: 403 });
  }

  // Check already submitted
  const { data: existing, error: existingError } = await supabase
    .from('preliminary_votes')
    .select('id')
    .eq('voter_id', user.id)
    .eq('submitted', true)
    .limit(1) as { data: any[]; error: any };

  if (existingError && (existingError.code === 'PGRST200' || existingError.code === '42P01')) {
    return NextResponse.json({ error: '海选功能尚未初始化，请联系管理员运行数据库迁移脚本' }, { status: 503 });
  }

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: '已提交，不能再修改' }, { status: 409 });
  }

  const body = await request.json();
  const { demo_ids } = body;

  if (!Array.isArray(demo_ids) || demo_ids.length === 0) {
    return NextResponse.json({ error: '请选择要提交的项目' }, { status: 400 });
  }

  // Validate demo IDs exist and get their tracks for mode B check
  const { data: demos, error: demosError } = await supabase
    .from('demos')
    .select('id, track')
    .in('id', demo_ids) as { data: any[]; error: any };

  if (demosError) {
    return NextResponse.json({ error: demosError.message }, { status: 500 });
  }

  const validIds = new Set((demos || []).map((d: any) => d.id));
  const invalidIds = demo_ids.filter((id: number) => !validIds.has(id));
  if (invalidIds.length > 0) {
    return NextResponse.json({ error: `存在无效的项目 ID: ${invalidIds.join(', ')}` }, { status: 400 });
  }

  // Validate count rules
  if (config.mode === 'A') {
    if (demo_ids.length !== config.totalRequired) {
      return NextResponse.json({
        error: `请选择恰好 ${config.totalRequired} 个项目（当前 ${demo_ids.length} 个）`,
      }, { status: 400 });
    }
  } else {
    const demoMap = new Map((demos || []).map((d: any) => [d.id, d.track]));
    const optimizerCount = demo_ids.filter((id: number) => demoMap.get(id) === 'optimizer').length;
    const builderCount = demo_ids.filter((id: number) => demoMap.get(id) === 'builder').length;
    if (optimizerCount !== config.optimizerRequired || builderCount !== config.builderRequired) {
      return NextResponse.json({
        error: `需选 ${config.optimizerRequired} 个 Optimizer 和 ${config.builderRequired} 个 Builder（当前：Optimizer ${optimizerCount}，Builder ${builderCount}）`,
      }, { status: 400 });
    }
  }

  // Batch insert all as submitted
  const rows = demo_ids.map((id: number) => ({ voter_id: user.id, demo_id: id, submitted: true }));
  const { error: insertError } = await supabase
    .from('preliminary_votes')
    .insert(rows as any);

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: '你已经提交过海选了' }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
