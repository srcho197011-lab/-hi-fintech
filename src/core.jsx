import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Home, Bot, HeartPulse, ClipboardList, ShieldCheck, Building2, ShoppingCart,
  Wallet, Users, Settings, Bell, MessageSquare, ChevronDown, Search, Phone,
  LayoutDashboard, CalendarCheck, TrendingUp, FileText, Activity, Heart,
  Salad, Pill, Footprints, Moon, Flame, Coins, BadgeCheck, ChevronRight, Info,
  Stethoscope, MonitorSmartphone, Brain, HeartHandshake, Sparkles, Lock, Hash,
  Gift, CircleUserRound, ArrowLeft, ArrowRight, Menu, Plus, Smile, Send, X,
  Image as ImageIcon, Paperclip, Mic, Volume2, ExternalLink, RefreshCw, Cigarette,
  Wine, Dumbbell, ArrowDown, ArrowUp, Banknote, Ban, Check, AlertTriangle, Printer,
  MapPin, Star, Clock, Filter, Tag, Percent, BookOpen, Trophy,
} from "lucide-react";
const { KDCA_KB, HEALTH_CONTENTS, FULL_GRP, FULL_COLLECT, FULL_THIRD, FULL_MARKET, DISTRICTS, COVER_DETAIL, KDCA_NOTE, DEMO_MEMBERS } = (typeof window !== "undefined" && window.__HHDATA) || {};

/* ====================== tokens ====================== */

/* ====================== real data (조성래 · 프롬에이지 Premium) ====================== */
const PT = { name: "조성래", sexAge: "남 / 54.1세", checkup: "2024.12.26", analyzed: "2026.05.08", reg: "KRH01778214095470R2083", regAge: 54.1, bioAge: 52.5, agingRank: 37, agingSpeed: 0.97, sido: "서울", sigungu: "은평구", dong: "불광동", addr: "서울특별시 은평구 불광동" };
const ORGANS = [["비만체형", "50.9", "좋음", true], ["심장", "50.7", "좋음", true], ["간", "54.4", "나쁨", false], ["췌장", "56.2", "나쁨", false], ["신장", "53.4", "좋음", true]];
const DISEASES = [["비만", -24.8, "25.5%"], ["고지혈증", -17.1, "46.4%"], ["고혈압", -3.9, "22.3%"], ["당뇨병", 6.2, "10.9%"], ["허혈심장질환", -5.0, "12.0%"], ["급성심근경색증", -8.9, "8.1%"], ["뇌혈관질환", -3.7, "10.8%"], ["뇌졸중", -4.7, "6.9%"], ["치매", -5.5, "5.9%"]];
const CANCERS = [["간암", "주의"], ["담낭암", "주의"], ["췌장암", "경고"], ["위암", "주의"], ["대장암", "주의"], ["폐암", "양호"], ["신장암", "주의"], ["방광암", "양호"], ["전립선암", "주의"], ["갑상선암", "주의"]];
const gradeColor = (g) => g === "경고" ? "#EF4444" : g === "위험" || g === "고위험" ? "#DC2626" : g === "주의" ? "#F59E0B" : "#16A34A";
const CANCER_DETAIL = [
  { n: "간암", g: "주의", risk: "1.5%", inc: "50대 남성 인구 10만명당 27.1명", do: ["신선·무첨가 커피 섭취(예방 효과)", "곰팡이(아플라톡신) 없는 신선한 식품"], avoid: ["과다 약물복용·검증 안 된 민간요법", "하루 3잔(45g) 이상 알코올"], remember: ["간 수치만으론 조기발견 어려움 → 간초음파 병행", "B/C형 간염·간경변 고위험군 6개월 주기 초음파+AFP"] },
  { n: "담낭암", g: "주의", risk: "7.1%", inc: "50대 11.4", do: ["민물고기는 충분히 익혀 먹기(간흡충 예방)"], avoid: ["3cm 이상 담석·담낭용종 방치"], remember: ["원인 없는 소화불량·복부팽만 지속 시 진료", "초기 증상이 거의 없어 건강검진이 중요"] },
  { n: "췌장암", g: "경고", risk: "17.3%", inc: "50대 18.2", do: ["당뇨·만성췌장염 등 관련 질환 관리", "과일·채소·식물성 단백질"], avoid: ["흡연(비흡연자의 1.7배)", "용매제·석탄·휘발유·타르·금속가루 노출"], remember: ["고위험군은 초음파내시경 검사가 도움", "유전 영향 10% → 유전자검사는 전문의 상담"] },
  { n: "위암", g: "주의", risk: "3.5%", inc: "50대 23.3", do: ["파·마늘·양파 등 항산화물질·신선한 과일", "40세 이상 2년마다 조기검진"], avoid: ["짜거나 부패·질산염·탄 음식(4~5배)", "흡연·장기 음주(1.5~2.5배)"], remember: ["영양보충제의 예방 효과는 뚜렷하지 않음", "가족력·전단계 병변 시 자주 내시경"] },
  { n: "대장암", g: "주의", risk: "5.0%", inc: "50대 22.0", do: ["통곡류(귀리·보리·현미)", "칼슘(유제품·보충제)"], avoid: ["붉은 육류·가공육", "일 알코올 30g 이상 음주"], remember: ["매년 분변잠혈검사 → 이상 시 대장내시경", "대장내시경만 시 5~10년 주기"] },
  { n: "폐암", g: "양호", risk: "15.6%", inc: "50대 11.8", do: ["중강도 운동(자전거·런닝·등산)", "간접흡연·석면·라돈·미세먼지 피하기"], avoid: ["흡연(85% 원인·11배)", "라돈·중금속 노출 시 매년 저선량 흉부 CT"], remember: ["금연은 빠를수록 좋음", "흡연자의 고용량 베타카로틴은 위험 증가"] },
  { n: "신장암", g: "주의", risk: "5.8%", inc: "50대 24.6", do: ["혈압 관리(고혈압 1.4~3.2배)", "체중 조절(비만 약 2.5배)"], avoid: ["동물성지방·튀김/구운 육류·고칼로리"], remember: ["1기 발견 시 5년 생존율 88~100%", "40대 이후 복부 초음파·CT·MRI"] },
  { n: "방광암", g: "양호", risk: "10.4%", inc: "50대 13.4", do: ["비소 없는 적합한 식수", "녹황색 채소·과일(베타카로틴)"], avoid: ["흡연·간접흡연(주된 요인)", "고무·가죽·인쇄·페인트 화학약품 노출"], remember: ["전이암 생존율 낮아 조기발견 중요", "혈뇨 시 추가 검사"] },
  { n: "전립선암", g: "주의", risk: "5.5%", inc: "50대 8.9", do: ["적정 체중 유지", "라이코펜(토마토)·셀레늄·제니스테인(콩)"], avoid: ["동물성 지방 과다", "흡연·농약·유기용제"], remember: ["남성호르몬 억제제는 주치의 상담 후", "PSA·전립선 초음파 검진"] },
  { n: "갑상선암", g: "주의", risk: "9.8%", inc: "50대 23.0", do: ["십자화과 채소(브로콜리·양배추 등)", "갑상선 질환 정기 검사"], avoid: ["불필요한 목 부위 방사선 촬영", "과체중·비만"], remember: ["무증상 시 일상 검진 비권장", "수질암 가족력 시 RET 유전자 확인"] },
];
const WARN_SIGNS = [
  { n: "당뇨병", tag: "위험 ↑", color: "#F59E0B", signs: ["소변을 자주 본다", "체중이 점점 빠진다", "갈증으로 물을 많이 마신다", "자주 허기지고 많이 먹는다", "충분히 자도 피곤하다"] },
  { n: "심장질환 (허혈·심근경색)", tag: "응급", color: "#EF4444", signs: ["가슴 한가운데가 조이거나 쥐어짜는 통증", "가슴 통증이 30분 이상 지속", "통증이 목·턱·왼팔로 퍼진다", "숨쉬기 힘들고 구역질이 난다", "얼굴이 창백하고 식은땀이 난다"] },
  { n: "뇌혈관질환 (뇌졸중)", tag: "응급", color: "#EF4444", signs: ["한쪽 팔다리·얼굴이 마비·무감각", "발음이 어눌하고 말이 안 나온다", "한쪽 시야가 안 보이거나 복시", "어지럽고 휘청·한쪽으로 넘어짐", "갑작스런 심한 두통"] },
  { n: "치매", signs: ["최근 일을 잘 기억하지 못한다", "다니던 길에서 길을 잃는다", "시간·날짜·요일 개념이 흐려진다", "말할 때 단어가 안 떠오른다", "감정 조절이 어렵고 기분 변화"] },
  { n: "고혈압", signs: ["아침에 뒤통수 두통", "피로감이 심하다", "어지럽고 가슴이 두근거린다", "코피가 쉽게 난다", "눈이 침침하다"] },
  { n: "고지혈증", signs: ["손발이 차고 저리다", "피로감이 심하다", "다리가 붓고 신발이 안 맞는다", "눈꺼풀에 노란 점(황색종)"] },
];

