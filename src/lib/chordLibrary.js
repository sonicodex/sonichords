import chordData from './sonichords-chord-library.json'

// Todos los acordes
export const chords = chordData.chords

// Afinación estándar del JSON
export const STANDARD_TUNING = chordData.tuning
// ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']

// Buscar acorde exacto por root + type (+ bass opcional para slash chords)
export function findChord(root, type, bass = null) {
  return chords.find(c =>
    c.root === root &&
    c.type === type &&
    (bass ? c.bass === bass : !c.bass)
  ) || null
}

// Buscar por nombre display o alias (ej. 'Em7', 'Bbmaj7', 'C#dim')
export function searchChords(query) {
  if (!query || query.trim().length < 1) return []
  const q = query.trim().toLowerCase()
  return chords.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.fullName?.toLowerCase().includes(q) ||
    c.aliases?.some(a => a.toLowerCase().includes(q))
  )
}

// Obtener todos los acordes de una raíz, sin slash chords
export function getChordsByRoot(root) {
  return chords.filter(c => c.root === root && !c.bass)
}

// Obtener raíces únicas en orden cromático
export const ROOTS = ['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B']

// Obtener tipos únicos presentes en la librería
export const CHORD_TYPES = [...new Set(chords.filter(c => !c.bass).map(c => c.type))]
