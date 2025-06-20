"use client";
import HeroSection from '@/components/homepage/hero-section'
import Head from 'next/head'
import NotesSection from '@/components/homepage/notes-section'
import MarketplaceSection from '@/components/homepage/marketplace-section'
import CommunitySection from '@/components/homepage/community-section'
import Lenis from 'lenis'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true });
    lenis.on('scroll', () => {});
  }, []);

  return (
    <>
      <Head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="flex flex-col bg-blue-100 dark:bg-slate-800 font-satoshi dark:text-gray-300">
        <main className="flex-1"> 
          <HeroSection />
          <NotesSection />
          <MarketplaceSection />
          <CommunitySection />
          {/* <CtaSection /> */}
        </main>
      </div>
    </>
  );
}
