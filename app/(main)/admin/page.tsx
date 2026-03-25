'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, AlertCircle, Check, Loader2, PlusCircle, Trash2, Trash, 
  LayoutGrid, Trophy, MessageSquare, Search, ChevronLeft, ChevronRight,
  X, ExternalLink, Lock, Unlock, Clock
} from 'lucide-react';

interface Demo {
  id: number;
  name: string;
  summary: string;
  track: string;
  submitter1_name: string;
  submitter1_dept: string;
  submitter2_name: string | null;
  created_at: string;
}

interface Message {
  id: number;
  title: string | null;
  content: string;
  author: { name: string; department: string } | null;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'demos' | 'messages' | 'tools'>('demos');
  
  // Demos 管理
  const [demos, setDemos] = useState<Demo[]>([]);
  const [demosPage, setDemosPage] = useState(1);
  const [demosTotal, setDemosTotal] = useState(0);
  const [demosSearch, setDemosSearch] = useState('');
  const [demosLoading, setDemosLoading] = useState(false);
  const [demoToDelete, setDemoToDelete] = useState<Demo | null>(null);
  
  // Messages 管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesTotal, setMessagesTotal] = useState(0);
  const [messagesSearch, setMessagesSearch] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  
  // 工具
  const [seedLoading, setSeedLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearVotesLoading, setClearVotesLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // 投票控制
  const [votingStatus, setVotingStatus] = useState<{
    isVotingOpen: boolean;
    notice: string;
    error?: string;
  } | null>(null);
  const [votingLoading, setVotingLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [editingNotice, setEditingNotice] = useState('');
  const [isEditingNotice, setIsEditingNotice] = useState(false);

  // 验证权限
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.user || data.user.role !== 'admin') {
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

  // 加载 Demos
  const loadDemos = async () => {
    setDemosLoading(true);
    try {
      const res = await fetch(`/api/admin/demos?page=${demosPage}&search=${encodeURIComponent(demosSearch)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDemos(data.demos);
      setDemosTotal(data.total);
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setDemosLoading(false);
    }
  };

  // 加载 Messages
  const loadMessages = async () => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/admin/messages?page=${messagesPage}&search=${encodeURIComponent(messagesSearch)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(data.messages);
      setMessagesTotal(data.total);
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && activeTab === 'demos') {
      loadDemos();
    }
  }, [demosPage, demosSearch, activeTab, loading]);

  useEffect(() => {
    if (!loading && activeTab === 'messages') {
      loadMessages();
    }
  }, [messagesPage, messagesSearch, activeTab, loading]);

  // 加载投票状态
  const loadVotingStatus = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setVotingStatus(data);
      setEditingNotice(data.notice || '');
      setNeedsSetup(data.error === 'TABLE_NOT_FOUND');
    } catch (error) {
      console.error('Failed to load voting status:', error);
    }
  };

  useEffect(() => {
    if (!loading && activeTab === 'tools') {
      loadVotingStatus();
    }
  }, [activeTab, loading]);

  // 初始化 site_config 表
  const setupConfig = async () => {
    setSetupLoading(true);
    try {
      const res = await fetch('/api/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: '配置表初始化成功' });
        loadVotingStatus();
      } else {
        setResult({ type: 'error', message: data.error || '初始化失败' });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setSetupLoading(false);
    }
  };

  // 切换投票开关
  const toggleVoting = async (enabled: boolean) => {
    setVotingLoading(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: enabled ? '投票已开启' : '投票已关闭' });
        loadVotingStatus();
      } else {
        setResult({ type: 'error', message: data.error || '操作失败' });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setVotingLoading(false);
    }
  };

  // 保存公告
  const saveNotice = async () => {
    setVotingLoading(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notice: editingNotice }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: '公告已更新' });
        setIsEditingNotice(false);
        loadVotingStatus();
      } else {
        setResult({ type: 'error', message: data.error || '保存失败' });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setVotingLoading(false);
    }
  };

  // 删除 Demo
  async function deleteDemo(demo: Demo) {
    try {
      const res = await fetch(`/api/admin/demos?id=${demo.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ type: 'success', message: `项目 "${demo.name}" 已删除` });
      setDemoToDelete(null);
      loadDemos();
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    }
  }

  // 删除 Message
  async function deleteMessage(message: Message) {
    try {
      const res = await fetch(`/api/admin/messages?id=${message.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ type: 'success', message: '留言已删除' });
      setMessageToDelete(null);
      loadMessages();
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    }
  }

  // 生成测试数据
  async function generateTestData() {
    setSeedLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: data.message });
        if (activeTab === 'demos') loadDemos();
        if (activeTab === 'messages') loadMessages();
      } else {
        setResult({ type: 'error', message: data.error || '生成失败' });
      }
    } catch {
      setResult({ type: 'error', message: '网络错误' });
    } finally {
      setSeedLoading(false);
    }
  }

  // 清理测试数据
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
        setResult({ type: 'success', message: `${data.message} 共删除 ${data.results.deleted.total} 条记录。` });
        if (activeTab === 'demos') loadDemos();
        if (activeTab === 'messages') loadMessages();
      } else {
        setResult({ type: 'error', message: data.error || '清理失败' });
      }
    } catch {
      setResult({ type: 'error', message: '网络错误' });
    } finally {
      setClearLoading(false);
    }
  }

  // 清空所有投票
  async function clearAllVotes() {
    if (!confirm('确定要清空所有投票记录吗？\n\n⚠️ 此操作不可恢复，所有用户的投票数据将被清除。')) {
      return;
    }
    setClearVotesLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/votes', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: data.message });
      } else {
        setResult({ type: 'error', message: data.error || '清空失败' });
      }
    } catch {
      setResult({ type: 'error', message: '网络错误' });
    } finally {
      setClearVotesLoading(false);
    }
  }

  // 格式化日期
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 截断文本
  function truncate(text: string, maxLength: number) {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <Loader2 size={24} className="animate-spin" />
          <span>验证权限中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-surface-container-low border-b border-outline-variant/20">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-headline font-bold text-on-surface mb-2">管理员后台</h1>
              <p className="text-on-surface-variant">
                当前用户: <span className="font-medium text-on-surface">{user?.name}</span>
                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">管理员</span>
              </p>
            </div>
            <div className="flex gap-3">
              <a href="/gallery" className="px-4 py-2 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-2 text-sm">
                <LayoutGrid size={16} />
                Gallery
              </a>
              <a href="/square" className="px-4 py-2 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-2 text-sm">
                <MessageSquare size={16} />
                Square
              </a>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 flex gap-1">
          {[
            { id: 'demos', label: '项目管理', icon: LayoutGrid, count: demosTotal },
            { id: 'messages', label: '留言管理', icon: MessageSquare, count: messagesTotal },
            { id: 'tools', label: '工具箱', icon: Trophy, count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count !== null && (
                <span className="ml-1 px-1.5 py-0.5 bg-surface-container-high rounded text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        {/* Alert Messages */}
        {result && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            result.type === 'success' 
              ? 'bg-secondary-container text-on-secondary-container' 
              : 'bg-error-container text-on-error-container'
          }`}>
            {result.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{result.message}</span>
            <button onClick={() => setResult(null)} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Demos Tab */}
        {activeTab === 'demos' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type="text"
                  placeholder="搜索项目名称或提交人..."
                  value={demosSearch}
                  onChange={(e) => {
                    setDemosSearch(e.target.value);
                    setDemosPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Demos Table */}
            <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden">
              {demosLoading ? (
                <div className="p-12 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-on-surface-variant" />
                </div>
              ) : demos.length === 0 ? (
                <div className="p-12 text-center text-on-surface-variant">
                  <LayoutGrid size={48} className="mx-auto mb-4 opacity-30" />
                  <p>暂无项目数据</p>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead className="bg-surface-container-high/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">项目名称</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">赛道</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">提交人</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">提交时间</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-on-surface-variant">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {demos.map((demo) => (
                        <tr key={demo.id} className="hover:bg-surface-container-high/30 transition-colors">
                          <td className="px-4 py-3 text-sm text-on-surface-variant">#{demo.id}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-on-surface">{demo.name}</div>
                            <div className="text-xs text-on-surface-variant mt-0.5">{truncate(demo.summary, 40)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              demo.track === 'optimizer'
                                ? 'bg-secondary/10 text-secondary'
                                : 'bg-tertiary/10 text-tertiary'
                            }`}>
                              {demo.track === 'optimizer' ? 'Optimizer' : 'Builder'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">{demo.submitter1_name}</div>
                            <div className="text-xs text-on-surface-variant">{demo.submitter1_dept}</div>
                            {demo.submitter2_name && (
                              <div className="text-xs text-on-surface-variant mt-1">+ {demo.submitter2_name}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-on-surface-variant">{formatDate(demo.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setDemoToDelete(demo)}
                              className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div className="px-4 py-3 border-t border-outline-variant/10 flex items-center justify-between">
                    <div className="text-sm text-on-surface-variant">
                      共 {demosTotal} 条记录
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDemosPage(p => Math.max(1, p - 1))}
                        disabled={demosPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-outline-variant/30 disabled:opacity-30 hover:bg-surface-container-high transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-3 py-1.5 text-sm">第 {demosPage} 页</span>
                      <button
                        onClick={() => setDemosPage(p => p + 1)}
                        disabled={demos.length < 20}
                        className="px-3 py-1.5 rounded-lg border border-outline-variant/30 disabled:opacity-30 hover:bg-surface-container-high transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type="text"
                  placeholder="搜索留言内容..."
                  value={messagesSearch}
                  onChange={(e) => {
                    setMessagesSearch(e.target.value);
                    setMessagesPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Messages List */}
            <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden">
              {messagesLoading ? (
                <div className="p-12 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-on-surface-variant" />
                </div>
              ) : messages.length === 0 ? (
                <div className="p-12 text-center text-on-surface-variant">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                  <p>暂无留言数据</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-outline-variant/10">
                    {messages.map((message) => (
                      <div key={message.id} className="p-4 hover:bg-surface-container-high/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-on-surface">{message.author?.name || '未知用户'}</span>
                              <span className="text-xs text-on-surface-variant">{message.author?.department}</span>
                              <span className="text-xs text-on-surface-variant">·</span>
                              <span className="text-xs text-on-surface-variant">{formatDate(message.created_at)}</span>
                              <span className="text-xs text-on-surface-variant">· #{message.id}</span>
                            </div>
                            {message.title && (
                              <h4 className="font-medium text-on-surface mb-1">{message.title}</h4>
                            )}
                            <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <button
                            onClick={() => setMessageToDelete(message)}
                            className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors flex-shrink-0"
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="px-4 py-3 border-t border-outline-variant/10 flex items-center justify-between">
                    <div className="text-sm text-on-surface-variant">
                      共 {messagesTotal} 条记录
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMessagesPage(p => Math.max(1, p - 1))}
                        disabled={messagesPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-outline-variant/30 disabled:opacity-30 hover:bg-surface-container-high transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-3 py-1.5 text-sm">第 {messagesPage} 页</span>
                      <button
                        onClick={() => setMessagesPage(p => p + 1)}
                        disabled={messages.length < 20}
                        className="px-3 py-1.5 rounded-lg border border-outline-variant/30 disabled:opacity-30 hover:bg-surface-container-high transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 投票控制面板 */}
            <div className={`bg-surface-container-low p-8 rounded-xl border ${needsSetup ? 'border-error/50' : 'border-outline-variant/20'}`}>
              {/* 需要初始化的警告 */}
              {needsSetup && (
                <div className="mb-6 p-4 bg-error-container rounded-lg">
                  <div className="flex items-center gap-2 text-on-error-container font-medium mb-1">
                    <AlertCircle size={18} />
                    <span>配置表未初始化</span>
                  </div>
                  <p className="text-sm text-on-error-container/80">
                    请先点击下方"初始化配置"按钮创建数据表
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${votingStatus?.isVotingOpen ? 'bg-secondary/10' : 'bg-error/10'}`}>
                    {votingStatus?.isVotingOpen ? (
                      <Unlock size={24} className="text-secondary" />
                    ) : (
                      <Lock size={24} className="text-error" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-headline text-2xl font-bold text-on-surface">投票控制</h3>
                    <p className="text-sm text-on-surface-variant">
                      当前状态: 
                      <span className={`ml-1 font-medium ${votingStatus?.isVotingOpen ? 'text-secondary' : 'text-error'}`}>
                        {votingStatus?.isVotingOpen ? '已开启' : '已关闭'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* 开关按钮 */}
                <button
                  onClick={() => toggleVoting(!votingStatus?.isVotingOpen)}
                  disabled={votingLoading || needsSetup}
                  className={`px-6 py-3 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 ${
                    votingStatus?.isVotingOpen 
                      ? 'bg-error text-on-error hover:opacity-90' 
                      : 'bg-secondary text-on-secondary hover:opacity-90'
                  }`}
                >
                  {votingLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : votingStatus?.isVotingOpen ? (
                    <>
                      <Lock size={16} />
                      关闭投票
                    </>
                  ) : (
                    <>
                      <Unlock size={16} />
                      开启投票
                    </>
                  )}
                </button>
              </div>

              {/* 公告编辑 */}
              <div className="bg-surface-container p-4 rounded-lg">
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  投票公告（投票关闭时显示）
                </label>
                {isEditingNotice ? (
                  <div className="space-y-3">
                    <textarea
                      value={editingNotice}
                      onChange={(e) => setEditingNotice(e.target.value)}
                      placeholder="请输入公告内容，例如：投票将于 4月1日 12:00 开始"
                      className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-sm focus:border-primary focus:outline-none resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveNotice}
                        disabled={votingLoading}
                        className="px-4 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingNotice(false);
                          setEditingNotice(votingStatus?.notice || '');
                        }}
                        className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-sm hover:bg-surface-container-highest transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-on-surface flex-1">
                      {votingStatus?.notice || '暂无公告'}
                    </p>
                    <button
                      onClick={() => setIsEditingNotice(true)}
                      className="text-primary text-sm hover:underline flex-shrink-0"
                    >
                      编辑
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 初始化配置表 */}
            <div className="bg-surface-container-low p-8 rounded-xl">
              <h3 className="font-headline text-2xl font-bold mb-4 text-on-surface">初始化配置</h3>
              <p className="text-on-surface-variant mb-6 text-base">
                首次使用需要创建 site_config 表并初始化默认配置：
              </p>
              <ul className="text-sm text-on-surface-variant space-y-2 mb-8">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-secondary" />
                  创建 site_config 表
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-secondary" />
                  设置默认投票开始时间 (2025-04-01 12:00:00)
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-secondary" />
                  初始化投票开关状态
                </li>
              </ul>
              <button
                onClick={setupConfig}
                disabled={setupLoading}
                className={`w-full py-4 rounded-lg font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                  needsSetup 
                    ? 'bg-error text-on-error hover:opacity-90' 
                    : 'bg-primary text-on-primary hover:bg-primary-dim'
                }`}
              >
                {setupLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    初始化中...
                  </>
                ) : (
                  <>
                    <Clock size={16} />
                    {needsSetup ? '⚠️ 点击初始化配置表' : '初始化配置表'}
                  </>
                )}
              </button>
            </div>

            {/* 生成测试数据 */}
            <div className="bg-surface-container-low p-8 rounded-xl">
              <h3 className="font-headline text-2xl font-bold mb-4 text-on-surface">生成测试数据</h3>
              <p className="text-on-surface-variant mb-6 text-base">
                自动生成测试内容用于演示：
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
              <p className="text-on-surface-variant mb-6 text-base">
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

            {/* 清空所有投票 */}
            <div className="bg-surface-container-low p-8 rounded-xl border border-error/20">
              <h3 className="font-headline text-2xl font-bold mb-4 text-on-surface">🗳️ 清空所有投票</h3>
              <p className="text-on-surface-variant mb-6 text-base">
                仅清除投票记录，不影响项目和留言数据：
              </p>
              <ul className="text-sm text-on-surface-variant space-y-2 mb-8">
                <li className="flex items-center gap-2">
                  <Trash2 size={16} className="text-error" />
                  清空所有用户的全部投票记录
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-secondary" />
                  保留 Demo 项目数据
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-secondary" />
                  保留留言和点赞数据
                </li>
              </ul>
              <button
                onClick={clearAllVotes}
                disabled={clearVotesLoading}
                className="w-full py-4 bg-error text-on-error rounded-lg font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {clearVotesLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    清空中...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    一键清空投票
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Delete Demo Modal */}
      {demoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">确认删除项目</h3>
            </div>
            <p className="text-on-surface-variant mb-6">
              确定要删除项目 <strong className="text-on-surface">"{demoToDelete.name}"</strong> 吗？此操作不可恢复。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDemoToDelete(null)}
                className="px-4 py-2 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => deleteDemo(demoToDelete)}
                className="px-4 py-2 bg-error text-on-error rounded-lg hover:opacity-90 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Message Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">确认删除留言</h3>
            </div>
            <p className="text-on-surface-variant mb-4">
              确定要删除这条留言吗？此操作不可恢复。
            </p>
            <div className="bg-surface-container p-3 rounded-lg mb-6 text-sm text-on-surface-variant line-clamp-3">
              {messageToDelete.content}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setMessageToDelete(null)}
                className="px-4 py-2 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => deleteMessage(messageToDelete)}
                className="px-4 py-2 bg-error text-on-error rounded-lg hover:opacity-90 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
