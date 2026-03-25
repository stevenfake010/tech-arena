'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/sidebar/Sidebar';
import SubmitModal from '@/components/submit/SubmitModal';
import { LanguageProvider } from '@/components/LanguageProvider';
// import LanguageSwitcher from '@/components/LanguageSwitcher';
import { AlertCircle } from 'lucide-react';

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showSubmit, setShowSubmit] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setUser(d.user))
      .catch(() => {});
  }, []);

  // 监听来自 my-demos 页面的提交 Demo 事件
  useEffect(() => {
    const handleOpenSubmit = () => {
      handleSubmitClick();
    };
    window.addEventListener('openSubmit', handleOpenSubmit);
    return () => window.removeEventListener('openSubmit', handleOpenSubmit);
  }, [user]);

  const handleSubmitClick = () => {
    if (user) {
      setShowSubmit(true);
    } else {
      setShowLoginPrompt(true);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-surface">
      <Sidebar onSubmitClick={handleSubmitClick} />
      <main className="ml-64 h-screen overflow-y-auto custom-scrollbar bg-surface relative">
        {/* 语言切换按钮 - 暂时隐藏 */}
        {/* <div className="absolute top-4 right-4 z-40">
          <LanguageSwitcher />
        </div> */}
        <div className="min-h-full pt-6">
          {children}
        </div>
      </main>
      
      {/* 提交弹窗 */}
      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} />}
      
      {/* 登录提示弹窗 */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">需要登录</h3>
            </div>
            <p className="text-on-surface-variant mb-6">
              游客模式只能浏览内容，提交 Demo 需要先登录。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                继续浏览
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-dim transition-colors"
              >
                去登录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </LanguageProvider>
  );
}
