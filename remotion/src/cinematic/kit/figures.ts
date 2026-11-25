import {Pal, KitCtx, Item, path, circ, ell, rect, poly, limb, ln, dot, stroke, g, paper, flame, halo, lotus, sw, f1, rnd, tree, cloud, mountains, ground, stars} from "./paper";

/** hand-held attributes (all drawn around (x,y) = the hand) */
export type Attr = "trishul" | "bow" | "gada" | "chakra" | "flute" | "sword" | "flower" | "conch" | "diya" | "kamandal" | "shield" | "none";
export const attr = (k: Attr, x: number, y: number, s: number, pal: Pal, t = 0): Item[] => {
  switch (k) {
    case "trishul":
      return [rect(x - 3 * s, y - 130 * s, 6 * s, 210 * s, pal.paper[4], 0, 2), path(`M${f1(x - 26 * s)},${f1(y - 140 * s)}Q${f1(x - 26 * s)},${f1(y - 108 * s)} ${f1(x)},${f1(y - 104 * s)}Q${f1(x + 26 * s)},${f1(y - 108 * s)} ${f1(x + 26 * s)},${f1(y - 140 * s)}L${f1(x + 16 * s)},${f1(y - 118 * s)}L${f1(x + 9 * s)},${f1(y - 118 * s)}L${f1(x)},${f1(y - 168 * s)}L${f1(x - 9 * s)},${f1(y - 118 * s)}L${f1(x - 16 * s)},${f1(y - 118 * s)}Z`, pal.gold, 2.4), ell(x, y - 96 * s, 9 * s, 5 * s, pal.accent, 2)];
    case "bow":
      return [path(`M${f1(x - 6 * s)},${f1(y - 120 * s)}Q${f1(x + 70 * s)},${f1(y)} ${f1(x - 6 * s)},${f1(y + 120 * s)}L${f1(x - 12 * s)},${f1(y + 120 * s)}Q${f1(x + 58 * s)},${f1(y)} ${f1(x - 12 * s)},${f1(y - 120 * s)}Z`, pal.cloth[3] || pal.paper[4], 2.4), ln(x - 9 * s, y - 120 * s, x - 9 * s, y + 120 * s, pal.ink, 1.8 * s + 0.6)];
    case "gada":
      return [rect(x - 5 * s, y - 20 * s, 10 * s, 130 * s, pal.paper[4], 3, 2), circ(x, y - 50 * s, 30 * s, pal.gold, 2.6), circ(x, y - 50 * s, 14 * s, pal.accent2, 2), path(`M${f1(x - 5 * s)},${f1(y - 82 * s)}L${f1(x)},${f1(y - 110 * s)}L${f1(x + 5 * s)},${f1(y - 82 * s)}Z`, pal.gold, 2)];
    case "chakra": {
      const spokes = Array.from({length: 12}, (_, i) => { const a = i / 12 * Math.PI * 2 + t * 4; return `<path d="M${f1(x + Math.cos(a - .12) * 30 * s)},${f1(y - 60 * s + Math.sin(a - .12) * 30 * s)}L${f1(x + Math.cos(a) * 46 * s)},${f1(y - 60 * s + Math.sin(a) * 46 * s)}L${f1(x + Math.cos(a + .12) * 30 * s)},${f1(y - 60 * s + Math.sin(a + .12) * 30 * s)}Z" fill="${pal.gold}"/>`; }).join("");
      return [spokes, circ(x, y - 60 * s, 32 * s, pal.gold, 2.6), circ(x, y - 60 * s, 18 * s, pal.accent2, 2), circ(x, y - 60 * s, 6 * s, pal.cream, 1.4)];
    }
    case "flute":
      return [path(`M${f1(x - 64 * s)},${f1(y - 6 * s)}L${f1(x + 70 * s)},${f1(y - 22 * s)}L${f1(x + 71 * s)},${f1(y - 14 * s)}L${f1(x - 63 * s)},${f1(y + 2 * s)}Z`, pal.gold, 2), dot(x - 20 * s, y - 6 * s, 2.4 * s, pal.ink), dot(x + 4 * s, y - 9 * s, 2.4 * s, pal.ink), dot(x + 28 * s, y - 12 * s, 2.4 * s, pal.ink)];
    case "sword":
      return [path(`M${f1(x - 6 * s)},${f1(y)}L${f1(x - 5 * s)},${f1(y - 150 * s)}L${f1(x)},${f1(y - 170 * s)}L${f1(x + 5 * s)},${f1(y - 150 * s)}L${f1(x + 6 * s)},${f1(y)}Z`, "#dfe3e6", 2.2), rect(x - 22 * s, y - 2 * s, 44 * s, 10 * s, pal.gold, 3, 2), rect(x - 5 * s, y + 6 * s, 10 * s, 34 * s, pal.accent, 2, 2)];
    case "flower":
      return lotus(x, y + 4 * s, 60 * s, pal);
    case "conch":
      return [path(`M${f1(x - 30 * s)},${f1(y)}Q${f1(x - 34 * s)},${f1(y - 44 * s)} ${f1(x)},${f1(y - 48 * s)}Q${f1(x + 36 * s)},${f1(y - 44 * s)} ${f1(x + 30 * s)},${f1(y)}Q${f1(x + 10 * s)},${f1(y + 18 * s)} ${f1(x - 30 * s)},${f1(y)}Z`, pal.cream, 2.4), path(`M${f1(x - 14 * s)},${f1(y - 4 * s)}Q${f1(x - 10 * s)},${f1(y - 30 * s)} ${f1(x + 12 * s)},${f1(y - 34 * s)}`, pal.paper[3], 1.6), poly([[x - 6 * s, y - 48 * s], [x, y - 64 * s], [x + 6 * s, y - 48 * s]], pal.cream, 2)];
    case "diya":
      return [path(`M${f1(x - 34 * s)},${f1(y)}Q${f1(x)},${f1(y + 30 * s)} ${f1(x + 34 * s)},${f1(y)}Q${f1(x)},${f1(y + 6 * s)} ${f1(x - 34 * s)},${f1(y)}Z`, pal.accent, 2.4), ...flame(x, y - 4 * s, 0.9 * s, t, pal)];
    case "kamandal":
      return [path(`M${f1(x - 22 * s)},${f1(y)}Q${f1(x - 30 * s)},${f1(y - 34 * s)} ${f1(x - 8 * s)},${f1(y - 46 * s)}L${f1(x - 8 * s)},${f1(y - 62 * s)}L${f1(x + 8 * s)},${f1(y - 62 * s)}L${f1(x + 8 * s)},${f1(y - 46 * s)}Q${f1(x + 30 * s)},${f1(y - 34 * s)} ${f1(x + 22 * s)},${f1(y)}Z`, pal.gold, 2.4)];
    case "shield":
      return [path(`M${f1(x - 40 * s)},${f1(y - 50 * s)}Q${f1(x)},${f1(y - 70 * s)} ${f1(x + 40 * s)},${f1(y - 50 * s)}Q${f1(x + 40 * s)},${f1(y + 30 * s)} ${f1(x)},${f1(y + 56 * s)}Q${f1(x - 40 * s)},${f1(y + 30 * s)} ${f1(x - 40 * s)},${f1(y - 50 * s)}Z`, pal.accent, 2.6), circ(x, y - 6 * s, 16 * s, pal.gold, 2.2)];
    default:
      return [];
  }
};

