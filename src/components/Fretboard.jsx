import { useState, useEffect, useRef } from 'react'
import { playRawNote as playNote } from '../lib/audio'
import './Fretboard.css'

const STRINGS      = 6
const STR_LABELS   = ['E', 'A', 'D', 'G', 'B', 'e']   // index 0 = low E
const TUNING_MIDI  = [40, 45, 50, 55, 59, 64]          // E2 A2 D3 G3 B3 E4
const MAX_FRETS    = 24
const MIN_FRET_W   = 36
const POS_MARKERS  = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
const DOUBLE_FRETS = new Set([12, 24])

// SVG layout (coordinates = CSS pixels after ResizeObserver converges)
const LEFT    = 42    // string labels + open/muted zone
const NUT     = 6     // nut width
const TOP     = 22    // space above top string (for fret numbers)
const STR_H   = 22    // vertical spacing between strings
const SVG_H   = TOP + (STRINGS - 1) * STR_H + 14   // 22 + 110 + 14 = 146

// e (string 5) at top, E (string 0) at bottom — guitar TAB orientation
const sY   = i  => TOP + (STRINGS - 1 - i) * STR_H
const fcx  = (vi, fw) => LEFT + NUT + vi * fw + fw / 2

export default function Fretboard({
  dots             = [],
  openStrings      = Array(6).fill(false),
  mutedStrings     = Array(6).fill(false),
  noteLabels       = Array(6).fill(null),
  interactive      = false,
  initialViewStart = 0,
  onDotsChange,
  onOpenMutedChange,
}) {
  const wrapRef = useRef(null)
  const [cw,        setCw]        = useState(300)
  const [viewStart, setViewStart] = useState(initialViewStart)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new ResizeObserver(([e]) => {
      const w = e.contentRect.width
      if (w > 0) setCw(w)
    })
    obs.observe(el)
    const w = el.getBoundingClientRect().width
    if (w > 0) setCw(w)
    return () => obs.disconnect()
  }, [])

  const visibleFrets = Math.max(5, Math.min(MAX_FRETS,
    Math.floor((cw - LEFT - NUT) / MIN_FRET_W)
  ))
  const fretW = (cw - LEFT - NUT) / visibleFrets

  const maxStart  = Math.max(0, MAX_FRETS - visibleFrets)
  const vs        = Math.min(viewStart, maxStart)
  const canLeft   = vs > 0
  const canRight  = vs + visibleFrets < MAX_FRETS
  const step      = Math.max(1, Math.floor(visibleFrets / 2))

  function navLeft()  { setViewStart(s => Math.max(0, Math.min(maxStart, s) - step)) }
  function navRight() { setViewStart(s => Math.min(maxStart, Math.min(maxStart, s) + step)) }

  function clickFret(si, fret) {
    if (!interactive || !onDotsChange) return
    const idx = dots.findIndex(d => d.string === si && d.fret === fret)
    if (idx !== -1) {
      onDotsChange(dots.filter((_, i) => i !== idx))
    } else {
      onDotsChange([...dots.filter(d => d.string !== si), { string: si, fret }])
      playNote(TUNING_MIDI[si] + fret)
      if (onOpenMutedChange && (mutedStrings[si] || openStrings[si])) {
        const no = [...openStrings]; no[si] = false
        const nm = [...mutedStrings]; nm[si] = false
        onOpenMutedChange(no, nm)
      }
    }
  }

  function clickLabel(si) {
    if (!interactive || !onOpenMutedChange) return
    const isOpen = openStrings[si], isMuted = mutedStrings[si]
    const no = [...openStrings], nm = [...mutedStrings]
    let   nd = [...dots]
    if (!isOpen && !isMuted) {
      no[si] = true; nm[si] = false
      nd = nd.filter(d => d.string !== si)
      playNote(TUNING_MIDI[si])
    } else if (isOpen) {
      no[si] = false; nm[si] = true
    } else {
      no[si] = false; nm[si] = false
    }
    onOpenMutedChange(no, nm)
    if (onDotsChange && nd.length !== dots.length) onDotsChange(nd)
  }

  return (
    <div className="fretboard-outer">
      <button className="fb-nav" onClick={navLeft} disabled={!canLeft} aria-label="Frets anteriores">◀</button>

      <div ref={wrapRef} className="fretboard-svg-wrap">
        <svg viewBox={`0 0 ${cw} ${SVG_H}`} style={{ width: '100%', height: SVG_H, display: 'block' }}>

          {/* ── String lines ── */}
          {Array.from({ length: STRINGS }, (_, i) => (
            <line key={`s${i}`}
              x1={LEFT + NUT} y1={sY(i)} x2={cw} y2={sY(i)}
              stroke="var(--text-muted)"
              strokeWidth={Math.max(0.7, 2.4 - i * 0.34)}
            />
          ))}

          {/* ── Nut ── */}
          <rect
            x={LEFT} y={sY(STRINGS - 1)}
            width={NUT} height={sY(0) - sY(STRINGS - 1)}
            fill={vs === 0 ? 'var(--text)' : 'var(--border)'}
          />

          {/* ── Fret position indicator (when not at fret 1) ── */}
          {vs > 0 && (
            <text x={LEFT / 2} y={TOP - 6}
              fontSize="8" fill="var(--gold)" textAnchor="middle"
              fontFamily="var(--font-ui)" fontWeight="700"
            >{vs + 1}fr</text>
          )}

          {/* ── Fret bars ── */}
          {Array.from({ length: visibleFrets }, (_, k) => (
            <line key={`fb${k}`}
              x1={LEFT + NUT + (k + 1) * fretW} y1={sY(0)}
              x2={LEFT + NUT + (k + 1) * fretW} y2={sY(STRINGS - 1)}
              stroke="var(--border)" strokeWidth="1"
            />
          ))}

          {/* ── Fret numbers (above top string) ── */}
          {Array.from({ length: visibleFrets }, (_, k) => {
            const f = vs + k + 1
            return (
              <text key={`fn${k}`}
                x={fcx(k, fretW)} y={TOP - 6}
                fontSize="9" fill="var(--text-muted)" textAnchor="middle"
                fontFamily="var(--font-ui)"
              >{f}</text>
            )
          })}

          {/* ── Position markers ── */}
          {POS_MARKERS.map(f => {
            const vi = f - vs - 1
            if (vi < 0 || vi >= visibleFrets) return null
            const cx = fcx(vi, fretW)
            if (DOUBLE_FRETS.has(f)) {
              return [
                <circle key={`pma${f}`} cx={cx} cy={sY(4) + STR_H * 0.5} r={Math.min(4, fretW * 0.1)} fill="var(--border)" />,
                <circle key={`pmb${f}`} cx={cx} cy={sY(2) + STR_H * 0.5} r={Math.min(4, fretW * 0.1)} fill="var(--border)" />,
              ]
            }
            return (
              <circle key={`pm${f}`} cx={cx} cy={(sY(2) + sY(3)) / 2}
                r={Math.min(4, fretW * 0.1)} fill="var(--border)" />
            )
          })}

          {/* ── String labels + open/muted indicators ── */}
          {Array.from({ length: STRINGS }, (_, i) => {
            const y = sY(i)
            const isOpen = openStrings[i], isMuted = mutedStrings[i]
            return (
              <g key={`lbl${i}`}>
                <text x={9} y={y}
                  fontSize="11" fill="var(--text-muted)" textAnchor="middle" dominantBaseline="middle"
                  fontFamily="var(--font-ui)" fontWeight="600"
                >{STR_LABELS[i]}</text>

                {isMuted && (
                  <text x={LEFT - 9} y={y}
                    fontSize="13" fill="var(--text-muted)" textAnchor="middle" dominantBaseline="middle"
                    fontFamily="var(--font-ui)"
                  >×</text>
                )}
                {isOpen && (
                  <circle cx={LEFT - 9} cy={y} r={5}
                    fill="none" stroke="var(--text)" strokeWidth="1.5" />
                )}

                {interactive && (
                  <rect x={0} y={y - STR_H / 2} width={LEFT - 2} height={STR_H}
                    fill="transparent" style={{ cursor: 'pointer' }}
                    onClick={() => clickLabel(i)}
                  />
                )}
              </g>
            )
          })}

          {/* ── Interactive click cells ── */}
          {interactive && Array.from({ length: STRINGS }, (_, si) =>
            Array.from({ length: visibleFrets }, (_, k) => (
              <rect key={`c${si}${k}`}
                x={LEFT + NUT + k * fretW + 2} y={sY(si) - STR_H / 2}
                width={fretW - 4} height={STR_H}
                fill="transparent" style={{ cursor: 'pointer' }}
                onClick={() => clickFret(si, vs + k + 1)}
              />
            ))
          )}

          {/* ── Fretted dots ── */}
          {dots.map((dot, idx) => {
            const vi = dot.fret - vs - 1
            if (vi < 0 || vi >= visibleFrets) return null
            const cx = fcx(vi, fretW)
            const cy = sY(dot.string)
            const label = noteLabels[dot.string]
            const r = Math.min(9, STR_H * 0.42)
            return (
              <g key={`dot${idx}`}
                onClick={interactive ? () => clickFret(dot.string, dot.fret) : undefined}
                style={interactive ? { cursor: 'pointer' } : {}}
              >
                <circle cx={cx} cy={cy} r={r} fill="var(--gold)" />
                {label && (
                  <text x={cx} y={cy}
                    fontSize="8" fill="#001E2B" textAnchor="middle" dominantBaseline="middle"
                    fontFamily="var(--font-ui)" fontWeight="700"
                  >{label}</text>
                )}
              </g>
            )
          })}

        </svg>
      </div>

      <button className="fb-nav" onClick={navRight} disabled={!canRight} aria-label="Frets siguientes">▶</button>
    </div>
  )
}
