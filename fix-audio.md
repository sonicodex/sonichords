# Sonichords — Prompt: Corrección de escala + Audio

Hay dos tareas en este prompt. Ejecutarlas en orden.

---

## Tarea 1: Corrección de lógica de escalas y modo `scale`

### Contexto del bug

Cuando `innerRingMode === 'scale'` y se selecciona una nota con un modo activo, el círculo aplica incorrectamente los colores de familia armónica (tónica/dominante/subdominante) en lugar de iluminar solo las notas que pertenecen a la escala.

Además, `getScale()` puede estar produciendo notas incorrectas por mal manejo de enarmónicos.

### Corrección 1 — `musicTheory.js`

Verificar y corregir `getScale(root, mode)`. La función debe:
1. Aplicar los intervalos de `GREEK_MODES[mode].intervals` sobre la nota raíz usando semitonos.
2. Elegir la representación enarmónica correcta según la raíz:
   - Si la raíz tiene bemol, o es `F`: usar `CHROMATIC_FLAT = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']`
   - Caso contrario: usar `CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']`

Resultados esperados de referencia (verificar que estos sean exactos):
```
getScale('C', 'Ionian')     → ['C','D','E','F','G','A','B']
getScale('C', 'Dorian')     → ['C','D','Eb','F','G','A','Bb']
getScale('C', 'Phrygian')   → ['C','Db','Eb','F','G','Ab','Bb']
getScale('C', 'Lydian')     → ['C','D','E','F#','G','A','B']
getScale('C', 'Mixolydian') → ['C','D','E','F','G','A','Bb']
getScale('C', 'Aeolian')    → ['C','D','Eb','F','G','Ab','Bb']
getScale('C', 'Locrian')    → ['C','Db','Eb','F','Gb','Ab','Bb']
getScale('G', 'Ionian')     → ['G','A','B','C','D','E','F#']
getScale('F', 'Ionian')     → ['F','G','A','Bb','C','D','E']
getScale('Bb', 'Ionian')    → ['Bb','C','D','Eb','F','G','A']
```

### Corrección 2 — `CircleOfFifths.jsx`

**Separar completamente los dos sistemas de color:**

Cuando `innerRingMode === 'relative'`:
- Colorear el anillo Mayor con familia armónica (tónica=`#c8a96e`, dominante=`#7c6fcd`, subdominante=`#6f9fcd`, relativa menor=`#9f6fcd`, resto=`rgba(255,255,255,0.06)`)
- El anillo Menor muestra la nota relativa. No es clicable.

Cuando `innerRingMode === 'scale'` (con tónica seleccionada):
- Calcular `const scaleNotes = getScale(selectedNote, selectedMode)`
- Para CADA segmento del anillo Mayor: si la nota del segmento está en `scaleNotes` → color `GREEK_MODES[selectedMode].color`; si es la tónica → `#c8a96e` (override); si no está → `rgba(255,255,255,0.06)`
- NO aplicar colores de familia armónica en este modo bajo ninguna circunstancia
- El anillo Menor también es clicable: tap en segmento menor → `setSelectedNote(notaMenor)` + `setSelectedMode('Aeolian')`. La escala se recalcula automáticamente.

Cuando `innerRingMode === 'scale'` sin tónica seleccionada: fallback visual a modo `relative`.

---

## Tarea 2: Audio con Tone.js

### Instalación
```bash
npm install tone
```

### Nuevo archivo: `src/lib/audio.js`

Toda la lógica de audio aislada aquí. Exportar:

```js
import * as Tone from 'tone'

// Tone.js requiere un gesto del usuario para iniciar el AudioContext
export async function initAudio() {
  await Tone.start()
}

// Crear un PolySynth con preset tipo piano eléctrico suave
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1.2 },
}).toDestination()

// Reproducir un acorde (array de notas en formato científico: ['C4','E4','G4'])
export function playChord(notes, duration = '2n') {
  synth.triggerAttackRelease(notes, duration)
}

// Reproducir progresión completa
// chordList: array de arrays de notas [['C4','E4','G4'], ['F4','A4','C5'], ...]
// bpm: tempo en BPM
// onChordChange(index): callback llamado cuando cambia el acorde activo
export async function playProgression(chordList, bpm = 90, onChordChange) {
  await initAudio()
  Tone.getTransport().bpm.value = bpm
  // implementar con Tone.Sequence o loop manual con setTimeout convertido a Transport
  // llamar onChordChange(i) en cada acorde para resaltar el acorde activo en la UI
}

export function stopPlayback() {
  Tone.getTransport().stop()
  Tone.getTransport().cancel()
  synth.releaseAll()
}
```

**Conversión de notas a formato científico:**
Las notas en `getDiatonicChords()` están en formato `['C','E','G']`. Para Tone.js necesitan octava: `['C4','E4','G4']`. Regla simple: todas las notas en octava 4, excepto si la nota es menor que la raíz del acorde (en orden cromático), en cuyo caso va en octava 5 para mantener la tríada en posición cerrada. Implementar como `toScientific(note, rootNote)` en `audio.js`.

### Cambios en `ProgressionBuilder.jsx`

1. **Tap en chip de acorde** → `initAudio()` + `playChord(acorde.notes)` — reproduce ese acorde solo.

2. **Botón ▶ Play / ■ Stop:**
   - Estado local `isPlaying` (bool) y `activeChorIndex` (int | null)
   - Al presionar Play: `playProgression(chords, bpm, (i) => setActiveChordIndex(i))`
   - Al presionar Stop: `stopPlayback()`, limpiar `activeChordIndex`
   - El chip del acorde activo durante la reproducción se resalta visualmente (borde dorado, ligero scale)

3. **Slider de BPM:**
   - Rango 60–160, default 90
   - Label que muestra el valor actual: `90 BPM`
   - Solo visible cuando hay al menos 2 acordes en el builder

### Cambios en `ProgressionBuilder.css`

Agregar estilos para:
- `.chord-chip.active` — estado activo durante reproducción (borde `var(--gold)`, `box-shadow: 0 0 8px var(--gold)`)
- `.play-controls` — flex row con botón play y slider
- `.bpm-slider` — slider estilizado, thumb con color `var(--gold)`

---

## Al terminar ambas tareas

1. Actualizar `sonichords-pwa.md` con:
   - Corrección de la descripción de `getScale()` y la nota sobre enarmónicos
   - Nueva sección `### audio.js` después de `ProgressionBuilder.jsx`
   - BPM slider y comportamiento de reproducción documentados en `ProgressionBuilder.jsx`

2. Actualizar el archivo de documentación del proyecto con los cambios realizados.