'use client';

export default function GuidePage() {
  const timeline = [
    { date: '3月26日 周四', time: '12:00', title: '报名通道开启' },
    { date: '3月30日 周一', time: '12:00', title: '报名通道关闭', highlight: true },
    { date: '3月31日 周二', time: '20:00', title: '入选项目公示' },
    { date: '4月01日 周三', time: '13:30', title: 'The show is ON', highlight: true },
  ];

  const agenda = [
    { time: '13:30 – 13:45', title: '开场白 & 规则介绍' },
    { time: '13:45 起', title: 'Optimizer 赛道路演', sub: '约 2–2.5 小时 · 10–15 个项目' },
    { time: '中场', title: '茶歇' },
    { time: '接续', title: 'Builder 赛道路演', sub: '约 2–2.5 小时 · 10–15 个项目' },
    { time: '最后 15 分钟', title: '结语 & 评奖' },
  ];

  return (
    <div className="px-8 pt-8 pb-16 max-w-5xl">

      {/* ── Header（全宽） ──────────────────────── */}
      <header className="mb-10 pb-8 border-b border-outline-variant/20">
        <h1 className="font-headline text-4xl font-bold text-on-surface leading-tight mb-2">
          Evolution: AI Demo Day
        </h1>
        <p className="text-base text-on-surface-variant italic mb-4">Stop talking, start shipping.</p>
        <span className="inline-flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          4月1日（周三）13:30 · 线下活动
        </span>
      </header>

      {/* ── 两列主体 ───────────────────────────── */}
      <div className="grid grid-cols-[3fr_2fr] gap-10 items-start">

        {/* 左列：背景 + 赛道 */}
        <div className="space-y-12">

          {/* 活动背景 */}
          <section>
            <SectionTitle>活动背景</SectionTitle>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              第一届小红书战略/投资/用户研究 AI Demo Day 正式开启。AI 时代已经到来——这里是展示你用 AI 做了什么的舞台。欢迎大家踊跃报名。
            </p>
          </section>

          {/* 参赛赛道 */}
          <section>
            <SectionTitle>选择你的进化赛道</SectionTitle>

            <div className="space-y-3">
              {/* Optimizer */}
              <div className="rounded-xl bg-surface-container-low border border-outline-variant/15 overflow-hidden">
                <div className="h-0.5 bg-secondary" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span>⚡</span>
                      <span className="text-base font-bold text-on-surface">Optimizers</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">个人参赛</span>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-2">
                    重构工作流，用 AI 把自己武装成全能战士。
                  </p>
                  <p className="text-xs text-secondary/60 italic">Efficiency is a personal obsession.</p>
                </div>
              </div>

              {/* Builder */}
              <div className="rounded-xl bg-surface-container-low border border-outline-variant/15 overflow-hidden">
                <div className="h-0.5 bg-tertiary" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span>🛠️</span>
                      <span className="text-base font-bold text-on-surface">Builders</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full">≤ 2 人</span>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-2">
                    设计小红书 in-app feature，或有 rednote DNA 的独立产品。欢迎找搭档双人组队，亦可 solo。
                  </p>
                  <p className="text-xs text-tertiary/60 italic">Turn a wild idea into a working demo.</p>
                </div>
              </div>

              {/* 演示规则 */}
              <div className="bg-surface-container-low rounded-xl px-5 py-4 border border-outline-variant/15 text-sm text-on-surface-variant">
                每个作品 <span className="font-semibold text-on-surface">8 分钟展演 + 2 分钟 QA</span>，时间严格执行。每个赛道评选前 3 名，另设 3 个整体专项奖。
              </div>
            </div>
          </section>

        </div>

        {/* 右列：时间线 + 议程（sticky） */}
        <div className="sticky top-6 space-y-8">

          {/* The Sprint 时间线 */}
          <section>
            <SectionTitle>The Sprint</SectionTitle>
            <p className="text-xs text-on-surface-variant/50 italic mb-5">We move fast. Evolution waits for no one.</p>

            <div>
              {timeline.map((item, i, arr) => (
                <div
                  key={i}
                  className={`relative pl-5 pb-5 ${i < arr.length - 1 ? 'border-l border-outline-variant/25' : ''}`}
                >
                  <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${
                    item.highlight ? 'bg-secondary ring-2 ring-secondary/20' : 'bg-outline-variant/60'
                  }`} />
                  <p className="text-xs text-on-surface-variant mb-0.5">
                    {item.date}
                    <span className={`ml-1.5 font-bold ${item.highlight ? 'text-secondary' : 'text-on-surface-variant/60'}`}>
                      @ {item.time}
                    </span>
                  </p>
                  <p className={`text-sm font-semibold ${item.highlight ? 'text-secondary' : 'text-on-surface'}`}>
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 当天议程 */}
          <section>
            <SectionTitle>当天议程</SectionTitle>

            <div className="rounded-xl overflow-hidden border border-outline-variant/15">
              {agenda.map((item, i) => (
                <div
                  key={i}
                  className={`px-4 py-3 bg-surface-container-low ${i > 0 ? 'border-t border-outline-variant/10' : ''}`}
                >
                  <p className="text-[10px] font-mono font-bold mb-0.5 text-outline/70">
                    {item.time}
                  </p>
                  <p className="text-sm font-medium text-on-surface">
                    {item.title}
                  </p>
                  {item.sub && (
                    <p className="text-[11px] text-on-surface-variant/50 mt-0.5">{item.sub}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 结语 */}
          <p className="text-xs text-on-surface-variant/40 italic pt-4 border-t border-outline-variant/15">
            Don't just adapt. Evolve.
          </p>

        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
      <span className="w-1 h-5 rounded-full bg-secondary flex-shrink-0" />
      {children}
    </h2>
  );
}
