import { Inter } from 'next/font/google'
import './globals.css'
import Footer from '@/components/footer'
import Header from '@/components/header'
import AuthProvider from '@/context/session-provider'
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'StudentHub - College Resources & Community',
  description: 'Resources, community and more',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={
          inter.className + ' flex flex-col min-h-screen justify-between'
        }
      >
        <AuthProvider>
          <Header />
          {children}
          <Analytics />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
