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
    .select('id, name, department, role')
    .eq('id', parseInt(userId))
    .single();
  
  return user;
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      author:author_id(name, department)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 获取每条消息的点赞数
  const messageIds = messages?.map(m => m.id) || [];
  
  let upvoteCounts: Record<number, number> = {};
  
  if (messageIds.length > 0) {
    const { data: upvotes, error: upvoteError } = await supabase
      .from('message_upvotes')
      .select('message_id')
      .in('message_id', messageIds);

    if (!upvoteError && upvotes) {
      for (const upvote of upvotes) {
        upvoteCounts[upvote.message_id] = (upvoteCounts[upvote.message_id] || 0) + 1;
      }
    }
  }

  // 格式化数据
  const formattedMessages = messages?.map(m => ({
    id: m.id,
    title: m.title,
    content: m.content,
    category: m.category,
    author_id: m.author_id,
    author_name: (m.author as any)?.name,
    author_dept: (m.author as any)?.department,
    upvote_count: upvoteCounts[m.id] || 0,
    created_at: m.created_at,
  })) || [];

  return NextResponse.json({ messages: formattedMessages });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { title, content, category } = await request.json();
  
  if (!content?.trim()) {
    return NextResponse.json({ error: '请输入内容' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      author_id: user.id,
      title: title || null,
      content: content.trim(),
      category: category || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
