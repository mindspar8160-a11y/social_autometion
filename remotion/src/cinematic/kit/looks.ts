import type {Pal} from "./paper";

export type SheetKind = "torn" | "rounded" | "arch" | "ticket" | "scroll" | "polaroid";
export type LayoutKind = "zigzag" | "scroll" | "strip" | "diagonal" | "spiral";
export type CaptionKind = "box" | "ribbon" | "karaoke" | "lower";
export type Pattern = "dots" | "grid" | "lines" | "stars" | "waves" | "diamonds" | "none";
export type FontKey = "display" | "hand" | "bold";
export type Frame = "disc" | "arch" | "rect" | "none";

export type Look = {
  id: string;
  moods: string[];
  board: {bg: string; bg2: string; pattern: Pattern; patColor: string; dark: boolean; vignette: number};
  pal: Pal;
  sheet: SheetKind;
  sheetFill: string;
  ink: string;
  accents: {main: string; dark: string}[];   // cycled per scene (sheet edge layers + highlighter)
  titleFont: FontKey;
  titleScale: number;
  titlePos: "top" | "bottom";
  layout: LayoutKind;
  travel: number;           // frames the camera takes between two sheets
  wobble: number;           // rotation overshoot while travelling (deg)
  tiltAmp: number;          // sheet tilt amplitude (deg)
  caption: CaptionKind;
  capColor: string;
  capHi: string;
  highlight: "marker" | "underline" | "box";
  particles: "none" | "petals" | "embers" | "stars" | "dust" | "leaves" | "bubbles";
  frames: Frame[];          // art backdrop shapes used by this look
  decor: ("sun" | "moon" | "clouds" | "stars")[];
};

const base = (o: Partial<Pal>): Pal => ({
  paper: ["#f6eed8", "#efe3c6", "#ead9b3", "#e3d3ab", "#dcc9a0"], cream: "#fbf5e6", ink: "#1d1b1a", shadow: "#7a6a4a",
  accent: "#d8452e", accent2: "#e8a92b", gold: "#c89b3c", sky: "#7fb7b4",
  skin: ["#e8b88a", "#c88c58", "#a86c38"], cloth: ["#e8641b", "#1b3b6f", "#f4ede2", "#6b4a2a"], leaf: ["#5d8a4a", "#7aa35a", "#3f6b3a"], ...o,
});

