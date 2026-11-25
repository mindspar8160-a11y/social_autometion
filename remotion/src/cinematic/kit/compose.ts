import {KIT_ASSETS} from "./registry";
import type {Asset} from "./registry";
import type {Look, Frame} from "./looks";
import {Pal, paper, circ, ell, rect, path, poly, g, f1, rnd, sw, stars, cloud, mountains, ground} from "./paper";

/** old hand-made React cutouts (PaperSvgAssets.tsx) stay in the pool, but with lower weight than the new kit */
export const LEGACY: {id: string; tags: string[]}[] = [
  {id: "legacy_lingam", tags: ["शिवलिंग", "ज्योतिर्लिंग", "लिंगम", "सोमनाथ", "महाकाल", "lingam", "jyotirlinga", "rudra"]},
  {id: "legacy_trishul", tags: ["त्रिशूल", "डमरू", "तांडव", "भैरव", "trishul", "damru"]},
  {id: "legacy_chariot", tags: ["रथ", "सारथी", "कुरुक्षेत्र", "अश्व", "घोड़े", "chariot", "rath"]},
  {id: "legacy_cave", tags: ["गुफा", "पर्वत", "पहाड़", "कैलाश", "हिमालय", "cave", "mountain", "kailash"]},
  {id: "legacy_sudarshan", tags: ["चक्र", "सुदर्शन", "शंख", "विष्णु", "narayan", "chakra"]},
  {id: "legacy_cows", tags: ["गाय", "गौ", "gau", "cow", "कामधेनु", "बछड़ा", "गोमाता"]},
  {id: "legacy_vachan", tags: ["वचन", "vachan", "शपथ", "संकल्प", "आशीर्वाद", "वरदान", "प्रण", "प्रतिज्ञा"]},
  {id: "legacy_weapons", tags: ["तलवार", "talwar", "sword", "धनुष", "बाण", "तीर", "हथियार", "शस्त्र", "ढाल"]},
  {id: "legacy_army", tags: ["सेना", "sena", "सैन्य", "युद्ध", "लड़ाई", "फौज", "mawla", "सैनिक", "battle"]},
  {id: "legacy_deity", tags: ["द्वारकाधीश", "कृष्ण", "krishna", "शिव", "महादेव", "राम", "हनुमान", "भगवान"]},
  {id: "legacy_chardham", tags: ["धाम", "dham", "चार धाम", "तीर्थ", "मान्यता"]},
  {id: "legacy_city", tags: ["नगरी", "नगर", "समुद्र", "किला", "साम्राज्य", "राजधानी", "द्वारका"]},
  {id: "legacy_temple", tags: ["मंदिर", "temple", "शिखर", "पूजा", "आरती"]},
];

type Cand = {id: string; group: string; tags: string[]; weight: number; legacy: boolean};
const POOL: Cand[] = [
  ...KIT_ASSETS.map((a) => ({id: a.id, group: a.group, tags: a.tags, weight: a.weight ?? 1, legacy: false})),
  ...LEGACY.map((a) => ({id: a.id, group: "legacy", tags: a.tags, weight: 0.5, legacy: true})),
];
const BY_ID: Record<string, Asset> = Object.fromEntries(KIT_ASSETS.map((a) => [a.id, a]));

export type Slot = {id: string; cx: number; cy: number; s: number; flip?: boolean; op?: number};
export type ArtPlan = {hero: string; legacy: boolean; slots: Slot[]; frame: Frame; decor: string[]; variant: number; aSeed: number; tpl: string};

export type SceneLike = {text: string; sub?: string; narration: string};

