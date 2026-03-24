'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { pinyin } from 'pinyin-pro';

interface UserOption {
  id: number;
  name: string;
  department: string;
}

export default function EntryPortal() {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/users')
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = users.filter(u => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    // Match by Chinese name
    if (u.name.includes(q)) return true;
    // Match by pinyin
    const fullPinyin = pinyin(u.name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
    const initials = pinyin(u.name, { pattern: 'first', toneType: 'none', type: 'array' }).join('').toLowerCase();
    return fullPinyin.includes(q) || initials.includes(q);
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) {
      setError('请选择你的薯名');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedUser.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '登录失败');
        return;
      }
      router.push('/guide');
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }

  function selectUser(user: UserOption) {
    setSelectedUser(user);
    setQuery(user.name);
    setShowDropdown(false);
    setError('');
  }

  return (
    <main className="relative h-screen w-full flex items-center justify-center p-6 sm:p-12 bg-surface overflow-hidden">
      {/* Top-Left Branding */}
      <div className="absolute top-12 left-12 flex flex-col gap-2 z-20">
        <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tight">AI Demo Day</h2>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs-caps font-medium text-outline/60">Xiaohongshu Strategy</span>
          <span className="text-xs-caps font-medium text-outline/60">Investment / User Research</span>
        </div>
      </div>

      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.1] pointer-events-none overflow-hidden">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #767c74 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      {/* Registration Card */}
      <div className="relative z-10 w-full max-w-md bg-white p-12 sm:p-16 flex flex-col gap-10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] border border-surface-container-high">
        <header className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-headline text-4xl font-bold leading-tight text-on-surface">Registration</h1>
            <p className="text-base text-on-surface-variant/80 chinese-text">请输入你的薯名和部门</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Name Input with Autocomplete */}
          <div className="flex flex-col gap-2 relative">
            <label className="text-xs-caps font-bold text-outline tracking-widest" htmlFor="username">薯名</label>
            <input
              ref={inputRef}
              className="minimal-input w-full text-lg font-headline italic focus:outline-none"
              id="username"
              placeholder="e.g. 恒宇"
              type="text"
              autoComplete="off"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setSelectedUser(null);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && filteredUsers.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-container-high shadow-lg max-h-48 overflow-y-auto z-50 rounded-lg"
              >
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-surface-container-low transition-colors flex justify-between items-center"
                    onClick={() => selectUser(u)}
                  >
                    <span className="font-headline text-base">{u.name}</span>
                    <span className="text-xs text-outline chinese-text">{u.department}</span>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && query && filteredUsers.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-container-high shadow-lg z-50 rounded-lg px-4 py-3 text-sm text-outline">
                未找到匹配用户
              </div>
            )}
          </div>

          {/* Department (auto-filled) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs-caps font-bold text-outline tracking-widest" htmlFor="department">部门</label>
            <input
              className="minimal-input w-full text-sm bg-transparent chinese-text"
              id="department"
              value={selectedUser?.department || ''}
              placeholder="选择薯名后自动填充"
              readOnly
            />
          </div>

          {/* Error */}
          {error && <p className="text-error text-sm">{error}</p>}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !selectedUser}
              className="w-full bg-on-surface text-white py-5 px-8 flex items-center justify-center transition-all duration-300 hover:opacity-90 active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-xs-caps font-bold tracking-[0.2em]">
                {loading ? 'ENTERING...' : 'ENTER'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Left Edge Decoration */}
      <div className="fixed left-0 top-0 h-full w-1 bg-on-surface/5" />
    </main>
  );
}
