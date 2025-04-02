import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const CtaSection = () => {
  return (
    <section className="py-12 md:py-16 bg-muted">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Join Our Community
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Connect with fellow students, share resources, and make your college
          experience better
        </p>
        <Button
          size="lg"
          asChild
          className="hover:scale-105 transition-transform"
        >
          <Link href="/chat">Start Chatting</Link>
        </Button>
      </div>
    </section>
  )
}

export default CtaSection
