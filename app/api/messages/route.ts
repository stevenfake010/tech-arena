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
    .single() as { data: any; error: any };

  return user;
}

export async function GET() {
  const supabase = getSupabaseAdmin();

  // 同时获取当前登录用户（用于判断是否已点赞）
  const currentUser = await getCurrentUser();

  // 只查询需要的字段
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id, title, content, category, author_id, created_at,
      author:author_id(name, department)
    `)
    .order('created_at', { ascending: false }) as { data: any[]; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const messageIds = messages?.map((m: any) => m.id) || [];

  // 点赞总数
  let upvoteCounts: Record<number, number> = {};
  // 当前用户已点赞的消息 ID 集合
  let userUpvotedIds = new Set<number>();

  if (messageIds.length > 0) {
    // 查询所有点赞记录（含 user_id，用于判断当前用户是否已点赞）
    const { data: upvotes, error: upvoteError } = await supabase
      .from('message_upvotes')
      .select('message_id, user_id')
      .in('message_id', messageIds) as { data: any[]; error: any };

    if (!upvoteError && upvotes) {
      for (const upvote of upvotes) {
        upvoteCounts[upvote.message_id] = (upvoteCounts[upvote.message_id] || 0) + 1;
        if (currentUser && upvote.user_id === currentUser.id) {
          userUpvotedIds.add(upvote.message_id);
        }
      }
    }
  }

  // 格式化数据
  const formattedMessages = messages?.map((m: any) => ({
    id: m.id,
    title: m.title,
    content: m.content,
    category: m.category,
    author_id: m.author_id,
    author_name: (m.author as any)?.name,
    author_dept: (m.author as any)?.department,
    upvote_count: upvoteCounts[m.id] || 0,
    hasUpvoted: userUpvotedIds.has(m.id),
    created_at: m.created_at,
  })) || [];

  // 不设置 Cache-Control，避免浏览器缓存导致乐观更新被覆盖
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

  const messageData: any = {
    author_id: user.id,
    title: title || null,
    content: content.trim(),
    category: category || null,
  };

  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single() as { data: any; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
