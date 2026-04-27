import { useState } from 'react'
import {
  CIRCLE_NOTES,
  RELATIVE_MINORS,
  GREEK_MODES,
  KEY_SIGNATURES,
  formatKeySignature,
  getScale,
  getDiatonicChords,
  getRelations,
  normalizeNote,
} from '../lib/musicTheory'
import NoteGrid from './NoteGrid'
import './CircleOfFifths.css'

// ── Geometry ──────────────────────────────────────────────────────────────────
const CX = 220
const CY = 220
const R_KEY_OUT = 215   // armadura ring outer
const R_KEY_IN  = 190   // armadura ring inner / major ring outer
const R_MAJ_OUT = 190
const R_MAJ_IN  = 140
const R_MIN_OUT = 140
const R_MIN_IN  = 100
const R_DEG_OUT = 100
const R_DEG_IN  = 62
const GAP_DEG   = 1.5

function polar(cx, cy, r, angleDeg) {
  const rad = angleDeg * Math.PI / 180
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }
}

function segmentPath(cx, cy, rIn, rOut, startDeg, endDeg) {
  const p1 = polar(cx, cy, rOut, startDeg)
  const p2 = polar(cx, cy, rOut, endDeg)
  const p3 = polar(cx, cy, rIn,  endDeg)
  const p4 = polar(cx, cy, rIn,  startDeg)
  const large = (endDeg - startDeg > 180) ? 1 : 0
  const f = n => n.toFixed(3)
  return [
    `M ${f(p1.x)} ${f(p1.y)}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${f(p2.x)} ${f(p2.y)}`,
    `L ${f(p3.x)} ${f(p3.y)}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${f(p4.x)} ${f(p4.y)}`,
    'Z',
  ].join(' ')
}

