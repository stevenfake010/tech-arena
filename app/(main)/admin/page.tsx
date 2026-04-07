'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, AlertCircle, Check, Loader2, PlusCircle, Trash2, Trash,
  LayoutGrid, Trophy, MessageSquare, Search, ChevronLeft, ChevronRight,
  X, Lock, Unlock, FileEdit, Settings, Database, ShieldAlert, FolderOpen,
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

interface SiteStatus {
  isSubmissionOpen: boolean;
  isVotingOpen: boolean;
  notice: string;
  error?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'demos' | 'messages' | 'settings'>('demos');

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

  // 全局操作结果
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 站点状态
  const [siteStatus, setSiteStatus] = useState<SiteStatus | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [editingNotice, setEditingNotice] = useState('');
  const [isEditingNotice, setIsEditingNotice] = useState(false);

  // 按奖项投票开关
  const AWARD_CONFIGS = [
    { key: 'best_optimizer',   icon: '⚡', label: 'Lightning Coder 最佳Demo' },
    { key: 'best_builder',     icon: '🛠️', label: 'Insighter 最佳Demo' },
    { key: 'special_brain',    icon: '🧠', label: '专项奖 · 最脑洞' },
    { key: 'special_infectious', icon: '🔥', label: '专项奖 · 最感染力' },
    { key: 'special_useful',   icon: '💎', label: '专项奖 · 最实用' },
  ];
  const [votingOpenAwards, setVotingOpenAwards] = useState<Record<string, boolean>>({
    best_optimizer: false, best_builder: false,
    special_brain: false, special_infectious: false, special_useful: false,
  });
  const [awardToggleLoading, setAwardToggleLoading] = useState<string | null>(null);
  const [votingAwardNotices, setVotingAwardNotices] = useState<Record<string, string>>({});
  const [editingAwardNotice, setEditingAwardNotice] = useState<string | null>(null);
  const [awardNoticeInput, setAwardNoticeInput] = useState('');
  const [awardNoticeSaving, setAwardNoticeSaving] = useState(false);

  // 数据工具
  const [seedLoading, setSeedLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearVotesLoading, setClearVotesLoading] = useState(false);
  const [seedVotesLoading, setSeedVotesLoading] = useState(false);

  // 海选结果
  interface PrelimResultItem {
    demo_id: number; name: string; track: string;
    submitter1_name: string; submitter2_name: string | null; vote_count: number;
  }
  const [prelimResults, setPrelimResults] = useState<PrelimResultItem[] | null>(null);
  const [prelimResultsTotal, setPrelimResultsTotal] = useState(0);
  const [prelimResultsLoading, setPrelimResultsLoading] = useState(false);
  const [showPrelimResults, setShowPrelimResults] = useState(false);

  // 导航配置
  const [navLeaderboardVisible, setNavLeaderboardVisible] = useState(true);
  const [navPreliminaryVisible, setNavPreliminaryVisible] = useState(false);
  const [navMyDemosVisible, setNavMyDemosVisible] = useState(false);
  const [navSquareVisible, setNavSquareVisible] = useState(false);
  const [navConfigLoading, setNavConfigLoading] = useState(false);
  // 投票结果可见性
  const [leaderboardResultsVisible, setLeaderboardResultsVisible] = useState(false);
  const [resultsVisibleLoading, setResultsVisibleLoading] = useState(false);

  // Leaderboard 入选名单
  const [eligibleIds, setEligibleIds] = useState<number[]>([]);
  const [eligibleSaving, setEligibleSaving] = useState(false);

