'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.user) {
          router.push('/');
          return;
        }
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        router.push('/');
      });
  }, [router]);

  async function generateTestData() {
    setSeedLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: data.message });
      } else {
        setResult({ type: 'error', message: data.error || '生成失败' });
      }
    } catch (error) {
      setResult({ type: 'error', message: '网络错误' });
    } finally {
      setSeedLoading(false);
    }
  }

  async function clearTestData() {
    if (!confirm('确定要删除所有测试数据吗？这将清空所有项目、投票和留言！')) {
      return;
    }
    setClearLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/clear-test-data', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResult({ 
          type: 'success', 
          message: `${data.message} 共删除 ${data.results.deleted.total} 条记录。` 
        });
      } else {
        setResult({ type: 'error', message: data.error || '清理失败' });
      }
    } catch (error) {
      setResult({ type: 'error', message: '网络错误' });
    } finally {
      setClearLoading(false);
    }
  }

  if (loading) {
    return <div className="p-12">加载中...</div>;
  }

  return (
    <div className="p-12 max-w-4xl">
      <header className="mb-12">
        <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface mb-6">管理员面板</h2>
        <p className="text-on-surface-variant text-lg chinese-text">
          当前用户: {user?.name} ({user?.role === 'pro_judge' ? '评委' : '普通用户'})
        </p>
      </header>

      {result && (
        <div className={`mb-8 p-4 rounded-lg ${
          result.type === 'success' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
        }`}>
          <div className="flex items-center gap-2">
            {result.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{result.message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 生成测试数据 */}
        <div className="bg-surface-container-low p-8 rounded-xl">
          <h3 className="font-headline text-2xl font-bold mb-4 text-on-surface">生成测试数据</h3>
          <p className="text-on-surface-variant mb-6 text-base chinese-text">
            自动生成以下内容：
          </p>
          <ul className="text-sm text-on-surface-variant space-y-2 mb-8">
            <li className="flex items-center gap-2">
              <Check size={16} className="text-secondary" />
              10 个 Optimizer 赛道项目
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-secondary" />
              10 个 Builder 赛道项目
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-secondary" />
              8 条测试留言
            </li>
          </ul>
          <button
            onClick={generateTestData}
            disabled={seedLoading}
            className="w-full py-4 bg-primary text-on-primary rounded-lg font-bold uppercase tracking-widest hover:bg-primary-dim transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {seedLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                生成测试数据
              </>
            )}
          </button>
        </div>

        {/* 清理测试数据 */}
        <div className="bg-surface-container-low p-8 rounded-xl border border-error/20">
          <h3 className="font-headline text-2xl font-bold mb-4 text-on-surface">⚠️ 清理测试数据</h3>
          <p className="text-on-surface-variant mb-6 text-base chinese-text">
            这将删除以下内容（不可恢复）：
          </p>
          <ul className="text-sm text-on-surface-variant space-y-2 mb-8">
            <li className="flex items-center gap-2">
              <Trash2 size={16} className="text-error" />
              所有 Demo 项目
            </li>
            <li className="flex items-center gap-2">
              <Trash2 size={16} className="text-error" />
              所有投票记录
            </li>
            <li className="flex items-center gap-2">
              <Trash2 size={16} className="text-error" />
              所有留言和点赞
            </li>
          </ul>
          <button
            onClick={clearTestData}
            disabled={clearLoading}
            className="w-full py-4 bg-error text-on-error rounded-lg font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {clearLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                清理中...
              </>
            ) : (
              <>
                <Trash size={16} />
                一键清理
              </>
            )}
          </button>
        </div>
      </div>

      {/* 快捷链接 */}
      <div className="mt-12 pt-8 border-t border-outline-variant/20">
        <h4 className="font-headline text-xl font-bold mb-4 text-on-surface">快捷导航</h4>
        <div className="flex gap-4">
          <a href="/gallery" className="px-6 py-3 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-2">
            <LayoutGrid size={16} />
            查看 Gallery
          </a>
          <a href="/leaderboard" className="px-6 py-3 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-2">
            <Trophy size={16} />
            查看排行榜
          </a>
          <a href="/square" className="px-6 py-3 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-2">
            <MessageSquare size={16} />
            查看留言板
          </a>
        </div>
      </div>
    </div>
  );
}
