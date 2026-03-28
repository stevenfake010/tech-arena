'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Trash2, User, AlertCircle, X, Check, Loader2, Zap, Hammer, Plus, Upload, CheckCircle, FileVideo, ExternalLink } from 'lucide-react';

interface DemoLink { title: string; url: string; }
function parseDemoLinks(raw: string | undefined | null): DemoLink[] {
  if (!raw) return [{ title: '', url: '' }];
  if (raw.trim().startsWith('[')) {
    try { return JSON.parse(raw); } catch {}
  }
  return [{ title: '', url: raw }];
}
import { pinyin } from 'pinyin-pro';
import { useUser } from '@/lib/hooks/useUser';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

interface Demo {
  id: number;
  name: string;
  summary: string;
  track: 'optimizer' | 'builder';
  demo_link?: string;
  submitter1_name: string;
  submitter1_dept: string;
  submitter2_name?: string;
  submitter2_dept?: string;
  background?: string;
  solution?: string;
  keywords?: string;
  media_urls?: string[];
  isPrimarySubmitter: boolean;
  isSecondarySubmitter: boolean;
  created_at: string;
}

interface UserOption {
  id: number;
  name: string;
  department: string;
}

export default function MyDemosPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDemo, setEditingDemo] = useState<Demo | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // 编辑表单状态 - 与 SubmitModal 一致
  const [form, setForm] = useState({
    name: '',
    summary: '',
    track: '' as 'optimizer' | 'builder' | '',
    demo_link: '',
    submitter1_name: '',
    submitter1_dept: '',
    submitter2_name: '',
    submitter2_dept: '',
    background: '',
    solution: '',
    keywords: '',
  });

  // 关键词标签输入
  const [keywordInput, setKeywordInput] = useState('');
  const [keywordTags, setKeywordTags] = useState<string[]>([]);
  const keywordInputRef = useRef<HTMLInputElement>(null);

  const [demoLinks, setDemoLinks] = useState<DemoLink[]>([{ title: '', url: '' }]);

  // 媒体文件上传
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Markdown 预览模式状态

  // 用户选择相关状态 - 与 SubmitModal 一致
  const [query1, setQuery1] = useState('');
  const [query2, setQuery2] = useState('');
  const [selectedUser1, setSelectedUser1] = useState<UserOption | null>(null);
  const [selectedUser2, setSelectedUser2] = useState<UserOption | null>(null);
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);
  const dropdownRef1 = useRef<HTMLDivElement>(null);
  const dropdownRef2 = useRef<HTMLDivElement>(null);

  const isOptimizer = form.track === 'optimizer';

  // 文件上传处理
  async function handleFileUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
          setMediaFiles(prev => [...prev, data.url]);
        } else {
          setError(data.error || '上传失败');
        }
      }
    } catch {
      setError('上传失败');
    } finally {
      setUploading(false);
    }
  }

  // 删除媒体文件
  function removeMediaFile(index: number) {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  }

  // 判断文件类型
  function isVideo(url: string) {
    return url.match(/\.(mp4|mov|webm|avi)$/i);
  }

  // 当用户信息加载完成后，获取 demos 和用户列表
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    fetchMyDemos();
    fetchUsers();
  }, [user, userLoading]);

  // 点击外部关闭下拉框
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef1.current && !dropdownRef1.current.contains(e.target as Node) &&
          inputRef1.current && !inputRef1.current.contains(e.target as Node)) {
        setShowDropdown1(false);
      }
      if (dropdownRef2.current && !dropdownRef2.current.contains(e.target as Node) &&
          inputRef2.current && !inputRef2.current.contains(e.target as Node)) {
        setShowDropdown2(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // checkAuth removed — user comes from useUser() SWR hook

  async function fetchMyDemos() {
    try {
      const res = await fetch('/api/demos/my');
      const data = await res.json();
      if (res.ok) {
        setDemos(data.demos || []);
      }
    } catch (error) {
      console.error('Failed to fetch my demos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }

  // 筛选用户逻辑 - 与 SubmitModal 一致
  const filteredUsers1 = users.filter(u => {
    if (!query1.trim()) return true;
    const q = query1.trim().toLowerCase();
    if (u.name.includes(q)) return true;
    const fullPinyin = pinyin(u.name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
    const initials = pinyin(u.name, { pattern: 'first', toneType: 'none', type: 'array' }).join('').toLowerCase();
    return fullPinyin.includes(q) || initials.includes(q);
  });

  const filteredUsers2 = users.filter(u => {
    if (!query2.trim()) return true;
    const q = query2.trim().toLowerCase();
    if (u.name.includes(q)) return true;
    const fullPinyin = pinyin(u.name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
    const initials = pinyin(u.name, { pattern: 'first', toneType: 'none', type: 'array' }).join('').toLowerCase();
    return fullPinyin.includes(q) || initials.includes(q);
  });

  function startEdit(demo: Demo) {
    setEditingDemo(demo);
    setForm({
      name: demo.name,
      summary: demo.summary,
      track: demo.track,
      demo_link: demo.demo_link || '',
      submitter1_name: demo.submitter1_name,
      submitter1_dept: demo.submitter1_dept,
      submitter2_name: demo.submitter2_name || '',
      submitter2_dept: demo.submitter2_dept || '',
      background: demo.background || '',
      solution: demo.solution || '',
      keywords: demo.keywords || '',
    });

    // 初始化链接
    setDemoLinks(parseDemoLinks(demo.demo_link));

    // 初始化媒体文件
    setMediaFiles(demo.media_urls || []);

    // 初始化关键词标签
    if (demo.keywords) {
      const tags = demo.keywords.split(/[、,，]/).map(t => t.trim()).filter(Boolean);
      setKeywordTags(tags);
    } else {
      setKeywordTags([]);
    }

    // 初始化用户选择
    const u1 = users.find(u => u.name === demo.submitter1_name);
    if (u1) {
      setSelectedUser1(u1);
      setQuery1(u1.name);
    }
    const u2 = users.find(u => u.name === demo.submitter2_name);
    if (u2) {
      setSelectedUser2(u2);
      setQuery2(u2.name);
    }

    setError('');
  }

  function cancelEdit() {
    setEditingDemo(null);
    setError('');
    setKeywordInput('');
    setKeywordTags([]);
    setMediaFiles([]);
    setQuery1('');
    setQuery2('');
    setSelectedUser1(null);
    setSelectedUser2(null);
  }

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'track' && value === 'optimizer') {
      setForm(prev => ({ 
        ...prev, 
        [field]: value, 
        submitter2_name: '', 
        submitter2_dept: '' 
      }));
      setSelectedUser2(null);
      setQuery2('');
    }
  }

  function selectUser1(user: UserOption) {
    setSelectedUser1(user);
    setQuery1(user.name);
    setForm(prev => ({ 
      ...prev, 
      submitter1_name: user.name, 
      submitter1_dept: user.department 
    }));
    setShowDropdown1(false);
    setError('');
  }

  function selectUser2(user: UserOption) {
    setSelectedUser2(user);
    setQuery2(user.name);
    setForm(prev => ({ 
      ...prev, 
      submitter2_name: user.name, 
      submitter2_dept: user.department 
    }));
    setShowDropdown2(false);
    setError('');
  }

  // 关键词标签操作
  const addKeywordTag = () => {
    const trimmed = keywordInput.trim();
    if (!trimmed) return;
    const newTags = trimmed.split(/[、,，]/).map(t => t.trim()).filter(Boolean);
    const uniqueTags = [...new Set([...keywordTags, ...newTags])].slice(0, 10);
    setKeywordTags(uniqueTags);
    setKeywordInput('');
    setForm(prev => ({ ...prev, keywords: uniqueTags.join('、') }));
  };

  const removeKeywordTag = (tagToRemove: string) => {
    const newTags = keywordTags.filter(tag => tag !== tagToRemove);
    setKeywordTags(newTags);
    setForm(prev => ({ ...prev, keywords: newTags.join('、') }));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeywordTag();
    } else if (e.key === 'Backspace' && !keywordInput && keywordTags.length > 0) {
      const lastTag = keywordTags[keywordTags.length - 1];
      removeKeywordTag(lastTag);
    }
  };

  async function handleSave() {
    if (!editingDemo) return;

    // 验证
    if (!form.track) {
      setError('请选择赛道');
      return;
    }
    if (!form.name) {
      setError('请填写项目名称');
      return;
    }
    if (!form.summary) {
      setError('请填写一句话介绍');
      return;
    }
    if (!form.submitter1_name || !form.submitter1_dept) {
      setError('请选择第一位提交人');
      return;
    }
    if (!form.background) {
      setError('请填写项目背景');
      return;
    }
    if (!form.solution) {
      setError('请填写解决方案');
      return;
    }

    // Optimizer 不能有第二提交人
    if (form.track === 'optimizer' && form.submitter2_name) {
      setError('Optimizer 赛道仅允许单人提报');
      return;
    }

    // 验证提交人
    if (!selectedUser1 || selectedUser1.department !== form.submitter1_dept) {
      setError('第一位提交人信息不匹配，请重新选择');
      return;
    }
    if (form.track === 'builder' && form.submitter2_name) {
      if (!selectedUser2 || selectedUser2.department !== form.submitter2_dept) {
        setError('第二位提交人信息不匹配，请重新选择');
        return;
      }
      if (selectedUser1.id === selectedUser2.id) {
        setError('两位提交人不能是同一个人');
        return;
      }
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/demos/${editingDemo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, demo_link: JSON.stringify(demoLinks.filter(l => l.url.trim())), media_urls: mediaFiles }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '保存失败');
      } else {
        cancelEdit();
        fetchMyDemos();
      }
    } catch (error) {
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(demoId: number) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/demos/${demoId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setShowDeleteConfirm(null);
        fetchMyDemos();
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (error) {
      alert('删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  }

  function getTrackLabel(track: string) {
    return track === 'optimizer' ? '⚡ Optimizer' : '🛠️ Builder';
  }

  function getTrackColor(track: string) {
    return track === 'optimizer' 
      ? 'bg-secondary/10 text-secondary' 
      : 'bg-tertiary/10 text-tertiary';
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-on-surface-variant">加载中...</div>
      </div>
    );
  }

  // 编辑模式 - 使用与 SubmitModal 一致的布局
  if (editingDemo) {
    return (
      <div className="px-4 md:px-12 pt-4 pb-20 md:pb-12 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface">编辑 Demo</h2>
          <button 
            onClick={cancelEdit} 
            className="p-2 hover:bg-surface-container rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg flex items-start gap-2">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form className="space-y-10">
          {/* 1. Choose Your Track */}
          <div className="space-y-4">
            <div>
              <label className="block font-headline text-xl font-bold text-on-surface mb-1">
                1. Choose Your Track
              </label>
              <p className="text-sm text-on-surface-variant/60">选择你的赛道</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`relative flex items-start gap-4 p-5 rounded-lg border-2 cursor-pointer transition-all ${
                form.track === 'optimizer' 
                  ? 'border-secondary bg-secondary-container/30' 
                  : 'border-outline-variant/30 hover:border-outline'
              }`}>
                <input
                  type="radio"
                  name="track"
                  value="optimizer"
                  checked={form.track === 'optimizer'}
                  onChange={e => updateField('track', e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">⚡️</span>
                    <span className="font-bold text-on-surface">Optimizer</span>
                  </div>
                  <p className="text-xs text-on-surface-variant/80 leading-relaxed">重构工作流，用 AI 把自己武装成全能战士</p>
                </div>
              </label>
              <label className={`relative flex items-start gap-4 p-5 rounded-lg border-2 cursor-pointer transition-all ${
                form.track === 'builder' 
                  ? 'border-tertiary bg-tertiary-container/30' 
                  : 'border-outline-variant/30 hover:border-outline'
              }`}>
                <input
                  type="radio"
                  name="track"
                  value="builder"
                  checked={form.track === 'builder'}
                  onChange={e => updateField('track', e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🛠️</span>
                    <span className="font-bold text-on-surface">Builder</span>
                  </div>
                  <p className="text-xs text-on-surface-variant/80 leading-relaxed">设计小红书功能，或是有小红书 DNA 的独立产品</p>
                </div>
              </label>
            </div>
          </div>

          {/* 2. Who's the Mastermind */}
          <div className="space-y-6">
            <div>
              <label className="block font-headline text-xl font-bold text-on-surface mb-1">
                2. Who's the Mastermind
              </label>
              <p className="text-sm text-on-surface-variant/60">
                {!form.track ? '请先选择赛道' : isOptimizer ? 'Optimizer 赛道：仅限单人' : 'Builder 赛道：可单人或组队'}
              </p>
            </div>
            
            {/* Member 1 */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                薯名 1 *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    ref={inputRef1}
                    className="w-full bg-surface-container-low border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-1 py-3 text-base transition-colors placeholder:text-outline-variant/50 disabled:opacity-30"
                    placeholder="输入薯名搜索..."
                    value={query1}
                    disabled={!form.track}
                    onChange={e => {
                      setQuery1(e.target.value);
                      setSelectedUser1(null);
                      setForm(prev => ({ ...prev, submitter1_name: '', submitter1_dept: '' }));
                      setShowDropdown1(true);
                    }}
                    onFocus={() => form.track && setShowDropdown1(true)}
                  />
                  {showDropdown1 && filteredUsers1.length > 0 && (
                    <div
                      ref={dropdownRef1}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-container-high shadow-xl max-h-48 overflow-y-auto z-50 rounded-lg"
                    >
                      {filteredUsers1.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-surface-container-low transition-colors flex justify-between items-center"
                          onClick={() => selectUser1(u)}
                        >
                          <span className="text-base font-medium text-on-surface">{u.name}</span>
                          <span className="text-xs text-outline">{u.department}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  className="w-full bg-surface-container-low/50 border-0 border-b-2 border-outline/30 px-1 py-3 text-base text-on-surface/70 cursor-not-allowed"
                  placeholder="选择薯名后自动填充"
                  value={form.submitter1_dept}
                  readOnly
                />
              </div>
            </div>

            {/* Member 2 - 仅 Builder 显示 */}
            {form.track === 'builder' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  薯名 2（可选）
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      ref={inputRef2}
                      className="w-full bg-surface-container-low border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-1 py-3 text-base transition-colors placeholder:text-outline-variant/50"
                      placeholder="输入薯名搜索（可选）..."
                      value={query2}
                      onChange={e => {
                        setQuery2(e.target.value);
                        setSelectedUser2(null);
                        setForm(prev => ({ ...prev, submitter2_name: '', submitter2_dept: '' }));
                        setShowDropdown2(true);
                      }}
                      onFocus={() => setShowDropdown2(true)}
                    />
                    {showDropdown2 && filteredUsers2.length > 0 && (
                      <div
                        ref={dropdownRef2}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-container-high shadow-xl max-h-48 overflow-y-auto z-50 rounded-lg"
                      >
                        {filteredUsers2.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            className="w-full px-4 py-3 text-left hover:bg-surface-container-low transition-colors flex justify-between items-center"
                            onClick={() => selectUser2(u)}
                          >
                            <span className="text-base font-medium text-on-surface">{u.name}</span>
                            <span className="text-xs text-outline">{u.department}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    className="w-full bg-surface-container-low/50 border-0 border-b-2 border-outline/30 px-1 py-3 text-base text-on-surface/70 cursor-not-allowed"
                    placeholder="选择薯名后自动填充"
                    value={form.submitter2_dept}
                    readOnly
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Give It a Codename */}
          <div className="space-y-3">
            <div>
              <label className="block font-headline text-xl font-bold text-on-surface mb-1">
                3. Give It a Codename
              </label>
              <p className="text-sm text-on-surface-variant/60">取个响亮的名字</p>
            </div>
            <input
              className="w-full bg-surface-container-low border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-1 py-3 text-base transition-colors placeholder:text-outline-variant/50"
              placeholder="Project Name / 项目名称 *"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
            />
          </div>

          {/* 4. The Story */}
          <div className="space-y-6">
            <div>
              <label className="block font-headline text-xl font-bold text-on-surface mb-1">
                4. The Story
              </label>
              <p className="text-sm text-on-surface-variant/60">讲讲背后的故事</p>
            </div>
            
            {/* One-Line Pitch */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-primary">
                One-Line Pitch / 一句话介绍 *
              </label>
              <input
                className="w-full bg-surface-container-low border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-1 py-3 text-base transition-colors placeholder:text-outline-variant/50"
                placeholder="一句话概括你的项目 *"
                value={form.summary}
                onChange={e => updateField('summary', e.target.value)}
              />
            </div>
            
            {/* Why */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-secondary">
                Why / 为什么要做？ *
              </label>
              <RichTextEditor
                value={form.background}
                onChange={v => updateField('background', v)}
                placeholder="解决什么问题？背后的故事是什么？发现什么痛点？"
                accent="secondary"
                rows={4}
              />
            </div>

            {/* How */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-tertiary">
                How / 怎么解决的？ *
              </label>
              <RichTextEditor
                value={form.solution}
                onChange={v => updateField('solution', v)}
                placeholder="具体的解决方案是什么？用什么方法/技术实现的？"
                accent="tertiary"
                rows={4}
              />
            </div>
            
            {/* Keywords - Tag Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-primary">
                KEY WORDS / 关键词（选填，最多10个）
              </label>
              
              {keywordTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {keywordTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary/10 text-secondary text-sm rounded-full group"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeKeywordTag(tag)}
                        className="p-0.5 hover:bg-secondary/20 rounded-full transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="relative">
                <input
                  ref={keywordInputRef}
                  className="w-full bg-surface-container-low border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-1 py-3 pr-10 text-base transition-colors placeholder:text-outline-variant/50"
                  placeholder={keywordTags.length > 0 ? "继续输入关键词..." : "输入关键词后按回车添加"}
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                />
                {keywordInput.trim() && (
                  <button
                    type="button"
                    onClick={addKeywordTag}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-on-primary rounded-full hover:opacity-90 transition-opacity"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
              
              <p className="text-xs text-on-surface-variant/50">
                按 Enter 添加，点击标签可删除，空格按 Backspace 可删除上一个<br />
                关键词例如 PMO、数据分析、社区、商业化等
              </p>
            </div>
          </div>

          {/* 5. Show Us the Goods */}
          <div className="space-y-4">
            <div>
              <label className="block font-headline text-xl font-bold text-on-surface mb-1">
                5. Show Us the Goods
              </label>
              <p className="text-sm text-on-surface-variant/60">展示你的作品（Demo、文档、GitHub等），可添加多个链接</p>
            </div>
            <div className="space-y-3">
              {demoLinks.map((link, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="w-36 flex-shrink-0 bg-surface-container-low border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-1 py-3 text-base transition-colors placeholder:text-outline-variant/50"
                    placeholder="标题（选填）"
                    value={link.title}
                    onChange={e => setDemoLinks(prev => prev.map((l, j) => j === i ? { ...l, title: e.target.value } : l))}
                  />
                  <input
                    className="flex-1 bg-surface-container-low border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-1 py-3 text-base transition-colors placeholder:text-outline-variant/50"
                    placeholder="链接地址"
                    type="url"
                    value={link.url}
                    onChange={e => setDemoLinks(prev => prev.map((l, j) => j === i ? { ...l, url: e.target.value } : l))}
                  />
                  {demoLinks.length > 1 && (
                    <button type="button" onClick={() => setDemoLinks(prev => prev.filter((_, j) => j !== i))} className="text-outline-variant hover:text-error transition-colors flex-shrink-0">
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setDemoLinks(prev => [...prev, { title: '', url: '' }])}
                className="flex items-center gap-1.5 text-sm text-on-surface-variant/60 hover:text-primary transition-colors"
              >
                <Plus size={15} />
                添加链接
              </button>
              <p className="text-xs text-on-surface-variant/50">Redoc文档请提前开放权限</p>
            </div>
          </div>

          {/* Media Upload - 可选 */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm text-on-surface-variant/60">
                截图/录屏等（选填，支持多个）
              </label>
              {mediaFiles.length > 0 && (
                <span className="text-xs text-primary">已上传 {mediaFiles.length} 个文件</span>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={e => handleFileUpload(e.target.files)}
            />
            
            {/* 已上传文件预览网格 */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {mediaFiles.map((url, index) => (
                  <div key={index} className="relative aspect-video bg-surface-container-highest rounded-lg overflow-hidden group">
                    {isVideo(url) ? (
                      <>
                        <video 
                          src={url} 
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <FileVideo size={24} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <img 
                        src={url} 
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {/* 删除按钮 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMediaFile(index);
                      }}
                      className="absolute top-1 right-1 p-1 bg-error/90 text-on-error rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* 上传区域 */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={e => { e.preventDefault(); e.stopPropagation(); handleFileUpload(e.dataTransfer.files); }}
              className="w-full rounded-lg bg-surface-container-low border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center p-4 group hover:border-primary/50 transition-colors cursor-pointer"
              style={{ aspectRatio: mediaFiles.length > 0 ? '8/1' : '21/6' }}
            >
              {uploading ? (
                <p className="text-sm text-on-surface-variant">上传中...</p>
              ) : (
                <>
                  <Upload size={mediaFiles.length > 0 ? 20 : 32} className="text-outline-variant group-hover:text-primary mb-1" />
                  <p className="text-sm font-medium text-on-surface-variant">
                    {mediaFiles.length > 0 ? '继续添加图片/视频' : '拖拽或点击上传图片/视频'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-4 pt-6 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-6 py-3 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 font-medium disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              保存修改
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 列表模式
  return (
    <div className="px-4 md:px-12 pb-20 md:pb-12 max-w-4xl">
      {/* Header */}
      <header className="flex-shrink-0 mb-8 pt-4 pb-2">
        <h2 className="font-headline text-2xl md:text-4xl font-bold tracking-tight text-on-surface">My Demo</h2>
        <p className="text-lg text-on-surface-variant mt-2">
          管理你提交或参与创作的 Demo
        </p>
      </header>

      {/* Demo List */}
      {demos.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant bg-surface-container-low rounded-xl">
          <p className="mb-4">暂无 Demo</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openSubmit'))}
            className="px-6 py-2 bg-primary text-on-primary rounded-md text-sm hover:opacity-90 transition-opacity"
          >
            去提交 Demo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {demos.map(demo => (
            <div
              key={demo.id}
              className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/20 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${getTrackColor(demo.track)}`}>
                      {getTrackLabel(demo.track)}
                    </span>
                    {(demo.isPrimarySubmitter || demo.isSecondarySubmitter) && (
                      <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">
                        {demo.isPrimarySubmitter ? '第一提交人' : '第二提交人'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-headline font-bold text-xl mb-2">{demo.name}</h3>
                  <p className="text-on-surface-variant text-sm mb-3">{demo.summary}</p>
                  
                  {/* 关键词 */}
                  {demo.keywords && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {demo.keywords.split(/[、,，]/).map((kw, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded">
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 提交人信息 */}
                  <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{demo.submitter1_name}</span>
                      {demo.submitter2_name && (
                        <>, <span>{demo.submitter2_name}</span></>
                      )}
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(demo)}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(demo.id)}
                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* 删除确认弹窗 */}
              {showDeleteConfirm === demo.id && (
                <div className="mt-4 p-4 bg-error-container/50 rounded-lg border border-error/20">
                  <p className="text-sm text-on-error-container mb-3">
                    确定要删除这个 Demo 吗？此操作不可恢复。
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container rounded transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleDelete(demo.id)}
                      disabled={deleting}
                      className="px-3 py-1.5 text-sm bg-error text-on-error rounded hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                      {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      确认删除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
