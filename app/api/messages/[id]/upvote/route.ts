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

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;
  const messageId = parseInt(id);
  
  const supabase = getSupabaseAdmin();

  // 检查是否已点赞
  const { data: existing, error: checkError } = await supabase
    .from('message_upvotes')
    .select('*')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // 取消点赞
    const { error } = await supabase
      .from('message_upvotes')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ upvoted: false });
  } else {
    // 添加点赞
    const upvoteData: any = {
      message_id: messageId,
      user_id: user.id,
    };
    const { error } = await supabase
      .from('message_upvotes')
      .insert(upvoteData);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ upvoted: true });
  }
}