/* ====================== sections ====================== */
// 섹션별 컬러풀 아이콘 타일 그라데이션
const ICONBG = {
  home: "linear-gradient(145deg,#FF7A7A,#EE5253)",
  ai: "linear-gradient(145deg,#8B7BFF,#5B6EF0)",
  checkup: "linear-gradient(145deg,#34D399,#16A34A)",
  manage: "linear-gradient(145deg,#2DD4BF,#0EA5E9)",
  hospital: "linear-gradient(145deg,#56C5FB,#2563EB)",
  homecare: "linear-gradient(145deg,#F472B6,#DB2777)",
  shop: "linear-gradient(145deg,#FBBF24,#F59E0B)",
  insurance: "linear-gradient(145deg,#60A5FA,#1D4ED8)",
  wallet: "linear-gradient(145deg,#34D399,#059669)",
  nft: "linear-gradient(145deg,#B07CFB,#7C3AED)",
  community: "linear-gradient(145deg,#FFA45B,#F97316)",
  mypage: "linear-gradient(145deg,#9AA7BD,#64748B)",
};
// 입체 일러스트 섹션 아이콘 (배경 없음, 특징 강조)
function SecIcon({ k }) {
  const S = { viewBox: "0 0 48 48", xmlns: "http://www.w3.org/2000/svg" };
  const Sh = ({ rx = 12 }) => <ellipse cx="24" cy="43" rx={rx} ry="2.6" fill="#0b1733" opacity=".13" />;
  switch (k) {
    case "home": return (<svg {...S}><defs>
      <linearGradient id="i-home-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF9B9B" /><stop offset="1" stopColor="#EE5253" /></linearGradient>
      <linearGradient id="i-home-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#FFE7E7" /></linearGradient></defs>
      <Sh />
      <path d="M14 23h20v15a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2z" fill="url(#i-home-w)" />
      <path d="M24 10.2 37 22.4a1.5 1.5 0 0 1-1 2.6H12a1.5 1.5 0 0 1-1-2.6z" fill="url(#i-home-r)" />
      <path d="M24 10.2 37 22.4a1.5 1.5 0 0 1-1 2.6H24z" fill="#0b1733" opacity=".12" />
      <rect x="20.5" y="30" width="7" height="9.5" rx="1.2" fill="#FF9D9D" />
      <rect x="16.5" y="26" width="4.5" height="4.5" rx="1" fill="#FFD9D9" /></svg>);
    case "ai": return (<svg {...S}><defs>
      <linearGradient id="i-ai-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8E7BFF" /><stop offset="1" stopColor="#5B6EF0" /></linearGradient></defs>
      <Sh rx={11} />
      <line x1="24" y1="8.5" x2="24" y2="14" stroke="#7C8AF0" strokeWidth="2" /><circle cx="24" cy="8" r="2.3" fill="#A5B4FC" />
      <rect x="9.5" y="20" width="3.6" height="8" rx="1.8" fill="#6D7BEF" /><rect x="34.9" y="20" width="3.6" height="8" rx="1.8" fill="#6D7BEF" />
      <rect x="12.5" y="14" width="23" height="20" rx="7" fill="url(#i-ai-g)" />
      <rect x="15.5" y="18.5" width="17" height="11" rx="5.5" fill="#241B5A" opacity=".35" />
      <circle cx="20" cy="24" r="2.5" fill="#fff" /><circle cx="28" cy="24" r="2.5" fill="#fff" />
      <path d="M20.5 30.5q3.5 2.6 7 0" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>);
    case "checkup": return (<svg {...S}><defs>
      <linearGradient id="i-ck-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#36DDA3" /><stop offset="1" stopColor="#16A34A" /></linearGradient></defs>
      <Sh rx={11} />
      <rect x="13" y="13" width="22" height="27" rx="3.4" fill="url(#i-ck-g)" />
      <rect x="16.5" y="16.5" width="15" height="20.5" rx="2" fill="#fff" />
      <rect x="19" y="10.5" width="10" height="5.4" rx="2.2" fill="#15843E" />
      <path d="M19.5 26l3 3 5.5-6.2" stroke="#16A34A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="19" y="32" width="10" height="2.2" rx="1.1" fill="#C9F5DD" /></svg>);
    case "manage": return (<svg {...S}><defs>
      <linearGradient id="i-mg-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34E0CB" /><stop offset="1" stopColor="#0EA5E9" /></linearGradient></defs>
      <Sh rx={11} />
      <path d="M24 39C8.5 28.5 12 15.5 20 15.5c2.8 0 4 2.4 4 2.4s1.2-2.4 4-2.4c8 0 11.5 13-4 23.5z" fill="url(#i-mg-g)" />
      <path d="M13 26.5h4.6l2-4 3 8 2-4H32" stroke="#fff" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="18.5" cy="20" rx="3" ry="2" fill="#fff" opacity=".4" /></svg>);
    case "hospital": return (<svg {...S}><defs>
      <linearGradient id="i-hp-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5CC8FB" /><stop offset="1" stopColor="#2563EB" /></linearGradient></defs>
      <Sh rx={11} />
      <rect x="14.5" y="15" width="19" height="25" rx="2.6" fill="url(#i-hp-g)" />
      <g fill="#DCEBFF"><rect x="18" y="22" width="3.6" height="3.6" rx="1" /><rect x="26.4" y="22" width="3.6" height="3.6" rx="1" /><rect x="18" y="27.5" width="3.6" height="3.6" rx="1" /><rect x="26.4" y="27.5" width="3.6" height="3.6" rx="1" /></g>
      <rect x="21" y="34" width="6" height="6" rx="1" fill="#DCEBFF" />
      <rect x="18.8" y="9" width="10.4" height="9.2" rx="2.2" fill="#fff" />
      <path d="M24 11.4v4.4M21.8 13.6h4.4" stroke="#EF4444" strokeWidth="2.1" strokeLinecap="round" /></svg>);
    case "homecare": return (<svg {...S}><defs>
      <linearGradient id="i-hc-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F77FBE" /><stop offset="1" stopColor="#DB2777" /></linearGradient>
      <linearGradient id="i-hc-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FAD2B0" /><stop offset="1" stopColor="#EBB48C" /></linearGradient></defs>
      <Sh rx={12} />
      <path d="M24 29.5C13.5 22.5 16 13.8 21 13.8c2 0 3 2 3 2s1-2 3-2c5 0 7.5 8.7-3 15.7z" fill="url(#i-hc-g)" />
      <path d="M12.5 30c0 7 5.2 10.5 11.5 10.5S35.5 37 35.5 30c0 0-3.5 3.4-11.5 3.4S12.5 30 12.5 30z" fill="url(#i-hc-s)" />
      <path d="M12.5 30c0 1.6.3 3 .8 4.2-1.6-.4-3-1.7-3-3.4 0-1.4 1.2-2.2 2.2-.8z" fill="#EBB48C" /></svg>);
    case "shop": return (<svg {...S}>
      <Sh rx={12} />
      <rect x="13" y="19.5" width="2.4" height="11" fill="#E2A86A" /><rect x="32.6" y="19.5" width="2.4" height="11" fill="#E2A86A" />
      <rect x="12" y="29" width="24" height="10" rx="1.6" fill="#F6C892" /><rect x="12" y="29" width="24" height="3.2" fill="#E9B47A" />
      <circle cx="19.5" cy="28" r="3.3" fill="#34C759" /><rect x="19.1" y="24.4" width="0.9" height="2" rx="0.4" fill="#7A5230" />
      <circle cx="27" cy="28.4" r="3" fill="#FF9F45" />
      <rect x="10" y="10.8" width="28" height="3.2" rx="1.6" fill="#D93B3B" />
      <rect x="10.5" y="14" width="27" height="6.6" fill="#fff" />
      <g fill="#EE5253"><rect x="10.5" y="14" width="4.5" height="6.6" /><rect x="19.5" y="14" width="4.5" height="6.6" /><rect x="28.5" y="14" width="4.5" height="6.6" /></g>
      <path d="M10.5 20.6q2.25 2.6 4.5 0t4.5 0t4.5 0t4.5 0t4.5 0t4.5 0v.2H10.5z" fill="#C62828" opacity=".55" />
      <rect x="10.5" y="14" width="27" height="2.2" fill="#fff" opacity=".35" /></svg>);
    case "insurance": return (<svg {...S}><defs>
      <linearGradient id="i-in-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#67ABFF" /><stop offset="1" stopColor="#1D4ED8" /></linearGradient></defs>
      <Sh rx={10} />
      <path d="M24 8.5 37 12.8V24c0 8.2-6.2 13.4-13 15.5C17.2 37.4 11 32.2 11 24V12.8z" fill="url(#i-in-g)" />
      <path d="M24 8.5 37 12.8V24c0 8.2-6.2 13.4-13 15.5z" fill="#0b1733" opacity=".1" />
      <path d="M18.5 24l3.7 3.7 6.5-7.4" stroke="#fff" strokeWidth="2.7" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "wallet": return (<svg {...S}><defs>
      <linearGradient id="i-wl-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#37DD9C" /><stop offset="1" stopColor="#059669" /></linearGradient></defs>
      <Sh rx={11} />
      <rect x="11.5" y="16.5" width="25" height="18.5" rx="3.6" fill="url(#i-wl-g)" />
      <rect x="11.5" y="20.5" width="25" height="2.6" fill="#0b1733" opacity=".12" />
      <rect x="23.5" y="22.5" width="14" height="8.5" rx="2.6" fill="#E7F8EE" />
      <circle cx="30" cy="26.7" r="2.7" fill="#FFC83D" /><circle cx="30" cy="26.7" r="2.7" fill="#0b1733" opacity=".06" /></svg>);
    case "nft": return (<svg {...S}><defs>
      <linearGradient id="i-nft-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B985FB" /><stop offset="1" stopColor="#7C3AED" /></linearGradient></defs>
      <Sh rx={10} />
      <path d="M24 8.5 35 14.8V27.2L24 33.5 13 27.2V14.8z" fill="url(#i-nft-g)" />
      <path d="M24 8.5 35 14.8V27.2L24 33.5z" fill="#0b1733" opacity=".12" />
      <path d="M24 16v9M19.5 20.5h9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 13l3 1.7-3 1.7z" fill="#fff" opacity=".5" /></svg>);
    case "community": return (<svg {...S}><defs>
      <linearGradient id="i-cm-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFB061" /><stop offset="1" stopColor="#F97316" /></linearGradient></defs>
      <Sh rx={11} />
      <path d="M20 21h15a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-2v4l-5-4h-8a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3z" fill="#FFD3A8" />
      <path d="M13 12h14a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-9l-5 4v-4a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3z" fill="url(#i-cm-g)" />
      <g fill="#fff"><circle cx="16.5" cy="18" r="1.5" /><circle cx="21.5" cy="18" r="1.5" /><circle cx="26.5" cy="18" r="1.5" /></g></svg>);
    case "dashboard": return (<svg {...S}>
      <Sh rx={11} />
      <rect x="12" y="12" width="11" height="11" rx="3" fill="#4F86F7" /><rect x="12" y="12" width="11" height="4" rx="3" fill="#fff" opacity=".25" />
      <rect x="25" y="12" width="11" height="11" rx="3" fill="#34D399" /><rect x="25" y="12" width="11" height="4" rx="3" fill="#fff" opacity=".25" />
      <rect x="12" y="25" width="11" height="11" rx="3" fill="#FBBF24" /><rect x="12" y="25" width="11" height="4" rx="3" fill="#fff" opacity=".25" />
      <rect x="25" y="25" width="11" height="11" rx="3" fill="#F472B6" /><rect x="25" y="25" width="11" height="4" rx="3" fill="#fff" opacity=".25" /></svg>);
    case "summary": return (<svg {...S}><defs>
      <linearGradient id="i-sm-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34E0CB" /><stop offset="1" stopColor="#16A34A" /></linearGradient></defs>
      <Sh rx={11} />
      <circle cx="24" cy="24" r="12.5" fill="url(#i-sm-g)" />
      <circle cx="24" cy="24" r="8" fill="#fff" />
      <path d="M24 28.5c-4.5-3-3.4-7-1.2-7 .9 0 1.2.9 1.2.9s.3-.9 1.2-.9c2.2 0 3.3 4-1.2 7z" fill="#16A34A" />
      <ellipse cx="20" cy="16.5" rx="3" ry="1.8" fill="#fff" opacity=".4" /></svg>);
    case "calendar": return (<svg {...S}><defs>
      <linearGradient id="i-cal-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FB7C8E" /><stop offset="1" stopColor="#EF4444" /></linearGradient></defs>
      <Sh rx={11} />
      <rect x="11.5" y="14" width="25" height="23" rx="3.4" fill="#fff" />
      <path d="M11.5 17.4a3.4 3.4 0 0 1 3.4-3.4h18.2a3.4 3.4 0 0 1 3.4 3.4v3.6h-25z" fill="url(#i-cal-g)" />
      <rect x="16.5" y="11" width="2.6" height="6" rx="1.3" fill="#C2304A" /><rect x="28.9" y="11" width="2.6" height="6" rx="1.3" fill="#C2304A" />
      <path d="M18.5 28.5l3.2 3.2 6-6.4" stroke="#16A34A" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "trend": return (<svg {...S}><defs>
      <linearGradient id="i-tr-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5CC8FB" /><stop offset="1" stopColor="#2563EB" /></linearGradient></defs>
      <Sh rx={11} />
      <rect x="11" y="13" width="26" height="22" rx="3.4" fill="url(#i-tr-g)" />
      <path d="M15 29l5-5 4 3 6-8" stroke="#fff" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 18.5h4v4" stroke="#fff" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "report": return (<svg {...S}><defs>
      <linearGradient id="i-rp-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B985FB" /><stop offset="1" stopColor="#7C3AED" /></linearGradient></defs>
      <Sh rx={10} />
      <rect x="14" y="11" width="20" height="27" rx="3" fill="#fff" />
      <path d="M14 14a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v3H14z" fill="url(#i-rp-g)" />
      <g fill="#C4B5FD"><rect x="18" y="28" width="3.4" height="6" rx="1" /><rect x="22.5" y="24" width="3.4" height="10" rx="1" /><rect x="27" y="26" width="3.4" height="8" rx="1" /></g>
      <path d="M30 19.5l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z" fill="#F59E0B" /></svg>);
    case "alert": return (<svg {...S}><defs>
      <linearGradient id="i-al-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD24A" /><stop offset="1" stopColor="#F59E0B" /></linearGradient></defs>
      <Sh rx={9} />
      <rect x="22.7" y="9.5" width="2.6" height="4" rx="1.3" fill="#E0890A" />
      <path d="M24 11.5c-5.3 0-8.4 3.6-8.4 9.2v3.5l-2.2 3.3a1.2 1.2 0 0 0 1 1.9h19.2a1.2 1.2 0 0 0 1-1.9l-2.2-3.3v-3.5c0-5.6-3.1-9.2-8.4-9.2z" fill="url(#i-al-g)" />
      <path d="M20.5 31.5a3.6 3.6 0 0 0 7 0z" fill="#E0890A" />
      <ellipse cx="20" cy="17" rx="2.4" ry="3.2" fill="#fff" opacity=".35" transform="rotate(-20 20 17)" />
      <circle cx="32.5" cy="13.5" r="4.6" fill="#EF4444" /></svg>);
    default: return (<svg {...S}><defs>
      <linearGradient id="i-mp-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A6B2C6" /><stop offset="1" stopColor="#64748B" /></linearGradient></defs>
      <Sh rx={11} />
      <path d="M13 39c0-7 5-11.5 11-11.5S35 32 35 39z" fill="url(#i-mp-g)" />
      <circle cx="24" cy="19" r="7" fill="url(#i-mp-g)" />
      <circle cx="24" cy="19" r="7" fill="#fff" opacity=".12" /></svg>);
  }
}
// 세부(콘텐츠) 미니 입체 일러스트
function Art({ name, size = 26 }) {
  const P = { width: size, height: size, viewBox: "0 0 32 32", xmlns: "http://www.w3.org/2000/svg" };
  switch (name) {
    case "visit": return (<svg {...P}><path d="M16 6l11 8.4H5z" fill="#F77FBE" /><path d="M16 6l11 8.4h-3.3L16 8.5z" fill="#9D174D" opacity=".22" /><rect x="8" y="14" width="16" height="12" rx="2" fill="#FCE0EF" /><path d="M16 24c-3.6-2.5-2.4-5.2-.5-5.2.8 0 1.1.8 1.1.8s.3-.8 1.1-.8c1.9 0 3.1 2.7-.5 5.2z" fill="#DB2777" /></svg>);
    case "bath": return (<svg {...P}><rect x="6" y="19" width="20" height="6" rx="3" fill="#7CC6F7" /><rect x="6" y="19" width="20" height="2.4" rx="1.2" fill="#fff" opacity=".35" /><path d="M16 6c2.7 3.6 4.3 5.8 4.3 8a4.3 4.3 0 0 1-8.6 0c0-2.2 1.6-4.4 4.3-8z" fill="#38BDF8" /><ellipse cx="14" cy="11" rx="1.2" ry="2" fill="#fff" opacity=".5" /></svg>);
    case "nurse": return (<svg {...P}><circle cx="16" cy="16" r="10" fill="#34D399" /><path d="M16 10.5v11M10.5 16h11" stroke="#fff" strokeWidth="3" strokeLinecap="round" /><ellipse cx="12" cy="11" rx="3" ry="1.6" fill="#fff" opacity=".3" /></svg>);
    case "day": return (<svg {...P}><circle cx="16" cy="16" r="10" fill="#A78BFA" /><path d="M16 16V10.5M16 16l4.2 2.6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /><ellipse cx="12" cy="11" rx="3" ry="1.6" fill="#fff" opacity=".3" /></svg>);
    case "short": return (<svg {...P}><rect x="5" y="18" width="22" height="6" rx="1.6" fill="#F59E0B" /><rect x="5" y="14.5" width="6.5" height="5.5" rx="1.6" fill="#FCD34D" /><rect x="5" y="22" width="22" height="2" fill="#C2780A" opacity=".4" /><rect x="6" y="24" width="2.5" height="3" fill="#C2780A" /><rect x="23.5" y="24" width="2.5" height="3" fill="#C2780A" /></svg>);
    case "welfare": return (<svg {...P}><circle cx="15" cy="22" r="6" fill="none" stroke="#DB2777" strokeWidth="2.2" /><circle cx="15" cy="22" r="1.8" fill="#DB2777" /><circle cx="13" cy="9" r="2.4" fill="#F472B6" /><path d="M11 12h3.2v5.5h6l-2 4h-5.4z" fill="#F472B6" /></svg>);
    case "rehab": return (<svg {...P}><rect x="12.5" y="14" width="7" height="4" rx="1" fill="#0D9488" /><rect x="8.5" y="10.5" width="4.2" height="11" rx="1.6" fill="#14B8A6" /><rect x="19.3" y="10.5" width="4.2" height="11" rx="1.6" fill="#14B8A6" /><rect x="6" y="13" width="3" height="6" rx="1.4" fill="#0D9488" /><rect x="23" y="13" width="3" height="6" rx="1.4" fill="#0D9488" /></svg>);
    case "meal": return (<svg {...P}><path d="M5 16h22a11 11 0 0 1-22 0z" fill="#16A34A" /><rect x="5" y="20" width="22" height="2" fill="#0B5F2C" opacity=".3" /><circle cx="12" cy="14" r="2.7" fill="#34C759" /><circle cx="17" cy="13" r="2.5" fill="#FF9F45" /><circle cx="21.5" cy="14.4" r="2.3" fill="#EF6B6B" /></svg>);
    case "leaf": return (<svg {...P}><path d="M7 25C7 14 18 7 25 7c0 11-9 18-18 18z" fill="#34D399" /><path d="M22 11C16 15 12 19 9 24" stroke="#0B5F2C" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>);
    case "badge": return (<svg {...P}><path d="M16 5l9.5 3.2v6.8c0 6.3-4.7 10-9.5 11.5-4.8-1.5-9.5-5.2-9.5-11.5V8.2z" fill="#3B82F6" /><path d="M16 5l9.5 3.2v6.8c0 6.3-4.7 10-9.5 11.5z" fill="#0b1733" opacity=".1" /><path d="M11.5 16l3.2 3.2 6-6.6" stroke="#fff" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "delivery": return (<svg {...P}><rect x="4" y="12" width="13" height="9.5" rx="1.6" fill="#F59E0B" /><path d="M17 14.5h4.2l3.3 3.3v3.7H17z" fill="#FBBF24" /><rect x="17" y="14.5" width="4.4" height="3.6" fill="#FDE7B5" opacity=".7" /><circle cx="9" cy="22.5" r="2.4" fill="#3a3f4a" /><circle cx="21" cy="22.5" r="2.4" fill="#3a3f4a" /></svg>);
    case "capsule": return (<svg {...P}><g transform="rotate(-35 16 16)"><rect x="6.5" y="12.5" width="19" height="7" rx="3.5" fill="#DBEAFE" /><rect x="6.5" y="12.5" width="9.5" height="7" rx="3.5" fill="#2563EB" /><rect x="9" y="14" width="4" height="1.6" rx=".8" fill="#fff" opacity=".5" /></g></svg>);
    case "doc": return (<svg {...P}><rect x="8" y="5.5" width="16" height="21" rx="2" fill="#fff" /><rect x="8" y="5.5" width="16" height="21" rx="2" fill="none" stroke="#C7D2FE" strokeWidth="1.3" /><rect x="11" y="9.5" width="10" height="2" rx="1" fill="#93C5FD" /><rect x="11" y="13.5" width="7" height="2" rx="1" fill="#CBD5E1" /><g fill="#2563EB"><rect x="11" y="19" width="2.6" height="4.5" rx=".6" /><rect x="14.7" y="17" width="2.6" height="6.5" rx=".6" /><rect x="18.4" y="20.5" width="2.6" height="3" rx=".6" /></g></svg>);
    case "eye": return (<svg {...P}><path d="M3.5 16S9 9 16 9s12.5 7 12.5 7-5.5 7-12.5 7S3.5 16 3.5 16z" fill="#fff" /><path d="M3.5 16S9 9 16 9s12.5 7 12.5 7" fill="none" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" /><circle cx="16" cy="16" r="4.6" fill="#16A34A" /><circle cx="16" cy="16" r="2" fill="#0b2e16" /><circle cx="14.6" cy="14.6" r=".9" fill="#fff" /></svg>);
    case "joint": return (<svg {...P}><rect x="13" y="9" width="6" height="14" rx="3" fill="#5EEAD4" /><circle cx="11.5" cy="10.5" r="3" fill="#5EEAD4" /><circle cx="20.5" cy="10.5" r="3" fill="#5EEAD4" /><circle cx="11.5" cy="21.5" r="3" fill="#5EEAD4" /><circle cx="20.5" cy="21.5" r="3" fill="#5EEAD4" /><circle cx="16" cy="16" r="2" fill="#0D9488" opacity=".4" /></svg>);
    case "immune": return (<svg {...P}><path d="M16 5l9.5 3.2v6.8c0 6.3-4.7 10-9.5 11.5-4.8-1.5-9.5-5.2-9.5-11.5V8.2z" fill="#DB2777" /><path d="M16 11.5v9M11.5 16h9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg>);
    case "brain": return (<svg {...P}><circle cx="16" cy="16" r="9.5" fill="#60A5FA" /><path d="M11.5 13c2-2 7-2 9 0M10.5 17c3.5 2.2 7.5 2.2 11 0M13 20.5c1.6 1.1 4.4 1.1 6 0" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" /><path d="M16 7v18" stroke="#fff" strokeWidth="1.1" opacity=".5" /></svg>);
    case "device": return (<svg {...P}><rect x="5" y="7" width="22" height="15" rx="2.2" fill="#0891B2" /><rect x="7.5" y="9.5" width="17" height="10" rx="1.2" fill="#CFFAFE" /><path d="M9 15h3l1.6-3.2 2.2 5.4 1.6-2.2h6.4" stroke="#0E7490" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /><rect x="13" y="22" width="6" height="2.4" fill="#0E7490" /><rect x="10" y="24.4" width="12" height="2" rx="1" fill="#0E7490" /></svg>);
    case "home": return (<svg {...P}><path d="M16 6l10.5 8.4H23v11H9v-11H5.5z" fill="#6366F1" /><path d="M16 6l10.5 8.4H23L16 8.6z" fill="#0b1733" opacity=".12" /><rect x="14" y="18" width="4" height="7" rx=".6" fill="#fff" opacity=".55" /></svg>);
    case "building": return (<svg {...P}><rect x="8.5" y="9" width="15" height="17.5" rx="1.6" fill="#3B82F6" /><g fill="#DBEAFE"><rect x="11.5" y="13" width="2.8" height="2.8" rx=".6" /><rect x="17.7" y="13" width="2.8" height="2.8" rx=".6" /><rect x="11.5" y="17.5" width="2.8" height="2.8" rx=".6" /><rect x="17.7" y="17.5" width="2.8" height="2.8" rx=".6" /></g><rect x="13.8" y="22" width="4.4" height="4.5" rx=".6" fill="#DBEAFE" /><rect x="13.3" y="5" width="5.4" height="5.4" rx="1.2" fill="#fff" /><path d="M16 6.6v3.2M14.4 8.2h3.2" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" /></svg>);
    case "pill": return (<svg {...P}><rect x="11" y="5.5" width="10" height="4" rx="1.2" fill="#15803D" /><rect x="8.5" y="9" width="15" height="17.5" rx="2.6" fill="#22C55E" /><rect x="8.5" y="9" width="15" height="3" fill="#fff" opacity=".18" /><g fill="#fff"><rect x="14.7" y="15" width="2.6" height="7" rx=".6" /><rect x="12.5" y="17.2" width="7" height="2.6" rx=".6" /></g></svg>);
    case "people": return (<svg {...P}><circle cx="20.5" cy="13" r="3.6" fill="#A5B4FC" /><path d="M14.5 25c0-3.7 3-6 6-6s6 2.3 6 6z" fill="#A5B4FC" /><circle cx="11.5" cy="11.5" r="4.2" fill="#818CF8" /><path d="M4 25.5c0-4.3 3.7-6.8 7.5-6.8s7.5 2.5 7.5 6.8z" fill="#818CF8" /></svg>);
    case "coin": return (<svg {...P}><circle cx="16" cy="16" r="10" fill="#FBBF24" /><circle cx="16" cy="16" r="7.5" fill="#FCD34D" /><path d="M11.5 12l2.5 7 2-5 2 5 2.5-7M12.5 16h7M12.5 18.5h7" stroke="#B45309" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "chat": return (<svg {...P}><path d="M7 7.5h18a2.2 2.2 0 0 1 2.2 2.2v8.6a2.2 2.2 0 0 1-2.2 2.2H14l-5 4v-4H7a2.2 2.2 0 0 1-2.2-2.2V9.7A2.2 2.2 0 0 1 7 7.5z" fill="#6366F1" /><g fill="#fff"><circle cx="12" cy="14" r="1.5" /><circle cx="16" cy="14" r="1.5" /><circle cx="20" cy="14" r="1.5" /></g></svg>);
    case "wallet": return (<svg {...P}><rect x="5" y="9" width="22" height="15" rx="3" fill="#059669" /><rect x="5" y="12" width="22" height="2.4" fill="#0b1733" opacity=".12" /><rect x="18" y="14" width="11" height="7" rx="2" fill="#D1FAE5" /><circle cx="23.5" cy="17.5" r="2.3" fill="#FBBF24" /></svg>);
    case "lock": return (<svg {...P}><path d="M11 15v-3a5 5 0 0 1 10 0v3" fill="none" stroke="#818CF8" strokeWidth="2.6" /><rect x="8" y="14" width="16" height="13" rx="2.6" fill="#6366F1" /><circle cx="16" cy="19.5" r="2.1" fill="#fff" /><rect x="15.2" y="20" width="1.6" height="3.6" rx=".8" fill="#fff" /></svg>);
    case "hash": return (<svg {...P}><rect x="6" y="8" width="20" height="16" rx="4.5" fill="#A855F7" /><path d="M13.5 11l-1.5 10M20 11l-1.5 10M11 14.5h10.5M10.3 18.5h10.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>);
    case "gift": return (<svg {...P}><rect x="6" y="14" width="20" height="12.5" rx="1.6" fill="#F472B6" /><rect x="6" y="14" width="20" height="4.2" fill="#EC4899" /><rect x="14.4" y="11" width="3.2" height="15.5" fill="#FBCFE8" /><path d="M16 11c-2.6-3.6-6-1.4-3.2.4M16 11c2.6-3.6 6-1.4 3.2.4" fill="#F9A8D4" /></svg>);
    case "heart": return (<svg {...P}><path d="M16 26C5 18 7.5 9 13 9c2.6 0 3 2.3 3 2.3S16.4 9 19 9c5.5 0 8 9-3 17z" fill="#EF4444" /><ellipse cx="12" cy="13" rx="2.4" ry="1.6" fill="#fff" opacity=".35" /></svg>);
    case "heartpulse": return (<svg {...P}><path d="M16 26C5 18 7.5 9 13 9c2.6 0 3 2.3 3 2.3S16.4 9 19 9c5.5 0 8 9-3 17z" fill="#EF4444" /><path d="M9 17h3l1.6-3 2.2 5.4 1.6-2.4h6" stroke="#fff" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "user": return (<svg {...P}><circle cx="16" cy="13" r="5.2" fill="#60A5FA" /><path d="M6.5 26.5c0-5.3 4.3-8.2 9.5-8.2s9.5 2.9 9.5 8.2z" fill="#60A5FA" /><ellipse cx="13.5" cy="11.5" rx="1.8" ry="1.1" fill="#fff" opacity=".35" /></svg>);
    case "bell": return (<svg {...P}><rect x="14.7" y="6.5" width="2.6" height="3" rx="1.3" fill="#C2780A" /><path d="M16 8.5c-4.5 0-7 3-7 7.6v3l-1.8 2.7a1 1 0 0 0 .85 1.6h15.9a1 1 0 0 0 .85-1.6L23 19.1v-3c0-4.6-2.5-7.6-7-7.6z" fill="#F59E0B" /><path d="M12.8 23.4a3.2 3.2 0 0 0 6.4 0z" fill="#C2780A" /><ellipse cx="12.5" cy="14.5" rx="1.5" ry="2.6" fill="#fff" opacity=".3" transform="rotate(-20 12.5 14.5)" /></svg>);
    case "check": return (<svg {...P}><circle cx="16" cy="16" r="10" fill="#16A34A" /><path d="M11 16.5l3.2 3.2 6-6.6" stroke="#fff" strokeWidth="2.7" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "percent": return (<svg {...P}><rect x="6" y="6" width="20" height="20" rx="6" fill="#7C3AED" /><circle cx="12.8" cy="12.8" r="2.2" fill="none" stroke="#fff" strokeWidth="2" /><circle cx="19.2" cy="19.2" r="2.2" fill="none" stroke="#fff" strokeWidth="2" /><path d="M11.5 20.5l9-9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>);
    case "sparkle": return (<svg {...P}><path d="M16 5.5l2.6 6.9 6.9 2.6-6.9 2.6L16 24.5l-2.6-6.9L6.5 15l6.9-2.6z" fill="#A855F7" /><circle cx="24" cy="9" r="1.7" fill="#C4B5FD" /></svg>);
    case "search": return (<svg {...P}><circle cx="14" cy="14" r="7" fill="#DBEAFE" stroke="#2563EB" strokeWidth="3" /><path d="M19 19l6.5 6.5" stroke="#2563EB" strokeWidth="3.4" strokeLinecap="round" /></svg>);
    case "calendar": return (<svg {...P}><rect x="6" y="9" width="20" height="18" rx="3" fill="#fff" /><path d="M6 12.4A3 3 0 0 1 9 9.4h14a3 3 0 0 1 3 3v2.6H6z" fill="#EF4444" /><rect x="11" y="6.4" width="2.4" height="5.2" rx="1.2" fill="#B91C1C" /><rect x="18.6" y="6.4" width="2.4" height="5.2" rx="1.2" fill="#B91C1C" /><path d="M11 20.5l3 3 5.2-5.6" stroke="#16A34A" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "pin": return (<svg {...P}><path d="M16 5c-5 0-8.5 3.6-8.5 8.3C7.5 19 16 27.5 16 27.5s8.5-8.5 8.5-14.2C24.5 8.6 21 5 16 5z" fill="#EF4444" /><circle cx="16" cy="13.2" r="3.3" fill="#fff" /></svg>);
    case "moon": return (<svg {...P}><path d="M22.5 21.5A9.5 9.5 0 1 1 17 4.6a7.5 7.5 0 0 0 5.5 16.9z" fill="#FBBF24" /></svg>);
    case "phone": return (<svg {...P}><rect x="6" y="6" width="20" height="20" rx="6" fill="#16A34A" /><path d="M12.5 11c-1 0-2 .9-2 2 0 4.7 3.8 8.5 8.5 8.5 1.1 0 2-1 2-2v-1.8l-3.2-1.1-1.4 1.4c-1.4-.8-2.4-1.8-3.2-3.2l1.4-1.4-1.1-3.2z" fill="#fff" /></svg>);
    default: return (<svg {...P}><circle cx="16" cy="16" r="10" fill="#94A3B8" /><path d="M16 11v10M11 16h10" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /></svg>);
  }
}
const SECTIONS = [
  { k: "home", ic: Home, t: "홈", s: "건강지갑 통합 대시보드" }, { k: "ai", ic: Bot, t: "나의 주치의", s: "AI·전문의 상담 · 음성·화상·기기연동" },
  { k: "checkup", ic: ClipboardList, t: "건강검진", s: "예약·결과조회·검진보험" }, { k: "insurance", ic: ShieldCheck, t: "보험·치료비", s: "조회·가입·청구·치료비" }, { k: "manage", ic: HeartPulse, t: "건강관리", s: "건강점수·질병위험도" },
  { k: "hospital", ic: Building2, t: "병원/예약", s: "병원검색·정밀검사" }, { k: "homecare", ic: HeartHandshake, t: "재가·돌봄", s: "방문요양·간병·돌봄" },
  { k: "shop", ic: ShoppingCart, t: "건강쇼핑", s: "영양제·식단·의료기기" },
  { k: "wallet", ic: Wallet, t: "건강금융지갑", s: "자산·토큰·보험금" }, { k: "nft", ic: "NFT", t: "Health NFT", s: "건강인증서" },
  { k: "community", ic: Users, t: "커뮤니티", s: "건강 커뮤니티" }, { k: "mypage", ic: Settings, t: "마이페이지", s: "개인정보·동의관리" },
];
const SCAFFOLDS = {
  checkup: { color: "#2563EB", mods: [[Search, "검진센터 검색", "지역·항목별 제휴 검진센터 검색."], [CalendarCheck, "검진 예약", "예약 및 NFT 예약증 발행."], [ShieldCheck, "무료 검진보험 자동가입", "예약 시 추가 보험료 없이 자동 가입."], [FileText, "결과 업로드·AI 리포트", "검진 결과 연동 후 XAI 리포트."]] },
  manage: { color: "#16A34A", mods: [[Activity, "생체나이·건강점수", "생체나이와 노화 지표 추이."], [Brain, "질병·암 위험도", "9종 질병·10종 암 위험 예측."], [TrendingUp, "지표 추이", "생체나이·장기나이 변화 추적."], [FileText, "AI 건강 리포트", "정기 리포트와 맞춤 권고."]] },
  hospital: { color: "#0EA5E9", mods: [[Search, "전문병원 검색", "위험질환별 전문병원 검색."], [ClipboardList, "진료과목 필터", "소화기·영상의학과 필터."], [CalendarCheck, "예약 가능 시간", "병원 API 실시간 슬롯."], [BadgeCheck, "예약 확정·기록", "예약 후 지갑에 자동 기록."]] },
  homecare: { color: "#E11D8F", mods: [[HeartHandshake, "방문간호", "퇴원 후 방문간호 매칭."], [Activity, "방문재활", "재활 프로그램 연계."], [Home, "방문요양", "고령자 돌봄·생활 지원."], [Stethoscope, "재택의료·예약·결제", "재택의료·예약·방문기록."]] },
  shop: { color: "#F59E0B", mods: [[Salad, "건강식단", "저염·식이섬유 맞춤 식단."], [Pill, "영양제", "간 건강 등 맞춤 영양제."], [MonitorSmartphone, "의료기기", "CGM·혈압계 등."], [Sparkles, "AI 추천상품", "위험도 맞춤 초개인화 추천."]] },
  insurance: { color: "#2F5BEA", mods: [["badge", "보장 조회", "보장 항목·한도 통합 조회."], ["coin", "예상 보험금", "검사·치료별 예상 지급액."], ["doc", "보험금 청구", "원클릭 스마트 청구."], ["chat", "보험상담 신청", "정식 라이선스 채널 연결."]] },
  wallet: { color: "#16A34A", mods: [["coin", "Health Token", "건강활동 보상 토큰."], ["wallet", "보험금·적립금", "지급 이력·적립금 잔액."], ["badge", "NFT 건강인증서", "인증서를 SBT로 보관."], ["lock", "데이터 동의·리워드", "DID 동의·데이터 보상."]] },
  nft: { color: "#7C3AED", mods: [["badge", "NFT 건강인증서", "위변조 불가 인증서."], ["doc", "건강검진 NFT", "검진 기록 NFT 발행."], ["hash", "의료기록 해시", "온체인 무결성 증명."], ["gift", "데이터 동의 보상", "동의에 대한 토큰 보상."]] },
  community: { color: "#5B6EF0", mods: [["people", "질환별 모임", "당뇨·간 건강 커뮤니티."], ["chat", "전문가 Q&A", "의료진 건강 Q&A."], ["heart", "건강 후기", "검진·병원·제품 후기."]] },
  mypage: { color: "#64748B", mods: [["user", "개인정보", "프로필·연락처 관리."], ["lock", "동의관리 (DID)", "제3자 제공·보험상담 동의."], ["people", "가족 건강관리", "가족 건강 함께 관리."], ["bell", "알림 설정", "검진·예약·보험 알림."]] },
};
const Mini = ({ bg, children }) => <span className="ic" style={{ background: bg }}>{children}</span>;

/* ====================== App ====================== */
const HDR_NOTI = [
  ["calendar", "건강검진 예약 D-3", "강북삼성병원 종합검진 예약이 곧 다가와요. 준비사항을 확인하세요.", "방금", "checkup"],
  ["badge", "무상 건강검진보험 자동 적용", "검진 예약과 함께 건강검진대비보험이 자동 적용됐어요.", "1시간 전", "insurance"],
  ["doc", "AI 건강 리포트 업데이트", "생체나이·질병/암 위험 리포트가 갱신됐어요. 확인해 보세요.", "어제", "manage"],
];
/* ====================== 전역 안내(토스트) · 상담 폼 ====================== */
let _toast = null, _consult = null, _nav = null;
function toast(msg) { if (_toast) _toast(msg); }
function openConsult(interest) { if (_consult) _consult(interest || "건강·보험 종합 상담"); }
function nav(s) { if (_nav) _nav(s); }

/* 통합 검색 인덱스 — [라벨, 설명, 카테고리, 섹션키] */
const SEARCH_INDEX = [
  // 병원/예약
  ["병원 검색·예약", "지역·진료과별 제휴 병원 검색 및 실시간 예약", "병원", "hospital"],
  ["소화기내과 전문병원", "위·대장 내시경, 췌장·간 정밀검사", "병원", "hospital"],
  ["영상의학과", "복부 초음파·CT 추적관찰", "병원", "hospital"],
  ["강북삼성병원·KMI 검진센터", "종합검진 제휴 기관", "병원", "hospital"],
  // 질환
  ["췌장암", "초기 증상이 적은 암 — 복부 초음파·CT 권장", "질환", "manage"],
  ["당뇨병", "공복혈당·당화혈색소 관리가 핵심", "질환", "manage"],
  ["지방간·간 건강", "간수치(GTP)·지방간 관리", "질환", "manage"],
  ["고혈압", "혈압 관리·생활습관 교정", "질환", "manage"],
  ["위암·대장암", "연령 권장 내시경 검진", "질환", "manage"],
  // 검진
  ["건강검진 예약", "제휴 검진센터 예약 + 검진보험 자동가입", "검진", "checkup"],
  ["국가건강검진", "공단 대상자 조회·예약", "검진", "checkup"],
  ["암검진", "위·대장·간·유방·자궁경부암 검진", "검진", "checkup"],
  ["검진 결과 조회·AI 리포트", "결과 연동 후 XAI 분석", "검진", "checkup"],
  // 보험상품 / 프리미엄
  ["내 몸 맞춤 프리미엄보험", "AI 맞춤 초개인화 보험 설계", "프리미엄보험", "insurance"],
  ["건강검진 대비보험", "검진 연계 자동가입 — 암·뇌졸중·급성심근경색 보장", "보험상품", "insurance"],
  ["실손보험 정책", "건강자산 기반 보험지원 모델", "보험상품", "insurance"],
  ["맞춤 헬스케어 보험", "플랫폼 구조도·핵심 가치", "프리미엄보험", "insurance"],
  ["보장 조회", "보장 항목·한도 통합 조회", "보험상품", "insurance"],
  ["보험금 청구", "원클릭 스마트 청구", "보험상품", "insurance"],
  ["보험 가입", "건강검진보험·실손 가입", "보험상품", "insurance"],
  // 제휴 보험사
  ["현대해상", "제휴 보험사 — 프리미엄 헬스케어 보험", "제휴보험사", "insurance"],
  ["삼성화재", "제휴 손해보험사", "제휴보험사", "insurance"],
  ["DB손해보험", "제휴 손해보험사", "제휴보험사", "insurance"],
  ["KB손해보험", "제휴 손해보험사", "제휴보험사", "insurance"],
  ["메리츠화재", "제휴 손해보험사", "제휴보험사", "insurance"],
  ["삼성생명·교보생명·신한라이프·NH농협생명", "제휴 생명보험사", "제휴보험사", "insurance"],
  // 건강리포트 / AI
  ["AI 건강 리포트", "생체나이·질병/암 위험 예측", "건강리포트", "manage"],
  ["생체나이·건강점수", "노화 지표 추이 분석", "건강리포트", "manage"],
  ["질병·암 위험도", "9종 질병·10종 암 위험 예측", "건강리포트", "manage"],
  ["AI 주치의 상담", "24시간 생성형 AI 건강상담", "AI상담", "ai"],
  ["금연·절주 코칭", "췌장·간 위험 낮추기 프로그램", "AI상담", "ai"],
  ["유산소 운동 코칭", "주 3회 맞춤 운동 프로그램", "AI상담", "ai"],
  // 건강지갑
  ["건강금융지갑", "건강자산·Health Token·보험적립금 통합", "건강지갑", "wallet"],
  ["Health Token", "건강활동 보상 토큰 적립·사용", "건강지갑", "wallet"],
  ["보험 적립금", "지급 이력·적립금 잔액", "건강지갑", "wallet"],
  ["NFT 건강인증서", "위변조 불가 건강 인증서(SBT)", "NFT", "nft"],
  // 헬스케어 상품
  ["간 건강 영양제", "밀크씨슬 등 맞춤 영양제", "헬스케어상품", "shop"],
  ["당뇨 예방 식단", "저당·식이섬유 맞춤 식단", "헬스케어상품", "shop"],
  ["CGM·혈압계 의료기기", "연속혈당측정·혈압계 등", "헬스케어상품", "shop"],
  ["AI 추천상품", "위험도 맞춤 초개인화 추천", "헬스케어상품", "shop"],
  // 서비스
  ["재가·돌봄 서비스", "방문요양·간병·재택의료 매칭", "재가·돌봄", "homecare"],
  ["건강 커뮤니티", "질환별 모임·전문가 Q&A", "커뮤니티", "community"],
];
const CAT_META = {
  "병원": [Building2, "#0EA5E9"], "질환": [HeartPulse, "#EF4444"], "검진": [ClipboardList, "#2563EB"],
  "보험상품": [ShieldCheck, "#2F5BEA"], "프리미엄보험": [Sparkles, "#7C3AED"], "AI상담": [Bot, "#16A34A"],
  "제휴보험사": [Building2, "#1E40C8"], "건강리포트": [Activity, "#16A34A"], "건강지갑": [Wallet, "#F59E0B"],
  "NFT": [BadgeCheck, "#7C3AED"], "헬스케어상품": [Pill, "#F59E0B"], "재가·돌봄": [HeartHandshake, "#E11D8F"],
  "커뮤니티": [Users, "#5B6EF0"],
};
function CatIcon({ c }) { const m = CAT_META[c] || [Search, "#64748B"]; const Ic = m[0]; return <Ic size={14} color={m[1]} />; }

/* 상담 신청 폼 — 이름·연락처·관심분야 */
function ConsultModal({ interest, onClose }) {
  const INTERESTS = ["내 몸 맞춤 프리미엄보험", "건강검진 대비보험", "실손보험", "건강검진 예약", "재가·돌봄 서비스", "기업검진 도입", "건강·보험 종합 상담"];
  const [f, setF] = useState({ name: "", phone: "", interest: INTERESTS.includes(interest) ? interest : INTERESTS[0] });
  const [done, setDone] = useState(false);
  const ok = f.name.trim() && f.phone.trim().length >= 9;
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt">{done ? "상담 신청 완료" : "상담 신청"}</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="bkb">
          {!done ? (<>
            <div style={{ display: "flex", alignItems: "center", gap: 11, background: "linear-gradient(120deg,#2563EB,#1E40C8)", color: "#fff", borderRadius: 12, padding: "12px 14px", boxShadow: "0 12px 24px -16px rgba(37,99,235,.7)" }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center", flexShrink: 0 }}><MessageSquare size={20} color="#fff" /></span>
              <div style={{ fontSize: 12.8, fontWeight: 700, lineHeight: 1.5 }}>라이선스 상담사가 <b style={{ color: "#FDE68A" }}>입력하신 연락처</b>로 1:1 맞춤 상담을 도와드립니다.</div>
            </div>
            <div className="cfield"><label>이름</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="성명을 입력하세요" /></div>
            <div className="cfield"><label>연락처</label><input value={f.phone} inputMode="numeric" onChange={(e) => setF({ ...f, phone: e.target.value.replace(/[^0-9-]/g, "").slice(0, 13) })} placeholder="휴대전화 번호 (예: 010-1234-5678)" /></div>
            <div className="cfield"><label>관심 분야</label><select value={f.interest} onChange={(e) => setF({ ...f, interest: e.target.value })}>{INTERESTS.map((i) => <option key={i} value={i}>{i}</option>)}</select></div>
            <button className="cbtn pri" style={{ opacity: ok ? 1 : .5 }} disabled={!ok} onClick={() => setDone(true)}><MessageSquare size={15} /> {!f.name.trim() ? "이름을 입력하세요" : f.phone.trim().length < 9 ? "연락처를 입력하세요" : "상담 신청하기"}</button>
            <div className="chnote" style={{ marginTop: 8 }}>※ 입력 정보는 예시용이며 실제 전송·저장되지 않습니다.</div>
          </>) : (
            <div className="bkconfirm">
              <div className="ic"><Check size={30} color="#16A34A" /></div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>상담 신청이 접수되었습니다</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, lineHeight: 1.6 }}>{f.name}님 ({f.phone})<br />관심 분야: <b style={{ color: "var(--blue)" }}>{f.interest}</b><br />라이선스 상담사가 영업일 기준 1일 내 연락드립니다.</div>
              <button className="cbtn pri" style={{ marginTop: 16 }} onClick={onClose}>확인</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

