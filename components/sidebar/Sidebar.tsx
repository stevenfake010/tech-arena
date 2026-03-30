'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, LayoutGrid, Trophy, MessageSquare, Plus, LogIn, LogOut, FolderOpen, UserCircle, X, ListChecks } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { useUser } from '@/lib/hooks/useUser';
import useSWR from 'swr';
import { useState, useEffect, useCallback, useMemo } from 'react';

const configFetcher = (url: string) => fetch(url).then(r => r.json());

const DEADLINE = new Date('2026-03-30T04:00:00Z');

function useCountdown() {
  const calc = useCallback(() => {
    const diff = DEADLINE.getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  }, []);
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

export default function Sidebar({ onSubmitClick }: { onSubmitClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: loading, mutate } = useUser();
  const { t } = useLanguage();
  const countdown = useCountdown();
  const [showProfile, setShowProfile] = useState(false);
  const { data: siteConfig } = useSWR('/api/config', configFetcher, { revalidateOnFocus: false });

  const showLeaderboard = siteConfig?.navLeaderboardVisible ?? true;
  const showPreliminary = siteConfig?.navPreliminaryVisible ?? false;
  const showSubmitButton = siteConfig?.isSubmissionOpen ?? true;

  const NAV_ITEMS = useMemo(() => [
    { href: '/guide', label: t.nav.guide, icon: Compass },
    { href: '/gallery', label: t.nav.gallery, icon: LayoutGrid },
    ...(showLeaderboard ? [{ href: '/leaderboard', label: t.nav.leaderboard, icon: Trophy }] : []),
    ...(showPreliminary ? [{ href: '/preliminary', label: t.nav.preliminary, icon: ListChecks }] : []),
    ...(user ? [{ href: '/my-demos', label: t.nav.myDemos, icon: FolderOpen }] : []),
    { href: '/square', label: t.nav.square, icon: MessageSquare },
  ], [showLeaderboard, showPreliminary, user, t]);

  const handleActionClick = () => {
    if (user) {
      onSubmitClick();
    } else {
      router.push('/');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    mutate(null, false); // 立即更新缓存，不重新请求
    router.push('/');
  };

  const handleLogoutFromSheet = async () => {
    setShowProfile(false);
    await handleLogout();
  };

  return (
    <>
      {/* ── Mobile: 右上角头像入口 ── */}
      {!loading && (
        <button
          onClick={() => setShowProfile(true)}
          className={`fixed top-4 right-4 md:hidden z-40 flex items-center justify-center w-9 h-9 rounded-full shadow-sm active:scale-95 transition-all ${
            user
              ? 'bg-[#1A1A1A] text-white border border-[#1A1A1A]'
              : 'bg-[#f3f4ee] border border-outline-variant/30 text-on-surface-variant'
          }`}
          aria-label="个人信息"
        >
          <UserCircle size={20} strokeWidth={user ? 1.5 : 1.5} />
        </button>
      )}

      {/* ── Mobile: 个人信息底部抽屉 ── */}
      {showProfile && (
        <div className="md:hidden fixed inset-0 z-[70]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => setShowProfile(false)}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 inset-x-0 bg-surface-container-lowest rounded-t-2xl safe-area-pb">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
            </div>

            {/* Header: 用户信息 */}
            <div className="flex items-center justify-between px-6 pt-3 pb-5 border-b border-outline-variant/15">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-on-surface">{user.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-headline font-bold text-base text-on-surface chinese-text">{user.name}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 chinese-text">{user.department}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                    <UserCircle size={24} className="text-on-surface-variant" />
                  </div>
                  <div>
                    <p className="font-medium text-on-surface-variant">游客模式</p>
                    <p className="text-xs text-on-surface-variant/60 mt-0.5">登录后可提交 Demo 和投票</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowProfile(false)}
                className="p-2 text-on-surface-variant rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 space-y-1">
              {user ? (
                <>
                  <Link
                    href="/my-demos"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    <FolderOpen size={20} className="text-on-surface-variant" />
                    <span className="font-medium text-on-surface chinese-text">我的 Demo</span>
                  </Link>
                  <button
                    onClick={handleLogoutFromSheet}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-error/5 text-error transition-colors"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">退出登录</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setShowProfile(false); router.push('/'); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-primary text-on-primary transition-colors active:scale-95"
                >
                  <LogIn size={20} />
                  <span className="font-bold chinese-text">登录</span>
                </button>
              )}
            </div>
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f3f4ee] hidden md:flex flex-col pt-10 pb-8 px-6 gap-y-4 z-50">
        {/* Branding */}
        <div className="mb-8 px-2">
          <h1 className="text-3xl font-headline font-bold text-on-surface leading-tight">AI Demo Day</h1>
          <p className="text-sm text-on-surface-variant mt-2">小红书战略 / 投资 / 用户研究</p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-y-1 flex-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-x-3 px-4 py-3 rounded-lg transition-colors duration-200 active:scale-95 ${
                  isActive
                    ? 'text-[#1A1A1A] font-bold border-l-4 border-[#5f5e5e] bg-white/50'
                    : 'text-[#5f5e5e] font-medium opacity-80 hover:bg-[#ecefe7]'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-headline font-bold tracking-tight text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Button - Submit or Login */}
        <div className="px-2 mb-4">
          {!loading && (showSubmitButton || !user) && (
            <button
              onClick={handleActionClick}
              className={`w-full flex flex-col items-center justify-center gap-0.5 py-3 px-4 rounded-lg transition-all shadow-sm active:scale-95 ${
                user
                  ? 'bg-[#1A1A1A] text-white hover:opacity-90'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/30'
              }`}
            >
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <Plus size={16} strokeWidth={2.5} />
                    <span className="font-headline font-bold tracking-tight text-base chinese-text">{t.nav.submit}</span>
                  </div>
                  {countdown ? (
                    <span className="text-[11px] opacity-60 tabular-nums">
                      {countdown.d > 0 ? `${countdown.d}天 ` : ''}{String(countdown.h).padStart(2,'0')}:{String(countdown.m).padStart(2,'0')}:{String(countdown.s).padStart(2,'0')} 后截止
                    </span>
                  ) : (
                    <span className="text-[11px] opacity-60">已截止</span>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn size={16} strokeWidth={2.5} />
                  <span className="font-headline font-bold tracking-tight text-base chinese-text">{t.nav.login}</span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* User Info */}
        <div className="px-4">
          {loading ? (
            <div className="text-xs text-on-surface-variant">Loading...</div>
          ) : user ? (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-headline font-bold text-lg text-on-surface chinese-text">{user.name}</span>
                <span className="text-xs text-on-surface-variant uppercase tracking-wider mt-0.5 font-medium chinese-text">{user.department}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                title="退出登录"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
              <span className="text-sm text-on-surface-variant">{t.nav.guest}</span>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Bottom Tab Bar ── */}
      {(() => {
        // 手机底栏：左侧固定 guide + gallery，右侧根据配置动态显示投票/海选 + square
        const MOBILE_NAV_RIGHT = [
          ...(showLeaderboard ? [{ href: '/leaderboard', label: t.nav.leaderboard, icon: Trophy }] : []),
          ...(showPreliminary ? [{ href: '/preliminary', label: t.nav.preliminary, icon: ListChecks }] : []),
          ...(!showLeaderboard && !showPreliminary ? [{ href: '/leaderboard', label: t.nav.leaderboard, icon: Trophy }] : []),
          { href: '/square', label: t.nav.square, icon: MessageSquare },
        ].slice(0, 2); // 右侧最多显示 2 个
        const leftNav = [
          { href: '/guide',   label: t.nav.guide,   icon: Compass },
          { href: '/gallery', label: t.nav.gallery, icon: LayoutGrid },
        ];
        const rightNav = MOBILE_NAV_RIGHT;

        return (
          <nav className="fixed bottom-0 inset-x-0 md:hidden z-50 bg-[#f3f4ee] border-t border-outline-variant/20 flex items-center justify-around px-2 pt-1 pb-1 safe-area-pb">
            {/* Left 2 tabs */}
            {leftNav.map(item => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${
                    isActive ? 'text-[#1A1A1A] font-bold' : 'text-[#5f5e5e] opacity-70'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                </Link>
              );
            })}

            {/* Center FAB — 海选页隐藏，避免与选择条重叠；提交关闭时对已登录用户隐藏，游客始终显示登录 */}
            {!loading && (showSubmitButton || !user) && pathname !== '/preliminary' && (
              <button
                onClick={handleActionClick}
                className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 -mt-5 rounded-2xl shadow-lg active:scale-95 transition-all ${
                  user
                    ? 'bg-[#1A1A1A] text-white'
                    : 'bg-[#1A1A1A] text-white'
                }`}
              >
                {user ? <Plus size={22} strokeWidth={2.5} /> : <LogIn size={20} strokeWidth={2} />}
                <span className="text-[9px] font-bold leading-tight">{user ? t.nav.submit : t.nav.login}</span>
              </button>
            )}

            {/* Right 2 tabs */}
            {rightNav.map(item => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${
                    isActive ? 'text-[#1A1A1A] font-bold' : 'text-[#5f5e5e] opacity-70'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        );
      })()}
    </>
  );
}
