# Sonichords — Prompt: Integrar biblioteca de acordes externa

## Contexto

Hay un archivo `sonichords-chord-library.json` en la raíz del proyecto con 773 acordes completos (incluyendo 76 slash chords y enarmónicos). Reemplaza completamente `chordLibrary.js`.

---

## Paso 1: Mover el archivo

Copiar `sonichords-chord-library.json` a `src/lib/sonichords-chord-library.json`.

---

## Paso 2: Reemplazar `chordLibrary.js`

Reemplazar el contenido actual de `src/lib/chordLibrary.js` con:

```js
import chordData from './sonichords-chord-library.json'

// Todos los acordes
export const chords = chordData.chords

// Afinación estándar del JSON
export const STANDARD_TUNING = chordData.tuning
// ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']

// Buscar acorde exacto por root + type (+ bass opcional para slash chords)
export function findChord(root, type, bass = null) {
  return chords.find(c =>
    c.root === root &&
    c.type === type &&
    (bass ? c.bass === bass : !c.bass)
  ) || null
}

// Buscar por nombre display o alias (ej. 'Em7', 'Bbmaj7', 'C#dim')
export function searchChords(query) {
  if (!query || query.trim().length < 1) return []
  const q = query.trim().toLowerCase()
  return chords.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.fullName?.toLowerCase().includes(q) ||
    c.aliases?.some(a => a.toLowerCase().includes(q))
  )
}

// Obtener todos los acordes de una raíz, sin slash chords
export function getChordsByRoot(root) {
  return chords.filter(c => c.root === root && !c.bass)
}

// Obtener raíces únicas en orden cromático
export const ROOTS = ['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B']

// Obtener tipos únicos presentes en la librería
export const CHORD_TYPES = [...new Set(chords.filter(c => !c.bass).map(c => c.type))]
```

---

## Paso 3: Actualizar `vite.config.js`

Asegurarse de que Vite pueda importar JSON. En Vite 7 esto funciona por defecto, pero verificar que no haya ningún plugin que lo bloquee.

---

## Paso 4: Actualizar `chordIdentifier.js`

Reemplazar cualquier referencia a la librería anterior por las nuevas funciones. El identificador ahora importa desde `chordLibrary.js`:

```js
import { chords, STANDARD_TUNING } from './chordLibrary.js'
```

La función `identifyChord(pitchClasses, bassNote)` debe buscar en `chords` comparando el conjunto de `notes` (pitch classes) con los del acorde. Mantener la lógica de inversiones y desempate por nota del bajo ya implementada.

---

## Paso 5: Actualizar `ChordFinder.jsx`

### Submodo Diccionario
- Usar `ROOTS` para los pills de raíz
- Usar `getChordsByRoot(root)` para listar acordes de la raíz seleccionada
- Agrupar visualmente por categoría si se desea (tríadas, séptimas, suspendidas, etc.) usando el campo `type`

### Submodo Buscar
- Usar `searchChords(query)` para los resultados en tiempo real
- El input debe normalizar aliases comunes antes de buscar:
  - `m` al final → `min` (ej. `Em` → buscar `Emin` y `Em`)
  - `°` → `dim`
  - `+` → `aug`
  - `M7` → `maj7`

### Submodo Identificar
- Sin cambios en la UI, solo asegurarse de que `identifyChord` use la nueva librería

---

## Paso 6: Verificación

Probar manualmente en la app:
- Buscar `Cmaj7` → debe aparecer C Major 7
- Buscar `Em` → debe aparecer E minor
- Diccionario de C → debe mostrar al menos 20 tipos
- Identificador con posición x32010 → debe identificar C major

---

## Al terminar

Actualizar `sonichords-pwa.md` y la documentación del proyecto indicando que la librería ahora viene de `sonichords-chord-library.json` (773 acordes, generada externamente).