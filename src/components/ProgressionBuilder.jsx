import { useState } from 'react'
import { getScale, getDiatonicChords } from '../lib/musicTheory'
import { playChord, playProgression, stopPlayback, toScientific, setVolume } from '../lib/audio'
import './ProgressionBuilder.css'

export default function ProgressionBuilder({ chords, setChords, root, mode, onSave }) {
  const [name, setName]                   = useState('')
  const [isPlaying, setIsPlaying]         = useState(false)
  const [activeChordIndex, setActiveChordIndex] = useState(null)
  const [bpm, setBpm]                     = useState(90)
  const [volume, setVolumeState]          = useState(70)

  // Resolve chord names to note arrays using current root/mode
  function resolveDiatonic() {
    if (!root || !mode) return []
    const scale = getScale(root, mode)
    return getDiatonicChords(scale, mode)
  }

  function findChordNotes(chordName) {
    const diatonic = resolveDiatonic()
    return diatonic.find(c => c.name === chordName)
  }

  async function handleChipClick(chordName) {
    const chordObj = findChordNotes(chordName)
    if (chordObj) await playChord(chordObj.notes, chordObj.notes[0])
  }

  async function handlePlay() {
    if (chords.length === 0) return
    const diatonic = resolveDiatonic()
    const chordNoteArrays = chords.map(chordName => {
      const chordObj = diatonic.find(c => c.name === chordName)
      if (!chordObj) return []
      return chordObj.notes.map(n => toScientific(n, chordObj.notes[0]))
    })
    setIsPlaying(true)
    setActiveChordIndex(null)
    await playProgression(chordNoteArrays, bpm, (i) => {
      setActiveChordIndex(i)
      if (i === null) setIsPlaying(false)
    })
  }

  function handleStop() {
    stopPlayback()
    setIsPlaying(false)
    setActiveChordIndex(null)
  }

  function moveChord(index, dir) {
    const next = index + dir
    if (next < 0 || next >= chords.length) return
    const arr = [...chords]
    ;[arr[index], arr[next]] = [arr[next], arr[index]]
    setChords(arr)
  }

  function removeChord(index) {
    setChords(prev => prev.filter((_, i) => i !== index))
  }

  function handleClearAll() {
    stopPlayback()
    setIsPlaying(false)
    setActiveChordIndex(null)
    setChords([])
  }

  function handleSave() {
    if (!name.trim() || chords.length === 0) return
    onSave({ name: name.trim(), root, mode, chords })
    setName('')
    setChords([])
  }

  return (
    <div className="progression-builder">
      <div className="builder-header">
        <p className="section-label">Constructor de progresión</p>
        {chords.length > 0 && (
          <button className="builder-clear-btn" onClick={handleClearAll} aria-label="Limpiar progresión">
            Limpiar
          </button>
        )}
      </div>

      {chords.length === 0 ? (
        <p className="builder-empty">Toca un acorde para agregarlo aquí…</p>
      ) : (
        <div className="builder-chords">
          {chords.map((chord, i) => (
            <div key={i} className="builder-chord-row">
              <div className="chord-move-group">
                <button
                  className="chord-move"
                  onClick={() => moveChord(i, -1)}
                  disabled={i === 0}
                  aria-label="Mover izquierda"
                >‹</button>
                <button
                  className="chord-move"
                  onClick={() => moveChord(i, 1)}
                  disabled={i === chords.length - 1}
                  aria-label="Mover derecha"
                >›</button>
              </div>
              <button
                className={`builder-chip${activeChordIndex === i ? ' active' : ''}`}
                onClick={() => handleChipClick(chord)}
              >
                {chord}
              </button>
              <button
                className="chord-remove"
                onClick={() => removeChord(i)}
                aria-label="Eliminar"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {chords.length >= 2 && (
        <div className="play-controls">
          <button
            className={`play-btn${isPlaying ? ' playing' : ''}`}
            onClick={isPlaying ? handleStop : handlePlay}
            aria-label={isPlaying ? 'Detener' : 'Reproducir'}
          >
            {isPlaying ? '■' : '▶'}
          </button>
          <div className="sliders-col">
            <div className="slider-row">
              <input
                type="range"
                className="bpm-slider"
                min="60"
                max="160"
                value={bpm}
                onChange={e => setBpm(Number(e.target.value))}
                aria-label="BPM"
              />
              <span className="slider-label">{bpm} BPM</span>
            </div>
            <div className="slider-row">
              <input
                type="range"
                className="bpm-slider"
                min="0"
                max="100"
                value={volume}
                onChange={e => {
                  const v = Number(e.target.value)
                  setVolumeState(v)
                  setVolume(v)
                }}
                aria-label="Volumen"
              />
              <span className="slider-label">{volume}%</span>
            </div>
          </div>
        </div>
      )}

      {chords.length > 0 && (
        <div className="builder-save-row">
          <input
            className="builder-input"
            type="text"
            placeholder="Nombre de la progresión…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            maxLength={60}
          />
          <button
            className="builder-save-btn"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  )
}
