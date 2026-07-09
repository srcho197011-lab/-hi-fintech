/* ====================== 시스템 보호 · 접속 로그 유틸 (콘텐츠 보호 하네스) ======================
   접속 로그 기록(시간·페이지·세션·화면·리퍼러·UA), 우클릭/복사/캡처/개발자도구 차단, 화면 워터마크.
   설정·로그는 이 기기(브라우저) localStorage에 저장. 기반 온톨로지 '시스템 보호 콘솔'에서 관리. */
const GUARD_KEY = "hifin_guard_cfg";
const GUARD_LOG_KEY = "hifin_access_log";
const GUARD_DEFAULT = { log: true, noContext: true, noCopy: true, noDevtool: true, watermark: true, shareWarn: true };

function guardCfg() { try { const s = JSON.parse(localStorage.getItem(GUARD_KEY) || "null"); return Object.assign({}, GUARD_DEFAULT, s || {}); } catch (e) { return Object.assign({}, GUARD_DEFAULT); } }
function guardSet(patch) {
  const c = Object.assign(guardCfg(), patch || {});
  try { localStorage.setItem(GUARD_KEY, JSON.stringify(c)); } catch (e) {}
  applyGuard();
  try { window.dispatchEvent(new Event("guardchange")); } catch (e) {}
  return c;
}
function _guardSid() {
  try { let s = sessionStorage.getItem("hifin_sid"); if (!s) { s = "S" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 0xffff).toString(16).toUpperCase(); sessionStorage.setItem("hifin_sid", s); } return s; } catch (e) { return "S-EPHEMERAL"; }
}
function guardLogs() { try { return JSON.parse(localStorage.getItem(GUARD_LOG_KEY) || "[]"); } catch (e) { return []; } }
function guardLog(event, page) {
  try {
    if (!guardCfg().log) return;
    const logs = guardLogs(); const d = new Date();
    logs.push({ t: d.toISOString(), tl: d.toLocaleString("ko-KR", { hour12: false }), ev: event || "view", page: page || (typeof location !== "undefined" ? (location.hash || "/") : "/"), ref: (typeof document !== "undefined" && document.referrer) || "-", ua: (typeof navigator !== "undefined" ? navigator.userAgent : "").slice(0, 140), sid: _guardSid(), scr: (typeof screen !== "undefined" ? screen.width + "×" + screen.height : "-"), lang: (typeof navigator !== "undefined" ? navigator.language : "-") });
    while (logs.length > 800) logs.shift();
    localStorage.setItem(GUARD_LOG_KEY, JSON.stringify(logs));
    try { window.dispatchEvent(new Event("guardlog")); } catch (e) {}
  } catch (e) {}
}
function guardClearLogs() { try { localStorage.removeItem(GUARD_LOG_KEY); } catch (e) {} try { window.dispatchEvent(new Event("guardlog")); } catch (e) {} }
function guardStats() {
  const logs = guardLogs(); const today = new Date().toLocaleDateString("ko-KR");
  const sids = new Set(); let todayN = 0, capN = 0;
  logs.forEach((l) => { if (l.sid) sids.add(l.sid); if ((l.tl || "").indexOf(today) === 0 || (l.tl || "").indexOf(today) >= 0) { if (new Date(l.t).toLocaleDateString("ko-KR") === today) todayN++; } if (l.ev === "printscreen" || l.ev === "capture" || l.ev === "print") capN++; });
  return { total: logs.length, today: todayN, sessions: sids.size, capture: capN };
}
function guardExport() {
  try {
    const logs = guardLogs();
    const head = ["시간", "이벤트", "페이지", "세션ID", "화면", "언어", "리퍼러", "UserAgent"];
    const esc = (v) => '"' + String(v == null ? "" : v).replace(/"/g, "'") + '"';
    const rows = logs.map((l) => [l.tl, l.ev, l.page, l.sid, l.scr, l.lang, l.ref, l.ua].map(esc).join(","));
    const csv = "﻿" + [head.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "hifin_access_log_" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1500);
    if (typeof toast === "function") toast("접속 로그 CSV를 내보냈습니다.");
  } catch (e) {}
}

function _guardWatermark(onFlag) {
  if (typeof document === "undefined") return;
  let el = document.getElementById("guardwm");
  if (!onFlag) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement("div"); el.id = "guardwm"; el.setAttribute("aria-hidden", "true"); document.body.appendChild(el); }
  let who = "HI-Fin Tech";
  try { const a = (typeof authCurrent === "function") ? authCurrent() : null; if (a && a.name) who = a.name; } catch (e) {}
  const stamp = who + " · " + new Date().toLocaleDateString("ko-KR") + " · " + _guardSid();
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="200"><text x="18" y="120" transform="rotate(-24 180 100)" font-family="system-ui,-apple-system,sans-serif" font-size="15" font-weight="700" fill="rgba(37,99,235,0.07)">' + stamp.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</text></svg>";
  el.style.backgroundImage = "url(\"data:image/svg+xml;utf8," + encodeURIComponent(svg) + "\")";
}

