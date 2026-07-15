/* ══════════════ 실제 OCR 엔진 — 업로드 파일에서 검진 항목 텍스트 추출 ══════════════
   이미지 → Tesseract.js(kor+eng), PDF → PDF.js 텍스트 추출(스캔본이면 canvas 렌더 후 OCR).
   추출 텍스트 → 검진 항목(LOINC) 값 파싱. 실패 시 CheckupCollect에서 직접 입력으로 폴백.
   ※ 라이브러리는 CDN(jsDelivr)에서 동적 로드. 실데이터 처리는 브라우저 내에서만 수행(원본은 서버로 안 보냄). */

function _ocrLoadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.async = true; s.onload = () => res(); s.onerror = () => rej(new Error("script load fail: " + src)); document.head.appendChild(s); }); }
let _tessP = null;
function loadTesseract() { if (_tessP) return _tessP; _tessP = (async () => { if (!window.Tesseract) await _ocrLoadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"); return window.Tesseract; })(); return _tessP; }
let _pdfP = null;
function loadPdfjs() { if (_pdfP) return _pdfP; _pdfP = (async () => { if (!window.pdfjsLib) await _ocrLoadScript("https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"); try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js"; } catch (e) {} return window.pdfjsLib; })(); return _pdfP; }

/* 이미지 전처리 — 확대·그레이스케일·대비 강화로 검진표 숫자 인식률 개선 */
function _fileToImage(file) { return new Promise((res, rej) => { const url = URL.createObjectURL(file); const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new Error("image load")); img.src = url; }); }
function _preprocess(img) {
  const scale = Math.min(3, Math.max(1, 1800 / (img.width || 1)));
  const w = Math.round((img.width || 800) * scale), h = Math.round((img.height || 1000) * scale);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
  try { const d = x.getImageData(0, 0, w, h), p = d.data; for (let i = 0; i < p.length; i += 4) { let g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]; g = (g - 128) * 1.5 + 128; g = g < 0 ? 0 : g > 255 ? 255 : g; p[i] = p[i + 1] = p[i + 2] = g; } x.putImageData(d, 0, 0); } catch (e) {}
  return c;
}
async function ocrImageFile(file, onProg) {
  const T = await loadTesseract();
  let target = file; try { target = _preprocess(await _fileToImage(file)); } catch (e) {}
  const { data } = await T.recognize(target, "kor+eng", { logger: (m) => { if (m.status === "recognizing text" && onProg) onProg(m.progress || 0); } });
  return (data && data.text) || "";
}
async function pdfFileToText(file, onProg) {
  const pdfjs = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const n = Math.min(pdf.numPages, 10); let text = "";
  for (let i = 1; i <= n; i++) { const page = await pdf.getPage(i); const tc = await page.getTextContent(); text += tc.items.map((x) => x.str).join(" ") + "\n"; if (onProg) onProg(i / n * 0.5); }
  if (text.replace(/\s/g, "").length < 30) {   // 스캔 PDF(텍스트 레이어 없음) → 페이지 렌더 후 OCR
    const T = await loadTesseract(); text = ""; const pages = Math.min(pdf.numPages, 3);
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i); const vp = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas"); canvas.width = vp.width; canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
      const { data } = await T.recognize(canvas, "kor+eng", { logger: (m) => { if (m.status === "recognizing text" && onProg) onProg(0.5 + (m.progress || 0) * 0.5 / pages); } });
      text += (data.text || "") + "\n";
    }
  }
  return text;
}

/* 검진표 텍스트 → 항목별 값 파싱(국가검진·종합검진 서식 대응, best-effort) */
function parseCheckupText(raw) {
  const text = (raw || "").replace(/[，,]/g, " ").replace(/\s+/g, " ");
  const out = {};
  let m = text.match(/혈압[^0-9]{0,12}(\d{2,3})\s*[\/\-~]\s*(\d{2,3})/);
  if (m) { out.sbp = +m[1]; out.dbp = +m[2]; }
  // 결합 표기: "키/몸무게 179.9/79.3", "신장/체중(cm/kg) 175/70", "신장 체중 179.9 79.3"
  let hw = text.match(/(?:신장|키)\s*[\/·]?\s*(?:체중|몸무게)[^0-9]{0,16}(1\d{2}(?:\.\d)?)\s*[\/\s]\s*(\d{2,3}(?:\.\d)?)/);
  if (!hw) hw = text.match(/(1\d{2}\.\d)\s*\/\s*(\d{2,3}(?:\.\d)?)/); // "179.9/79.3" 단독 — 소수점 필수(혈압 오인 방지)
  if (hw) { const a = +hw[1], b = +hw[2]; if (a >= 130 && a <= 210 && b >= 25 && b <= 160 && Math.abs(a - b) > 15) { out.height = a; out.weight = b; } }
  const P = [
    ["height", /(?:신장|키)[^0-9]{0,8}(1\d{2}(?:\.\d)?)/],
    ["weight", /(?:체중|몸무게)[^0-9]{0,8}(\d{2,3}(?:\.\d)?)/],
    ["bmi", /(?:체질량지수|비만도|BMI)[^0-9]{0,8}(\d{2}(?:\.\d)?)/i],
    ["waist", /(?:허리둘레|복부둘레)[^0-9]{0,8}(\d{2,3}(?:\.\d)?)/],
    ["glucose", /(?:공복\s*혈당|식전\s*혈당|혈당|글루코스|glucose)[^0-9]{0,12}(\d{2,3})/i],
    ["hba1c", /(?:당화혈색소|HbA1c|A1c)[^0-9]{0,8}(\d{1,2}\.\d)/i],
    ["tchol", /(?:총\s*콜레스테롤|콜레스테롤|cholesterol)[^0-9]{0,12}(\d{2,3})/i],
    ["hdl", /(?:HDL)[^0-9]{0,10}(\d{2,3})/i],
    ["ldl", /(?:LDL)[^0-9]{0,10}(\d{2,3})/i],
    ["tg", /(?:중성지방|트리글리세라이드|triglyceride|\bTG\b)[^0-9]{0,12}(\d{2,4})/i],
    ["ast", /(?:AST|SGOT|\bGOT\b)[^0-9]{0,8}(\d{1,3})/i],
    ["alt", /(?:ALT|SGPT|\bGPT\b)[^0-9]{0,8}(\d{1,3})/i],
    ["ggt", /(?:감마지티피|γ\s*-?\s*GTP|y\s*-?GTP|GGT|GTP)[^0-9]{0,8}(\d{1,4})/i],
    ["cr", /(?:크레아티닌|creatinine)[^0-9]{0,8}(\d\.\d{1,2})/i],
    ["egfr", /(?:eGFR|사구체여과율|신사구체)[^0-9]{0,12}(\d{2,3})/i],
    ["hb", /(?:혈색소|헤모글로빈|\bHb\b|hemoglobin)[^0-9]{0,12}(\d{1,2}\.\d)/i],
  ];
  P.forEach(([k, re]) => { if (out[k] != null) return; const mm = text.match(re); if (mm && mm[1] != null) { const v = parseFloat(mm[1]); if (!isNaN(v)) out[k] = v; } });
  // 상식 범위 보정: 체중에 신장값(>160)이 들어간 경우 신장으로 이동
  if (out.weight != null && out.weight > 160) { if (out.height == null) out.height = out.weight; delete out.weight; }
  if (out.height != null && (out.height < 100 || out.height > 220)) delete out.height;
  const up = text.match(/(?:요단백|단백뇨)[^가-힣0-9]{0,6}(음성|양성|약양성|정상|trace|[+\-])/i);
  if (up) out.uprot = /(양성|\+)/.test(up[1]) ? "양성(+)" : "음성(-)";
  const cxr = text.match(/(?:흉부|폐|chest)[^가-힣]{0,10}(정상|이상|결절|비활동|활동성)/i);
  if (cxr) out.cxr = /(이상|결절|활동성)/.test(cxr[1]) ? "이상소견" : "정상";
  return out;
}

/* ── 클라우드 OCR(OCR.space) — 백엔드 없이 브라우저에서 직접 호출(CORS 허용). 한글·표 인식 우수 ──
   ⚠️ 무료키 'helloworld'는 제한적(파일 1MB·공용 rate limit). 형 전용 무료키(ocr.space) 발급 시 아래 교체.
   ⚠️ 개인정보: 실서비스는 국내 처리(네이버 CLOVA OCR) 또는 자체 OCR 권장 — OCR.space는 시연/테스트용. */
/* 무료키 발급: https://ocr.space/ocrapi (개인 무료키는 파일 5MB·월 25,000건). localStorage 'hifin_ocr_key'로 교체 가능
   ⚠️ 아래 기본키는 운영자 발급 무료키(데모용) — 프론트 노출 키이므로 정식 서비스 전 서버측(CLOVA 등)으로 이관 */
const OCRSPACE_DEFAULT = "K82211429688957";
let OCRSPACE_KEY = (() => { try { return localStorage.getItem("hifin_ocr_key") || OCRSPACE_DEFAULT; } catch (e) { return OCRSPACE_DEFAULT; } })();
function setOcrKey(k) { try { localStorage.setItem("hifin_ocr_key", k); OCRSPACE_KEY = k; } catch (e) {} }
async function _compressImage(file, maxW, q) {
  const img = await _fileToImage(file); const s = Math.min(1, (maxW || 1600) / (img.width || 1600));
  const w = Math.round((img.width || 1600) * s), h = Math.round((img.height || 2000) * s);
  const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h);
  return await new Promise((res) => c.toBlob((b) => res(b || file), "image/jpeg", q || 0.72));
}
async function ocrSpaceImage(file, onProg) {
  let blob = file; try { if (!file.size || file.size > 950000) blob = await _compressImage(file, 1600, 0.7); } catch (e) {}
  if (onProg) onProg(0.25);
  const fd = new FormData();
  fd.append("file", blob, "checkup.jpg");
  fd.append("language", "kor"); fd.append("OCREngine", "2"); fd.append("isTable", "true"); fd.append("scale", "true"); fd.append("detectOrientation", "true");
  const res = await fetch("https://api.ocr.space/parse/image", { method: "POST", headers: { apikey: OCRSPACE_KEY }, body: fd });
  const j = await res.json();
  if (onProg) onProg(0.9);
  if (j && j.IsErroredOnProcessing) throw new Error((j.ErrorMessage && j.ErrorMessage[0]) || "OCR.space error");
  return (j && j.ParsedResults && j.ParsedResults[0] && j.ParsedResults[0].ParsedText) || "";
}

/* 실제 파일 → 텍스트 추출 → 항목 파싱 → 확인용 items(빈 값은 직접 입력)
   이미지: 클라우드 OCR(OCR.space) 우선 → 실패 시 브라우저 Tesseract 폴백. PDF: PDF.js. */
async function realOcrExtract(file, onProg) {
  const isPdf = /pdf/i.test(file.type || "") || /\.pdf$/i.test(file.name || "");
  let text = "", engine = "";
  if (isPdf) { text = await pdfFileToText(file, onProg); engine = "pdf.js"; }
  else {
    try { text = await ocrSpaceImage(file, onProg); engine = "ocr.space"; } catch (e) { text = ""; }
    if (text.replace(/\s/g, "").length < 8) { try { text = await ocrImageFile(file, onProg); engine = "tesseract"; } catch (e) {} }
  }
  const parsed = parseCheckupText(text);
  const ORDER = (typeof CKUP_ORDER !== "undefined") ? CKUP_ORDER : Object.keys(parsed);
  const L = (typeof CKUP_LOINC !== "undefined") ? CKUP_LOINC : {};
  const items = ORDER.map((k) => { const has = parsed[k] != null && parsed[k] !== ""; const s = L[k] || {}; return { key: k, loinc: s.loinc, ko: s.ko, unit: s.unit, value: has ? parsed[k] : "", confidence: has ? 0.9 : 0, source: "ocr", low: !has }; });
  return { items, matchedCount: Object.keys(parsed).length, rawText: text, engine };
}
