'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from './ThemeProvider'

const analyticsNav = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="6" height="6" rx="1"/>
        <rect x="9" y="1" width="6" height="6" rx="1"/>
        <rect x="1" y="9" width="6" height="6" rx="1"/>
        <rect x="9" y="9" width="6" height="6" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/reels',
    label: 'Reels Library',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6"/>
        <circle cx="8" cy="8" r="2"/>
        <line x1="8" y1="2" x2="8" y2="4"/>
        <line x1="8" y1="12" x2="8" y2="14"/>
        <line x1="2" y1="8" x2="4" y2="8"/>
        <line x1="12" y1="8" x2="14" y2="8"/>
      </svg>
    ),
  },
  {
    href: '/strategy',
    label: 'Strategy',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="1,12 5,7 8,9 12,4 15,6"/>
        <line x1="1" y1="15" x2="15" y2="15"/>
      </svg>
    ),
  },
]

const toolsNav = [
  {
    href: '/predict',
    label: 'Predict',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 1 L10 6 L15 6 L11 9 L12.5 14 L8 11 L3.5 14 L5 9 L1 6 L6 6 Z"/>
      </svg>
    ),
  },
  {
    href: '/reels',
    label: 'Reel Detail',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6.5"/>
        <line x1="8" y1="5" x2="8" y2="8"/>
        <circle cx="8" cy="11" r="0.8" fill="currentColor"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const close = () => setIsOpen(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile hamburger — fixed, only visible on mobile via CSS */}
      <button
        className={`hamburger${isOpen ? ' hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="2" y1="4" x2="14" y2="4"/>
          <line x1="2" y1="8" x2="14" y2="8"/>
          <line x1="2" y1="12" x2="14" y2="12"/>
        </svg>
      </button>

      {/* Overlay — closes sidebar on tap */}
      <div
        className={`sidebar-overlay${isOpen ? ' visible' : ''}`}
        onClick={close}
      />

      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-script">bettina george</span>
          <span className="logo-sub">Content Intelligence</span>
        </div>

        <nav className="nav">
          <div className="nav-section-label">Analytics</div>
          {analyticsNav.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={close}
              className={`nav-item ${isActive(item.href) && !(item.href === '/reels' && pathname === '/reels') ? 'active' : ''} ${item.href === '/reels' && pathname === '/' ? '' : isActive(item.href) ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <div className="nav-section-label">Tools</div>
          {toolsNav.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={close}
              className={`nav-item ${item.href === '/predict' && pathname === '/predict' ? 'active' : ''} ${item.label === 'Reel Detail' && pathname.startsWith('/reels/') ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="theme-toggle" onClick={toggleTheme}>
            <div className="toggle-track">
              <div className="toggle-thumb" />
            </div>
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </div>
        </div>
      </aside>
    </>
  )
}
