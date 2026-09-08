import { readFileSync } from 'node:fs';
const b = readFileSync(process.argv[2]);
const s = b.toString('latin1');
const m = s.match(/\/Type\s*\/Page[^s]/g);
console.log("페이지 " + (m ? m.length : "?"));
