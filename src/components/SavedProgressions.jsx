import { useState } from 'react'
import { GREEK_MODES } from '../lib/musicTheory'
import './SavedProgressions.css'

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

export default function SavedProgressions({ progressions, onLoad, onRemove }) {
  const [confirmId, setConfirmId] = useState(null)

  function handleDeleteClick(id) {
    if (confirmId === id) {
      onRemove(id)
      setConfirmId(null)
    } else {
      setConfirmId(id)
    }
  }

  return (
    <div className="saved-progressions">
      <h2 className="saved-title">Progresiones guardadas</h2>

      {progressions.length === 0 ? (
        <div className="saved-empty">
          <p>Aún no hay progresiones guardadas.</p>
          <p className="saved-empty-hint">
            Ve al Explorador, arma una progresión y guárdala con un nombre.
          </p>
        </div>
      ) : (
        <div className="prog-list">
          {progressions.map(prog => (
            <div
              key={prog.id}
              className={`prog-card${confirmId === prog.id ? ' confirming' : ''}`}
            >
              <div className="prog-card-top">
                <div className="prog-card-info">
                  <span className="prog-name">{prog.name}</span>
                  <span className="prog-meta">
                    {prog.root} · {GREEK_MODES[prog.mode]?.label ?? prog.mode}
                  </span>
                </div>
                <div className="prog-card-actions">
                  {confirmId === prog.id ? (
                    <div className="confirm-row">
                      <span className="confirm-label">¿Eliminar?</span>
                      <button className="confirm-yes" onClick={() => handleDeleteClick(prog.id)}>Sí</button>
                      <button className="confirm-no" onClick={() => setConfirmId(null)}>No</button>
                    </div>
                  ) : (
                    <button
                      className="prog-delete-btn"
                      onClick={() => setConfirmId(prog.id)}
                      aria-label="Eliminar"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>

              <div className="prog-chords-row">
                {prog.chords.map((chord, i) => (
                  <span key={i} className="prog-chord-chip">{chord}</span>
                ))}
              </div>

              <button className="prog-load-btn" onClick={() => onLoad(prog)}>
                Cargar en Explorador
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
