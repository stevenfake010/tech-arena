import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { pinyin } from 'pinyin-pro';

export async function GET() {
  const supabase = getSupabaseAdmin();
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, department');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 按拼音排序
  const sortedUsers = (users || []).sort((a: any, b: any) => {
    const pinyinA = pinyin(a.name, { toneType: 'none', type: 'string' });
    const pinyinB = pinyin(b.name, { toneType: 'none', type: 'string' });
    return pinyinA.localeCompare(pinyinB);
  });

  return NextResponse.json({ users: sortedUsers });
}
