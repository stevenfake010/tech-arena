'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Compass, LayoutGrid, Trophy, MessageSquare, Plus } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

interface User {
  id: number;
  name: string;
  department: string;
  role: string;
}

export default function Sidebar({ onSubmitClick }: { onSubmitClick: () => void }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setUser(d.user))
      .catch(() => {});
  }, []);

  const NAV_ITEMS = [
    { href: '/guide', label: t.nav.guide, icon: Compass },
    { href: '/gallery', label: t.nav.gallery, icon: LayoutGrid },
    { href: '/leaderboard', label: t.nav.leaderboard, icon: Trophy },
    { href: '/square', label: t.nav.square, icon: MessageSquare },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f3f4ee] flex flex-col py-8 px-6 gap-y-4 z-50">
      {/* Branding */}
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-headline font-bold italic text-[#1A1A1A] leading-tight">AI Demo Day</h1>
        <div className="mt-3 space-y-1">
          <p className="font-headline italic text-sm leading-relaxed text-[#5f5e5e] tracking-normal">Xiaohongshu</p>
          <p className="font-headline italic text-sm leading-relaxed text-[#5f5e5e] tracking-normal">Strategy</p>
          <p className="font-headline italic text-sm leading-relaxed text-[#5f5e5e] tracking-normal">Investment</p>
          <p className="font-headline italic text-sm leading-relaxed text-[#5f5e5e] tracking-normal">User Research</p>
        </div>
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

      {/* Submit Button */}
      <div className="px-2 mb-4">
        <button
          onClick={onSubmitClick}
          className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] text-white py-3 px-4 rounded-lg hover:opacity-90 transition-all shadow-sm group active:scale-95"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="font-headline tracking-tight text-base">{t.nav.submit}</span>
        </button>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-headline font-bold text-lg text-on-surface chinese-text">{user.name}</span>
              <span className="text-xs text-on-surface-variant uppercase tracking-wider mt-0.5 font-medium chinese-text">{user.department}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
