# Sonichords — Prompt Feature 2: Buscador de acordes de guitarra

## Descripción general
Nueva tab **ACORDES** en el Nav, ubicada entre EXPLORADOR y GUARDADAS (tercer ítem). Ícono SVG inline sugerido: un diagrama de traste simple (rectángulo con líneas verticales y un punto).

La sección tiene tres submodos accesibles por pills horizontales internos: **Diccionario**, **Buscar**, **Identificar**.

---

## Archivos a crear

```
src/
  components/
    ChordFinder.jsx
    ChordFinder.css
    GuitarDiagram.jsx
    GuitarDiagram.css
  lib/
    chordLibrary.js
    chordIdentifier.js
```

---

## `src/lib/chordLibrary.js`

Estructura de cada acorde:

```js
{
  root: 'C',
  type: 'maj',
  name: 'C',
  fullName: 'C Major',
  notes: ['C', 'E', 'G'],  // pitch classes sin octava
  voicings: [
    {
      fretOffset: 0,
      dots: [{ string: 1, fret: 3 }, { string: 2, fret: 2 }, { string: 4, fret: 1 }],
      // string: índice 0=cuerda 6 (Mi grave), 5=cuerda 1 (Mi agudo)
      openStrings: [false, false, true, false, false, true],
      mutedStrings: [true, false, false, false, false, false],
      fingerNumbers: [null, null, 2, 3, 1, null],
    }
  ]
}
```

Incluir 16 tipos por cada una de las 12 raíces (≈192 acordes). Tipos: `maj, min, 7, maj7, min7, sus2, sus4, dim, dim7, aug, 9, maj9, min9, add9, 6, min6`.

Voicings de referencia en notación string (cuerda 6→1, x=muted, 0=open):
```
C maj:   x32010    C min:   x35543    C 7:     x32310
C maj7:  x32000    C min7:  x35343    C sus2:  x30010
C sus4:  x33010    C dim:   x34242    C dim7:  x34242
C aug:   x32110    C 9:     x32330    C maj9:  x30002
C min9:  x35333    C add9:  x32030    C 6:     x32210
C min6:  x35353
```

Transponer cada voicing correctamente para las 12 raíces. Para acordes sin posición open natural usar barre chords.

---

## `src/lib/chordIdentifier.js`

```js
// Afinación estándar: cuerda 6 a cuerda 1
export const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']

const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

// Convierte dots + openStrings + mutedStrings + fretOffset a pitch classes
export function dotsToNotes(dots, openStrings, mutedStrings, fretOffset) { ... }

// Dado un array de pitch classes, busca el mejor match en chordLibrary
// Retorna: { chord, missingNotes, extraNotes, inversion }
export function identifyChord(pitchClasses) { ... }
```

La identificación debe manejar inversiones (la nota más grave no es necesariamente la raíz).

---

## `src/components/GuitarDiagram.jsx`

Componente SVG reutilizable. Props:

```js
{
  dots: [{ string, fret }],        // posiciones de dedos
  openStrings: bool[6],            // ○ por cuerda
  mutedStrings: bool[6],           // × por cuerda
  fretOffset: 0,                   // traste base
  fingerNumbers: (int|null)[],     // número de dedo en cada dot
  interactive: false,              // si true: modo editable
  onDotsChange: (dots) => {},      // callback en modo interactivo
  onOpenMutedChange: () => {},     // callback para ○/×
}
```

**Dimensiones SVG:** viewBox `0 0 200 240`. 6 cuerdas, 5 trastes visibles.

**Estética:**
- Fondo: `var(--surface)`
- Cuerdas (líneas verticales): `rgba(255,255,255,0.3)`, 1px
- Trastes (líneas horizontales): `rgba(255,255,255,0.15)`, 1px
- Cejilla (nut): línea gruesa `var(--text)`, 3px — solo cuando `fretOffset === 0`
- Puntos de dedo: círculos rellenos `var(--gold)`, número en `var(--bg)` al centro
- ○ open: círculo vacío `var(--text)` sobre la cejilla
- × muted: `×` en `var(--text-muted)` sobre la cejilla
- Número de traste base a la izquierda cuando `fretOffset > 0`
- Marcadores de traste (trastes 3, 5, 7, 9, 12): punto gris sutil en el borde izquierdo

**Interacción (cuando `interactive: true`):**
- Tap en celda del diagrama: coloca/elimina punto
- Tap en cejilla por cuerda: cicla `none → open → muted → none`
- Botones `▲` / `▼` fuera del SVG para mover `fretOffset` (rango 0–12)

---

## `src/components/ChordFinder.jsx`

### Layout general
```
[Diccionario]  [Buscar]  [Identificar]   ← pills internos
─────────────────────────────────────
contenido del submodo activo
```

### Submodo: Diccionario

Pills horizontales con scroll: `C  C#  D  D#  E  F  F#  G  G#  A  A#  B`

Al seleccionar una nota → lista de acordes de esa raíz en cards compactas:
- Nombre del acorde
- Notas en texto pequeño
- Tap → expande y muestra `GuitarDiagram` en modo display

### Submodo: Buscar

Input de texto en la parte superior. Búsqueda en tiempo real (onChange).

Normalización del input:
- `m` = `min`, `M` o vacío después de nota = `maj`
- `°` = `dim`, `+` = `aug`
- Insensible a mayúsculas en el tipo
- `b` = bemol en la raíz, `#` = sostenido

Resultados como lista de cards. Tap → muestra `GuitarDiagram`.

### Submodo: Identificar

Parte superior: `GuitarDiagram` en modo `interactive={true}`.
Botones `▲` / `▼` para cambiar posición de traste.

Parte inferior: resultado de `identifyChord()`:
- Nombre del acorde identificado en fuente display grande, color `var(--gold)`
- Notas detectadas en pills
- Nombres alternativos en texto muted si los hay
- Si no hay match: "No se reconoce el acorde" + notas detectadas

El resultado se recalcula en tiempo real cada vez que cambia el diagrama.

---

## Actualización del Nav

En `Nav.jsx`, agregar el cuarto ítem entre EXPLORADOR y GUARDADAS:

```jsx
{ id: 'chords', label: 'ACORDES', icon: <svg>...</svg> }
```

Ícono SVG sugerido: rectángulo con 4 líneas verticales y un círculo relleno en una intersección.

En `App.jsx`, agregar el estado y el renderizado de `ChordFinder` junto a los otros tabs.

---

## Al terminar
Actualizar `sonichords-pwa.md` y la documentación del proyecto con la nueva feature completa.