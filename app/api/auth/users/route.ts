import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabaseAdmin();
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, department')
    .order('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: users || [] });
}
