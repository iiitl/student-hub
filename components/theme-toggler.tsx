'use client'
import { useEffect, useState } from 'react'
import { FaSun, FaMoon } from 'react-icons/fa'

interface ThemeToggleProps {
  text?: string
}

export default function ThemeToggle({ text }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme === 'dark') {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [theme])

  return (
    <button
      className="p-2 bg-primary flex items-center justify-center gap-3 text-white rounded cursor-pointer"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <FaSun /> : <FaMoon />} {text}
    </button>
  )
}
