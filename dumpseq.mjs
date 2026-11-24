import { readFileSync } from 'fs';
const buf = readFileSync('src/data/gameData.ts');
let i = 0;
const seqs = [];
while (i < buf.length) {
  if (buf[i] >= 0x80 || (buf[i] === 0x3f && buf[i - 1] >= 0x80)) {
    // cluster: non-ascii plus adjacent '?' ascii produced by corruption
    let j = i, end = i;
    // expand: include ascii '?' and letters Y Z s etc right after non-ascii, tricky; just grab until quote
    while (j < buf.length && buf[j] !== 0x27 && buf[j] !== 0x2c) j++; // until ' or ,
    // trim trailing non-emoji context chars? just record
    seqs.push({ at: i, hex: [...buf.slice(i, j)].map(b => b.toString(16)).join(' ') });
    i = j;
  } else i++;
}
console.log(seqs.map(s => `@${s.at}: [${s.hex}]`).join('\n'));
