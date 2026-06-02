import React from 'react'
import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="border-t border-[#1e293b]/60 pb-8 pt-10 text-slate-500 bg-[#030610] relative z-10 font-mono text-[10px] tracking-[0.2em] uppercase">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center px-2">
          <Link href="/" className="font-black text-xl uppercase tracking-tighter flex items-center transform scale-y-110 origin-left mb-6 md:mb-0">
            <span className="text-white">Student</span>
            <span className="text-[#00e5ff]">Hub</span>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-4 md:text-right text-center text-slate-500">
            <span>&copy; {new Date().getFullYear()}</span> 
            <span className="text-slate-700 hidden md:inline">·</span> 
            <span>Built For Students</span> 
            <span className="text-slate-700 hidden md:inline">·</span> 
            <span className="text-[#00e5ff]/60">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
