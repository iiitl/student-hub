import Link from 'next/link'
import React from 'react'

const Header = () => {
  return (
    <header className="sticky top-0 bg-[#030610]/95 backdrop-blur-md z-50 border-b border-[#1e293b]/60">
      <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <Link href="/" className="font-black text-2xl uppercase tracking-tighter flex items-center transform scale-y-110 origin-left">
          <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Student</span>
          <span className="text-[#00e5ff] drop-shadow-[0_0_15px_rgba(0,229,255,0.4)]">Hub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 font-mono text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
          <Link href="/quick-reads" className="hover:text-white transition-colors flex flex-col leading-[1.2] items-end">
            <span>Quick</span>
            <span>Reads</span>
          </Link>
          <Link href="/notes" className="hover:text-white transition-colors flex flex-col leading-[1.2] items-end">
            <span>Study</span>
            <span>Material</span>
          </Link>
          <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
          <Link href="/chat" className="hover:text-white transition-colors">Chat</Link>
          <Link href="/community" className="hover:text-white transition-colors">Community</Link>
          
          <div className="flex items-center gap-6 ml-6">
            <Link href="/signin" className="text-[#00e5ff] border-b border-[#00e5ff] pb-1 hover:text-white hover:border-white transition-colors hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]">Sign In</Link>
            <Link href="/signup" className="bg-[#00e5ff] text-black px-6 py-2.5 transform -skew-x-[15deg] hover:bg-white transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)]">
              <span className="inline-block transform skew-x-[15deg]">Sign Up</span>
            </Link>
          </div>
        </nav>

        {/* Mobile Navigation Trigger */}
        <div className="lg:hidden text-[#00e5ff] font-bold tracking-widest text-xs uppercase px-4 py-2 border border-[#00e5ff]/30">MENU</div>
      </div>
    </header>
  )
}

export default Header
