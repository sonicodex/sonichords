# Sonichords — Guía de usuario

**Sonichords** es una app personal para explorar el círculo de quintas, entender los modos griegos y construir progresiones de acordes. Funciona sin conexión y se instala en tu iPhone desde Safari.

---

## Instalación en iPhone

1. Abre Safari y navega a la URL de la app.
2. Toca el botón de compartir (cuadrado con flecha hacia arriba).
3. Selecciona **"Agregar a pantalla de inicio"**.
4. Confirma el nombre y toca **Agregar**.

La app se comporta como una app nativa: pantalla completa, sin barra del navegador, y funciona sin conexión después del primer uso.

---

## Las tres pantallas

La barra de navegación en la parte inferior tiene tres tabs:

| Tab | Qué hace |
|-----|----------|
| **Círculo** | Visualiza el círculo de quintas y las relaciones armónicas |
| **Explorador** | Muestra los acordes diatónicos del modo seleccionado |
| **Guardadas** | Lista de progresiones que hayas guardado |

---

## Círculo de Quintas

El círculo es la pantalla principal. Muestra cuatro anillos concéntricos:

### Los cuatro anillos

| Anillo | Contenido |
|--------|-----------|
| **Exterior — Armadura** | Número de sostenidos (♯) o bemoles (♭) de cada tonalidad. `0` = Do mayor (sin alteraciones), `1♯` = Sol mayor, `2♭` = Si♭ mayor, etc. Solo referencia visual, sin interacción. |
| **Mayor** | Las 12 tonalidades mayores. Empieza en **Do** arriba (12 en punto) y gira en sentido horario por quintas: Do → Sol → Re → La → Mi → Si → Fa# → Reb → Lab → Mib → Sib → Fa. **Toca aquí para seleccionar la tónica.** |
| **Menor / Escala** | Muestra las relativas menores (modo *Relativa*) o colorea qué notas pertenecen a la escala activa (modo *Escala*). Ver toggle abajo. |
| **Grados** | Con tónica seleccionada, muestra el número de grado romano (I, II, III…) de cada nota de la escala del modo activo. |

### Leer la armadura

La armadura indica cuántas alteraciones tiene una tonalidad:

- **0** → Do mayor / La menor — sin sostenidos ni bemoles
- **1♯, 2♯…** → Sol, Re, La, Mi… mayor — sostenidos (lado derecho del círculo)
- **1♭, 2♭…** → Fa, Si♭, Mi♭… mayor — bemoles (lado izquierdo del círculo)

### Seleccionar una tónica

Toca cualquier segmento del **anillo mayor** para seleccionarlo como tónica. Los colores cambian para mostrar las relaciones armónicas:

| Color | Significado |
|-------|-------------|
| **Dorado** | Tónica (I) |
| **Violeta** | Dominante (quinta — V) |
| **Azul** | Subdominante (cuarta — IV) |
| **Violeta suave** | Relativa menor (en el anillo menor) |

Para deseleccionar, toca el **×** en el centro del círculo, o toca el mismo segmento de nuevo.

### Toggle Relativa / Escala

Debajo del círculo hay un pequeño toggle con dos modos para el **anillo interior**:

- **Relativa** — muestra los nombres de las tonalidades menores relativas (Am, Em, Bm…). Comportamiento por defecto.
- **Escala** — con una tónica seleccionada, colorea los segmentos: los que pertenecen a la escala del modo activo se iluminan con el color del modo, los que no pertenecen quedan en gris.

El modo Escala es útil para ver de un vistazo qué notas del círculo están disponibles en la tonalidad activa.

### Selector de modo

Encima del círculo hay 7 pills horizontales con los modos griegos. Cambia el modo para actualizar los colores del anillo de grados y los acordes del Explorador.

---

## Modos griegos

Cada modo tiene un carácter armónico distinto:

| Modo | Carácter | Usos típicos |
|------|----------|--------------|
| **Jónico** (Mayor) | Brillante, estable | Pop, clásica, rock |
| **Dórico** | Oscuro pero esperanzador | Jazz, funk, blues-rock |
| **Frigio** | Tenso, flamenco | Metal, flamenco, música árabe |
| **Lidio** | Etéreo, soñador | Bandas sonoras, jazz-fusión |
| **Mixolidio** | Relajado, bluesy | Blues, rock, funk |
| **Eólico** (Menor) | Triste, melancólico | Pop, baladas, rock |
| **Locrio** | Inestable, disonante | Metal extremo, raramente usado |

---

## Explorador de Acordes

### Cabecera

