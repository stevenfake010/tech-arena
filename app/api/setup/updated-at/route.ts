import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  return NextResponse.json({
    message: '请手动在 Supabase Dashboard 执行以下 SQL',
    sql: `
-- 添加 updated_at 列到 demos 表
ALTER TABLE demos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 更新现有数据，将 updated_at 设置为 created_at 的值
UPDATE demos SET updated_at = created_at WHERE updated_at IS NULL;
    `
  });
}
