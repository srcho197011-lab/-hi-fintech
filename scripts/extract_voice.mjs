/* 영상에서 내레이션 음성 샘플 추출 — 크롬 WebAudio로 디코드 → 모노 16bit WAV 저장 (ffmpeg 없이)
   사용: node scripts/extract_voice.mjs <5799 서버 기준 영상 경로> <out.wav> [시작초] [길이초]
   시작초를 생략하면 10초 단위 음량표만 출력한다(구간 고르기용). */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
const [SRC, OUT, START, LEN] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 300000 });
const p = await b.newPage();
await p.goto('http://localhost:5799/docs/hi_promo/' + encodeURIComponent('시사실.html'), { waitUntil: 'domcontentloaded' });
const r = await p.evaluate(async (src, start, len) => {
  const ac = new OfflineAudioContext(1, 44100, 44100);
  const buf = await ac.decodeAudioData(await (await fetch(src)).arrayBuffer());
  const sr = buf.sampleRate, n = buf.length, ch = buf.numberOfChannels; const mono = new Float32Array(n);
  for (let c = 0; c < ch; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) mono[i] += d[i] / ch; }
  const prof = []; for (let s = 0; s < n; s += sr * 10) { let e = 0, m = Math.min(n, s + sr * 10); for (let i = s; i < m; i++) e += mono[i] * mono[i]; prof.push(+Math.sqrt(e / (m - s)).toFixed(4)); }
  if (start == null) return { duration: +(n / sr).toFixed(1), sr, ch, rms10s: prof };
  const a = Math.floor(start * sr), z = Math.min(n, a + Math.floor(len * sr)), seg = mono.subarray(a, z);
  let pk = 0; for (let i = 0; i < seg.length; i++) pk = Math.max(pk, Math.abs(seg[i])); const g = pk ? 0.92 / pk : 1;
  const wav = new DataView(new ArrayBuffer(44 + seg.length * 2)); const W = (o, s) => { for (let i = 0; i < s.length; i++) wav.setUint8(o + i, s.charCodeAt(i)); };
  W(0, 'RIFF'); wav.setUint32(4, 36 + seg.length * 2, true); W(8, 'WAVEfmt '); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 1, true);
  wav.setUint32(24, sr, true); wav.setUint32(28, sr * 2, true); wav.setUint16(32, 2, true); wav.setUint16(34, 16, true); W(36, 'data'); wav.setUint32(40, seg.length * 2, true);
  for (let i = 0; i < seg.length; i++) wav.setInt16(44 + i * 2, Math.max(-1, Math.min(1, seg[i] * g)) * 32767, true);
  const u8 = new Uint8Array(wav.buffer); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return { duration: +(n / sr).toFixed(1), sr, segSec: +(seg.length / sr).toFixed(1), b64: btoa(s) };
}, SRC, START == null ? null : Number(START), Number(LEN || 60));
if (r.b64) { writeFileSync(OUT, Buffer.from(r.b64, 'base64')); delete r.b64; }
console.log(JSON.stringify(r));
await b.close();