export const LOOKS: Look[] = [
  {
    id: "kraft_classic", moods: ["story", "day", "village"],
    board: {bg: "#e4d8be", bg2: "#d4c39c", pattern: "dots", patColor: "rgba(120,95,55,.28)", dark: false, vignette: 0.7},
    pal: base({}), sheet: "torn", sheetFill: "#fbf5e6", ink: "#1d1b1a",
    accents: [{main: "#d8452e", dark: "#9c2c1b"}, {main: "#1f8a87", dark: "#14605e"}, {main: "#e8a92b", dark: "#b47d12"}, {main: "#34302d", dark: "#171514"}],
    titleFont: "display", titleScale: 1, titlePos: "top", layout: "zigzag", travel: 24, wobble: 0, tiltAmp: 1.6,
    caption: "box", capColor: "#fbf5e6", capHi: "#d8452e", highlight: "marker", particles: "dust", frames: ["none", "disc", "rect"], decor: ["sun", "clouds"],
  },
  {
    id: "midnight_gold", moods: ["shiva", "night", "himalaya", "dhyan"],
    board: {bg: "#141c3a", bg2: "#070a18", pattern: "stars", patColor: "rgba(255,226,150,.55)", dark: true, vignette: 0.6},
    pal: base({paper: ["#f7ecc9", "#efdfae", "#e6d093", "#d9bd78", "#c9a85f"], shadow: "#05070f", accent: "#2b6f9e", accent2: "#e3b04b", gold: "#e3b04b", sky: "#1c3b73", cream: "#fff6d8", skin: ["#9fb7d6", "#c88c58", "#a86c38"], cloth: ["#2b6f9e", "#6b3fa0", "#f4ede2", "#5a3b22"], leaf: ["#2f6b66", "#3f8a7e", "#245450"]}),
    sheet: "arch", sheetFill: "#fff3cf", ink: "#161a33",
    accents: [{main: "#e3b04b", dark: "#9c7420"}, {main: "#2b6f9e", dark: "#173f60"}, {main: "#8a5cc8", dark: "#4b2f7c"}],
    titleFont: "display", titleScale: 0.95, titlePos: "top", layout: "scroll", travel: 30, wobble: 0, tiltAmp: 0.6,
    caption: "ribbon", capColor: "#0d1330", capHi: "#e3b04b", highlight: "underline", particles: "stars", frames: ["arch", "disc"], decor: ["moon", "stars"],
  },
  {
    id: "saffron_dawn", moods: ["devi", "temple", "sun", "day"],
    board: {bg: "#f29a3a", bg2: "#d9552b", pattern: "waves", patColor: "rgba(255,240,200,.35)", dark: false, vignette: 0.45},
    pal: base({accent: "#c4361c", accent2: "#f2b632", sky: "#ffd9a0"}),
    sheet: "rounded", sheetFill: "#fff6e0", ink: "#3a1608",
    accents: [{main: "#c4361c", dark: "#7c1d0e"}, {main: "#f2b632", dark: "#a8760d"}, {main: "#8f2a5a", dark: "#561434"}],
    titleFont: "display", titleScale: 1.05, titlePos: "bottom", layout: "diagonal", travel: 26, wobble: 1.4, tiltAmp: 2.4,
    caption: "lower", capColor: "#fff6e0", capHi: "#c4361c", highlight: "box", particles: "petals", frames: ["disc", "rect"], decor: ["sun", "clouds"],
  },
  {
    id: "emerald_grove", moods: ["forest", "rishi", "village", "nature"],
    board: {bg: "#1f4a3a", bg2: "#0f2a20", pattern: "lines", patColor: "rgba(200,240,200,.12)", dark: true, vignette: 0.55},
    pal: base({paper: ["#f2f0da", "#e8e5c4", "#dcd8ab", "#cdc98f", "#b9b576"], shadow: "#0a1a12", accent: "#c4561c", accent2: "#e8b23a", sky: "#8cc7b4", leaf: ["#4f9a5a", "#6fb06a", "#2f7a4a"]}),
    sheet: "ticket", sheetFill: "#f7f4e0", ink: "#12281e",
    accents: [{main: "#e8b23a", dark: "#8d6a14"}, {main: "#c4561c", dark: "#7a3410"}, {main: "#2f9a7a", dark: "#175a46"}],
    titleFont: "bold", titleScale: 1.05, titlePos: "top", layout: "strip", travel: 28, wobble: 0.8, tiltAmp: 1,
    caption: "box", capColor: "#f7f4e0", capHi: "#2f9a7a", highlight: "marker", particles: "leaves", frames: ["rect", "disc"], decor: ["sun", "clouds"],
  },
  {
    id: "crimson_war", moods: ["war", "fort", "fire", "battle", "veer"],
    board: {bg: "#4a1216", bg2: "#1d0709", pattern: "diamonds", patColor: "rgba(255,170,120,.16)", dark: true, vignette: 0.8},
    pal: base({paper: ["#f3e4c8", "#ead6b0", "#dfc294", "#cfaa76", "#bd925c"], shadow: "#12060a", accent: "#b81d24", accent2: "#f0a030", gold: "#d9a237", sky: "#8a4a40", cloth: ["#b81d24", "#2b3a4a", "#f4ede2", "#4a2a1a"]}),
    sheet: "torn", sheetFill: "#f6e8cd", ink: "#2a0c0c",
    accents: [{main: "#b81d24", dark: "#6e0f14"}, {main: "#f0a030", dark: "#9a6410"}, {main: "#2b2b2b", dark: "#0c0c0c"}],
    titleFont: "display", titleScale: 1.1, titlePos: "top", layout: "zigzag", travel: 20, wobble: 2.6, tiltAmp: 3,
    caption: "karaoke", capColor: "#fff2d8", capHi: "#f0a030", highlight: "box", particles: "embers", frames: ["none", "rect"], decor: ["sun", "clouds"],
  },
  {
    id: "ivory_minimal", moods: ["story", "quote", "day", "calm"],
    board: {bg: "#f3f0e8", bg2: "#e4dfd0", pattern: "grid", patColor: "rgba(80,70,50,.10)", dark: false, vignette: 0.25},
    pal: base({paper: ["#fffaf0", "#f6efe0", "#ece1c9", "#e0d2b4", "#d2c19c"], shadow: "#8a8070", accent: "#2f6f8f", accent2: "#d8a02b", sky: "#bcd8e0"}),
    sheet: "polaroid", sheetFill: "#ffffff", ink: "#222222",
    accents: [{main: "#2f6f8f", dark: "#1b4358"}, {main: "#d8452e", dark: "#8a2a1b"}, {main: "#d8a02b", dark: "#8a6414"}],
    titleFont: "bold", titleScale: 0.95, titlePos: "bottom", layout: "scroll", travel: 34, wobble: 0, tiltAmp: 1.2,
    caption: "lower", capColor: "#ffffff", capHi: "#2f6f8f", highlight: "underline", particles: "none", frames: ["rect", "none", "disc"], decor: ["clouds", "sun"],
  },
  {
    id: "sandstone_desert", moods: ["desert", "fort", "palace", "rajasthan"],
    board: {bg: "#d9a066", bg2: "#b97a3e", pattern: "dots", patColor: "rgba(110,60,20,.22)", dark: false, vignette: 0.55},
    pal: base({paper: ["#fbefd2", "#f3e0b4", "#e9cd94", "#dcb676", "#c99d5c"], shadow: "#6a4420", accent: "#b3401f", accent2: "#e2a52f", sky: "#f2c98a", cloth: ["#b3401f", "#1f5f7a", "#f4ede2", "#6b4a2a"]}),
    sheet: "scroll", sheetFill: "#fdf0d2", ink: "#3a1d08",
    accents: [{main: "#b3401f", dark: "#6a2410"}, {main: "#1f7a7a", dark: "#0f4646"}, {main: "#e2a52f", dark: "#946a14"}],
    titleFont: "hand", titleScale: 1.05, titlePos: "top", layout: "spiral", travel: 26, wobble: 1.2, tiltAmp: 1.8,
    caption: "box", capColor: "#fdf0d2", capHi: "#b3401f", highlight: "marker", particles: "dust", frames: ["disc", "arch", "rect"], decor: ["sun", "clouds"],
  },
  {
    id: "ocean_teal", moods: ["sea", "river", "ghat", "water"],
    board: {bg: "#0f5d63", bg2: "#08343c", pattern: "waves", patColor: "rgba(210,245,240,.22)", dark: true, vignette: 0.55},
    pal: base({shadow: "#06262b", accent: "#d8452e", accent2: "#f0b54a", sky: "#4fb0b0", paper: ["#f7f1dc", "#eee4c4", "#e2d4a6", "#d4c186", "#c2ab6a"]}),
    sheet: "rounded", sheetFill: "#f7f1dc", ink: "#0b2a2e",
    accents: [{main: "#d8452e", dark: "#8a2a1b"}, {main: "#f0b54a", dark: "#9a6c18"}, {main: "#1f7a8a", dark: "#0f4552"}],
    titleFont: "display", titleScale: 1, titlePos: "bottom", layout: "strip", travel: 32, wobble: 1, tiltAmp: 1.4,
    caption: "ribbon", capColor: "#08343c", capHi: "#f0b54a", highlight: "underline", particles: "bubbles", frames: ["rect", "disc"], decor: ["sun", "clouds"],
  },
  {
    id: "lotus_pink", moods: ["devi", "shakti", "temple", "flower"],
    board: {bg: "#e58aa3", bg2: "#a3304f", pattern: "diamonds", patColor: "rgba(255,235,240,.28)", dark: false, vignette: 0.5},
    pal: base({accent: "#c0265a", accent2: "#f2a63b", sky: "#f6c3d0", shadow: "#6a1830", paper: ["#fff4ee", "#fbe6dc", "#f4d3c6", "#e9bda9", "#d9a58e"]}),
    sheet: "arch", sheetFill: "#fff1ea", ink: "#3b0f22",
    accents: [{main: "#c0265a", dark: "#751236"}, {main: "#f2a63b", dark: "#a06a14"}, {main: "#7a3aa0", dark: "#472064"}],
    titleFont: "display", titleScale: 1, titlePos: "bottom", layout: "diagonal", travel: 28, wobble: 1.8, tiltAmp: 2,
    caption: "karaoke", capColor: "#fff1ea", capHi: "#c0265a", highlight: "box", particles: "petals", frames: ["arch", "disc"], decor: ["moon", "sun", "clouds"],
  },
  {
    id: "indigo_dusk", moods: ["himalaya", "night", "shiva", "mystery", "cave"],
    board: {bg: "#322c70", bg2: "#14113a", pattern: "stars", patColor: "rgba(255,255,255,.5)", dark: true, vignette: 0.65},
    pal: base({shadow: "#0a0824", accent: "#8a4ac8", accent2: "#f0b34a", gold: "#f0b34a", sky: "#4a4aa0", paper: ["#f2ecff", "#e6dcf6", "#d6c8ee", "#c4b2e2", "#ad97d2"], cream: "#fbf6ff"}),
    sheet: "ticket", sheetFill: "#f6f0ff", ink: "#1a1440",
    accents: [{main: "#8a4ac8", dark: "#4b2480"}, {main: "#f0b34a", dark: "#9a6a18"}, {main: "#2fa59a", dark: "#176058"}],
    titleFont: "bold", titleScale: 1, titlePos: "top", layout: "spiral", travel: 30, wobble: 1.6, tiltAmp: 1.8,
    caption: "lower", capColor: "#14113a", capHi: "#f0b34a", highlight: "marker", particles: "stars", frames: ["disc", "arch", "rect"], decor: ["moon", "stars"],
  },
];

