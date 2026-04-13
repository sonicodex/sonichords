import { useState } from 'react'
import CircleOfFifths from './components/CircleOfFifths'
import ChordExplorer from './components/ChordExplorer'
import SavedProgressions from './components/SavedProgressions'
import Nav from './components/Nav'
import { useProgressions } from './hooks/useProgressions'
import './App.css'

function App() {
  const [selectedNote, setSelectedNote] = useState(null)
  const [selectedMode, setSelectedMode] = useState('Ionian')
  const [activeProgression, setActiveProgression] = useState([])
  const [activeTab, setActiveTab] = useState('circle')
  const { progressions, save, remove } = useProgressions()

  function handleLoadProgression(prog) {
    setSelectedNote(prog.root)
    setSelectedMode(prog.mode)
    setActiveProgression(prog.chords)
    setActiveTab('explorer')
  }

  return (
    <div className="app">
      <main className="app-content">
        {activeTab === 'circle' && (
          <CircleOfFifths
            selectedNote={selectedNote}
            setSelectedNote={setSelectedNote}
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
          />
        )}
        {activeTab === 'explorer' && (
          <ChordExplorer
            selectedNote={selectedNote}
            setSelectedNote={setSelectedNote}
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
            activeProgression={activeProgression}
            setActiveProgression={setActiveProgression}
            onSave={save}
          />
        )}
        {activeTab === 'saved' && (
          <SavedProgressions
            progressions={progressions}
            onLoad={handleLoadProgression}
            onRemove={remove}
          />
        )}
      </main>
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default App
