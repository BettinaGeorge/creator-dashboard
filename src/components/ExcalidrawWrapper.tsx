'use client'

// Excalidraw's styles MUST be imported here — without them the toolbar
// icons lose all sizing and render as giant SVGs on the canvas itself.
import '@excalidraw/excalidraw/index.css'

/**
 * Thin wrapper around Excalidraw that:
 *  - Loads the saved canvas from localStorage on mount
 *  - Persists every change back to localStorage
 *  - Passes the user's current theme into Excalidraw
 *
 * Why a separate file?
 * Next.js dynamic() with ssr:false must import a module that doesn't run
 * any browser-only code at module-eval time. Putting this in a dedicated
 * file keeps the dynamic boundary clean.
 */

import { useEffect, useRef } from 'react'
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'

const STORAGE_KEY = 'scrapbook_canvas'

interface Props {
  theme: 'dark' | 'light'
  onApiReady: (api: ExcalidrawImperativeAPI) => void
}

export default function ExcalidrawWrapper({ theme, onApiReady }: Props) {
  // We only persist elements + files — NOT appState.
  // appState contains `collaborators` which is a Map; JSON.stringify turns
  // it into a plain object, so .forEach breaks on restore. Excalidraw
  // reinitialises appState with safe defaults every mount anyway.
  const savedData = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const { elements, files } = JSON.parse(raw)
      return { elements, files }
    } catch {
      return null
    }
  })()

  return (
    <Excalidraw
      theme={theme}
      initialData={savedData}
      excalidrawAPI={(api) => onApiReady(api)}
      onChange={(elements, _appState, files) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ elements, files }))
        } catch {
          // quota exceeded — silently ignore
        }
      }}
      UIOptions={{
        canvasActions: {
          saveToActiveFile: false,
          loadScene: true,
          export: { saveFileToDisk: true },
        },
      }}
    />
  )
}
