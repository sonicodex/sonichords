import { getScale, GREEK_MODES } from '../lib/musicTheory'
import './NoteGrid.css'

// 13-column piano-key layout
// Naturals on odd cols (1,3,5,7,9,11,13), accidentals on even cols (2,4,6,8,10,12)
const ROW1 = [
  { note: 'C#', col: 2  },
  { note: 'D#', col: 4  },
  { note: null, col: 6  }, // gap: no E#
  { note: 'F#', col: 8  },
  { note: 'G#', col: 10 },
  { note: 'A#', col: 12 },
]

const ROW2 = [
  { note: 'C', col: 1  },
  { note: 'D', col: 3  },
  { note: 'E', col: 5  },
  { note: 'F', col: 7  },
  { note: 'G', col: 9  },
  { note: 'A', col: 11 },
  { note: 'B', col: 13 },
]

const ROW3 = [
  { note: 'Db', col: 2  },
  { note: 'Eb', col: 4  },
  { note: null, col: 6  }, // gap: no Fb
  { note: 'Gb', col: 8  },
  { note: 'Ab', col: 10 },
  { note: 'Bb', col: 12 },
]

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function NoteGrid({ selectedNote, setSelectedNote, selectedMode, onBack }) {
  // Exact-string membership: A# and Bb are distinct cells
  const scale = selectedNote ? getScale(selectedNote, selectedMode) : []
  const modeColor = GREEK_MODES[selectedMode]?.color || '#ED8B16'

  function getCellState(note) {
    if (!note) return 'spacer'
    if (!selectedNote) return 'neutral'
    if (note === selectedNote) return 'tonic'
    if (scale.includes(note)) return 'in-scale'
    return 'out-scale'
  }

  function renderCell(note, col, row) {
    const state = getCellState(note)
    const key = `${row}-${col}`

    const gridStyle = { gridColumn: col, gridRow: row }

    if (state === 'spacer') {
      return <div key={key} className="note-cell spacer" style={gridStyle} />
    }

    const colorStyle = state === 'in-scale'
      ? {
          background: hexToRgba(modeColor, 0.15),
          borderColor: hexToRgba(modeColor, 0.45),
          color: modeColor,
        }
      : {}

    return (
      <button
        key={key}
        className={`note-cell ${state}`}
        style={{ ...gridStyle, ...colorStyle }}
        onClick={() => setSelectedNote(note === selectedNote ? null : note)}
      >
        {note}
      </button>
    )
  }

  return (
    <div className="note-grid-wrap">
      {/* Mode header — tap "Relativa" to switch back */}
      <div className="note-grid-header">
        <button className="note-grid-mode-pill" onClick={onBack}>
          Relativa
        </button>
        <span className="note-grid-mode-pill active">Escala</span>
      </div>

      <div className="note-grid">
        {ROW1.map(({ note, col }) => renderCell(note, col, 1))}
        {ROW2.map(({ note, col }) => renderCell(note, col, 2))}
        {ROW3.map(({ note, col }) => renderCell(note, col, 3))}
      </div>
    </div>
  )
}
