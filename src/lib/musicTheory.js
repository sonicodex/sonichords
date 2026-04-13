export const CIRCLE_NOTES = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']

export const ENHARMONIC = { 'F#': 'Gb', 'Db': 'C#', 'Ab': 'G#', 'Eb': 'D#', 'Bb': 'A#' }

export const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
export const CHROMATIC_FLAT = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

// Semitone offset from a mode root to its parent Ionian (major) key root
const MODE_DEGREE_OFFSET = {
  Ionian: 0, Dorian: 2, Phrygian: 4, Lydian: 5,
  Mixolydian: 7, Aeolian: 9, Locrian: 11,
}

// Key signature (negative = flats, positive = sharps) for each chromatic index as a major key
// Index: C  Db   D  Eb   E   F  F#   G  Ab   A  Bb   B
const CHROMATIC_KEY_SIGS = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5]

export const GREEK_MODES = {
  Ionian:     { intervals: [2,2,1,2,2,2,1], label: 'Jónico (Mayor)',   color: '#ED8B16' },
  Dorian:     { intervals: [2,1,2,2,2,1,2], label: 'Dórico',           color: '#00A896' },
  Phrygian:   { intervals: [1,2,2,2,1,2,2], label: 'Frigio',           color: '#E1523D' },
  Lydian:     { intervals: [2,2,2,1,2,2,1], label: 'Lidio',            color: '#C2BB00' },
  Mixolydian: { intervals: [2,2,1,2,2,1,2], label: 'Mixolidio',        color: '#D4792A' },
  Aeolian:    { intervals: [2,1,2,2,1,2,2], label: 'Eólico (Menor)',   color: '#1A7FAF' },
  Locrian:    { intervals: [1,2,2,1,2,2,2], label: 'Locrio',           color: '#B8A800' },
}

export const RELATIVE_MINORS = {
  'C':  'Am',  'G':  'Em',  'D':  'Bm',  'A':  'F#m',
  'E':  'C#m', 'B':  'G#m', 'F#': 'D#m', 'Db': 'Bbm',
  'Ab': 'Fm',  'Eb': 'Cm',  'Bb': 'Gm',  'F':  'Dm',
}

export const DEGREE_LABELS = ['I','II','III','IV','V','VI','VII']

const FLAT_TO_SHARP = { 'Db': 'C#', 'Eb': 'D#', 'Ab': 'G#', 'Bb': 'A#', 'Gb': 'F#' }

export function normalizeNote(n) {
  return FLAT_TO_SHARP[n] || n
}

export function getScale(root, mode) {
  const intervals = GREEK_MODES[mode]?.intervals || GREEK_MODES.Ionian.intervals
  const sharpRoot = normalizeNote(root)
  const rootIdx = CHROMATIC.indexOf(sharpRoot)
  if (rootIdx === -1) return []
  // Find parent major key to decide sharp vs flat spelling
  const offset = MODE_DEGREE_OFFSET[mode] ?? 0
  const parentKeyIdx = (rootIdx - offset + 12) % 12
  const keySig = CHROMATIC_KEY_SIGS[parentKeyIdx]
  const chromatic = keySig < 0 ? CHROMATIC_FLAT : CHROMATIC
  const scale = [root]
  let current = rootIdx
  for (let i = 0; i < 6; i++) {
    current = (current + intervals[i]) % 12
    scale.push(chromatic[current])
  }
  return scale
}

const CHORD_QUALITIES = {
  Ionian:     ['maj','min','min','maj','maj','min','dim'],
  Dorian:     ['min','min','maj','maj','min','dim','maj'],
  Phrygian:   ['min','maj','maj','min','dim','maj','min'],
  Lydian:     ['maj','maj','min','dim','maj','min','min'],
  Mixolydian: ['maj','min','dim','maj','min','min','maj'],
  Aeolian:    ['min','dim','maj','min','min','maj','maj'],
  Locrian:    ['dim','maj','min','min','maj','maj','min'],
}

export function getDiatonicChords(scale, mode) {
  const qualities = CHORD_QUALITIES[mode] || CHORD_QUALITIES.Ionian
  return scale.map((note, i) => {
    const quality = qualities[i]
    const base = DEGREE_LABELS[i]

    let degree
    if (quality === 'maj') degree = base
    else if (quality === 'dim') degree = base.toLowerCase() + '°'
    else degree = base.toLowerCase()

    const rootIdx = CHROMATIC.indexOf(normalizeNote(note))

    let thirdOffset, fifthOffset
    if (quality === 'maj')      { thirdOffset = 4; fifthOffset = 7 }
    else if (quality === 'min') { thirdOffset = 3; fifthOffset = 7 }
    else                        { thirdOffset = 3; fifthOffset = 6 }

    const third = CHROMATIC[(rootIdx + thirdOffset) % 12]
    const fifth = CHROMATIC[(rootIdx + fifthOffset) % 12]
    const suffix = quality === 'min' ? 'm' : quality === 'dim' ? 'dim' : ''
    const name = note + suffix

    return { degree, name, quality, notes: [note, third, fifth] }
  })
}

export function getSuggestedProgressions(mode) {
  const progressions = {
    Ionian:     [['I','IV','V','I'], ['I','V','vi','IV'], ['ii','V','I']],
    Dorian:     [['i','IV','i','IV'], ['i','VII','IV'], ['i','ii','i']],
    Phrygian:   [['i','bII','i'], ['i','bVII','bVI','bVII'], ['i','bII','bVII','i']],
    Lydian:     [['I','II','I'], ['I','II','vii','I'], ['IV','I','II','I']],
    Mixolydian: [['I','bVII','IV','I'], ['I','bVII','I'], ['I','IV','bVII']],
    Aeolian:    [['i','VI','III','VII'], ['i','iv','VII','III'], ['i','v','i']],
    Locrian:    [['i°','bII','i°'], ['i°','bVII','bVI']],
  }
  return progressions[mode] || []
}

export function degreeToChordIndex(degree) {
  const clean = degree.replace(/^b/, '').replace(/[°m]/g, '').toUpperCase()
  const map = { 'I': 0, 'II': 1, 'III': 2, 'IV': 3, 'V': 4, 'VI': 5, 'VII': 6 }
  return map[clean] ?? -1
}

export const KEY_SIGNATURES = {
  'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6,
  'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6,
}

export function formatKeySignature(n) {
  if (n > 0) return n + '♯'
  if (n < 0) return Math.abs(n) + '♭'
  return '0'
}

export function getRelations(note) {
  const n = normalizeNote(note)
  const idx = CHROMATIC.indexOf(n)
  if (idx === -1) return null
  return {
    dominant:     CHROMATIC[(idx + 7) % 12],
    subdominant:  CHROMATIC[(idx + 5) % 12],
    relativeMinor: CHROMATIC[(idx + 9) % 12],
    parallelMinor: note,
  }
}