/** choose hero + companions + composition for every scene: matches story words, never reuses an asset while there are alternatives */
export const planArt = (scenes: SceneLike[], seed: number, look: Look): ArtPlan[] => {
  const used = new Map<string, number>();
  const story = scenes.map((s) => `${s.text} ${s.sub || ""} ${s.narration}`).join(" ").toLowerCase();
  const matchScore = (c: Cand, hay: string) => c.tags.reduce((m, tg) => (tg.length >= 2 && hay.includes(tg.toLowerCase()) ? m + 1 + Math.min(tg.length, 6) * 0.15 : m), 0);
  return scenes.map((s, i) => {
    const r = rnd(Math.floor(seed) * 7919 + i * 131 + 17);
    const hay = `${s.text} ${s.sub || ""} ${s.narration}`.toLowerCase();
    const scored = POOL.map((c) => ({c, sc: Math.min(3.2, matchScore(c, hay)) * c.weight + Math.min(1.2, matchScore(c, story) * 0.2) * c.weight - (used.get(c.id) || 0) * 4.2 + r() * 1.1 + (c.legacy ? 0 : 0.15)})).sort((a, b) => b.sc - a.sc);
    const hero = scored[0].c;
    used.set(hero.id, (used.get(hero.id) || 0) + 1);
    const slots: Slot[] = [];
    let tpl = "solo";
    if (!hero.legacy) {
      const comps = scored.filter((x) => !x.c.legacy && x.c.id !== hero.id && x.c.group !== hero.group).slice(0, 4).map((x) => x.c);
      const places = scored.filter((x) => !x.c.legacy && x.c.group === "place" && x.c.id !== hero.id).slice(0, 3).map((x) => x.c);
      const pick = r();
      tpl = pick < 0.28 ? "solo" : pick < 0.52 ? "duo" : pick < 0.76 ? "trio" : "back";
      if (tpl === "back" && !(hero.group === "figure" && places.length)) tpl = "duo";
      if (tpl === "duo" && comps[0]) { slots.push({id: hero.id, cx: 560, cy: 292, s: 0.9}, {id: comps[0].id, cx: 190, cy: 380, s: 0.56}); used.set(comps[0].id, (used.get(comps[0].id) || 0) + 0.5); }
      else if (tpl === "trio" && comps[1]) { slots.push({id: comps[0].id, cx: 150, cy: 360, s: 0.46, flip: false}, {id: comps[1].id, cx: 750, cy: 360, s: 0.46, flip: true}, {id: hero.id, cx: 450, cy: 292, s: 0.86}); used.set(comps[0].id, (used.get(comps[0].id) || 0) + 0.5); used.set(comps[1].id, (used.get(comps[1].id) || 0) + 0.5); }
      else if (tpl === "back") { const b = places[Math.floor(r() * places.length)]; slots.push({id: b.id, cx: 450, cy: 262, s: 1.28, op: 0.96}, {id: hero.id, cx: 330 + (r() < 0.5 ? 0 : 190), cy: 318, s: 0.8, flip: r() < 0.5}); if (comps[0]) slots.push({id: comps[0].id, cx: 770 - (slots[1].cx > 400 ? 560 : 0), cy: 420, s: 0.36}); used.set(b.id, (used.get(b.id) || 0) + 0.5); }
      else { tpl = "solo"; slots.push({id: hero.id, cx: 450, cy: 288, s: 1.02}); }
    }
    const frame = look.frames[Math.floor(r() * look.frames.length)];
    const decor = look.decor.filter(() => r() < 0.7);
    return {hero: hero.id, legacy: hero.legacy, slots, frame, decor, variant: Math.floor(r() * 3), aSeed: Math.floor(r() * 99999), tpl};
  });
};

/* ------------------------------------------------------------------ backdrop frames */
const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);

const decorSvg = (kinds: string[], pal: Pal, t: number, seed: number, x0: number, x1: number, y0: number) => {
  let o = "";
  const r = rnd(seed);
  for (const k of kinds) {
    if (k === "sun") o += paper(pal, ...Array.from({length: 12}, (_, i) => { const a = (i / 12) * Math.PI * 2 + t * 0.2; return poly([[x1 - 90 + Math.cos(a - 0.12) * 40, y0 + 90 + Math.sin(a - 0.12) * 40], [x1 - 90 + Math.cos(a) * 66, y0 + 90 + Math.sin(a) * 66], [x1 - 90 + Math.cos(a + 0.12) * 40, y0 + 90 + Math.sin(a + 0.12) * 40]], pal.accent2, 1.6); }), circ(x1 - 90, y0 + 90, 38, pal.gold, 2.4));
    if (k === "moon") o += paper(pal, circ(x1 - 100, y0 + 90, 44, pal.cream, 2.6), circ(x1 - 82, y0 + 80, 38, pal.sky, 0.1));
    if (k === "clouds") o += paper(pal, cloud(x0 + 140 + ((t * 8) % 40), y0 + 96, 0.8, pal.paper[0]), cloud(x1 - 250 - ((t * 6) % 30), y0 + 150, 0.6, pal.paper[1]));
    if (k === "stars") o += stars(16, Math.floor(r() * 9999) + 1, x1 - x0, 170, t).replace(/<path /g, "<path transform=\"translate(" + x0 + " " + (y0 + 10) + ")\" ");
  }
  return o;
};

