'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, AlertCircle, Trash2, Search, X, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useUser } from '@/lib/hooks/useUser';
import { OPTIMIZER_ORDER, BUILDER_ORDER } from '@/lib/demo-order';

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

const SUBMITTER_MAP: Record<string, string> = {
  '搜索掘金searchinsights  (别名"搜索黄金矿工"）': '北星',
  'AI Daily Digest - 越跑越聪明的"AI今日头条"': '宗棠',
  '投研助手-电子小林虾': '小林',
  '"财报哨兵"：战略团队的 In-House Earnings Coverage — One Bot, Hundreds of Companies': '罗尼',
  '用户onepage制作': '奇爱',
  'Podcast brief': '甘雨',
  'AI dashboard': '白野',
  'AI research thinking partner': '观澜',
  '再也不想打开dayQ了': '牧真',
  '小红书上的男人在做什么': '黄风',
  '问卷审核Skill': '登登',
  '用研知识库LR': '世良',
  '【真实上线】-【小鹿AI】，长在HI里，Watch直连agent': '鹿鸣',
  '抖音新星捕捞器': '黄风',
  '问卷数据处理': '樱桃',
  '赛博秘书- 让Agent帮你管理任务': '阿席',
  'AB实验分析AI化': '亚克',
  '电商治理分析AI化': '秉义',
  'Mio 广告AI诊断': '明玉',
  'Expeditions | Your travel stories': '初一 + 也英',
  '【App真实上线可玩】Pensieve : Your Exclusive biographer': '阿瑟 + 高斯',
  '三张地图': '维勒 + 阿列',
  'AI Demo Day网站': '恒宇 + 阿瑟',
  '展览体温计 — 看展的真实评价，一眼可见': '璃茉',
  'Project Spark：点亮中低活用户的feed': '也英 + 杰特',
  'Project Lumière': '莉露 + 米法',
  'ootd': '阿亚 + 龙树',
  '麻将"作弊"器': '一鹏',
  '智能体笔记——小红书的第四种内容形式': '二千',
  'Soul Mirror': '七里 + 阿瑟',
  '魔法薯🪄解密你的赛博八字': '优午 + 奇爱',
  '为你私藏的微光「角落」': '艾博',
  '"懂你的好物推荐卡"': '拾七',
  'Notes2Skill': '阿席',
  '土拨鼠信箱 — 把话埋进土里，等它长出花来': '璃茉',
  '星盘': '宫二',
  'Org Snowball': '菲雅',
  'People Finder': '灵筠',
};

function getSubmitter(name: string) {
  if (SUBMITTER_MAP[name]) return SUBMITTER_MAP[name];
  for (const [k, v] of Object.entries(SUBMITTER_MAP)) {
    if (name.includes(k) || k.includes(name)) return v;
  }
  return '';
}

interface DemoItem { name: string; track: 'optimizer' | 'builder'; submitter: string; }

const OPTIMIZER_DEMOS: DemoItem[] = OPTIMIZER_ORDER.map(name => ({ name, track: 'optimizer', submitter: getSubmitter(name) }));
const BUILDER_DEMOS: DemoItem[]   = BUILDER_ORDER.map(name => ({ name, track: 'builder', submitter: getSubmitter(name) }));

function getDemoTrack(name: string): 'optimizer' | 'builder' | null {
  if (OPTIMIZER_ORDER.includes(name)) return 'optimizer';
  if (BUILDER_ORDER.includes(name)) return 'builder';
  return null;
}

const messagesFetcher = (url: string) => fetch(url).then(r => r.json()).then(d => d.messages || []);

