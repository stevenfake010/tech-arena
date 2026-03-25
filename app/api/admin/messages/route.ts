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

// 获取所有留言列表
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
    .from('messages')
    .select('*, author:author_id(name, department)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`content.ilike.%${search}%,title.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: messages, error, count } = await query.range(from, to) as { 
    data: any[]; 
    error: any; 
    count: number 
  };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    messages: messages || [], 
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  });
}

// 删除单个留言
export async function DELETE(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '缺少留言ID' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 先删除关联的点赞
  await supabase.from('message_upvotes').delete().eq('message_id', parseInt(id));

  // 再删除留言
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: '留言已删除' });
}
