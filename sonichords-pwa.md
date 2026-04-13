# Sonichords PWA — Implementation Prompt

## Contexto

Aplicación web progresiva (PWA) personal para explorar el círculo de quintas, modos griegos y guardar progresiones de acordes. Usada principalmente en iPhone vía Safari (add to home screen). Stack: Vite + React + Tailwind CSS + vite-plugin-pwa.

---

## Setup esperado (ya ejecutado por el usuario)

```
npm create vite@latest sonichords -- --template react
cd sonichords
npm install
npm install -D vite-plugin-pwa
```

No se usa ningún framework de CSS. Todo el estilo va en CSS puro con variables CSS en `src/index.css`.

---

## Objetivo

Construir la app completa en una sola sesión. No hay backend. Todo el estado persiste en `localStorage`.

---

## Estética / Design Direction

**Dark mode. Aesthetic: deep ocean / noche submarina.**

- Fondo: `#001E2B` (azul marino oscuro)
- Tipografía: Google Sans (sistema, sin fuente externa)
- Acento primario: `#ED8B16` (naranja dorado)
- Rojo/disminuido: `#E1523D`
- Lima: `#C2BB00`
- Surfaces: `#003547` — color sólido
- Bordes: `#005E54` — verde oscuro teal
- Anillos del círculo SVG: colores por familia armónica (ver sección Music Logic)
- Sin sombras drop-shadow genéricas. Usar glow con `filter: drop-shadow(0 0 8px <color>)` solo en el elemento activo del SVG.
- Micro-animaciones: transiciones CSS `300ms ease` en selecciones.

Cargar fuentes en `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" rel="stylesheet">
```

Definir todas las variables y estilos globales en `src/index.css`:
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:           #001E2B;
  --surface:      #003547;
  --border:       #005E54;
  --gold:         #ED8B16;
  --red:          #E1523D;
  --lime:         #C2BB00;
  --text:         #F0EDE4;
  --text-muted:   rgba(240,237,228,0.45);
  --font-display: 'Google Sans', system-ui, -apple-system, sans-serif;
  --font-ui:      'Google Sans', system-ui, -apple-system, sans-serif;
  --radius:       10px;
  --transition:   300ms ease;
}

html, body, #root {
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-ui);
  -webkit-font-smoothing: antialiased;
}
```

Cada componente tiene su propio archivo `.css` co-ubicado (ej. `CircleOfFifths.css`) importado directamente en el `.jsx`. Sin CSS Modules, sin styled-components.

---

## Estructura de archivos

```
src/
  App.jsx
  App.css
  main.jsx
  index.css                ← variables globales + reset
  lib/
    musicTheory.js
  components/
    Nav.jsx
    Nav.css
    CircleOfFifths.jsx
    CircleOfFifths.css
    ChordExplorer.jsx
    ChordExplorer.css
    SavedProgressions.jsx
    SavedProgressions.css
    ProgressionBuilder.jsx
    ProgressionBuilder.css
    NoteGrid.jsx
    NoteGrid.css
  hooks/
    useProgressions.js
```

---

## Music Logic (`src/lib/musicTheory.js`)

### Notas y orden del círculo

```js
export const CIRCLE_NOTES = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']
// 12 posiciones, horario, comenzando en C arriba (posición 0 = 12 o'clock)

