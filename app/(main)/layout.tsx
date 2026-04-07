'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/sidebar/Sidebar';
import { LanguageProvider } from '@/components/LanguageProvider';
import { AlertCircle } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';

// 懒加载 SubmitModal — 包含 pinyin-pro 和 react-markdown，体积大，用户不一定会打开
const SubmitModal = dynamic(() => import('@/components/submit/SubmitModal'), { ssr: false });

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitTrack, setSubmitTrack] = useState<'optimizer' | 'builder' | undefined>(undefined);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { user } = useUser();

  // 监听来自页面的提交 Demo 事件，支持传入初始赛道
  useEffect(() => {
    const handleOpenSubmit = (e: Event) => {
      const track = (e as CustomEvent).detail?.track as 'optimizer' | 'builder' | undefined;
      handleSubmitClick(track);
    };
    window.addEventListener('openSubmit', handleOpenSubmit);
    return () => window.removeEventListener('openSubmit', handleOpenSubmit);
  }, [user]);

  const handleSubmitClick = (track?: 'optimizer' | 'builder') => {
    if (user) {
      setSubmitTrack(track);
      setShowSubmit(true);
    } else {
      setShowLoginPrompt(true);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-surface">
      <Sidebar onSubmitClick={() => handleSubmitClick()} />
      <main className="md:ml-64 h-screen overflow-y-auto custom-scrollbar bg-surface relative">
        <div className="min-h-full pt-6 pb-16 md:pb-0">
          {children}
        </div>
      </main>

      {/* 提交弹窗 - 懒加载 */}
      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} initialTrack={submitTrack} />}

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
