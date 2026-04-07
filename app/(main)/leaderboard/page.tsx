'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Loader2, ThumbsUp, CheckCircle, AlertCircle, Lock,
  Search, ExternalLink, CheckSquare, Square, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { BEST_DEMO_AWARDS, SPECIAL_AWARDS } from '@/lib/constants';
import useSWR from 'swr';
import { useUser } from '@/lib/hooks/useUser';
import { useMobile } from '@/lib/hooks/useMobile';
import dynamicImport from 'next/dynamic';

const Lightbox = dynamicImport(() => import('@/components/Lightbox'), { ssr: false });

// ── Types ──────────────────────────────────────────────────────────────────────

interface LeaderboardItem {
  id: number;
  name: string;
  summary: string;
  track: string;
  submitter1_name: string;
  submitter1_dept: string;
  submitter2_name: string | null;
  submitter2_dept?: string;
  keywords?: string;
  submitted_by: number;
  score: number;
  vote_count: number;
}

interface FullDemo {
  id: number;
  name: string;
  summary: string;
  track: 'optimizer' | 'builder';
  demo_link: string | null;
  submitter1_name: string;
  submitter1_dept: string;
  submitter2_name: string | null;
  submitter2_dept: string | null;
  background: string | null;
  solution: string | null;
  keywords: string | null;
  media_urls: string | string[] | null;
  submitted_by: number;
}

interface Vote { demo_id: number; vote_type: string; }
interface SelectedVote { demo_id: number; vote_type: string; }
interface DemoLink { title: string; url: string; }

type TabType = 'optimizer' | 'builder' | 'special_brain' | 'special_infectious' | 'special_useful';

const jsonFetcher = (url: string) => fetch(url).then(r => r.json());

function parseDemoLinks(raw: string | null): DemoLink[] {
  if (!raw) return [];
  if (raw.trim().startsWith('[')) { try { return JSON.parse(raw); } catch {} }
  return [{ title: '', url: raw }];
}

function parseMediaUrls(v: string | string[] | null | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : [v]; } catch { return [v]; }
}

// ── Tab config ─────────────────────────────────────────────────────────────────

const TABS: { id: TabType; icon: string; label: string; group: 'best' | 'special'; voteType: string; maxVotes: number }[] = [
  { id: 'optimizer',           icon: '⚡',  label: 'Optimizer', group: 'best',    voteType: 'best_optimizer',    maxVotes: BEST_DEMO_AWARDS.best_optimizer.maxVotes },
  { id: 'builder',             icon: '🛠️', label: 'Builder',   group: 'best',    voteType: 'best_builder',      maxVotes: BEST_DEMO_AWARDS.best_builder.maxVotes },
  { id: 'special_brain',       icon: '🧠',  label: '最脑洞',    group: 'special', voteType: 'special_brain',     maxVotes: SPECIAL_AWARDS.special_brain.maxVotes },
  { id: 'special_infectious',  icon: '🔥',  label: '最感染力',  group: 'special', voteType: 'special_infectious', maxVotes: SPECIAL_AWARDS.special_infectious.maxVotes },
  { id: 'special_useful',      icon: '💎',  label: '最实用',    group: 'special', voteType: 'special_useful',    maxVotes: SPECIAL_AWARDS.special_useful.maxVotes },
];

