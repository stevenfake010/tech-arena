'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, ExternalLink } from 'lucide-react';

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

export default function GalleryPage() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [selectedDemo, setSelectedDemo] = useState<Demo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [optimizerExpanded, setOptimizerExpanded] = useState(true);
  const [builderExpanded, setBuilderExpanded] = useState(true);

  useEffect(() => {
    fetch('/api/demos')
      .then(r => r.json())
      .then(data => {
        setDemos(data.demos || []);
        if (data.demos?.length > 0) {
          setSelectedDemo(data.demos[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const optimizerDemos = demos.filter(d => d.track === 'optimizer');
  const builderDemos = demos.filter(d => d.track === 'builder');

  const filteredOptimizer = optimizerDemos.filter(d => {
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.submitter1_name.toLowerCase().includes(q) ||
      (d.submitter2_name && d.submitter2_name.toLowerCase().includes(q)) ||
      (d.keywords && d.keywords.toLowerCase().includes(q))
    );
  });
  const filteredBuilder = builderDemos.filter(d => {
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.submitter1_name.toLowerCase().includes(q) ||
      (d.submitter2_name && d.submitter2_name.toLowerCase().includes(q)) ||
      (d.keywords && d.keywords.toLowerCase().includes(q))
    );
  });

  // 安全解析 media_urls（可能是 JSONB 数组或字符串）
  function parseMediaUrls(mediaUrls: string | string[] | null | undefined): string[] {
    if (!mediaUrls) return [];
    if (Array.isArray(mediaUrls)) return mediaUrls;
    if (typeof mediaUrls === 'string') {
      try {
        const parsed = JSON.parse(mediaUrls);
        return Array.isArray(parsed) ? parsed : [mediaUrls];
      } catch {
        // 如果不是 JSON，可能是单个 URL 字符串
        return [mediaUrls];
      }
    }
    return [];
  }
  
  const mediaUrls = parseMediaUrls(selectedDemo?.media_urls);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-on-surface-variant">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <header className="flex-shrink-0 mb-4 px-12 pt-4 pb-2">
        <div>
          <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">Demo Gallery</h2>
        </div>
      </header>

      {/* Split Pane Layout - 独立滚动 */}
      <section className="flex-1 flex gap-6 min-h-0 px-12 pb-12">
        {/* Left Pane: Project List - 独立滚动 */}
        <div className="w-1/3 flex flex-col h-full overflow-hidden">
          {/* Search */}
          <div className="relative mb-4 flex-shrink-0">
            <input
              className="w-full bg-surface-container-low border-none border-b border-outline/30 focus:ring-0 focus:border-primary text-sm px-4 py-3 rounded-lg transition-all"
              placeholder="搜索项目、关键词或薯名..."
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search size={16} className="absolute right-3 top-3 text-outline" />
          </div>

          {/* Project List - 独立滚动区域 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 border border-outline-variant/10 rounded-lg bg-surface-container-low/30">
            {/* Optimizer Section */}
            <div className="border-b border-outline-variant/30">
              {/* 吸顶标题栏 */}
              <button
                className="sticky top-0 z-10 flex items-center justify-between w-full py-3 px-4 cursor-pointer group bg-surface-container-low/95 backdrop-blur-sm border-b border-outline-variant/20"
                onClick={() => setOptimizerExpanded(!optimizerExpanded)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-0.5 h-4 rounded-full bg-secondary flex-shrink-0" />
                  <span className="text-secondary text-sm">⚡️</span>
                  <span className="font-headline text-base font-bold text-on-surface">
                    Optimizer
                  </span>
                  <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                    {filteredOptimizer.length}
                  </span>
                </div>
                <ChevronDown size={18} className={`text-outline transition-transform duration-300 ${optimizerExpanded ? '' : '-rotate-90'}`} />
              </button>
              {optimizerExpanded && (
                <div className="space-y-1.5 p-2">
                  {filteredOptimizer.map(demo => (
                    <div
                      key={demo.id}
                      onClick={() => setSelectedDemo(demo)}
                      className={`p-3 rounded-lg cursor-pointer transition-all group ${
                        selectedDemo?.id === demo.id
                          ? 'bg-surface-container-lowest shadow-sm border-l-2 border-secondary'
                          : 'bg-surface-container-low hover:bg-surface-container-high'
                      }`}
                    >
                      {/* 标题和简介 */}
                      <div className="mb-2">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`text-base font-headline font-bold leading-tight ${
                            selectedDemo?.id === demo.id ? '' : 'group-hover:text-primary'
                          }`}>
                            {demo.name}
                          </h3>
                          <span className="text-xs text-outline flex-shrink-0">
                            {demo.submitter1_name}
                          </span>
                        </div>
                        <p className="text-on-surface-variant text-sm line-clamp-1">
                          {demo.summary}
                        </p>
                      </div>
                      
                      {/* 关键词 - 单独一行 */}
                      {demo.keywords && (() => {
                        const keywords = demo.keywords.split(/[、,，]/).map(kw => kw.trim()).filter(Boolean);
                        const visibleKeywords = keywords.slice(0, 3);
                        const hiddenCount = keywords.length - visibleKeywords.length;
                        return (
                          <div className="flex flex-wrap gap-1">
                            {visibleKeywords.map((kw, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-secondary/10 text-secondary rounded">
                                {kw}
                              </span>
                            ))}
                            {hiddenCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant rounded">
                                +{hiddenCount}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Builder Section */}
            <div className="border-b border-outline-variant/30">
              {/* 吸顶标题栏 */}
              <button
                className="sticky top-0 z-10 flex items-center justify-between w-full py-3 px-4 cursor-pointer group bg-surface-container-low/95 backdrop-blur-sm border-b border-outline-variant/20"
                onClick={() => setBuilderExpanded(!builderExpanded)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-0.5 h-4 rounded-full bg-tertiary flex-shrink-0" />
                  <span className="text-tertiary text-sm">🛠️</span>
                  <span className="font-headline text-base font-bold text-on-surface">
                    Builder
                  </span>
                  <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                    {filteredBuilder.length}
                  </span>
                </div>
                <ChevronDown size={18} className={`text-outline transition-transform duration-300 ${builderExpanded ? '' : '-rotate-90'}`} />
              </button>
              {builderExpanded && (
                <div className="space-y-1.5 p-2">
                  {filteredBuilder.map(demo => (
                    <div
                      key={demo.id}
                      onClick={() => setSelectedDemo(demo)}
                      className={`p-3 rounded-lg cursor-pointer transition-all group ${
                        selectedDemo?.id === demo.id
                          ? 'bg-surface-container-lowest shadow-sm border-l-2 border-tertiary'
                          : 'bg-surface-container-low hover:bg-surface-container-high'
                      }`}
                    >
                      {/* 标题和简介 */}
                      <div className="mb-2">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`text-base font-headline font-bold leading-tight ${
                            selectedDemo?.id === demo.id ? '' : 'group-hover:text-primary'
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
                      
                      {/* 关键词 - 单独一行 */}
                      {demo.keywords && (() => {
                        const keywords = demo.keywords.split(/[、,，]/).map(kw => kw.trim()).filter(Boolean);
                        const visibleKeywords = keywords.slice(0, 3);
                        const hiddenCount = keywords.length - visibleKeywords.length;
                        return (
                          <div className="flex flex-wrap gap-1">
                            {visibleKeywords.map((kw, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-tertiary/10 text-tertiary rounded">
                                {kw}
                              </span>
                            ))}
                            {hiddenCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant rounded">
                                +{hiddenCount}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Pane: Project Detail - 独立滚动 */}
        <div className="flex-1 bg-surface-container-low rounded-xl flex flex-col h-full overflow-hidden border border-outline-variant/10">
          {selectedDemo ? (
            <>
              {/* 彩色顶部细线，按赛道区分 */}
              <div className={`h-0.5 flex-shrink-0 ${selectedDemo.track === 'optimizer' ? 'bg-secondary' : 'bg-tertiary'}`} />
              <div className="px-8 pt-5 pb-4 flex-shrink-0 border-b border-outline-variant/10 bg-surface-container-low">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded ${
                    selectedDemo.track === 'optimizer'
                      ? 'bg-secondary/10 text-secondary'
                      : 'bg-tertiary/10 text-tertiary'
                  }`}>
                    {selectedDemo.track}
                  </span>
                  {selectedDemo.track === 'optimizer' ? (
                    <span className="text-secondary text-lg">⚡️</span>
                  ) : (
                    <span className="text-tertiary text-lg">🛠️</span>
                  )}
                </div>
                <h1 className="text-3xl font-headline font-bold text-on-surface">{selectedDemo.name}</h1>
                {/* One-Line Pitch 移到标题下方 */}
                <p className="mt-3 text-base text-on-surface-variant leading-relaxed">
                  {selectedDemo.summary}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6">
                <div className="flex flex-col gap-8">
                  {/* 4. The Story - Why & How */}
                  {(selectedDemo.background || selectedDemo.solution) && (
                    <div className="pb-6 border-b border-outline-variant/20 space-y-6">
                      {/* Why */}
                      {selectedDemo.background && (
                        <div>
                          <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-3">Why / 为什么要做</p>
                          <p className="text-on-surface-variant leading-relaxed text-base">
                            {selectedDemo.background}
                          </p>
                        </div>
                      )}
                      
                      {/* How */}
                      {selectedDemo.solution && (
                        <div>
                          <p className="text-xs uppercase tracking-widest text-tertiary font-bold mb-3">How / 怎么解决的</p>
                          <p className="text-on-surface-variant leading-relaxed text-base">
                            {selectedDemo.solution}
                          </p>
                        </div>
                      )}
                      
                      {/* Keywords */}
                      {selectedDemo.keywords && (
                        <div>
                          <p className="text-xs uppercase tracking-widest text-primary font-bold mb-3">关键词 / Skills</p>
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

                  {/* 2. Who's the mastermind */}
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

                  {/* 5. Show Us the Goods */}
                  <div className="space-y-6">
                    {selectedDemo.demo_link && (
                      <section>
                        <p className="text-xs uppercase tracking-widest text-outline font-bold mb-3">Show Us the Goods / 作品链接</p>
                        <a 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-primary font-medium text-sm transition-colors"
                          href={selectedDemo.demo_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink size={16} />
                          <span>查看演示</span>
                        </a>
                      </section>
                    )}
                    {mediaUrls.length > 0 && (
                      <section>
                        <p className="text-xs uppercase tracking-widest text-outline font-bold mb-3">截图/录屏</p>
                        <div className="grid grid-cols-2 gap-4">
                          {mediaUrls.map((url: string, i: number) => {
                            const isVideo = url.match(/\.(mp4|mov|webm|avi)$/i);
                            return (
                              <div key={i} className="aspect-video bg-surface-container-highest rounded-lg overflow-hidden">
                                {isVideo ? (
                                  <video 
                                    src={url} 
                                    controls
                                    className="w-full h-full object-contain bg-black"
                                    preload="metadata"
                                  />
                                ) : (
                                  <img 
                                    src={url} 
                                    alt={`Media ${i + 1}`}
                                    className="w-full h-full object-cover"
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
    </div>
  );
}
