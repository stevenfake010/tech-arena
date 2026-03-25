'use client';

import { useState } from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import SubmitModal from '@/components/submit/SubmitModal';
import { LanguageProvider } from '@/components/LanguageProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [showSubmit, setShowSubmit] = useState(false);

  return (
    <LanguageProvider>
      <div className="h-screen overflow-hidden bg-surface">
        <Sidebar onSubmitClick={() => setShowSubmit(true)} />
        <main className="ml-64 h-screen overflow-y-auto custom-scrollbar bg-surface relative">
          {/* 语言切换按钮 - 右上角 */}
          <div className="absolute top-4 right-4 z-40">
            <LanguageSwitcher />
          </div>
          <div className="min-h-full pt-12">
            {children}
          </div>
        </main>
        {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} />}
      </div>
    </LanguageProvider>
  );
}
