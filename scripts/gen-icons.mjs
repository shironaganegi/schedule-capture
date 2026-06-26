// 依存ゼロで apple-touch-icon 用 PNG を生成する（sharp/canvas 等のネイティブ依存を避ける）。
// Node 標準の zlib だけで PNG をエンコードする。manifest アイコンは SVG を使うため PNG はこれ1枚のみ。
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'icons');
const OUT = join(OUT_DIR, 'apple-touch-icon-180.png');

const SIZE = 180;
const INDIGO = [79, 70, 229]; // #4f46e5
const WHITE = [255, 255, 255];

// CRC32 テーブル
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// ピクセル色を返す: インディゴ背景にカレンダー風の白い角丸ブロックと上帯
function colorAt(x, y) {
  const m = 30; // 余白
  const bodyTop = 52;
  if (x >= m && x < SIZE - m && y >= bodyTop && y < SIZE - m) {
    // 上帯（リング部分）はインディゴで抜く
    if (y < bodyTop + 18) return INDIGO;
    return WHITE;
  }
  // 上部のリング2本
  if (y >= 36 && y < 64) {
    if ((x >= 58 && x < 72) || (x >= 108 && x < 122)) return WHITE;
  }
  return INDIGO;
}

const raw = Buffer.alloc(SIZE * (1 + SIZE * 3));
let p = 0;
for (let y = 0; y < SIZE; y++) {
  raw[p++] = 0; // filter type: none
  for (let x = 0; x < SIZE; x++) {
    const [r, g, b] = colorAt(x, y);
    raw[p++] = r;
    raw[p++] = g;
    raw[p++] = b;
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type: RGB
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
]);

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, png);
console.log(`generated ${OUT} (${png.length} bytes)`);
