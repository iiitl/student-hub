import HeroSection from '@/components/homepage/hero-section'
import CtaSection from '@/components/homepage/cta-section'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-gradient-to-br from-slate-100 via-white to-blue-50 dark:from-neutral-950 dark:to-black dark:text-gray-100 text-gray-900">

      {/* Main content area */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-12 space-y-24">

        {/* Hero Section */}
        <section className="
          max-w-7xl mx-auto
          bg-white bg-opacity-90 dark:bg-neutral-900
          p-10 rounded-3xl
          border border-slate-200 dark:border-neutral-700
          shadow-md
          transition-all duration-300 ease-in-out
          hover:scale-[1.02] 
          hover:shadow-xl 
          hover:border-blue-300 
          hover:ring-4 
          hover:ring-blue-100 
          dark:hover:ring-emerald-500/30
          backdrop-blur-md
        ">
          <HeroSection />
        </section>

        {/* CTA Section */}
        <section className="
          max-w-4xl mx-auto
          bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-900 dark:to-neutral-950
          p-10 rounded-3xl
          border border-slate-200 dark:border-neutral-700
          shadow-md
          transition-all duration-300 ease-in-out
          hover:scale-[1.02] 
          hover:shadow-xl 
          hover:border-indigo-300 
          hover:ring-4 
          hover:ring-indigo-100 
          dark:hover:ring-emerald-500/30
        ">
          <CtaSection />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-neutral-900 text-gray-700 dark:text-gray-400 text-center py-5 text-sm border-t border-slate-300 dark:border-neutral-800 shadow-inner">
        © 2025 <span className="text-blue-700 dark:text-emerald-400 font-semibold">Your Company</span>. All rights reserved.
      </footer>
    </div>
  )
}
