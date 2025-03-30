import { Inter, Poppins } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
// import { ThemeToggle } from "@/components/ui/theme-toggle"

// In your component/layout
{/* <ThemeToggle /> */}

// Use Inter for body text
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
})

// Use Poppins for headings
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-poppins",
})

export const metadata = {
  title: "StudentHub - College Resources & Community",
  description: "Your all-in-one platform for college resources, community support, and academic success",
  keywords: "college, university, student resources, notes, papers, community",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}