export const ENHARMONIC = { 'F#': 'Gb', 'Db': 'C#', 'Ab': 'G#', 'Eb': 'D#', 'Bb': 'A#' }
```

### Intervalos de modos griegos

```js
export const GREEK_MODES = {
  Ionian:     { intervals: [2,2,1,2,2,2,1], label: 'Jónico (Mayor)',   color: '#ED8B16' },
  Dorian:     { intervals: [2,1,2,2,2,1,2], label: 'Dórico',           color: '#00A896' },
  Phrygian:   { intervals: [1,2,2,2,1,2,2], label: 'Frigio',           color: '#E1523D' },
  Lydian:     { intervals: [2,2,2,1,2,2,1], label: 'Lidio',            color: '#6fcdaf' },
  Mixolydian: { intervals: [2,2,1,2,2,1,2], label: 'Mixolidio',        color: '#D4792A' },
  Aeolian:    { intervals: [2,1,2,2,1,2,2], label: 'Eólico (Menor)',   color: '#1A7FAF' },
  Locrian:    { intervals: [1,2,2,1,2,2,2], label: 'Locrio',           color: '#cd9f6f' },
}
```

### Escalas de referencia por modo (desde C)

Cada modo aplica su patrón de intervalos desde cualquier raíz. No hay versión "mayor/menor" de un mismo modo — cada uno tiene su propio patrón. Tabla de referencia desde C para verificar la implementación:

```
Ionian     (W W H W W W H): C  D  E  F  G  A  B
Dorian     (W H W W W H W): C  D  Eb F  G  A  Bb
Phrygian   (H W W W H W W): C  Db Eb F  G  Ab Bb
Lydian     (W W W H W W H): C  D  E  F# G  A  B
Mixolydian (W W H W W H W): C  D  E  F  G  A  Bb
Aeolian    (W H W W H W W): C  D  Eb F  G  Ab Bb
Locrian    (H W W H W W W): C  Db Eb F  Gb Ab Bb
```

W = tono (2 semitonos), H = semitono (1 semitono).
`getScale('C', 'Phrygian')` debe retornar `['C','Db','Eb','F','G','Ab','Bb']`, etc.

**Nota importante sobre enarmónicos:** la elección entre sostenidos y bemoles se basa en la armadura de la tonalidad mayor *padre* del modo. Cada modo es una rotación de una escala mayor; el padre se obtiene restando el offset de grado del modo al índice cromático de la raíz. Si la armadura del padre tiene bemoles (< 0), usar `CHROMATIC_FLAT`; si tiene sostenidos (≥ 0), usar `CHROMATIC`.

```js
export const CHROMATIC_FLAT = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

// Offset (semitonos) desde la raíz del modo hasta la raíz de su tonalidad mayor padre
const MODE_DEGREE_OFFSET = {
  Ionian: 0, Dorian: 2, Phrygian: 4, Lydian: 5,
  Mixolydian: 7, Aeolian: 9, Locrian: 11,
}

// Armadura de cada índice cromático como tonalidad mayor (negativo=bemoles, positivo=sostenidos)
// Índice: C  Db   D  Eb   E   F  F#   G  Ab   A  Bb   B
const CHROMATIC_KEY_SIGS = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5]

export function getScale(root, mode) {
  const intervals = GREEK_MODES[mode]?.intervals || GREEK_MODES.Ionian.intervals
  const sharpRoot = normalizeNote(root)
  const rootIdx = CHROMATIC.indexOf(sharpRoot)
  if (rootIdx === -1) return []
  const offset = MODE_DEGREE_OFFSET[mode] ?? 0
  const parentKeyIdx = (rootIdx - offset + 12) % 12
  const keySig = CHROMATIC_KEY_SIGS[parentKeyIdx]
  const chromatic = keySig < 0 ? CHROMATIC_FLAT : CHROMATIC
  const scale = [root]
  let current = rootIdx
  for (let i = 0; i < 6; i++) {
    current = (current + intervals[i]) % 12
    scale.push(chromatic[current])
  }
  return scale
}
```

Resultados de referencia:
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

### Funciones a implementar en musicTheory.js

```js
// Retorna las 12 notas cromáticas
export const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
export const CHROMATIC_FLAT = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

// Dado una nota raíz y un modo, retorna array de 7 notas de la escala
export function getScale(root, mode) { ... }

// Dado una escala de 7 notas, retorna array de 7 acordes diatónicos
// Cada acorde: { degree: 'I', name: 'Cmaj', quality: 'maj'|'min'|'dim'|'aug', notes: [...] }
export function getDiatonicChords(scale, mode) { ... }

