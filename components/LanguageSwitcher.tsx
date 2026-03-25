'use client';

import { useLanguage } from './LanguageProvider';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors text-sm font-medium text-on-surface"
      title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <Globe size={16} />
      <span>{lang === 'zh' ? 'EN' : '中'}</span>
    </button>
  );
}
