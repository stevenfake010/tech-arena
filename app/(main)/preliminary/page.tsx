'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, CheckCircle, AlertCircle, Lock, CheckSquare, Square,
  Trophy, BarChart2, ExternalLink, ChevronRight, ChevronLeft,
} from 'lucide-react';
import useSWR from 'swr';
import { useUser } from '@/lib/hooks/useUser';
import { useMobile } from '@/lib/hooks/useMobile';
import type { PrelimConfig } from '@/lib/constants';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Demo {
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

interface PrelimState {
  config: PrelimConfig & { canViewResults: boolean };
  submitted: boolean;
  submittedIds: number[];
}

interface ResultItem {
  demo_id: number;
  name: string;
  track: 'optimizer' | 'builder';
  submitter1_name: string;
  submitter1_dept: string;
  submitter2_name: string | null;
  vote_count: number;
}

interface DemoLink { title: string; url: string; }

const jsonFetcher = (url: string) => fetch(url).then(r => r.json());

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseDemoLinks(raw: string | null): DemoLink[] {
  if (!raw) return [];
  if (raw.trim().startsWith('[')) {
    try { return JSON.parse(raw); } catch {}
  }
  return [{ title: '', url: raw }];
}

function parseMediaUrls(v: string | string[] | null | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : [v]; } catch { return [v]; }
}

