import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
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

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-muted">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Connect with fellow students, share resources, and make your college experience better
            </p>
            <Button size="lg" asChild className="hover:scale-105 transition-transform">
              <Link href="/chat">Start Chatting</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
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