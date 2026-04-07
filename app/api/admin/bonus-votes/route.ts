import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export interface BonusVoteEntry {
  demo_id: number;
  vote_type: string;
  bonus: number;
}

async function getAdminUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('demo_day_user')?.value;
  if (!userId) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', parseInt(userId))
    .single();
  const user = data as { id: number; role: string } | null;
  return user?.role === 'admin' ? user : null;
}

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const supabase = getSupabaseAdmin();

  const [bonusRes, demosRes] = await Promise.all([
    supabase.from('site_config').select('value').eq('key', 'bonus_votes').maybeSingle(),
    supabase.from('demos').select('id, name, track').order('name'),
  ]);

  let bonusVotes: BonusVoteEntry[] = [];
  const bonusData = bonusRes.data as { value: string } | null;
  if (bonusData?.value) {
    try { bonusVotes = JSON.parse(bonusData.value); } catch {}
  }

  return NextResponse.json({ bonusVotes, demos: demosRes.data || [] });
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { bonusVotes }: { bonusVotes: BonusVoteEntry[] } = await request.json();
  if (!Array.isArray(bonusVotes)) {
    return NextResponse.json({ error: '格式错误' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const value = JSON.stringify(bonusVotes);

  const { error } = await supabase
    .from('site_config')
    .upsert({ key: 'bonus_votes', value } as any, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
