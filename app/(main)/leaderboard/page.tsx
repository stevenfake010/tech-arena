'use client';

import { useState, useEffect } from 'react';
import { Loader2, Star, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [optimizerData, setOptimizerData] = useState<LeaderboardItem[]>([]);
  const [builderData, setBuilderData] = useState<LeaderboardItem[]>([]);
  const [myVotes, setMyVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const MAX_VOTES_PER_TRACK = 2;

  useEffect(() => {
    fetchLeaderboard();
    fetchMyVotes();
  }, []);

  // 清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function fetchLeaderboard() {
    try {
      const [optimizerRes, builderRes] = await Promise.all([
        fetch('/api/leaderboard?vote_type=best_optimizer'),
        fetch('/api/leaderboard?vote_type=best_builder'),
      ]);
      const optimizerJson = await optimizerRes.json();
      const builderJson = await builderRes.json();
      setOptimizerData(optimizerJson.leaderboard || []);
      setBuilderData(builderJson.leaderboard || []);
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

  function getVotesUsedForTrack(voteType: string) {
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
          fetchLeaderboard();
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
          fetchLeaderboard();
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

  function VoteButton({ item, voteType }: { item: LeaderboardItem; voteType: string }) {
    const isVoted = hasVotedFor(item.id, voteType);
    const votesUsed = getVotesUsedForTrack(voteType);
    const canVote = isVoted || votesUsed < MAX_VOTES_PER_TRACK;
    const isLoading = votingId === item.id;

    return (
      <button
        onClick={() => handleVote(item.id, voteType)}
        disabled={!canVote || isLoading}
        className={`
          relative px-5 py-2 rounded text-[11px] font-bold uppercase tracking-widest
          transition-all active:scale-95 min-w-[80px]
          ${isVoted 
            ? 'bg-secondary text-on-secondary hover:bg-secondary-dim' 
            : canVote 
              ? 'bg-primary text-on-primary hover:bg-primary-dim'
              : 'bg-surface-container-high text-outline cursor-not-allowed'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center gap-1">
            <Loader2 size={16} className="animate-spin" />
          </span>
        ) : isVoted ? (
          '已投'
        ) : (
          'Vote'
        )}
      </button>
    );
  }

  function TrackSection({ 
    title, 
    subtitle, 
    data, 
    voteType,
    accentColor 
  }: { 
    title: string; 
    subtitle: string; 
    data: LeaderboardItem[]; 
    voteType: string;
    accentColor: 'secondary' | 'tertiary';
  }) {
    const votesUsed = getVotesUsedForTrack(voteType);
    const votesRemaining = MAX_VOTES_PER_TRACK - votesUsed;

    return (
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className={`text-[10px] uppercase tracking-[0.2em] text-${accentColor} font-bold mb-1 block`}>
              {subtitle}
            </span>
            <h3 className="font-headline text-2xl font-bold">{title}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-on-surface-variant">
                剩余票数: <span className={`font-bold ${votesRemaining > 0 ? 'text-secondary' : 'text-outline'}`}>{votesRemaining}</span> / {MAX_VOTES_PER_TRACK}
              </span>
            </div>
            <span className="text-xs text-on-surface-variant italic">共 {data.length} 个项目</span>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-outline-variant/20">
                <th className="py-4 px-4 text-xs uppercase tracking-widest text-on-surface-variant font-semibold w-16">Rank</th>
                <th className="py-4 px-4 text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Project</th>
                <th className="py-4 px-4 text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Author</th>
                <th className="py-4 px-4 text-xs uppercase tracking-widest text-on-surface-variant font-semibold text-right w-24">Votes</th>
                <th className="py-4 px-4 text-xs uppercase tracking-widest text-on-surface-variant font-semibold text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100/50">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-on-surface-variant text-sm">
                    暂无项目，快来提交第一个 Demo 吧！
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id} className="group hover:bg-surface-container-low/20 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <span className={`font-headline text-lg font-bold ${
                          index === 0 ? 'text-secondary' : index === 1 ? 'text-on-surface/80' : index === 2 ? 'text-on-surface/60' : 'text-on-surface/40'
                        }`}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {index === 0 && (
                          <Star size={16} className="text-secondary fill-secondary" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-on-surface text-base">{item.name}</div>
                      <div className="text-sm text-on-surface-variant/70 line-clamp-1 mt-0.5 chinese-text">{item.summary}</div>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant text-base chinese-text">
                      {item.submitter1_name}
                      {item.submitter2_name && <span className="text-outline"> + {item.submitter2_name}</span>}
                    </td>
                    <td className="py-4 px-4 text-right font-headline font-semibold text-base">{item.score}</td>
                    <td className="py-4 px-4 text-right">
                      <VoteButton item={item} voteType={voteType} />
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
        <div className="text-on-surface-variant">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-12 max-w-6xl">
      {/* Header */}
      <header className="mb-8">
        <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface mb-6">Leaderboard</h2>
        <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed chinese-text">
          每个赛道最多可投 2 票，可以投给不同项目。点击 Vote 按钮投票，再次点击可取消。
        </p>
      </header>

      {/* Message Toast */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-12">
        <TrackSection 
          title="Optimizer 赛道" 
          subtitle="Category 01" 
          data={optimizerData} 
          voteType="best_optimizer"
          accentColor="secondary"
        />
        
        <TrackSection 
          title="Builder 赛道" 
          subtitle="Category 02" 
          data={builderData} 
          voteType="best_builder"
          accentColor="tertiary"
        />
      </div>

      {/* Legend */}
      <div className="mt-12 pt-8 border-t border-outline-variant/20">
        <div className="flex items-center gap-8 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary"></span>
            <span>已投票</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary"></span>
            <span>可投票</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={16} className="text-secondary fill-secondary" />
            <span>当前第一名</span>
          </div>
        </div>
      </div>
    </div>
  );
}
