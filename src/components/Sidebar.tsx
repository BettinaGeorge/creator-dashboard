'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
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
    href: '/insights',
    label: 'Insights',
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
    href: '/studio',
    label: 'AI Studio',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2 C8 2 10 5 13 6 C10 7 8 10 8 10 C8 10 6 7 3 6 C6 5 8 2 8 2 Z"/>
        <path d="M13 11 C13 11 14 12.5 15 13 C14 13.5 13 15 13 15 C13 15 12 13.5 11 13 C12 12.5 13 11 13 11 Z" opacity="0.6"/>
      </svg>
    ),
  },
  {
    href: '/scrapbook',
    label: 'Scrapbook',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="12" height="12" rx="1.5"/>
        <line x1="5" y1="6" x2="11" y2="6"/>
        <line x1="5" y1="9" x2="8" y2="9"/>
        <circle cx="11" cy="10" r="1.5"/>
        <line x1="10" y1="11" x2="13" y2="14"/>
      </svg>
    ),
  },
  {
    href: '/planner',
    label: 'Planner',
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="12" height="11" rx="1"/>
        <line x1="2" y1="6" x2="14" y2="6"/>
        <line x1="5" y1="1" x2="5" y2="4"/>
        <line x1="11" y1="1" x2="11" y2="4"/>
        <line x1="5" y1="9" x2="5" y2="9" strokeLinecap="round" strokeWidth="2"/>
        <line x1="8" y1="9" x2="8" y2="9" strokeLinecap="round" strokeWidth="2"/>
        <line x1="11" y1="9" x2="11" y2="9" strokeLinecap="round" strokeWidth="2"/>
        <line x1="5" y1="12" x2="5" y2="12" strokeLinecap="round" strokeWidth="2"/>
        <line x1="8" y1="12" x2="8" y2="12" strokeLinecap="round" strokeWidth="2"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-sidebar-collapsed', String(collapsed))
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

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
          <div className="sidebar-logo-text">
            <span className="logo-script">bettina george</span>
            <span className="logo-sub">Content Intelligence</span>
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8">
              {collapsed
                ? <polyline points="3,1 7,5 3,9"/>
                : <polyline points="7,1 3,5 7,9"/>
              }
            </svg>
          </button>
        </div>

        <nav className="nav">
          <div className="nav-section-label">Analytics</div>
          {analyticsNav.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={close}
              title={item.label}
              className={`nav-item ${isActive(item.href) && !(item.href === '/reels' && pathname === '/reels') ? 'active' : ''} ${item.href === '/reels' && pathname === '/' ? '' : isActive(item.href) ? 'active' : ''}`}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}

          <div className="nav-section-label">Tools</div>
          {toolsNav.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={close}
              title={item.label}
              className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="theme-toggle" onClick={toggleTheme}>
            <div className="toggle-track">
              <div className="toggle-thumb" />
            </div>
            <span className="nav-label">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </div>
        </div>
      </aside>
    </>
  )
}