// ── Results view ───────────────────────────────────────────────────────────────
function ResultsView() {
  const { data, isLoading } = useSWR<{ results: ResultItem[]; totalVoters: number }>(
    '/api/preliminary/results', jsonFetcher, { revalidateOnFocus: false }
  );
  if (isLoading) return (
    <div className="flex items-center justify-center gap-3 py-16 text-on-surface-variant">
      <Loader2 size={20} className="animate-spin" /><span>加载结果中...</span>
    </div>
  );
  if (!data?.results) return <p className="py-8 text-center text-on-surface-variant">暂无结果</p>;

  return (
    <div className="space-y-6 px-4 md:px-12 pt-6">
      <p className="text-sm text-on-surface-variant">
        已提交人数：<span className="font-bold text-on-surface">{data.totalVoters}</span> 人
      </p>
      {(['optimizer', 'builder'] as const).map(track => {
        const items = data.results.filter(r => r.track === track);
        return (
          <section key={track}>
            <h3 className="font-headline font-bold text-base mb-3">
              {track === 'optimizer' ? '⚡ Optimizer 赛道' : '🛠️ Builder 赛道'}
            </h3>
            <div className="overflow-x-auto">
            <div className="rounded-xl border border-outline-variant/10 overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-container-low/60">
                  <tr>
                    <th className="py-2 px-3 text-xs text-on-surface-variant font-medium text-center w-10">#</th>
                    <th className="py-2 px-4 text-xs text-on-surface-variant font-medium text-left">项目</th>
                    <th className="py-2 px-4 text-xs text-on-surface-variant font-medium text-left">作者</th>
                    <th className="py-2 px-4 text-xs text-on-surface-variant font-medium text-right">票数</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {items.length === 0
                    ? <tr><td colSpan={4} className="py-6 text-center text-sm text-on-surface-variant">暂无数据</td></tr>
                    : items.map((item, idx) => (
                      <tr key={item.demo_id} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-2 px-3 text-center">
                          {idx < 3
                            ? <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                idx === 0 ? 'bg-yellow-500/20 text-yellow-700' :
                                idx === 1 ? 'bg-gray-400/20 text-gray-600' :
                                'bg-orange-600/20 text-orange-700'
                              }`}>{idx + 1}</span>
                            : <span className="text-xs text-on-surface-variant/40">{idx + 1}</span>
                          }
                        </td>
                        <td className="py-2 px-4 font-medium text-on-surface text-sm">{item.name}</td>
                        <td className="py-2 px-4 text-xs text-on-surface-variant">
                          {item.submitter1_name}{item.submitter2_name ? ` / ${item.submitter2_name}` : ''}
                        </td>
                        <td className="py-2 px-4 text-right font-bold text-on-surface">{item.vote_count}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PreliminaryPage() {
  const router = useRouter();
  const { user } = useUser();

  const { data: prelimData, mutate: mutatePrelim, isLoading: prelimLoading } = useSWR<PrelimState>(
    '/api/preliminary', jsonFetcher, { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  const { data: demosData } = useSWR<{ demos: Demo[] }>(
    '/api/demos', jsonFetcher, { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const [shuffledDemos, setShuffledDemos] = useState<Demo[]>([]);
  useEffect(() => {
    if (demosData?.demos) setShuffledDemos(shuffle(demosData.demos));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demosData?.demos?.length]);

  // All selections are local — zero API calls on toggle
  const [localSelections, setLocalSelections] = useState<Set<number>>(new Set());

  // Active track tab for mode B (also used for browsing in mode A)
  const [activeTrack, setActiveTrack] = useState<'optimizer' | 'builder'>('optimizer');

  // Selected demo for right-pane preview (null = show first item)
  const [previewDemo, setPreviewDemo] = useState<Demo | null>(null);

  const isMobile = useMobile();
  const [showDetail, setShowDetail] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (message) { const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t); }
  }, [message]);

  // Set initial preview when demos load
  useEffect(() => {
    if (shuffledDemos.length > 0 && !previewDemo) {
      setPreviewDemo(shuffledDemos[0]);
      setActiveTrack(shuffledDemos[0].track);
    }
  }, [shuffledDemos, previewDemo]);

  // Derived counts
  const optimizerSelected = useMemo(
    () => [...localSelections].filter(id => shuffledDemos.find(d => d.id === id)?.track === 'optimizer').length,
    [localSelections, shuffledDemos]
  );
  const builderSelected = useMemo(
    () => [...localSelections].filter(id => shuffledDemos.find(d => d.id === id)?.track === 'builder').length,
    [localSelections, shuffledDemos]
  );

  const handleToggle = useCallback((demoId: number) => {
    setLocalSelections(prev => {
      const next = new Set(prev);
      if (next.has(demoId)) next.delete(demoId); else next.add(demoId);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!prelimData?.config) return;
    const config = prelimData.config;
    const ids = [...localSelections];
    const confirmMsg = config.mode === 'A'
      ? `确认提交 ${ids.length} 个项目吗？\n\n⚠️ 提交后不能修改。`
      : `确认提交？\nOptimizer：${optimizerSelected} 个 / Builder：${builderSelected} 个\n\n⚠️ 提交后不能修改。`;
    if (!confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/preliminary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo_ids: ids }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || '提交失败', type: 'error' });
      } else {
        mutatePrelim();
        setMessage({ text: '提交成功！', type: 'success' });
      }
    } catch {
      setMessage({ text: '网络错误，请重试', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }, [localSelections, optimizerSelected, builderSelected, prelimData, mutatePrelim]);

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (prelimLoading || !prelimData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <Loader2 size={24} className="animate-spin" /><span>加载中...</span>
        </div>
      </div>
    );
  }

  const { config, submitted } = prelimData;

  if (!user) {
    return (
      <div className="px-4 md:px-12 py-16 text-center">
        <p className="text-on-surface-variant mb-4">请先登录后参与海选投票</p>
        <a href="/" className="px-5 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90">前往登录</a>
      </div>
    );
  }

  if (!config.enabled) {
    return (
      <div className="px-4 md:px-12 py-12">
        <h2 className="font-headline text-3xl font-bold mb-6">海选投票</h2>
        <div className="p-5 bg-error-container rounded-xl text-on-error-container flex items-start gap-3">
          <Lock size={20} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">海选投票暂未开放</p>
            <p className="text-sm mt-1 opacity-80">{config.notice}</p>
          </div>
        </div>
      </div>
    );
  }

  // Readiness
  const modeAReady = config.mode === 'A' && localSelections.size === config.totalRequired;
  const modeBReady = config.mode === 'B'
    && optimizerSelected === config.optimizerRequired
    && builderSelected === config.builderRequired;
  const canSubmit = modeAReady || modeBReady;

  const submitLabel = canSubmit
    ? '确认提交'
    : config.mode === 'A'
      ? (() => {
          const diff = config.totalRequired - localSelections.size;
          return diff > 0 ? `还差 ${diff} 个` : `多选了 ${-diff} 个`;
        })()
      : '选满后提交';

  // Left list: for mode B, filter by activeTrack; mode A show all
  const listDemos = config.mode === 'B'
    ? shuffledDemos.filter(d => d.track === activeTrack)
    : shuffledDemos;

  // Right pane detail
  const detail = previewDemo;
  const detailMediaUrls = parseMediaUrls(detail?.media_urls);

  // ── Submitted / results view ──────────────────────────────────────────────────
  if (submitted || showResults) {
    return (
      <div className="flex flex-col md:h-[calc(100vh-60px)]">
        <header className="flex-shrink-0 px-4 md:px-12 pt-4 pb-2 flex items-center justify-end md:justify-between">
          <h2 className="font-headline text-2xl md:text-4xl font-bold text-on-surface hidden md:block">海选投票</h2>
          {config.canViewResults && (
            <button
              onClick={() => setShowResults(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-sm hover:bg-surface-container-highest transition-colors"
            >
              {showResults ? <Trophy size={15} /> : <BarChart2 size={15} />}
              {showResults ? '提交状态' : '查看结果'}
            </button>
          )}
        </header>
        {message && (
          <div className={`mx-4 md:mx-12 mb-4 p-3.5 rounded-xl flex items-center gap-3 text-sm ${
            message.type === 'success' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}
        {showResults && config.canViewResults
          ? <div className="flex-1 overflow-y-auto"><ResultsView /></div>
          : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-secondary" />
                </div>
                <h3 className="font-headline text-2xl font-bold mb-2">海选已提交</h3>
                <p className="text-on-surface-variant">感谢你的参与，结果将在活动结束后公布。</p>
              </div>
            </div>
          )
        }
      </div>
    );
  }

  // ── Voting layout (Gallery-style split pane) ──────────────────────────────────
  return (
    <div className="flex flex-col md:h-[calc(100vh-60px)]">

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 px-4 md:px-12 pt-4 pb-2 hidden md:block">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-headline text-2xl md:text-4xl font-bold text-on-surface">海选投票</h2>
            <p className="text-on-surface-variant text-sm mt-0.5">
              {config.mode === 'A'
                ? `从所有项目中选出 ${config.totalRequired} 个最值得晋级的项目`
                : `分赛道各选：Optimizer ${config.optimizerRequired} 个，Builder ${config.builderRequired} 个`
              }
              <span className="ml-2 text-on-surface-variant/40">· 顺序随机</span>
            </p>
          </div>
          {config.canViewResults && (
            <button onClick={() => setShowResults(true)} className="hidden md:flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-sm hover:bg-surface-container-highest transition-colors">
              <BarChart2 size={15} />查看结果
            </button>
          )}
        </div>
      </header>

      {/* ── Toast ─────────────────────────────────────────────────────────────── */}
      {message && (
        <div className={`mx-4 md:mx-12 mb-2 p-3 rounded-xl flex items-center gap-3 text-sm flex-shrink-0 ${
          message.type === 'success' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* ── Split pane ────────────────────────────────────────────────────────── */}
      <section className="flex flex-col md:flex-row md:flex-1 md:gap-5 md:min-h-0 px-4 pr-14 md:px-12 pb-20">

        {/* ── Left: list ──────────────────────────────────────────────────────── */}
        <div className={`${isMobile && showDetail ? 'hidden' : 'flex'} md:flex w-full md:w-[320px] flex-shrink-0 flex-col md:h-full md:overflow-hidden`}>

          {/* Track tabs */}
          <div className="flex-shrink-0 flex gap-1 p-1 bg-surface-container-low rounded-t-xl">
            {([
              { track: 'optimizer' as const, icon: '⚡', label: 'Optimizer', count: config.mode === 'B' ? `${optimizerSelected}/${config.optimizerRequired}` : String(shuffledDemos.filter(d => d.track === 'optimizer').length), activeClass: 'bg-secondary text-on-secondary' },
              { track: 'builder' as const, icon: '🛠️', label: 'Builder', count: config.mode === 'B' ? `${builderSelected}/${config.builderRequired}` : String(shuffledDemos.filter(d => d.track === 'builder').length), activeClass: 'bg-tertiary text-on-tertiary' },
            ]).map(({ track, icon, label, count, activeClass }) => (
              <button
                key={track}
                onClick={() => {
                  setActiveTrack(track);
                  const first = shuffledDemos.find(d => d.track === track);
                  if (first) setPreviewDemo(first);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-headline text-sm font-bold transition-all ${
                  activeTrack === track ? `${activeClass} shadow-sm` : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-normal ${
                  activeTrack === track ? 'bg-black/10' : 'bg-surface-container-high text-on-surface-variant'
                }`}>{count}</span>
              </button>
            ))}
          </div>

          {/* List */}
          <div className="md:flex-1 md:overflow-y-auto border-x border-b border-outline-variant/20 rounded-b-xl bg-surface-container-low/50">
            {listDemos.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-on-surface-variant text-sm">
                <Loader2 size={16} className="animate-spin mr-2" />加载中...
              </div>
            ) : listDemos.map(demo => {
              const isSelected = localSelections.has(demo.id);
              const isPreviewing = previewDemo?.id === demo.id;
              const keywords = demo.keywords
                ? demo.keywords.split(/[、,，]/).map(k => k.trim()).filter(Boolean).slice(0, 3)
                : [];
              return (
                <div key={demo.id} className="border-b border-outline-variant/20">
                <div
                  className={`
                    flex items-start gap-3 p-3 cursor-pointer transition-all
                    ${isPreviewing && !isSelected
                      ? activeTrack === 'optimizer'
                        ? 'bg-surface-container-lowest border-l-2 border-secondary'
                        : 'bg-surface-container-lowest border-l-2 border-tertiary'
                      : isSelected
                        ? 'bg-secondary/5 border-l-2 border-secondary'
                        : 'hover:bg-surface-container-high border-l-2 border-transparent'
                    }
                  `}
                >
                  {/* Checkbox — 点击仅切换选中状态，不跳转详情 */}
                  <div
                    className="flex-shrink-0 mt-0.5 cursor-pointer"
                    onClick={e => { e.stopPropagation(); handleToggle(demo.id); setPreviewDemo(demo); }}
                  >
                    {isSelected
                      ? <CheckSquare size={18} className="text-secondary" />
                      : <Square size={18} className="text-outline-variant/40" />
                    }
                  </div>

                  {/* Content — 点击预览/跳转详情 */}
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => { setPreviewDemo(demo); if (isMobile) setShowDetail(true); }}
                  >
                    <h3 className="font-headline text-base font-bold leading-snug line-clamp-2 text-on-surface mb-0.5">{demo.name}</h3>
                    <p className="text-xs text-on-surface-variant/70 line-clamp-1 mb-1.5">{demo.summary}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {keywords.map((kw, i) => (
                        <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${
                          activeTrack === 'optimizer' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'
                        }`}>{kw}</span>
                      ))}
                      <span className="text-xs text-on-surface-variant/50 ml-auto">
                        {demo.submitter1_name}{demo.submitter2_name ? ` +1` : ''}
                      </span>
                    </div>
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: detail ───────────────────────────────────────────────────── */}
        <div className={`${isMobile && !showDetail ? 'hidden' : 'flex'} md:flex md:flex-1 bg-surface-container-low rounded-xl flex-col md:h-full md:overflow-hidden border border-outline-variant/10`}>
          {detail ? (
            <>
              {/* Track color bar */}
              <div className={`h-0.5 flex-shrink-0 ${detail.track === 'optimizer' ? 'bg-secondary' : 'bg-tertiary'}`} />

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

              {/* Detail header with select button */}
              <div className="px-4 md:px-8 pt-5 pb-4 flex-shrink-0 border-b border-outline-variant/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded ${
                        detail.track === 'optimizer' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'
                      }`}>{detail.track}</span>
                      <span className="text-lg">{detail.track === 'optimizer' ? '⚡️' : '🛠️'}</span>
                    </div>
                    <h1 className="text-2xl font-headline font-bold text-on-surface">{detail.name}</h1>
                    <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">{detail.summary}</p>
                  </div>

                  {/* Select / deselect button */}
                  <button
                    onClick={() => handleToggle(detail.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                      localSelections.has(detail.id)
                        ? 'bg-secondary text-on-secondary hover:opacity-80'
                        : 'bg-surface-container-high text-on-surface hover:bg-secondary/10 hover:text-secondary border border-outline-variant/30'
                    }`}
                  >
                    {localSelections.has(detail.id)
                      ? <><CheckSquare size={16} /> 已选</>
                      : <><Square size={16} /> 选择</>
                    }
                  </button>
                </div>
              </div>

              {/* Detail body */}
              <div className="md:flex-1 md:overflow-y-auto px-4 md:px-8 py-6 space-y-6">
                {(detail.background || detail.solution) && (
                  <div className="space-y-5 pb-6 border-b border-outline-variant/20">
                    {detail.background && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-2">Why / 为什么要做</p>
                        <div className="markdown-content prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: detail.background }} />
                      </div>
                    )}
                    {detail.solution && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-tertiary font-bold mb-2">How / 怎么解决的</p>
                        <div className="markdown-content prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: detail.solution }} />
                      </div>
                    )}
                    {detail.keywords && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Key Words</p>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.keywords.split(/[、,，]/).map((kw, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full">{kw.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pb-6 border-b border-outline-variant/20">
                  <p className="text-xs uppercase tracking-widest text-outline font-bold mb-2">负责人</p>
                  <div className="flex items-center gap-2 text-sm text-on-surface">
                    <span className="font-semibold">{detail.submitter1_name}</span>
                    {detail.submitter1_dept && <span className="text-on-surface-variant">({detail.submitter1_dept})</span>}
                    {detail.submitter2_name && (
                      <>
                        <span className="text-outline">+</span>
                        <span className="font-semibold">{detail.submitter2_name}</span>
                        {detail.submitter2_dept && <span className="text-on-surface-variant">({detail.submitter2_dept})</span>}
                      </>
                    )}
                  </div>
                </div>

                {parseDemoLinks(detail.demo_link).length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-outline font-bold mb-2">作品链接</p>
                    <div className="space-y-1">
                      {parseDemoLinks(detail.demo_link).map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                          {link.title || '链接'}<ExternalLink size={12} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {detailMediaUrls.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-outline font-bold mb-2">截图</p>
                    <div className="grid grid-cols-2 gap-3">
                      {detailMediaUrls.map((url, i) => {
                        const isVideo = /\.(mp4|mov|webm|avi)$/i.test(url);
                        return (
                          <div key={i} className="aspect-video bg-surface-container-highest rounded-lg overflow-hidden">
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
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant">
              <Loader2 size={20} className="animate-spin mr-2" />加载中...
            </div>
          )}
        </div>
      </section>

      {/* ── Floating bottom bar · 手机全宽条 / 桌面胶囊 ─────────────────────── */}

      {/* 手机：全宽条，紧贴底部 Tab Bar 上方 */}
      <div className={`md:hidden fixed bottom-[60px] inset-x-0 z-50 border-t px-4 py-2.5 flex items-center justify-between transition-all ${
        canSubmit
          ? 'bg-on-surface text-surface border-on-surface/20'
          : 'bg-surface-container/95 backdrop-blur-sm text-on-surface border-outline-variant/20'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          {config.mode === 'A' ? (
            <span className="text-xs font-medium tabular-nums">
              已选 <span className="font-bold">{localSelections.size}</span>/{config.totalRequired}
              {!canSubmit && localSelections.size < config.totalRequired && (
                <span className="ml-1 text-on-surface-variant/50">还差 {config.totalRequired - localSelections.size} 个</span>
              )}
            </span>
          ) : (
            <span className="text-xs font-medium tabular-nums">
              ⚡ <span className="font-bold">{optimizerSelected}</span>/{config.optimizerRequired}
              <span className="mx-1 text-outline-variant/40">·</span>
              🛠️ <span className="font-bold">{builderSelected}</span>/{config.builderRequired}
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`flex-shrink-0 flex items-center gap-1 font-bold text-sm px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
            canSubmit
              ? 'bg-surface text-on-surface'
              : 'text-on-surface-variant/40 cursor-not-allowed'
          }`}
        >
          {submitting ? <Loader2 size={13} className="animate-spin" /> : canSubmit ? <CheckCircle size={13} /> : null}
          {submitLabel}
        </button>
      </div>

      {/* 桌面：居中胶囊 */}
      <div className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className={`
          pointer-events-auto flex items-center gap-4 px-5 py-3 rounded-2xl shadow-xl border transition-all
          ${canSubmit ? 'bg-on-surface text-surface border-on-surface/20' : 'bg-surface-container text-on-surface border-outline-variant/30'}
        `}>
          {config.mode === 'A' ? (
            <span className={`text-sm font-medium tabular-nums ${canSubmit ? 'opacity-80' : ''}`}>
              已选 <span className="font-bold">{localSelections.size}</span> / {config.totalRequired}
            </span>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <span className={canSubmit ? 'opacity-80' : ''}>
                ⚡ Optimizer <span className="font-bold tabular-nums">{optimizerSelected}</span>/{config.optimizerRequired}
              </span>
              <span className={canSubmit ? 'opacity-40' : 'text-outline-variant/40'}>·</span>
              <span className={canSubmit ? 'opacity-80' : ''}>
                🛠️ Builder <span className="font-bold tabular-nums">{builderSelected}</span>/{config.builderRequired}
              </span>
            </div>
          )}
          <div className={`w-px h-4 ${canSubmit ? 'bg-surface/20' : 'bg-outline-variant/30'}`} />
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`flex items-center gap-1.5 font-bold text-sm transition-all ${
              canSubmit ? 'text-surface hover:opacity-80 active:scale-95' : 'text-on-surface-variant/40 cursor-not-allowed'
            }`}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : canSubmit ? <CheckCircle size={14} /> : null}
            {submitLabel}
            {canSubmit && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
