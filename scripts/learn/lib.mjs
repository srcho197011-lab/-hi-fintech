/* ══════════ 학습 루프 공용 — 번들 로드 · 텔레메트리 저장소 (Phase F) ══════════
   배포 소스를 그대로 Node에서 돌린다(하네스와 같은 방식).
   브라우저에서는 텔레메트리가 localStorage에 쌓이지만, Node에서는 파일(JSONL)에 쌓는다.
   **같은 `telemEvent` 함수를 쓰기 때문에 스키마가 갈라지지 않는다.** */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const LEARN_DIR = join(ROOT, "docs", "hi_learn");
export const TELEM_FILE = join(LEARN_DIR, "telemetry.jsonl");

export const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");
export const readJ = (...p) => { try { return JSON.parse(read(...p)); } catch (e) { return null; } };
export const ensureDir = (d) => { mkdirSync(d, { recursive: true }); return d; };

/* localStorage 대역 — 텔레메트리는 여기에 모였다가 파일로 내려간다 */
export function makeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _dump: () => Object.fromEntries(m),
  };
}

/* 배포 번들(데이터·유틸 계층) 로드 — A1 응답 엔진은 컴포넌트라 stub으로 대체한다(Phase E와 동일 제약) */
export function loadBundle(opts) {
  opts = opts || {};
  const hc = readJ("src", "data", "homecare.json");
  const files = read("src", "_manifest.txt").split(/\r?\n/).filter((f) => f && /^src\/(data|utils)\//.test(f) && !/\.json$/.test(f));
  let src = "let _homecareData = __HC__;\n";
  for (const f of files) { try { src += read(f) + "\n"; } catch (e) {} }
  src += `
function aiRespond(q) {
  return { bubbles: [{ kind: "text", text: "A1 설명: " + String(q).slice(0, 24) + " 관련 의학 정보예요." }], quicks: ["내 결과 보기"] };
}
`;
  src += ";return { answer: (typeof agentAnswer === 'function' ? agentAnswer : null), route: agentRoute, routeLog: agentRouteLog,"
    + " telem: { push: telemPush, event: telemEvent, key: TELEM_KEY, summary: telemSummary },"
    + " ens: ensembleAnswer, det: ensDetect, agents: HI_AGENTS, scores: agentScores, setKB: hiDoctorSetKB,"
    + " guards: { A2: insuranceGuard, A3: shoppingGuard, A4: homecareGuard },"
    + " logs: { u: hiULog, miss: agentMissLog, ins: insGuardLog, shop: shopGuardLog, care: hcGuardLog } };";
  const store = opts.store || makeStore();
  if (opts.raw) store.setItem("hifin_telem_raw", "1");
  const B = new Function("window", "localStorage", "sessionStorage", "document", "__HC__", src)(undefined, store, store, undefined, hc);
  try { B.setKB(readJ("src", "data", "kdca.json"), readJ("src", "data", "report.json"), readJ("src", "data", "kdca_qa.json")); } catch (e) {}
  B._store = store;
  return B;
}

/* 저장소의 텔레메트리를 파일로 내린다(append) */
export function flushTelemetry(store, file) {
  ensureDir(LEARN_DIR);
  const f = file || TELEM_FILE;
  let list = [];
  try { list = JSON.parse(store.getItem("hifin_telemetry") || "[]"); } catch (e) { list = []; }
  if (!list.length) return 0;
  appendFileSync(f, list.map((e) => JSON.stringify(e)).join("\n") + "\n", "utf8");
  store.removeItem("hifin_telemetry");
  return list.length;
}

export function loadTelemetry(file) {
  const f = file || TELEM_FILE;
  if (!existsSync(f)) return [];
  return readFileSync(f, "utf8").split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
}

export function writeJ(file, obj) { ensureDir(dirname(file)); writeFileSync(file, JSON.stringify(obj, null, 1), "utf8"); }
export function writeT(file, txt) { ensureDir(dirname(file)); writeFileSync(file, txt, "utf8"); }

/* ── 스냅샷 — **바꾸는 쪽이 되돌릴 준비를 한다** ──
   게이트가 스냅샷을 뜨면 이미 증분된 상태를 찍게 된다(되돌릴 지점이 오염돼 있다).
   그래서 증분(promote --apply) 직전에 뜨고, 게이트는 그 지점으로 되돌린다. */
export const WATCHED = [
  join(ROOT, "docs", "agent-mesh", "db", "golden-learned.json"),
  join(ROOT, "docs", "hi_nlu", "corpus", "all_corpus.json"),
];
const LATEST = join(LEARN_DIR, "snapshots", "latest.json");

export function takeSnapshot(tag) {
  const stamp = String(tag || Date.now());
  const dir = ensureDir(join(LEARN_DIR, "snapshots", stamp));
  const files = [];
  for (const f of WATCHED) {
    if (!existsSync(f)) continue;
    const dst = join(dir, basename(f));
    writeFileSync(dst, readFileSync(f));
    files.push({ file: f, snap: dst });
  }
  ensureDir(join(LEARN_DIR, "snapshots"));
  writeFileSync(LATEST, JSON.stringify({ dir, files, ts: Date.now() }, null, 1), "utf8");
  return { dir, files };
}

export function latestSnapshot() {
  try { return JSON.parse(readFileSync(LATEST, "utf8")); } catch (e) { return null; }
}

export function restoreSnapshot(snap) {
  if (!snap || !snap.files) return 0;
  let n = 0;
  for (const f of snap.files) { if (existsSync(f.snap)) { writeFileSync(f.file, readFileSync(f.snap)); n++; } }
  return n;
}
