'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LanguageProvider } from '@/components/LanguageProvider';
import { DEPARTMENTS } from '@/lib/constants';

function RegisterContent() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    email: '',
    password: '',
    confirmPassword: '',
    invitationCode: '',
    selfDeclaredRole: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const departments = [...DEPARTMENTS];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name || !formData.department || !formData.email || !formData.password) {
      setError('请填写所有必填项');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('密码至少8位');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('请输入有效的邮箱地址');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          department: formData.department,
          email: formData.email,
          password: formData.password,
          invitationCode: formData.invitationCode,
          selfDeclaredRole: formData.selfDeclaredRole || undefined
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败，请重试');
        setLoading(false);
        return;
      }

      setSuccessMessage(data.message || '请等待管理员审核，审核通过后即可登录');
      setSuccess(true);
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  }

  if (success) {
    return (
      <main className="relative min-h-screen w-full bg-surface overflow-y-auto">
        <div className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none overflow-hidden">
          <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #767c74 1px, transparent 0)', backgroundSize: '48px 48px' }} />
        </div>

        <header className="absolute top-0 left-0 right-0 z-20 px-4 md:px-12 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-4xl font-headline font-bold tracking-tight text-on-surface">Tech Arena</h1>
              <p className="text-base text-on-surface-variant mt-1">小红书社区算法 / 研发</p>
            </div>
          </div>
        </header>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 pt-24 pb-12">
          <div className="w-full max-w-md bg-white p-10 sm:p-12 flex flex-col gap-6 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-surface-container-high/50 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">注册成功</h2>
              <p className="text-base text-on-surface-variant">{successMessage || '请等待管理员审核，审核通过后即可登录'}</p>
            </div>
            <Link
              href="/"
              className="w-full bg-on-surface text-white py-4 px-8 flex items-center justify-center transition-all duration-300 hover:opacity-90 active:scale-[0.98] shadow-sm rounded-sm"
            >
              <span className="text-sm font-semibold tracking-wider">返回登录</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full bg-surface overflow-y-auto">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none overflow-hidden">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #767c74 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 px-4 md:px-12 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-4xl font-headline font-bold tracking-tight text-on-surface">Tech Arena</h1>
            <p className="text-base text-on-surface-variant mt-1">小红书社区算法 / 研发</p>
          </div>
        </div>
      </header>

      {/* Main Content - Registration Card */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 pt-24 pb-12">
        <div className="w-full max-w-md bg-white p-10 sm:p-12 flex flex-col gap-6 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-surface-container-high/50">
          <header className="flex flex-col gap-2">
            <h2 className="text-2xl font-headline font-bold leading-tight text-on-surface">用户注册</h2>
            <p className="text-sm text-on-surface-variant">填写以下信息完成注册</p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* 薯名 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-outline tracking-wide" htmlFor="name">
                薯名 <span className="text-error">*</span>
              </label>
              <input
                className="w-full px-0 py-3 text-base text-on-surface bg-transparent border-0 border-b-2 border-outline/30 focus:border-primary focus:outline-none transition-colors placeholder:text-outline/40"
                id="name"
                placeholder="请输入你的薯名"
                type="text"
                value={formData.name}
                onChange={e => updateField('name', e.target.value)}
              />
            </div>

            {/* 部门 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-outline tracking-wide" htmlFor="department">
                部门 <span className="text-error">*</span>
              </label>
              <select
                className="w-full px-0 py-3 text-base text-on-surface bg-transparent border-0 border-b-2 border-outline/30 focus:border-primary focus:outline-none transition-colors"
                id="department"
                value={formData.department}
                onChange={e => updateField('department', e.target.value)}
              >
                <option value="">请选择部门</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* 邀请码 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-outline tracking-wide" htmlFor="invitationCode">
                邀请码 <span className="text-error">*</span>
              </label>
              <input
                className="w-full px-0 py-3 text-base text-on-surface bg-transparent border-0 border-b-2 border-outline/30 focus:border-primary focus:outline-none transition-colors placeholder:text-outline/40"
                id="invitationCode"
                placeholder="请输入邀请码"
                type="text"
                value={formData.invitationCode}
                onChange={e => updateField('invitationCode', e.target.value)}
              />
            </div>

            {/* 邮箱 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-outline tracking-wide" htmlFor="email">
                邮箱 <span className="text-error">*</span>
              </label>
              <input
                className="w-full px-0 py-3 text-base text-on-surface bg-transparent border-0 border-b-2 border-outline/30 focus:border-primary focus:outline-none transition-colors placeholder:text-outline/40"
                id="email"
                placeholder="请输入工作邮箱"
                type="email"
                value={formData.email}
                onChange={e => updateField('email', e.target.value)}
              />
            </div>

            {/* 密码 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-outline tracking-wide" htmlFor="password">
                密码 <span className="text-error">*</span>
              </label>
              <input
                className="w-full px-0 py-3 text-base text-on-surface bg-transparent border-0 border-b-2 border-outline/30 focus:border-primary focus:outline-none transition-colors placeholder:text-outline/40"
                id="password"
                placeholder="至少8位"
                type="password"
                value={formData.password}
                onChange={e => updateField('password', e.target.value)}
              />
            </div>

            {/* 确认密码 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-outline tracking-wide" htmlFor="confirmPassword">
                确认密码 <span className="text-error">*</span>
              </label>
              <input
                className="w-full px-0 py-3 text-base text-on-surface bg-transparent border-0 border-b-2 border-outline/30 focus:border-primary focus:outline-none transition-colors placeholder:text-outline/40"
                id="confirmPassword"
                placeholder="再次输入密码"
                type="password"
                value={formData.confirmPassword}
                onChange={e => updateField('confirmPassword', e.target.value)}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-on-surface text-white py-4 px-8 flex items-center justify-center transition-all duration-300 hover:opacity-90 active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
              >
                <span className="text-sm font-semibold tracking-wider">
                  {loading ? '注册中...' : '注册'}
                </span>
              </button>
            </div>

            {/* 已有账号 */}
            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-primary hover:underline"
              >
                已有账号？返回登录
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Left Edge Decoration */}
      <div className="fixed left-0 top-0 h-full w-1 bg-on-surface/5" />
    </main>
  );
}

export default function RegisterPage() {
  return (
    <LanguageProvider>
      <RegisterContent />
    </LanguageProvider>
  );
}
