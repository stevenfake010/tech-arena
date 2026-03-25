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

// 获取所有 Demo 列表
export async function GET(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('demos')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,submitter1_name.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: demos, error, count } = await query.range(from, to) as { 
    data: any[]; 
    error: any; 
    count: number 
  };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    demos: demos || [], 
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  });
}

// 删除单个 Demo
export async function DELETE(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '缺少项目ID' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 先删除关联的投票
  await supabase.from('votes').delete().eq('demo_id', parseInt(id));

  // 再删除项目
  const { error } = await supabase
    .from('demos')
    .delete()
    .eq('id', parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: '项目已删除' });
}
