'use client';

import { useLanguage } from '@/components/LanguageProvider';

export default function GuidePage() {
  const { t } = useLanguage();

  const timeline = [
    { date: '3月29日（周日）18:00', dateEn: 'March 29 (Sun) @ 18:00', title: '报名开启', titleEn: 'Applications Open', desc: '报名通道开放，填写你的提案', descEn: 'The portal unlocks. Get your name in.' },
    { date: '3月30日（周一）14:00', dateEn: 'March 30 (Mon) @ 14:00', title: '报名截止', titleEn: 'Applications Close', desc: '不接受延期，我们重视准时', descEn: 'No extensions. We value precision.', highlight: true },
    { date: '3月30日（周一）下午', dateEn: 'March 30 (Mon) Afternoon', title: '初筛投票', titleEn: 'The First Cut', desc: '社区投票选出最有潜力的作品', descEn: 'Community voting begins to select the most promising evolutions.' },
    { date: '4月1日（周三）', dateEn: 'April 1 (Wed)', title: 'Demo Day', titleEn: 'Demo Day', desc: '现场路演与最终评选', descEn: 'Live roadshow and the final showdown.', highlight: true },
  ];

  const agenda = [
    { time: '14:00 – 15:30', title: '第一幕：Optimizer 展示', titleEn: 'Act I: The Optimizers', desc: '见证工作效率的未来', descEn: 'Witness the future of work.' },
    { time: '15:30 – 15:45', title: '茶歇', titleEn: 'Coffee Break', desc: '补充能量，交流想法', descEn: 'Refuel, recharge, and talk shop.', isBreak: true },
    { time: '15:45 – 17:15', title: '第二幕：Builder 展示', titleEn: 'Act II: The Builders', desc: '探索产品的下一个前沿', descEn: 'Exploring the next frontier of products.' },
    { time: '17:15 – 17:45', title: '颁奖典礼', titleEn: 'Award Ceremony', desc: '加冕进化的引领者', descEn: 'Crowning the leaders of the evolution.', isHighlight: true },
  ];

  return (
    <div className="p-12 max-w-6xl">
      {/* Hero Section */}
      <header className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="h-px w-12 bg-secondary"></span>
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-secondary">{t.guide.badge}</span>
        </div>
        
        <h1 className="font-headline text-6xl md:text-7xl font-bold text-on-surface leading-[0.95] tracking-tight mb-8">
          Evolution:<br />
          <span className="italic font-light">AI Demo Day</span>
        </h1>
        
        <p className="font-headline text-xl md:text-2xl text-on-surface-variant italic max-w-2xl mb-12">
          {t.guide.subtitle}
        </p>
        
        <div className="inline-flex items-center gap-4 bg-surface-container-low px-6 py-3 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="text-sm font-bold tracking-widest uppercase text-on-surface">{t.guide.status}</span>
        </div>
      </header>

      {/* 01. Why Evolution? */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-8">
          <span className="font-headline text-6xl font-bold text-outline-variant/30">01</span>
          <h2 className="font-headline text-3xl font-bold text-on-surface">{t.guide.whyTitle}</h2>
        </div>
        
        <div className="ml-20 space-y-6">
          <blockquote className="font-headline text-3xl md:text-4xl font-bold text-secondary leading-tight">
            {t.guide.whyContent1}
          </blockquote>
          
          <div className="prose prose-lg max-w-3xl space-y-6 text-on-surface-variant leading-relaxed">
            <p>
              {t.guide.whyContent2}
            </p>
          </div>
          
          <p className="font-headline text-2xl italic text-on-surface pt-4">
            Don't just adapt. Evolve.
          </p>
        </div>
      </section>

      {/* 02. What is this? */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-8">
          <span className="font-headline text-6xl font-bold text-outline-variant/30">02</span>
          <h2 className="font-headline text-3xl font-bold text-on-surface">{t.guide.whatTitle}</h2>
        </div>
        
        <div className="ml-20">
          <p className="text-on-surface-variant leading-relaxed max-w-3xl">
            {t.guide.whatContent}
          </p>
        </div>
      </section>

      {/* 03. Pick Your Track */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-12">
          <span className="font-headline text-6xl font-bold text-outline-variant/30">03</span>
          <h2 className="font-headline text-3xl font-bold text-on-surface">Pick Your Track</h2>
        </div>

        <div className="ml-20 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Track A: Optimizer */}
          <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-secondary">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">⚡️</span>
              <h3 className="font-headline text-2xl font-bold">{t.guide.categories.optimizer.title}</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm font-bold uppercase tracking-wider text-secondary">Your Mission</p>
              <p className="text-on-surface-variant leading-relaxed">
                {t.guide.categories.optimizer.desc}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4 border-t border-outline-variant/20">
              {['Efficiency', 'AI-Agents', 'Seamless', 'Hyper-growth'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-surface-container-high text-[10px] font-bold uppercase tracking-wider text-on-surface-variant rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Track B: Builder */}
          <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-tertiary">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🛠️</span>
              <h3 className="font-headline text-2xl font-bold">{t.guide.categories.builder.title}</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm font-bold uppercase tracking-wider text-tertiary">Your Mission</p>
              <p className="text-on-surface-variant leading-relaxed">
                {t.guide.categories.builder.desc}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4 border-t border-outline-variant/20">
              {['Product-Led', 'User Value', 'Innovation', 'rednote DNA'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-surface-container-high text-[10px] font-bold uppercase tracking-wider text-on-surface-variant rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 04. The Sprint */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-8">
          <span className="font-headline text-6xl font-bold text-outline-variant/30">04</span>
          <h2 className="font-headline text-3xl font-bold text-on-surface">The Sprint</h2>
        </div>
        
        <p className="ml-20 text-base text-on-surface-variant mb-10">
          We move fast. Evolution waits for no one.
        </p>

        <div className="ml-20 space-y-0">
          {timeline.map((item, i, arr) => (
            <div key={i} className={`relative pl-8 pb-10 ${i < arr.length - 1 ? 'border-l border-outline-variant/30' : ''}`}>
              <div className={`absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full ${item.highlight ? 'bg-secondary' : 'bg-outline-variant'}`} />
              <div className="flex flex-col md:flex-row md:items-baseline md:gap-6">
                <span className="font-headline text-lg font-medium md:w-56 shrink-0">{item.date}</span>
                <div className="flex-1">
                  <span className={`text-base font-bold ${item.highlight ? 'text-secondary' : 'text-on-surface'}`}>
                    {item.title}
                  </span>
                  <p className="text-sm text-on-surface-variant mt-1">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 05. Roadshow Agenda */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-8">
          <span className="font-headline text-6xl font-bold text-outline-variant/30">05</span>
          <h2 className="font-headline text-3xl font-bold text-on-surface">Roadshow Agenda</h2>
        </div>
        
        <p className="ml-20 text-base text-on-surface-variant mb-10">
          No fluff. No long speeches. Just pure building.
        </p>

        <div className="ml-20 bg-surface-container-low p-8 rounded-xl mb-8">
          <h4 className="font-headline text-xl font-bold mb-4">The 8+2 Rule</h4>
          <p className="text-on-surface-variant leading-relaxed">
            You get 8 minutes to demo and 2 minutes for QA. Time limits are strictly enforced with a Hard Stop. Stay sharp.
          </p>
        </div>

        <div className="ml-20 grid grid-cols-1 md:grid-cols-2 gap-4">
          {agenda.map((item, i) => (
            <div 
              key={i} 
              className={`p-6 rounded-lg ${
                item.isHighlight 
                  ? 'bg-secondary-container' 
                  : item.isBreak 
                    ? 'bg-surface-container-highest' 
                    : 'bg-surface-container-low'
              }`}
            >
              <span className={`text-xs font-bold uppercase tracking-wider ${item.isHighlight ? 'text-secondary' : 'text-outline'}`}>
                {item.time}
              </span>
              <h5 className={`font-headline text-lg font-bold mt-2 ${item.isHighlight ? 'text-on-secondary-container' : 'text-on-surface'}`}>
                {item.title}
              </h5>
              <p className={`text-sm mt-1 ${item.isHighlight ? 'text-on-secondary-container/70' : 'text-on-surface-variant'}`}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20 pt-12 border-t border-outline-variant/20">
        <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">Ready to Evolve?</h3>
        <p className="text-on-surface-variant">Submit your proposal and join the revolution.</p>
      </section>
    </div>
  );
}
