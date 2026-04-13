import { writeFileSync } from 'fs'
import { deflateSync } from 'zlib'

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : (c >>> 1)
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcVal = Buffer.alloc(4)
  crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcVal])
}

function createPNG(size) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB

  // Build pixel data: dark background #0a0a0f with gold circle and "S"
  const pixels = Buffer.alloc(size * size * 3)
  const cx = size / 2, cy = size / 2
  const outerR = size * 0.42
  const innerR = size * 0.28
  const strokeW = size * 0.06

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 3
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Background: #0a0a0f
      let r = 0x0a, g = 0x0a, b = 0x0f

      // Gold ring: #c8a96e
      if (dist >= outerR - strokeW && dist <= outerR) {
        r = 0xc8; g = 0xa9; b = 0x6e
      }
      // Inner ring: #7c6fcd (violet)
      else if (dist >= innerR - strokeW * 0.6 && dist <= innerR) {
        r = 0x7c; g = 0x6f; b = 0xcd
      }
      // Horizontal tick at 12 o'clock
      else if (
        Math.abs(x - cx) < size * 0.04 &&
        y >= cy - outerR && y <= cy - innerR
      ) {
        r = 0xc8; g = 0xa9; b = 0x6e
      }
      // Horizontal tick at 6 o'clock
      else if (
        Math.abs(x - cx) < size * 0.04 &&
        y >= cy + innerR && y <= cy + outerR
      ) {
        r = 0xc8; g = 0xa9; b = 0x6e
      }

      pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b
    }
  }

  // Add filter bytes (0 = None) before each row
  const rows = Buffer.alloc(size * (1 + size * 3))
  for (let y = 0; y < size; y++) {
    rows[y * (1 + size * 3)] = 0
    pixels.copy(rows, y * (1 + size * 3) + 1, y * size * 3, (y + 1) * size * 3)
  }

  const idat = deflateSync(rows, { level: 6 })

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync('./public/icon-192.png', createPNG(192))
writeFileSync('./public/icon-512.png', createPNG(512))
console.log('Icons generated: public/icon-192.png and public/icon-512.png')
