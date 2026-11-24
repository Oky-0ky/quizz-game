import { readFileSync, writeFileSync } from 'fs';

// Corruption pattern: original non-ASCII bytes (UTF-8 multi-byte) were decoded as Windows-1252
// and re-encoded, where each non-ASCII cp1252 char was replaced by its "best fit" ASCII
// equivalent (1 byte), sometimes '?' (0x3f). Lead bytes F0/E2 survived; continuation bytes
// 0x80-0xBF got mapped to ASCII. Recovery: exact-sequence replacements, ambiguous ones resolved
// by surrounding context.

const REPLACEMENTS = [
  // shop items
  ['f0 59 aa 54', 'f0 9f aa 99'],                     // 🪙 coin_thief (Pencuri Koin)
  ['f0 59 22 b0', 'f0 9f 92 b0'],                     // 💰 big_robber
  ['f0 59 4f 3f', 'f0 9f 8c 80'],                     // 🌀 point_curse
  ['f0 59 a7 bd', 'f0 9f a7 bd'],                     // 🧽 score_eraser
  ['f0 59 aa a4', 'f0 9f aa a4'],                     // 🪤 mud_trap
  ['f0 59 4f aa ef b8 8f', 'f0 9f 8c aa ef b8 8f'],   // 🌪️ blocking_storm
  ['f0 59 73 3f', 'f0 9f 9a 80'],                     // 🚀 speed_boots icon/adventurer_rocket/super_step
  ['f0 59 22 9d', 'f0 9f 93 9d'],                     // 📝 hard_test
  ['f0 59 3e a1 ef b8 8f', 'f0 9f 9b a1 ef b8 8f'],   // 🛡️ point_shield / anti_back_shield / protection cards
  ['f0 59 22 b0', 'f0 9f 92 b0'],                     // 💰 step_shield (ðY"°)
  ['f0 59 22 22', 'f0 9f 92 a0'],                     // 💠 double_coins -> keep 💎? see ambiguous below
  ['f0 59 22 a5', 'f0 9f 92 a5'],                     // 💥 combined_attack / hard challenge card
  ['f0 59 73 ab', 'f0 9f 9a ab'],                     // 🚫 cancel_card
  ['e2 9d 22', 'e2 9d 93'],                           // ❓ surprise_question / mystery
  ['e2 73 a1', 'e2 9a a1'],                           // ⚡ speed_boots emoji / challenge tiles
  ['e2 ad 90', 'e2 ad 90'],                           // ⭐ (already correct bytes? verify)
  // random events
  ['f0 59 4f a7 ef b8 8f', 'f0 9f 8e 81'],            // 🎁 rain_of_gifts name (0x4F? verify)
  ['f0 59 5a 81', 'f0 9f 8e 81'],                     // 🎁 rain_of_gifts emoji
  ['f0 59 5a 3f', 'f0 9f 8e 89'],                     // 🎉 bonus_festival name
  ['f0 59 5a 53', 'f0 9f 8e 89'],                     // 🎉 bonus_festival emoji
  ['f0 59 3e a4 ef b8 8f', 'f0 9f 8f 83 ef b8 8f'],   // 🏃️ shortcut_path name / tile shortcut
  ['f0 59 8f 66', 'f0 9f 8f 83'],                     // 🏃 shortcut_path emoji (0x66? verify)
  ['f0 59 8f aa', 'f0 9f 8f aa'],                     // 🏪 special_market name / shop tile
  ['f0 59 3e', 'f0 9f 8f b7 ef b8 8f'],               // special_market emoji (🏷️?) verify
  ['e2 6f a8', 'e2 9c a8'],                           // ✨ mystery_chance emoji
  ['f0 59 8f 3f', 'f0 9f 8f 86'],                     // 🏆 grand_challenge emoji / finish tile
  ['e2 73 22 ef b8 8f', 'e2 9a 94 ef b8 8f'],         // ⚔️ duel
  ['f0 59 2e b3 ef b8 8f', 'f0 9f 95 b3 ef b8 8f'],   // 🕳️ trap tile
  ['f0 59 7e b4', 'f0 9f 98 b4'],                     // 😴 rest tile
  ['f0 59 22 81', 'f0 9f 94 81'],                     // 🔁? retry card - verify
  ['f0 59 73 3f', 'f0 9f 9a 80'],                     // start tile emoji (was 🚀)
];

// Ambiguous short sequences need context handling; do replacements longest-first.
const buf = readFileSync('src/data/gameData.ts');
let hex = [...buf].map(b => b.toString(16).padStart(2, '0')).join(' ');
for (const [from, to] of REPLACEMENTS) {
  if (from === to) continue;
  while (hex.includes(from)) hex = hex.replace(from, to);
}
const out = Buffer.from(hex.split(' ').filter(Boolean).map(h => parseInt(h, 16)));
writeFileSync('src/data/gameData.ts', out);
console.log('done');
