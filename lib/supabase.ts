import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 服务端使用的 client（有完整权限）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 根据环境变量创建客户端
export function getSupabaseAdmin() {
  return supabaseAdmin;
}
