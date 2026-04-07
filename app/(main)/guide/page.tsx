'use client';

import { OPTIMIZER_ORDER, BUILDER_ORDER } from '@/lib/demo-order';
import Link from 'next/link';

type OrderItem =
  | { type: 'regular'; index: number; name: string; submitter: string }
  | { type: 'cross'; name: string; submitter: string };

// 项目名称到提交人信息的映射（根据海选结果真实数据）
const SUBMITTER_MAP: Record<string, string> = {
  // Optimizer 正赛项目（前15名）
  '搜索掘金searchinsights': '北星（社区战略组）',
  'AI Daily Digest': '宗棠（技术战略组）',
  '投研助手-电子小林虾': '小林（战略研究中台）',
  '财报哨兵': '罗尼（战略研究中台）',
  '用户onepage制作': '奇爱（用户研究二组）',
  'Podcast brief': '甘雨（技术战略组）',
  'AI dashboard': '白野（战略研究中台）',
  'AI research thinking partner': '观澜（技术战略组）',
  '再也不想打开dayQ了': '牧真（技术战略组）',
  '小红书上的男人在做什么': '黄风（社区战略组）',
  '问卷审核Skill': '登登（用户研究二组）',
  '用研知识库LR': '世良（用户研究二组）',
  '小鹿AI': '鹿鸣（科技投资）',
  '抖音新星捕捞器': '黄风（社区战略组）',
  '问卷数据处理': '樱桃（用户研究一组）',
  // Optimizer 校招展示（已移除）
  // Optimizer 跨组展示 (DI优秀项目展示)
  '赛博秘书': '阿席（技术战略组）',
  '赛博秘书- 让Agent帮你管理任务': '阿席（技术战略组）',
  'AB实验分析AI化': '亚克（平台分析组）',
  '电商治理分析AI化': '秉义（交易分析二组）',
  'Mio 广告AI诊断': '明玉（商业分析二组）',
  
  // Builder 正赛项目（前15名）
  'Expeditions | Your travel stories': '初一（社区战略组）+也英（社区战略组）',
  'Pensieve : Your Exclusive biographer': '阿瑟（社区战略组）+高斯（社区战略组）',
  '三张地图': '维勒（用户研究一组）+阿列（用户研究一组）',
  'AI Demo Day网站': '恒宇（社区战略组）+阿瑟（社区战略组）',
  '展览体温计 — 看展的真实评价，一眼可见': '璃茉（hi lab战略组）',
  'Project Spark': '也英（社区战略组）+杰特（社区战略组）',
  'Project Lumière': '莉露（用户研究一组）+米法（用户研究一组）',
  'ootd': '阿亚（用户研究二组）+龙树（战略研究中台）',
  '麻将"作弊"器': '一鹏（科技投资）',
  '智能体笔记——小红书的第四种内容形式': '二千（用户研究一组）',
  'Soul Mirror': '七里（社区战略组）+阿瑟（社区战略组）',
  '魔法薯': '优午（用户研究二组）+奇爱（用户研究二组）',
  '为你私藏的微光「角落」': '艾博（hi lab战略组）',
  '懂你的好物推荐卡': '拾七（交易战略组）',
  'Notes2Skill': '阿席（技术战略组）',
  '土拨鼠信箱 — 把话埋进土里，等它长出花来': '璃茉（hi lab战略组）',
  // Builder 校招展示（已移除）
  // Builder 跨组展示 (财务投资优秀项目展示)
  '星盘': '宫二（增长采购组）',
  'Org Snowball': '菲雅（投资研究）',
  'People Finder': '灵筠（投资研究）',
};

function getSubmitter(name: string): string {
  if (SUBMITTER_MAP[name]) return SUBMITTER_MAP[name];
  // 部分匹配
  for (const [key, value] of Object.entries(SUBMITTER_MAP)) {
    if (name.includes(key) || key.includes(name)) return value;
  }
  return '';
}

function makeOrder(names: string[]): OrderItem[] {
  const items: OrderItem[] = [];
  for (let i = 0; i < 15; i++) {
    items.push({ 
      type: 'regular', 
      index: i + 1, 
      name: names[i] ?? '待公示',
      submitter: getSubmitter(names[i] ?? '')
    });
  }
  // 校招生特别展示已移除
  for (let i = 15; i <= 17; i++) {
    items.push({ 
      type: 'cross', 
      name: names[i] ?? '待公示',
      submitter: getSubmitter(names[i] ?? '')
    });
  }
  return items;
}

