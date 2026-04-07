import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEPARTMENTS } from '@/lib/constants';
import bcrypt from 'bcrypt';

const INVITATION_CODE = 'techarena2026';

export async function POST(request: Request) {
  try {
    const { name, email, password, department, invitationCode, selfDeclaredRole } = await request.json();

    // Validation
    if (!name || !email || !password || !department) {
      return NextResponse.json({ error: '请填写所有必填项' }, { status: 400 });
    }
    if (!DEPARTMENTS.includes(department as any)) {
      return NextResponse.json({ error: '部门不在允许范围内，请联系管理员' }, { status: 400 });
    }

    // 邀请码验证
    if (!invitationCode || invitationCode !== INVITATION_CODE) {
      return NextResponse.json({ error: '邀请码错误，请联系管理员获取正确邀请码' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少8位' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
    }

    // 必须使用公司邮箱
    if (!email.toLowerCase().endsWith('@xiaohongshu.com')) {
      return NextResponse.json({ error: '请使用公司邮箱（@xiaohongshu.com）注册' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const hashedPassword = await bcrypt.hash(password, 12);

    // 检查邮箱是否已被注册
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingEmail) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 });
    }

    // 检查薯名是否已被注册
    const { data: existingName } = await supabase
      .from('users')
      .select('id, name')
      .eq('name', name.trim())
      .single();

    if (existingName) {
      return NextResponse.json({ error: '该薯名已被使用，请换一个' }, { status: 409 });
    }

    // 新用户注册
    const { data: newUser, error: insertError } = await (supabase as any)
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: hashedPassword,
        department,
        self_declared_role: selfDeclaredRole || null,
        role: 'normal',
        is_active: true // 邀请码验证通过，无需审批
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: '注册失败，请重试' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '注册成功，可以登录了'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: '服务器错误，请重试' }, { status: 500 });
  }
}