export type Crown = "mukut" | "jata" | "pagdi" | "veil" | "ganesha" | "none" | "queen" | "feather";
export type ArmPose = "namaste" | "bless" | "hold" | "up" | "wide" | "rest";
export type FigOpt = {
  cx: number; base: number; s: number; pose: "stand" | "sit"; skin: string; cloth: string; cloth2: string;
  crown?: Crown; arms?: ArmPose; beard?: boolean; moustache?: boolean; sash?: string; flip?: boolean; eyes?: "open" | "closed";
  right?: Attr; left?: Attr; t?: number;
};

const crownShapes = (c: Crown, x: number, y: number, s: number, pal: Pal, t: number): Item[] => {
  switch (c) {
    case "mukut":
      return [path(`M${f1(x - 36 * s)},${f1(y)}L${f1(x - 30 * s)},${f1(y - 34 * s)}L${f1(x - 14 * s)},${f1(y - 18 * s)}L${f1(x)},${f1(y - 50 * s)}L${f1(x + 14 * s)},${f1(y - 18 * s)}L${f1(x + 30 * s)},${f1(y - 34 * s)}L${f1(x + 36 * s)},${f1(y)}Z`, pal.gold, 2.4), circ(x, y - 22 * s, 6 * s, pal.accent, 1.6)];
    case "feather": {
      const sway = sw(t, 0.8, 4 * s);
      return [...crownShapes("mukut", x, y, s, pal, t), path(`M${f1(x + 6 * s)},${f1(y - 40 * s)}Q${f1(x + 14 * s + sway)},${f1(y - 76 * s)} ${f1(x + 4 * s + sway)},${f1(y - 100 * s)}Q${f1(x + 34 * s)},${f1(y - 70 * s)} ${f1(x + 12 * s)},${f1(y - 38 * s)}Z`, "#2fa59a", 2), circ(x + 8 * s + sway * 0.6, y - 80 * s, 6 * s, pal.gold, 1.4)];
    }
    case "jata":
      return [path(`M${f1(x - 34 * s)},${f1(y + 4 * s)}Q${f1(x - 40 * s)},${f1(y - 40 * s)} ${f1(x - 10 * s)},${f1(y - 58 * s)}Q${f1(x)},${f1(y - 78 * s)} ${f1(x + 12 * s)},${f1(y - 58 * s)}Q${f1(x + 40 * s)},${f1(y - 40 * s)} ${f1(x + 34 * s)},${f1(y + 4 * s)}Z`, pal.ink, 2.4), path(`M${f1(x - 10 * s)},${f1(y - 52 * s)}A${f1(20 * s)},${f1(20 * s)} 0 1,0 ${f1(x + 10 * s)},${f1(y - 74 * s)}A${f1(14 * s)},${f1(14 * s)} 0 1,1 ${f1(x - 10 * s)},${f1(y - 52 * s)}Z`, pal.cream, 1.8)];
    case "pagdi":
      return [path(`M${f1(x - 38 * s)},${f1(y + 2 * s)}Q${f1(x - 40 * s)},${f1(y - 40 * s)} ${f1(x)},${f1(y - 46 * s)}Q${f1(x + 40 * s)},${f1(y - 40 * s)} ${f1(x + 38 * s)},${f1(y + 2 * s)}Z`, pal.accent, 2.4), path(`M${f1(x - 38 * s)},${f1(y - 8 * s)}Q${f1(x)},${f1(y - 26 * s)} ${f1(x + 38 * s)},${f1(y - 8 * s)}L${f1(x + 38 * s)},${f1(y)}Q${f1(x)},${f1(y - 16 * s)} ${f1(x - 38 * s)},${f1(y)}Z`, pal.gold, 1.8), path(`M${f1(x + 10 * s)},${f1(y - 44 * s)}Q${f1(x + 28 * s)},${f1(y - 70 * s)} ${f1(x + 14 * s)},${f1(y - 82 * s)}Q${f1(x + 22 * s)},${f1(y - 60 * s)} ${f1(x + 4 * s)},${f1(y - 44 * s)}Z`, pal.accent2, 1.6)];
    case "veil":
      return [path(`M${f1(x - 44 * s)},${f1(y + 70 * s)}Q${f1(x - 52 * s)},${f1(y - 30 * s)} ${f1(x)},${f1(y - 46 * s)}Q${f1(x + 52 * s)},${f1(y - 30 * s)} ${f1(x + 44 * s)},${f1(y + 70 * s)}Q${f1(x + 30 * s)},${f1(y + 20 * s)} ${f1(x)},${f1(y + 6 * s)}Q${f1(x - 30 * s)},${f1(y + 20 * s)} ${f1(x - 44 * s)},${f1(y + 70 * s)}Z`, pal.accent, 2.4)];
    case "queen":
      return [...crownShapes("mukut", x, y - 2 * s, s * 0.9, pal, t), path(`M${f1(x - 40 * s)},${f1(y + 60 * s)}Q${f1(x - 46 * s)},${f1(y - 10 * s)} ${f1(x - 30 * s)},${f1(y - 12 * s)}L${f1(x - 30 * s)},${f1(y + 60 * s)}Z`, pal.ink, 2)];
    case "ganesha":
      return [path(`M${f1(x - 38 * s)},${f1(y + 4 * s)}L${f1(x - 26 * s)},${f1(y - 32 * s)}L${f1(x - 10 * s)},${f1(y - 14 * s)}L${f1(x)},${f1(y - 44 * s)}L${f1(x + 10 * s)},${f1(y - 14 * s)}L${f1(x + 26 * s)},${f1(y - 32 * s)}L${f1(x + 38 * s)},${f1(y + 4 * s)}Z`, pal.gold, 2.4)];
    default:
      return [];
  }
};

