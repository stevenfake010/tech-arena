'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Star, CheckCircle, AlertCircle, Lock, Search, ExternalLink } from 'lucide-react';
import { BEST_DEMO_AWARDS, SPECIAL_AWARDS } from '@/lib/constants';
import useSWR from 'swr';
import { useUser } from '@/lib/hooks/useUser';

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

interface Vote {
  demo_id: number;
  vote_type: string;
}

interface SelectedVote {
  demo_id: number;
  vote_type: string;
}

const jsonFetcher = (url: string) => fetch(url).then(r => r.json());

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useUser();

  // SWR: 投票配置
  const { data: votingStatus } = useSWR<{ isVotingOpen: boolean; notice: string }>(
    '/api/config',
    jsonFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // SWR: 我的投票记录
  const { data: votesData, mutate: mutateVotes } = useSWR<{ votes: Vote[] }>(
    '/api/votes',
    jsonFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  const myVotes = votesData?.votes || [];

  // 各奖项数据 - 使用对象存储，按需加载
  const [leaderboardData, setLeaderboardData] = useState<Record<string, LeaderboardItem[]>>({});
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
  const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set());

  // 用户当前选择的投票（盲投阶段）
  const [selectedVotes, setSelectedVotes] = useState<SelectedVote[]>([]);

  const [submitting, setSubmitting] = useState(false);
  // Tab 状态：5 个具体奖项
  const [activeTab, setActiveTab] = useState<'optimizer' | 'builder' | 'special_brain' | 'special_infectious' | 'special_useful'>('optimizer');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // 搜索关键词
  const [searchQuery, setSearchQuery] = useState('');

  // 获取当前 Tab 的 vote_type
  const getVoteType = useCallback((tab: string): string => {
    switch (tab) {
      case 'optimizer': return 'best_optimizer';
      case 'builder': return 'best_builder';
      default: return tab;
    }
  }, []);

  // 初始化加载当前 Tab 的数据
  useEffect(() => {
    loadTabData(activeTab);
  }, []);

  // Tab 切换时加载对应数据
  useEffect(() => {
    if (!loadedTabs.has(activeTab)) {
      loadTabData(activeTab);
    }
  }, [activeTab]);

  // 清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 加载指定 Tab 的数据
  async function loadTabData(tab: string) {
    const voteType = getVoteType(tab);
    if (loadingTabs.has(tab)) return;

    setLoadingTabs(prev => new Set(prev).add(tab));

    try {
      const res = await fetch(`/api/leaderboard?vote_type=${voteType}`);
      const data = await res.json();

      setLeaderboardData(prev => ({
        ...prev,
        [tab]: data.leaderboard || []
      }));
      setLoadedTabs(prev => new Set(prev).add(tab));
    } catch (error) {
      console.error('Failed to load tab data:', error);
    } finally {
      setLoadingTabs(prev => {
        const next = new Set(prev);
        next.delete(tab);
        return next;
      });
    }
  }

  function hasVotedFor(demoId: number, voteType: string) {
    return myVotes.some(v => v.demo_id === demoId && v.vote_type === voteType);
  }

  // 判断是否在某个奖项投过票
  function hasVotedInType(voteType: string) {
    return myVotes.some(v => v.vote_type === voteType);
  }

  function isSelected(demoId: number, voteType: string) {
    return selectedVotes.some(v => v.demo_id === demoId && v.vote_type === voteType);
  }

  function getVotesUsed(voteType: string) {
    return myVotes.filter(v => v.vote_type === voteType).length;
  }

  function getSelectedCount(voteType: string) {
    return selectedVotes.filter(v => v.vote_type === voteType).length;
  }

  // 切换选择（盲投阶段）
  function toggleSelection(demoId: number, voteType: string, maxVotes: number) {
    // 检查投票是否开放
    if (votingStatus && !votingStatus.isVotingOpen) {
      setMessage({ text: votingStatus.notice, type: 'error' });
      return;
    }

    // 如果已经投过票，不能再次选择
    if (hasVotedFor(demoId, voteType)) {
      return;
    }

    const currentSelected = getSelectedCount(voteType);
    const isCurrentlySelected = isSelected(demoId, voteType);

    if (isCurrentlySelected) {
      // 取消选择
      setSelectedVotes(prev => prev.filter(v => !(v.demo_id === demoId && v.vote_type === voteType)));
    } else {
      // 检查是否已达上限
      const votesUsed = getVotesUsed(voteType);
      if (votesUsed + currentSelected >= maxVotes) {
        setMessage({ text: `该奖项最多投 ${maxVotes} 票`, type: 'error' });
        return;
      }
      // 添加选择
      setSelectedVotes(prev => [...prev, { demo_id: demoId, vote_type: voteType }]);
    }
  }

  // 提交当前 Tab 的投票
  async function submitTabVotes(voteType: string) {
    const tabVotes = selectedVotes.filter(v => v.vote_type === voteType);
    if (tabVotes.length === 0) {
      setMessage({ text: '请至少选择一个项目', type: 'error' });
      return;
    }

    if (!confirm(`确认提交 ${tabVotes.length} 票？\n\n⚠️ 投票后将不能修改。`)) {
      return;
    }

    setSubmitting(true);

    try {
      // 批量提交投票
      const results = await Promise.all(
        tabVotes.map(async (vote) => {
          const res = await fetch('/api/votes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ demo_id: vote.demo_id, vote_type: vote.vote_type }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            console.error('投票失败:', vote.demo_id, vote.vote_type, data.error);
          }
          return { ...vote, success: res.ok, error: data.error };
        })
      );

      const successCount = results.filter(r => r.success).length;
      const failedResults = results.filter(r => !r.success);
      
      if (failedResults.length > 0) {
        console.error('投票失败详情:', failedResults);
      }
      
      if (successCount === tabVotes.length) {
        // 全部成功 — 通过 SWR mutate 更新投票缓存
        mutateVotes(
          (current) => ({ votes: [...(current?.votes || []), ...tabVotes] }),
          false
        );
        setSelectedVotes(prev => prev.filter(v => v.vote_type !== voteType));
        // 刷新当前 Tab 数据
        loadTabData(activeTab);
        setMessage({ text: '投票成功！', type: 'success' });
      } else {
        // 部分或全部失败
        const isAllFailed = successCount === 0;
        const errorMsg = failedResults[0]?.error || '';
        const actionText = isAllFailed ? '提交失败' : '部分提交失败';
        setMessage({ 
          text: `${actionText}: ${errorMsg || '请检查投票规则后重试'}`, 
          type: 'error' 
        });
      }
    } catch (error) {
      setMessage({ text: '网络错误，请重试', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  // 选择按钮组件
  function SelectButton({ item, voteType, maxVotes }: { item: LeaderboardItem; voteType: string; maxVotes: number }) {
    // 投票未开放
    if (votingStatus && !votingStatus.isVotingOpen) {
      return (
        <button disabled className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-surface-container-high text-outline cursor-not-allowed min-w-[70px] flex items-center justify-center gap-1">
          <Lock size={12} /> 未开始
        </button>
      );
    }

    // 游客模式
    if (!user) {
      return (
        <button onClick={() => setMessage({ text: '游客模式无法投票，请先登录', type: 'error' })} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-surface-container-high text-outline hover:text-on-surface transition-colors min-w-[70px]">
          投票
        </button>
      );
    }

    // 不能给自己的项目投票
    const isMyDemo = item.submitted_by === user.id;

    const isVoted = hasVotedFor(item.id, voteType);
    const isSelectedItem = isSelected(item.id, voteType);

    // 已投票状态
    if (isVoted) {
      return (
        <button disabled className="w-[88px] py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-secondary text-on-secondary flex items-center justify-center gap-1">
          <CheckCircle size={14} /> 已投
        </button>
      );
    }

    // 自己的项目 - 禁用并提示
    if (isMyDemo) {
      return (
        <button 
          disabled 
          title="不能给自己的项目投票"
          className="w-[88px] py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-surface-container-high text-outline/50 cursor-not-allowed flex items-center justify-center gap-1"
        >
          <Lock size={12} /> 我的
        </button>
      );
    }

    // 可选择状态
    return (
      <button
        onClick={() => toggleSelection(item.id, voteType, maxVotes)}
        className={`
          w-[88px] py-2 rounded-lg text-xs font-bold uppercase tracking-wider
          transition-all active:scale-95 border-2 flex items-center justify-center gap-1
          ${isSelectedItem 
            ? 'bg-secondary text-on-secondary border-secondary' 
            : 'bg-transparent text-on-surface-variant border-outline-variant hover:border-secondary/50'
          }
        `}
      >
        {isSelectedItem ? (
          <>
            <CheckCircle size={14} /> 已选
          </>
        ) : (
          '选择'
        )}
      </button>
    );
  }

  // 统一的投票区块组件 - 按 Tab 独立提交
  interface VoteSectionProps {
    title: string;
    subtitle?: string;
    description?: string;
    data: LeaderboardItem[];
    voteType: string;
    maxVotes: number;
    isLoading: boolean;
  }

  function VoteSection({ title, subtitle, description, data, voteType, maxVotes, isLoading }: VoteSectionProps) {
    const votesUsed = getVotesUsed(voteType);
    const selectedCount = getSelectedCount(voteType);
    const votesRemaining = maxVotes - votesUsed - selectedCount;
    const hasSubmitted = votesUsed > 0;
    const hasSelected = selectedCount > 0;
    // 是否在该奖项投过票（投过才显示票数）
    const showResults = hasVotedInType(voteType);
    
    // 本地搜索状态 + 防抖
    const [localSearch, setLocalSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(localSearch), 200);
      return () => clearTimeout(timer);
    }, [localSearch]);
    
    // 使用 useMemo 缓存排序和过滤结果
    const { filteredData, rankMap } = useMemo(() => {
      // 排序数据：投票后前10按票数排序并显示票数
      const top10 = showResults
        ? [...data].sort((a, b) => b.vote_count - a.vote_count).slice(0, 10)
        : [];
      const rankMap = new Map(top10.map((item, i) => [item.id, i + 1]));
      const top10Ids = new Set(top10.map(item => item.id));
      let displayData = showResults
        ? [...top10, ...data.filter(item => !top10Ids.has(item.id))]
        : data;

      // 搜索过滤
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase();
        displayData = displayData.filter(item => 
          item.name.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query) ||
          (item.keywords && item.keywords.toLowerCase().includes(query)) ||
          item.submitter1_name.toLowerCase().includes(query) ||
          item.submitter1_dept.toLowerCase().includes(query) ||
          (item.submitter2_name && item.submitter2_name.toLowerCase().includes(query)) ||
          (item.submitter2_dept && item.submitter2_dept.toLowerCase().includes(query))
        );
      }
      return { filteredData: displayData, rankMap };
    }, [data, debouncedSearch, showResults]);

    if (isLoading) {
      return (
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10 p-12">
          <div className="flex items-center justify-center gap-3 text-on-surface-variant">
            <Loader2 size={24} className="animate-spin" />
            <span>加载中...</span>
          </div>
        </div>
      );
    }

    return (
      <section className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
        {/* 头部 - 统一样式 + 搜索栏 + 提交按钮 */}
        <div className="py-6 border-b border-outline-variant/10">
          <div className="flex items-center justify-between mb-4 px-4">
            <div>
              <h3 className="font-headline text-xl font-bold">{title}</h3>
              {(subtitle || description) && (
                <p className="text-xs text-on-surface-variant/70 mt-1">
                  {subtitle || description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {hasSubmitted ? (
                <span className="text-xs text-secondary font-bold">已投票 {votesUsed}/{maxVotes}</span>
              ) : (
                <>
                  {/* 还可选择票数 */}
                  <span className="text-xs text-on-surface-variant whitespace-nowrap">
                    还可选择 <span className={`font-bold ${votesRemaining > 0 ? 'text-secondary' : 'text-outline'}`}>{votesRemaining}</span> 个
                  </span>
                  {/* 提交按钮 - 有选择时显示，红色暗示可提交 */}
                  {hasSelected && (
                    <button
                      onClick={() => submitTabVotes(voteType)}
                      disabled={submitting}
                      className="px-5 py-2 bg-error text-on-error rounded-lg font-bold hover:bg-error/90 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm whitespace-nowrap"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                      提交投票 ({selectedCount})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* 搜索栏 */}
          <div className="relative px-4">
            <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
            <input
              type="text"
              placeholder="搜索项目、关键词或作者..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>
        
        {/* 表格 - 统一结构：排名 | 项目 | 关键词 | 赛道 | 作者 | 票数(可选) | 投票 */}
        <table className="w-full text-left">
          <thead className="bg-surface-container-low/50">
            <tr>
              {showResults && (
                <th className="py-3 px-2 text-xs uppercase tracking-widest text-on-surface-variant font-semibold text-center w-[6%] min-w-[50px]">排名</th>
              )}
              <th className="py-3 px-4 text-xs uppercase tracking-widest text-on-surface-variant font-semibold w-[26%]">项目</th>
              <th className="py-3 px-4 text-xs uppercase tracking-widest text-on-surface-variant font-semibold w-[24%]">关键词</th>
              <th className="py-3 px-4 text-xs uppercase tracking-widest text-on-surface-variant font-semibold w-[10%]">赛道</th>
              <th className="py-3 px-4 text-xs uppercase tracking-widest text-on-surface-variant font-semibold w-[16%]">作者</th>
              {showResults && (
                <th className="py-3 px-4 text-xs uppercase tracking-widest text-on-surface-variant font-semibold text-right w-[8%] min-w-[60px]">票数</th>
              )}
              <th className="py-3 pr-4 text-xs uppercase tracking-widest text-on-surface-variant font-semibold text-right w-[104px] box-border">
                {hasSubmitted ? '状态' : '选择'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={showResults ? 7 : 5} className="py-8 text-center text-on-surface-variant text-sm">
                  {localSearch.trim() ? '没有找到匹配的项目' : '暂无项目'}
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <tr key={item.id} className="hover:bg-surface-container-low/30 transition-colors">
                  {/* 排名 - 只有 Top 10 才显示 */}
                  {showResults && (
                    <td className="py-3 px-2 text-center">
                      {rankMap.has(item.id) ? (
                        rankMap.get(item.id)! <= 3 ? (
                          <span className={`
                            inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                            ${rankMap.get(item.id) === 1 ? 'bg-yellow-500/20 text-yellow-700' : ''}
                            ${rankMap.get(item.id) === 2 ? 'bg-gray-400/20 text-gray-600' : ''}
                            ${rankMap.get(item.id) === 3 ? 'bg-orange-600/20 text-orange-700' : ''}
                          `}>
                            {rankMap.get(item.id)}
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant/50">{rankMap.get(item.id)}</span>
                        )
                      ) : null}
                    </td>
                  )}
                  
                  {/* 项目名 + 一句话概括 */}
                  <td className="py-3 px-4">
                    <div 
                      className="font-medium text-on-surface text-base truncate cursor-pointer hover:text-secondary transition-colors flex items-center gap-1"
                      onClick={() => router.push(`/gallery?demo=${item.id}`)}
                      title="点击查看详情"
                    >
                      {item.name}
                      <ExternalLink size={12} className="opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-sm text-on-surface-variant/70 line-clamp-1 mt-0.5">{item.summary}</div>
                  </td>
                  
                  {/* 关键词 */}
                  <td className="py-3 px-4">
                    {item.keywords ? (
                      <div className="flex flex-wrap gap-1">
                        {item.keywords.split(/[\u3001,,，]/).slice(0, 3).map((kw, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant rounded">
                            {kw.trim()}
                          </span>
                        ))}
                        {item.keywords.split(/[\u3001,,，]/).length > 3 && (
                          <span className="text-xs text-on-surface-variant/50">+</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-on-surface-variant/30">-</span>
                    )}
                  </td>
                  
                  {/* 赛道 */}
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      item.track === 'optimizer' 
                        ? 'bg-secondary/10 text-secondary' 
                        : 'bg-tertiary/10 text-tertiary'
                    }`}>
                      {item.track === 'optimizer' ? 'Optimizer' : 'Builder'}
                    </span>
                  </td>
                  
                  {/* 作者 - 显示部门，双人字体一样大 */}
                  <td className="py-3 px-4 text-sm text-on-surface-variant">
                    {/* 第一作者 */}
                    <div className="flex items-center gap-1">
                      <span className="truncate">{item.submitter1_name}</span>
                      <span className="text-on-surface-variant/40 text-xs">{item.submitter1_dept}</span>
                    </div>
                    {/* 第二作者（如果有）- 字体一样大 */}
                    {item.submitter2_name && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="truncate">{item.submitter2_name}</span>
                        <span className="text-on-surface-variant/40 text-xs">{item.submitter2_dept || ''}</span>
                      </div>
                    )}
                  </td>
                  
                  {/* 票数 - 只有 Top 10 才显示 */}
                  {showResults && (
                    <td className="py-3 px-4 text-right font-headline font-semibold text-sm">
                      {rankMap.has(item.id) ? `${item.vote_count}票` : ''}
                    </td>
                  )}
                  
                  {/* 投票按钮 */}
                  <td className="py-3 pr-4 pl-2">
                    <div className="flex justify-end">
                      <SelectButton item={item} voteType={voteType} maxVotes={maxVotes} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
      </section>
    );
  }

  // 计算总的选择数量
  const totalSelected = selectedVotes.length;
  const hasAnyVotes = myVotes.length > 0;
  
  // 获取当前 Tab 的数据
  const currentData = leaderboardData[activeTab] || [];
  const isCurrentLoading = loadingTabs.has(activeTab);

  return (
    <div className="px-12 pb-12">
      {/* Header */}
      <header className="flex-shrink-0 mb-8 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">Demo Leaderboard</h2>
          </div>
          {/* 切换显示结果（仅已投票用户可用） */}
          {hasAnyVotes && (
            <span className="text-xs text-on-surface-variant/60">
              已投票 {myVotes.length} 个奖项
            </span>
          )}
        </div>
      </header>

      {/* 投票规则 */}
      <div className="mb-8 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
        <h3 className="text-sm font-bold text-on-surface mb-2">投票规则</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-on-surface-variant">
          <li>最佳Demo奖分为2个赛道，每个赛道每人3票，选出前3名；专项奖不分赛道，每人1票，选出第1名；评委每票拥有2倍的权重（=2票）</li>
          <li>每个奖单独投票，投票后将无法修改，请确认后提交；提交后可以查看前10名的得票情况</li>
        </ol>
      </div>

      {/* 投票状态提示 */}
      {votingStatus && !votingStatus.isVotingOpen && (
        <div className="mb-8 p-4 bg-error-container rounded-lg text-on-error-container">
          <div className="flex items-start gap-3">
            <Lock size={20} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">投票暂未开始</p>
              <p className="text-sm text-on-error-container/80 mt-1">{votingStatus.notice}</p>
            </div>
          </div>
        </div>
      )}
      {!user && votingStatus?.isVotingOpen && (
        <div className="mb-8 p-3 bg-surface-container-low rounded-lg text-sm text-on-surface-variant inline-block">
          👀 您当前以游客身份浏览，<a href="/" className="text-primary hover:underline">登录</a>后可参与投票
        </div>
      )}


      {/* Tab 栏 - 一行平铺，带分类标签 */}
      <div className="flex items-center gap-6 mb-8 flex-wrap">
        {/* 最佳 Demo 奖组 */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider whitespace-nowrap">🏆 最佳 Demo 奖</span>
          <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl">
            <button
              onClick={() => setActiveTab('optimizer')}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-headline text-base font-bold transition-all ${
                activeTab === 'optimizer'
                  ? 'bg-secondary text-on-secondary shadow-sm'
                  : 'text-on-surface hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span>⚡</span>
              <span>Optimizer</span>
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-headline text-base font-bold transition-all ${
                activeTab === 'builder'
                  ? 'bg-tertiary text-on-tertiary shadow-sm'
                  : 'text-on-surface hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span>🛠️</span>
              <span>Builder</span>
            </button>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-8 bg-outline-variant/30"></div>

        {/* 专项奖组 */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider whitespace-nowrap">⭐ 专项奖</span>
          <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl">
            <button
              onClick={() => setActiveTab('special_brain')}
              className={`px-5 py-2.5 rounded-lg font-headline text-base font-bold transition-all ${
                activeTab === 'special_brain'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              🧠 最脑洞
            </button>
            <button
              onClick={() => setActiveTab('special_infectious')}
              className={`px-5 py-2.5 rounded-lg font-headline text-base font-bold transition-all ${
                activeTab === 'special_infectious'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              🔥 最感染力
            </button>
            <button
              onClick={() => setActiveTab('special_useful')}
              className={`px-5 py-2.5 rounded-lg font-headline text-base font-bold transition-all ${
                activeTab === 'special_useful'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              💎 最实用
            </button>
          </div>
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* 当前选中的奖项 */}
      <div>
        {activeTab === 'optimizer' && (
          <VoteSection 
            title="🏆 最佳 Demo 奖 - Optimizer 赛道"
            description="选出3个你认为综合表现最好的项目（综合项目创意、展现效果、落地应用等）"
            data={currentData} 
            voteType="best_optimizer"
            maxVotes={BEST_DEMO_AWARDS.best_optimizer.maxVotes}
            isLoading={isCurrentLoading}
          />
        )}
        
        {activeTab === 'builder' && (
          <VoteSection 
            title="🏆 最佳 Demo 奖 - Builder 赛道" 
            description="选出3个你认为综合表现最好的项目（综合项目创意、展现效果、落地应用等）"
            data={currentData} 
            voteType="best_builder"
            maxVotes={BEST_DEMO_AWARDS.best_builder.maxVotes}
            isLoading={isCurrentLoading}
          />
        )}

        {activeTab === 'special_brain' && (
          <VoteSection
            title={SPECIAL_AWARDS.special_brain.labelCn}
            description={SPECIAL_AWARDS.special_brain.description}
            data={currentData}
            voteType="special_brain"
            maxVotes={SPECIAL_AWARDS.special_brain.maxVotes}
            isLoading={isCurrentLoading}
          />
        )}
        
        {activeTab === 'special_infectious' && (
          <VoteSection
            title={SPECIAL_AWARDS.special_infectious.labelCn}
            description={SPECIAL_AWARDS.special_infectious.description}
            data={currentData}
            voteType="special_infectious"
            maxVotes={SPECIAL_AWARDS.special_infectious.maxVotes}
            isLoading={isCurrentLoading}
          />
        )}
        
        {activeTab === 'special_useful' && (
          <VoteSection
            title={SPECIAL_AWARDS.special_useful.labelCn}
            description={SPECIAL_AWARDS.special_useful.description}
            data={currentData}
            voteType="special_useful"
            maxVotes={SPECIAL_AWARDS.special_useful.maxVotes}
            isLoading={isCurrentLoading}
          />
        )}
      </div>
    </div>
  );
}
