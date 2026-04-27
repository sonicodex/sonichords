# Sonichords — Prompt Feature 1: Estado de ánimo por modo griego

## Descripción
Agregar una línea de texto estático debajo de cada pill del selector de modos griegos que describa el carácter emocional del modo.

## Cambio en `musicTheory.js`

Agregar el campo `mood` a cada entrada de `GREEK_MODES`:

```js
export const GREEK_MODES = {
  Ionian:     { ..., mood: 'Alegre, luminoso, resuelto' },
  Dorian:     { ..., mood: 'Melancólico pero esperanzador' },
  Phrygian:   { ..., mood: 'Oscuro, flamenco, tenso' },
  Lydian:     { ..., mood: 'Etéreo, onírico, flotante' },
  Mixolydian: { ..., mood: 'Rockero, bluesy, dominante' },
  Aeolian:    { ..., mood: 'Triste, introspectivo, dramático' },
  Locrian:    { ..., mood: 'Inestable, disonante, siniestro' },
}
```

## Cambio en los componentes

En todos los lugares donde se renderizan los pills de modo (`CircleOfFifths.jsx` y `ChordExplorer.jsx`), mostrar el mood debajo del pill activo únicamente. Cuando el pill no está activo, el mood no se muestra.

Estructura de cada pill:
```jsx
<div className="mode-pill-wrapper">
  <button className={`mode-pill ${isActive ? 'active' : ''}`}>
    {mode.label}
  </button>
  {isActive && (
    <span className="mode-mood">{mode.mood}</span>
  )}
</div>
```

## Estilos

En los archivos CSS correspondientes:

```css
.mode-pill-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.mode-mood {
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
  white-space: nowrap;
  font-family: var(--font-ui);
  letter-spacing: 0.02em;
}
```

## Al terminar
Actualizar `sonichords-pwa.md` y la documentación del proyecto.