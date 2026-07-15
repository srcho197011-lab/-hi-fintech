/* ══════════════ 실제 OCR 엔진 — 업로드 파일에서 검진 항목 텍스트 추출 ══════════════
   이미지 → Tesseract.js(kor+eng), PDF → PDF.js 텍스트 추출(스캔본이면 canvas 렌더 후 OCR).
   추출 텍스트 → 검진 항목(LOINC) 값 파싱. 실패 시 CheckupCollect에서 직접 입력으로 폴백.
   ※ 라이브러리는 CDN(jsDelivr)에서 동적 로드. 실데이터 처리는 브라우저 내에서만 수행(원본은 서버로 안 보냄). */

function _ocrLoadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.async = true; s.onload = () => res(); s.onerror = () => rej(new Error("script load fail: " + src)); document.head.appendChild(s); }); }
let _tessP = null;
function loadTesseract() { if (_tessP) return _tessP; _tessP = (async () => { if (!window.Tesseract) await _ocrLoadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"); return window.Tesseract; })(); return _tessP; }
let _pdfP = null;
function loadPdfjs() { if (_pdfP) return _pdfP; _pdfP = (async () => { if (!window.pdfjsLib) await _ocrLoadScript("https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"); try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js"; } catch (e) {} return window.pdfjsLib; })(); return _pdfP; }

async function ocrImageFile(file, onProg) {
  const T = await loadTesseract();
  const { data } = await T.recognize(file, "kor+eng", { logger: (m) => { if (m.status === "recognizing text" && onProg) onProg(m.progress || 0); } });
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
  const up = text.match(/(?:요단백|단백뇨)[^가-힣0-9]{0,6}(음성|양성|약양성|정상|trace|[+\-])/i);
  if (up) out.uprot = /(양성|\+)/.test(up[1]) ? "양성(+)" : "음성(-)";
  const cxr = text.match(/(?:흉부|폐|chest)[^가-힣]{0,10}(정상|이상|결절|비활동|활동성)/i);
  if (cxr) out.cxr = /(이상|결절|활동성)/.test(cxr[1]) ? "이상소견" : "정상";
  return out;
}

/* 실제 파일 → 텍스트 추출 → 항목 파싱 → 확인용 items(빈 값은 직접 입력) */
async function realOcrExtract(file, onProg) {
  const isPdf = /pdf/i.test(file.type || "") || /\.pdf$/i.test(file.name || "");
  const text = isPdf ? await pdfFileToText(file, onProg) : await ocrImageFile(file, onProg);
  const parsed = parseCheckupText(text);
  const ORDER = (typeof CKUP_ORDER !== "undefined") ? CKUP_ORDER : Object.keys(parsed);
  const L = (typeof CKUP_LOINC !== "undefined") ? CKUP_LOINC : {};
  const items = ORDER.map((k) => { const has = parsed[k] != null && parsed[k] !== ""; const s = L[k] || {}; return { key: k, loinc: s.loinc, ko: s.ko, unit: s.unit, value: has ? parsed[k] : "", confidence: has ? 0.9 : 0, source: "ocr", low: !has }; });
  return { items, matchedCount: Object.keys(parsed).length, rawText: text };
}
