import HeroSection from '@/components/homepage/hero-section'
import CtaSection from '@/components/homepage/cta-section'

export default function Home() {
  return (
    <div className="flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />
        {/* CTA Section */}
        <CtaSection />
      </main>
    </div>
  )
}