Muestra la tónica actual (grande, en dorado) y el modo activo. Si vienes del Círculo con una nota seleccionada, aparece aquí automáticamente. Si no, puedes elegir la tónica directamente con el selector de notas que aparece arriba.

### Selector de modo

Las mismas 7 pills del Círculo están disponibles aquí también para cambiar el modo sin salir del Explorador.

### Escala

Siete pills con las notas de la escala. Cada pill muestra el grado (I, II…) y la nota correspondiente.

### Acordes diatónicos

Grid con los 7 acordes de la escala, coloreados por calidad:

| Color | Calidad |
|-------|---------|
| **Dorado** | Acorde mayor |
| **Violeta** | Acorde menor |
| **Rojo** | Acorde disminuido |

Toca un acorde para **agregarlo al Constructor de progresión** en la parte inferior. Puedes agregar el mismo acorde varias veces.

### Progresiones sugeridas

Chips con progresiones típicas para el modo activo. Tocar uno **carga todos sus acordes** directamente en el Constructor, reemplazando los anteriores.

---

## Constructor de progresión

Aparece en la parte inferior del Explorador. Conforme agregas acordes, se van apilando aquí.

### Escuchar un acorde

Toca cualquier chip de acorde en el constructor para reproducirlo. Oirás las tres notas de la tríada con un sonido de piano eléctrico suave.

### Reproducir la progresión

Cuando tienes 2 o más acordes, aparecen los controles de reproducción:

- **▶ Play** — reproduce toda la progresión en loop. El acorde activo se resalta con borde dorado.
- **■ Stop** — detiene la reproducción.
- **Slider de BPM** — ajusta el tempo entre 60 y 160 BPM. El valor actual aparece a la derecha del slider.

### Reordenar

Cada acorde tiene botones **‹** (mover izquierda) y **›** (mover derecha). El botón **×** elimina ese acorde.

### Guardar

1. Escribe un nombre en el campo de texto.
2. Toca **Guardar** (o pulsa Enter en el teclado).

La progresión se guarda con la tónica y el modo activos, y aparece en la pantalla **Guardadas**.

---

## Progresiones guardadas

Lista de todas las progresiones que hayas guardado. Cada tarjeta muestra:

- **Nombre** de la progresión
- **Tónica y modo** (ej. *La · Eólico (Menor)*)
- **Acordes** como chips
- Botón **Cargar en Explorador** — navega al Explorador con esa progresión precargada y la tónica/modo restaurados
- Botón de **papelera** — pide confirmación antes de borrar

---

## Almacenamiento

Todo se guarda en el almacenamiento local del dispositivo (`localStorage`). No hay servidor ni cuenta. Tus progresiones son tuyas.

Si limpias los datos de Safari o desinstalas la app, se pierden las progresiones guardadas.

---

## Preguntas frecuentes

**¿Qué es el círculo de quintas?**
Es una representación circular de las 12 tonalidades ordenadas por intervalos de quinta. Cada nota es una quinta justa más aguda que su vecina en sentido horario. Las tonalidades cercanas en el círculo comparten más notas en común y suelen funcionar bien juntas en una progresión.

**¿Para qué sirven los modos griegos?**
Los modos son escalas de 7 notas que empiezan en diferentes grados de la escala mayor. Cada modo tiene un "color" emocional distinto porque la distancia entre las notas cambia. El modo Jónico es la escala mayor clásica; el Eólico es la menor natural.

**¿Qué significa el anillo de armadura?**
La armadura de clave indica cuántas notas alteradas (sostenidos o bemoles) tiene una tonalidad. Do mayor no tiene ninguna (0), Sol mayor tiene un sostenido (Fa#), Fa mayor tiene un bemol (Si♭). Cuanto más a la derecha en el círculo, más sostenidos; cuanto más a la izquierda, más bemoles.

**¿Qué es el toggle Relativa/Escala?**
Es un cambio de vista para el anillo interior del círculo. En modo *Relativa* ves los nombres de las menores relativas (tradicional). En modo *Escala*, con una tónica activa, se iluminan las notas que pertenecen a la escala del modo elegido — útil para ver de un vistazo qué notas están disponibles.

**¿Qué significa I, IV, V?**
Son los grados de la escala en números romanos. En Do mayor: I = Do, IV = Fa, V = Sol. La progresión I–IV–V es la base del blues y el rock clásico.

**¿Por qué "acorde diatónico"?**
Diatónico significa "dentro de la escala". Los 7 acordes diatónicos se construyen sobre cada nota de la escala apilando terceras. Son los acordes más naturales para una tonalidad y modo dado, y los más usados en armonía funcional.

---

*Sonichords — herramienta personal de teoría musical*