// Progresiones sugeridas por modo (retorna array de arrays de grados romanos)
export function getSuggestedProgressions(mode) {
  const progressions = {
    Ionian:     [['I','IV','V','I'], ['I','V','vi','IV'], ['ii','V','I']],
    Dorian:     [['i','IV','i','IV'], ['i','VII','IV'], ['i','ii','i']],
    Phrygian:   [['i','bII','i'], ['i','bVII','bVI','bVII'], ['i','bII','bVII','i']],
    Lydian:     [['I','II','I'], ['I','II','vii','I'], ['IV','I','II','I']],
    Mixolydian: [['I','bVII','IV','I'], ['I','bVII','I'], ['I','IV','bVII']],
    Aeolian:    [['i','VI','III','VII'], ['i','iv','VII','III'], ['i','v','i']],
    Locrian:    [['i°','bII','i°'], ['i°','bVII','bVI']],
  }
  return progressions[mode] || []
}

// Dado nota raíz en el círculo, retorna sus vecinos armónicos
export function getRelations(note) {
  // dominant: quinta arriba, subdominant: quinta abajo, relative minor: tercera menor abajo
  return { dominant, subdominant, relativeMinor, parallelMinor }
}
```

### Calidad de acordes diatónicos por modo

Para `getDiatonicChords`, usar esta tabla de cualidades por grado y modo:
```
Ionian:     maj min min maj maj min dim
Dorian:     min min maj maj min dim maj
Phrygian:   min maj maj min dim maj min
Lydian:     maj maj min dim maj min min
Mixolydian: maj min dim maj min min maj
Aeolian:    min dim maj min min maj maj
Locrian:    dim maj min min maj maj min
```

---

## Componentes

### `Nav.jsx`
- Tab bar fija abajo, 3 items: **Círculo** / **Explorador** / **Guardadas**
- Iconos SVG inline (no usar librería externa de iconos)
- Highlight en tab activo con color dorado

### `CircleOfFifths.jsx`

SVG circular responsivo (`viewBox="0 0 440 440"`), centrado en `220,220`.

**Anillos concéntricos (de afuera hacia adentro):**
1. **Anillo de armadura** — radio exterior 215, interior 190. 12 segmentos. Texto con notación: `0`, `1♯`, `2♯`...`6♯` en el lado de sostenidos, `1♭`, `2♭`...`6♭` en el lado de bemoles. Fuente pequeña, color `var(--text-muted)`. Solo referencia visual, sin interacción.
2. **Anillo Mayor** — radio exterior 190, interior 140. 12 segmentos. Texto con nombre de nota.
3. **Anillo Menor** — radio exterior 140, interior 100. 12 segmentos. Contenido alternado según `innerRingMode` (ver más abajo).
4. **Anillo de referencia de grados** — radio exterior 100, interior 62. Muestra I II III... del modo activo si hay tónica seleccionada.

**Armadura por posición — agregar en `musicTheory.js`:**
```js
export const KEY_SIGNATURES = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6,
}
// positivo = sostenidos, negativo = bemoles
// formatear: n > 0 ? n+"♯" : n < 0 ? Math.abs(n)+"♭" : "0"
```

**Toggle de anillo interior (`innerRingMode`):**
Pill toggle de dos estados:
- **`relative`** — comportamiento por defecto. Muestra la relativa menor en el anillo interior. El círculo muestra colores de familia armónica (tónica/dominante/subdominante/relativa). Una leyenda debajo del círculo identifica los colores.
- **`scale`** — el círculo **no** ilumina notas de escala. En su lugar, aparece `NoteGrid` debajo del SVG en lugar del toggle. El NoteGrid muestra las notas organizadas en disposición de piano (3 filas × 13 columnas). Clicar una nota → esa nota se convierte en la tónica y se iluminan las notas de la escala resultante en el grid. El círculo en modo `scale` sigue mostrando los colores de familia armónica sin cambio.

**Interacción en anillo Menor:**
El anillo Menor siempre es clicable (en ambos modos). Al hacer tap en un segmento:
- La nota relativa menor se convierte en la nueva tónica (`selectedNote`)
- El modo cambia automáticamente a `Aeolian`
- El estado sube a `App.jsx`

**Colores de segmentos (familias armónicas):**
Cuando hay tónica seleccionada, colorear:
- Tónica: `#ED8B16` (dorado)
- Dominante (5ta): `#00A896` (teal)
- Subdominante (4ta): `#1A7FAF` (azul)
- Relativa menor (para mayor): `#C2BB00` (lima)
- Resto: `rgba(255,255,255,0.06)`

