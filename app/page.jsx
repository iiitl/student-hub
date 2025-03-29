import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Header from "@/components/header"
import Footer from "@/components/footer"
import HeroSection from "@/components/homepage/hero-section"
import CtaSection from "@/components/homepage/cta-section"

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

function FeatureCard({ title, description, link }) {
  return (
    <Card className="h-full transition-all hover:shadow-lg hover:scale-105 transform-gpu">
      <CardContent className="p-6 flex flex-col h-full">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 flex-1">{description}</p>
        <Button variant="ghost" className="justify-start p-0 hover:text-primary transition-colors" asChild>
          <Link href={link}>Explore →</Link>
        </Button>
      </CardContent>
    </Card>
  )
}