function midPoint(cx, cy, r, angleDeg) {
  return polar(cx, cy, r, angleDeg)
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function getDegreeLabel(circleIdx, root, mode) {
  if (!root) return null
  const scale = getScale(root, mode)
  const chords = getDiatonicChords(scale, mode)
  const noteAtPos = CIRCLE_NOTES[circleIdx]
  const degIdx = scale.findIndex(n => normalizeNote(n) === normalizeNote(noteAtPos))
  if (degIdx === -1) return null
  return chords[degIdx]?.degree ?? null
}

// ── Harmonic family colors (circle relative mode) ─────────────────────────────
const C_TONIC      = '#ED8B16'
const C_DOMINANT   = '#00A896'
const C_SUBDOMINANT = '#1A7FAF'
const C_RELATIVE   = '#C2BB00'  // inner ring selected
const C_BG         = '#001E2B'
const C_TEXT       = '#1A1A1A'

// ── Component ─────────────────────────────────────────────────────────────────
export default function CircleOfFifths({
  selectedNote,
  setSelectedNote,
  selectedMode,
  setSelectedMode,
}) {
  const [innerRingMode, setInnerRingMode] = useState('relative')

  const relations  = selectedNote ? getRelations(selectedNote) : null
  const selectedIdx = selectedNote
    ? CIRCLE_NOTES.findIndex(n => normalizeNote(n) === normalizeNote(selectedNote))
    : -1

  // ── Color helpers ────────────────────────────────────────────────────────────
  function getMajorFill(i) {
    const nn = normalizeNote(CIRCLE_NOTES[i])
    if (!selectedNote || !relations) return 'rgba(0,0,0,0.06)'
    if (nn === normalizeNote(selectedNote))           return C_TONIC
    if (nn === normalizeNote(relations.dominant))     return C_DOMINANT
    if (nn === normalizeNote(relations.subdominant))  return C_SUBDOMINANT
    return 'rgba(0,0,0,0.06)'
  }

  function getMajorGlow(i) {
    if (!selectedNote) return undefined
    const nn = normalizeNote(CIRCLE_NOTES[i])
    if (nn === normalizeNote(selectedNote)) return `drop-shadow(0 0 10px ${C_TONIC})`
    if (nn === normalizeNote(relations?.dominant)) return `drop-shadow(0 0 6px ${C_DOMINANT})`
    return undefined
  }

  function getMajorTextColor(i) {
    const nn = normalizeNote(CIRCLE_NOTES[i])
    if (!selectedNote) return 'rgba(26,26,26,0.65)'
    if (nn === normalizeNote(selectedNote))            return C_BG
    if (nn === normalizeNote(relations?.dominant))     return C_TEXT
    if (nn === normalizeNote(relations?.subdominant))  return C_TEXT
    return 'rgba(26,26,26,0.45)'
  }

  function getInnerFill(i) {
    if (!selectedNote) return 'rgba(0,0,0,0.04)'
    if (i === selectedIdx) return hexToRgba(C_RELATIVE, 0.28)
    return 'rgba(0,0,0,0.04)'
  }

  function getInnerTextColor(i) {
    if (!selectedNote) return 'rgba(26,26,26,0.4)'
    return i === selectedIdx ? C_RELATIVE : 'rgba(26,26,26,0.4)'
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="circle-of-fifths">

      {/* Mode selector */}
      <div className="mode-section">
        <div className="mode-selector">
          {Object.entries(GREEK_MODES).map(([key, { label, color }]) => {
            const isActive = selectedMode === key
            return (
              <button
                key={key}
                className={`mode-pill${isActive ? ' active' : ''}`}
                style={isActive ? { background: color, borderColor: color, color: 'var(--bg)' } : {}}
                onClick={() => setSelectedMode(key)}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p className="mode-mood-line">
          <span className="mood-dot" style={{ color: GREEK_MODES[selectedMode]?.color }}>●</span>
          {GREEK_MODES[selectedMode]?.mood}
        </p>
      </div>

      {/* SVG */}
      <div className="circle-svg-wrap">
        <svg viewBox="0 0 440 440" className="circle-svg" aria-label="Círculo de quintas">

          {/* ── Armadura ring (outer, no interaction) ── */}
          {CIRCLE_NOTES.map((note, i) => {
            const ca = i * 30
            const keySig   = KEY_SIGNATURES[note] ?? 0
            const keySigFmt = formatKeySignature(keySig)
            const textPos   = midPoint(CX, CY, (R_KEY_IN + R_KEY_OUT) / 2, ca)
            return (
              <g key={`key-${note}`}>
                <path
                  d={segmentPath(CX, CY, R_KEY_IN, R_KEY_OUT, ca - 15 + GAP_DEG, ca + 15 - GAP_DEG)}
                  fill="rgba(26,26,26,0.05)"
                  stroke="rgba(0,0,0,0.12)"
                  strokeWidth="0.5"
                />
                <text
                  x={textPos.x}
                  y={textPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(26,26,26,0.4)"
                  fontSize="10"
                  fontFamily="var(--font-ui)"
                  style={{ pointerEvents: 'none' }}
                >
                  {keySigFmt}
                </text>
              </g>
            )
          })}

          {/* ── Major ring (interactive) ── */}
          {CIRCLE_NOTES.map((note, i) => {
            const ca       = i * 30
            const fill     = getMajorFill(i)
            const glow     = getMajorGlow(i)
            const textClr  = getMajorTextColor(i)
            const textPos  = midPoint(CX, CY, (R_MAJ_IN + R_MAJ_OUT) / 2, ca)
            const isActive = selectedNote && normalizeNote(note) === normalizeNote(selectedNote)
            return (
              <g
                key={`maj-${note}`}
                onClick={() => setSelectedNote(note === selectedNote ? null : note)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={segmentPath(CX, CY, R_MAJ_IN, R_MAJ_OUT, ca - 15 + GAP_DEG, ca + 15 - GAP_DEG)}
                  fill={fill}
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth="0.5"
                  style={{ filter: glow, transition: 'filter 300ms ease, fill 300ms ease' }}
                />
                <text
                  x={textPos.x}
                  y={textPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={textClr}
                  fontSize={note.length > 1 ? '15' : '17'}
                  fontFamily="var(--font-ui)"
                  fontWeight={isActive ? '700' : '500'}
                  style={{ pointerEvents: 'none', transition: 'fill 300ms ease' }}
                >
                  {note}
                </text>
              </g>
            )
          })}

          {/* ── Minor / scale ring ── */}
          {CIRCLE_NOTES.map((note, i) => {
            const ca         = i * 30
            const fill       = getInnerFill(i)
            const textClr    = getInnerTextColor(i)
            const textPos    = midPoint(CX, CY, (R_MIN_IN + R_MIN_OUT) / 2, ca)
            const relMinLabel = RELATIVE_MINORS[note] || ''
            const label = relMinLabel

            const handleMinorClick = relMinLabel
              ? () => {
                  const minorRoot = relMinLabel.replace('m', '')
                  setSelectedNote(minorRoot)
                  setSelectedMode('Aeolian')
                }
              : null

            return (
              <g
                key={`min-${note}`}
                onClick={handleMinorClick || undefined}
                style={handleMinorClick ? { cursor: 'pointer' } : {}}
              >
                <path
                  d={segmentPath(CX, CY, R_MIN_IN, R_MIN_OUT, ca - 15 + GAP_DEG, ca + 15 - GAP_DEG)}
                  fill={fill}
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth="0.5"
                  style={{ transition: 'fill 300ms ease' }}
                />
                {label && (
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={textClr}
                    fontSize="12"
                    fontFamily="var(--font-ui)"
                    style={{ pointerEvents: 'none', transition: 'fill 300ms ease' }}
                  >
                    {label}
                  </text>
                )}
              </g>
            )
          })}

          {/* ── Degree reference ring ── */}
          {CIRCLE_NOTES.map((note, i) => {
            const ca       = i * 30
            const degLabel = getDegreeLabel(i, selectedNote, selectedMode)
            const textPos  = midPoint(CX, CY, (R_DEG_IN + R_DEG_OUT) / 2, ca)
            const isTonic  = selectedNote && i === selectedIdx
            const degFill  = selectedNote ? 'rgba(26,26,26,0.88)' : 'rgba(26,26,26,0.06)'
            const degText  = selectedNote
              ? (isTonic ? C_TONIC : 'rgba(255,255,255,0.82)')
              : 'rgba(26,26,26,0.72)'
            return (
              <g key={`deg-${note}`}>
                <path
                  d={segmentPath(CX, CY, R_DEG_IN, R_DEG_OUT, ca - 15 + GAP_DEG, ca + 15 - GAP_DEG)}
                  fill={degFill}
                  stroke="rgba(0,0,0,0.14)"
                  strokeWidth="0.5"
                  style={{ transition: 'fill 300ms ease' }}
                />
                {degLabel && (
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={degText}
                    fontSize="11"
                    fontFamily="var(--font-ui)"
                    fontWeight={isTonic ? '700' : '400'}
                    style={{ pointerEvents: 'none', transition: 'fill 300ms ease' }}
                  >
                    {degLabel}
                  </text>
                )}
              </g>
            )
          })}

          {/* ── Center circle ── */}
          <circle
            cx={CX} cy={CY} r={R_DEG_IN - 1}
            fill="var(--bg)"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="0.5"
          />

          {selectedNote ? (
            <g>
              <text
                x={CX} y={CY - 9}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--gold)"
                fontSize="26"
                fontFamily="var(--font-ui)"
                fontWeight="700"
                style={{ pointerEvents: 'none' }}
              >
                {selectedNote}
              </text>
              <text
                x={CX} y={CY + 11}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--text-muted)"
                fontSize="10"
                fontFamily="var(--font-ui)"
                style={{ pointerEvents: 'none' }}
              >
                {GREEK_MODES[selectedMode]?.label}
              </text>
              <g onClick={() => setSelectedNote(null)} style={{ cursor: 'pointer' }}>
                <circle cx={CX} cy={CY + 30} r="10" fill="rgba(0,0,0,0.07)" />
                <text
                  x={CX} y={CY + 30}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(26,26,26,0.6)"
                  fontSize="14"
                  style={{ userSelect: 'none' }}
                >
                  ×
                </text>
              </g>
            </g>
          ) : (
            <text
              x={CX} y={CY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(26,26,26,0.12)"
              fontSize="10"
              fontFamily="var(--font-ui)"
              letterSpacing="3"
              style={{ pointerEvents: 'none' }}
            >
              SONICHORDS
            </text>
          )}
        </svg>
      </div>

      {/* Inner ring toggle (relative mode) or NoteGrid (scale mode) */}
      {innerRingMode === 'relative' ? (
        <div className="inner-ring-toggle">
          <button
            className="ring-toggle-pill active"
            onClick={() => setInnerRingMode('relative')}
          >
            Relativa
          </button>
          <button
            className="ring-toggle-pill"
            onClick={() => setInnerRingMode('scale')}
          >
            Escala
          </button>
        </div>
      ) : (
        <NoteGrid
          selectedNote={selectedNote}
          setSelectedNote={setSelectedNote}
          selectedMode={selectedMode}
          onBack={() => setInnerRingMode('relative')}
        />
      )}

      {/* Legend — only in relative mode */}
      {selectedNote && innerRingMode === 'relative' && (
        <div className="circle-legend">
          <span className="legend-item legend-tonic">Tónica</span>
          <span className="legend-item legend-dominant">Dominante</span>
          <span className="legend-item legend-subdominant">Subdominante</span>
          <span className="legend-item legend-relative">Relativa m.</span>
        </div>
      )}
    </div>
  )
}