/* ─────────────────────────────────────────────
   Demo Picker Modal
───────────────────────────────────────────── */
function DemoPickerRow({
  item,
  selected,
  onPick,
}: {
  item: DemoItem;
  selected: boolean;
  onPick: (name: string) => void;
}) {
  const isOpt = item.track === 'optimizer';
  return (
    <button
      type="button"
      onClick={() => onPick(item.name)}
      className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors ${
        selected ? 'bg-surface-container' : 'hover:bg-surface-container/60'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${isOpt ? 'bg-secondary' : 'bg-tertiary'}`} />
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-on-surface leading-snug truncate">{item.name}</span>
        {item.submitter && (
          <span className="block text-xs text-outline mt-0.5">{item.submitter}</span>
        )}
      </span>
      {selected && (
        <span className={`text-xs font-bold flex-shrink-0 ${isOpt ? 'text-secondary' : 'text-tertiary'}`}>✓</span>
      )}
    </button>
  );
}

function DemoPicker({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [vvHeight, setVvHeight] = useState<number | null>(null);

  // 监听 visualViewport 高度变化，确保键盘弹出后 modal 不被遮挡
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setVvHeight(vv.height);
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // 不自动 focus——iOS 会因 font-size<16px 的 input 触发 viewport zoom

  const q = search.trim().toLowerCase();
  const match = (d: DemoItem) =>
    d.name.toLowerCase().includes(q) || d.submitter.toLowerCase().includes(q);

  const filteredOpt = OPTIMIZER_DEMOS.filter(match);
  const filteredBld = BUILDER_DEMOS.filter(match);
  const hasResults  = filteredOpt.length > 0 || filteredBld.length > 0;

  function pick(name: string) { onChange(name); onClose(); }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px]"
      style={{ height: vvHeight ? `${vvHeight}px` : '100dvh' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-lg bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: vvHeight ? `${Math.min(vvHeight * 0.9, vvHeight - 16)}px` : '82dvh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <span className="w-9 h-1 rounded-full bg-outline-variant/40" />
        </div>

        {/* Search bar */}
        <div className="px-4 pt-2 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 bg-surface-container rounded-xl px-4 py-2.5">
            <Search size={15} className="text-outline/60 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="搜索项目名称或薯名..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-base text-on-surface placeholder:text-outline/50 outline-none border-none focus:ring-0 p-0"
              style={{ fontSize: '16px' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-outline/50 hover:text-outline transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {!hasResults ? (
            <p className="text-sm text-outline text-center py-10">无匹配项目</p>
          ) : (
            <>
              {filteredOpt.length > 0 && (
                <section>
                  <div className="px-5 py-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-secondary/60 uppercase tracking-widest">⚡ Optimizer</span>
                    <span className="flex-1 h-px bg-outline-variant/15" />
                  </div>
                  {filteredOpt.map(item => (
                    <DemoPickerRow key={item.name} item={item} selected={value === item.name} onPick={pick} />
                  ))}
                </section>
              )}
              {filteredBld.length > 0 && (
                <section className="mt-1">
                  <div className="px-5 py-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-tertiary/60 uppercase tracking-widest">🛠️ Builder</span>
                    <span className="flex-1 h-px bg-outline-variant/15" />
                  </div>
                  {filteredBld.map(item => (
                    <DemoPickerRow key={item.name} item={item} selected={value === item.name} onPick={pick} />
                  ))}
                </section>
              )}
            </>
          )}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Filter Dropdown
───────────────────────────────────────────── */
function FilterDropdown({
  value,
  onChange,
  demosWithQuestions,
}: {
  value: string;
  onChange: (v: string) => void;
  demosWithQuestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const label = value
    ? <><span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getDemoTrack(value) === 'optimizer' ? 'bg-secondary' : 'bg-tertiary'}`} /><span className="truncate max-w-[180px]">{value}</span></>
    : <span className="text-on-surface-variant">全部项目</span>;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low text-sm hover:border-outline-variant/60 transition-colors"
      >
        <span className="flex items-center gap-1.5">{label}</span>
        <ChevronDown size={14} className={`text-outline transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-40 top-full left-0 mt-1 w-72 bg-surface-container-lowest border border-outline-variant/15 rounded-xl shadow-xl overflow-hidden">
          <div className="py-1">
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${!value ? 'font-semibold text-on-surface bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container'}`}
            >
              全部项目
            </button>
          </div>

          {(['optimizer', 'builder'] as const).map(track => {
            const demos = demosWithQuestions.filter(d => getDemoTrack(d) === track);
            if (demos.length === 0) return null;
            return (
              <div key={track} className="border-t border-outline-variant/10 py-1">
                <p className={`px-4 py-1 text-xs font-bold uppercase tracking-wider ${track === 'optimizer' ? 'text-secondary/60' : 'text-tertiary/60'}`}>
                  {track === 'optimizer' ? '⚡ Optimizer' : '🛠️ Builder'}
                </p>
                {demos.map(demo => (
                  <button
                    key={demo}
                    onClick={() => { onChange(demo); setOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                      value === demo ? 'font-medium bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${track === 'optimizer' ? 'bg-secondary' : 'bg-tertiary'}`} />
                    <span className="truncate">{demo}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function SquarePage() {
  const { user } = useUser();
  const { data: messages = [], mutate: mutateMessages, isLoading: loading } = useSWR<Message[]>(
    '/api/messages',
    messagesFetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  const allDemoNames = [...OPTIMIZER_DEMOS, ...BUILDER_DEMOS].map(d => d.name);

  const [question, setQuestion]         = useState('');
  const [selectedDemo, setSelectedDemo] = useState('');

  // 从 URL ?demo= 预选项目，用 window.location 避免 useSearchParams 的 Suspense 要求
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    if (demo && allDemoNames.includes(demo)) setSelectedDemo(demo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [pickerOpen, setPickerOpen]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [sortOrder, setSortOrder]       = useState<'time' | 'hot'>('time');
  const [filterDemo, setFilterDemo]     = useState('');
  const [deletingId, setDeletingId]     = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !selectedDemo) return;
    if (!user) { setShowLoginPrompt(true); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: null, content: question, category: selectedDemo }),
      });
      if (res.ok) { setQuestion(''); setSelectedDemo(''); mutateMessages(); }
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  const handleUpvote = useCallback(async (messageId: number) => {
    if (!user) { setShowLoginPrompt(true); return; }
    const msg = messages.find(m => m.id === messageId);
    const wasUpvoted = msg?.hasUpvoted ?? false;
    mutateMessages(cur => cur?.map(m => m.id === messageId
      ? { ...m, upvote_count: m.upvote_count + (wasUpvoted ? -1 : 1), hasUpvoted: !wasUpvoted }
      : m), false);
    try {
      const res = await fetch(`/api/messages/${messageId}/upvote`, { method: 'POST' });
      if (!res.ok) mutateMessages();
    } catch { mutateMessages(); }
  }, [user, messages, mutateMessages]);

  async function handleDelete(messageId: number) {
    if (!user) return;
    setDeletingId(messageId);
    try {
      const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
      if (res.ok) {
        mutateMessages(cur => cur?.filter(m => m.id !== messageId), false);
        setShowDeleteConfirm(null);
      } else {
        const d = await res.json();
        alert(d.error || '删除失败');
      }
    } catch { alert('删除失败'); }
    finally { setDeletingId(null); }
  }

  function formatTimeAgo(dateString: string) {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  }

  const demosWithQuestions = Array.from(new Set(messages.map(m => m.category).filter(Boolean))) as string[];

  const sortedMessages = [...messages]
    .filter(m => !filterDemo || m.category === filterDemo)
    .sort((a, b) => sortOrder === 'hot'
      ? b.upvote_count - a.upvote_count
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const selectedTrack = getDemoTrack(selectedDemo);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="text-on-surface-variant">加载中...</div></div>;
  }

  return (
    <div className="px-4 md:px-12 pb-20 md:pb-12 max-w-4xl">

      {/* Header */}
      <header className="flex-shrink-0 mb-8 pt-4 pb-2">
        <h2 className="font-headline text-2xl md:text-4xl font-bold tracking-tight text-on-surface">提问广场</h2>
        <p className="text-base text-on-surface-variant mt-2">
          路演期间向项目提问，主持人将在广场选取热门问题
        </p>
      </header>

      {/* Question Form */}
      <section className="mb-8 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm">
        {user ? (
          <form onSubmit={handleSubmit}>
            <div className="p-5 space-y-4">

              {/* Demo selector button */}
              <div>
                <p className="text-xs font-semibold text-outline/60 uppercase tracking-wider mb-2">
                  提问对象 <span className="text-error normal-case tracking-normal font-normal">必填</span>
                </p>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    selectedDemo
                      ? selectedTrack === 'optimizer'
                        ? 'border-secondary/40 bg-secondary/5'
                        : 'border-tertiary/40 bg-tertiary/5'
                      : 'border-outline-variant/30 bg-surface-container hover:border-outline-variant/60'
                  }`}
                >
                  {selectedDemo ? (
                    <>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedTrack === 'optimizer' ? 'bg-secondary' : 'bg-tertiary'}`} />
                      <span className="flex-1 text-sm font-medium text-on-surface leading-snug">{selectedDemo}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        selectedTrack === 'optimizer' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'
                      }`}>
                        {selectedTrack === 'optimizer' ? 'Optimizer' : 'Builder'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-outline/20 flex-shrink-0" />
                      <span className="flex-1 text-sm text-outline">选择要提问的 Demo 项目...</span>
                      <ChevronDown size={15} className="text-outline flex-shrink-0" />
                    </>
                  )}
                </button>
              </div>

              {/* Question input */}
              <div>
                <p className="text-xs font-semibold text-outline/60 uppercase tracking-wider mb-2">
                  你的问题 <span className="text-error normal-case tracking-normal font-normal">必填</span>
                </p>
                <textarea
                  placeholder={selectedDemo ? `向「${selectedDemo}」提问...` : '请先选择提问对象'}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  rows={3}
                  disabled={!selectedDemo}
                  className="w-full bg-surface-container border border-outline-variant/25 rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-0 focus:border-outline-variant/50 resize-none disabled:opacity-40 transition-opacity"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div className="flex justify-end px-5 pb-4">
              <button
                type="submit"
                disabled={submitting || !question.trim() || !selectedDemo}
                className="px-6 py-2 bg-on-surface text-surface rounded-lg text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-35"
              >
                {submitting ? '发布中...' : '发布提问'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8 px-4">
            <p className="text-on-surface-variant mb-3">游客模式只能浏览，无法发布提问</p>
            <button
              onClick={() => setShowLoginPrompt(true)}
              className="px-6 py-2 bg-primary text-on-primary rounded-lg text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              登录后提问
            </button>
          </div>
        )}
      </section>

      {/* Controls */}
      {messages.length > 0 && (
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {/* Sort */}
          <div className="flex items-center gap-1">
            {(['time', 'hot'] as const).map(order => (
              <button
                key={order}
                onClick={() => setSortOrder(order)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sortOrder === order ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {order === 'hot' ? '热度' : '最新'}
              </button>
            ))}
          </div>
          {/* Filter */}
          {demosWithQuestions.length > 0 && (
            <FilterDropdown
              value={filterDemo}
              onChange={setFilterDemo}
              demosWithQuestions={demosWithQuestions}
            />
          )}
          <span className="ml-auto text-xs text-outline">{sortedMessages.length} 条提问</span>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-3">
        {sortedMessages.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="text-4xl mb-3">💬</p>
            <p>{filterDemo ? `暂无对「${filterDemo}」的提问` : '暂无提问，来问第一个问题吧！'}</p>
          </div>
        ) : (
          sortedMessages.map(message => {
            const track = getDemoTrack(message.category ?? '');
            return (
              <article
                key={message.id}
                className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden group hover:border-outline-variant/30 transition-colors"
              >
                {/* Demo target header */}
                {message.category && (
                  <div className={`px-4 py-2.5 flex items-start gap-2 border-b border-outline-variant/10 ${
                    track === 'optimizer' ? 'bg-secondary/5' :
                    track === 'builder'   ? 'bg-tertiary/5' : 'bg-surface-container'
                  }`}>
                    <span className={`text-sm font-medium flex-1 leading-snug line-clamp-2 ${
                      track === 'optimizer' ? 'text-secondary' :
                      track === 'builder'   ? 'text-tertiary' : 'text-on-surface'
                    }`}>
                      向 <span className="font-semibold">{message.category}</span> 提问
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5 ${
                      track === 'optimizer' ? 'bg-secondary/10 text-secondary/70' :
                      track === 'builder'   ? 'bg-tertiary/10 text-tertiary/70' : ''
                    }`}>
                      {track === 'optimizer' ? 'Optimizer' : track === 'builder' ? 'Builder' : ''}
                    </span>
                  </div>
                )}

                {/* Content + upvote */}
                <div className="flex gap-4 px-4 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-on-surface text-base leading-relaxed whitespace-pre-wrap chinese-text mb-3">
                      {message.content}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-on-surface chinese-text">{message.author_name}</span>
                      <span className="text-outline text-sm">· {formatTimeAgo(message.created_at)}</span>
                      {user && user.id === message.author_id && (
                        <button
                          onClick={() => setShowDeleteConfirm(message.id)}
                          className="ml-auto p-1.5 text-outline/50 hover:text-error hover:bg-error/10 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-start">
                    <button
                      onClick={() => handleUpvote(message.id)}
                      className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                        message.hasUpvoted
                          ? 'bg-secondary text-on-secondary border-secondary shadow-sm'
                          : 'border-outline-variant/30 hover:bg-surface-container-high hover:border-secondary/40 text-on-surface-variant'
                      }`}
                    >
                      <ArrowUp size={16} />
                      <span className="text-xs font-bold leading-none">{message.upvote_count}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {messages.length > 0 && (
        <footer className="mt-10 pb-12 text-center">
          <button
            onClick={() => mutateMessages()}
            className="text-[10px] uppercase tracking-[0.3em] text-outline hover:text-on-surface transition-colors"
          >
            刷新列表
          </button>
        </footer>
      )}

      {/* Modals */}
      {pickerOpen && (
        <DemoPicker
          value={selectedDemo}
          onChange={setSelectedDemo}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
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

/* ─── LoginPrompt ─── */
function LoginPrompt({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center gap-3 mb-4 text-primary">
          <AlertCircle size={24} />
          <h3 className="text-lg font-headline font-bold">需要登录</h3>
        </div>
        <p className="text-on-surface-variant mb-6">游客模式无法发表内容或点赞，请先登录。</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high transition-colors">继续浏览</button>
          <button onClick={() => router.push('/')} className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-dim transition-colors">去登录</button>
        </div>
      </div>
    </div>
  );
}

/* ─── DeleteConfirm ─── */
function DeleteConfirm({ onClose, onConfirm, deleting }: { onClose: () => void; onConfirm: () => void; deleting: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center gap-3 mb-4 text-error">
          <Trash2 size={24} />
          <h3 className="text-lg font-headline font-bold">确认删除</h3>
        </div>
        <p className="text-on-surface-variant mb-6">删除后无法恢复，确定要删除这条提问吗？</p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={deleting} className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50">取消</button>
          <button onClick={onConfirm} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-error text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {deleting ? '删除中...' : '删除'}
          </button>
        </div>
      </div>
    </div>
  );
}
