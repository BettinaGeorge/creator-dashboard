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

// ── Sample canvas data ────────────────────────────────────────────────────────
// Realistic creator brainstorm board. Injected via updateScene() when the
// canvas is empty and the user clicks "Load sample data".

const TS = Date.now() - 86_400_000 // yesterday

const SAMPLE_ELEMENTS: any[] = [
  // ── Title ──────────────────────────────────────────────────────────────────
  {
    id: 'sc_title', type: 'text',
    x: 80, y: 60, width: 580, height: 50, angle: 0,
    strokeColor: '#e2c27d', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid',
    roughness: 1, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1001, version: 2, versionNonce: 1001,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: 'CONTENT SCRAPBOOK  ·  2026',
    fontSize: 36, fontFamily: 1, textAlign: 'left', verticalAlign: 'top',
    containerId: null, originalText: 'CONTENT SCRAPBOOK  ·  2026',
    lineHeight: 1.25, baseline: 32,
  },
  {
    id: 'sc_sub', type: 'text',
    x: 83, y: 116, width: 460, height: 20, angle: 0,
    strokeColor: '#888888', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1002, version: 2, versionNonce: 1002,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: 'Bettina George  ·  creator strategy + ideas board',
    fontSize: 14, fontFamily: 2, textAlign: 'left', verticalAlign: 'top',
    containerId: null, originalText: 'Bettina George  ·  creator strategy + ideas board',
    lineHeight: 1.2, baseline: 12,
  },

  // ── Content pillars header ─────────────────────────────────────────────────
  {
    id: 'sc_pillars_h', type: 'text',
    x: 80, y: 170, width: 260, height: 20, angle: 0,
    strokeColor: '#aaaaaa', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1003, version: 2, versionNonce: 1003,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: '── CONTENT PILLARS ──',
    fontSize: 13, fontFamily: 2, textAlign: 'left', verticalAlign: 'top',
    containerId: null, originalText: '── CONTENT PILLARS ──',
    lineHeight: 1.2, baseline: 11,
  },

  // Fitness
  {
    id: 'sc_fit_box', type: 'rectangle',
    x: 80, y: 200, width: 155, height: 110, angle: 0,
    strokeColor: '#2d9a5f', backgroundColor: '#d4f5e2',
    fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: { type: 3, value: 8 },
    seed: 1010, version: 2, versionNonce: 1010,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
  },
  {
    id: 'sc_fit_txt', type: 'text',
    x: 88, y: 216, width: 139, height: 80, angle: 0,
    strokeColor: '#1a6b3f', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1011, version: 2, versionNonce: 1011,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: 'FITNESS\nworkouts\nwellness\nmotivation',
    fontSize: 15, fontFamily: 1, textAlign: 'center', verticalAlign: 'top',
    containerId: null, originalText: 'FITNESS\nworkouts\nwellness\nmotivation',
    lineHeight: 1.5, baseline: 13,
  },

  // Beauty
  {
    id: 'sc_bty_box', type: 'rectangle',
    x: 255, y: 200, width: 155, height: 110, angle: 0,
    strokeColor: '#c05080', backgroundColor: '#f5d4e2',
    fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: { type: 3, value: 8 },
    seed: 1020, version: 2, versionNonce: 1020,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
  },
  {
    id: 'sc_bty_txt', type: 'text',
    x: 263, y: 216, width: 139, height: 80, angle: 0,
    strokeColor: '#8b1a40', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1021, version: 2, versionNonce: 1021,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: 'BEAUTY\nskincare\nmakeup\nroutines',
    fontSize: 15, fontFamily: 1, textAlign: 'center', verticalAlign: 'top',
    containerId: null, originalText: 'BEAUTY\nskincare\nmakeup\nroutines',
    lineHeight: 1.5, baseline: 13,
  },

  // Lifestyle
  {
    id: 'sc_lif_box', type: 'rectangle',
    x: 430, y: 200, width: 155, height: 110, angle: 0,
    strokeColor: '#7050c0', backgroundColor: '#e8d4f5',
    fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: { type: 3, value: 8 },
    seed: 1030, version: 2, versionNonce: 1030,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
  },
  {
    id: 'sc_lif_txt', type: 'text',
    x: 438, y: 216, width: 139, height: 80, angle: 0,
    strokeColor: '#4020a0', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1031, version: 2, versionNonce: 1031,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: 'LIFESTYLE\nNigerian id.\ncollege life\ncareer + travel',
    fontSize: 15, fontFamily: 1, textAlign: 'center', verticalAlign: 'top',
    containerId: null, originalText: 'LIFESTYLE\nNigerian id.\ncollege life\ncareer + travel',
    lineHeight: 1.5, baseline: 13,
  },

  // Fashion (row 2)
  {
    id: 'sc_fsh_box', type: 'rectangle',
    x: 80, y: 330, width: 155, height: 110, angle: 0,
    strokeColor: '#c07020', backgroundColor: '#f5e8d0',
    fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: { type: 3, value: 8 },
    seed: 1040, version: 2, versionNonce: 1040,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
  },
  {
    id: 'sc_fsh_txt', type: 'text',
    x: 88, y: 346, width: 139, height: 80, angle: 0,
    strokeColor: '#8b5000', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1041, version: 2, versionNonce: 1041,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: 'FASHION\nOOTDs\nstyle tips\nAfrican prints',
    fontSize: 15, fontFamily: 1, textAlign: 'center', verticalAlign: 'top',
    containerId: null, originalText: 'FASHION\nOOTDs\nstyle tips\nAfrican prints',
    lineHeight: 1.5, baseline: 13,
  },

  // Faith
  {
    id: 'sc_fth_box', type: 'rectangle',
    x: 255, y: 330, width: 155, height: 110, angle: 0,
    strokeColor: '#c0a020', backgroundColor: '#f5f0d0',
    fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: { type: 3, value: 8 },
    seed: 1050, version: 2, versionNonce: 1050,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
  },
  {
    id: 'sc_fth_txt', type: 'text',
    x: 263, y: 346, width: 139, height: 80, angle: 0,
    strokeColor: '#8b7000', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1051, version: 2, versionNonce: 1051,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: 'FAITH\ndevo content\nfaith journey\nspirituality',
    fontSize: 15, fontFamily: 1, textAlign: 'center', verticalAlign: 'top',
    containerId: null, originalText: 'FAITH\ndevo content\nfaith journey\nspirituality',
    lineHeight: 1.5, baseline: 13,
  },

  // Travel
  {
    id: 'sc_trv_box', type: 'rectangle',
    x: 430, y: 330, width: 155, height: 110, angle: 0,
    strokeColor: '#2070c0', backgroundColor: '#d0e8f5',
    fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: { type: 3, value: 8 },
    seed: 1060, version: 2, versionNonce: 1060,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
  },
  {
    id: 'sc_trv_txt', type: 'text',
    x: 438, y: 346, width: 139, height: 80, angle: 0,
    strokeColor: '#0040a0', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1061, version: 2, versionNonce: 1061,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: 'TRAVEL\nvlogs\ndestinations\nstudy abroad',
    fontSize: 15, fontFamily: 1, textAlign: 'center', verticalAlign: 'top',
    containerId: null, originalText: 'TRAVEL\nvlogs\ndestinations\nstudy abroad',
    lineHeight: 1.5, baseline: 13,
  },

  // ── Storytelling note (slightly rotated, top-right) ────────────────────────
  {
    id: 'sc_story_bg', type: 'rectangle',
    x: 650, y: 160, width: 310, height: 230, angle: -0.035,
    strokeColor: '#e2c27d', backgroundColor: '#1e1a0a',
    fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid',
    roughness: 1, opacity: 95,
    groupIds: [], frameId: null, roundness: { type: 3, value: 6 },
    seed: 1065, version: 2, versionNonce: 1065,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
  },
  {
    id: 'sc_story_txt', type: 'text',
    x: 666, y: 178, width: 278, height: 196, angle: -0.035,
    strokeColor: '#e2c27d', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1066, version: 2, versionNonce: 1066,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: 'NEW PILLAR → STORYTELLING\n\nseries > one-off reels\nnarrative arc across eps\ncliffhangers drive follows\n\n"make them need the next one"',
    fontSize: 16, fontFamily: 1, textAlign: 'left', verticalAlign: 'top',
    containerId: null, originalText: 'NEW PILLAR → STORYTELLING\n\nseries > one-off reels\nnarrative arc across eps\ncliffhangers drive follows\n\n"make them need the next one"',
    lineHeight: 1.6, baseline: 14,
  },

  // ── Hook ideas ─────────────────────────────────────────────────────────────
  {
    id: 'sc_hooks_h', type: 'text',
    x: 80, y: 474, width: 180, height: 20, angle: 0,
    strokeColor: '#aaaaaa', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1070, version: 2, versionNonce: 1070,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: '── HOOK IDEAS ──',
    fontSize: 13, fontFamily: 2, textAlign: 'left', verticalAlign: 'top',
    containerId: null, originalText: '── HOOK IDEAS ──',
    lineHeight: 1.2, baseline: 11,
  },
  {
    id: 'sc_hooks_box', type: 'rectangle',
    x: 80, y: 504, width: 530, height: 148, angle: 0,
    strokeColor: '#444455', backgroundColor: '#12121e',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'dashed',
    roughness: 0, opacity: 95,
    groupIds: [], frameId: null, roundness: { type: 3, value: 6 },
    seed: 1071, version: 2, versionNonce: 1071,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
  },
  {
    id: 'sc_hooks_txt', type: 'text',
    x: 96, y: 516, width: 498, height: 124, angle: 0,
    strokeColor: '#c8c8e0', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1072, version: 2, versionNonce: 1072,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: '"I used to skip breakfast until I tried this..."\n"Three months of this and my skin changed"\n"It doesn\'t look like what you think"\n"Jollof rice in the UK hits different"\n"You\'ve been asking, I\'m finally answering"',
    fontSize: 14, fontFamily: 1, textAlign: 'left', verticalAlign: 'top',
    containerId: null, originalText: '"I used to skip breakfast until I tried this..."\n"Three months of this and my skin changed"\n"It doesn\'t look like what you think"\n"Jollof rice in the UK hits different"\n"You\'ve been asking, I\'m finally answering"',
    lineHeight: 1.6, baseline: 12,
  },

  // ── Lagos to London series ─────────────────────────────────────────────────
  {
    id: 'sc_series_h', type: 'text',
    x: 80, y: 686, width: 360, height: 20, angle: 0,
    strokeColor: '#aaaaaa', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1080, version: 2, versionNonce: 1080,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: '── SERIES: LAGOS TO LONDON ──',
    fontSize: 13, fontFamily: 2, textAlign: 'left', verticalAlign: 'top',
    containerId: null, originalText: '── SERIES: LAGOS TO LONDON ──',
    lineHeight: 1.2, baseline: 11,
  },
  {
    id: 'sc_series_txt', type: 'text',
    x: 80, y: 716, width: 500, height: 155, angle: 0,
    strokeColor: '#d4c0e2', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1081, version: 2, versionNonce: 1081,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: '✓  Ep 1: The night before the flight\n✓  Ep 2: First week culture shock\n✓  Ep 3: Finding my people\n→  Ep 4: What I wish I knew before leaving Lagos\n→  Ep 5: Building a life, not just a degree',
    fontSize: 16, fontFamily: 1, textAlign: 'left', verticalAlign: 'top',
    containerId: null, originalText: '✓  Ep 1: The night before the flight\n✓  Ep 2: First week culture shock\n✓  Ep 3: Finding my people\n→  Ep 4: What I wish I knew before leaving Lagos\n→  Ep 5: Building a life, not just a degree',
    lineHeight: 1.65, baseline: 14,
  },

  // ── Brand notes ────────────────────────────────────────────────────────────
  {
    id: 'sc_brand_h', type: 'text',
    x: 660, y: 474, width: 260, height: 20, angle: 0,
    strokeColor: '#aaaaaa', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1090, version: 2, versionNonce: 1090,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: '── BRAND NOTES ──',
    fontSize: 13, fontFamily: 2, textAlign: 'left', verticalAlign: 'top',
    containerId: null, originalText: '── BRAND NOTES ──',
    lineHeight: 1.2, baseline: 11,
  },
  {
    id: 'sc_gym_box', type: 'rectangle',
    x: 660, y: 504, width: 290, height: 78, angle: 0,
    strokeColor: '#2d9a5f', backgroundColor: '#0e1e14',
    fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: { type: 3, value: 6 },
    seed: 1091, version: 2, versionNonce: 1091,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
  },
  {
    id: 'sc_gym_txt', type: 'text',
    x: 672, y: 514, width: 266, height: 58, angle: 0,
    strokeColor: '#80e0b0', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1092, version: 2, versionNonce: 1092,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: 'GYMSHARK  ·  workout reel\ncode: BETTINA10  ·  due in 10 days',
    fontSize: 14, fontFamily: 1, textAlign: 'left', verticalAlign: 'middle',
    containerId: null, originalText: 'GYMSHARK  ·  workout reel\ncode: BETTINA10  ·  due in 10 days',
    lineHeight: 1.6, baseline: 12,
  },
  {
    id: 'sc_fenty_box', type: 'rectangle',
    x: 660, y: 600, width: 290, height: 78, angle: 0,
    strokeColor: '#c05080', backgroundColor: '#1e0e14',
    fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: { type: 3, value: 6 },
    seed: 1093, version: 2, versionNonce: 1093,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
  },
  {
    id: 'sc_fenty_txt', type: 'text',
    x: 672, y: 610, width: 266, height: 58, angle: 0,
    strokeColor: '#e080b0', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1094, version: 2, versionNonce: 1094,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: 'FENTY BEAUTY  ·  skincare reel\nHydra Vizor SPF  ·  products incoming',
    fontSize: 14, fontFamily: 1, textAlign: 'left', verticalAlign: 'middle',
    containerId: null, originalText: 'FENTY BEAUTY  ·  skincare reel\nHydra Vizor SPF  ·  products incoming',
    lineHeight: 1.6, baseline: 12,
  },
  {
    id: 'sc_asos_box', type: 'rectangle',
    x: 660, y: 696, width: 290, height: 78, angle: 0,
    strokeColor: '#888888', backgroundColor: '#1a1a1a',
    fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'dashed',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: { type: 3, value: 6 },
    seed: 1095, version: 2, versionNonce: 1095,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
  },
  {
    id: 'sc_asos_txt', type: 'text',
    x: 672, y: 706, width: 266, height: 58, angle: 0,
    strokeColor: '#aaaaaa', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100,
    groupIds: [], frameId: null, roundness: null,
    seed: 1096, version: 2, versionNonce: 1096,
    isDeleted: false, boundElements: null, updated: TS, link: null, locked: false,
    text: 'ASOS  ·  3 OOTDs + stories\n⚠ chase usage rights before signing',
    fontSize: 14, fontFamily: 1, textAlign: 'left', verticalAlign: 'middle',
    containerId: null, originalText: 'ASOS  ·  3 OOTDs + stories\n⚠ chase usage rights before signing',
    lineHeight: 1.6, baseline: 12,
  },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ScrapbookPage() {
  const { theme } = useTheme()
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const [cleared, setCleared] = useState(false)
  const [canSeed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const raw = localStorage.getItem('scrapbook_canvas')
      if (!raw) return true
      const { elements } = JSON.parse(raw)
      return !elements || elements.length === 0
    } catch { return true }
  })
  const [seeded, setSeeded] = useState(false)

  const handleClear = () => {
    if (!apiRef.current) return
    if (!window.confirm('Clear the entire canvas? This cannot be undone.')) return
    apiRef.current.resetScene()
    localStorage.removeItem('scrapbook_canvas')
    setCleared(true)
    setTimeout(() => setCleared(false), 2000)
  }

  const handleSeed = () => {
    if (!apiRef.current) return
    apiRef.current.updateScene({ elements: SAMPLE_ELEMENTS as any, files: {} as any })
    localStorage.setItem('scrapbook_canvas', JSON.stringify({ elements: SAMPLE_ELEMENTS, files: {} }))
    setSeeded(true)
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Creative <span>Scrapbook</span></div>
        </div>
        <div className="topbar-right">
          {(canSeed && !seeded) && (
            <button
              onClick={handleSeed}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '5px 12px',
                background: 'transparent', border: '1px solid var(--border-soft)',
                color: 'var(--text-muted)', borderRadius: 3, cursor: 'pointer',
              }}
            >
              Load sample data
            </button>
          )}
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
