'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { HeaderLinkGroup } from '@/data/header-links'

interface NavDropdownProps {
  group: HeaderLinkGroup
}

export default function NavDropdown({ group }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id={`${group.name}-trigger`}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm hover:text-primary transition-colors focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !isOpen) {
            setIsOpen(true)
            setTimeout(() => {
              const firstMenuItem = document.querySelector(
                `#${group.name}-dropdown [role="menuitem"]`
              ) as HTMLElement
              firstMenuItem?.focus()
            }, 100)
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={`${group.name}-dropdown`}
      >
        {group.name}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg py-2 w-48 z-50 animate-in fade-in-0 slide-in-from-top-3 duration-200"
          role="menu"
          id={`${group.name}-dropdown`}
          aria-labelledby={`${group.name}-trigger`}
          tabIndex={-1}
        >
          {group.items.map((item, idx) => (
            <Link
              key={item.url}
              href={item.url}
              className="block px-4 py-2 text-sm hover:bg-muted hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
              tabIndex={focusedIndex === idx ? 0 : -1}
              onFocus={() => setFocusedIndex(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false)
                  const button = document.querySelector(
                    `button[aria-controls="${group.name}-dropdown"]`
                  )
                  if (button instanceof HTMLElement) {
                    button.focus()
                  }
                } else if (e.key === 'ArrowDown') {
                  setFocusedIndex((prev) =>
                    prev === null || prev === group.items.length - 1 ? 0 : prev + 1
                  )
                } else if (e.key === 'ArrowUp') {
                  setFocusedIndex((prev) =>
                    prev === null || prev === 0 ? group.items.length - 1 : prev - 1
                  )
                }
              }}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
