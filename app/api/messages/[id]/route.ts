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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;
  const messageId = parseInt(id);
  
  if (isNaN(messageId)) {
    return NextResponse.json({ error: '无效的消息ID' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  
  // 检查消息是否存在且属于当前用户
  const { data: message, error: fetchError } = await supabase
    .from('messages')
    .select('author_id')
    .eq('id', messageId)
    .single() as { data: any; error: any };
  
  if (fetchError || !message) {
    return NextResponse.json({ error: '消息不存在' }, { status: 404 });
  }
  
  // 只允许作者或管理员删除
  if (message.author_id !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: '无权删除此消息' }, { status: 403 });
  }
  
  // 删除相关的点赞记录
  await supabase
    .from('message_upvotes')
    .delete()
    .eq('message_id', messageId);
  
  // 删除消息
  const { error: deleteError } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);
  
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
