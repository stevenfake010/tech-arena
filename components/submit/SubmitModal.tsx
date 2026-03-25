'use client';

import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Zap, Hammer, X, Upload, Plus, FileImage, FileVideo, Trash2, Eye, Edit3 } from 'lucide-react';
import { pinyin } from 'pinyin-pro';
import ReactMarkdown from 'react-markdown';

interface UserOption {
  id: number;
  name: string;
  department: string;
}

interface SubmitModalProps {
  onClose: () => void;
  initialTrack?: 'optimizer' | 'builder';
}

export default function SubmitModal({ onClose, initialTrack }: SubmitModalProps) {
  const [form, setForm] = useState({
    name: '',
    summary: '',
    track: initialTrack ?? '',
    demo_link: '',
    submitter1_name: '',
    submitter1_dept: '',
    submitter2_name: '',
    submitter2_dept: '',
    background: '',
    solution: '',
    keywords: '',
  });
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 关键词标签输入
  const [keywordInput, setKeywordInput] = useState('');
  const [keywordTags, setKeywordTags] = useState<string[]>([]);
  const keywordInputRef = useRef<HTMLInputElement>(null);

  // Markdown 预览模式状态
  const [whyPreview, setWhyPreview] = useState(false);
  const [howPreview, setHowPreview] = useState(false);

  // 用户选择相关状态 - 与登录页逻辑一致
  const [users, setUsers] = useState<UserOption[]>([]);
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

  // 加载用户列表
  useEffect(() => {
    fetch('/api/auth/users')
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setUsers(d.users || []);
        }
      })
      .catch(() => {});
  }, []);

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

  // 筛选用户逻辑 - 与登录页一致
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

  // 添加关键词标签
  const addKeywordTag = () => {
    const trimmed = keywordInput.trim();
    if (!trimmed) return;
    
    // 支持顿号、逗号分隔输入多个关键词
    const newTags = trimmed.split(/[\u3001,,，]/).map(t => t.trim()).filter(Boolean);
    const uniqueTags = [...new Set([...keywordTags, ...newTags])].slice(0, 10); // 最多10个
    
    setKeywordTags(uniqueTags);
    setKeywordInput('');
    // 同步到 form
    setForm(prev => ({ ...prev, keywords: uniqueTags.join('、') }));
  };

  // 删除关键词标签
  const removeKeywordTag = (tagToRemove: string) => {
    const newTags = keywordTags.filter(tag => tag !== tagToRemove);
    setKeywordTags(newTags);
    setForm(prev => ({ ...prev, keywords: newTags.join('、') }));
  };

  // 处理关键词输入框键盘事件
  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeywordTag();
    } else if (e.key === 'Backspace' && !keywordInput && keywordTags.length > 0) {
      // 输入框为空时按退格，删除最后一个标签
      const lastTag = keywordTags[keywordTags.length - 1];
      removeKeywordTag(lastTag);
    }
  };

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // 验证所有必填项
    if (!form.track) {
      setError('请选择赛道');
      return;
    }
    if (!form.submitter1_name || !form.submitter1_dept) {
      setError('请选择第一位提交人');
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
    if (!form.background) {
      setError('请填写 Why（为什么要做）');
      return;
    }
    if (!form.solution) {
      setError('请填写 How（怎么解决的）');
      return;
    }
    if (!form.demo_link) {
      setError('请填写演示链接');
      return;
    }

    // 验证提交人1必须已选择（从下拉框选择，不是手动输入）
    if (!selectedUser1) {
      setError('请从下拉列表中选择第一位提交人');
      return;
    }

    // 验证提交人1的部门匹配
    if (selectedUser1.department !== form.submitter1_dept) {
      setError('第一位提交人的部门信息不匹配，请重新选择');
      return;
    }

    // Builder赛道且填写了第二位提交人时，验证第二位
    if (form.track === 'builder' && form.submitter2_name) {
      if (!selectedUser2) {
        setError('请从下拉列表中选择第二位提交人，或留空');
        return;
      }
      if (selectedUser2.department !== form.submitter2_dept) {
        setError('第二位提交人的部门信息不匹配，请重新选择');
        return;
      }
      // 不能选择自己
      if (selectedUser1.id === selectedUser2.id) {
        setError('两位提交人不能是同一个人');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/demos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, media_urls: mediaFiles }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '提交失败');
        return;
      }
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch {
      setError('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-on-surface/5 backdrop-blur-md"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-surface-container-lowest rounded-xl shadow-lg p-16 text-center">
          <CheckCircle size={48} className="text-secondary mx-auto mb-4" />
          <h2 className="font-headline text-3xl mb-2">Submitted!</h2>
          <p className="text-on-surface-variant">Your evolution is now in the archive.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-on-surface/5 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl bg-surface-container-lowest rounded-xl shadow-[0_8px_32px_rgba(46,52,45,0.06)] overflow-hidden flex flex-row max-h-[90vh] relative">
        {/* 常驻关闭按钮 - 右上角 */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-50 p-2 bg-surface-container-lowest hover:bg-surface-container rounded-full transition-colors shadow-sm"
        >
          <X size={20} />
        </button>

        {/* Left Sidebar */}
        <div className="w-[300px] bg-surface-container-low px-10 pb-10 pt-[84px] flex-col hidden md:flex flex-shrink-0">
          <div>
            <h2 className="font-headline text-[42px] font-bold leading-tight text-on-surface mb-6">提交 Demo</h2>
            <p className="text-sm text-on-surface-variant/60 leading-relaxed">
              Join the Evolution.<br />
              Stop Talking About the Future.<br />
              Start Shipping It.
            </p>
          </div>

        </div>

        {/* Right Form */}
        <div className="flex-1 px-10 pb-10 pt-[84px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(var(--outline-rgb), 0.4) transparent' }}>

          <form onSubmit={handleSubmit} className="space-y-12">
            {/* 1. Choose Your Track - 先选赛道 */}
            <div className="space-y-4">
              <div>
                <label className="block font-headline text-xl font-bold text-on-surface mb-1">
                  1. Choose Your Track
                </label>
                <p className="text-sm text-on-surface-variant/60">选择你的赛道（每人不限制赛道和 Demo 提交次数）</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex flex-col gap-3 p-5 rounded-lg border-2 cursor-pointer transition-all ${
                  form.track === 'optimizer' 
                    ? 'border-secondary bg-secondary-container/30' 
                    : 'border-outline-variant/30 hover:border-outline'
                }`}>
                  <div className="flex items-start gap-4">
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
                    </div>
                  </div>
                  <div className="pl-7 space-y-2">
                    <div>
                      <span className="text-xs font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">原则</span>
                      <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">重构工作流，极致提高效率，用 AI 把自己武装成全能战士</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">实现形式</span>
                      <p className="text-sm text-on-surface-variant mt-1.5">AI Skills、AI Workflow 等</p>
                    </div>
                  </div>
                </label>
                <label className={`relative flex flex-col gap-3 p-5 rounded-lg border-2 cursor-pointer transition-all ${
                  form.track === 'builder' 
                    ? 'border-tertiary bg-tertiary-container/30' 
                    : 'border-outline-variant/30 hover:border-outline'
                }`}>
                  <div className="flex items-start gap-4">
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
                    </div>
                  </div>
                  <div className="pl-7 space-y-2">
                    <div>
                      <span className="text-xs font-bold text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded">原则</span>
                      <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">设计一个小红书功能，或是有小红书 DNA 的有趣独立产品</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded">实现形式</span>
                      <p className="text-sm text-on-surface-variant mt-1.5">产品 Demo/概念，或可以落地的产品</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* 2. Who's the mastermind? - 根据赛道显示1或2个 */}
            <div className="space-y-6">
              <div>
                <label className="block font-headline text-xl font-bold text-on-surface mb-1">
                  2. Who's the Mastermind
                </label>
                <p className="text-sm text-on-surface-variant/60 mb-4">
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
                    {showDropdown1 && query1 && filteredUsers1.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-container-high shadow-xl z-50 rounded-lg px-4 py-3 text-sm text-outline">
                        未找到匹配用户
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

            {/* 3. Give it a Codename */}
            <div className="space-y-3">
              <div>
                <label className="block font-headline text-xl font-bold text-on-surface mb-1">
                  3. Give It a Codename
                </label>
                <p className="text-sm text-on-surface-variant/60">取个响亮的名字</p>
              </div>
              <input
                className="w-full bg-surface-container-low border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-1 py-3 text-base transition-colors placeholder:text-outline-variant/50"
                placeholder="Project Name / 项目名称"
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
              
              {/* One-Line Pitch - 移到 Story 里 */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-primary">
                  One-Line Pitch / 一句话介绍 *
                </label>
                <input
                  className="w-full bg-surface-container-low border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-1 py-3 text-base transition-colors placeholder:text-outline-variant/50"
                  placeholder="一句话概括你的项目"
                  value={form.summary}
                  onChange={e => updateField('summary', e.target.value)}
                />
              </div>
              
              {/* Why */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-[0.12em] text-secondary">
                    Why / 为什么要做？ *
                  </label>
                  <button
                    type="button"
                    onClick={() => setWhyPreview(!whyPreview)}
                    className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-secondary transition-colors"
                  >
                    {whyPreview ? <Edit3 size={14} /> : <Eye size={14} />}
                    {whyPreview ? '编辑' : '预览'}
                  </button>
                </div>
                {whyPreview ? (
                  <div className="w-full bg-surface-container-low/50 border border-outline/20 rounded-lg px-4 py-3 min-h-[120px] max-h-[300px] overflow-y-auto">
                    {form.background ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{form.background}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-outline-variant italic">暂无内容</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    className="w-full bg-surface-container-low border-0 border-b-2 border-outline focus:border-secondary focus:ring-0 px-1 py-3 text-base leading-relaxed transition-colors resize-none placeholder:text-outline-variant/50"
                    placeholder="解决什么问题？背后的故事是什么？发现什么痛点？（支持 Markdown）"
                    rows={4}
                    value={form.background}
                    onChange={e => updateField('background', e.target.value)}
                  />
                )}
              </div>
              
              {/* How */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-[0.12em] text-tertiary">
                    How / 怎么解决的？ *
                  </label>
                  <button
                    type="button"
                    onClick={() => setHowPreview(!howPreview)}
                    className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-tertiary transition-colors"
                  >
                    {howPreview ? <Edit3 size={14} /> : <Eye size={14} />}
                    {howPreview ? '编辑' : '预览'}
                  </button>
                </div>
                {howPreview ? (
                  <div className="w-full bg-surface-container-low/50 border border-outline/20 rounded-lg px-4 py-3 min-h-[120px] max-h-[300px] overflow-y-auto">
                    {form.solution ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{form.solution}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-outline-variant italic">暂无内容</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    className="w-full bg-surface-container-low border-0 border-b-2 border-outline focus:border-tertiary focus:ring-0 px-1 py-3 text-base leading-relaxed transition-colors resize-none placeholder:text-outline-variant/50"
                    placeholder="具体的解决方案是什么？用什么方法/技术实现的？（支持 Markdown）"
                    rows={4}
                    value={form.solution}
                    onChange={e => updateField('solution', e.target.value)}
                  />
                )}
              </div>
              
              {/* Keywords - Tag Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-primary">
                  KEY WORDS / 关键词（选填，最多10个）
                </label>
                
                {/* 已添加的标签 */}
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
                
                {/* 输入框 */}
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
                <p className="text-sm text-on-surface-variant/60">展示你的作品（Demo、文档、GitHub）</p>
              </div>
              <input
                className="w-full bg-surface-container-low border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-1 py-3 text-base transition-colors placeholder:text-outline-variant/50"
                placeholder="Link to demo / doc / GitHub / 演示链接"
                type="url"
                value={form.demo_link}
                onChange={e => updateField('demo_link', e.target.value)}
              />
              <p className="text-xs text-on-surface-variant/50 mt-2">
                Redoc文档请提前开放权限
              </p>
            </div>

            {/* Media Upload - 可选 */}
            <div className="pt-4">
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

            {/* Error */}
            {error && <p className="text-error text-sm">{error}</p>}

            {/* Submit Footer */}
            <div className="flex items-center justify-end pt-10 border-t border-outline-variant/10 mt-12">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 text-sm font-bold uppercase tracking-widest text-primary hover:bg-surface-container-high transition-colors rounded"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-10 py-3 text-sm font-bold uppercase tracking-widest bg-primary text-on-primary hover:bg-primary-dim transition-all shadow-lg hover:shadow-xl rounded disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '提交'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