function applyGuard() {
  if (typeof document === "undefined") return;
  const cfg = guardCfg();
  try { if (window.__guardCleanup) window.__guardCleanup.forEach((fn) => { try { fn(); } catch (e) {} }); } catch (e) {}
  const cleanup = [];
  const on = (type, fn, opt) => { document.addEventListener(type, fn, opt); cleanup.push(() => document.removeEventListener(type, fn, opt)); };
  const deny = (msg) => (e) => { e.preventDefault(); if (typeof toast === "function") toast(msg); return false; };
  if (cfg.noContext) on("contextmenu", deny("🔒 콘텐츠 보호 — 우클릭이 제한됩니다."));
  if (cfg.noCopy) { const b = deny("🔒 콘텐츠 보호 — 복사·저장·배포가 제한됩니다."); on("copy", b); on("cut", b); on("dragstart", (e) => e.preventDefault()); }
  if (cfg.noCopy || cfg.noDevtool) on("keydown", (e) => {
    const k = (e.key || "").toLowerCase(); const ctrl = e.ctrlKey || e.metaKey;
    if (cfg.noCopy && ctrl && ["c", "x", "s", "u", "a"].indexOf(k) >= 0) { e.preventDefault(); if (typeof toast === "function") toast("🔒 콘텐츠 보호 — 복사·저장이 제한됩니다."); }
    if (cfg.noDevtool && ((k === "f12") || (ctrl && e.shiftKey && ["i", "j", "c"].indexOf(k) >= 0) || (ctrl && k === "p"))) { e.preventDefault(); if (typeof toast === "function") toast("🔒 보호 — 개발자도구·인쇄가 제한됩니다."); guardLog(ctrl && k === "p" ? "print" : "devtool", location.hash || "/"); }
    if (e.key === "PrintScreen") { if (typeof toast === "function") toast("⚠️ 화면 캡처는 금지되어 있으며 접속 로그에 기록됩니다."); guardLog("printscreen", location.hash || "/"); try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText("HI-Fin Tech — 무단 캡처 금지 (" + _guardSid() + ")"); } catch (x) {} }
  });
  if (cfg.noDevtool || cfg.shareWarn) on("beforeprint" in window ? "beforeprint" : "beforeprint", () => guardLog("print", location.hash || "/"));
  try { window.addEventListener("beforeprint", () => guardLog("print", location.hash || "/")); } catch (e) {}
  window.__guardCleanup = cleanup;
  _guardWatermark(cfg.watermark);
  try { document.body.classList.toggle("guard-nocopy", !!cfg.noCopy); } catch (e) {}
}

function initContentGuard() {
  if (typeof window === "undefined") return;
  if (window.__guardInit) { applyGuard(); return; }
  window.__guardInit = true;
  applyGuard();
  guardLog("visit", (typeof location !== "undefined" ? (location.hash || "/") : "/"));
  try { document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") guardLog("focus", location.hash || "/"); }); } catch (e) {}
}