Sin tónica seleccionada: todos los segmentos en color neutro con borde sutil.

**Interacción:**
- Tap en segmento mayor → selecciona como tónica, resalta relaciones, emite estado arriba
- El estado `selectedNote` sube a `App.jsx` y se comparte con `ChordExplorer`
- Botón de reset en centro del SVG (pequeño ×)

**Controles sobre/bajo el círculo:**
- Selector de modo griego (pill-tabs o dropdown)
- Pill toggle `innerRingMode`: `Relativa | Escala`

### `ChordExplorer.jsx`

Layout vertical:
1. **Header**: muestra "X — Modo Jónico" con la nota seleccionada del círculo (o picker manual si no hay)
2. **Escala**: 7 notas en pills horizontales con scroll
3. **Acordes diatónicos**: grid 7 columnas (o wrap en mobile). Cada card muestra:
   - Grado romano
   - Nombre del acorde (ej. "Am")
   - Calidad (maj/min/dim)
   - Tap → lo agrega al constructor de progresión
4. **Progresiones sugeridas**: lista de chips clicables. Tap → carga la progresión en el builder
5. **Builder manual**: área donde aparecen los acordes seleccionados en orden, con handle para reordenar (simple: botones ← →), botón para guardar con nombre

### `ProgressionBuilder.jsx`

Subcomponente del Explorer:
- Muestra acordes seleccionados como chips con × para eliminar y botones ‹ › para reordenar
- **Tap en chip** → llama `playChord(chordObj.notes, rootNote)` — reproduce ese acorde
- **Chip activo durante reproducción** → clase CSS `.builder-chip.active` (borde dorado, glow, scale)
- Input de nombre + botón "Guardar" → llama al hook

**Reproducción de progresión:**
- Estado local: `isPlaying` (bool), `activeChordIndex` (int|null), `bpm` (default 90)
- Botón ▶ Play / ■ Stop — alterna entre reproducir y detener
- Al Play: resuelve acordes a arrays de notas científicas y llama `playProgression(chordNoteArrays, bpm, i => setActiveChordIndex(i))`
- Al Stop: `stopPlayback()`, limpia `activeChordIndex`

**Slider de BPM:**
- Rango 60–160, default 90
- Solo visible cuando hay ≥ 2 acordes en el builder
- Label con valor actual: `90 BPM`

### `SavedProgressions.jsx`

Lista de tarjetas. Cada una muestra:
- Nombre de la progresión
- Tonalidad + Modo
- Acordes en chips (no editables, solo display)
- Botón eliminar (icono trash, confirmación inline)
- Botón "Cargar" → navega a Explorador con esa progresión precargada

### `NoteGrid.jsx`

Retícula de notas en disposición de piano (3 filas × 13 columnas). Aparece debajo del círculo de quintas cuando `innerRingMode === 'scale'`, reemplazando el pill toggle.

**Layout (13 columnas, columnas impares = naturales, pares = accidentales):**
```
col:   1    2    3    4    5    6    7    8    9   10   11   12   13
fila1:      C#        D#        —         F#        G#        A#
fila2: C         D         E         F         G         A         B
fila3:      Db        Eb        —         Gb        Ab        Bb
```

**Props:** `{ selectedNote, setSelectedNote, selectedMode, onBack }`

