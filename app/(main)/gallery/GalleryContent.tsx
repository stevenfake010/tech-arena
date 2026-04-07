'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamicImport from 'next/dynamic';
import { Search, ExternalLink, ChevronLeft } from 'lucide-react';
import { useMobile } from '@/lib/hooks/useMobile';

// 动态导入 Lightbox 组件，禁用服务端渲染
const Lightbox = dynamicImport(() => import('@/components/Lightbox'), { ssr: false });

interface DemoLink { title: string; url: string; }
function parseDemoLinks(raw: string | null): DemoLink[] {
  if (!raw) return [];
  if (raw.trim().startsWith('[')) {
    try { return JSON.parse(raw); } catch {}
  }
  return [{ title: '', url: raw }];
}

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
  media_urls: string | string[];
  submitter_name: string;
  submitter_department: string;
  created_at: string;
}

// Fisher-Yates 随机排序算法 - 只在客户端执行
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function GalleryContent() {
  const searchParams = useSearchParams();
  
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemo, setSelectedDemo] = useState<Demo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTrack, setActiveTrack] = useState<'optimizer' | 'builder'>('optimizer');
  
  // Lightbox 状态
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  // Mobile list/detail 切换
  const isMobile = useMobile();
  const [showDetail, setShowDetail] = useState(false);
  
  // 从 URL 读取参数
  const demoIdFromUrl = searchParams.get('demo');
  const queryFromUrl  = searchParams.get('q');
  
  // 标记客户端挂载
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 搜索防抖 - 300ms 延迟
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 获取数据 - 只在客户端执行，避免 hydration mismatch
  useEffect(() => {
    fetch('/api/demos')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch');
        return r.json();
      })
      .then((data: { demos?: Demo[] }) => {
        const demosList = shuffleArray(data.demos || []);
        setDemos(demosList);

        // 设置初始选中项
        if (demoIdFromUrl) {
          // ?demo=<id> 直接打开
          const demoId = parseInt(demoIdFromUrl);
          const foundDemo = demosList.find((d: Demo) => d.id === demoId);
          if (foundDemo) {
            setSelectedDemo(foundDemo);
            setActiveTrack(foundDemo.track);
          } else {
            setSelectedDemo(demosList[0] || null);
            setActiveTrack(demosList[0]?.track || 'optimizer');
          }
        } else if (queryFromUrl) {
          // ?q=<name> 搜索并自动选中第一个匹配项
          const q = queryFromUrl.toLowerCase();
          setSearchQuery(queryFromUrl);
          setDebouncedQuery(queryFromUrl);
          // 双向匹配：去除引号后比较，兼容名称中有 "..." 等引号导致的 URL 编码问题
          const stripQuotes = (s: string) => s.replace(/["""'''"']/g, '');
          const qStripped = stripQuotes(q);
          const matched = demosList.find((d: Demo) => {
            const dName = stripQuotes(d.name.toLowerCase());
            return dName.includes(qStripped) || qStripped.includes(dName);
          });
          if (matched) {
            setSelectedDemo(matched);
            setActiveTrack(matched.track);
            if (isMobile) setShowDetail(true);
          } else {
            setSelectedDemo(demosList[0] || null);
            setActiveTrack(demosList[0]?.track || 'optimizer');
          }
        } else {
          setSelectedDemo(demosList[0] || null);
          setActiveTrack(demosList[0]?.track || 'optimizer');
        }
      })
      .catch(err => {
        console.error('Gallery fetch error:', err);
        setDemos([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [demoIdFromUrl, queryFromUrl]);

  const optimizerDemos = demos.filter(d => d.track === 'optimizer');
  const builderDemos = demos.filter(d => d.track === 'builder');

  // 使用 useMemo 缓存过滤结果，避免重复计算
  // 搜索时去掉各类引号再比较，避免 DB 里存 "财报哨兵" 而搜索词为 财报哨兵 时匹配失败
  const nq = (s: string) => s.replace(/["""'''\u2018\u2019\u201c\u201d]/g, '').toLowerCase();

  const filteredOptimizer = useMemo(() => {
    const q = nq(debouncedQuery);
    if (!q) return optimizerDemos;
    return optimizerDemos.filter(d =>
      nq(d.name).includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.submitter1_name.toLowerCase().includes(q) ||
      (d.submitter2_name && d.submitter2_name.toLowerCase().includes(q)) ||
      (d.keywords && d.keywords.toLowerCase().includes(q))
    );
  }, [optimizerDemos, debouncedQuery]);

  const filteredBuilder = useMemo(() => {
    const q = nq(debouncedQuery);
    if (!q) return builderDemos;
    return builderDemos.filter(d =>
      nq(d.name).includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.submitter1_name.toLowerCase().includes(q) ||
      (d.submitter2_name && d.submitter2_name.toLowerCase().includes(q)) ||
      (d.keywords && d.keywords.toLowerCase().includes(q))
    );
  }, [builderDemos, debouncedQuery]);

  const activeList = activeTrack === 'optimizer' ? filteredOptimizer : filteredBuilder;

  const handleSwitchTrack = useCallback((track: 'optimizer' | 'builder') => {
    setActiveTrack(track);
    const list = track === 'optimizer' ? optimizerDemos : builderDemos;
    if (list.length > 0) setSelectedDemo(list[0]);
  }, [optimizerDemos, builderDemos]);

  // 安全解析 media_urls（可能是 JSONB 数组或字符串）
  function parseMediaUrls(mediaUrls: string | string[] | null | undefined): string[] {
    if (!mediaUrls) return [];
    if (Array.isArray(mediaUrls)) return mediaUrls;
    if (typeof mediaUrls === 'string') {
      try {
        const parsed = JSON.parse(mediaUrls);
        return Array.isArray(parsed) ? parsed : [mediaUrls];
      } catch {
        return [mediaUrls];
      }
    }
    return [];
  }
  
  const mediaUrls = parseMediaUrls(selectedDemo?.media_urls);

  // 只在客户端渲染主要内容，避免 hydration mismatch
  if (!isClient || loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-on-surface-variant">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:h-[calc(100vh-60px)]">
      {/* Header */}
      <header className="flex-shrink-0 mb-4 px-4 md:px-12 pt-4 pb-2">
        <div>
          <h2 className="font-headline text-2xl md:text-4xl font-bold tracking-tight text-on-surface">Demo Gallery</h2>
        </div>
      </header>

      {/* Split Pane Layout */}
      <section className="flex flex-col md:flex-row md:flex-1 md:gap-6 md:min-h-0 px-4 md:px-12 pb-4">
        {/* Left Pane: Project List */}
        <div className={`${isMobile && showDetail ? 'hidden' : 'flex'} md:flex w-full md:w-1/3 flex-col md:h-full md:overflow-hidden`}>
          {/* Tab Bar */}
          <div className="flex-shrink-0 flex gap-1 p-1 bg-surface-container-low rounded-t-xl">
            <button
              onClick={() => handleSwitchTrack('optimizer')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-headline text-base font-bold transition-all ${
                activeTrack === 'optimizer'
                  ? 'bg-secondary text-on-secondary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span>⚡</span>
              <span>Optimizer</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-normal ${
                activeTrack === 'optimizer'
                  ? 'bg-on-secondary/20 text-on-secondary'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                {filteredOptimizer.length}
              </span>
            </button>
            <button
              onClick={() => handleSwitchTrack('builder')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-headline text-base font-bold transition-all ${
                activeTrack === 'builder'
                  ? 'bg-tertiary text-on-tertiary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span>🛠️</span>
              <span>Builder</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-normal ${
                activeTrack === 'builder'
                  ? 'bg-on-tertiary/20 text-on-tertiary'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                {filteredBuilder.length}
              </span>
            </button>
          </div>

          {/* Search - inside the container, between tab and list */}
          <div className={`flex-shrink-0 px-2 pt-2 border-x border-outline-variant/20 bg-surface-container-low/50 ${
            activeTrack === 'optimizer' ? 'border-t-2 border-t-secondary/30' : 'border-t-2 border-t-tertiary/30'
          }`}>
            <div className="relative">
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-0 text-sm px-3 py-2 pr-8 rounded-lg transition-all placeholder:text-outline/60"
                placeholder="搜索项目、关键词或薯名..."
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ fontSize: '16px' }}
              />
              <Search size={14} className="absolute right-3 top-2.5 text-outline" />
            </div>
          </div>

          {/* Project List - 独立滚动区域 */}
          <div className="md:flex-1 md:overflow-y-auto custom-scrollbar border-x border-b border-outline-variant/20 rounded-b-xl bg-surface-container-low/50">
            <div>
              {activeList.length === 0 ? (
                <p className="text-center text-on-surface-variant text-sm py-8">暂无项目</p>
              ) : activeList.map(demo => {
                const keywords = demo.keywords
                  ? demo.keywords.split(/[、,，]/).map(kw => kw.trim()).filter(Boolean)
                  : [];
                const visibleKeywords = keywords.slice(0, 3);
                const hiddenCount = keywords.length - visibleKeywords.length;
                const isSelected = selectedDemo?.id === demo.id;
                return (
                  <div key={demo.id} className="border-b border-outline-variant/20 last:border-b-0">
                  <div
                    onClick={() => { setSelectedDemo(demo); if (isMobile) setShowDetail(true); }}
                    className={`p-3 cursor-pointer transition-all group border-l-2 ${
                      isSelected
                        ? activeTrack === 'optimizer'
                          ? 'bg-surface-container-lowest border-secondary'
                          : 'bg-surface-container-lowest border-tertiary'
                        : 'hover:bg-surface-container-high border-transparent'
                    }`}
                  >
                    <div className="mb-2">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`text-base font-headline font-bold leading-tight ${
                          isSelected ? '' : 'group-hover:text-primary'
                        }`}>
                          {demo.name}
                        </h3>
                        <span className="text-xs text-outline flex-shrink-0">
                          {demo.submitter1_name}{demo.submitter2_name ? ` + ${demo.submitter2_name}` : ''}
                        </span>
                      </div>
                      <p className="text-on-surface-variant text-sm line-clamp-1">
                        {demo.summary}
                      </p>
                    </div>
                    {visibleKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {visibleKeywords.map((kw, i) => (
                          <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${
                            activeTrack === 'optimizer'
                              ? 'bg-secondary/10 text-secondary'
                              : 'bg-tertiary/10 text-tertiary'
                          }`}>
                            {kw}
                          </span>
                        ))}
                        {hiddenCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant rounded">
                            +{hiddenCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Pane: Project Detail */}
        <div className={`${isMobile && !showDetail ? 'hidden' : 'flex'} md:flex md:flex-1 bg-surface-container-low rounded-xl flex-col md:h-full md:overflow-hidden border border-outline-variant/10`}>
          {selectedDemo ? (
            <>
              {/* 彩色顶部细线 */}
              <div className={`h-0.5 flex-shrink-0 ${selectedDemo.track === 'optimizer' ? 'bg-secondary' : 'bg-tertiary'}`} />
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
              <div className="px-4 md:px-8 pt-5 pb-4 flex-shrink-0 border-b border-outline-variant/10 bg-surface-container-low">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded ${
                    selectedDemo.track === 'optimizer'
                      ? 'bg-secondary/10 text-secondary'
                      : 'bg-tertiary/10 text-tertiary'
                  }`}>
                    {selectedDemo.track}
                  </span>
                  <span className="text-lg">{selectedDemo.track === 'optimizer' ? '⚡️' : '🛠️'}</span>
                </div>
                <h1 className="text-3xl font-headline font-bold text-on-surface">{selectedDemo.name}</h1>
                <p className="mt-3 text-base text-on-surface-variant leading-relaxed">
                  {selectedDemo.summary}
                </p>
              </div>
              <div className="md:flex-1 md:overflow-y-auto custom-scrollbar px-4 md:px-8 py-6">
                <div className="flex flex-col gap-8">
                  {/* The Story - Why & How */}
                  {(selectedDemo.background || selectedDemo.solution) && (
                    <div className="pb-6 border-b border-outline-variant/20 space-y-6">
                      {selectedDemo.background && (
                        <div>
                          <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-3">Why / 为什么要做</p>
                          <div className="markdown-content">
                            <div dangerouslySetInnerHTML={{ __html: selectedDemo.background }} />
                          </div>
                        </div>
                      )}
                      
                      {selectedDemo.solution && (
                        <div>
                          <p className="text-xs uppercase tracking-widest text-tertiary font-bold mb-3">How / 怎么解决的</p>
                          <div className="markdown-content">
                            <div dangerouslySetInnerHTML={{ __html: selectedDemo.solution }} />
                          </div>
                        </div>
                      )}
                      
                      {selectedDemo.keywords && (
                        <div>
                          <p className="text-xs uppercase tracking-widest text-primary font-bold mb-3">KEY WORDS / 关键词</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedDemo.keywords.split(/[、,，]/).map((kw, i) => (
                              <span key={i} className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                                {kw.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Who's the mastermind */}
                  <div className="pb-6 border-b border-outline-variant/20">
                    <p className="text-xs uppercase tracking-widest text-outline font-bold mb-3">Who's the Mastermind / 负责人</p>
                    <div className="flex items-center gap-2 text-base text-on-surface">
                      <span className="font-semibold">{selectedDemo.submitter1_name}</span>
                      <span className="text-on-surface-variant">({selectedDemo.submitter1_dept})</span>
                      {selectedDemo.submitter2_name && (
                        <>
                          <span className="text-outline">+</span>
                          <span className="font-semibold">{selectedDemo.submitter2_name}</span>
                          <span className="text-on-surface-variant">({selectedDemo.submitter2_dept})</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Show Us the Goods */}
                  <div className="space-y-6">
                    {parseDemoLinks(selectedDemo.demo_link).length > 0 && (
                      <section>
                        <p className="text-xs uppercase tracking-widest text-outline font-bold mb-3">Show Us the Goods / 作品链接</p>
                        <div className="space-y-2">
                          {parseDemoLinks(selectedDemo.demo_link).map((link, i) => (
                            <a
                              key={i}
                              className="inline-flex items-center gap-1.5 text-base font-bold text-primary underline"
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span>{link.title || '链接'}</span>
                              <ExternalLink size={12} />
                            </a>
                          ))}
                        </div>
                      </section>
                    )}
                    {mediaUrls.length > 0 && (
                      <section>
                        <p className="text-xs uppercase tracking-widest text-outline font-bold mb-3">截图</p>
                        <div className="grid grid-cols-2 gap-4">
                          {mediaUrls.map((url: string, i: number) => {
                            const isVideo = url.match(/\.(mp4|mov|webm|avi)$/i);
                            return (
                              <div 
                                key={i} 
                                className="aspect-video bg-surface-container-highest rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  setLightboxIndex(i);
                                  setLightboxOpen(true);
                                }}
                              >
                                {isVideo ? (
                                  <video 
                                    src={url} 
                                    className="w-full h-full object-cover"
                                    preload="none"
                                    poster=""
                                  />
                                ) : (
                                  <img 
                                    src={url} 
                                    alt={`Media ${i + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant overflow-y-auto custom-scrollbar">
              <p>暂无项目，请先提交 Demo</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Lightbox 查看器 */}
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
