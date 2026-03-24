'use client';

export default function GuidePage() {
  return (
    <div className="p-12 max-w-6xl">
      {/* Hero Section */}
      <header className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="h-px w-12 bg-secondary"></span>
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-secondary">2025 Spring</span>
        </div>
        
        <h1 className="font-headline text-6xl md:text-7xl font-bold text-on-surface leading-[0.95] tracking-tight mb-8">
          Evolution:<br />
          <span className="italic font-light">AI Demo Day</span>
        </h1>
        
        <p className="font-headline text-xl md:text-2xl text-on-surface-variant italic max-w-2xl mb-12 chinese-text">
          Strategy, Research & Investment Special
        </p>
        
        <div className="inline-flex items-center gap-4 bg-surface-container-low px-6 py-3 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="text-sm font-bold tracking-widest uppercase text-on-surface">Applications Open</span>
        </div>
      </header>

      {/* 01. Why Evolution? */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-8">
          <span className="font-headline text-6xl font-bold text-outline-variant/30">01</span>
          <h2 className="font-headline text-3xl font-bold text-on-surface">Why Evolution?</h2>
        </div>
        
        <div className="ml-20 space-y-6">
          <blockquote className="font-headline text-3xl md:text-4xl font-bold text-secondary leading-tight">
            Stop talking about the future.<br />
            Start shipping it.
          </blockquote>
          
          <div className="prose prose-lg max-w-3xl space-y-6 text-on-surface-variant leading-relaxed">
            <p>
              The AI Native era isn't just coming; it's already here, and it's rewriting the rules of how we think, work, and create. As the "brains" of rednote, the Strategists, User Researchers, and Investors, we aren't just here to watch the wave; we're here to ride it.
            </p>
            <p>
              Evolution is our playground. It's a day to showcase our "AI Native brains" by turning theoretical logic into tangible prototypes. We're moving beyond the slides to build the workflows and products that define what's next.
            </p>
          </div>
          
          <p className="font-headline text-2xl italic text-on-surface pt-4">
            Don't just adapt. Evolve.
          </p>
        </div>
      </section>

      {/* 02. Pick Your Track */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-12">
          <span className="font-headline text-6xl font-bold text-outline-variant/30">02</span>
          <h2 className="font-headline text-3xl font-bold text-on-surface">Pick Your Track</h2>
        </div>
        
        <p className="ml-20 text-base text-on-surface-variant mb-10 max-w-2xl">
          Two paths. One goal: To see how far your AI-powered imagination can go.
        </p>

        <div className="ml-20 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Track A: Optimizer */}
          <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-secondary">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">⚡️</span>
              <h3 className="font-headline text-2xl font-bold">Track A: The Optimizer</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm font-bold uppercase tracking-wider text-secondary">Your Mission</p>
              <p className="text-on-surface-variant leading-relaxed chinese-text">
                Destruct and rebuild your daily workflow. Whether it's for investment analysis, market research, or strategic planning, show us how you use AI to automate the boring stuff and become a one-man army.
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm font-bold uppercase tracking-wider text-secondary">The Rule</p>
              <p className="text-on-surface-variant leading-relaxed chinese-text">
                Solo Only. Efficiency is a personal obsession. This track is for the lone wolves hacking their way to peak productivity.
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
              <h3 className="font-headline text-2xl font-bold">Track B: The Builder</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm font-bold uppercase tracking-wider text-tertiary">Your Mission</p>
              <p className="text-on-surface-variant leading-relaxed chinese-text">
                Design an AI-native product. It could be a killer feature inside the rednote app or a standalone independent project. The secret sauce? Leveraging rednote's unique assets and DNA to create something users didn't even know they needed.
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm font-bold uppercase tracking-wider text-tertiary">The Rule</p>
              <p className="text-on-surface-variant leading-relaxed chinese-text">
                Duo or Solo. (Max 2 people). Find your "complementary brain" and turn a wild idea into a working demo.
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

      {/* 03. The Sprint */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-8">
          <span className="font-headline text-6xl font-bold text-outline-variant/30">03</span>
          <h2 className="font-headline text-3xl font-bold text-on-surface">The Sprint</h2>
        </div>
        
        <p className="ml-20 text-base text-on-surface-variant mb-10">
          We move fast. Evolution waits for no one.
        </p>

        <div className="ml-20 space-y-0">
          {[
            { date: 'March 29 (Sun) @ 18:00', title: 'Applications Open', desc: 'The portal unlocks. Get your name in.' },
            { date: 'March 30 (Mon) @ 14:00', title: 'Applications Close', desc: 'No extensions. We value precision.', highlight: true },
            { date: 'March 30 (Mon) Afternoon', title: 'The First Cut', desc: 'Community voting begins to select the most promising evolutions.' },
            { date: 'April 1 (Wed)', title: 'Demo Day', desc: 'Live roadshow and the final showdown.', highlight: true },
          ].map((item, i, arr) => (
            <div key={i} className={`relative pl-8 pb-10 ${i < arr.length - 1 ? 'border-l border-outline-variant/30' : ''}`}>
              <div className={`absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full ${item.highlight ? 'bg-secondary' : 'bg-outline-variant'}`} />
              <div className="flex flex-col md:flex-row md:items-baseline md:gap-6">
                <span className="font-headline text-lg font-medium md:w-48 shrink-0">{item.date}</span>
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

      {/* 04. Roadshow Agenda */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-8">
          <span className="font-headline text-6xl font-bold text-outline-variant/30">04</span>
          <h2 className="font-headline text-3xl font-bold text-on-surface">Roadshow Agenda</h2>
        </div>
        
        <p className="ml-20 text-base text-on-surface-variant mb-10">
          No fluff. No long speeches. Just pure building.
        </p>

        <div className="ml-20 bg-surface-container-low p-8 rounded-xl mb-8">
          <h4 className="font-headline text-xl font-bold mb-4">The 8+2 Rule</h4>
          <p className="text-on-surface-variant leading-relaxed chinese-text">
            You get 8 minutes to demo and 2 minutes for QA. Time limits are strictly enforced with a Hard Stop. Stay sharp.
          </p>
        </div>

        <div className="ml-20 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { time: '14:00 – 15:30', title: 'Act I: The Optimizers', desc: 'Witness the future of work.' },
            { time: '15:30 – 15:45', title: 'Coffee Break', desc: 'Refuel, recharge, and talk shop.', isBreak: true },
            { time: '15:45 – 17:15', title: 'Act II: The Builders', desc: 'Exploring the next frontier of products.' },
            { time: '17:15 – 17:45', title: 'Award Ceremony', desc: 'Crowning the leaders of the evolution.', isHighlight: true },
          ].map((item, i) => (
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
