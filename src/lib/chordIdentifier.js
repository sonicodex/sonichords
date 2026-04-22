import { CHORD_LIBRARY } from './chordLibrary'

export const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const NOTE_SEMITONES = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
  'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
}

// Nombres españoles de tipos de acorde para el subtexto de inversión
const TYPE_SPANISH = {
  maj: 'mayor', min: 'menor', '7': 'séptima dominante', maj7: 'mayor séptima',
  min7: 'menor séptima', sus2: 'sus2', sus4: 'sus4', dim: 'disminuido',
  dim7: 'disminuido séptima', aug: 'aumentado', '9': 'novena', maj9: 'mayor novena',
  min9: 'menor novena', add9: 'añadida novena', '6': 'sexta', min6: 'menor sexta',
}

const INVERSION_NAMES = {
  1: 'primera inversión',
  2: 'segunda inversión',
  3: 'tercera inversión',
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

// Resuelve el MIDI y el pitch class de una cuerda dada (string index 0-5)
function stringMidi(i, dots, openStrings, fretOffset) {
  if (openStrings[i]) return TUNING_MIDI[i]
  const dot = dots.find(d => d.string === i)
  if (!dot) return null
  return TUNING_MIDI[i] + dot.fret + fretOffset
}

/**
 * Retorna el pitch class de la nota más grave que no esté muted.
 * Itera de cuerda 0 (Mi grave) a cuerda 5 (Mi agudo).
 */
export function getBassNote(dots, openStrings, mutedStrings, fretOffset) {
  for (let i = 0; i < 6; i++) {
    if (mutedStrings[i]) continue
    const midi = stringMidi(i, dots, openStrings, fretOffset)
    if (midi === null) continue
    return CHROMATIC[midi % 12]
  }
  return null
}

/**
 * Convert dots/open/muted/fretOffset to pitch class strings (deduped).
 * dots: [{string, fret}] — string index 0=low E (str6), 5=high E (str1)
 * openStrings: bool[6], mutedStrings: bool[6], fretOffset: number
 */
export function dotsToNotes(dots, openStrings, mutedStrings, fretOffset) {
  const pitchClasses = []

  for (let i = 0; i < 6; i++) {
    if (mutedStrings[i]) continue
    const midi = stringMidi(i, dots, openStrings, fretOffset)
    if (midi === null) continue
    const pc = CHROMATIC[midi % 12]
    if (!pitchClasses.includes(pc)) pitchClasses.push(pc)
  }

  return pitchClasses
}

/**
 * Dado un array de pitch classes y la nota del bajo real, encuentra el mejor
 * acorde en CHORD_LIBRARY y retorna la info de inversión completa.
 *
 * Returns:
 * {
 *   chord,         — entrada de CHORD_LIBRARY
 *   score,         — puntuación (0-1)
 *   bassNote,      — pitch class de la nota más grave
 *   slashName,     — nombre con slash si aplica: 'C/G', 'C' si es posición fundamental
 *   inversionLabel,— subtexto: 'C mayor — segunda inversión' / null si es posición fundamental
 *   isExternalBass,— true si el bajo no pertenece al acorde
 *   inversionIndex,— índice del bajo en chord.notes (-1 si externo)
 * }
 * o null si no hay match razonable.
 */
function buildInversionInfo(chord, bass) {
  const typeSpanish = TYPE_SPANISH[chord.type] || chord.type
  const baseLabel   = `${chord.root} ${typeSpanish}`

  if (!bass || bass === chord.root) {
    return { slashName: chord.name, inversionLabel: null, isExternalBass: false, inversionIndex: 0 }
  }

  const inversionIndex = chord.notes.indexOf(bass)

  if (inversionIndex > 0) {
    const invName = INVERSION_NAMES[inversionIndex]
    return {
      slashName:      chord.name + '/' + bass,
      inversionLabel: invName ? `${baseLabel} — ${invName}` : `${baseLabel} — bajo en ${bass}`,
      isExternalBass: false,
      inversionIndex,
    }
  }

  return {
    slashName:      chord.name + '/' + bass,
    inversionLabel: `${baseLabel} — bajo externo en ${bass}`,
    isExternalBass: true,
    inversionIndex: -1,
  }
}

/**
 * Dado un array de pitch classes y la nota del bajo real, encuentra el mejor
 * acorde en CHORD_LIBRARY con desempate por nota del bajo.
 *
 * Orden de prioridad en empate de score:
 *   1. Cuya raíz coincide con bassNote
 *   2. Mayor número de notas coincidentes
 *   3. Empate total → se listan como alternatives
 *
 * Returns:
 * {
 *   chord, score, bassNote,
 *   slashName, inversionLabel, isExternalBass, inversionIndex,
 *   alternatives,  — array de nombres de acordes alternativos (empate total)
 * }
 * o null si no hay match razonable.
 */
export function identifyChord(pitchClasses, bassNote = null) {
  if (!pitchClasses || pitchClasses.length === 0) return null

  const inputSet = new Set(pitchClasses)
  const candidates = []

  for (const chord of CHORD_LIBRARY) {
    const chordSet = new Set(chord.notes)

    let matches = 0
    for (const pc of inputSet) {
      if (chordSet.has(pc)) matches++
    }

    const extraNotes       = pitchClasses.filter(pc => !chordSet.has(pc)).length
    const missedChordNotes = chord.notes.filter(n => !inputSet.has(n)).length
    const score = matches / chord.notes.length - extraNotes * 0.3 - missedChordNotes * 0.2

    if (score >= 0.4) candidates.push({ chord, score, matches })
  }

  if (candidates.length === 0) return null

  // Ordenar por score desc
  candidates.sort((a, b) => b.score - a.score)
  const topScore = candidates[0].score

  // Candidatos empatados en el top score (epsilon para float)
  const tied = candidates.filter(c => Math.abs(c.score - topScore) < 0.001)

  // Desempate 1: raíz === bassNote
  const bassWinners = bassNote ? tied.filter(c => c.chord.root === bassNote) : []

  let winner
  let alternatives = []

  if (bassWinners.length > 0) {
    winner       = bassWinners[0]
    alternatives = tied.filter(c => c !== winner).map(c => c.chord.name)
  } else if (tied.length > 1) {
    // Desempate 2: más notas coincidentes
    tied.sort((a, b) => b.matches - a.matches)
    winner = tied[0]
    // ¿Empate total en matches también?
    const sameMatches = tied.filter(c => c.matches === winner.matches)
    if (sameMatches.length > 1) {
      alternatives = sameMatches.slice(1).map(c => c.chord.name)
    }
  } else {
    winner = tied[0]
  }

  const { chord } = winner
  const bass = bassNote ?? pitchClasses[0] ?? null
  const invInfo = buildInversionInfo(chord, bass)

  return {
    chord,
    score: winner.score,
    bassNote: bass,
    alternatives,
    ...invInfo,
  }
}
