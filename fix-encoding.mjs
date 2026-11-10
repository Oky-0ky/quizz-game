import { readFileSync, writeFileSync } from 'fs';

// Byte-level repair. Original UTF-8 bytes (emoji as 3-4 byte sequences) were misinterpreted
// as Windows-1252 and re-encoded as UTF-8 (each byte >= 0x80 became 2 bytes). Reversible.
const path = 'src/data/gameData.ts';
const buf = readFileSync(path);

// Decode the current file as UTF-8, allowing lone surrogates, producing the "mojibake" text
// whose code units equal the ORIGINAL byte values.
const decoded = new TextDecoder('utf-8').decode(buf);

const orig = Buffer.alloc(decoded.length);
for (let i = 0; i < decoded.length; i++) {
  const cp = decoded.codePointAt(i);
  if (cp > 0xff) throw new Error(`non-byte code unit U+${cp.toString(16)} at ${i}`);
  orig[i] = cp;
}
const check = orig.toString('utf8');
if (!check.includes('\u{1FA99}')) { console.error('FAIL'); process.exit(1); }
writeFileSync(path, orig);
console.log('OK bytes:', orig.length);