const optimizerOrder = makeOrder(OPTIMIZER_ORDER);
const builderOrder   = makeOrder(BUILDER_ORDER);
export default function GuidePage() {
  const timeline = [
    { date: '3月26日', day: '周四', time: '12:00', title: '报名通道开启', highlight: false },
    { date: '3月30日', day: '周一', time: '12:00', title: '报名截止', highlight: true },
    { date: '3月31日', day: '周二', time: '20:00', title: '入选项目公示', highlight: false },
    { date: '4月01日', day: '周三', time: '13:30', title: 'The Show is ON', highlight: true },
  ];

  const agenda = [
    { time: '13:30 – 13:45', title: '开场白', title2: '& 规则介绍', sub1: null, sub2: null, track: null },
    { time: '13:45 – 16:15', title: 'Optimizer', title2: '赛道路演', sub1: '项目展演、投票、评委点评', sub2: null, track: 'optimizer' },
    { time: '16:15 – 16:30', title: '茶歇', title2: null, sub1: null, sub2: null, track: null },
    { time: '16:30 – 19:00', title: 'Builder', title2: '赛道路演', sub1: '项目展演、投票、评委点评', sub2: null, track: 'builder' },
    { time: '19:00 – 19:10', title: '茶歇', title2: null, sub1: null, sub2: null, track: null },
    { time: '19:10 – 19:45', title: '颁奖典礼', title2: '评委点评、结语', sub1: null, sub2: null, track: null },
  ];

  function openSubmit(track: 'optimizer' | 'builder') {
    window.dispatchEvent(new CustomEvent('openSubmit', { detail: { track } }));
  }

  return (
    <div className="px-4 md:px-10 pt-4 pb-16 max-w-5xl">

      {/* ── Header ── */}
      <header className="mb-8 pb-2">
        <h2 className="font-headline text-2xl md:text-4xl font-bold text-on-surface">Evolution: AI Demo Day</h2>
      </header>

      {/* ── 活动背景 ── */}
      <section className="mb-12">
        <SectionTitle>活动背景</SectionTitle>
        <p className="text-base text-on-surface-variant leading-relaxed">
          第一届小红书战略/投资/用户研究 AI Demo Day 正式开启；AI 时代已经到来——这里是展示你用 AI 做了什么的舞台。
        </p>
      </section>

      {/* ── 赛道选择 ── */}
      <section className="mb-12">
        <SectionTitle>选择你的赛道</SectionTitle>
        <p className="text-base text-on-surface-variant mb-5">
          每人不限制赛道数量、不限制提交 Demo 数量，欢迎大家踊跃提交。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Optimizer */}
          <button
            onClick={() => openSubmit('optimizer')}
            className="group text-left rounded-xl bg-surface-container-low border-x border-b border-outline-variant/15 border-t-[3px] border-t-secondary hover:shadow-md transition-all"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <span className="font-headline text-xl font-bold text-on-surface">Optimizer</span>
                </div>
                <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full">个人参赛</span>
              </div>
              <div className="space-y-2 mb-3">
                <div>
                  <span className="text-xs font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">原则</span>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">重构工作流，极致提高效率，用 AI 把自己武装成全能战士</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">实现形式</span>
                  <p className="text-sm text-on-surface-variant mt-1">AI Skills、AI Workflow 等</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary group-hover:gap-3 transition-all duration-200">
                立即报名 →
              </span>
            </div>
          </button>

          {/* Builder */}
          <button
            onClick={() => openSubmit('builder')}
            className="group text-left rounded-xl bg-surface-container-low border-x border-b border-outline-variant/15 border-t-[3px] border-t-tertiary hover:shadow-md transition-all"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛠️</span>
                  <span className="font-headline text-xl font-bold text-on-surface">Builder</span>
                </div>
                <span className="text-xs font-semibold text-tertiary bg-tertiary/10 px-2.5 py-1 rounded-full">≤ 2 人</span>
              </div>
              <div className="space-y-2 mb-3">
                <div>
                  <span className="text-xs font-bold text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded">原则</span>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">设计一个小红书功能，或是有小红书 DNA 的有趣独立产品</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded">实现形式</span>
                  <p className="text-sm text-on-surface-variant mt-1">产品 Demo/概念，或可以落地的产品</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-tertiary group-hover:gap-3 transition-all duration-200">
                立即报名 →
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* ── Demo Day日程 ── */}
      <section className="mb-12">
        <SectionTitle>Demo Day日程</SectionTitle>

        {/* 地点 + 规则 + 奖项 信息条 */}
        <div className="text-sm text-on-surface-variant mb-4 space-y-1">
          <p>📍 上海：LuOne 30F · 复兴中路</p>
          <p>📍 北京：中海国际大厦 B座 12AF · B12AH03</p>
        </div>

        {/* 横向议程卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {agenda.map((item, i) => (
            <div
              key={i}
              className={`rounded-xl border overflow-hidden ${
                item.track === 'optimizer' ? 'border-secondary/25 bg-secondary/5' :
                item.track === 'builder' ? 'border-tertiary/25 bg-tertiary/5' :
                'border-outline-variant/15 bg-surface-container-low'
              }`}
            >
              <div className={`h-0.5 ${
                item.track === 'optimizer' ? 'bg-secondary' :
                item.track === 'builder' ? 'bg-tertiary' : 'bg-transparent'
              }`} />
              <div className="p-4">
                <p className={`text-xs font-mono font-bold mb-2 ${
                  item.track === 'optimizer' ? 'text-secondary/70' :
                  item.track === 'builder' ? 'text-tertiary/70' : 'text-outline/60'
                }`}>
                  {item.time}
                </p>
                <p className="text-sm font-semibold text-on-surface leading-snug">
                  {item.title}
                  {item.title2 && <><br />{item.title2}</>}
                </p>
                {item.sub1 && (
                  <p className="text-xs text-on-surface-variant/60 mt-1.5 leading-relaxed">
                    {item.sub1}{item.sub2 && <><br />{item.sub2}</>}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 路演规则 ── */}
      <section className="mb-12">
        <SectionTitle>路演规则</SectionTitle>
        <p className="text-sm text-on-surface-variant mb-4">
          每个 Demo <span className="font-semibold text-on-surface">5 分钟展演 + 2 分钟 QA</span>
        </p>
        <div className="space-y-3 mb-6">
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low px-5 py-4">
            <p className="text-sm font-bold text-on-surface mb-1.5">5 分钟展演</p>
            <p className="text-sm text-on-surface-variant leading-relaxed">会严格控制时间，请提前排练好展示，并调试好投屏</p>
          </div>
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low px-5 py-4">
            <p className="text-sm font-bold text-on-surface mb-1.5">2 分钟 QA</p>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-3">
              每个项目 1 个观众问题 + 1 个评委问题；观众问题请提前在提问广场提问，主持人会在提问广场选择问题
            </p>
            <Link
              href="/square"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              💬 去提问广场提问 →
            </Link>
          </div>
        </div>
        <p className="text-sm text-on-surface-variant mb-4">
          以下为<span className="font-semibold text-on-surface">当天路演出场顺序</span>，顺序随机，不分先后
        </p>

        {(() => {
          const tracks = [
            { key: 'optimizer', icon: '⚡', label: 'Optimizer 赛道', color: 'secondary' as const, items: optimizerOrder, crossLabel: 'DI优秀项目展示' },
            { key: 'builder',   icon: '🛠️', label: 'Builder 赛道',   color: 'tertiary'  as const, items: builderOrder,   crossLabel: '财务投资优秀项目展示' },
          ];

          function renderItem(item: OrderItem, color: 'secondary' | 'tertiary', crossLabel: string, isLast: boolean) {
            const isSpecial = item.type !== 'regular';
            const sideBorder = color === 'secondary' ? 'border-x border-secondary/[0.12]' : 'border-x border-tertiary/[0.12]';
            const btmBorder  = color === 'secondary' ? 'border-b border-secondary/[0.12]'  : 'border-b border-tertiary/[0.12]';
            const rowLine    = !isLast ? 'border-b border-outline-variant/[0.08]' : btmBorder;
            const rounded    = isLast ? 'rounded-b-xl' : '';
            const base = `flex items-center gap-3 px-4 py-2.5 bg-surface-container-low ${sideBorder} ${rowLine} ${rounded}`;

            const badge = item.type === 'regular'
              ? <span className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md text-xs font-bold tabular-nums ${color === 'secondary' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>{item.index}</span>
              : <span className="flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded bg-outline/10 text-on-surface-variant whitespace-nowrap">跨组</span>;

            if (item.name === '待公示') {
              return (
                <div className={base}>
                  {badge}
                  <span className="text-sm flex-1 min-w-0 text-outline/40 italic truncate">待公示</span>
                </div>
              );
            }
            // DI/投研优秀项目展示（跨组项目）不设置 gallery 链接
            const isCrossGroup = item.type === 'cross';
            const trackColor = color === 'secondary';
            return (
              <div className={base}>
                {badge}
                <div className="flex-1 min-w-0 overflow-hidden">
                  {isCrossGroup ? (
                    <span className="text-sm block text-on-surface font-medium truncate">{item.name}</span>
                  ) : (
                    <Link
                      href={`/gallery?q=${encodeURIComponent(item.name)}`}
                      className="text-sm block text-on-surface font-medium truncate hover:text-primary hover:underline transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.submitter && (
                      <span className="text-xs text-on-surface-variant/60 truncate">{item.submitter}</span>
                    )}
                    {isCrossGroup && (
                      <span className="text-xs text-on-surface-variant/35 flex-shrink-0">{crossLabel}</span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/square?demo=${encodeURIComponent(item.name)}`}
                  className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                    trackColor
                      ? 'text-secondary bg-secondary/8 hover:bg-secondary/15 active:bg-secondary/20'
                      : 'text-tertiary bg-tertiary/8 hover:bg-tertiary/15 active:bg-tertiary/20'
                  }`}
                >
                  提问
                </Link>
              </div>
            );
          }

          return (
            <>
              {/* ── 手机：上下堆叠 ── */}
              <div className="md:hidden space-y-4">
                {tracks.map(({ key, icon, label, color, items, crossLabel }) => (
                  <div key={key}>
                    <div className={`rounded-t-xl px-5 py-3.5 flex items-center gap-2 ${color === 'secondary' ? 'bg-secondary text-on-secondary' : 'bg-tertiary text-on-tertiary'}`}>
                      <span className="text-base">{icon}</span>
                      <span className="font-headline font-bold text-base">{label}</span>
                    </div>
                    {items.map((item, idx) => (
                      <div key={idx}>{renderItem(item, color, crossLabel, idx === items.length - 1)}</div>
                    ))}
                  </div>
                ))}
              </div>

              {/* ── 桌面：双列交错 ── */}
              <div className="hidden md:grid grid-cols-2 gap-x-5">
                {/* 列头 */}
                {tracks.map(({ key, icon, label, color }) => (
                  <div key={key} className={`rounded-t-xl px-5 py-3.5 flex items-center gap-2 ${color === 'secondary' ? 'bg-secondary text-on-secondary' : 'bg-tertiary text-on-tertiary'}`}>
                    <span className="text-base">{icon}</span>
                    <span className="font-headline font-bold text-base">{label}</span>
                  </div>
                ))}
                {/* 交错行 */}
                {optimizerOrder.map((optItem, idx) => {
                  const bldItem = builderOrder[idx];
                  const isLast = idx === optimizerOrder.length - 1;
                  return [
                    <div key={`o-${idx}`}>{renderItem(optItem, 'secondary', 'DI优秀项目展示', isLast)}</div>,
                    <div key={`b-${idx}`}>{renderItem(bldItem, 'tertiary', '财务投资优秀项目展示', isLast)}</div>,
                  ];
                })}
              </div>
            </>
          );
        })()}
      </section>


      {/* ── 时间线（横向）── */}
      <section className="mb-12">
        <SectionTitle>时间线</SectionTitle>
        <div className="mb-8" />
        <div className="relative flex flex-col md:flex-row">
          <div
            className="absolute top-[9px] h-px bg-outline-variant/30 hidden md:block"
            style={{ left: 'calc(12.5%)', right: 'calc(12.5%)' }}
          />
          <div className="absolute left-[8px] top-0 bottom-0 w-px bg-outline-variant/30 md:hidden" />
          {timeline.map((item, i) => (
            <div key={i} className="flex-1 flex flex-row md:flex-col items-center md:items-center gap-3 md:gap-0 py-2 md:py-0">
              <div className={`w-[18px] h-[18px] rounded-full border-2 relative z-10 mb-0 md:mb-4 flex-shrink-0 ${
                item.highlight
                  ? 'bg-secondary border-secondary shadow-sm shadow-secondary/30'
                  : 'bg-surface border-outline-variant/50'
              }`} />
              <div className="text-left md:text-center px-1">
                <p className={`text-sm font-semibold leading-snug mb-1 ${item.highlight ? 'text-secondary' : 'text-on-surface'}`}>
                  {item.title}
                </p>
                <p className="text-xs text-on-surface-variant">{item.date} {item.day}</p>
                <p className={`text-xs font-mono ${item.highlight ? 'text-secondary/80' : 'text-on-surface-variant/50'}`}>
                  @ {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <p className="text-sm text-on-surface-variant/40 italic pt-6 border-t border-outline-variant/15">
        Stop talking, start shipping. · We move fast. Evolution waits for no one. · Don't just adapt. Evolve.
      </p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-headline text-2xl font-bold text-on-surface mb-5 flex items-center gap-3">
      <span className="w-1 h-6 rounded-full bg-secondary flex-shrink-0" />
      {children}
    </h2>
  );
}
