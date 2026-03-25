'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, Translations } from '@/lib/i18n';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('zh');

  // 从 localStorage 读取语言设置
  useEffect(() => {
    const saved = localStorage.getItem('demo-day-lang') as Language;
    if (saved && (saved === 'zh' || saved === 'en')) {
      setLang(saved);
    }
  }, []);

  // 保存语言设置
  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('demo-day-lang', newLang);
  };

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
