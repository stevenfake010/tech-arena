'use client';

/**
 * 投票样式预览页 — /leaderboard-preview
 * 仅用于预览 UI 状态，无真实数据请求
 */

import { useState } from 'react';
import {
  CheckCircle, CheckSquare, Square, ThumbsUp,
  Lock, ExternalLink, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { useMobile } from '@/lib/hooks/useMobile';

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_DEMOS = [
  { id: 1,  name: 'AI 合同审核助手',      summary: '用 LLM 自动识别合同风险条款，准确率 92%',            track: 'optimizer', submitter1_name: '王小明', submitter1_dept: '法务部', submitter2_name: null,   keywords: '合同,风险,NLP',      vote_count: 18, submitted_by: 99 },
  { id: 2,  name: '智能排班系统',          summary: '基于约束优化自动生成排班表，减少人工 90%',           track: 'optimizer', submitter1_name: '李思思', submitter1_dept: '运营部', submitter2_name: '陈强',  keywords: '排班,优化,约束',     vote_count: 14, submitted_by: 99 },
  { id: 3,  name: '多模态产品描述生成',    summary: '输入图片自动生成营销文案，支持多语言',               track: 'optimizer', submitter1_name: '张伟',   submitter1_dept: '市场部', submitter2_name: null,   keywords: '多模态,文案,营销',   vote_count: 11, submitted_by: 99 },
  { id: 4,  name: '代码 Review Bot',       summary: '接入 CI/CD 流水线，自动发现安全漏洞和代码异味',     track: 'optimizer', submitter1_name: '刘洋',   submitter1_dept: '技术部', submitter2_name: null,   keywords: 'DevOps,安全,CI',     vote_count: 9,  submitted_by: 1  },
  { id: 5,  name: '客服知识库 RAG',        summary: '基于私有文档构建的检索增强生成客服系统',             track: 'optimizer', submitter1_name: '赵丽',   submitter1_dept: '客服部', submitter2_name: '孙浩',  keywords: 'RAG,客服,知识库',    vote_count: 7,  submitted_by: 99 },
  { id: 6,  name: '数据看板自然语言查询',  summary: '用中文问问题，自动生成 SQL 并返回图表',             track: 'optimizer', submitter1_name: '吴峰',   submitter1_dept: '数据部', submitter2_name: null,   keywords: 'NL2SQL,BI,数据',     vote_count: 6,  submitted_by: 99 },
  { id: 7,  name: 'AI 面试官',             summary: '模拟真实面试场景，提供即时反馈和评估报告',           track: 'optimizer', submitter1_name: '郑华',   submitter1_dept: 'HR',     submitter2_name: null,   keywords: '面试,评估,HR',       vote_count: 5,  submitted_by: 99 },
  { id: 8,  name: '会议纪要自动生成',      summary: '录音 → 转写 → 结构化纪要，支持行动项提取',         track: 'optimizer', submitter1_name: '钱敏',   submitter1_dept: '行政部', submitter2_name: null,   keywords: '会议,转写,提效',     vote_count: 4,  submitted_by: 99 },
  { id: 9,  name: '供应链异常预警系统',    summary: '实时监控供应链数据，提前预警潜在断供风险',           track: 'optimizer', submitter1_name: '林磊',   submitter1_dept: '供应链', submitter2_name: null,   keywords: '供应链,预警,风控',   vote_count: 3,  submitted_by: 99 },
  { id: 10, name: '内部知识问答机器人',    summary: '接入公司所有内部文档，秒级回答员工日常问题',         track: 'optimizer', submitter1_name: '陈静',   submitter1_dept: 'IT部',   submitter2_name: '黄涛',  keywords: '知识库,问答,内部',   vote_count: 2,  submitted_by: 99 },
  { id: 11, name: '广告素材 A/B 测试助手', summary: '自动生成多版本素材并预测点击率，节省人工评审',       track: 'optimizer', submitter1_name: '周杰',   submitter1_dept: '广告部', submitter2_name: null,   keywords: 'A/B测试,广告,CTR',   vote_count: 1,  submitted_by: 99 },
  { id: 12, name: '财务报表智能解读',      summary: '上传财报 PDF，一键生成摘要与风险提示',               track: 'optimizer', submitter1_name: '许燕',   submitter1_dept: '财务部', submitter2_name: null,   keywords: '财务,PDF,摘要',      vote_count: 1,  submitted_by: 99 },
  { id: 13, name: '多语言客服翻译中枢',    summary: '实时双向翻译，支持 30 种语言，延迟 < 200ms',        track: 'optimizer', submitter1_name: '韩宇',   submitter1_dept: '国际部', submitter2_name: '吴倩',  keywords: '翻译,多语言,实时',   vote_count: 0,  submitted_by: 99 },
  { id: 14, name: '电商评论情感分析',      summary: '批量分析用户评论，自动归类正负面并提炼改进点',       track: 'optimizer', submitter1_name: '宋雪',   submitter1_dept: '电商部', submitter2_name: null,   keywords: '情感分析,评论,NLP',  vote_count: 0,  submitted_by: 99 },
];

const VOTED_IDS = [1, 3, 5]; // 已投票的 demo id

type ViewMode = 'before' | 'selected' | 'after';

const MODE_LABELS: Record<ViewMode, string> = {
  before:   '① 投票前',
  selected: '② 已选中（未提交）',
  after:    '③ 投票后',
};

// Shuffle once on module load for stable random order in preview
function shuffleOnce<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const SHUFFLED_DEMOS = shuffleOnce(MOCK_DEMOS);

export default function LeaderboardPreviewPage() {
  const [mode, setMode] = useState<ViewMode>('after');
  const [previewId, setPreviewId] = useState(1);
  const [localSelected, setLocalSelected] = useState<Set<number>>(new Set([1, 3, 5]));
  const isMobile = useMobile();
  const [showDetail, setShowDetail] = useState(false);

  // Simulate state based on mode
  const myVotes = mode === 'after' ? VOTED_IDS.map(id => ({ demo_id: id, vote_type: 'best_optimizer' })) : [];
  const selectedVotes = mode === 'selected' ? [...localSelected] : [];
  const votesUsed = myVotes.length;
  const selectedCount = selectedVotes.length;
  const maxVotes = 3;
  const showResults = mode === 'after';
  const hasSubmitted = mode === 'after';
  const canSubmit = mode === 'selected' && selectedCount > 0;

  // Pre-vote: random order; post-vote: sorted by vote_count
  const sortedDemos = showResults
    ? [...MOCK_DEMOS].sort((a, b) => b.vote_count - a.vote_count)
    : SHUFFLED_DEMOS;

  const top10 = sortedDemos.slice(0, 10);
  // rankMap only populated in 'after' mode — no rankings before voting
  const rankMap = mode === 'after' ? new Map(top10.map((d, i) => [d.id, i + 1])) : new Map<number, number>();

  const previewItem = MOCK_DEMOS.find(d => d.id === previewId)!;
  const isPreviewVoted    = myVotes.some(v => v.demo_id === previewId);
  const isPreviewSelected = selectedVotes.includes(previewId);
  const isPreviewMyDemo   = previewItem.submitted_by === 1; // user id = 1

  function toggleLocal(id: number) {
    if (mode !== 'selected') return;
    setLocalSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else if (next.size < 3) next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col md:h-[calc(100vh-60px)]">

      {/* ── Preview mode switcher ──────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-outline-variant/20 px-4 md:px-12 py-2 flex items-center gap-4 bg-surface-container-lowest">
        <span className="text-[11px] font-bold text-on-surface-variant/50 uppercase tracking-widest">状态预览</span>
        <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl">
          {(Object.keys(MODE_LABELS) as ViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === m ? 'bg-on-surface text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
        <span className="text-xs text-on-surface-variant/50">
          {mode === 'before'   && '空状态 · 无排名 · 随机顺序'}
          {mode === 'selected' && '点击左侧 checkbox 可切换选中 · 底部出现提交按钮'}
          {mode === 'after'    && '排名 + 票数 · 分割线 · 已投票状态'}
        </span>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 px-4 md:px-12 pt-4 pb-2 hidden md:block">
        <h2 className="font-headline text-2xl md:text-4xl font-bold text-on-surface">Demo Leaderboard</h2>
        <p className="text-sm text-on-surface-variant mt-0.5">
          最佳Demo各赛道 3 票 · 专项奖 1 票 · 评委权重 ×2 · 投后不可修改
        </p>
      </header>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 md:px-12 pt-2 pb-2 flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-on-surface-variant/50 uppercase tracking-wider hidden md:inline">🏆 最佳Demo</span>
          <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl">
            <button className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-headline text-sm md:text-base font-bold bg-secondary text-on-secondary shadow-sm whitespace-nowrap">
              ⚡ Optimizer
              {mode === 'after' && <CheckCircle size={11} className="opacity-60" />}
            </button>
            <button className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-headline text-sm md:text-base font-bold text-on-surface-variant hover:bg-surface-container-high whitespace-nowrap">
              🛠️ Builder
            </button>
          </div>
        </div>
        <div className="w-px h-6 bg-outline-variant/30" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-on-surface-variant/50 uppercase tracking-wider hidden md:inline">⭐ 专项奖</span>
          <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl">
            {['🧠 最脑洞', '🔥 最感染力', '💎 最实用'].map(label => (
              <button key={label} className="px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-headline text-sm md:text-base font-bold text-on-surface-variant hover:bg-surface-container-high whitespace-nowrap">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Split pane ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col md:flex-row md:flex-1 md:gap-5 md:min-h-0 px-4 md:px-12 pb-20">

        {/* Left list */}
        <div className={`${isMobile && showDetail ? 'hidden' : 'flex'} md:flex w-full md:w-[420px] flex-shrink-0 flex-col md:h-full md:overflow-hidden`}>
          <div className="hidden md:block flex-shrink-0 p-2 border border-b-0 border-outline-variant/20 rounded-t-xl bg-surface-container-low/50 border-t-2 border-t-secondary/40">
            <input
              readOnly
              placeholder="搜索项目或作者..."
              className="w-full bg-surface-container-lowest border border-outline-variant/30 text-sm px-3 py-2 rounded-lg placeholder:text-outline/60"
            />
          </div>
          <div className="md:flex-1 md:overflow-y-auto border border-outline-variant/20 rounded-xl md:rounded-t-none bg-surface-container-low/50">
            {sortedDemos.map((item, index) => {
              const showDivider = showResults && index === rankMap.size && rankMap.size > 0;
              const voted    = myVotes.some(v => v.demo_id === item.id);
              const selected = selectedVotes.includes(item.id);
              const isPrev   = previewId === item.id;
              const rank     = rankMap.get(item.id);
              const keywords = item.keywords.split(',').slice(0, 3);

              return (
                <div key={item.id}>
                  {/* ── Top-10 / rest divider ─────────────────────────────── */}
                  {showDivider && (
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-container-low/80 border-y border-outline-variant/15">
                      <div className="flex-1 h-px bg-outline-variant/25" />
                      <span className="text-[10px] font-medium text-on-surface-variant/50 uppercase tracking-wider whitespace-nowrap">
                        后续排名不分先后
                      </span>
                      <div className="flex-1 h-px bg-outline-variant/25" />
                    </div>
                  )}

                  <div className="border-b border-outline-variant/20">
                  <div
                    className={`flex items-start gap-3 p-3 cursor-pointer transition-all ${
                      voted    ? 'bg-secondary/5 border-l-2 border-secondary' :
                      selected ? 'bg-secondary/5 border-l-2 border-secondary/60' :
                      isPrev   ? 'bg-surface-container-lowest border-l-2 border-primary/30' :
                                 'hover:bg-surface-container-high border-l-2 border-transparent'
                    }`}
                  >
                    {/* Status icon — click to toggle */}
                    <div
                      className="flex-shrink-0 mt-0.5 cursor-pointer"
                      onClick={e => { e.stopPropagation(); if (!voted) { setPreviewId(item.id); toggleLocal(item.id); } }}
                    >
                      {voted
                        ? <CheckCircle size={18} className="text-secondary" />
                        : selected
                          ? <CheckSquare size={18} className="text-secondary" />
                          : <Square size={18} className="text-outline-variant/40 hover:text-outline transition-colors" />
                      }
                    </div>

                    {/* Content — click to preview */}
                    <div className="flex-1 min-w-0" onClick={() => { setPreviewId(item.id); if (isMobile) setShowDetail(true); }}>
                      {/* Title row: name left, rank badge right */}
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h3 className="text-base font-headline font-bold leading-snug text-on-surface line-clamp-2">{item.name}</h3>
                        {rank && (
                          <span className={`flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded text-[10px] font-bold mt-0.5 ${
                            rank === 1 ? 'bg-yellow-500/20 text-yellow-700' :
                            rank === 2 ? 'bg-gray-400/20 text-gray-500' :
                            rank === 3 ? 'bg-orange-500/20 text-orange-600' :
                                         'bg-surface-container text-on-surface-variant/50'
                          }`}>#{rank}</span>
                        )}
                      </div>
                      <p className="text-sm text-on-surface-variant/70 line-clamp-1 mb-2">{item.summary}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {keywords.map((kw, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-secondary/10 text-secondary">{kw}</span>
                        ))}
                        <span className="text-xs ml-auto">
                          {showResults && rank
                            ? <span className="font-bold text-on-surface/60">{item.vote_count} 票</span>
                            : <span className="text-on-surface-variant/50">{item.submitter1_name}{item.submitter2_name ? ' +1' : ''}</span>
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

        {/* Right detail */}
        <div className={`${isMobile && !showDetail ? 'hidden' : 'flex'} md:flex md:flex-1 bg-surface-container-low rounded-xl flex-col md:h-full md:overflow-hidden border border-outline-variant/10`}>
          <div className="h-0.5 flex-shrink-0 bg-secondary" />

          {isMobile && (
            <button
              onClick={() => setShowDetail(false)}
              className="md:hidden sticky top-0 z-10 flex items-center gap-1 px-4 py-2.5 text-sm text-on-surface-variant border-b border-outline-variant/10 bg-surface-container-low flex-shrink-0"
            >
              <ChevronLeft size={16} />
              <span>返回列表</span>
            </button>
          )}

          {/* Header */}
          <div className="px-4 md:px-8 pt-5 pb-4 flex-shrink-0 border-b border-outline-variant/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-secondary/10 text-secondary">
                    optimizer
                  </span>
                  <span className="text-lg">⚡️</span>
                  {rankMap.has(previewItem.id) && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      rankMap.get(previewItem.id)! <= 3
                        ? 'bg-yellow-500/20 text-yellow-700'
                        : 'bg-surface-container text-on-surface-variant/60'
                    }`}>
                      #{rankMap.get(previewItem.id)}
                      {showResults && <span className="ml-1 font-normal opacity-70">{previewItem.vote_count} 票</span>}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-headline font-bold text-on-surface">{previewItem.name}</h1>
                <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">{previewItem.summary}</p>
              </div>

              {/* Vote button — varies by state */}
              {isPreviewMyDemo ? (
                <button disabled className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-surface-container text-outline/40 border border-outline-variant/20 cursor-not-allowed">
                  <Lock size={15} /> 我的项目
                </button>
              ) : isPreviewVoted ? (
                <button disabled className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-secondary/10 text-secondary border border-secondary/20">
                  <CheckCircle size={15} /> 已投票
                </button>
              ) : isPreviewSelected ? (
                <button
                  onClick={() => toggleLocal(previewId)}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-secondary text-on-secondary hover:opacity-80 transition-all active:scale-95"
                >
                  <CheckSquare size={15} /> 已选
                </button>
              ) : (
                <button
                  onClick={() => { if (mode === 'selected') toggleLocal(previewId); }}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-surface-container-high text-on-surface hover:bg-secondary/10 hover:text-secondary border border-outline-variant/30 transition-all active:scale-95"
                >
                  <ThumbsUp size={15} /> 投票
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="md:flex-1 md:overflow-y-auto px-4 md:px-8 py-6 space-y-6">
            <div className="space-y-5 pb-6 border-b border-outline-variant/20">
              <div>
                <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-2">Why / 为什么要做</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  现有合同审阅流程完全依赖人工，法务人员平均每份合同需花费 2-4 小时仔细阅读，且容易因疲劳遗漏关键风险条款，导致后续纠纷。
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-tertiary font-bold mb-2">How / 怎么解决的</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  基于 GPT-4o 构建专项 RAG 系统，结合公司历史合同数据微调 prompt，实现条款自动分类、风险评级和修改建议一键生成。
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Key Words</p>
                <div className="flex flex-wrap gap-1.5">
                  {['合同审核', '风险识别', 'NLP', 'RAG', '法务自动化'].map(kw => (
                    <span key={kw} className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full">{kw}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pb-6 border-b border-outline-variant/20">
              <p className="text-xs uppercase tracking-widest text-outline font-bold mb-2">负责人</p>
              <div className="flex items-center gap-2 text-sm text-on-surface">
                <span className="font-semibold">王小明</span>
                <span className="text-on-surface-variant">(法务部)</span>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-outline font-bold mb-2">作品链接</p>
              <a href="#" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                Demo 演示地址 <ExternalLink size={12} />
              </a>
            </div>

            {/* Mock screenshot placeholders */}
            <div>
              <p className="text-xs uppercase tracking-widest text-outline font-bold mb-2">截图</p>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map(i => (
                  <div key={i} className="aspect-video bg-surface-container-highest rounded-lg flex items-center justify-center text-on-surface-variant/30 text-xs">
                    截图 {i}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom bar ──────────────────────────────────────────────────────── */}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className={`
          pointer-events-auto flex items-center gap-4 px-5 py-3 rounded-2xl shadow-xl border transition-all
          ${canSubmit
            ? 'bg-on-surface text-surface border-on-surface/20'
            : 'bg-surface-container text-on-surface border-outline-variant/30'}
        `}>
          <span className={`text-xs font-bold uppercase tracking-wider ${canSubmit ? 'opacity-50' : 'text-on-surface-variant/50'}`}>
            ⚡ Optimizer
          </span>
          <div className={`w-px h-4 ${canSubmit ? 'bg-surface/20' : 'bg-outline-variant/30'}`} />

          {hasSubmitted ? (
            <span className="text-sm flex items-center gap-1.5">
              <CheckCircle size={13} className="text-secondary" />
              <span className="font-medium">已投 {votesUsed}/{maxVotes}</span>
            </span>
          ) : (
            <span className={`text-sm font-medium tabular-nums ${canSubmit ? 'opacity-80' : ''}`}>
              已选 <span className="font-bold">{selectedCount}</span>/{maxVotes}
              {selectedCount === 0 && <span className="text-on-surface-variant/50 ml-1.5 text-xs">再选 {maxVotes} 个</span>}
            </span>
          )}

          {!hasSubmitted && (
            <>
              <div className={`w-px h-4 ${canSubmit ? 'bg-surface/20' : 'bg-outline-variant/30'}`} />
              <button
                className={`flex items-center gap-1.5 font-bold text-sm transition-all ${
                  canSubmit ? 'text-surface hover:opacity-80 active:scale-95' : 'text-on-surface-variant/40 cursor-not-allowed'
                }`}
              >
                {canSubmit ? <ThumbsUp size={14} /> : null}
                {canSubmit ? `提交投票 (${selectedCount})` : '选择后提交'}
                {canSubmit && <ChevronRight size={14} />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
