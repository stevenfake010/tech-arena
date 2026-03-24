import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  
  const { data: demo, error } = await supabase
    .from('demos')
    .select(`
      *,
      submitter:submitted_by(name, department)
    `)
    .eq('id', parseInt(id))
    .single();

  if (error || !demo) {
    return NextResponse.json({ error: 'Demo 不存在' }, { status: 404 });
  }

  return NextResponse.json({
    ...demo,
    submitter_name: demo.submitter?.name,
    submitter_department: demo.submitter?.department,
  });
}
