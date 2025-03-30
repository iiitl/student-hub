import React from 'react'
import Link from 'next/link'
import { footerLinks } from '@/data/footer-links'

const Footer = () => {
  return (
    <footer className="border-t py-8 text-foreground bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-around items-center">
          <div className="flex flex-wrap flex-col md:flex-row justify-around items-center md:items-start gap-8 md:gap-6 text-sm w-full px-2">
            <div className="mb-4 md:mb-0 w-full md:w-auto text-center">
              <Link href="/" className="font-extrabold text-2xl ">
                Student<span className="text-primary">Hub</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                By students, for students
              </p>
              <p className="mt-1 pt-4 text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} StudentHub. All rights
                reserved.
              </p>
            </div>
            {footerLinks.routeLinks.map((category) => (
              <div
                key={category.title}
                className="flex flex-col gap-2 md:text-left text-center"
              >
                <h3 className="text-lg font-bold">{category.title}</h3>
                {category.links.map((link) => (
                  <Link
                    key={link.name}
                    href={link.url}
                    className="text-muted-foreground hover:text-primary text-sm"
                    aria-label={`Go to ${link.name}`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            ))}
            <div className="md:text-left text-center">
              <h3 className="text-lg font-bold">Follow us</h3>
              <div className="flex gap-2 pt-1.5">
                {footerLinks.socialLinks.map((social) => (
                  <Link
                    key={social.name}
                    href={social.url}
                    className="bg-foreground p-3 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 text-background/80 hover:text-background"
                    aria-label={`Visit our ${social.name} page`}
                  >
                    <social.icon className="w-5 h-5"></social.icon>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
