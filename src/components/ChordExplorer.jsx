import { useState } from 'react'
import {
  CIRCLE_NOTES,
  GREEK_MODES,
  DEGREE_LABELS,
  getScale,
  getDiatonicChords,
  getSuggestedProgressions,
  degreeToChordIndex,
} from '../lib/musicTheory'
import ProgressionBuilder from './ProgressionBuilder'
import { playChord, playNote, scaleToScientific } from '../lib/audio'
import './ChordExplorer.css'

const QUALITY_LABEL = { maj: 'mayor', min: 'menor', dim: 'dism.' }
const QUALITY_CLASS  = { maj: 'card-maj', min: 'card-min', dim: 'card-dim' }

export default function ChordExplorer({
  selectedNote,
  setSelectedNote,
  selectedMode,
  setSelectedMode,
  activeProgression,
  setActiveProgression,
  onSave,
}) {
  const [localRoot,   setLocalRoot]   = useState('C')
  const [playingIdx,  setPlayingIdx]  = useState(null)
  const root = selectedNote || localRoot
  const scale           = getScale(root, selectedMode)
  const scientificScale = scaleToScientific(scale)
  const chords = getDiatonicChords(scale, selectedMode)
  const suggestions = getSuggestedProgressions(selectedMode)

  function handleChordClick(chord) {
    setActiveProgression(prev => [...prev, chord.name])
  }

  async function handleChordPlay(chord, i) {
    setPlayingIdx(i)
    await playChord(chord.notes, chord.notes[0])
    setPlayingIdx(null)
  }

  async function handleNotePlay(index) {
    await playNote(scientificScale[index], 0.4)
  }

  function handleSuggestionClick(degreeArr) {
    const resolved = degreeArr
      .map(deg => {
        const idx = degreeToChordIndex(deg)
        return idx >= 0 && chords[idx] ? chords[idx].name : null
      })
      .filter(Boolean)
    setActiveProgression(resolved)
  }

  const modeColor = GREEK_MODES[selectedMode]?.color ?? '#F5C000'

  return (
    <div className="chord-explorer" style={{ '--mode-color': modeColor }}>

      {/* Mode selector */}
      <div className="explorer-mode-section">
        <div className="explorer-mode-row">
          {Object.entries(GREEK_MODES).map(([key, { label, color }]) => {
            const isActive = selectedMode === key
            return (
              <button
                key={key}
                className={`exp-mode-pill${isActive ? ' active' : ''}`}
                style={isActive ? { background: color, borderColor: color, color: 'var(--bg)' } : {}}
                onClick={() => setSelectedMode(key)}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p className="mode-mood-line">
          <span className="mood-dot" style={{ color: modeColor }}>●</span>
          {GREEK_MODES[selectedMode]?.mood}
        </p>
      </div>

      {/* Root note picker (always visible) */}
      <div className="root-picker-section">
        <p className="section-label">Tónica</p>
        <div className="root-picker">
          {CIRCLE_NOTES.map(n => (
            <button
              key={n}
              className={`root-pill${root === n ? ' active' : ''}`}
              onClick={() => { setLocalRoot(n); setSelectedNote(null) }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="explorer-header">
        <div className="explorer-header-left">
          <h1 className="explorer-root">{root}</h1>
          <p className="explorer-mode-name">{GREEK_MODES[selectedMode]?.label}</p>
        </div>
      </div>

      {/* Scale pills */}
      <div className="scale-section">
        <p className="section-label">Escala</p>
        <div className="scale-row">
          {scale.map((note, i) => (
            <button key={i} className="scale-pill" onClick={() => handleNotePlay(i)}>
              <span className="scale-degree">{DEGREE_LABELS[i]}</span>
              <span className="scale-note">{note}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chord grid */}
      <div className="chords-section">
        <p className="section-label">Acordes diatónicos</p>
        <div className="chord-grid">
          {chords.map((chord, i) => (
            <div key={i} className={`chord-card ${QUALITY_CLASS[chord.quality]}${playingIdx === i ? ' card-active' : ''}`}>
              <div className="chord-card-body" role="button" tabIndex={0}
                onClick={() => handleChordClick(chord)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleChordClick(chord)}
              >
                <div className="chord-card-degree">{chord.degree}</div>
                <div className="chord-card-name">{chord.name}</div>
                <div className="chord-card-quality">{QUALITY_LABEL[chord.quality]}</div>
              </div>
              <button
                className="chord-card-play"
                onClick={() => handleChordPlay(chord, i)}
                aria-label={`Reproducir ${chord.name}`}
              >▶</button>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested progressions */}
      {suggestions.length > 0 && (
        <div className="suggestions-section">
          <p className="section-label">Progresiones sugeridas</p>
          <div className="suggestion-list">
            {suggestions.map((prog, i) => (
              <button
                key={i}
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(prog)}
              >
                {prog.join(' — ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progression builder */}
      <ProgressionBuilder
        chords={activeProgression}
        setChords={setActiveProgression}
        root={root}
        mode={selectedMode}
        onSave={onSave}
      />

    </div>
  )
}
