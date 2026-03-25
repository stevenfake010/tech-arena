import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabaseAdmin();
  
  try {
    // 1. 检查现有投票类型分布
    const { data: voteTypeCounts, error: voteError } = await supabase
      .from('votes')
      .select('vote_type');
    
    if (voteError) {
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }
    
    const typeDistribution: Record<string, number> = {};
    if (voteTypeCounts) {
      voteTypeCounts.forEach((v: any) => {
        typeDistribution[v.vote_type] = (typeDistribution[v.vote_type] || 0) + 1;
      });
    }
    
    // 2. 尝试插入一个测试投票来查看错误（使用不可能成功的 demo_id）
    const { error: testError } = await supabase
      .from('votes')
      .insert({ 
        voter_id: -1, // 不可能存在的用户
        demo_id: -1,  // 不可能存在的 demo
        vote_type: 'special_brain' 
      } as any);
    
    // 检查错误类型 - 如果是外键约束错误，说明 vote_type 是有效的
    // 如果是枚举类型错误，说明 special_brain 不在枚举中
    const testErrorInfo = testError ? {
      code: testError.code,
      message: testError.message,
      details: testError.details,
      hint: testError.hint,
    } : null;

    return NextResponse.json({
      typeDistribution,
      testError: testErrorInfo,
      testVoteType: 'special_brain',
      note: 'testError.code: 23503 = FK constraint (vote_type is valid), 22P02 = invalid enum value',
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