export const lookById = (id?: string) => LOOKS.find((l) => l.id === id);

const MOOD_WORDS: Record<string, string[]> = {
  war: ["युद्ध", "लड़ाई", "सेना", "तलवार", "वीर", "योद्धा", "रक्त", "बलिदान", "आक्रमण", "battle", "war", "पावनखिंड", "जौहर"],
  fort: ["किला", "दुर्ग", "गढ़", "fort"],
  fire: ["आग", "अग्नि", "ज्वाला", "हवन", "यज्ञ"],
  devi: ["देवी", "माता", "शक्तिपीठ", "सती", "दुर्गा", "काली", "शक्ति", "devi", "mata", "आई", "भवानी"],
  shakti: ["शक्तिपीठ", "सती", "शक्ति"],
  shiva: ["शिव", "महादेव", "शंकर", "त्रिशूल", "कैलाश", "भैरव", "shiva", "जटा"],
  night: ["रात", "रात्रि", "अंधकार", "चाँद", "चंद्र", "तारे", "स्वप्न", "night"],
  himalaya: ["हिमालय", "कैलाश", "बर्फ", "केदारनाथ", "बद्रीनाथ", "अमरनाथ"],
  cave: ["गुफा", "रहस्य", "तहखाना", "cave"],
  forest: ["जंगल", "वन", "वृक्ष", "पेड़", "ऋषि", "आश्रम", "तपस्या"],
  rishi: ["ऋषि", "मुनि", "तपस्या", "गुरु", "आश्रम"],
  village: ["गाँव", "गांव", "किसान", "कुआं", "खेत"],
  desert: ["रेगिस्तान", "मरुस्थल", "ऊँट", "राजस्थान", "जैसलमेर", "थार", "पाबूजी"],
  palace: ["महल", "दरबार", "राजा", "सिंहासन", "राजधानी"],
  sea: ["समुद्र", "सागर", "नाव", "लहर", "द्वारका", "रामसेतु"],
  river: ["नदी", "गंगा", "यमुना", "नर्मदा", "घाट", "काशी", "सरयू", "गोदावरी"],
  ghat: ["घाट", "काशी", "वाराणसी", "प्रयाग"],
  temple: ["मंदिर", "धाम", "पूजा", "आरती", "तीर्थ", "शिखर"],
  sun: ["सूर्य", "सूरज", "सवेरा", "उदय", "कोणार्क"],
  flower: ["कमल", "फूल", "पुष्प"],
};

/** moods found in the story text (used both to pick a look and to bias asset choice) */
export const moodsOf = (text: string): string[] => {
  const t = text.toLowerCase();
  return Object.entries(MOOD_WORDS).filter(([, ws]) => ws.some((w) => t.includes(w.toLowerCase()))).map(([m]) => m);
};

/** explicit id wins; otherwise seed + story mood choose (a mood-matching look is preferred, but never the same for every seed) */
export const pickLook = (id: string | undefined, seed: number, text: string): Look => {
  const forced = lookById(id);
  if (forced) return forced;
  const moods = moodsOf(text);
  const scored = LOOKS.map((l, i) => ({l, i, s: l.moods.filter((m) => moods.includes(m)).length}));
  const pool = scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  const cand = pool.length ? pool.slice(0, 3).map((x) => x.l) : LOOKS;
  return cand[Math.abs(Math.floor(seed)) % cand.length];
};
