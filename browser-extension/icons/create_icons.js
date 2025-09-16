const fs = require("fs");
const path = require("path");

// Простий PNG генератор (мінімальний PNG файл)
function createSimplePNG(width, height) {
  // PNG signature
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0); // Width
  ihdrData.writeUInt32BE(height, 4); // Height
  ihdrData.writeUInt8(8, 8); // Bit depth
  ihdrData.writeUInt8(2, 9); // Color type (RGB)
  ihdrData.writeUInt8(0, 10); // Compression
  ihdrData.writeUInt8(0, 11); // Filter
  ihdrData.writeUInt8(0, 12); // Interlace

  const ihdrCrc = crc32(Buffer.concat([Buffer.from("IHDR"), ihdrData]));
  const ihdr = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0d]), // Length
    Buffer.from("IHDR"),
    ihdrData,
    ihdrCrc,
  ]);

  // Simple blue square data
  const pixelData = [];
  for (let y = 0; y < height; y++) {
    pixelData.push(0); // Filter byte
    for (let x = 0; x < width; x++) {
      // AI-Buyer blue color (66, 133, 244)
      pixelData.push(66); // R
      pixelData.push(133); // G
      pixelData.push(244); // B
    }
  }

  const compressedData = Buffer.from(pixelData);
  const idatCrc = crc32(Buffer.concat([Buffer.from("IDAT"), compressedData]));
  const idat = Buffer.concat([
    Buffer.alloc(4), // Length (будемо заповнювати)
    Buffer.from("IDAT"),
    compressedData,
    idatCrc,
  ]);
  idat.writeUInt32BE(compressedData.length, 0);

  // IEND chunk
  const iend = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // Length
    Buffer.from("IEND"),
    Buffer.from([0xae, 0x42, 0x60, 0x82]), // CRC
  ]);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Простий CRC32 для PNG
function crc32(data) {
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return Buffer.from([
    (crc ^ 0xffffffff) >>> 24,
    (crc ^ 0xffffffff) >>> 16,
    (crc ^ 0xffffffff) >>> 8,
    (crc ^ 0xffffffff) & 0xff,
  ]);
}

// Створити іконки
const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname);

sizes.forEach((size) => {
  const pngData = createSimplePNG(size, size);
  const filename = `icon${size}.png`;
  fs.writeFileSync(path.join(iconsDir, filename), pngData);
  console.log(`Створено ${filename} (${size}x${size})`);
});

console.log("Всі іконки створено!");
