import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// 获取当前登录用户
async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('demo_day_user')?.value;
  if (!userId) return null;
  
  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from('users')
    .select('id, name, role')
    .eq('id', parseInt(userId))
    .single() as { data: any; error: any };
  
  return user;
}

// 创建 site_config 表并初始化
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }
  
  const supabase = getSupabaseAdmin();
  
  try {
    // 尝试直接插入配置，如果表不存在会报错
    const defaultConfigs = [
      { key: 'voting_enabled', value: 'false' },
      { key: 'voting_notice', value: '投票将于 4月1日 12:00 开始，敬请期待！' },
      { key: 'submission_enabled', value: 'true' },
    ];
    
    for (const config of defaultConfigs) {
      const { error } = await supabase
        .from('site_config')
        .upsert(
          { 
            key: config.key, 
            value: config.value,
            updated_at: new Date().toISOString()
          } as any,
          { onConflict: 'key' }
        );
      
      if (error) {
        // 表不存在
        if (error.code === '42P01') {
          return NextResponse.json({ 
            error: '配置表不存在，请先在 Supabase SQL Editor 中执行以下 SQL：',
            sql: `CREATE TABLE IF NOT EXISTS site_config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,
          }, { status: 400 });
        }
        return NextResponse.json({ error: `初始化失败: ${error.message}` }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: '配置表初始化成功',
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 获取当前配置
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }
  
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('site_config')
    .select('*')
    .order('key') as { data: any[]; error: any };
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({
    success: true,
    config: data || [],
  });
}