**Comportamiento:**
- Tap en celda → `setSelectedNote(note)` (tap en tónica activa → deselecciona)
- `getScale(selectedNote, selectedMode)` → compara con **igualdad exacta de string** (sin mapeo enarmónico: A# y Bb son celdas independientes)
- Tónica: color `var(--gold)` con fondo dorado tenue
- En escala: color/borde/fondo derivados de `GREEK_MODES[selectedMode].color`
- Fuera de escala: opacity 0.3
- Sin nota seleccionada: todas las celdas en estado neutral
- Celdas vacías (col 6 en filas 1 y 3, sin E#/Fb): div inerte con fondo y borde transparentes

**Header interno:**
Muestra pill toggle compacto "Relativa | Escala" — clicar "Relativa" llama `onBack()` para volver al modo relativa.

---

### `audio.js` (`src/lib/audio.js`)

Módulo de audio aislado. Usa Tone.js (`npm install tone`).

```js
import * as Tone from 'tone'

export async function initAudio()   // inicia el AudioContext (requiere gesto del usuario)
export function toScientific(note, rootNote)  // 'E','C' → 'E4'; notas bajo la raíz → octava 5
export function playChord(notes, rootNote, duration)  // reproduce un acorde
export async function playProgression(chordList, bpm, onChordChange)  // reproduce progresión completa
export function stopPlayback()      // para transporte y libera voces
```

- `PolySynth` con oscilador triángulo y envelope suave (attack 0.02, decay 0.3, sustain 0.4, release 1.2)
- `toScientific` coloca todas las notas en octava 4 excepto las que tienen índice cromático menor al de la raíz, que van a octava 5 (posición cerrada)
- `playProgression` usa `Tone.Sequence` con intervalo `'1m'` por acorde y llama `onChordChange(index)` para resaltar el acorde activo en la UI

### `useProgressions.js`

```js
// localStorage key: 'sonichords_progressions'
// Schema de cada progresión:
{
  id: crypto.randomUUID(),
  name: string,
  root: string,       // 'C', 'G', etc.
  mode: string,       // 'Ionian', 'Dorian', etc.
  chords: string[],   // ['Cmaj', 'Fmaj', 'Gmaj', 'Cmaj']
  createdAt: ISO string
}

export function useProgressions() {
  // retorna: { progressions, save, remove, load }
}
```

---

## PWA Config (`vite.config.js`)

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sonichords',
        short_name: 'Sonichords',
        description: 'Círculo de quintas, modos griegos y progresiones de acordes',
        theme_color: '#001E2B',
        background_color: '#001E2B',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
})
```

Crear íconos placeholder en `public/`:
- `icon-192.png` y `icon-512.png` (pueden ser simples PNG con fondo oscuro y la letra S o el texto "SC", generados con canvas o cualquier imagen por ahora)

---

## App.jsx — Estado global

```jsx
// Estado compartido entre vistas:
const [selectedNote, setSelectedNote] = useState(null)   // nota del círculo
const [selectedMode, setSelectedMode] = useState('Ionian')
const [activeProgression, setActiveProgression] = useState([]) // chords en builder
const [activeTab, setActiveTab] = useState('circle')
```

Pasar props hacia abajo. No usar Context por ahora (app pequeña).

---

## Orden de implementación sugerido

1. `musicTheory.js` — toda la lógica, sin UI. Testear en consola.
2. `App.jsx` skeleton con Nav y 3 tabs vacías
3. `CircleOfFifths.jsx` — SVG estático primero, luego interacción
4. `ChordExplorer.jsx` + `ProgressionBuilder.jsx`
5. `useProgressions.js` + `SavedProgressions.jsx`
6. PWA config + íconos
7. Polish visual: fuentes, colores, transiciones

---

## Notas finales

- Mobile-first. Testear en 390px de ancho (iPhone 14 viewport).
- CSS puro con variables. Sin frameworks, sin preprocesadores, sin CSS Modules.
- No usar librerías de componentes UI (no shadcn, no MUI).
- No usar librerías de iconos externas. SVG inline para los 3 íconos del Nav.
- El SVG del círculo debe ser completamente funcional sin JavaScript de terceros.
- Deploy final en Cloudflare Pages (`npm run build` → carpeta `dist`).