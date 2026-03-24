import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST() {
  const supabase = getSupabaseAdmin();
  const results = {
    deleted: {
      votes: 0,
      demos: 0,
      messages: 0,
      message_upvotes: 0,
    },
    errors: [] as string[],
  };

  try {
    // 1. 删除所有投票（先删外键关联）
    const { error: votesError, count: votesCount } = await supabase
      .from('votes')
      .delete({ count: 'exact' })
      .neq('id', 0); // 删除所有

    if (votesError) {
      results.errors.push(`Votes: ${votesError.message}`);
    } else {
      results.deleted.votes = votesCount || 0;
    }

    // 2. 删除所有消息点赞
    const { error: upvotesError, count: upvotesCount } = await supabase
      .from('message_upvotes')
      .delete({ count: 'exact' })
      .neq('message_id', 0);

    if (upvotesError) {
      results.errors.push(`Message Upvotes: ${upvotesError.message}`);
    } else {
      results.deleted.message_upvotes = upvotesCount || 0;
    }

    // 3. 删除所有消息
    const { error: messagesError, count: messagesCount } = await supabase
      .from('messages')
      .delete({ count: 'exact' })
      .neq('id', 0);

    if (messagesError) {
      results.errors.push(`Messages: ${messagesError.message}`);
    } else {
      results.deleted.messages = messagesCount || 0;
    }

    // 4. 删除所有 Demo
    const { error: demosError, count: demosCount } = await supabase
      .from('demos')
      .delete({ count: 'exact' })
      .neq('id', 0);

    if (demosError) {
      results.errors.push(`Demos: ${demosError.message}`);
    } else {
      results.deleted.demos = demosCount || 0;
    }

    return NextResponse.json({
      success: true,
      message: '测试数据已清理完成！',
      results: {
        deleted: {
          votes: results.deleted.votes,
          demos: results.deleted.demos,
          messages: results.deleted.messages,
          message_upvotes: results.deleted.message_upvotes,
          total: results.deleted.votes + results.deleted.demos + results.deleted.messages + results.deleted.message_upvotes,
        },
        errors: results.errors,
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
