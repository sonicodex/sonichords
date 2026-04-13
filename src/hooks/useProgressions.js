import { useState, useEffect } from 'react'

const STORAGE_KEY = 'sonichords_progressions'

export function useProgressions() {
  const [progressions, setProgressions] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressions))
  }, [progressions])

  function save({ name, root, mode, chords }) {
    const prog = {
      id: crypto.randomUUID(),
      name,
      root,
      mode,
      chords,
      createdAt: new Date().toISOString(),
    }
    setProgressions(prev => [prog, ...prev])
    return prog
  }

  function remove(id) {
    setProgressions(prev => prev.filter(p => p.id !== id))
  }

  return { progressions, save, remove }
}
