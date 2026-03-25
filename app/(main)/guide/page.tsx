'use client';

export default function GuidePage() {
  const timeline = [
    { date: '3月26日', day: '周四', time: '12:00', title: '报名通道开启', highlight: false },
    { date: '3月30日', day: '周一', time: '12:00', title: '报名截止', highlight: true },
    { date: '3月31日', day: '周二', time: '20:00', title: '入选项目公示', highlight: false },
    { date: '4月01日', day: '周三', time: '13:30', title: 'The Show is ON', highlight: true },
  ];

  const agenda = [
    { time: '13:30 – 13:45', title: '开场白', title2: '& 规则介绍', sub1: null, sub2: null, track: null },
    { time: '13:45 起', title: 'Optimizer', title2: '赛道路演', sub1: '约 2–2.5 小时', sub2: '10–15 个项目', track: 'optimizer' },
    { time: '中场', title: '茶歇', title2: null, sub1: null, sub2: null, track: null },
    { time: '接续', title: 'Builder', title2: '赛道路演', sub1: '约 2–2.5 小时', sub2: '10–15 个项目', track: 'builder' },
    { time: '18:45–19:00', title: '结语', title2: '& 评奖', sub1: null, sub2: null, track: null },
  ];

  function openSubmit(track: 'optimizer' | 'builder') {
    window.dispatchEvent(new CustomEvent('openSubmit', { detail: { track } }));
  }

  return (
    <div className="px-10 pt-8 pb-16 max-w-5xl">

      {/* ── Header ── */}
      <header className="mb-12 pb-8 border-b border-outline-variant/20">
        <h1 className="font-headline text-4xl font-bold text-on-surface leading-tight">
          Evolution: AI Demo Day
        </h1>
      </header>

      {/* ── 活动背景 ── */}
      <section className="mb-12">
        <SectionTitle>活动背景</SectionTitle>
        <p className="text-base text-on-surface-variant leading-relaxed">
          第一届小红书战略/投资/用户研究 AI Demo Day 正式开启。<br />
          AI 时代已经到来——这里是展示你用 AI 做了什么的舞台。
        </p>
      </section>

      {/* ── 赛道选择 ── */}
      <section className="mb-12">
        <SectionTitle>选择你的赛道</SectionTitle>
        <p className="text-base text-on-surface-variant mb-5">
          每人不限制赛道数量、不限制提交 Demo 数量，欢迎大家踊跃提交
        </p>
        <div className="grid grid-cols-2 gap-4">

          {/* Optimizer */}
          <button
            onClick={() => openSubmit('optimizer')}
            className="group text-left rounded-xl bg-surface-container-low border-x border-b border-outline-variant/15 border-t-[3px] border-t-secondary hover:shadow-md transition-all"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <span className="font-headline text-xl font-bold text-on-surface">Optimizer</span>
                </div>
                <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full">个人参赛</span>
              </div>
              <div className="space-y-3 mb-5">
                <div>
                  <span className="text-xs font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">原则</span>
                  <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">重构工作流，极致提高效率，用 AI 把自己武装成全能战士</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">实现形式</span>
                  <p className="text-sm text-on-surface-variant mt-1.5">AI Skills、AI Workflow 等</p>
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
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛠️</span>
                  <span className="font-headline text-xl font-bold text-on-surface">Builder</span>
                </div>
                <span className="text-xs font-semibold text-tertiary bg-tertiary/10 px-2.5 py-1 rounded-full">≤ 2 人</span>
              </div>
              <div className="space-y-3 mb-5">
                <div>
                  <span className="text-xs font-bold text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded">原则</span>
                  <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">设计一个小红书功能，或是有小红书 DNA 的有趣独立产品</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded">实现形式</span>
                  <p className="text-sm text-on-surface-variant mt-1.5">产品 Demo/概念，或可以落地的产品</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-tertiary group-hover:gap-3 transition-all duration-200">
                立即报名 →
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* ── 时间线（横向）── */}
      <section className="mb-12">
        <SectionTitle>时间线</SectionTitle>
        <div className="mb-8" />
        <div className="relative flex">
          <div
            className="absolute top-[9px] h-px bg-outline-variant/30"
            style={{ left: 'calc(12.5%)', right: 'calc(12.5%)' }}
          />
          {timeline.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className={`w-[18px] h-[18px] rounded-full border-2 relative z-10 mb-4 flex-shrink-0 ${
                item.highlight
                  ? 'bg-secondary border-secondary shadow-sm shadow-secondary/30'
                  : 'bg-surface border-outline-variant/50'
              }`} />
              <div className="text-center px-1">
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

      {/* ── 当天议程 ── */}
      <section className="mb-12">
        <SectionTitle>当天议程</SectionTitle>

        {/* 地点 + 规则 + 奖项 信息条 */}
        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low divide-x divide-outline-variant/15 flex mb-4 overflow-hidden">
          <div className="flex-1 px-5 py-4">
            <p className="text-xs font-bold text-outline/60 uppercase tracking-wider mb-2">地点</p>
            <p className="text-sm text-on-surface font-medium leading-relaxed">
              上海 LuOne · 35F 西郊<br />
              北京中海国际大厦 B座12AF-B12AH03
            </p>
          </div>
          <div className="flex-1 px-5 py-4">
            <p className="text-xs font-bold text-outline/60 uppercase tracking-wider mb-2">路演规则</p>
            <p className="text-sm text-on-surface font-medium">8 分钟展演 + 2 分钟 QA</p>
          </div>
          <div className="flex-1 px-5 py-4">
            <p className="text-xs font-bold text-outline/60 uppercase tracking-wider mb-2">奖项设置</p>
            <p className="text-sm text-on-surface font-medium">每赛道评选前 3 名，另设 3 个整体专项奖</p>
          </div>
        </div>

        {/* 横向议程卡片 */}
        <div className="grid grid-cols-5 gap-3">
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
                    {item.sub1}<br />{item.sub2}
                  </p>
                )}
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
