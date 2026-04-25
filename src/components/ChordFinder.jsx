import { useState, useMemo } from 'react'
import { getChordsByRoot, searchChords, ROOTS } from '../lib/chordLibrary'
import { dotsToNotes, getBassNote, identifyChord } from '../lib/chordIdentifier'
import GuitarDiagram from './GuitarDiagram'
import './ChordFinder.css'

// ── helpers ──────────────────────────────────────────────────────────────────

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const _NS = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 }
const TUNING_MIDI = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'].map(s => {
  const m = s.match(/^([A-G]#?)(\d+)$/)
  return _NS[m[1]] + (parseInt(m[2]) + 1) * 12
})

// fretOffset convention: library uses "fretOffset fr" as the starting fret (diagram fret 1 = fretOffset fr)
// so actualFret = dot.fret + max(0, fretOffset - 1)
function libraryNoteLabels(voicing) {
  const labels = Array(6).fill(null)
  voicing.dots.forEach(dot => {
    const actualFret = dot.fret + Math.max(0, voicing.fretOffset - 1)
    labels[dot.string] = CHROMATIC[(TUNING_MIDI[dot.string] + actualFret) % 12]
  })
  return labels
}

// Interactive convention: fretOffset is added directly (actualFret = dot.fret + fretOffset)
function interactiveNoteLabels(dots, fretOffset) {
  const labels = Array(6).fill(null)
  dots.forEach(dot => {
    labels[dot.string] = CHROMATIC[(TUNING_MIDI[dot.string] + dot.fret + fretOffset) % 12]
  })
  return labels
}

function normalizeQuery(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  return trimmed
    .replace(/°/g, 'dim')
    .replace(/\+/g, 'aug')
    .replace(/\bM7\b/g, 'maj7')
    .replace(/^([A-Gb]{1,2}[b#]?)M(\d*)$/, '$1maj$2') // CM → Cmaj
}

// ── sub-components ───────────────────────────────────────────────────────────

function ChordCard({ chord, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const voicing = chord.voicings[0]

  return (
    <div className="chord-card" onClick={() => setExpanded(e => !e)}>
      <div className="chord-card-header">
        <span className="chord-card-name">{chord.name}</span>
        <span className="chord-card-type">{chord.fullName.split(' ').slice(1).join(' ')}</span>
        <span className="chord-card-notes">{chord.notes.join(' – ')}</span>
        <span className="chord-card-chevron">{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && voicing && (
        <div className="chord-card-diagram" onClick={e => e.stopPropagation()}>
          <GuitarDiagram
            dots={voicing.dots}
            openStrings={voicing.openStrings}
            mutedStrings={voicing.mutedStrings}
            fretOffset={voicing.fretOffset}
            noteLabels={libraryNoteLabels(voicing)}
          />
        </div>
      )}
    </div>
  )
}

// ── Diccionario ───────────────────────────────────────────────────────────────

function Diccionario() {
  const [selectedRoot, setSelectedRoot] = useState('C')

  const chords = useMemo(
    () => getChordsByRoot(selectedRoot),
    [selectedRoot],
  )

  return (
    <div className="finder-section">
      {/* Root pills */}
      <div className="root-pills-wrap">
        <div className="root-pills">
          {ROOTS.map(root => (
            <button
              key={root}
              className={`root-pill${root === selectedRoot ? ' active' : ''}`}
              onClick={() => setSelectedRoot(root)}
            >
              {root}
            </button>
          ))}
        </div>
      </div>

      {/* Chord list */}
      <div className="chord-list">
        {chords.map(chord => (
          <ChordCard key={chord.name + chord.type} chord={chord} />
        ))}
      </div>
    </div>
  )
}

// ── Buscar ────────────────────────────────────────────────────────────────────

function Buscar() {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const norm = normalizeQuery(query)
    if (!norm) return []
    return searchChords(norm).slice(0, 24)
  }, [query])

  return (
    <div className="finder-section">
      <div className="search-bar-wrap">
        <input
          className="search-bar"
          type="text"
          placeholder="Ej: Cm7, F#maj7, Bb9..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery('')}>×</button>
        )}
      </div>

      {query && results.length === 0 && (
        <p className="search-empty">No se encontraron acordes para "{query}"</p>
      )}

      {!query && (
        <p className="search-hint">Escribe el nombre de un acorde para buscarlo</p>
      )}

      <div className="chord-list">
        {results.map(chord => (
          <ChordCard key={chord.name + chord.type} chord={chord} />
        ))}
      </div>
    </div>
  )
}

// ── Identificar ───────────────────────────────────────────────────────────────

const EMPTY_DOTS    = []
const EMPTY_OPEN    = [false, false, false, false, false, false]
const EMPTY_MUTED   = [true,  false, false, false, false, false]
const EMPTY_FINGERS = [null,  null,  null,  null,  null,  null]

