import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const HeroSection = () => {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-background to-muted relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('/path/to/your/background-image.jpg')" }}></div>
        <div className="container mx-auto px-4 text-center relative">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">Everything You Need, All in One Place</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Resources, community, and support for your college journey
        </p>
        <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild className="hover:scale-105 transition-transform">
            <Link href="/newcomers">New Student Guide</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="hover:scale-105 transition-transform">
            <Link href="/notes">Browse Notes</Link>
            </Button>
        </div>
        </div>
    </section>
  )
}

export default HeroSection