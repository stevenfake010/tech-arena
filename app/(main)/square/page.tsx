'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

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

export default function SquarePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newContent, setNewContent] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;

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
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to post message:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpvote(messageId: number) {
    try {
      const res = await fetch(`/api/messages/${messageId}/upvote`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to upvote:', error);
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
    <div className="p-12 max-w-4xl">
      {/* Header */}
      <header className="mb-10">
        <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface mb-6">Square</h2>
        <p className="text-on-surface-variant text-lg leading-relaxed">
          发布你的需求、想法或寻找合作伙伴。
        </p>
      </header>

      {/* Message Entry Section */}
      <section className="mb-12 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="标题（可选）"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full bg-transparent border-none border-b border-outline/30 focus:ring-0 focus:border-primary text-base font-headline font-medium mb-3 p-0 placeholder:text-outline"
            />
            <textarea
              placeholder="分享你的需求或想法..."
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-outline p-0 text-base resize-none h-24"
            />
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10">
            <span className="text-xs text-outline">支持 Markdown 格式</span>
            <button
              type="submit"
              disabled={submitting || !newContent.trim()}
              className="px-6 py-2 bg-on-surface text-surface rounded-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50"
            >
              {submitting ? '发布中...' : 'Post Need'}
            </button>
          </div>
        </form>
      </section>

      {/* Message List */}
      <div className="space-y-0">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            <p>暂无消息，来发布第一条需求吧！</p>
          </div>
        ) : (
          messages.map(message => (
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
                </div>
                {message.title && (
                  <h3 className="text-xl font-headline font-bold text-on-surface mb-2 leading-snug">
                    {message.title}
                  </h3>
                )}
                <p className="text-on-surface-variant text-lg leading-relaxed whitespace-pre-wrap chinese-text">
                  {message.content}
                </p>
              </div>
              <div className="flex flex-col items-center ml-6">
                <button
                  onClick={() => handleUpvote(message.id)}
                  className="w-12 h-12 rounded-xl border border-outline-variant/30 flex flex-col items-center justify-center hover:bg-surface-container-high transition-colors active:scale-95"
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
            onClick={fetchMessages}
            className="text-[10px] uppercase tracking-[0.3em] text-outline hover:text-on-surface transition-colors"
          >
            刷新列表
          </button>
        </footer>
      )}
    </div>
  );
}
