import * as Tone from 'tone'

const CHROMATIC_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Ab: 'G#', Bb: 'A#', Gb: 'F#', Cb: 'B', Fb: 'E' }

function normSharp(note) {
  return FLAT_TO_SHARP[note] || note
}

// Convert a note name to scientific notation (e.g. 'E' → 'E4').
// Notes below the chord root (in chromatic order) wrap up to octave 5
// so the chord voices stay in a closed voicing around octave 4.
export function toScientific(note, rootNote) {
  const rootIdx = CHROMATIC_SHARP.indexOf(normSharp(rootNote))
  const noteIdx = CHROMATIC_SHARP.indexOf(normSharp(note))
  const octave  = (rootIdx !== -1 && noteIdx !== -1 && noteIdx < rootIdx) ? 5 : 4
  return normSharp(note) + octave
}

// Convert an ordered array of note names to ascending scientific notation.
// Octave increments whenever the chromatic index wraps around (e.g. B→C).
// Useful for scales, arpeggios, or any sequence that should ascend.
export function scaleToScientific(notes, startOctave = 3) {
  let octave = startOctave
  let prevIdx = -1
  return notes.map(note => {
    const sharp = normSharp(note)
    const idx = CHROMATIC_SHARP.indexOf(sharp)
    if (prevIdx !== -1 && idx <= prevIdx) octave++
    prevIdx = idx
    return `${sharp}${octave}`
  })
}

// Ensure the AudioContext is running — must be the first call in every click handler.
// iOS Safari requires Tone.start() to be awaited synchronously within the user gesture;
// Tone.context.resume() covers the case where the context was suspended after creation.
async function ensureAudio() {
  await Tone.start()
  await Tone.context.resume()
  if (Tone.context.state !== 'running') {
    // Retry once — seen on some iOS versions where the first resume races
    console.warn('[audio] context not running after resume, retrying…', Tone.context.state)
    await Tone.start()
    await Tone.context.resume()
  }
  console.log('[audio] context.state:', Tone.context.state)
}

// Kept for any external callers
export async function initAudio() {
  await ensureAudio()
}

const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1.2 },
}).toDestination()

// Set global output volume (0–100 linear scale → dB)
export function setVolume(value) {
  Tone.Destination.volume.value = value === 0 ? -Infinity : Tone.gainToDb(value / 100)
}

// Default volume at 70%
setVolume(70)

// Play a single note already in scientific notation (e.g. 'C4', 'F#3').
// Use this when the octave is already resolved (e.g. from scaleToScientific).
export async function playNote(scientificNote, duration = 0.4) {
  if (!scientificNote) return
  await ensureAudio()
  synth.triggerAttackRelease(scientificNote, duration)
}

// Play a single chord.
// notes: array of note names in internal format (['C','E','G'])
// rootNote: root of the chord (for octave calculation)
// Must be awaited inside the click handler so ensureAudio() stays within the user gesture.
export async function playChord(notes, rootNote = 'C', duration = '4n') {
  if (!notes || notes.length === 0) return
  await ensureAudio()
  const scientific = notes.map(n => toScientific(n, rootNote))
  synth.triggerAttackRelease(scientific, duration)
}

let activeSeq = null

// Play a full progression.
// chordList: array of arrays of scientific-notation note strings
// bpm: tempo
// onChordChange(index | null): UI callback — called when the active chord changes
export async function playProgression(chordList, bpm = 90, onChordChange) {
  await ensureAudio()
  const transport = Tone.getTransport()
  transport.stop()
  transport.cancel()
  if (activeSeq) { activeSeq.dispose(); activeSeq = null }

  transport.bpm.value = bpm

  // One quarter-note ('4n') per chord — agile pacing
  activeSeq = new Tone.Sequence(
    (time, idx) => {
      if (!chordList[idx] || chordList[idx].length === 0) return
      synth.triggerAttackRelease(chordList[idx], '4n', time)
      const delay = Math.max(0, (time - Tone.getContext().currentTime) * 1000)
      setTimeout(() => onChordChange(idx), delay)
    },
    chordList.map((_, i) => i),
    '4n',
  )
  activeSeq.loop = false
  activeSeq.start(0)

  // Stop after all chords finish (N quarter-notes + 1 extra beat for release)
  const totalBeats = chordList.length + 1
  const stopMeasures = Math.ceil(totalBeats / 4) + 1
  transport.schedule((time) => {
    const delay = Math.max(0, (time - Tone.getContext().currentTime) * 1000)
    setTimeout(() => onChordChange(null), delay + 300)
    transport.stop()
  }, `+${stopMeasures}m`)

  transport.start()
}

export function stopPlayback() {
  const transport = Tone.getTransport()
  transport.stop()
  transport.cancel()
  if (activeSeq) { activeSeq.dispose(); activeSeq = null }
  synth.releaseAll()
}

// ── Guitar strum (raw Web Audio, guitar-like pluck) ───────────────────────────

let _rawCtx = null
function getRawCtx() {
  if (!_rawCtx) _rawCtx = new (window.AudioContext || window.webkitAudioContext)()
  return _rawCtx
}

function _playRawAt(ctx, midi, startTime) {
  const freq = 440 * Math.pow(2, (midi - 69) / 12)
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  const filt = ctx.createBiquadFilter()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(freq, startTime)
  filt.type = 'lowpass'
  filt.frequency.setValueAtTime(2400, startTime)
  filt.Q.setValueAtTime(1, startTime)
  gain.gain.setValueAtTime(0.28, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.1)
  osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination)
  osc.start(startTime); osc.stop(startTime + 1.15)
}

export function playRawNote(midi) {
  try {
    const ctx = getRawCtx()
    if (ctx.state === 'suspended') ctx.resume()
    _playRawAt(ctx, midi, ctx.currentTime)
  } catch (_) {}
}

export function strumChord(midiNotes) {
  if (!midiNotes || midiNotes.length === 0) return
  try {
    const ctx = getRawCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime
    midiNotes.forEach((midi, i) => _playRawAt(ctx, midi, now + i * 0.028))
  } catch (_) {}
}

// ── Note-name → MIDI helpers ──────────────────────────────────────────────────

const _NOTE_SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 }

function _noteNamesToMidi(noteNames, startOctave = 3) {
  let octave = startOctave
  let prevSemi = -1
  return noteNames.map(name => {
    const sharp = FLAT_TO_SHARP[name] || name
    const semi  = _NOTE_SEMI[sharp] ?? 0
    if (semi <= prevSemi) octave++
    prevSemi = semi
    return (octave + 1) * 12 + semi
  })
}

export function strumChordNames(noteNames) {
  if (!noteNames || noteNames.length === 0) return
  strumChord(_noteNamesToMidi(noteNames))
}

let _rawTimers = []

export function stopRawProgression() {
  _rawTimers.forEach(clearTimeout)
  _rawTimers = []
}

export function playRawProgression(noteNameArrays, bpm = 90, onChordChange) {
  stopRawProgression()
  const beatMs = (60 / bpm) * 1000
  noteNameArrays.forEach((noteNames, i) => {
    _rawTimers.push(setTimeout(() => {
      strumChordNames(noteNames)
      onChordChange(i)
    }, i * beatMs))
  })
  _rawTimers.push(setTimeout(() => onChordChange(null), noteNameArrays.length * beatMs))
}
