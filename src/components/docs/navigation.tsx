'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PatriotLogo } from './patriot-logo'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'HOME' },
  { href: '/docs', label: 'DOCUMENTATION' },
  { href: '/docs/architecture', label: 'ARCHITECTURE' },
  { href: '/docs/control-plane', label: 'CONTROL PLANE' },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#262626] bg-[#0a0a0a]/95 backdrop-blur-sm">
      <nav className="flex items-center justify-between px-4 md:px-6 h-14">
        <Link href="/" className="flex items-center gap-3">
          <PatriotLogo className="w-7 h-7" />
          <span className="text-sm tracking-[0.3em] font-medium text-[#e5e5e5]">
            PATRIOT
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs tracking-wider transition-colors ${
                pathname === item.href
                  ? 'text-[#e5e5e5]'
                  : 'text-[#737373] hover:text-[#a3a3a3]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Status Indicator */}
        <div className="hidden md:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse-red" />
          <span className="text-xs tracking-wider text-[#dc2626]">ACTIVE</span>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5 text-[#a3a3a3]" />
          ) : (
            <Menu className="w-5 h-5 text-[#a3a3a3]" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#262626] bg-[#0a0a0a]">
          <div className="flex flex-col py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-6 py-3 text-xs tracking-wider transition-colors ${
                  pathname === item.href
                    ? 'text-[#e5e5e5] bg-[#1a1a1a]'
                    : 'text-[#737373] hover:text-[#a3a3a3] hover:bg-[#111111]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