export const frameSvg = (frame: Frame, decor: string[], pal: Pal, t: number, seed: number, W: number, H: number) => {
  if (frame === "none") return decorSvg(decor.filter((d) => d === "clouds" || d === "stars"), pal, t, seed, 40, W - 40, 10);
  if (frame === "disc") {
    const R = 262;
    return paper(pal, circ(W / 2, H / 2 + 10, R + 22, pal.paper[2], 3.4), circ(W / 2, H / 2 + 10, R, pal.sky, 3)) + `<g clip-path="url(#cl-disc)">${decorSvg(decor, pal, t, seed, W / 2 - R, W / 2 + R, 30)}</g>` +
      `<clipPath id="cl-disc"><circle cx="${W / 2}" cy="${H / 2 + 10}" r="${R}"/></clipPath>`;
  }
  if (frame === "arch") {
    const x0 = 120, x1 = W - 120, rr = (x1 - x0) / 2;
    const d = `M${x0},${H - 14}L${x0},${28 + rr}A${rr},${rr} 0 0 1 ${x1},${28 + rr}L${x1},${H - 14}Z`;
    return paper(pal, path(d, pal.sky, 3.4)) + `<clipPath id="cl-arch"><path d="${d}"/></clipPath><g clip-path="url(#cl-arch)">${decorSvg(decor, pal, t, seed, x0, x1, 40)}${paper(pal, mountains(pal, H - 60, seed, false, x0, x1, 120), ground(pal, H - 40, W, pal.paper[3]))}</g>`;
  }
  // rect
  const d = `M60,40h${W - 120}a28,28 0 0 1 28,28v${H - 110}a28,28 0 0 1 -28,28h${-(W - 120)}a28,28 0 0 1 -28,-28v${-(H - 110)}a28,28 0 0 1 28,-28Z`;
  return paper(pal, path(d, pal.sky, 3.4)) + `<clipPath id="cl-rect"><path d="${d}"/></clipPath><g clip-path="url(#cl-rect)">${decorSvg(decor, pal, t, seed, 32, W - 32, 30)}${paper(pal, mountains(pal, H - 70, seed + 3, false, 32, W - 32, 130), ground(pal, H - 50, W, pal.paper[3]))}</g>`;
};

/** inner svg markup for one scene's art, 900 x 560 */
export const renderArt = (plan: ArtPlan, pal: Pal, t: number, p: number, W = 900, H = 560): string => {
  let out = frameSvg(plan.frame, plan.decor, pal, t, plan.aSeed, W, H);
  plan.slots.forEach((sl, k) => {
    const a = BY_ID[sl.id];
    if (!a) return;
    const q = ease(p * 1.25 - k * 0.12);
    const s = sl.s * (0.86 + 0.14 * q);
    const fy = sw(t, 0.45, 5, k * 1.7);
    const inner = a.draw({t, p: q, seed: plan.aSeed + k * 7, pal});
    const body = sl.flip ? g("translate(600 0) scale(-1 1)", inner) : inner;
    out += g(`translate(${f1(sl.cx - 300 * s)} ${f1(sl.cy - 250 * s + fy)}) scale(${f1(s)})`, body, Math.max(0, Math.min(1, q * 1.6)) * (sl.op ?? 1));
  });
  return out;
};

export const hasAsset = (id: string) => !!BY_ID[id];
