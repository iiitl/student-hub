import HeroSection from '@/components/homepage/hero-section'
import CtaSection from '@/components/homepage/cta-section'
import AddToHomePrompt from '@/components/homepage/add-to-home-prompt'

export default function Home() {
  return (
    <div className="flex flex-col">
      <main className="flex-1">
        <AddToHomePrompt />
        {/* Hero Section */}
        <HeroSection />
        {/* CTA Section */}
        <CtaSection />
      </main>
    </div>
  )
}
