'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { pinyin } from 'pinyin-pro';
import { LanguageProvider, useLanguage } from '@/components/LanguageProvider';
// import LanguageSwitcher from '@/components/LanguageSwitcher';

interface UserOption {
  id: number;
  name: string;
  department: string;
}

function EntryPortalContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/users')
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setApiError('API Error: ' + d.error);
        } else {
          setUsers(d.users || []);
        }
      })
      .catch(e => setApiError('Network Error: ' + e.message));
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
    if (u.name.includes(q)) return true;
    const fullPinyin = pinyin(u.name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
    const initials = pinyin(u.name, { pattern: 'first', toneType: 'none', type: 'array' }).join('').toLowerCase();
    return fullPinyin.includes(q) || initials.includes(q);
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) {
      setError(t.login.errorNoUser);
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
        setError(data.error || t.login.errorNetwork);
        return;
      }
      router.push('/guide');
    } catch {
      setError(t.login.errorNetwork);
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
    <main className="relative h-screen w-full bg-surface overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none overflow-hidden">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #767c74 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 px-12 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-headline font-bold tracking-tight text-on-surface">{t.login.title}</h1>
            <p className="text-base text-on-surface-variant mt-1">{t.login.subtitle}</p>
          </div>
          {/* <LanguageSwitcher /> */}
        </div>
      </header>

      {/* Main Content - Registration Card */}
      <div className="relative z-10 h-full flex items-center justify-center p-6 sm:p-12 pt-24">
        <div className="w-full max-w-md bg-white p-10 sm:p-12 flex flex-col gap-8 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-surface-container-high/50">
          <header className="flex flex-col gap-3">
            <h2 className="text-3xl font-headline font-bold leading-tight text-on-surface">{t.login.registration}</h2>
            <p className="text-base text-on-surface-variant">{t.login.description}</p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Name Input with Autocomplete */}
            <div className="flex flex-col gap-2 relative">
              <label className="text-sm font-semibold text-outline tracking-wide" htmlFor="username">{t.login.nameLabel}</label>
              <input
                ref={inputRef}
                className="w-full px-0 py-3 text-base text-on-surface bg-transparent border-0 border-b-2 border-outline/30 focus:border-primary focus:outline-none transition-colors placeholder:text-outline/40"
                id="username"
                placeholder={t.login.namePlaceholder}
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
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-surface-container-high shadow-xl max-h-48 overflow-y-auto z-50 rounded-lg"
                >
                  {filteredUsers.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-surface-container-low transition-colors flex justify-between items-center"
                      onClick={() => selectUser(u)}
                    >
                      <span className="text-base font-medium text-on-surface">{u.name}</span>
                      <span className="text-xs text-outline">{u.department}</span>
                    </button>
                  ))}
                </div>
              )}
              {showDropdown && query && filteredUsers.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-surface-container-high shadow-xl z-50 rounded-lg px-4 py-3 text-sm text-outline">
                  {t.login.notFound}
                </div>
              )}
            </div>

            {/* Department (auto-filled) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-outline tracking-wide" htmlFor="department">{t.login.deptLabel}</label>
              <input
                className="w-full px-0 py-3 text-base text-on-surface bg-transparent border-0 border-b-2 border-outline/30 focus:outline-none placeholder:text-outline/40"
                id="department"
                value={selectedUser?.department || ''}
                placeholder={t.login.deptPlaceholder}
                readOnly
              />
            </div>

            {/* API Error */}
            {apiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">{apiError}</p>
              </div>
            )}

            {/* Error */}
            {error && <p className="text-error text-sm">{error}</p>}

            {/* Submit Button */}
            <div className="pt-4 space-y-3">
              <button
                type="submit"
                disabled={loading || !selectedUser}
                className="w-full bg-on-surface text-white py-4 px-8 flex items-center justify-center transition-all duration-300 hover:opacity-90 active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
              >
                <span className="text-sm font-semibold tracking-wider">
                  {loading ? t.login.submitting : t.login.submit}
                </span>
              </button>
              
              {/* 游客入口 */}
              <button
                type="button"
                onClick={async () => {
                  // 调用 logout API 清除 httpOnly cookie
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/guide');
                }}
                className="w-full py-3 px-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors text-sm"
              >
                {t.login.guestEntry}
              </button>
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
      <EntryPortalContent />
    </LanguageProvider>
  );
}
