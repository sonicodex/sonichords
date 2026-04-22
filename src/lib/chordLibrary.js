export const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const CHORD_TYPES = [
  'maj', 'min', '7', 'maj7', 'min7', 'sus2', 'sus4',
  'dim', 'dim7', 'aug', '9', 'maj9', 'min9', 'add9', '6', 'min6',
]

const TYPE_INTERVALS = {
  maj:  [0, 4, 7],
  min:  [0, 3, 7],
  '7':  [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim:  [0, 3, 6],
  dim7: [0, 3, 6, 9],
  aug:  [0, 4, 8],
  '9':  [0, 4, 7, 10, 2],
  maj9: [0, 4, 7, 11, 2],
  min9: [0, 3, 7, 10, 2],
  add9: [0, 4, 7, 2],
  '6':  [0, 4, 7, 9],
  min6: [0, 3, 7, 9],
}

const TYPE_LABELS = {
  maj:  'Major',
  min:  'Minor',
  '7':  'Dominant 7th',
  maj7: 'Major 7th',
  min7: 'Minor 7th',
  sus2: 'Sus2',
  sus4: 'Sus4',
  dim:  'Diminished',
  dim7: 'Diminished 7th',
  aug:  'Augmented',
  '9':  '9th',
  maj9: 'Major 9th',
  min9: 'Minor 9th',
  add9: 'Add9',
  '6':  '6th',
  min6: 'Minor 6th',
}

function getShortName(root, type) {
  switch (type) {
    case 'maj':  return root
    case 'min':  return root + 'm'
    case '7':    return root + '7'
    case 'maj7': return root + 'maj7'
    case 'min7': return root + 'm7'
    case 'sus2': return root + 'sus2'
    case 'sus4': return root + 'sus4'
    case 'dim':  return root + 'dim'
    case 'dim7': return root + 'dim7'
    case 'aug':  return root + 'aug'
    case '9':    return root + '9'
    case 'maj9': return root + 'maj9'
    case 'min9': return root + 'm9'
    case 'add9': return root + 'add9'
    case '6':    return root + '6'
    case 'min6': return root + 'm6'
    default:     return root
  }
}

// C voicings in string notation (str6→str1, x=muted, 0=open, digit=fret)
const C_VOICINGS_STR = {
  maj:  'x32010',
  min:  'x35543',
  '7':  'x32310',
  maj7: 'x32000',
  min7: 'x35343',
  sus2: 'x30010',
  sus4: 'x33010',
  dim:  'x34242',
  dim7: 'x34242',
  aug:  'x32110',
  '9':  'x32330',
  maj9: 'x30002',
  min9: 'x35333',
  add9: 'x32030',
  '6':  'x32210',
  min6: 'x35353',
}

// Parse a voicing string into an array of 6 values: 'x', 0, or digit
function parseVoicingString(str) {
  return str.split('').map(ch => {
    if (ch === 'x') return 'x'
    return parseInt(ch, 10)
  })
}

// Build voicing object from a parsed array and a semitone offset
function buildVoicing(parsed, semitones) {
  const mutedStrings = [false, false, false, false, false, false]
  const openStrings  = [false, false, false, false, false, false]
  const fingerNumbers = [null, null, null, null, null, null]

  // First pass: compute raw frets for each string
  const rawFrets = parsed.map((val, i) => {
    if (val === 'x') {
      mutedStrings[i] = true
      return null
    }
    if (val === 0) {
      if (semitones === 0) {
        openStrings[i] = true
        return 0
      }
      return semitones // open string shifted up by semitones
    }
    return val + semitones
  })

  // Determine fretOffset: min non-zero, non-null fret (for barre)
  const frettedNotes = rawFrets.filter(f => f !== null && f > 0)
  const minFret = frettedNotes.length > 0 ? Math.min(...frettedNotes) : 0
  const maxFret = frettedNotes.length > 0 ? Math.max(...frettedNotes) : 0

  let fretOffset = 0
  if (semitones > 0) {
    // Use barre representation: fretOffset = minFret - 1 (so diagram starts at that position)
    fretOffset = minFret > 1 ? minFret - 1 : 0
  }

  // Build dots: normalize to diagram frets (subtract fretOffset)
  const dots = []
  rawFrets.forEach((rawFret, i) => {
    if (rawFret === null) return // muted
    if (rawFret === 0 && openStrings[i]) return // open string, no dot
    const diagramFret = rawFret - fretOffset
    if (diagramFret >= 1 && diagramFret <= 5) {
      dots.push({ string: i, fret: diagramFret })
    }
  })

  // Assign finger numbers (simple heuristic: lowest fret = 1, next = 2, etc.)
  const uniqueFrets = [...new Set(dots.map(d => d.fret))].sort((a, b) => a - b)
  dots.forEach(dot => {
    const fingerIdx = uniqueFrets.indexOf(dot.fret)
    fingerNumbers[dot.string] = fingerIdx + 1
  })

  return { fretOffset, dots, openStrings, mutedStrings, fingerNumbers }
}

function buildNotes(root, type) {
  const rootIdx = CHROMATIC.indexOf(root)
  const intervals = TYPE_INTERVALS[type]
  return intervals.map(interval => CHROMATIC[(rootIdx + interval) % 12])
}

// Generate all 192 chord entries
export const CHORD_LIBRARY = []

for (const type of CHORD_TYPES) {
  const parsedC = parseVoicingString(C_VOICINGS_STR[type])

  CHROMATIC.forEach((root, semitones) => {
    const voicing = buildVoicing(parsedC, semitones)
    const notes   = buildNotes(root, type)
    const name     = getShortName(root, type)
    const fullName = `${root} ${TYPE_LABELS[type]}`

    CHORD_LIBRARY.push({
      root,
      type,
      name,
      fullName,
      notes,
      voicings: [voicing],
    })
  })
}
