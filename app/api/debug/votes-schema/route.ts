import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabaseAdmin();
  
  try {
    // 获取 votes 表的列信息
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'votes');
    
    if (colError) {
      return NextResponse.json({ error: colError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      columns: columns || [],
      message: 'votes 表结构'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
