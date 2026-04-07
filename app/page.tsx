'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LanguageProvider } from '@/components/LanguageProvider';

function LoginContent() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('请输入邮箱和密码');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '登录失败，请重试');
        setLoading(false);
        return;
      }

      router.push('/guide');
      router.refresh();
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

  if (showForgot) {
    return (
      <main className="relative min-h-screen w-full bg-surface overflow-y-auto">
        <div className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none overflow-hidden">
          <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #767c74 1px, transparent 0)', backgroundSize: '48px 48px' }} />
        </div>
        <header className="absolute top-0 left-0 right-0 z-20 px-4 md:px-12 pt-8 pb-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-headline font-bold tracking-tight text-on-surface">Tech Arena</h1>
            <p className="text-base text-on-surface-variant mt-1">小红书社区算法 / 研发</p>
          </div>
        </header>
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 pt-24 pb-12">
          <div className="w-full max-w-md bg-white p-10 sm:p-12 flex flex-col gap-6 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-surface-container-high/50 text-center">
            <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-headline font-bold text-on-surface mb-3">忘记密码</h2>
              <p className="text-base text-on-surface-variant leading-relaxed">
                请在公司 HI 平台上联系管理员 <span className="font-semibold text-on-surface">高斯</span> 进行密码重置。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForgot(false)}
              className="w-full bg-on-surface text-white py-4 px-8 flex items-center justify-center transition-all duration-300 hover:opacity-90 active:scale-[0.98] shadow-sm rounded-sm"
            >
              <span className="text-sm font-semibold tracking-wider">返回登录</span>
            </button>
          </div>
        </div>
        <div className="fixed left-0 top-0 h-full w-1 bg-on-surface/5" />
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

      {/* Main Content - Login Card */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 pt-24 pb-12">
        <div className="w-full max-w-md bg-white p-10 sm:p-12 flex flex-col gap-8 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-surface-container-high/50">
          <header className="flex flex-col gap-2">
            <h2 className="text-2xl font-headline font-bold leading-tight text-on-surface">登录</h2>
            <p className="text-sm text-on-surface-variant">输入邮箱和密码登录你的账号</p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* 邮箱 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-outline tracking-wide" htmlFor="email">
                邮箱
              </label>
              <input
                className="w-full px-0 py-3 text-base text-on-surface bg-transparent border-0 border-b-2 border-outline/30 focus:border-primary focus:outline-none transition-colors placeholder:text-outline/40"
                id="email"
                placeholder="请输入邮箱"
                type="email"
                value={formData.email}
                onChange={e => updateField('email', e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* 密码 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-outline tracking-wide" htmlFor="password">
                密码
              </label>
              <input
                className="w-full px-0 py-3 text-base text-on-surface bg-transparent border-0 border-b-2 border-outline/30 focus:border-primary focus:outline-none transition-colors placeholder:text-outline/40"
                id="password"
                placeholder="请输入密码"
                type="password"
                value={formData.password}
                onChange={e => updateField('password', e.target.value)}
                autoComplete="current-password"
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
                  {loading ? '登录中...' : '登录'}
                </span>
              </button>
            </div>

            {/* 忘记密码 & 注册链接 */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                忘记密码？
              </button>
              <p className="text-sm text-on-surface-variant">
                没有账号？<Link href="/register" className="text-primary hover:underline">立即注册</Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Left Edge Decoration */}
      <div className="fixed left-0 top-0 h-full w-1 bg-on-surface/5" />
    </main>
  );
}

export default function EntryPortal() {
  return (
    <LanguageProvider>
      <LoginContent />
    </LanguageProvider>
  );
}
