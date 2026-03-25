'use client';

import { useState, useEffect } from 'react';
import { Loader2, Star, CheckCircle, AlertCircle, Trophy } from 'lucide-react';
import { BEST_DEMO_AWARDS, SPECIAL_AWARDS } from '@/lib/constants';

interface LeaderboardItem {
  id: number;
  name: string;
  summary: string;
  track: string;
  submitter1_name: string;
  submitter1_dept: string;
  submitter2_name: string | null;
  score: number;
  vote_count: number;
}

interface Vote {
  demo_id: number;
  vote_type: string;
}

export default function LeaderboardPage() {
  // 最佳Demo奖数据
  const [optimizerData, setOptimizerData] = useState<LeaderboardItem[]>([]);
  const [builderData, setBuilderData] = useState<LeaderboardItem[]>([]);
  
  // 专项奖数据
  const [specialData, setSpecialData] = useState<Record<string, LeaderboardItem[]>>({
    special_brain: [],
    special_infectious: [],
    special_useful: [],
  });
  
  const [myVotes, setMyVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'best' | 'special'>('best');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetchAllData();
    fetchMyVotes();
  }, []);

  // 清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function fetchAllData() {
    try {
      // 获取最佳Demo奖数据
      const [optimizerRes, builderRes] = await Promise.all([
        fetch('/api/leaderboard?vote_type=best_optimizer'),
        fetch('/api/leaderboard?vote_type=best_builder'),
      ]);
      const optimizerJson = await optimizerRes.json();
      const builderJson = await builderRes.json();
      setOptimizerData(optimizerJson.leaderboard || []);
      setBuilderData(builderJson.leaderboard || []);

      // 获取专项奖数据
      const specialResults: Record<string, LeaderboardItem[]> = {};
      for (const awardId of Object.keys(SPECIAL_AWARDS)) {
        const res = await fetch(`/api/leaderboard?vote_type=${awardId}`);
        const data = await res.json();
        specialResults[awardId] = data.leaderboard || [];
      }
      setSpecialData(specialResults);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyVotes() {
    try {
      const res = await fetch('/api/votes');
      const data = await res.json();
      if (data.votes) {
        setMyVotes(data.votes);
      }
    } catch (error) {
      console.error('Failed to fetch votes:', error);
    }
  }

  function hasVotedFor(demoId: number, voteType: string) {
    return myVotes.some(v => v.demo_id === demoId && v.vote_type === voteType);
  }

  function getVotesUsed(voteType: string, maxVotes: number) {
    return myVotes.filter(v => v.vote_type === voteType).length;
  }

  async function handleVote(demoId: number, voteType: string) {
    const isVoted = hasVotedFor(demoId, voteType);
    
    setVotingId(demoId);
    
    try {
      if (isVoted) {
        // 取消投票
        const res = await fetch('/api/votes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demo_id: demoId, vote_type: voteType }),
        });
        
        if (res.ok) {
          setMyVotes(prev => prev.filter(v => !(v.demo_id === demoId && v.vote_type === voteType)));
          fetchAllData();
          setMessage({ text: '已取消投票', type: 'success' });
        } else {
          const err = await res.json();
          setMessage({ text: err.error || '取消失败', type: 'error' });
        }
      } else {
        // 投票
        const res = await fetch('/api/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demo_id: demoId, vote_type: voteType }),
        });
        
        if (res.ok) {
          setMyVotes(prev => [...prev, { demo_id: demoId, vote_type: voteType }]);
          fetchAllData();
          setMessage({ text: '投票成功！', type: 'success' });
        } else {
          const err = await res.json();
          setMessage({ text: err.error || '投票失败', type: 'error' });
        }
      }
    } catch (error) {
      setMessage({ text: '网络错误，请重试', type: 'error' });
    } finally {
      setVotingId(null);
    }
  }

  function VoteButton({ item, voteType, maxVotes }: { item: LeaderboardItem; voteType: string; maxVotes: number }) {
    const isVoted = hasVotedFor(item.id, voteType);
    const votesUsed = getVotesUsed(voteType, maxVotes);
    const canVote = isVoted || votesUsed < maxVotes;
    const isLoading = votingId === item.id;

    return (
      <button
        onClick={() => handleVote(item.id, voteType)}
        disabled={!canVote || isLoading}
        className={`
          relative px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider
          transition-all active:scale-95 min-w-[70px]
          ${isVoted 
            ? 'bg-secondary text-on-secondary hover:bg-secondary-dim' 
            : canVote 
              ? 'bg-primary text-on-primary hover:bg-primary-dim'
              : 'bg-surface-container-high text-outline cursor-not-allowed'
          }
        `}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin mx-auto" />
        ) : isVoted ? (
          '已投'
        ) : (
          'Vote'
        )}
      </button>
    );
  }

  function BestDemoSection({ 
    title, 
    subtitle, 
    data, 
    voteType,
    maxVotes,
    accentColor 
  }: { 
    title: string; 
    subtitle: string; 
    data: LeaderboardItem[]; 
    voteType: string;
    maxVotes: number;
    accentColor: 'secondary' | 'tertiary';
  }) {
    const votesUsed = getVotesUsed(voteType, maxVotes);
    const votesRemaining = maxVotes - votesUsed;

    return (
      <section className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
        <div className="p-6 border-b border-outline-variant/10">
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-[10px] uppercase tracking-[0.2em] text-${accentColor} font-bold mb-1 block`}>
                {subtitle}
              </span>
              <h3 className="font-headline text-xl font-bold">{title}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-on-surface-variant">
                剩余票数: <span className={`font-bold ${votesRemaining > 0 ? 'text-secondary' : 'text-outline'}`}>{votesRemaining}</span> / {maxVotes}
              </span>
              <p className="text-[10px] text-on-surface-variant/60 mt-0.5">评选前3名</p>
            </div>
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-surface-container-low/50">
            <tr>
              <th className="py-3 px-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold w-14">排名</th>
              <th className="py-3 px-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">项目</th>
              <th className="py-3 px-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">作者</th>
              <th className="py-3 px-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold text-right w-20">得分</th>
              <th className="py-3 px-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold text-right w-24">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-on-surface-variant text-sm">
                  暂无项目
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.id} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className={`font-headline text-base font-bold ${
                        index < 3 ? 'text-secondary' : 'text-on-surface/40'
                      }`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {index === 0 && <Star size={14} className="text-secondary fill-secondary" />}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-on-surface text-sm">{item.name}</div>
                    <div className="text-xs text-on-surface-variant/70 line-clamp-1 mt-0.5">{item.summary}</div>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant text-sm">
                    {item.submitter1_name}
                    {item.submitter2_name && <span className="text-outline text-xs"> +{item.submitter2_name}</span>}
                  </td>
                  <td className="py-3 px-4 text-right font-headline font-semibold text-sm">
                    {item.score}
                    <span className="text-[10px] text-on-surface-variant/60 ml-1">({item.vote_count}票)</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <VoteButton item={item} voteType={voteType} maxVotes={maxVotes} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    );
  }

  function SpecialAwardSection({
    awardId,
    award,
    data,
  }: {
    awardId: string;
    award: typeof SPECIAL_AWARDS[keyof typeof SPECIAL_AWARDS];
    data: LeaderboardItem[];
  }) {
    const maxVotes = award.maxVotes;
    const votesUsed = getVotesUsed(awardId, maxVotes);
    const votesRemaining = maxVotes - votesUsed;

    return (
      <section className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
        <div className="p-5 border-b border-outline-variant/10 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline text-lg font-bold">{award.labelCn}</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">{award.description}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-on-surface-variant">
                剩余: <span className={`font-bold ${votesRemaining > 0 ? 'text-secondary' : 'text-outline'}`}>{votesRemaining}</span>/{maxVotes}
              </span>
            </div>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low/50 sticky top-0">
              <tr>
                <th className="py-2 px-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold w-12">#</th>
                <th className="py-2 px-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">项目</th>
                <th className="py-2 px-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">赛道</th>
                <th className="py-2 px-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold text-right w-16">得分</th>
                <th className="py-2 px-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold text-right w-20">投票</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-on-surface-variant text-sm">
                    暂无项目
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className={`font-headline text-sm font-bold ${
                        index === 0 ? 'text-secondary' : 'text-on-surface/40'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-on-surface text-sm">{item.name}</div>
                      <div className="text-[10px] text-on-surface-variant/70 line-clamp-1">{item.submitter1_name}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        item.track === 'optimizer' 
                          ? 'bg-secondary/10 text-secondary' 
                          : 'bg-tertiary/10 text-tertiary'
                      }`}>
                        {item.track === 'optimizer' ? 'Optimizer' : 'Builder'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-headline font-semibold text-sm">
                      {item.score}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <VoteButton item={item} voteType={awardId} maxVotes={maxVotes} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <Loader2 size={24} className="animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 max-w-6xl">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Trophy size={32} className="text-secondary" />
          <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">投票评选</h2>
        </div>
        <p className="text-on-surface-variant text-base max-w-2xl leading-relaxed">
          最佳Demo奖每个赛道可投2票，专项奖每个奖项可投1票。评委投票权重为2票。
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 p-1 bg-surface-container-low rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('best')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'best'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          🏆 最佳Demo奖
        </button>
        <button
          onClick={() => setActiveTab('special')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'special'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          ⭐ 专项奖
        </button>
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

      {/* Best Demo Awards */}
      {activeTab === 'best' && (
        <div className="grid grid-cols-1 gap-8">
          <BestDemoSection 
            title="最佳 Demo - Optimizer 赛道" 
            subtitle="评选前3名"
            data={optimizerData} 
            voteType="best_optimizer"
            maxVotes={BEST_DEMO_AWARDS.best_optimizer.maxVotes}
            accentColor="secondary"
          />
          
          <BestDemoSection 
            title="最佳 Demo - Builder 赛道" 
            subtitle="评选前3名"
            data={builderData} 
            voteType="best_builder"
            maxVotes={BEST_DEMO_AWARDS.best_builder.maxVotes}
            accentColor="tertiary"
          />
        </div>
      )}

      {/* Special Awards */}
      {activeTab === 'special' && (
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(SPECIAL_AWARDS).map(([awardId, award]) => (
            <SpecialAwardSection
              key={awardId}
              awardId={awardId}
              award={award}
              data={specialData[awardId] || []}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-12 pt-8 border-t border-outline-variant/20">
        <div className="flex flex-wrap items-center gap-6 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary"></span>
            <span>已投票</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary"></span>
            <span>可投票</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={14} className="text-secondary fill-secondary" />
            <span>当前第一</span>
          </div>
          <div className="ml-auto text-on-surface-variant/60">
            评委投票权重 = 2票
          </div>
        </div>
      </div>
    </div>
  );
}
