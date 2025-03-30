import { Inter } from 'next/font/google'
import './globals.css'
import Footer from '@/components/footer'
import Header from '@/components/header'

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
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
