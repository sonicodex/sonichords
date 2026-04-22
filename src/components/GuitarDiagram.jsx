import './GuitarDiagram.css'

const STRING_X = [20, 50, 80, 110, 140, 170]
const FRET_Y   = [30, 66, 102, 138, 174, 210]

// Fret markers at standard positions (on the diagram grid, these are for C voicings)
// Not applicable to transposed diagrams — skip them for simplicity.

export default function GuitarDiagram({
  dots = [],
  openStrings = [false, false, false, false, false, false],
  mutedStrings = [false, false, false, false, false, false],
  fretOffset = 0,
  fingerNumbers = [null, null, null, null, null, null],
  interactive = false,
  onDotsChange,
  onOpenMutedChange,
}) {
  const nutStrokeWidth = fretOffset === 0 ? 4 : 1.5
  const nutColor = fretOffset === 0 ? 'var(--text)' : 'var(--text-muted)'

  function handleGridClick(stringIdx, fretIdx) {
    if (!interactive || !onDotsChange) return
    const existing = dots.findIndex(d => d.string === stringIdx && d.fret === fretIdx)
    if (existing !== -1) {
      // Eliminar dot — dejar estado de la cuerda sin cambios
      onDotsChange(dots.filter((_, i) => i !== existing))
    } else {
      // Añadir dot — si la cuerda estaba muted u open, limpiar ese estado
      const filtered = dots.filter(d => d.string !== stringIdx)
      onDotsChange([...filtered, { string: stringIdx, fret: fretIdx }])
      if (onOpenMutedChange && (mutedStrings[stringIdx] || openStrings[stringIdx])) {
        const newOpen  = [...openStrings]
        const newMuted = [...mutedStrings]
        newOpen[stringIdx]  = false
        newMuted[stringIdx] = false
        onOpenMutedChange(newOpen, newMuted)
      }
    }
  }

  function handleNutAreaClick(stringIdx) {
    if (!interactive || !onOpenMutedChange) return
    // Cycle: fretted → open → muted → fretted
    const isOpen  = openStrings[stringIdx]
    const isMuted = mutedStrings[stringIdx]
    const hasDot  = dots.some(d => d.string === stringIdx)

    const newOpen   = [...openStrings]
    const newMuted  = [...mutedStrings]
    let   newDots   = [...dots]

    if (!isOpen && !isMuted) {
      // fretted or nothing → open
      newOpen[stringIdx]  = true
      newMuted[stringIdx] = false
      newDots = newDots.filter(d => d.string !== stringIdx)
    } else if (isOpen) {
      // open → muted
      newOpen[stringIdx]  = false
      newMuted[stringIdx] = true
    } else {
      // muted → clear (normal fretted)
      newOpen[stringIdx]  = false
      newMuted[stringIdx] = false
    }

    onOpenMutedChange(newOpen, newMuted)
    if (onDotsChange && newDots.length !== dots.length) onDotsChange(newDots)
  }

  return (
    <svg
      className="guitar-diagram-svg"
      viewBox="0 0 200 240"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* String lines */}
      {STRING_X.map((x, i) => (
        <line
          key={`str-${i}`}
          x1={x} y1={30} x2={x} y2={210}
          stroke="var(--text-muted)"
          strokeWidth="1.2"
        />
      ))}

      {/* Fret lines */}
      {FRET_Y.slice(1).map((y, i) => (
        <line
          key={`fret-${i}`}
          x1={20} y1={y} x2={170} y2={y}
          stroke="var(--border)"
          strokeWidth="1"
        />
      ))}

      {/* Nut */}
      <line
        x1={20} y1={30} x2={170} y2={30}
        stroke={nutColor}
        strokeWidth={nutStrokeWidth}
        strokeLinecap="square"
      />

      {/* Fret offset label */}
      {fretOffset > 0 && (
        <text
          x={8} y={54}
          fontSize="10"
          fill="var(--text-muted)"
          textAnchor="middle"
          fontFamily="var(--font-ui)"
        >
          {fretOffset}fr
        </text>
      )}

      {/* Open / muted string indicators */}
      {STRING_X.map((x, i) => {
        if (mutedStrings[i]) {
          return (
            <text
              key={`mut-${i}`}
              x={x} y={19}
              fontSize="14"
              fill="var(--text-muted)"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-ui)"
              style={interactive ? { cursor: 'pointer' } : {}}
              onClick={() => handleNutAreaClick(i)}
            >
              ×
            </text>
          )
        }
        if (openStrings[i]) {
          return (
            <circle
              key={`open-${i}`}
              cx={x} cy={18} r={5}
              fill="none"
              stroke="var(--text)"
              strokeWidth="1.5"
              style={interactive ? { cursor: 'pointer' } : {}}
              onClick={() => handleNutAreaClick(i)}
            />
          )
        }
        if (interactive) {
          return (
            <rect
              key={`tap-${i}`}
              x={x - 12} y={6} width={24} height={22}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={() => handleNutAreaClick(i)}
            />
          )
        }
        return null
      })}

      {/* Interactive grid click areas */}
      {interactive && STRING_X.map((x, si) =>
        [1, 2, 3, 4, 5].map(fi => (
          <rect
            key={`cell-${si}-${fi}`}
            x={x - 15}
            y={FRET_Y[fi - 1] + 2}
            width={30}
            height={FRET_Y[fi] - FRET_Y[fi - 1] - 4}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={() => handleGridClick(si, fi)}
          />
        ))
      )}

      {/* Fretted dots */}
      {dots.map((dot, idx) => {
        const x = STRING_X[dot.string]
        const y = FRET_Y[dot.fret - 1] + (FRET_Y[dot.fret] - FRET_Y[dot.fret - 1]) / 2
        const finger = fingerNumbers[dot.string]
        return (
          <g key={`dot-${idx}`}>
            <circle
              cx={x} cy={y} r={11}
              fill="var(--gold)"
            />
            {finger !== null && (
              <text
                x={x} y={y}
                fontSize="11"
                fill="#001E2B"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-ui)"
                fontWeight="700"
              >
                {finger}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
