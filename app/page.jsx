import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import MobileNav from "@/components/mobile-nav"
import Footer from "@/components/footer"
import { ThemeToggle } from "@/components/theme-toggle"
import { MoveRight, BookOpen, FileQuestion, ShoppingBag, MessageCircle, Users, BookmarkIcon, GraduationCap } from "lucide-react"



export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur-md z-20 transition-all duration-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="font-heading font-bold text-2xl flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-purple-600 text-transparent bg-clip-text">StudentHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/quick-reads" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>Quick Reads</span>
            </Link>
            <Link href="/notes" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <BookmarkIcon className="h-4 w-4" />
              <span>Notes</span>
            </Link>
            <Link href="/papers" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <FileQuestion className="h-4 w-4" />
              <span>Question Papers</span>
            </Link>
            <Link href="/marketplace" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" />
              <span>Marketplace</span>
            </Link>
            <Link href="/chat" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
            </Link>
            <div className="flex items-center gap-2 ml-4">
              <ThemeToggle />
              <Button size="sm" className="rounded-full" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </nav>

          {/* Mobile Navigation Trigger */}
          <div className="flex items-center gap-4 md:hidden">
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-3"></div>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 text-left">
                <div className="inline-block px-3 py-1 mb-6 text-xs font-medium text-primary-foreground bg-primary rounded-full">
                  Your Academic Success Partner
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 tracking-tight">
                  Everything You Need,{" "}
                  <span className="bg-gradient-to-r from-primary to-purple-600 text-transparent bg-clip-text">All in One Place</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mb-8">
                  Resources, community, and support designed to transform your college journey from stressful to successful
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="rounded-full group" asChild>
                    <Link href="/newcomers">
                      <span>New Student Guide</span>
                      <MoveRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full" asChild>
                    <Link href="/notes">Browse Notes</Link>
                  </Button>
                </div>
              </div>
              <div className="flex-1 relative">
                <div className="relative w-full aspect-square md:aspect-video lg:aspect-square max-w-lg mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl transform rotate-3"></div>
                  <div className="absolute inset-0 bg-card rounded-2xl border shadow-xl transform -rotate-3">
                    <div className="p-6 h-full flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Latest Notes</h3>
                          <p className="text-xs text-muted-foreground">Organic Chemistry</p>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-muted rounded-lg p-3 flex flex-col">
                            <div className="w-full h-2 bg-primary/20 rounded-full mb-2"></div>
                            <div className="w-3/4 h-2 bg-primary/10 rounded-full"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Everything You Need to Succeed</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our platform is designed to support every aspect of your academic journey
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard 
                icon={<BookOpen className="h-6 w-6 text-primary" />}
                title="Comprehensive Notes"
                description="Access detailed notes for all subjects, organized by topic and created by top students"
                link="/notes"
              />
              <FeatureCard 
                icon={<FileQuestion className="h-6 w-6 text-primary" />}
                title="Previous Question Papers"
                description="Practice with past exam papers to understand patterns and prepare effectively"
                link="/papers"
              />
              <FeatureCard 
                icon={<ShoppingBag className="h-6 w-6 text-primary" />}
                title="Student Marketplace"
                description="Buy and sell textbooks, study materials, and other college essentials"
                link="/marketplace"
              />
              <FeatureCard 
                icon={<MessageCircle className="h-6 w-6 text-primary" />}
                title="Community Chat"
                description="Connect with peers, ask questions, and collaborate on assignments"
                link="/chat"
              />
              <FeatureCard 
                icon={<Users className="h-6 w-6 text-primary" />}
                title="Newcomer's Guide"
                description="Everything first-year students need to know to navigate college life successfully"
                link="/newcomers"
              />
              <FeatureCard 
                icon={<BookmarkIcon className="h-6 w-6 text-primary" />}
                title="Quick Reads"
                description="Bite-sized articles on study tips, productivity hacks, and student life"
                link="/quick-reads"
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">What Students Say</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join thousands of students who are transforming their college experience
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TestimonialCard
                quote="StudentHub's notes saved me during finals week. I wouldn't have passed Organic Chemistry without it!"
                name="Alex Johnson"
                role="Biology Major"
              />
              <TestimonialCard
                quote="The marketplace helped me save over $300 on textbooks this semester. Absolutely game-changing."
                name="Sarah Martinez"
                role="Business Student"
              />
              <TestimonialCard
                quote="The community here is incredible. I've made friends, found study partners, and even got help with internship applications."
                name="Michael Chen"
                role="Computer Science"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 to-purple-500/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Ready to Transform Your College Experience?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Join our community of students dedicated to academic excellence and mutual support
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="rounded-full group" asChild>
                <Link href="/sign-up">
                  <span>Join StudentHub Today</span>
                  <MoveRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full" asChild>
                <Link href="/chat">Explore Community</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

function FeatureCard({ icon, title, description, link }) {
  return (
    <Card className="h-full transition-all hover:shadow-lg border-muted/80 group">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <h3 className="font-bold text-xl font-heading mb-3">{title}</h3>
        <p className="text-muted-foreground mb-5 flex-1">{description}</p>
        <Button variant="ghost" className="justify-start p-0 group-hover:text-primary transition-colors group-hover:translate-x-1 duration-300" asChild>
          <Link href={link} className="flex items-center gap-1">
            <span>Explore</span>
            <MoveRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function TestimonialCard({ quote, name, role }) {
  return (
    <Card className="h-full transition-all hover:shadow-lg border-muted/80">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="mb-4 text-primary">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.6 21.5C11.6 21.8 11.3 22 11 22H6C4.3 22 3 20.7 3 19V14C3 12.3 4.3 11 6 11H8.5C8.8 11 9 11.2 9 11.5V13C9 13.6 9.4 14 10 14H11C11.6 14 12 13.6 12 13V4.5C12 4.2 12.2 4 12.5 4H14C14.6 4 15 4.4 15 5V11.5C15 11.8 14.8 12 14.5 12H12.1C11.8 12 11.6 12.2 11.6 12.5V21.5Z" fill="currentColor"/>
            <path d="M22.5 21.5C22.5 21.8 22.3 22 22 22H17C15.3 22 14 20.7 14 19V14C14 12.3 15.3 11 17 11H19.5C19.8 11 20 11.2 20 11.5V13C20 13.6 20.4 14 21 14H22C22.6 14 23 13.6 23 13V4.5C23 4.2 23.2 4 23.5 4H23.5C23.8 4 24 4.2 24 4.5V11.5C24 11.8 23.8 12 23.5 12H23.1C22.8 12 22.6 12.2 22.6 12.5L22.5 21.5Z" fill="currentColor"/>
          </svg>
        </div>
        <p className="text-lg mb-6 flex-1 italic">"{quote}"</p>
        <div>
          <p className="font-bold">{name}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </CardContent>
    </Card>
  )
}