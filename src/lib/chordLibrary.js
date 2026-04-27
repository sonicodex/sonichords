import chordDataA from './chord-library-A.json'
import chordDataB from './chord-library-B.json'

const byName = (a, b) => a.name.localeCompare(b.name)

export const LIBRARY_A = { ...chordDataA, chords: [...chordDataA.chords].sort(byName) }
export const LIBRARY_B = { ...chordDataB, chords: [...chordDataB.chords].sort(byName) }

// Default (backward compat — apunta a A)
export const chords         = LIBRARY_A.chords
export const STANDARD_TUNING = chordDataA.tuning

// Buscar acorde exacto por root + type (+ bass opcional para slash chords)
export function findChord(root, type, bass = null) {
  return chords.find(c =>
    c.root === root &&
    c.type === type &&
    (bass ? c.bass === bass : !c.bass)
  ) || null
}

// ── Funciones que aceptan la librería como primer parámetro ────────────────

export function searchChordsIn(chordList, query) {
  if (!query || query.trim().length < 1) return []
  const q = query.trim().toLowerCase()

  function rank(c) {
    const name = c.name?.toLowerCase() ?? ''
    if (name === q) return 0
    if (name.startsWith(q)) return 1
    if (c.aliases?.some(a => a.toLowerCase() === q)) return 2
    if (c.aliases?.some(a => a.toLowerCase().startsWith(q))) return 3
    if (c.fullName?.toLowerCase().startsWith(q)) return 4
    return 5
  }

  return chordList
    .filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.fullName?.toLowerCase().includes(q) ||
      c.aliases?.some(a => a.toLowerCase().includes(q))
    )
    .sort((a, b) => rank(a) - rank(b))
}

export function getChordsByRootIn(chordList, root) {
  return chordList.filter(c => c.root === root && !c.bass)
}

// ── Wrappers backward-compat (usan la librería por defecto A) ──────────────

export function searchChords(query) {
  return searchChordsIn(chords, query)
}

export function getChordsByRoot(root) {
  return getChordsByRootIn(chords, root)
}

// Raíces únicas en orden cromático
export const ROOTS = ['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B']

// Tipos únicos presentes en la librería A
export const CHORD_TYPES = [...new Set(chords.filter(c => !c.bass).map(c => c.type))]
