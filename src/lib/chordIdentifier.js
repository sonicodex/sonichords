import { CHORD_LIBRARY } from './chordLibrary'

export const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const NOTE_SEMITONES = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
  'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
}

// Convert note name with octave (e.g. "E2") to MIDI semitone number
function noteToMidi(noteWithOctave) {
  const match = noteWithOctave.match(/^([A-G]#?)(\d+)$/)
  if (!match) return 0
  const [, noteName, octaveStr] = match
  const octave = parseInt(octaveStr, 10)
  return NOTE_SEMITONES[noteName] + (octave + 1) * 12
}

const TUNING_MIDI = STANDARD_TUNING.map(noteToMidi)

/**
 * Convert dots/open/muted/fretOffset to pitch class strings (deduped).
 * dots: [{string, fret}] — string index 0=low E (str6), 5=high E (str1)
 * openStrings: bool[6], mutedStrings: bool[6], fretOffset: number
 */
export function dotsToNotes(dots, openStrings, mutedStrings, fretOffset) {
  const pitchClasses = []

  for (let i = 0; i < 6; i++) {
    if (mutedStrings[i]) continue

    let midi
    if (openStrings[i]) {
      midi = TUNING_MIDI[i]
    } else {
      const dot = dots.find(d => d.string === i)
      if (!dot) continue
      midi = TUNING_MIDI[i] + dot.fret + fretOffset
    }

    const pc = CHROMATIC[midi % 12]
    if (!pitchClasses.includes(pc)) {
      pitchClasses.push(pc)
    }
  }

  return pitchClasses
}

/**
 * Given an array of pitch classes, find the best matching chord in CHORD_LIBRARY.
 * Returns { chord, score, inversion } or null if no reasonable match.
 */
export function identifyChord(pitchClasses) {
  if (!pitchClasses || pitchClasses.length === 0) return null

  const inputSet = new Set(pitchClasses)
  let best = null
  let bestScore = -Infinity

  for (const chord of CHORD_LIBRARY) {
    const chordSet = new Set(chord.notes)

    // Count matching notes
    let matches = 0
    for (const pc of inputSet) {
      if (chordSet.has(pc)) matches++
    }

    // Score: proportion of chord tones present, penalize extra notes not in chord
    const extraNotes = pitchClasses.filter(pc => !chordSet.has(pc)).length
    const missedChordNotes = chord.notes.filter(n => !inputSet.has(n)).length

    const score = matches / chord.notes.length - extraNotes * 0.3 - missedChordNotes * 0.2

    if (score > bestScore) {
      bestScore = score
      // Determine inversion: index of bass note (pitchClasses[0]) in chord.notes
      const inversion = chord.notes.indexOf(pitchClasses[0])
      best = { chord, score, inversion }
    }
  }

  // Only return if reasonably good match (at least half the chord tones present)
  if (best && best.score >= 0.4) return best
  return null
}
