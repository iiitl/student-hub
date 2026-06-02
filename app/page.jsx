export default function Home() {
  return (
    <div className="flex flex-col flex-1 pb-20 w-full">
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col md:flex-row items-center justify-between min-h-[85vh]">
        <div className="flex flex-col gap-8 md:w-1/2 z-10">
          <div className="flex items-center gap-3 border border-[#00e5ff]/30 bg-[#00e5ff]/5 px-4 py-2 w-fit transform -skew-x-[15deg]">
            <div className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse transform skew-x-[15deg]"></div>
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#00e5ff] transform skew-x-[15deg] uppercase">SYSTEM ONLINE . EST. 2024</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase flex flex-col origin-left transform scale-y-110">
            <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Everything</span>
            <span className="text-transparent mt-2" style={{ WebkitTextStroke: '2px #00e5ff', filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.3))' }}>You Need,</span>
            <span className="text-[#00e5ff] mt-2 drop-shadow-[0_0_15px_rgba(0,229,255,0.4)]">One Place.</span>
          </h1>

          <p className="text-slate-400 max-w-lg text-lg leading-relaxed mt-4 border-l-2 border-[#7b61ff] pl-5">
            Resources, community, and tools for your college journey &mdash; built by students, optimized for the future.
          </p>

          <div className="flex flex-wrap items-center gap-6 mt-8">
             <button className="bg-[#00e5ff] text-black font-extrabold uppercase tracking-[0.15em] text-sm px-8 py-4 transform -skew-x-[15deg] hover:bg-white transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                <span className="inline-block transform skew-x-[15deg]">Initialize &rarr;</span>
             </button>
             <button className="border border-[#00e5ff]/50 bg-transparent text-[#00e5ff] font-extrabold uppercase tracking-[0.15em] text-sm px-8 py-4 transform -skew-x-[15deg] hover:bg-[#00e5ff]/10 transition-all">
                <span className="inline-block transform skew-x-[15deg]">Browse Notes</span>
             </button>
          </div>
        </div>

        <div className="md:w-1/2 relative mt-20 md:mt-0 flex justify-center items-center h-[600px] w-full">
           {/* Radar circles */}
           <div className="absolute w-[500px] h-[500px] rounded-full border border-slate-800/40"></div>
           <div className="absolute w-[350px] h-[350px] rounded-full border border-slate-700/50"></div>
           <div className="absolute w-[200px] h-[200px] rounded-full border border-[#7b61ff]/20 shadow-[inset_0_0_50px_rgba(123,97,255,0.1)]"></div>
           
           {/* Orbital Dots */}
           <div className="absolute top-[15%] right-[25%] w-2 h-2 rounded-full bg-[#7b61ff] shadow-[0_0_15px_#7b61ff]"></div>
           <div className="absolute bottom-[25%] left-[15%] w-2 h-2 rounded-full bg-[#ff3366] shadow-[0_0_15px_#ff3366]"></div>
           <div className="absolute bottom-[10%] right-[30%] w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_15px_#00e5ff]"></div>
           
           {/* Floating Cards */}
           <div className="absolute top-[15%] right-[-5%] bg-[#080b18]/80 backdrop-blur-md border border-slate-700/50 p-4 transform -skew-x-[15deg] shadow-lg">
              <div className="transform skew-x-[15deg]">
                <div className="text-2xl font-black text-[#7b61ff]">8,400+</div>
                <div className="text-[9px] text-slate-400 tracking-[0.2em] uppercase mt-1">Notes Shared</div>
              </div>
           </div>

           <div className="absolute top-[45%] left-[-10%] bg-[#080b18]/90 backdrop-blur-md border border-[#00e5ff]/40 p-6 transform -skew-x-[15deg] shadow-[0_0_40px_rgba(0,229,255,0.15)] z-20">
              <div className="transform skew-x-[15deg]">
                <div className="text-4xl font-black text-[#00e5ff]">24K+</div>
                <div className="text-[10px] text-slate-400 tracking-[0.2em] uppercase mt-2">Students Active</div>
              </div>
           </div>

           <div className="absolute bottom-[15%] left-[20%] bg-[#080b18]/80 backdrop-blur-md border border-slate-700/50 p-3 px-4 transform -skew-x-[15deg] shadow-lg">
              <div className="transform skew-x-[15deg] flex flex-col items-center">
                <div className="text-xl font-black text-[#7b61ff] flex items-center gap-1">4.9 <span className="text-sm">★</span></div>
                <div className="text-[9px] text-slate-400 tracking-[0.2em] uppercase mt-1">Avg Rating</div>
              </div>
           </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-7xl mx-auto px-6 py-24 mb-10 relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00e5ff]/20 to-transparent"></div>
        
        <div className="mb-20 mt-10">
          <div className="text-[#00e5ff] tracking-[0.3em] text-[10px] font-mono uppercase mb-4 flex items-center gap-4">
             <div className="w-12 h-[2px] bg-[#00e5ff]"></div> Core Modules
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter transform scale-y-110 origin-left">What's Inside The System</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[
            { id: '01', title: 'Study Material', icon: '📚', desc: 'Curated notes and papers from students at your college, indexed by subject and year.' },
            { id: '02', title: 'Community Chat', icon: '💬', desc: 'Real-time channels with classmates. Ask, answer, and connect without the noise.' },
            { id: '03', title: 'Marketplace', icon: '🛒', desc: 'Buy and sell textbooks, stationery, and essentials within your verified student network.' },
            { id: '04', title: 'Quick Reads', icon: '⚡', desc: 'Bite-sized breakdowns of complex topics. Explained by students who aced them.' },
            { id: '05', title: 'New Student Guide', icon: '🧭', desc: 'Step-by-step onboarding trail for freshers. Know everything before day one.' },
            { id: '06', title: 'Verified & Secure', icon: '🔒', desc: 'College email verification only. Your data never leaves the network.' }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col group p-10 border border-[#1e293b]/40 hover:bg-[#0c1222]/50 transition-colors backdrop-blur-[2px]">
              <div className="text-[10px] tracking-[0.3em] font-mono text-slate-600 mb-8">{feature.id} &mdash;</div>
              <div className="bg-[#080b18] border border-slate-700/50 w-14 h-14 flex items-center justify-center transform -skew-x-[15deg] mb-8 group-hover:border-[#00e5ff]/50 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all">
                <div className="transform skew-x-[15deg] text-2xl drop-shadow-md">{feature.icon}</div>
              </div>
              <h3 className="text-xl font-black mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-24 mb-10">
        <div className="relative bg-[#080b18] border border-slate-800/80 p-16 transform -skew-x-[10deg] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Top border highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00e5ff] via-[#7b61ff] to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7b61ff] to-[#00e5ff]"></div>
          
          <div className="transform skew-x-[10deg] flex flex-col md:flex-row items-center justify-between relative z-10">
            <div className="mb-10 md:mb-0">
              <div className="absolute top-[-20px] right-0 font-mono text-[10px] text-cyan-800 tracking-[0.3em] hidden md:block">SH-2025 . V2.0</div>
              <h2 className="text-4xl md:text-5xl font-black uppercase mb-4 tracking-tighter">
                Ready to <span className="text-[#00e5ff]">Connect?</span>
              </h2>
              <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                Join thousands of students already using StudentHub to study smarter and connect deeper.
              </p>
            </div>
            <div>
              <button className="bg-[#00e5ff] text-black font-extrabold uppercase tracking-[0.15em] text-sm px-10 py-5 hover:bg-white hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all transform -skew-x-[10deg]">
                <span className="inline-block transform skew-x-[10deg]">Get Access &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