function Identificar() {
  const [dots,        setDots]        = useState(EMPTY_DOTS)
  const [openStrings, setOpenStrings] = useState([...EMPTY_OPEN])
  const [mutedStrings,setMutedStrings]= useState([...EMPTY_MUTED])
  const [fretOffset,  setFretOffset]  = useState(0)

  function handleOpenMutedChange(newOpen, newMuted) {
    setOpenStrings(newOpen)
    setMutedStrings(newMuted)
  }

  // Sólo procesar notas si el usuario ha colocado al menos un dot o marcado una cuerda open
  // explícitamente, para evitar identificar el estado vacío inicial.
  const hasInput = dots.length > 0 || openStrings.some(Boolean)

  const pitchClasses = useMemo(
    () => hasInput ? dotsToNotes(dots, openStrings, mutedStrings, fretOffset) : [],
    [hasInput, dots, openStrings, mutedStrings, fretOffset],
  )

  const bassNote = useMemo(
    () => hasInput ? getBassNote(dots, openStrings, mutedStrings, fretOffset) : null,
    [hasInput, dots, openStrings, mutedStrings, fretOffset],
  )

  const match = useMemo(() => identifyChord(pitchClasses, bassNote), [pitchClasses, bassNote])

  // Notación estándar de 6 caracteres: cuerda 6 → cuerda 1
  // Cada cuerda: 'x' muted, número de traste absoluto, o '0' (abierta/neutral)
  const positionNotation = useMemo(() => {
    const chars = Array.from({ length: 6 }, (_, i) => {
      if (mutedStrings[i]) return 'x'
      const dot = dots.find(d => d.string === i)
      if (!dot) return '0'   // abierta o neutral → cuerda suena al aire
      return String(dot.fret + fretOffset)
    })
    // Si algún valor tiene 2 dígitos, separar con espacios para legibilidad
    return chars.some(c => c.length > 1) ? chars.join(' ') : chars.join('')
  }, [dots, mutedStrings, fretOffset])

  const noteLabels = useMemo(
    () => interactiveNoteLabels(dots, fretOffset),
    [dots, fretOffset],
  )

  function handleReset() {
    setDots([...EMPTY_DOTS])
    setOpenStrings([...EMPTY_OPEN])
    setMutedStrings([...EMPTY_MUTED])
    setFretOffset(0)
  }

  return (
    <div className="finder-section identifier-section">
      <div className="identifier-diagram-wrap">
        <div className="guitar-diagram-wrap">
          <GuitarDiagram
            dots={dots}
            openStrings={openStrings}
            mutedStrings={mutedStrings}
            fretOffset={fretOffset}
            noteLabels={noteLabels}
            interactive
            onDotsChange={setDots}
            onOpenMutedChange={handleOpenMutedChange}
          />
          <p className="position-notation">{positionNotation}</p>
          <div className="diagram-nav">
            <button
              onClick={() => setFretOffset(f => Math.max(0, f - 1))}
              disabled={fretOffset === 0}
              aria-label="Bajar posición"
            >▼</button>
            <input
              type="number"
              className="fret-offset-input"
              min={0}
              max={12}
              value={fretOffset}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) setFretOffset(Math.max(0, Math.min(12, v)))
              }}
              aria-label="Traste base"
            />
            <button
              onClick={() => setFretOffset(f => Math.min(12, f + 1))}
              aria-label="Subir posición"
            >▲</button>
            <button onClick={handleReset} className="diagram-reset">Reset</button>
          </div>
        </div>
      </div>

      <div className="identifier-result">
        {pitchClasses.length === 0 && (
          <p className="identifier-hint">
            Toca las cuerdas en el diagrama para identificar el acorde
          </p>
        )}

        {pitchClasses.length > 0 && !match && (
          <p className="identifier-no-match">No se reconoce el acorde</p>
        )}

        {match && (
          <div className="identifier-match">
            <span className="identifier-chord-name">
              {match.isTie ? match.chord.name : match.slashName}
            </span>
            {match.inversionLabel ? (
              <span className={`identifier-chord-full${match.isExternalBass ? ' external-bass' : ''}`}>
                {match.inversionLabel}
              </span>
            ) : (
              <span className="identifier-chord-full">{match.chord.fullName}</span>
            )}
            <div className="identifier-notes">
              {match.chord.notes.map(n => (
                <span key={n} className={`note-pill${pitchClasses.includes(n) ? ' present' : ''}`}>
                  {n}
                </span>
              ))}
              {match.isExternalBass && match.bassNote && (
                <span className="note-pill external">{match.bassNote}</span>
              )}
            </div>
            {match.alternatives && match.alternatives.length > 0 && (
              <p className="identifier-alternatives">
                También: {match.alternatives.join(', ')}
              </p>
            )}
          </div>
        )}

        {pitchClasses.length > 0 && (
          <div className="identifier-pc-pills">
            {pitchClasses.map(pc => (
              <span key={pc} className="pc-pill">{pc}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ChordFinder ──────────────────────────────────────────────────────────

const MODES = [
  { id: 'diccionario', label: 'Diccionario' },
  { id: 'buscar',      label: 'Buscar'      },
  { id: 'identificar', label: 'Identificar' },
]

export default function ChordFinder() {
  const [mode, setMode] = useState('diccionario')

  return (
    <div className="chord-finder">
      <header className="chord-finder-header">
        <h2 className="chord-finder-title">Acordes de Guitarra</h2>
        <div className="mode-pills">
          {MODES.map(m => (
            <button
              key={m.id}
              className={`mode-pill${mode === m.id ? ' active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </header>

      <div className="chord-finder-body">
        {mode === 'diccionario' && <Diccionario />}
        {mode === 'buscar'      && <Buscar />}
        {mode === 'identificar' && <Identificar />}
      </div>
    </div>
  )
}