  // 加票管理
  interface BonusVoteEntry { demo_id: number; vote_type: string; bonus: number; }
  interface BonusDemoOption { id: number; name: string; track: string; }
  const [bonusVotes, setBonusVotes] = useState<BonusVoteEntry[]>([]);
  const [bonusDemos, setBonusDemos] = useState<BonusDemoOption[]>([]);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusSaving, setBonusSaving] = useState(false);
  const [newBonusDemoId, setNewBonusDemoId] = useState('');
  const [newBonusVoteType, setNewBonusVoteType] = useState('best_optimizer');
  const [newBonusCount, setNewBonusCount] = useState('1');
  const [bonusDemoSearch, setBonusDemoSearch] = useState('');

  // 海选投票配置
  const [prelimEnabled, setPrelimEnabled] = useState(false);
  const [prelimMode, setPrelimMode] = useState<'A' | 'B'>('A');
  const [prelimTotal, setPrelimTotal] = useState('30');
  const [prelimLightningCoder, setPrelimLightningCoder] = useState('15');
  const [prelimInsighter, setPrelimInsighter] = useState('15');
  const [prelimRoles, setPrelimRoles] = useState<string[]>(['admin']);
  const [prelimNotice, setPrelimNotice] = useState('');
  const [prelimLoading, setPrelimLoading] = useState(false);
  const [prelimToggleLoading, setPrelimToggleLoading] = useState(false);
  const [clearPrelimLoading, setClearPrelimLoading] = useState(false);

  // 验证权限
  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/admin/verify').then(r => r.json()),
    ]).then(([authData, verifyData]) => {
      if (!authData.user || authData.user.role !== 'admin') {
        router.push('/');
        return;
      }
      setUser(authData.user);
      setAdminAuthed(verifyData.ok === true);
      setLoading(false);
    }).catch(() => router.push('/'));
  }, [router]);

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setPwLoading(true);
    setPwError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwInput }),
    });
    setPwLoading(false);
    if (res.ok) {
      setAdminAuthed(true);
    } else {
      setPwError('密码错误，请重试');
      setPwInput('');
    }
  }

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
    if (!loading && activeTab === 'demos') loadDemos();
  }, [demosPage, demosSearch, activeTab, loading]);

  useEffect(() => {
    if (!loading && activeTab === 'messages') loadMessages();
  }, [messagesPage, messagesSearch, activeTab, loading]);

  // 加载站点状态
  const loadSiteStatus = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setSiteStatus(data);
      setEditingNotice(data.notice || '');
      setNeedsSetup(data.error === 'TABLE_NOT_FOUND');
      setNavLeaderboardVisible(data.navLeaderboardVisible ?? true);
      setNavPreliminaryVisible(data.navPreliminaryVisible ?? false);
      setNavMyDemosVisible(data.navMyDemosVisible ?? false);
      setNavSquareVisible(data.navSquareVisible ?? false);
      setLeaderboardResultsVisible(data.leaderboardResultsVisible ?? false);
      setEligibleIds(data.leaderboardEligibleIds ?? []);
      if (data.votingOpenAwards) setVotingOpenAwards(data.votingOpenAwards);
      if (data.votingAwardNotices) setVotingAwardNotices(data.votingAwardNotices);
    } catch (error) {
      console.error('Failed to load site status:', error);
    }
  };

  // 加载海选配置
  const loadPrelimConfig = async () => {
    try {
      const res = await fetch('/api/preliminary');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setPrelimEnabled(data.config.enabled ?? false);
          setPrelimMode(data.config.mode ?? 'A');
          setPrelimTotal(String(data.config.totalRequired ?? 30));
          setPrelimLightningCoder(String(data.config.optimizerRequired ?? 15));
          setPrelimInsighter(String(data.config.builderRequired ?? 15));
          setPrelimRoles(data.config.resultsRoles ?? ['admin']);
          setPrelimNotice(data.config.notice ?? '');
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (!loading && activeTab === 'settings') {
      loadSiteStatus();
      loadPrelimConfig();
      loadBonusVotes();
    }
  }, [activeTab, loading]);

  // 切换提交开关
  const toggleSubmission = async (enabled: boolean) => {
    setSubmissionLoading(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionEnabled: enabled }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: enabled ? '✅ Skill 提交已开启' : '🔒 Skill 提交已关闭（已提交的 Skill 仍可编辑）' });
        loadSiteStatus();
      } else {
        setResult({ type: 'error', message: data.error || '操作失败' });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setSubmissionLoading(false);
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
        setResult({ type: 'success', message: enabled ? '✅ 投票已开启' : '🔒 投票已关闭' });
        loadSiteStatus();
      } else {
        setResult({ type: 'error', message: data.error || '操作失败' });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setVotingLoading(false);
    }
  };

  // 切换单个奖项投票
  const toggleAwardVoting = async (awardKey: string, enabled: boolean) => {
    setAwardToggleLoading(awardKey);
    const updated = { ...votingOpenAwards, [awardKey]: enabled };
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votingOpenAwards: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setVotingOpenAwards(updated);
        const award = AWARD_CONFIGS.find(a => a.key === awardKey);
        setResult({ type: 'success', message: enabled ? `✅ ${award?.label} 投票已开放` : `🔒 ${award?.label} 投票已关闭` });
      } else {
        setResult({ type: 'error', message: data.error || '操作失败' });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setAwardToggleLoading(null);
    }
  };

  // 保存单个奖项提示语
  const saveAwardNotice = async (awardKey: string) => {
    setAwardNoticeSaving(true);
    const updated = { ...votingAwardNotices, [awardKey]: awardNoticeInput };
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votingAwardNotices: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setVotingAwardNotices(updated);
        setEditingAwardNotice(null);
      } else {
        setResult({ type: 'error', message: data.error || '保存失败' });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setAwardNoticeSaving(false);
    }
  };

  // 保存投票公告
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
        loadSiteStatus();
      } else {
        setResult({ type: 'error', message: data.error || '保存失败' });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setVotingLoading(false);
    }
  };

  // 初始化配置表
  const setupConfig = async () => {
    setSetupLoading(true);
    try {
      const res = await fetch('/api/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: '配置表初始化成功' });
        loadSiteStatus();
      } else {
        setResult({ type: 'error', message: data.error || '初始化失败' });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setSetupLoading(false);
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
      } else {
        setResult({ type: 'error', message: data.error || '生成失败' });
      }
    } catch {
      setResult({ type: 'error', message: '网络错误' });
    } finally {
      setSeedLoading(false);
    }
  }

  // 清空所有投票
  async function clearAllVotes() {
    if (!confirm('确定要清空所有投票记录吗？\n\n⚠️ 此操作不可恢复，所有用户的投票数据将被清除。')) return;
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

  // 生成测试投票（Demo投票，非海选）
  async function seedVotes() {
    if (!confirm('为所有尚未投票的用户随机生成投票记录？\n\n⚠️ 已有投票的用户不会受影响。')) return;
    setSeedVotesLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/votes/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: data.message });
      } else {
        setResult({ type: 'error', message: data.error || '生成失败' });
      }
    } catch {
      setResult({ type: 'error', message: '网络错误' });
    } finally {
      setSeedVotesLoading(false);
    }
  }

  // 清理所有数据
  async function clearTestData() {
    if (!confirm('确定要删除所有数据吗？\n\n⚠️ 这将清空所有项目、投票和留言，不可恢复！')) return;
    setClearLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/clear-test-data', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: `${data.message} 共删除 ${data.results.deleted.total} 条记录。` });
      } else {
        setResult({ type: 'error', message: data.error || '清理失败' });
      }
    } catch {
      setResult({ type: 'error', message: '网络错误' });
    } finally {
      setClearLoading(false);
    }
  }

  // 保存海选配置
  // 单独切换海选开关（立即保存，不依赖"保存配置"按钮）
  const togglePrelimEnabled = async (enabled: boolean) => {
    setPrelimToggleLoading(true);
    try {
      const res = await fetch('/api/preliminary/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (data.success) {
        setPrelimEnabled(enabled);
        setResult({ type: 'success', message: enabled ? '✅ 海选投票已开放' : '🔒 海选投票已关闭' });
      } else {
        setResult({ type: 'error', message: data.error || '保存失败' });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setPrelimToggleLoading(false);
    }
  };

  const savePrelimConfig = async () => {
    setPrelimLoading(true);
    try {
      const res = await fetch('/api/preliminary/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: prelimEnabled,
          mode: prelimMode,
          totalRequired: parseInt(prelimTotal, 10),
          optimizerCount: parseInt(prelimLightningCoder, 10),
          builderCount: parseInt(prelimInsighter, 10),
          resultsRoles: prelimRoles,
          notice: prelimNotice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: '海选配置已保存' });
      } else {
        setResult({ type: 'error', message: data.error || '保存失败' });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setPrelimLoading(false);
    }
  };

  // 清空所有海选投票
  const clearPrelimVotes = async () => {
    if (!confirm('确定要清空所有海选投票记录吗？\n\n⚠️ 此操作不可恢复，所有用户的海选数据将被清除。')) return;
    setClearPrelimLoading(true);
    try {
      const res = await fetch('/api/preliminary/config', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: data.message || '海选投票记录已清空' });
      } else {
        setResult({ type: 'error', message: data.error || '清空失败' });
      }
    } catch {
      setResult({ type: 'error', message: '网络错误' });
    } finally {
      setClearPrelimLoading(false);
    }
  };

  // 保存导航配置
  const saveNavConfig = async (leaderboard: boolean, preliminary: boolean, myDemos: boolean, square: boolean) => {
    setNavConfigLoading(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          navLeaderboardVisible: leaderboard,
          navPreliminaryVisible: preliminary,
          navMyDemosVisible: myDemos,
          navSquareVisible: square,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNavLeaderboardVisible(leaderboard);
        setNavPreliminaryVisible(preliminary);
        setNavMyDemosVisible(myDemos);
        setNavSquareVisible(square);
        setResult({ type: 'success', message: '导航配置已更新' });
      } else {
        setResult({ type: 'error', message: data.error || '保存失败' });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setNavConfigLoading(false);
    }
  };

  // 切换投票结果可见性
  const toggleResultsVisible = async (visible: boolean) => {
    setResultsVisibleLoading(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderboardResultsVisible: visible }),
      });
      const data = await res.json();
      if (data.success) {
        setLeaderboardResultsVisible(visible);
        setResult({ type: 'success', message: visible ? '✅ 投票结果已对外公开' : '🔒 投票结果已隐藏' });
      } else {
        setResult({ type: 'error', message: data.error || '保存失败' });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setResultsVisibleLoading(false);
    }
  };

  // 保存 Leaderboard 入选名单
  const saveEligibleIds = async (ids: number[]) => {
    setEligibleSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderboardEligibleIds: ids }),
      });
      const data = await res.json();
      if (data.success) {
        setEligibleIds(ids);
        setResult({ type: 'success', message: `✅ 已选 ${ids.length} 个项目上榜` });
      } else {
        setResult({ type: 'error', message: data.error || '保存失败' });
      }
    } catch (e: any) {
      setResult({ type: 'error', message: e.message });
    } finally {
      setEligibleSaving(false);
    }
  };

  const toggleEligible = (id: number) => {
    const next = eligibleIds.includes(id)
      ? eligibleIds.filter(x => x !== id)
      : [...eligibleIds, id];
    saveEligibleIds(next);
  };

  // 加载加票配置
  const loadBonusVotes = async () => {
    setBonusLoading(true);
    try {
      const res = await fetch('/api/admin/bonus-votes');
      const data = await res.json();
      if (res.ok) {
        setBonusVotes(data.bonusVotes || []);
        setBonusDemos(data.demos || []);
      }
    } catch {}
    finally { setBonusLoading(false); }
  };

  // 保存加票配置
  const saveBonusVotes = async (updated: BonusVoteEntry[]) => {
    setBonusSaving(true);
    try {
      const res = await fetch('/api/admin/bonus-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonusVotes: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setBonusVotes(updated);
        setResult({ type: 'success', message: '加票配置已保存' });
      } else {
        setResult({ type: 'error', message: data.error || '保存失败' });
      }
    } catch {
      setResult({ type: 'error', message: '网络错误' });
    } finally {
      setBonusSaving(false);
    }
  };

  const addBonusVote = () => {
    const demoId = parseInt(newBonusDemoId, 10);
    const bonus = parseInt(newBonusCount, 10);
    if (!demoId || !newBonusVoteType || bonus <= 0) return;
    // merge or add
    const existing = bonusVotes.findIndex(b => b.demo_id === demoId && b.vote_type === newBonusVoteType);
    let updated: BonusVoteEntry[];
    if (existing >= 0) {
      updated = bonusVotes.map((b, i) => i === existing ? { ...b, bonus } : b);
    } else {
      updated = [...bonusVotes, { demo_id: demoId, vote_type: newBonusVoteType, bonus }];
    }
    saveBonusVotes(updated);
    setNewBonusDemoId('');
    setNewBonusCount('1');
  };

  const removeBonusVote = (idx: number) => {
    saveBonusVotes(bonusVotes.filter((_, i) => i !== idx));
  };

  // 加载海选结果
  const loadPrelimResults = async () => {
    setPrelimResultsLoading(true);
    try {
      const res = await fetch('/api/preliminary/results');
      const data = await res.json();
      if (res.ok) {
        setPrelimResults(data.results || []);
        setPrelimResultsTotal(data.totalVoters || 0);
        setShowPrelimResults(true);
      } else {
        setResult({ type: 'error', message: data.error || '加载结果失败' });
      }
    } catch {
      setResult({ type: 'error', message: '网络错误' });
    } finally {
      setPrelimResultsLoading(false);
    }
  };

  // 生成海选测试投票数据
  const [seedPrelimLoading, setSeedPrelimLoading] = useState(false);
  const seedPrelimVotes = async () => {
    if (!confirm('⚠️ 生成测试投票会为所有尚未投票的普通用户随机创建海选记录，导致他们无法再真实投票。\n\n此操作仅用于测试，请在真实投票开始前清空数据。确定继续？')) return;
    setSeedPrelimLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/preliminary/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResult({ type: 'success', message: data.message });
      } else {
        setResult({ type: 'error', message: data.error || '生成失败' });
      }
    } catch {
      setResult({ type: 'error', message: '网络错误' });
    } finally {
      setSeedPrelimLoading(false);
    }
  };

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

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

  if (!adminAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <form onSubmit={handleAdminLogin} className="bg-surface-container-low rounded-2xl p-10 w-full max-w-sm shadow-lg flex flex-col gap-6">
          <div className="text-center">
            <ShieldAlert size={36} className="mx-auto mb-3 text-primary" />
            <h1 className="font-headline text-2xl font-bold">管理员验证</h1>
            <p className="text-sm text-on-surface-variant mt-1">请输入管理后台密码</p>
          </div>
          <input
            type="password"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            placeholder="密码"
            autoFocus
            className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-base focus:outline-none focus:border-primary transition-colors"
          />
          {pwError && <p className="text-sm text-error -mt-3">{pwError}</p>}
          <button
            type="submit"
            disabled={pwLoading || !pwInput}
            className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {pwLoading ? <Loader2 size={18} className="animate-spin" /> : null}
            进入管理后台
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-surface-container-low border-b border-outline-variant/20">
        <div className="px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-headline font-bold text-on-surface mb-2">管理员后台</h1>
              <p className="text-on-surface-variant">
                当前用户：<span className="font-medium text-on-surface">{user?.name}</span>
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
        <div className="px-4 md:px-8 flex gap-1">
          {[
            { id: 'demos', label: '项目管理', icon: LayoutGrid, count: demosTotal },
            { id: 'messages', label: '留言管理', icon: MessageSquare, count: messagesTotal },
            { id: 'settings', label: '系统设置', icon: Settings, count: null },
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
      <main className="p-4 md:p-8">
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

        {/* ── Demos Tab ── */}
        {activeTab === 'demos' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type="text"
                  placeholder="搜索项目名称或提交人..."
                  value={demosSearch}
                  onChange={(e) => { setDemosSearch(e.target.value); setDemosPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            </div>

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
                  <div className="overflow-x-auto">
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
                              demo.track === 'lightning_coder'
                                ? 'bg-secondary/10 text-secondary'
                                : 'bg-tertiary/10 text-tertiary'
                            }`}>
                              {demo.track === 'lightning_coder' ? 'Lightning Coder' : 'Insighter'}
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
                  </div>

                  <div className="px-4 py-3 border-t border-outline-variant/10 flex items-center justify-between">
                    <div className="text-sm text-on-surface-variant">共 {demosTotal} 条记录</div>
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

        {/* ── Messages Tab ── */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type="text"
                  placeholder="搜索留言内容..."
                  value={messagesSearch}
                  onChange={(e) => { setMessagesSearch(e.target.value); setMessagesPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            </div>

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

                  <div className="px-4 py-3 border-t border-outline-variant/10 flex items-center justify-between">
                    <div className="text-sm text-on-surface-variant">共 {messagesTotal} 条记录</div>
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

        {/* ── Settings Tab ── */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-4xl">

            {/* 未初始化警告 */}
            {needsSetup && (
              <div className="p-4 bg-error-container rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="text-on-error-container mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-on-error-container mb-1">配置表未初始化</p>
                  <p className="text-sm text-on-error-container/80">请点击下方"初始化配置"按钮，完成系统首次设置。</p>
                </div>
                <button
                  onClick={setupConfig}
                  disabled={setupLoading}
                  className="px-4 py-2 bg-error text-on-error rounded-lg text-sm font-medium flex items-center gap-2 flex-shrink-0 hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {setupLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                  初始化配置
                </button>
              </div>
            )}

            {/* ─── 权限控制 ─── */}
            <section>
              <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                <ShieldAlert size={18} className="text-primary" />
                权限控制
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Demo 提交控制 */}
                <div className={`bg-surface-container-low rounded-xl border p-6 ${
                  siteStatus?.isSubmissionOpen === false ? 'border-error/40' : 'border-outline-variant/20'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${siteStatus?.isSubmissionOpen !== false ? 'bg-secondary/10' : 'bg-error/10'}`}>
                        {siteStatus?.isSubmissionOpen !== false
                          ? <FileEdit size={20} className="text-secondary" />
                          : <Lock size={20} className="text-error" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-on-surface">Skill 提交</h3>
                        <p className={`text-sm font-medium ${siteStatus?.isSubmissionOpen !== false ? 'text-secondary' : 'text-error'}`}>
                          {siteStatus === null ? '加载中…' : siteStatus.isSubmissionOpen !== false ? '已开放' : '已关闭'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSubmission(siteStatus?.isSubmissionOpen === false)}
                      disabled={submissionLoading || needsSetup || siteStatus === null}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                        siteStatus?.isSubmissionOpen !== false
                          ? 'bg-error text-on-error hover:opacity-90'
                          : 'bg-secondary text-on-secondary hover:opacity-90'
                      }`}
                    >
                      {submissionLoading
                        ? <Loader2 size={14} className="animate-spin" />
                        : siteStatus?.isSubmissionOpen !== false
                          ? <><Lock size={14} />关闭提交</>
                          : <><Unlock size={14} />开放提交</>
                      }
                    </button>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {siteStatus?.isSubmissionOpen !== false
                      ? '用户可以提交新 Skill。关闭后不再接受新提交，但已提交的 Skill 仍可编辑。'
                      : '提交通道已关闭。已提交的 Skill 仍可由原作者编辑。'}
                  </p>
                </div>

                {/* 投票控制 — 按奖项 */}
                <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden">
                  <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Trophy size={18} className="text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-on-surface">奖项投票开关</h3>
                      <p className="text-xs text-on-surface-variant">独立控制每个奖项的投票开放状态</p>
                    </div>
                  </div>
                  <div className="divide-y divide-outline-variant/10">
                    {AWARD_CONFIGS.map(award => {
                      const isOpen = votingOpenAwards[award.key] === true;
                      const isLoading = awardToggleLoading === award.key;
                      const notice = votingAwardNotices[award.key] || '';
                      const isEditingThisNotice = editingAwardNotice === award.key;
                      return (
                        <div key={award.key} className="px-5 py-3">
                          {/* Row: icon + label + status + toggle */}
                          <div className="flex items-center gap-3">
                            <span className="text-base">{award.icon}</span>
                            <span className="flex-1 text-sm text-on-surface font-medium">{award.label}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOpen ? 'bg-secondary/10 text-secondary' : 'bg-outline/10 text-outline'}`}>
                              {isOpen ? '已开放' : '已关闭'}
                            </span>
                            <button
                              onClick={() => toggleAwardVoting(award.key, !isOpen)}
                              disabled={isLoading || needsSetup}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 ${
                                isOpen ? 'bg-error/10 text-error hover:bg-error/20' : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                              }`}
                            >
                              {isLoading
                                ? <Loader2 size={12} className="animate-spin" />
                                : isOpen
                                  ? <><Lock size={12} />关闭</>
                                  : <><Unlock size={12} />开放</>
                              }
                            </button>
                          </div>
                          {/* Notice: shown only when closed */}
                          {!isOpen && (
                            <div className="mt-2 ml-7">
                              {isEditingThisNotice ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    autoFocus
                                    type="text"
                                    value={awardNoticeInput}
                                    onChange={e => setAwardNoticeInput(e.target.value)}
                                    placeholder="关闭时显示的提示语（可为空）"
                                    className="flex-1 text-xs bg-surface-container border border-outline-variant/30 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary"
                                  />
                                  <button
                                    onClick={() => saveAwardNotice(award.key)}
                                    disabled={awardNoticeSaving}
                                    className="px-2.5 py-1.5 bg-secondary text-on-secondary rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50"
                                  >
                                    {awardNoticeSaving ? <Loader2 size={11} className="animate-spin" /> : '保存'}
                                  </button>
                                  <button
                                    onClick={() => setEditingAwardNotice(null)}
                                    className="px-2.5 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg"
                                  >
                                    取消
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-on-surface-variant/60 flex-1 italic">
                                    {notice || '未设置提示语'}
                                  </span>
                                  <button
                                    onClick={() => { setEditingAwardNotice(award.key); setAwardNoticeInput(notice); }}
                                    className="text-xs text-primary hover:underline flex-shrink-0"
                                  >
                                    {notice ? '编辑' : '添加提示语'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </section>

            {/* ─── 导航配置 ─── */}
            <section>
              <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                <LayoutGrid size={18} className="text-primary" />
                侧边栏导航配置
              </h2>
              <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-6 space-y-4">
                <p className="text-xs text-on-surface-variant">控制侧边栏和手机底栏中的导航项显示/隐藏。</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy size={18} className="text-on-surface-variant" />
                    <div>
                      <span className="font-medium text-on-surface text-sm">Skill 投票</span>
                      <span className={`ml-2 text-xs font-medium ${navLeaderboardVisible ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        {navLeaderboardVisible ? '显示中' : '已隐藏'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => saveNavConfig(!navLeaderboardVisible, navPreliminaryVisible, navMyDemosVisible, navSquareVisible)}
                    disabled={navConfigLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50 ${
                      navLeaderboardVisible
                        ? 'bg-error/10 text-error border border-error/30 hover:bg-error/20'
                        : 'bg-secondary text-on-secondary hover:opacity-90'
                    }`}
                  >
                    {navConfigLoading ? <Loader2 size={14} className="animate-spin" /> : navLeaderboardVisible ? '隐藏' : '显示'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy size={18} className="text-on-surface-variant" />
                    <div>
                      <span className="font-medium text-on-surface text-sm">Skill 海选</span>
                      <span className={`ml-2 text-xs font-medium ${navPreliminaryVisible ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        {navPreliminaryVisible ? '显示中' : '已隐藏'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => saveNavConfig(navLeaderboardVisible, !navPreliminaryVisible, navMyDemosVisible, navSquareVisible)}
                    disabled={navConfigLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50 ${
                      navPreliminaryVisible
                        ? 'bg-error/10 text-error border border-error/30 hover:bg-error/20'
                        : 'bg-secondary text-on-secondary hover:opacity-90'
                    }`}
                  >
                    {navConfigLoading ? <Loader2 size={14} className="animate-spin" /> : navPreliminaryVisible ? '隐藏' : '显示'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderOpen size={18} className="text-on-surface-variant" />
                    <div>
                      <span className="font-medium text-on-surface text-sm">我的 Skill</span>
                      <span className={`ml-2 text-xs font-medium ${navMyDemosVisible ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        {navMyDemosVisible ? '显示中' : '已隐藏'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => saveNavConfig(navLeaderboardVisible, navPreliminaryVisible, !navMyDemosVisible, navSquareVisible)}
                    disabled={navConfigLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50 ${
                      navMyDemosVisible
                        ? 'bg-error/10 text-error border border-error/30 hover:bg-error/20'
                        : 'bg-secondary text-on-secondary hover:opacity-90'
                    }`}
                  >
                    {navConfigLoading ? <Loader2 size={14} className="animate-spin" /> : navMyDemosVisible ? '隐藏' : '显示'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} className="text-on-surface-variant" />
                    <div>
                      <span className="font-medium text-on-surface text-sm">提问广场</span>
                      <span className={`ml-2 text-xs font-medium ${navSquareVisible ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        {navSquareVisible ? '显示中' : '已隐藏'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => saveNavConfig(navLeaderboardVisible, navPreliminaryVisible, navMyDemosVisible, !navSquareVisible)}
                    disabled={navConfigLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50 ${
                      navSquareVisible
                        ? 'bg-error/10 text-error border border-error/30 hover:bg-error/20'
                        : 'bg-secondary text-on-secondary hover:opacity-90'
                    }`}
                  >
                    {navConfigLoading ? <Loader2 size={14} className="animate-spin" /> : navSquareVisible ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>
            </section>

            {/* ─── Leaderboard 入选名单 ─── */}
            <section>
              <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                <LayoutGrid size={18} className="text-primary" />
                投票入选名单
                {eligibleSaving && <Loader2 size={14} className="animate-spin text-on-surface-variant ml-auto" />}
                <span className="ml-auto text-xs font-normal text-on-surface-variant">
                  已选 {eligibleIds.length} / {bonusDemos.length} 个
                </span>
              </h2>
              <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-4 space-y-4">
                <p className="text-xs text-on-surface-variant">勾选后立即保存。只有勾选的产品会出现在投票页。</p>
                {/* Quick actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEligibleIds(bonusDemos.map(d => d.id))}
                    className="text-xs px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high transition-colors"
                  >全选</button>
                  <button
                    onClick={() => saveEligibleIds([])}
                    className="text-xs px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high transition-colors"
                  >清空</button>
                </div>
                {/* Lightning Coder */}
                {(['lightning_coder', 'insighter'] as const).map(track => (
                  <div key={track}>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                      {track === 'lightning_coder' ? '⚡ Lightning Coder' : '🛠️ Insighter'}
                    </p>
                    <div className="space-y-1">
                      {bonusDemos.filter(d => d.track === track).map(d => (
                        <label key={d.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-container-high cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={eligibleIds.includes(d.id)}
                            onChange={() => toggleEligible(d.id)}
                            className="w-4 h-4 rounded accent-primary flex-shrink-0"
                          />
                          <span className="text-sm text-on-surface truncate">{d.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── 投票结果公开 ─── */}
            <section>
              <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-primary" />
                投票结果
              </h2>
              <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium text-on-surface text-sm">对外公开排名结果</span>
                    <span className="text-xs text-on-surface-variant mt-0.5">
                      开启后，所有用户可在 Skill 投票页看到实时排名和票数
                    </span>
                    <span className={`text-xs font-medium mt-1 ${leaderboardResultsVisible ? 'text-secondary' : 'text-on-surface-variant'}`}>
                      当前：{leaderboardResultsVisible ? '✅ 已公开' : '🔒 隐藏中'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleResultsVisible(!leaderboardResultsVisible)}
                    disabled={resultsVisibleLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 ${
                      leaderboardResultsVisible
                        ? 'bg-error/10 text-error border border-error/30 hover:bg-error/20'
                        : 'bg-secondary text-on-secondary hover:opacity-90'
                    }`}
                  >
                    {resultsVisibleLoading ? <Loader2 size={14} className="animate-spin" /> : leaderboardResultsVisible ? '隐藏结果' : '公开结果'}
                  </button>
                </div>
              </div>
            </section>

            {/* ─── 加票管理 ─── */}
            <section>
              <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-primary" />
                加票管理
              </h2>
              <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-6 space-y-5">
                <p className="text-xs text-on-surface-variant">为特定项目在特定奖项下额外加票（不影响普通投票计数）。</p>

                {/* 新增加票 */}
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-on-surface-variant">项目</label>
                    <div className="flex flex-col gap-1 min-w-[220px]">
                      <input
                        type="text"
                        placeholder="搜索项目名称..."
                        value={bonusDemoSearch}
                        onChange={e => { setBonusDemoSearch(e.target.value); setNewBonusDemoId(''); }}
                        className="px-3 py-2 bg-surface border border-outline-variant/30 rounded-lg text-sm focus:border-primary focus:outline-none"
                      />
                      <select
                        value={newBonusDemoId}
                        onChange={e => setNewBonusDemoId(e.target.value)}
                        size={Math.min(6, bonusDemos.filter(d => !bonusDemoSearch || d.name.includes(bonusDemoSearch)).length + 1)}
                        className="px-3 py-1 bg-surface border border-outline-variant/30 rounded-lg text-sm focus:border-primary focus:outline-none"
                      >
                        <option value="">请选择项目</option>
                        {bonusDemos
                          .filter(d => !bonusDemoSearch || d.name.toLowerCase().includes(bonusDemoSearch.toLowerCase()))
                          .map(d => (
                            <option key={d.id} value={d.id}>
                              [{d.track === 'lightning_coder' ? 'O' : 'B'}] {d.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-on-surface-variant">奖项</label>
                    <select
                      value={newBonusVoteType}
                      onChange={e => setNewBonusVoteType(e.target.value)}
                      className="px-3 py-2 bg-surface border border-outline-variant/30 rounded-lg text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="best_optimizer">最佳 Lightning Coder</option>
                      <option value="best_builder">最佳 Insighter</option>
                      <option value="special_brain">🧠 最脑洞</option>
                      <option value="special_infectious">🔥 最感染力</option>
                      <option value="special_useful">💎 最实用</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-on-surface-variant">加票数</label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={newBonusCount}
                      onChange={e => setNewBonusCount(e.target.value)}
                      className="w-20 px-3 py-2 bg-surface border border-outline-variant/30 rounded-lg text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={addBonusVote}
                    disabled={bonusSaving || !newBonusDemoId}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {bonusSaving ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                    添加
                  </button>
                </div>

                {/* 当前加票列表 */}
                {bonusLoading ? (
                  <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-on-surface-variant" /></div>
                ) : bonusVotes.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-2">暂无加票记录</p>
                ) : (
                  <div className="rounded-xl border border-outline-variant/10 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-surface-container/60">
                        <tr>
                          <th className="py-2 px-4 text-xs text-on-surface-variant font-medium text-left">项目</th>
                          <th className="py-2 px-4 text-xs text-on-surface-variant font-medium text-left">奖项</th>
                          <th className="py-2 px-4 text-xs text-on-surface-variant font-medium text-right">加票数</th>
                          <th className="py-2 px-3 text-xs text-on-surface-variant font-medium text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {bonusVotes.map((bv, idx) => {
                          const demo = bonusDemos.find(d => d.id === bv.demo_id);
                          const voteTypeLabels: Record<string, string> = {
                            best_optimizer: '最佳 Lightning Coder',
                            best_builder: '最佳 Insighter',
                            special_brain: '🧠 最脑洞',
                            special_infectious: '🔥 最感染力',
                            special_useful: '💎 最实用',
                          };
                          return (
                            <tr key={idx} className="hover:bg-surface-container/40 transition-colors">
                              <td className="py-2 px-4 text-sm text-on-surface">
                                {demo ? demo.name : `#${bv.demo_id}`}
                              </td>
                              <td className="py-2 px-4 text-xs text-on-surface-variant">
                                {voteTypeLabels[bv.vote_type] || bv.vote_type}
                              </td>
                              <td className="py-2 px-4 text-right font-bold text-on-surface">+{bv.bonus}</td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  onClick={() => removeBonusVote(idx)}
                                  disabled={bonusSaving}
                                  className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* ─── 数据管理 ─── */}
            <section>
              <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                <Database size={18} className="text-primary" />
                数据管理
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* 生成测试数据 */}
                <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-6">
                  <h3 className="font-semibold text-on-surface mb-1">生成测试数据</h3>
                  <p className="text-xs text-on-surface-variant mb-4">
                    自动生成 10 个 Lightning Coder、10 个 Insighter 项目及 8 条留言，用于测试演示。
                  </p>
                  <button
                    onClick={generateTestData}
                    disabled={seedLoading}
                    className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary-dim transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {seedLoading ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                    生成测试数据
                  </button>
                </div>

                {/* 生成 + 清空投票 */}
                <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-6 space-y-3">
                  <h3 className="font-semibold text-on-surface mb-1">Skill 投票测试数据</h3>
                  <p className="text-xs text-on-surface-variant">
                    为尚未投票的用户随机生成测试投票记录（5 个奖项），或清空所有投票记录。与海选投票相互独立。
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={seedVotes}
                      disabled={seedVotesLoading}
                      className="flex-1 py-2.5 bg-primary/10 text-primary border border-primary/30 rounded-lg text-sm font-medium hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {seedVotesLoading ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                      生成测试投票
                    </button>
                    <button
                      onClick={clearAllVotes}
                      disabled={clearVotesLoading}
                      className="flex-1 py-2.5 bg-error/10 text-error border border-error/30 rounded-lg text-sm font-medium hover:bg-error/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {clearVotesLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      清空投票记录
                    </button>
                  </div>
                </div>

                {/* 清理所有数据 */}
                <div className="bg-surface-container-low rounded-xl border border-error/40 p-6">
                  <h3 className="font-semibold text-error mb-1">⚠️ 清空所有数据</h3>
                  <p className="text-xs text-on-surface-variant mb-4">
                    删除全部 Skill、投票及留言数据。<strong className="text-error">不可恢复，请谨慎操作。</strong>
                  </p>
                  <button
                    onClick={clearTestData}
                    disabled={clearLoading}
                    className="w-full py-2.5 bg-error text-on-error rounded-lg text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {clearLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash size={14} />}
                    清空所有数据
                  </button>
                </div>
              </div>
            </section>

            {/* ─── 海选结果 ─── */}
            <section>
              <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-primary" />
                海选结果
              </h2>
              <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-on-surface-variant">
                    {showPrelimResults && prelimResults !== null
                      ? `已提交人数：${prelimResultsTotal} 人，共 ${prelimResults.length} 个项目获得投票`
                      : '点击右侧按钮加载最新结果'}
                  </p>
                  <button
                    onClick={loadPrelimResults}
                    disabled={prelimResultsLoading}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 disabled:opacity-50 flex-shrink-0"
                  >
                    {prelimResultsLoading ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />}
                    {showPrelimResults ? '刷新结果' : '查看结果'}
                  </button>
                </div>

                {showPrelimResults && prelimResults !== null && (
                  <div className="space-y-4">
                    {(['lightning_coder', 'insighter'] as const).map(track => {
                      const items = prelimResults.filter(r => r.track === track);
                      if (items.length === 0) return null;
                      return (
                        <div key={track}>
                          <h3 className="text-sm font-semibold text-on-surface mb-2">
                            {track === 'lightning_coder' ? '⚡ Lightning Coder 赛道' : '🛠️ Insighter 赛道'}
                          </h3>
                          <div className="rounded-xl border border-outline-variant/10 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-surface-container/60">
                                <tr>
                                  <th className="py-2 px-3 text-xs text-on-surface-variant font-medium text-center w-10">#</th>
                                  <th className="py-2 px-4 text-xs text-on-surface-variant font-medium text-left">项目</th>
                                  <th className="py-2 px-4 text-xs text-on-surface-variant font-medium text-left">作者</th>
                                  <th className="py-2 px-4 text-xs text-on-surface-variant font-medium text-right">票数</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline-variant/10">
                                {items.map((item, idx) => (
                                  <tr key={item.demo_id} className="hover:bg-surface-container/40 transition-colors">
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
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                    {prelimResults.length === 0 && (
                      <p className="text-sm text-on-surface-variant text-center py-4">暂无投票数据</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ─── 海选投票 ─── */}
            <section>
              <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-primary" />
                海选投票设置
              </h2>
              <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-6 space-y-5">

                {/* 开启/关闭 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-on-surface">海选投票</h3>
                    <p className={`text-sm font-medium mt-0.5 ${prelimEnabled ? 'text-secondary' : 'text-error'}`}>
                      {prelimEnabled ? '已开放' : '已关闭'}
                    </p>
                  </div>
                  <button
                    onClick={() => togglePrelimEnabled(!prelimEnabled)}
                    disabled={prelimToggleLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                      prelimEnabled
                        ? 'bg-error text-on-error hover:opacity-90'
                        : 'bg-secondary text-on-secondary hover:opacity-90'
                    }`}
                  >
                    {prelimToggleLoading
                      ? <Loader2 size={14} className="animate-spin" />
                      : prelimEnabled ? <><Lock size={14} />关闭</> : <><Unlock size={14} />开放</>
                    }
                  </button>
                </div>

                <div className="border-t border-outline-variant/10 pt-5 space-y-4">

                  {/* 投票模式 */}
                  <div>
                    <p className="text-sm font-medium text-on-surface mb-2">投票模式</p>
                    <div className="flex gap-2">
                      {(['A', 'B'] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => setPrelimMode(m)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            prelimMode === m
                              ? 'bg-primary text-on-primary border-primary'
                              : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
                          }`}
                        >
                          {m === 'A' ? '模式 A（总量）' : '模式 B（分赛道）'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1.5">
                      {prelimMode === 'A'
                        ? '模式 A：从所有项目中选出总计 N 个，不限赛道'
                        : '模式 B：分别从 Lightning Coder 和 Insighter 赛道各选 N 个'}
                    </p>
                  </div>

                  {/* 数量配置 */}
                  {prelimMode === 'A' ? (
                    <div>
                      <label className="text-sm font-medium text-on-surface">需选总数</label>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={prelimTotal}
                        onChange={e => setPrelimTotal(e.target.value)}
                        className="mt-1 w-24 px-3 py-2 bg-surface border border-outline-variant/30 rounded-lg text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex gap-6">
                      <div>
                        <label className="text-sm font-medium text-on-surface">Lightning Coder 赛道选几个</label>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={prelimLightningCoder}
                          onChange={e => setPrelimLightningCoder(e.target.value)}
                          className="mt-1 w-24 px-3 py-2 bg-surface border border-outline-variant/30 rounded-lg text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-on-surface">Insighter 赛道选几个</label>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={prelimInsighter}
                          onChange={e => setPrelimInsighter(e.target.value)}
                          className="mt-1 w-24 px-3 py-2 bg-surface border border-outline-variant/30 rounded-lg text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 结果可见角色 */}
                  <div>
                    <p className="text-sm font-medium text-on-surface mb-2">结果可见角色</p>
                    <div className="flex gap-3">
                      {['admin', 'pro_judge', 'normal'].map(role => (
                        <label key={role} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={prelimRoles.includes(role)}
                            onChange={e => {
                              if (e.target.checked) {
                                setPrelimRoles(prev => [...prev, role]);
                              } else {
                                setPrelimRoles(prev => prev.filter(r => r !== role));
                              }
                            }}
                            className="accent-primary w-4 h-4"
                          />
                          <span className="text-sm text-on-surface">{
                            role === 'admin' ? '管理员' :
                            role === 'pro_judge' ? '评委' :
                            '普通用户'
                          }</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">勾选角色在提交海选后可查看实时结果</p>
                  </div>

                  {/* 关闭提示语 */}
                  <div>
                    <label className="text-sm font-medium text-on-surface">关闭时提示语</label>
                    <input
                      type="text"
                      value={prelimNotice}
                      onChange={e => setPrelimNotice(e.target.value)}
                      placeholder="海选投票暂未开始，敬请期待"
                      className="mt-1 w-full px-3 py-2 bg-surface border border-outline-variant/30 rounded-lg text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Save */}
                  <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={seedPrelimVotes}
                        disabled={seedPrelimLoading}
                        className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {seedPrelimLoading ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                        生成测试投票
                      </button>
                      <button
                        onClick={clearPrelimVotes}
                        disabled={clearPrelimLoading}
                        className="px-4 py-2 bg-error/10 text-error border border-error/30 rounded-lg text-sm font-medium hover:bg-error/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {clearPrelimLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        清空海选投票
                      </button>
                    </div>
                    <button
                      onClick={savePrelimConfig}
                      disabled={prelimLoading}
                      className="px-5 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {prelimLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      保存海选设置
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── 系统初始化（仅未初始化时突出显示，已初始化时折叠为小提示） ─── */}
            {!needsSetup && (
              <section>
                <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                  <Settings size={18} className="text-primary" />
                  系统配置
                </h2>
                <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-on-surface mb-1">重新初始化配置表</h3>
                    <p className="text-xs text-on-surface-variant">重置 site_config 表的默认配置（不删除已有数据）。</p>
                  </div>
                  <button
                    onClick={setupConfig}
                    disabled={setupLoading}
                    className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-sm font-medium hover:bg-surface-container-highest transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                  >
                    {setupLoading ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
                    初始化配置
                  </button>
                </div>
              </section>
            )}
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
