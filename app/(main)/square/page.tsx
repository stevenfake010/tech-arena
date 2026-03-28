'use client';

import { useState } from 'react';
import { ArrowUp, AlertCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useUser } from '@/lib/hooks/useUser';

interface Message {
  id: number;
  title: string | null;
  content: string;
  category: string | null;
  author_id: number;
  author_name: string;
  author_dept: string;
  upvote_count: number;
  created_at: string;
  hasUpvoted?: boolean;
}

const messagesFetcher = (url: string) => fetch(url).then(r => r.json()).then(d => d.messages || []);

export default function SquarePage() {
  const { user } = useUser();
  const { data: messages = [], mutate: mutateMessages, isLoading: loading } = useSWR<Message[]>(
    '/api/messages',
    messagesFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const [newContent, setNewContent] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [sortOrder, setSortOrder] = useState<'time' | 'hot'>('time');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;

    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle || null,
          content: newContent,
          category: null
        }),
      });
      if (res.ok) {
        setNewContent('');
        setNewTitle('');
        mutateMessages(); // SWR 重新请求
      }
    } catch (error) {
      console.error('Failed to post message:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpvote(messageId: number) {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    // 判断当前是否已点赞，决定是 +1 还是 -1
    const currentMessage = messages.find(m => m.id === messageId);
    const alreadyUpvoted = currentMessage?.hasUpvoted ?? false;
    const delta = alreadyUpvoted ? -1 : 1;

    // 乐观更新：先在本地更新计数和状态
    mutateMessages(
      (current) => current?.map(m =>
        m.id === messageId
          ? { ...m, upvote_count: m.upvote_count + delta, hasUpvoted: !alreadyUpvoted }
          : m
      ),
      false // 不触发重新请求，避免浏览器缓存覆盖乐观更新
    );

    try {
      const res = await fetch(`/api/messages/${messageId}/upvote`, { method: 'POST' });
      if (!res.ok) {
        // 请求失败，回滚：重新从服务器获取真实数据
        mutateMessages();
      }
      // 成功时不立即 revalidate，让 SWR 在下次自然刷新时更新
      // 避免因缓存时序问题导致计数闪烁
    } catch (error) {
      console.error('Failed to upvote:', error);
      mutateMessages(); // 网络错误，回滚
    }
  }

  async function handleDelete(messageId: number) {
    if (!user) return;

    setDeletingId(messageId);
    try {
      const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
      if (res.ok) {
        // 乐观删除
        mutateMessages(
          (current) => current?.filter(m => m.id !== messageId),
          false
        );
        setShowDeleteConfirm(null);
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-on-surface-variant">加载中...</div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-12 pb-20 md:pb-12 max-w-4xl">
      {/* Header */}
      <header className="flex-shrink-0 mb-8 pt-4 pb-2">
        <div>
          <h2 className="font-headline text-2xl md:text-4xl font-bold tracking-tight text-on-surface">Discussion Square</h2>
          <p className="text-base text-on-surface-variant mt-2">
            许愿你最想要的 AI 需求、发布你的 AI 想法、或者聊任何你想聊的
          </p>
        </div>
      </header>

      {/* Message Entry Section */}
      <section className="mb-8 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm">
        {user ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                placeholder="标题（可选）"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-transparent border-none border-b border-outline/30 focus:ring-0 focus:border-primary text-base font-headline font-medium mb-2 p-0 placeholder:text-outline"
              />
              <textarea
                placeholder="分享你的需求或想法..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-outline p-0 text-base resize-none h-16"
              />
            </div>
            <div className="flex justify-end items-center pt-2 border-t border-outline-variant/10">
              <button
                type="submit"
                disabled={submitting || !newContent.trim()}
                className="px-6 py-2 bg-on-surface text-surface rounded-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50"
              >
                {submitting ? '发布中...' : '发布'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <p className="text-on-surface-variant mb-3">游客模式只能浏览，无法发布内容</p>
            <button
              onClick={() => setShowLoginPrompt(true)}
              className="px-6 py-2 bg-primary text-on-primary rounded-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              登录后发布
            </button>
          </div>
        )}
      </section>

      {/* Sort Controls */}
      {messages.length > 0 && (
        <div className="flex items-center gap-1 mb-4">
          <span className="text-xs text-outline mr-2">排序：</span>
          {(['time', 'hot'] as const).map(order => (
            <button
              key={order}
              onClick={() => setSortOrder(order)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortOrder === order
                  ? 'bg-on-surface text-surface'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {order === 'time' ? '最新' : '热度'}
            </button>
          ))}
        </div>
      )}

      {/* Message List */}
      <div className="space-y-0">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            <p>暂无消息，来发布第一条需求吧！</p>
          </div>
        ) : (
          [...messages]
            .sort((a, b) =>
              sortOrder === 'hot'
                ? b.upvote_count - a.upvote_count
                : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            .map(message => (
            <article key={message.id} className="py-8 border-b border-outline-variant/20 flex group">
              <div className="flex-1">
                <div className="flex items-center gap-x-2 mb-2">
                  <span className="font-bold text-base text-on-surface chinese-text">{message.author_name}</span>
                  <span className="text-outline text-sm">• {formatTimeAgo(message.created_at)}</span>
                  {message.category && (
                    <span className="px-2 py-0.5 bg-secondary/5 text-secondary text-xs font-bold uppercase tracking-wide rounded-sm ml-2">
                      {message.category}
                    </span>
                  )}
                  {user && user.id === message.author_id && (
                    <button
                      onClick={() => setShowDeleteConfirm(message.id)}
                      className="ml-auto p-1.5 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                {message.title && (
                  <h3 className="text-xl font-headline font-bold text-on-surface mb-2 leading-snug">
                    {message.title}
                  </h3>
                )}
                <p className="text-on-surface-variant text-base leading-relaxed whitespace-pre-wrap chinese-text">
                  {message.content}
                </p>
              </div>
              <div className="flex flex-col items-center ml-6">
                <button
                  onClick={() => handleUpvote(message.id)}
                  className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                    message.hasUpvoted
                      ? 'bg-secondary text-on-secondary border-secondary'
                      : 'border-outline-variant/30 hover:bg-surface-container-high hover:border-secondary/40'
                  }`}
                >
                  <ArrowUp size={18} />
                  <span className="text-xs font-bold">{message.upvote_count}</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>


      {/* Footer */}
      {messages.length > 0 && (
        <footer className="mt-12 pb-12 text-center">
          <button
            onClick={() => mutateMessages()}
            className="text-[10px] uppercase tracking-[0.3em] text-outline hover:text-on-surface transition-colors"
          >
            刷新列表
          </button>
        </footer>
      )}

      {/* 登录提示弹窗 */}
      {showLoginPrompt && (
        <LoginPrompt onClose={() => setShowLoginPrompt(false)} />
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <DeleteConfirm
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => handleDelete(showDeleteConfirm)}
          deleting={deletingId === showDeleteConfirm}
        />
      )}
    </div>
  );
}

// 登录提示组件
function LoginPrompt({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center gap-3 mb-4 text-primary">
          <AlertCircle size={24} />
          <h3 className="text-lg font-headline font-bold">需要登录</h3>
        </div>
        <p className="text-on-surface-variant mb-6">
          游客模式无法发表内容或点赞，请先登录。
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
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
  );
}

// 删除确认组件
function DeleteConfirm({ onClose, onConfirm, deleting }: { onClose: () => void; onConfirm: () => void; deleting: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center gap-3 mb-4 text-error">
          <Trash2 size={24} />
          <h3 className="text-lg font-headline font-bold">确认删除</h3>
        </div>
        <p className="text-on-surface-variant mb-6">
          删除后无法恢复，确定要删除这条留言吗？
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-lg bg-error text-white hover:bg-error-dim transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? '删除中...' : '删除'}
          </button>
        </div>
      </div>
    </div>
  );
}