/** a generic flat paper puppet: all gods / rishis / warriors are built on this */
export const figure = (o: FigOpt, pal: Pal): Item[] => {
  const s = o.s, cx = o.cx, b = o.base, t = o.t ?? 0;
  const out: Item[] = [];
  const dir = o.flip ? -1 : 1;
  const sit = o.pose === "sit";
  const headY = sit ? b - 262 * s : b - 342 * s;
  const shY = sit ? b - 214 * s : b - 296 * s;
  const waist = sit ? b - 70 * s : b - 160 * s;
  // lower body
  if (sit) {
    out.push(ell(cx, b - 28 * s, 132 * s, 34 * s, o.cloth2, 3));
    out.push(ell(cx - 70 * s, b - 22 * s, 38 * s, 16 * s, o.skin, 2.4), ell(cx + 70 * s, b - 22 * s, 38 * s, 16 * s, o.skin, 2.4));
  } else {
    out.push(poly([[cx - 46 * s, waist], [cx + 46 * s, waist], [cx + 60 * s, b], [cx - 60 * s, b]], o.cloth2, 3));
    out.push(path(`M${f1(cx - 58 * s)},${f1(b - 18 * s)}L${f1(cx + 58 * s)},${f1(b - 18 * s)}L${f1(cx + 60 * s)},${f1(b)}L${f1(cx - 60 * s)},${f1(b)}Z`, pal.gold, 2));
    out.push(rect(cx - 2 * s, waist + 20 * s, 4 * s, b - waist - 40 * s, pal.cream, 1, 1.2));
  }
  // arms behind torso for 'wide'
  const shL: [number, number] = [cx - 50 * s, shY + 10 * s], shR: [number, number] = [cx + 50 * s, shY + 10 * s];
  const ap = o.arms || "rest";
  const hand = (px: number, py: number) => circ(px, py, 11 * s, o.skin, 2.4);
  const arms: Item[] = [];
  let hL: [number, number] = [shL[0] - 18 * s, shY + 130 * s], hR: [number, number] = [shR[0] + 18 * s, shY + 130 * s];
  if (ap === "namaste") { hL = [cx - 8 * s, shY + 70 * s]; hR = [cx + 8 * s, shY + 70 * s]; }
  if (ap === "bless") { hR = [shR[0] + 44 * s, shY + 40 * s]; hL = [shL[0] - 12 * s, shY + 120 * s]; }
  if (ap === "hold") { hL = [shL[0] - 56 * s, shY + 80 * s]; hR = [shR[0] + 56 * s, shY + 80 * s]; }
  if (ap === "up") { hR = [shR[0] + 40 * s, shY - 90 * s]; hL = [shL[0] - 14 * s, shY + 120 * s]; }
  if (ap === "wide") { hL = [shL[0] - 96 * s, shY + 40 * s]; hR = [shR[0] + 96 * s, shY + 40 * s]; }
  if (sit && ap === "rest") { hL = [cx - 60 * s, b - 66 * s]; hR = [cx + 60 * s, b - 66 * s]; }
  arms.push(...limb(shL[0], shL[1], hL[0], hL[1], 20 * s, o.skin, pal.cream, -10 * s));
  arms.push(...limb(shR[0], shR[1], hR[0], hR[1], 20 * s, o.skin, pal.cream, 10 * s));
  out.push(...arms);
  // torso
  out.push(poly([[cx - 54 * s, shY - 4 * s], [cx + 54 * s, shY - 4 * s], [cx + 42 * s, waist + 6 * s], [cx - 42 * s, waist + 6 * s]], o.cloth, 3));
  if (o.sash) out.push(path(`M${f1(cx - 54 * s)},${f1(shY - 4 * s)}L${f1(cx - 30 * s)},${f1(shY - 4 * s)}L${f1(cx + 46 * s)},${f1(waist)}L${f1(cx + 26 * s)},${f1(waist + 6 * s)}Z`, o.sash, 2));
  out.push(rect(cx - 44 * s, waist - 4 * s, 88 * s, 14 * s, pal.gold, 3, 2));
  // neck + head
  out.push(rect(cx - 12 * s, headY + 20 * s, 24 * s, shY - headY - 14 * s, o.skin, 2, 2));
  out.push(circ(cx, headY, 36 * s, o.skin, 3));
  // face
  const closed = o.eyes === "closed";
  for (const ex of [-13, 13]) out.push(closed ? stroke(`M${f1(cx + ex * s - 7 * s)},${f1(headY - 4 * s)}Q${f1(cx + ex * s)},${f1(headY + 3 * s)} ${f1(cx + ex * s + 7 * s)},${f1(headY - 4 * s)}`, pal.ink, 2.6) : dot(cx + ex * s, headY - 3 * s, 3.4 * s, pal.ink));
  out.push(stroke(`M${f1(cx - 7 * s)},${f1(headY + 15 * s)}Q${f1(cx)},${f1(headY + 21 * s)} ${f1(cx + 7 * s)},${f1(headY + 15 * s)}`, pal.ink, 2.2));
  out.push(path(`M${f1(cx)},${f1(headY - 20 * s)}l${f1(-3 * s)},${f1(10 * s)}h${f1(6 * s)}Z`, pal.accent, 0.1));
  if (o.moustache) out.push(path(`M${f1(cx - 22 * s)},${f1(headY + 10 * s)}Q${f1(cx)},${f1(headY + 2 * s)} ${f1(cx + 22 * s)},${f1(headY + 10 * s)}Q${f1(cx)},${f1(headY + 16 * s)} ${f1(cx - 22 * s)},${f1(headY + 10 * s)}Z`, pal.ink, 1.2));
  if (o.beard) out.push(path(`M${f1(cx - 32 * s)},${f1(headY + 8 * s)}Q${f1(cx - 30 * s)},${f1(headY + 70 * s)} ${f1(cx)},${f1(headY + 84 * s)}Q${f1(cx + 30 * s)},${f1(headY + 70 * s)} ${f1(cx + 32 * s)},${f1(headY + 8 * s)}Q${f1(cx)},${f1(headY + 34 * s)} ${f1(cx - 32 * s)},${f1(headY + 8 * s)}Z`, pal.cream, 2.4));
  if (o.crown === "ganesha") {
    out.push(path(`M${f1(cx - 4 * s)},${f1(headY + 6 * s)}Q${f1(cx - 14 * s)},${f1(headY + 60 * s)} ${f1(cx + 8 * s)},${f1(headY + 80 * s)}Q${f1(cx + 28 * s)},${f1(headY + 84 * s)} ${f1(cx + 26 * s)},${f1(headY + 62 * s)}Q${f1(cx + 12 * s)},${f1(headY + 68 * s)} ${f1(cx + 12 * s)},${f1(headY + 40 * s)}Q${f1(cx + 14 * s)},${f1(headY + 16 * s)} ${f1(cx + 6 * s)},${f1(headY + 6 * s)}Z`, o.skin, 2.6));
    out.push(ell(cx - 52 * s, headY + 8 * s, 24 * s, 34 * s, o.skin, 2.6), ell(cx + 52 * s, headY + 8 * s, 24 * s, 34 * s, o.skin, 2.6));
    out.push(poly([[cx - 18 * s, headY + 34 * s], [cx - 26 * s, headY + 62 * s], [cx - 8 * s, headY + 40 * s]], pal.cream, 1.6));
  }
  if (o.crown) out.push(...crownShapes(o.crown, cx, headY - 28 * s, s, pal, t));
  // attributes in hands
  if (o.right && o.right !== "none") out.push(...attr(o.right, hR[0], hR[1], s, pal, t));
  if (o.left && o.left !== "none") out.push(...attr(o.left, hL[0], hL[1], s, pal, t));
  out.push(hand(hL[0], hL[1]), hand(hR[0], hR[1]));
  return out;
};
