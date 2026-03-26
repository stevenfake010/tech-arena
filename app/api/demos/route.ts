import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('demo_day_user')?.value;
  if (!userId) return null;
  
  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from('users')
    .select('id, name, department, role')
    .eq('id', parseInt(userId))
    .single() as { data: any; error: any };
  
  return user;
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  
  const { data: demos, error } = await supabase
    .from('demos')
    .select(`
      *,
      submitter:submitted_by(name, department)
    `)
    .order('created_at', { ascending: false }) as { data: any[]; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 格式化数据以兼容前端
  const formattedDemos = demos?.map(d => ({
    ...d,
    submitter_name: d.submitter?.name,
    submitter_department: d.submitter?.department,
  })) || [];

  return NextResponse.json(
    { demos: formattedDemos },
    {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    }
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  // 检查提交权限是否开放
  const supabaseCheck = getSupabaseAdmin();
  const { data: submissionConfig } = await supabaseCheck
    .from('site_config')
    .select('value')
    .eq('key', 'submission_enabled')
    .single() as { data: any; error: any };
  // 未配置时默认开放；明确配置为 'false' 时关闭
  const isSubmissionOpen = submissionConfig?.value !== 'false';
  if (!isSubmissionOpen) {
    return NextResponse.json({ error: '提交通道已关闭，不再接受新的 Demo 提交' }, { status: 403 });
  }

  const body = await request.json();
  const { name, summary, track, demo_link, submitter1_name, submitter1_dept, submitter2_name, submitter2_dept, background, solution, keywords, media_urls } = body;

  if (!name || !summary || !track || !submitter1_name || !submitter1_dept || !background || !solution) {
    return NextResponse.json({ error: '请填写必填项' }, { status: 400 });
  }

  if (track === 'optimizer' && submitter2_name) {
    return NextResponse.json({ error: 'Optimizer 赛道仅允许单人提报' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 验证提交人1：姓名和部门必须匹配数据库中的用户
  const { data: submitter1, error: submitter1Error } = await supabase
    .from('users')
    .select('id, name, department')
    .eq('name', submitter1_name)
    .eq('department', submitter1_dept)
    .single() as { data: any; error: any };

  if (submitter1Error || !submitter1) {
    return NextResponse.json({ error: '第一位提交人的姓名和部门不匹配，请从下拉列表中选择' }, { status: 400 });
  }

  // 如果是Builder且有第二位提交人，验证第二位
  let submitter2Id = null;
  if (track === 'builder' && submitter2_name) {
    const { data: submitter2, error: submitter2Error } = await supabase
      .from('users')
      .select('id, name, department')
      .eq('name', submitter2_name)
      .eq('department', submitter2_dept)
      .single() as { data: any; error: any };

    if (submitter2Error || !submitter2) {
      return NextResponse.json({ error: '第二位提交人的姓名和部门不匹配，请从下拉列表中选择' }, { status: 400 });
    }

    // 验证两位提交人不能是同一个人
    if (submitter1.id === submitter2.id) {
      return NextResponse.json({ error: '两位提交人不能是同一个人' }, { status: 400 });
    }

    submitter2Id = submitter2.id;
  }
  
  const insertData: any = {
    name,
    summary,
    track,
    demo_link: demo_link || null,
    submitter1_name,
    submitter1_dept,
    submitter2_name: submitter2_name || null,
    submitter2_dept: submitter2_dept || null,
    background: background || null,
    solution: solution || null,
    keywords: keywords || null,
    media_urls: media_urls || [],
    submitted_by: user.id,
  };
  
  const { data, error } = await supabase
    .from('demos')
    .insert(insertData)
    .select()
    .single() as { data: any; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
