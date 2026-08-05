const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c >>> 0;
    }
    return t;
  })());
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function hexToRgb(hex) {
  const v = parseInt(hex.replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function makeIcon(size, bg, fg) {
  const [br, bgc, bb] = hexToRgb(bg);
  const [fr, fgc, fb] = hexToRgb(fg);
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const margin = Math.round(size * 0.28);
  const barW = Math.round(size * 0.1);
  const gap = Math.round(size * 0.14);

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter type 0
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 4;
      let r = br, g = bgc, b = bb;
      // draw three simple ascending bars (like a chart) in the center
      const barsTotalW = barW * 3 + gap * 2;
      const startX = (size - barsTotalW) / 2;
      for (let i = 0; i < 3; i++) {
        const bx0 = startX + i * (barW + gap);
        const bx1 = bx0 + barW;
        const barH = margin + i * (size * 0.16);
        const by0 = size - margin - barH * 0 - (i + 1) * (size * 0.12) - margin * 0.2;
        if (x >= bx0 && x < bx1) {
          const topY = size - margin - (i + 1) * (size * 0.16);
          if (y >= topY && y <= size - margin) {
            r = fr; g = fgc; b = fb;
          }
        }
      }
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return png;
}

const outDir = path.join(__dirname, '..', 'public');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'icon-192.png'), makeIcon(192, '#1F3B5C', '#5CAA3C'));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), makeIcon(512, '#1F3B5C', '#5CAA3C'));
console.log('icons written');
