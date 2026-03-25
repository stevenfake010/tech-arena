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

// 检查用户是否有权限修改/删除这个 Demo
async function checkPermission(demoId: number, user: any) {
  const supabase = getSupabaseAdmin();
  
  const { data: demo } = await supabase
    .from('demos')
    .select('submitted_by, submitter1_name, submitter2_name')
    .eq('id', demoId)
    .single() as { data: any; error: any };
  
  if (!demo) return false;
  
  // 管理员有全部权限
  if (user.role === 'admin') return true;
  
  // 提交者（创建者）有权限
  if (demo.submitted_by === user.id) return true;
  
  // 第一提交人有权限
  if (demo.submitter1_name === user.name) return true;
  
  return false;
}

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
    .single() as { data: any; error: any };

  if (error || !demo) {
    return NextResponse.json({ error: 'Demo 不存在' }, { status: 404 });
  }

  return NextResponse.json({
    ...demo,
    submitter_name: demo.submitter?.name,
    submitter_department: demo.submitter?.department,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;
  const demoId = parseInt(id);

  // 检查权限
  const hasPermission = await checkPermission(demoId, user);
  if (!hasPermission) {
    return NextResponse.json({ error: '没有权限修改此 Demo' }, { status: 403 });
  }

  const body = await request.json();
  const { 
    name, summary, track, demo_link, 
    submitter1_name, submitter1_dept, 
    submitter2_name, submitter2_dept, 
    background, solution, keywords, media_urls 
  } = body;

  if (!name || !summary || !track || !submitter1_name || !submitter1_dept || !background || !solution) {
    return NextResponse.json({ error: '请填写必填项' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 验证提交人1
  const { data: submitter1, error: submitter1Error } = await supabase
    .from('users')
    .select('id, name, department')
    .eq('name', submitter1_name)
    .eq('department', submitter1_dept)
    .single() as { data: any; error: any };

  if (submitter1Error || !submitter1) {
    return NextResponse.json({ error: '第一位提交人的姓名和部门不匹配' }, { status: 400 });
  }

  // 验证提交人2（如果有）
  let submitter2Id = null;
  if (track === 'builder' && submitter2_name) {
    const { data: submitter2, error: submitter2Error } = await supabase
      .from('users')
      .select('id, name, department')
      .eq('name', submitter2_name)
      .eq('department', submitter2_dept)
      .single() as { data: any; error: any };

    if (submitter2Error || !submitter2) {
      return NextResponse.json({ error: '第二位提交人的姓名和部门不匹配' }, { status: 400 });
    }

    if (submitter1.id === submitter2.id) {
      return NextResponse.json({ error: '两位提交人不能是同一个人' }, { status: 400 });
    }

    submitter2Id = submitter2.id;
  }

  const updateData = {
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
  };

  const { data, error } = await (supabase as any)
    .from('demos')
    .update(updateData)
    .eq('id', demoId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ demo: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;
  const demoId = parseInt(id);

  // 检查权限
  const hasPermission = await checkPermission(demoId, user);
  if (!hasPermission) {
    return NextResponse.json({ error: '没有权限删除此 Demo' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  // 先删除关联的投票记录
  await supabase
    .from('votes')
    .delete()
    .eq('demo_id', demoId);

  // 删除 Demo
  const { error } = await supabase
    .from('demos')
    .delete()
    .eq('id', demoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
