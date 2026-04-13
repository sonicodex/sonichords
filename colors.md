# Sonichords — Prompt: Actualización de paleta de colores

Actualiza todos los colores de la app con la nueva paleta. Los cambios son en `src/index.css` y `src/lib/musicTheory.js`.

## 1. Variables CSS — `src/index.css`

Reemplazar el bloque `:root` con:

```css
:root {
  --bg:           #001E2B;
  --surface:      #003547;
  --border:       #005E54;
  --gold:         #ED8B16;
  --red:          #E1523D;
  --lime:         #C2BB00;
  --teal:         #003547;
  --text:         #F0EDE4;
  --text-muted:   rgba(240,237,228,0.45);
  --font-display: 'Cinzel', serif;
  --font-ui:      'DM Mono', monospace;
  --radius:       10px;
  --transition:   300ms ease;
}
```

## 2. Colores de modos griegos — `src/lib/musicTheory.js`

Reemplazar los colores en `GREEK_MODES`:

```js
export const GREEK_MODES = {
  Ionian:     { intervals: [2,2,1,2,2,2,1], label: 'Jónico (Mayor)',   color: '#ED8B16' },
  Dorian:     { intervals: [2,1,2,2,2,1,2], label: 'Dórico',           color: '#00A896' },
  Phrygian:   { intervals: [1,2,2,2,1,2,2], label: 'Frigio',           color: '#E1523D' },
  Lydian:     { intervals: [2,2,2,1,2,2,1], label: 'Lidio',            color: '#C2BB00' },
  Mixolydian: { intervals: [2,2,1,2,2,1,2], label: 'Mixolidio',        color: '#D4792A' },
  Aeolian:    { intervals: [2,1,2,2,1,2,2], label: 'Eólico (Menor)',   color: '#1A7FAF' },
  Locrian:    { intervals: [1,2,2,1,2,2,2], label: 'Locrio',           color: '#B8A800' },
}
```

## 3. Referencias hardcodeadas

Buscar en todos los archivos `.jsx` y `.css` cualquier referencia hardcodeada a los colores anteriores y reemplazarlas por las variables CSS correspondientes:

- `#c8a96e` / `#0a0a0f` / `#7c6fcd` / `#6f9fcd` / `#9f6fcd` → reemplazar por `var(--gold)`, `var(--bg)`, etc.
- Los colores de familia armónica en `CircleOfFifths.jsx` (tónica, dominante, subdominante, relativa menor) también deben usar las variables: tónica=`var(--gold)`, dominante=`#7c6fcd`→buscar equivalente más cercano en paleta nueva o dejar como valor del modo.

## 4. Al terminar

Actualizar `sonichords-pwa.md` y la documentación del proyecto con la paleta nueva.