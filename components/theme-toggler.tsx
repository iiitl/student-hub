'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { FaSun, FaMoon } from 'react-icons/fa'

interface ThemeToggleProps {
  text?: string
}

export default function ThemeToggle({ text }: ThemeToggleProps) {
  const {theme, setTheme} = useTheme()
  const [mounted, setMounted] = useState(false)

    useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <button className="p-2 bg-primary flex items-center justify-center gap-3 text-white rounded cursor-pointer opacity-0">{text}</button>
  }


  return (
    <button
      className="p-2 bg-primary flex items-center justify-center gap-3 text-white rounded cursor-pointer"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <FaSun /> : <FaMoon />} {text}
    </button>
  )
}