function getTabConfig(tab: TabType) {
  return TABS.find(t => t.id === tab)!;
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { user } = useUser();

  const { data: votingStatus } = useSWR<{ isVotingOpen: boolean; notice: string; leaderboardResultsVisible: boolean; leaderboardEligibleIds: number[]; votingOpenAwards: Record<string, boolean>; votingAwardNotices: Record<string, string> }>(
    '/api/config', jsonFetcher, { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  const { data: votesData, mutate: mutateVotes } = useSWR<{ votes: Vote[] }>(
    '/api/votes', jsonFetcher, { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  const myVotes = votesData?.votes || [];

  // Full demo details for right panel (background / solution / media / links)
  const { data: allDemosData, error: demosError, isLoading: isDemosLoading } = useSWR<{ demos: FullDemo[] }>(
    '/api/demos', jsonFetcher, { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  const demoDetails = useMemo(() => {
    const map = new Map<number, FullDemo>();
    allDemosData?.demos?.forEach(d => map.set(d.id, d));
    return map;
  }, [allDemosData]);

  // Per-tab leaderboard data (lazy loaded)
  const [leaderboardData, setLeaderboardData] = useState<Record<string, LeaderboardItem[]>>({});
  const [loadedTabs, setLoadedTabs]     = useState<Set<string>>(new Set());
  const [loadingTabs, setLoadingTabs]   = useState<Set<string>>(new Set());
  // Shuffled order per tab — randomized once when data first loads, used pre-vote
  const [shuffledOrders, setShuffledOrders] = useState<Record<string, LeaderboardItem[]>>({});

  const [selectedVotes, setSelectedVotes] = useState<SelectedVote[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab]   = useState<TabType>('optimizer');
  const [message, setMessage]       = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [previewId, setPreviewId]   = useState<number | null>(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [lightboxOpen, setLightboxOpen]   = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const isMobile = useMobile();
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (message) { const t = setTimeout(() => setMessage(null), 3000); return () => clearTimeout(t); }
  }, [message]);

  // ── Tab data loading ────────────────────────────────────────────────────────

  const loadTabData = useCallback(async (tab: TabType) => {
    if (loadingTabs.has(tab)) return;
    const voteType = getTabConfig(tab).voteType;
    setLoadingTabs(prev => new Set(prev).add(tab));
    try {
      const res  = await fetch(`/api/leaderboard?vote_type=${voteType}`);
      const data = await res.json();
      const items: LeaderboardItem[] = data.leaderboard || [];
      setLeaderboardData(prev => ({ ...prev, [tab]: items }));
      setLoadedTabs(prev => new Set(prev).add(tab));
      // Shuffle once for pre-vote random order
      setShuffledOrders(prev => {
        if (prev[tab]) return prev; // already shuffled
        const arr = [...items];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return { ...prev, [tab]: arr };
      });
    } catch (e) {
      console.error('Failed to load tab data:', e);
    } finally {
      setLoadingTabs(prev => { const n = new Set(prev); n.delete(tab); return n; });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadTabData('optimizer'); }, []);

  useEffect(() => {
    if (!loadedTabs.has(activeTab)) loadTabData(activeTab);
  }, [activeTab, loadedTabs, loadTabData]);

  // Set preview to first item when tab data arrives
  useEffect(() => {
    const list = leaderboardData[activeTab];
    if (list && list.length > 0 && previewId === null) setPreviewId(list[0].id);
  }, [leaderboardData, activeTab, previewId]);

  const handleSwitchTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery('');
    setDebouncedQuery('');
    const list = leaderboardData[tab];
    setPreviewId(list && list.length > 0 ? list[0].id : null);
  }, [leaderboardData]);

  // ── Derived state ───────────────────────────────────────────────────────────

  const tabCfg         = getTabConfig(activeTab);
  const currentVoteType = tabCfg.voteType;
  const currentMaxVotes = tabCfg.maxVotes;

  const votesUsed           = myVotes.filter(v => v.vote_type === currentVoteType).length;
  const selectedForCurrent  = selectedVotes.filter(v => v.vote_type === currentVoteType).length;
  const hasSubmittedCurrent = votesUsed > 0;
  const canSubmitCurrent    = selectedForCurrent > 0 && !hasSubmittedCurrent;
  const remainingVotes      = currentMaxVotes - votesUsed - selectedForCurrent;
  // 结果仅在 admin 开放后展示
  const showResults         = votingStatus?.leaderboardResultsVisible === true;

  const rawData = leaderboardData[activeTab] || [];

  // 按管理员配置的入选名单过滤（空名单 = 不过滤，显示全部）
  const eligibleIds = votingStatus?.leaderboardEligibleIds;
  const currentData = useMemo(() => {
    if (!eligibleIds || eligibleIds.length === 0) return rawData;
    const idSet = new Set(eligibleIds);
    return rawData.filter(d => idSet.has(d.id));
  }, [rawData, eligibleIds]);

  const { filteredList, rankMap } = useMemo(() => {
    // rankMap only populated when admin has opened results
    const MIN_VOTES_FOR_RANK = 3;
    const rankMap = showResults
      ? new Map(
          [...currentData]
            .sort((a, b) => b.score - a.score)
            .filter(item => item.score >= MIN_VOTES_FOR_RANK)
            .slice(0, 10)
            .map((item, i) => [item.id, i + 1])
        )
      : new Map<number, number>();

    // Before results: use per-tab shuffled order; after results open: sort by score (top10 first)
    let list: LeaderboardItem[];
    const eligibleIdSet = new Set(currentData.map(d => d.id));
    if (showResults) {
      const sorted   = [...currentData].sort((a, b) => b.score - a.score);
      const top10    = sorted.filter(i => i.score >= MIN_VOTES_FOR_RANK).slice(0, 10);
      const top10Ids = new Set(top10.map(i => i.id));
      list = [...top10, ...currentData.filter(i => !top10Ids.has(i.id))];
    } else {
      // shuffledOrders is built from raw data before eligible filter — re-apply filter here
      const shuffled = shuffledOrders[activeTab] || currentData;
      list = shuffled.filter(d => eligibleIdSet.has(d.id));
    }

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        (d.keywords && d.keywords.toLowerCase().includes(q)) ||
        d.submitter1_name.toLowerCase().includes(q) ||
        (d.submitter2_name && d.submitter2_name.toLowerCase().includes(q))
      );
    }
    return { filteredList: list, rankMap };
  }, [currentData, showResults, debouncedQuery, shuffledOrders, activeTab]);

  // Preview targets
  const previewItem   = previewId !== null ? currentData.find(d => d.id === previewId) ?? null : null;
  const previewDetail = previewId !== null ? (demoDetails.get(previewId) ?? null) : null;
  const mediaUrls     = parseMediaUrls(previewDetail?.media_urls);

  const isPreviewVoted    = previewId !== null && myVotes.some(v => v.demo_id === previewId && v.vote_type === currentVoteType);
  const isPreviewSelected = previewId !== null && selectedVotes.some(v => v.demo_id === previewId && v.vote_type === currentVoteType);
  const isPreviewMyDemo   = !!(previewItem && user && previewItem.submitted_by === user.id);
  // Per-award voting status: closed if config loaded and award not explicitly open
  const isVotingClosed    = !!(votingStatus && !votingStatus.votingOpenAwards?.[currentVoteType]);

  // ── Vote toggling ───────────────────────────────────────────────────────────

  function toggleSelection(demoId: number) {
    if (isVotingClosed) return;
    if (!user) { setMessage({ text: '请先登录后投票', type: 'error' }); return; }
    const voteType = currentVoteType;
    const maxVotes = currentMaxVotes;
    if (myVotes.some(v => v.demo_id === demoId && v.vote_type === voteType)) return;
    const item = currentData.find(d => d.id === demoId);
    if (item && item.submitted_by === user.id) {
      setMessage({ text: '不能给自己的项目投票', type: 'error' });
      return;
    }
    const alreadySelected = selectedVotes.some(v => v.demo_id === demoId && v.vote_type === voteType);
    if (alreadySelected) {
      setSelectedVotes(prev => prev.filter(v => !(v.demo_id === demoId && v.vote_type === voteType)));
    } else {
      const used = myVotes.filter(v => v.vote_type === voteType).length;
      const sel  = selectedVotes.filter(v => v.vote_type === voteType).length;
      if (used + sel >= maxVotes) {
        setMessage({ text: `该奖项最多投 ${maxVotes} 票`, type: 'error' });
        return;
      }
      setSelectedVotes(prev => [...prev, { demo_id: demoId, vote_type: voteType }]);
    }
  }

  async function submitVotes() {
    const tabVotes = selectedVotes.filter(v => v.vote_type === currentVoteType);
    if (tabVotes.length === 0) return;
    if (!confirm(`确认提交 ${tabVotes.length} 票？\n\n⚠️ 投票后将不能修改。`)) return;
    setSubmitting(true);
    try {
      const results = await Promise.all(
        tabVotes.map(async vote => {
          const res  = await fetch('/api/votes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ demo_id: vote.demo_id, vote_type: vote.vote_type }),
          });
          const data = await res.json().catch(() => ({}));
          return { ...vote, success: res.ok, error: data.error };
        })
      );
      const successCount = results.filter(r => r.success).length;
      if (successCount === tabVotes.length) {
        mutateVotes(current => ({ votes: [...(current?.votes || []), ...tabVotes] }), false);
        setSelectedVotes(prev => prev.filter(v => v.vote_type !== currentVoteType));
        loadTabData(activeTab);
        setMessage({ text: '投票成功！', type: 'success' });
      } else {
        const failed = results.filter(r => !r.success);
        setMessage({ text: `提交失败：${failed[0]?.error || '请重试'}`, type: 'error' });
      }
    } catch {
      setMessage({ text: '网络错误，请重试', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Track color helpers ─────────────────────────────────────────────────────

  function trackColor(track: string) {
    return track === 'optimizer' ? 'secondary' : track === 'builder' ? 'tertiary' : 'primary';
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col md:h-[calc(100vh-60px)]">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 px-4 md:px-12 pt-4 pb-2">
        <h2 className="font-headline text-2xl md:text-4xl font-bold text-on-surface">Demo Leaderboard</h2>
        <p className="text-sm text-on-surface-variant mt-0.5">
          最佳Demo各赛道 {BEST_DEMO_AWARDS.best_optimizer.maxVotes} 票 · 专项奖 1 票 · 投后不可修改{showResults ? '' : ' · 结果待公布'}
        </p>
      </header>

      {/* ── Notices ─────────────────────────────────────────────────────────── */}
      {isVotingClosed && (
        <div className="mx-4 md:mx-12 mt-2 flex-shrink-0 p-3 bg-surface-container-low rounded-xl text-on-surface-variant flex items-center gap-2 text-sm">
          <Lock size={15} className="flex-shrink-0" />
          <span>{votingStatus?.votingAwardNotices?.[currentVoteType] || `「${tabCfg.label}」奖项投票暂未开放`}</span>
        </div>
      )}
      {!user && !isVotingClosed && (
        <div className="mx-4 md:mx-12 mt-2 flex-shrink-0 p-3 bg-surface-container-low rounded-xl text-sm text-on-surface-variant">
          👀 游客模式只能浏览，<a href="/" className="text-primary hover:underline">登录</a>后可参与投票
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {message && (
        <div className={`mx-4 md:mx-12 mt-2 flex-shrink-0 p-3 rounded-xl flex items-center gap-3 text-sm ${
          message.type === 'success' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
        }`}>
          {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 md:px-12 pt-3 pb-2 flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
        {/* Best Demo group */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-wider whitespace-nowrap hidden md:inline">🏆 最佳Demo</span>
          <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl">
            {TABS.filter(t => t.group === 'best').map(tab => {
              const done = myVotes.some(v => v.vote_type === tab.voteType);
              const open = votingStatus?.votingOpenAwards?.[tab.voteType] === true;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSwitchTab(tab.id)}
                  className={`flex items-center gap-1 md:gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-headline text-sm md:text-base font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? tab.id === 'optimizer' ? 'bg-secondary text-on-secondary shadow-sm' : 'bg-tertiary text-on-tertiary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {tab.icon} {tab.label}
                  {done ? <CheckCircle size={11} className="opacity-60" /> : !open && <Lock size={10} className="opacity-40" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-px h-6 bg-outline-variant/30 flex-shrink-0" />

        {/* Special awards group */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-wider whitespace-nowrap hidden md:inline">⭐ 专项奖</span>
          <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl">
            {TABS.filter(t => t.group === 'special').map(tab => {
              const done = myVotes.some(v => v.vote_type === tab.voteType);
              const open = votingStatus?.votingOpenAwards?.[tab.voteType] === true;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSwitchTab(tab.id)}
                  className={`flex items-center gap-1 md:gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-headline text-sm md:text-base font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {tab.icon} {tab.label}
                  {done ? <CheckCircle size={11} className="opacity-60" /> : !open && <Lock size={10} className="opacity-40" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Split pane ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col md:flex-row md:flex-1 md:gap-5 md:min-h-0 px-4 md:px-12 pb-20">

        {/* ── Left: list ────────────────────────────────────────────────────── */}
        <div className={`${isMobile && showDetail ? 'hidden' : 'flex'} md:flex w-full md:w-[420px] flex-shrink-0 flex-col md:h-full md:overflow-hidden`}>

          {/* Search bar */}
          <div className={`flex-shrink-0 p-2 border border-b-0 border-outline-variant/20 rounded-t-xl bg-surface-container-low/50 border-t-2 ${
            activeTab === 'optimizer' ? 'border-t-secondary/40' :
            activeTab === 'builder'   ? 'border-t-tertiary/40'  : 'border-t-primary/40'
          }`}>
            <div className="relative">
              <input
                type="text"
                placeholder="搜索项目或薯名..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-0 text-sm px-3 py-2 pr-8 rounded-lg placeholder:text-outline/60"
                style={{ fontSize: '16px' }}
              />
              <Search size={14} className="absolute right-3 top-2.5 text-outline/60" />
            </div>
          </div>

          {/* List */}
          <div className="md:flex-1 md:overflow-y-auto border border-outline-variant/20 rounded-xl md:rounded-t-none bg-surface-container-low/50">
            {loadingTabs.has(activeTab) ? (
              <div className="flex items-center justify-center py-12 text-on-surface-variant gap-2 text-sm">
                <Loader2 size={16} className="animate-spin" /> 加载中...
              </div>
            ) : filteredList.length === 0 ? (
              <p className="text-center py-8 text-sm text-on-surface-variant">
                {debouncedQuery ? '没有匹配的项目' : '暂无项目'}
              </p>
            ) : filteredList.map((item, index) => {
              const voted      = myVotes.some(v => v.demo_id === item.id && v.vote_type === currentVoteType);
              const selected   = selectedVotes.some(v => v.demo_id === item.id && v.vote_type === currentVoteType);
              const isPrev     = previewId === item.id;
              const rank       = rankMap.get(item.id);
              const keywords   = item.keywords
                ? item.keywords.split(/[、,，]/).map(k => k.trim()).filter(Boolean).slice(0, 3)
                : [];
              // Divider after top-10 (only when results visible, not searching)
              const showDivider = showResults && index === rankMap.size && rankMap.size > 0 && !debouncedQuery.trim();

              return (
                <div key={item.id}>
                  {/* ── Top-10 / rest divider ──────────────────────────────── */}
                  {showDivider && (
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-container-low/80 border-y border-outline-variant/15">
                      <div className="flex-1 h-px bg-outline-variant/25" />
                      <span className="text-xs font-medium text-on-surface-variant/50 uppercase tracking-wider whitespace-nowrap">
                        后续排名不分先后
                      </span>
                      <div className="flex-1 h-px bg-outline-variant/25" />
                    </div>
                  )}

                  {/* wrapper 承载分割线，避免 border-color 简写覆盖 */}
                  <div className="border-b border-outline-variant/20">
                  <div
                    className={`
                      flex items-start gap-3 p-3 cursor-pointer transition-all border-l-2
                      ${voted    ? 'bg-secondary/5 border-secondary' :
                        selected ? 'bg-secondary/5 border-secondary/60' :
                        isPrev   ? 'bg-surface-container-lowest border-primary/30' :
                                   'hover:bg-surface-container-high border-transparent'}
                    `}
                  >
                    {/* Status icon — click to toggle */}
                    <div
                      className="flex-shrink-0 mt-0.5 cursor-pointer"
                      onClick={e => { e.stopPropagation(); if (!voted) { setPreviewId(item.id); toggleSelection(item.id); } }}
                    >
                      {voted
                        ? <CheckCircle size={18} className="text-secondary" />
                        : selected
                          ? <CheckSquare size={18} className="text-secondary" />
                          : <Square size={18} className="text-outline-variant/40 hover:text-outline transition-colors" />
                      }
                    </div>

                    {/* Content — click to preview */}
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => { setPreviewId(item.id); if (isMobile) setShowDetail(true); }}
                    >
                      {/* Title row: name left, rank badge right */}
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h3 className="text-base font-headline font-bold leading-snug text-on-surface line-clamp-2">{item.name}</h3>
                        {rank && (
                          <span className="flex-shrink-0 text-lg leading-none mt-0.5 select-none">
                            {rank === 1 ? '🥇'
                              : rank === 2 && tabCfg.group === 'best' ? '🥈'
                              : rank === 3 && tabCfg.group === 'best' ? '🥉'
                              : <span className="text-xs font-semibold text-on-surface-variant/50">#{rank}</span>}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-on-surface-variant/70 line-clamp-1 mb-2">{item.summary}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {keywords.map((kw, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded ${
                            activeTab === 'optimizer' ? 'bg-secondary/10 text-secondary' :
                            activeTab === 'builder'   ? 'bg-tertiary/10 text-tertiary'   :
                                                        'bg-primary/10 text-primary'
                          }`}>{kw}</span>
                        ))}
                        <span className="ml-auto">
                          {showResults && rank
                            ? <span className="text-sm font-bold text-on-surface tabular-nums">{item.score} <span className="font-normal text-on-surface-variant/60">票</span></span>
                            : <span className="text-xs text-on-surface-variant/50">{item.submitter1_name}{item.submitter2_name ? ' +1' : ''}</span>
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: detail ─────────────────────────────────────────────────── */}
        <div className={`${isMobile && !showDetail ? 'hidden' : 'flex'} md:flex md:flex-1 bg-surface-container-low rounded-xl flex-col md:h-full md:overflow-hidden border border-outline-variant/10`}>
          {previewItem ? (
            <>
              {/* Track color bar */}
              <div className={`h-0.5 flex-shrink-0 ${
                previewItem.track === 'optimizer' ? 'bg-secondary' :
                previewItem.track === 'builder'   ? 'bg-tertiary'  : 'bg-primary'
              }`} />

              {/* Mobile back button */}
              {isMobile && (
                <button
                  onClick={() => setShowDetail(false)}
                  className="md:hidden sticky top-0 z-10 flex items-center gap-1 px-4 py-2.5 text-sm text-on-surface-variant border-b border-outline-variant/10 bg-surface-container-low flex-shrink-0"
                >
                  <ChevronLeft size={16} />
                  <span>返回列表</span>
                </button>
              )}

              {/* Detail header */}
              <div className="px-4 md:px-8 pt-5 pb-4 flex-shrink-0 border-b border-outline-variant/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded ${
                        previewItem.track === 'optimizer' ? 'bg-secondary/10 text-secondary' :
                        previewItem.track === 'builder'   ? 'bg-tertiary/10 text-tertiary'   :
                                                            'bg-primary/10 text-primary'
                      }`}>
                        {previewItem.track}
                      </span>
                      <span className="text-lg leading-none">
                        {previewItem.track === 'optimizer' ? '⚡️' :
                         previewItem.track === 'builder'   ? '🛠️' :
                         TABS.find(t => t.voteType === currentVoteType)?.icon ?? '⭐'}
                      </span>
                    </div>
                    {rankMap.has(previewItem.id) && (() => {
                      const r = rankMap.get(previewItem.id)!;
                      const medal = r === 1 ? '🥇' : r === 2 && tabCfg.group === 'best' ? '🥈' : r === 3 && tabCfg.group === 'best' ? '🥉' : null;
                      return (
                        <div className="flex items-center gap-1.5 mb-2 text-sm text-on-surface-variant/70">
                          {medal
                            ? <span className="text-base leading-none select-none">{medal}</span>
                            : <span className="font-semibold text-on-surface/60">#{r}</span>}
                          {showResults && (
                            <>
                              <span className="text-on-surface-variant/30">·</span>
                              <span className="font-semibold text-on-surface/70">{previewItem.score} 票</span>
                            </>
                          )}
                        </div>
                      );
                    })()}
                    <h1 className="text-3xl font-headline font-bold text-on-surface">{previewItem.name}</h1>
                    <p className="mt-2 text-base text-on-surface-variant leading-relaxed">{previewItem.summary}</p>
                  </div>

                  {/* Vote button */}
                  {isVotingClosed ? (
                    <button disabled className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-surface-container text-outline/40 border border-outline-variant/20 cursor-not-allowed">
                      <Lock size={15} /> 未开放
                    </button>
                  ) : !user ? (
                    <a href="/" className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-surface-container-high text-on-surface border border-outline-variant/30 hover:bg-primary/10 hover:text-primary transition-all">
                      登录投票
                    </a>
                  ) : isPreviewVoted ? (
                    <button disabled className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-secondary/10 text-secondary border border-secondary/20">
                      <CheckCircle size={15} /> 已投票
                    </button>
                  ) : isPreviewMyDemo ? (
                    <button disabled title="不能给自己的项目投票" className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-surface-container text-outline/40 border border-outline-variant/20 cursor-not-allowed">
                      <Lock size={15} /> 我的项目
                    </button>
                  ) : (
                    <button
                      onClick={() => previewId && toggleSelection(previewId)}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                        isPreviewSelected
                          ? 'bg-secondary text-on-secondary hover:opacity-80'
                          : 'bg-surface-container-high text-on-surface hover:bg-secondary/10 hover:text-secondary border border-outline-variant/30'
                      }`}
                    >
                      {isPreviewSelected
                        ? <><CheckSquare size={15} /> 已选</>
                        : <><ThumbsUp size={15} /> 投票</>
                      }
                    </button>
                  )}
                </div>
              </div>

              {/* Detail body */}
              <div className="md:flex-1 md:overflow-y-auto px-4 md:px-8 py-6 space-y-6">
                {/* 基本信息（不需要 previewDetail） */}
                <div className="pb-6 border-b border-outline-variant/20">
                  <p className="text-xs uppercase tracking-widest text-outline font-bold mb-2">负责人</p>
                  <div className="flex items-center gap-2 text-sm text-on-surface">
                    <span className="font-semibold">{previewItem.submitter1_name}</span>
                    {previewItem.submitter1_dept && <span className="text-on-surface-variant">({previewItem.submitter1_dept})</span>}
                    {previewItem.submitter2_name && (
                      <>
                        <span className="text-outline">+</span>
                        <span className="font-semibold">{previewItem.submitter2_name}</span>
                        {previewItem.submitter2_dept && <span className="text-on-surface-variant">({previewItem.submitter2_dept})</span>}
                      </>
                    )}
                  </div>
                </div>

                {/* 需要 previewDetail 的内容 */}
                {isDemosLoading ? (
                  <div className="flex items-center justify-center py-12 text-on-surface-variant text-sm gap-2">
                    <Loader2 size={16} className="animate-spin" /> 加载详情中...
                  </div>
                ) : demosError ? (
                  <div className="flex items-center justify-center py-12 text-error text-sm">
                    加载失败，请刷新页面重试
                  </div>
                ) : previewDetail ? (
                  <>
                    {(previewDetail.background || previewDetail.solution) && (
                      <div className="space-y-5 pb-6 border-b border-outline-variant/20">
                        {previewDetail.background && (
                          <div>
                            <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-2">Why / 为什么要做</p>
                            <div className="markdown-content prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewDetail.background }} />
                          </div>
                        )}
                        {previewDetail.solution && (
                          <div>
                            <p className="text-xs uppercase tracking-widest text-tertiary font-bold mb-2">How / 怎么解决的</p>
                            <div className="markdown-content prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewDetail.solution }} />
                          </div>
                        )}
                        {previewDetail.keywords && (
                          <div>
                            <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Key Words</p>
                            <div className="flex flex-wrap gap-1.5">
                              {previewDetail.keywords.split(/[、,，]/).map((kw, i) => (
                                <span key={i} className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full">{kw.trim()}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {parseDemoLinks(previewDetail.demo_link).length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-outline font-bold mb-2">作品链接</p>
                        <div className="space-y-1">
                          {parseDemoLinks(previewDetail.demo_link).map((link, i) => (
                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                              {link.title || '链接'}<ExternalLink size={12} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {mediaUrls.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-outline font-bold mb-2">截图</p>
                        <div className="grid grid-cols-2 gap-3">
                          {mediaUrls.map((url, i) => {
                            const isVideo = /\.(mp4|mov|webm|avi)$/i.test(url);
                            return (
                              <div key={i}
                                className="aspect-video bg-surface-container-highest rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                              >
                                {isVideo
                                  ? <video src={url} className="w-full h-full object-cover" preload="none" />
                                  : <img src={url} alt={`${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                }
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : previewItem ? (
                  // 有 previewItem 但没有 previewDetail 时，显示基本信息
                  <div className="space-y-5">
                    <div className="pb-6 border-b border-outline-variant/20">
                      <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-2">简介</p>
                      <p className="text-sm text-on-surface">{previewItem.summary}</p>
                    </div>
                    <div className="pb-6 border-b border-outline-variant/20">
                      <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">赛道</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        previewItem.track === 'optimizer' 
                          ? 'bg-secondary/10 text-secondary' 
                          : 'bg-tertiary/10 text-tertiary'
                      }`}>
                        {previewItem.track === 'optimizer' ? 'Optimizer' : 'Builder'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12 text-on-surface-variant text-sm">
                    暂无详细信息
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
              {loadingTabs.has(activeTab)
                ? <><Loader2 size={18} className="animate-spin mr-2" />加载中...</>
                : '点击左侧项目查看详情'
              }
            </div>
          )}
        </div>
      </section>

      {/* ── Floating bottom bar · 手机全宽条 / 桌面胶囊 ─────────────────────── */}

      {/* 手机：全宽条，紧贴底部 Tab Bar 上方 */}
      <div className={`md:hidden fixed bottom-0 inset-x-0 z-40 border-t px-4 pt-2.5 pb-[60px] flex items-center justify-between transition-all ${
        canSubmitCurrent
          ? 'bg-on-surface text-surface border-on-surface/20'
          : 'bg-surface-container/95 backdrop-blur-sm text-on-surface border-outline-variant/20'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-xs font-bold flex-shrink-0 ${canSubmitCurrent ? 'opacity-60' : 'text-on-surface-variant/60'}`}>
            {tabCfg.icon} {tabCfg.label}
          </span>
          <span className={`w-px h-3 flex-shrink-0 ${canSubmitCurrent ? 'bg-surface/20' : 'bg-outline-variant/30'}`} />
          {hasSubmittedCurrent ? (
            <span className="text-xs flex items-center gap-1">
              <CheckCircle size={12} className="text-secondary flex-shrink-0" />
              <span className="font-medium">已投 {votesUsed}/{currentMaxVotes}</span>
            </span>
          ) : (
            <span className="text-xs font-medium tabular-nums">
              已选 <span className="font-bold">{selectedForCurrent}</span>/{currentMaxVotes}
              {remainingVotes > 0 && selectedForCurrent === 0 && (
                <span className={`ml-1 ${canSubmitCurrent ? 'opacity-60' : 'text-on-surface-variant/50'}`}>还差 {remainingVotes} 票</span>
              )}
            </span>
          )}
        </div>
        {!hasSubmittedCurrent && (
          <button
            onClick={submitVotes}
            disabled={!canSubmitCurrent || submitting}
            className={`flex-shrink-0 flex items-center gap-1 font-bold text-sm px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
              canSubmitCurrent
                ? 'bg-surface text-on-surface'
                : 'text-on-surface-variant/40 cursor-not-allowed'
            }`}
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : canSubmitCurrent ? <ThumbsUp size={13} /> : null}
            {canSubmitCurrent ? `提交 (${selectedForCurrent})` : '选择后提交'}
          </button>
        )}
      </div>

      {/* 桌面：居中胶囊 */}
      <div className="hidden md:block fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className={`
          pointer-events-auto flex items-center gap-4 px-5 py-3 rounded-2xl shadow-xl border transition-all
          ${canSubmitCurrent
            ? 'bg-on-surface text-surface border-on-surface/20'
            : 'bg-surface-container text-on-surface border-outline-variant/30'}
        `}>
          <span className={`text-sm font-bold ${canSubmitCurrent ? 'opacity-50' : 'text-on-surface-variant/50'}`}>
            {tabCfg.icon} {tabCfg.label}
          </span>
          <div className={`w-px h-4 ${canSubmitCurrent ? 'bg-surface/20' : 'bg-outline-variant/30'}`} />
          {hasSubmittedCurrent ? (
            <span className="text-sm flex items-center gap-1.5">
              <CheckCircle size={13} className={canSubmitCurrent ? 'text-surface/60' : 'text-secondary'} />
              <span className="font-medium">已投 {votesUsed}/{currentMaxVotes}</span>
            </span>
          ) : (
            <span className={`text-sm font-medium tabular-nums ${canSubmitCurrent ? 'opacity-80' : ''}`}>
              已选 <span className="font-bold">{selectedForCurrent}</span>/{currentMaxVotes}
              {remainingVotes > 0 && selectedForCurrent === 0 && (
                <span className="text-on-surface-variant/50 ml-1.5 text-sm">再选 {remainingVotes} 个</span>
              )}
            </span>
          )}
          {!hasSubmittedCurrent && (
            <>
              <div className={`w-px h-4 ${canSubmitCurrent ? 'bg-surface/20' : 'bg-outline-variant/30'}`} />
              <button
                onClick={submitVotes}
                disabled={!canSubmitCurrent || submitting}
                className={`flex items-center gap-1.5 font-bold text-sm transition-all ${
                  canSubmitCurrent ? 'text-surface hover:opacity-80 active:scale-95' : 'text-on-surface-variant/40 cursor-not-allowed'
                }`}
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : canSubmitCurrent ? <ThumbsUp size={14} /> : null}
                {canSubmitCurrent ? `提交投票 (${selectedForCurrent})` : '选择后提交'}
                {canSubmitCurrent && <ChevronRight size={14} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Lightbox ────────────────────────────────────────────────────────── */}
      {isClient && lightboxOpen && mediaUrls.length > 0 && (
        <Lightbox
          urls={mediaUrls}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex(prev => prev > 0 ? prev - 1 : mediaUrls.length - 1)}
          onNext={() => setLightboxIndex(prev => prev < mediaUrls.length - 1 ? prev + 1 : 0)}
        />
      )}
    </div>
  );
}
