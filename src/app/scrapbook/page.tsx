'use client'

/**
 * Scrapbook page — freeform creative canvas powered by Excalidraw.
 *
 * Why dynamic import with ssr:false?
 * Excalidraw uses browser-only APIs (Canvas, ResizeObserver, etc.) that
 * don't exist in Node.js. If Next.js tries to server-render it, it crashes.
 * dynamic() with ssr:false tells Next.js to skip server rendering for that
 * component entirely and only run it in the browser.
 */

import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'

const ExcalidrawWrapper = dynamic(
  () => import('@/components/ExcalidrawWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="state-empty" style={{ height: '100%' }}>
        LOADING CANVAS<br />→ initialising scrapbook
      </div>
    ),
  }
)

export default function ScrapbookPage() {
  const { theme } = useTheme()
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const [cleared, setCleared] = useState(false)

  const handleClear = () => {
    if (!apiRef.current) return
    if (!window.confirm('Clear the entire canvas? This cannot be undone.')) return
    apiRef.current.resetScene()
    localStorage.removeItem('scrapbook_canvas')
    setCleared(true)
    setTimeout(() => setCleared(false), 2000)
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Creative <span>Scrapbook</span></div>
        </div>
        <div className="topbar-right">
          <button
            onClick={handleClear}
            className="panel-action"
            style={{ fontSize: 9 }}
          >
            {cleared ? '✓ cleared' : 'Clear canvas'}
          </button>
        </div>
      </div>

      {/* Excalidraw requires a container with a *definite* height — flex:1 on a
          min-height parent doesn't count. We calculate the exact remaining
          viewport height by subtracting the topbar (73px). */}
      <div style={{ height: 'calc(100vh - 73px)', overflow: 'hidden' }}>
        <ExcalidrawWrapper
          theme={theme as 'dark' | 'light'}
          onApiReady={(api) => { apiRef.current = api }}
        />
      </div>
    </>
  )
}
