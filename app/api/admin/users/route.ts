import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// 验证是否是管理员
async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('demo_day_user')?.value;
  if (!userId) return null;

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from('users')
    .select('id, name, role')
    .eq('id', parseInt(userId))
    .single() as { data: any; error: any };

  if (!user || user.role !== 'admin') return null;
  return user;
}

// 获取所有用户列表（包含待审批）
export async function GET(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const filter = searchParams.get('filter') || 'all'; // all, pending, active, inactive

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('users')
    .select('id, name, email, department, role, is_active, created_at, approved_at, self_declared_role', { count: 'exact' })
    .order('created_at', { ascending: false });

  // 按状态筛选
  if (filter === 'pending') {
    query = query.eq('is_active', false);
  } else if (filter === 'active') {
    query = query.eq('is_active', true);
  } else if (filter === 'inactive') {
    query = query.eq('is_active', false);
  }

  // 搜索
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,department.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: users, error, count } = await query.range(from, to) as {
    data: any[];
    error: any;
    count: number
  };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 获取待审批注册数
  const { count: pendingCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending') as { count: number };

  return NextResponse.json({
    users: users || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    pendingCount: pendingCount || 0
  });
}

// 审批/拒绝用户
export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const { action, userId, role } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (action === 'approve') {
    // 审批通过
    const { error } = await (supabase as any)
      .from('users')
      .update({
        is_active: true,
        approved_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 更新 registration 状态
    await (supabase as any)
      .from('registrations')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
        processed_by: admin.id
      })
      .eq('user_id', userId)
      .eq('status', 'pending');

    return NextResponse.json({ success: true, message: '用户已审批通过' });

  } else if (action === 'reject') {
    // 拒绝并删除用户
    const { error } = await (supabase as any)
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 更新 registration 状态
    await (supabase as any)
      .from('registrations')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
        processed_by: admin.id
      })
      .eq('user_id', userId)
      .eq('status', 'pending');

    return NextResponse.json({ success: true, message: '用户已拒绝并删除' });

  } else if (action === 'updateRole') {
    // 更新用户角色
    if (!role) {
      return NextResponse.json({ error: '缺少角色信息' }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '角色已更新' });

  } else if (action === 'toggleActive') {
    // 切换用户激活状态
    const { data: user } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', userId)
      .single() as { data: any };

    const { error } = await (supabase as any)
      .from('users')
      .update({ is_active: !user.is_active })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '状态已切换' });
  }

  return NextResponse.json({ error: '未知操作' }, { status: 400 });
}
