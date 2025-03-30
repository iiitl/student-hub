"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [theme, setTheme] = useState("light")
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Effect to initialize theme from localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme")
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    const initialTheme = storedTheme || systemTheme
    
    setTheme(initialTheme)
    document.documentElement.classList.toggle("dark", initialTheme === "dark")
  }, [])
  
  // Function to toggle theme with animation
  const toggleTheme = () => {
    setIsAnimating(true)
    const newTheme = theme === "dark" ? "light" : "dark"
    
    // Add a ripple effect to the entire page
    const ripple = document.createElement("div")
    ripple.className = "theme-toggle-ripple"
    document.body.appendChild(ripple)
    
    // Trigger animation
    setTimeout(() => {
      setTheme(newTheme)
      localStorage.setItem("theme", newTheme)
      document.documentElement.classList.toggle("dark", newTheme === "dark")
      
      // Remove ripple after animation completes
      setTimeout(() => {
        document.body.removeChild(ripple)
        setIsAnimating(false)
      }, 500)
    }, 150)
  }

  return (
    <>
      <style jsx global>{`
        /* Add these styles to your global CSS */
        .theme-toggle-ripple {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: transparent;
          z-index: 9999;
          pointer-events: none;
          animation: ${theme === 'dark' ? 'ripple-to-light' : 'ripple-to-dark'} 0.5s ease-out forwards;
        }
        
        @keyframes ripple-to-dark {
          0% {
            box-shadow: inset 0 0 0 0 rgba(0, 0, 0, 0);
          }
          100% {
            box-shadow: inset 0 0 0 100vmax rgba(0, 0, 0, 0.95);
          }
        }
        
        @keyframes ripple-to-light {
          0% {
            box-shadow: inset 0 0 0 0 rgba(255, 255, 255, 0);
          }
          100% {
            box-shadow: inset 0 0 0 100vmax rgba(255, 255, 255, 0.95);
          }
        }
        
        .theme-toggle-button {
          position: relative;
          overflow: hidden;
          transition: background-color 0.5s;
        }
        
        .icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          position: relative;
        }
        
        .theme-icon {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .sun-icon {
          transform: ${theme === 'dark' ? 'translateY(100%) rotate(-45deg)' : 'translateY(0) rotate(0)'};
          opacity: ${theme === 'dark' ? 0 : 1};
        }
        
        .moon-icon {
          position: absolute;
          transform: ${theme === 'light' ? 'translateY(-100%) rotate(45deg)' : 'translateY(0) rotate(0)'};
          opacity: ${theme === 'light' ? 0 : 1};
        }
      `}</style>
      
      <Button 
        variant="outline" 
        size="icon" 
        className={`theme-toggle-button h-9 w-9 rounded-full ${isAnimating ? 'pointer-events-none' : ''}`} 
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <div className="icon-container">
          <Sun className="theme-icon sun-icon h-5 w-5" />
          <Moon className="theme-icon moon-icon h-5 w-5" />
        </div>
      </Button>
    </>
  )
}