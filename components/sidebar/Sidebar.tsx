'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  department: string;
  role: string;
}

const NAV_ITEMS = [
  { href: '/guide', label: 'Guide', icon: 'explore' },
  { href: '/gallery', label: 'Gallery', icon: 'grid_view' },
  { href: '/leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
  { href: '/square', label: 'Square', icon: 'grid_guides' },
];

export default function Sidebar({ onSubmitClick }: { onSubmitClick: () => void }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setUser(d.user))
      .catch(() => {});
  }, []);

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
              <span
                className="material-symbols-outlined text-[20px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 400" } : { fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                {item.icon}
              </span>
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
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>add</span>
          <span className="font-headline italic tracking-tight text-base">Submit Proposal</span>
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
