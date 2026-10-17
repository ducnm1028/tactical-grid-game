const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createPng(width, height, r, g, b, a = 255) {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // color type: RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    function chunk(type, data) {
        const len = data.length;
        const buf = Buffer.alloc(len + 12);
        buf.writeUInt32BE(len, 0);
        buf.write(type, 4);
        data.copy(buf, 8);
        const crc = crc32(buf.subarray(4, len + 8));
        buf.writeUInt32BE(crc >>> 0, len + 8);
        return buf;
    }

    // CRC32 table
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[n] = c;
    }
    function crc32(buf) {
        let crc = 0 ^ (-1);
        for (let i = 0; i < buf.length; i++) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
        }
        return (crc ^ (-1)) >>> 0;
    }

    // Raw image data with filter byte 0 at start of each scanline
    const lineLen = 1 + width * 4;
    const rawData = Buffer.alloc(height * lineLen);
    
    // Draw dark blue background with gold/cyan circular emblem
    const cx = width / 2;
    const cy = height / 2;
    const radius = width * 0.42;
    const innerR = width * 0.25;

    for (let y = 0; y < height; y++) {
        const offset = y * lineLen;
        rawData[offset] = 0; // filter: none
        for (let x = 0; x < width; x++) {
            const pxOffset = offset + 1 + x * 4;
            const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
            
            if (dist <= innerR) {
                // Gold core
                rawData[pxOffset] = 245;     // R
                rawData[pxOffset + 1] = 158; // G
                rawData[pxOffset + 2] = 11;  // B
                rawData[pxOffset + 3] = 255; // A
            } else if (dist <= radius) {
                // Cyan ring
                if (dist > radius - (width * 0.05)) {
                    rawData[pxOffset] = 56;
                    rawData[pxOffset + 1] = 189;
                    rawData[pxOffset + 2] = 248;
                    rawData[pxOffset + 3] = 255;
                } else {
                    // Dark navy space
                    rawData[pxOffset] = 15;
                    rawData[pxOffset + 1] = 23;
                    rawData[pxOffset + 2] = 42;
                    rawData[pxOffset + 3] = 255;
                }
            } else {
                // Background dark slate
                rawData[pxOffset] = 3;
                rawData[pxOffset + 1] = 7;
                rawData[pxOffset + 2] = 18;
                rawData[pxOffset + 3] = 255;
            }
        }
    }

    const compressed = zlib.deflateSync(rawData);
    const ihdrChunk = chunk('IHDR', ihdr);
    const idatChunk = chunk('IDAT', compressed);
    const iendChunk = chunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPng(192, 192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPng(512, 512));
console.log('Successfully generated icons/icon-192.png and icons/icon-512.png');
