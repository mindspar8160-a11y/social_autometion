/**
 * MINDSPARK paper-cut SVG kit: helpers.
 * Every asset is a PURE function (ctx) -> svg markup string drawn in a 600 x 500 box.
 * Pure strings = frame-safe in Remotion, recolourable by palette (every look recolours all assets),
 * and testable in plain node (no React needed).
 */
export type Pal = {
  paper: string[];   // 5 paper tones (light -> dark)
  cream: string;     // cut-edge colour
  ink: string;
  shadow: string;
  accent: string;    // main accent (look dependent)
  accent2: string;
  gold: string;
  sky: string;
  skin: string[];    // 3 skin tones
  cloth: string[];   // 4 cloth colours
  leaf: string[];    // 3 greens / foliage
};

export type KitCtx = {
  t: number;      // seconds since the scene started (for sway / flicker)
  p: number;      // entrance progress 0..1
  seed: number;   // per scene seed (variants)
  pal: Pal;
};

export type Shape = {d: string; fill?: string; stroke?: string; sw?: number; noShadow?: boolean; op?: number};
export type Item = Shape | string;

export const f1 = (n: number) => (Math.round(n * 10) / 10).toString();
export const rnd = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
/** sine wobble helper: sw(t, hz, amp, phase) */
export const sw = (t: number, hz: number, amp: number, ph = 0) => Math.sin(t * hz * Math.PI * 2 + ph) * amp;

/* ---------- shape builders (all return Shape with a path `d`, so every shape gets a paper shadow) */
export const path = (d: string, fill: string, sw_ = 3.2): Shape => ({d, fill, sw: sw_});
export const circ = (cx: number, cy: number, r: number, fill: string, sw_ = 3.2): Shape =>
  path(`M${f1(cx - r)},${f1(cy)}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0Z`, fill, sw_);
export const ell = (cx: number, cy: number, rx: number, ry: number, fill: string, sw_ = 3.2): Shape =>
  path(`M${f1(cx - rx)},${f1(cy)}a${f1(rx)},${f1(ry)} 0 1,0 ${f1(2 * rx)},0a${f1(rx)},${f1(ry)} 0 1,0 ${f1(-2 * rx)},0Z`, fill, sw_);
export const rect = (x: number, y: number, w: number, h: number, fill: string, r = 0, sw_ = 3.2): Shape => {
  if (!r) return path(`M${f1(x)},${f1(y)}h${f1(w)}v${f1(h)}h${f1(-w)}Z`, fill, sw_);
  return path(`M${f1(x + r)},${f1(y)}h${f1(w - 2 * r)}q${r},0 ${r},${r}v${f1(h - 2 * r)}q0,${r} ${-r},${r}h${f1(-(w - 2 * r))}q${-r},0 ${-r},${-r}v${f1(-(h - 2 * r))}q0,${-r} ${r},${-r}Z`, fill, sw_);
};
export const poly = (pts: [number, number][], fill: string, sw_ = 3.2): Shape =>
  path("M" + pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join("L") + "Z", fill, sw_);
/** thick round-capped limb / stick with a cream edge (drawn as two strokes) */
export const limb = (x1: number, y1: number, x2: number, y2: number, w: number, color: string, cream: string, bend = 0): Shape[] => {
  const mx = (x1 + x2) / 2 + bend, my = (y1 + y2) / 2;
  const d = `M${f1(x1)},${f1(y1)}Q${f1(mx)},${f1(my)} ${f1(x2)},${f1(y2)}`;
  return [{d, stroke: cream, sw: w + 7}, {d, stroke: color, sw: w, noShadow: true}];
};
/** raw (no shadow) helpers */
export const ln = (x1: number, y1: number, x2: number, y2: number, color: string, w = 3, cap = "round") =>
  `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${color}" stroke-width="${w}" stroke-linecap="${cap}"/>`;
export const dot = (cx: number, cy: number, r: number, fill: string) => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${fill}"/>`;
export const stroke = (d: string, color: string, w = 3, extra = "") => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
export const g = (tf: string, inner: string, op?: number) => `<g transform="${tf}"${op !== undefined ? ` opacity="${op}"` : ""}>${inner}</g>`;

const elem = (s: Shape, cream: string) => {
  if (s.stroke) return `<path d="${s.d}" fill="none" stroke="${s.stroke}" stroke-width="${s.sw ?? 3}" stroke-linecap="round" stroke-linejoin="round"${s.op !== undefined ? ` opacity="${s.op}"` : ""}/>`;
  return `<path d="${s.d}" fill="${s.fill}" stroke="${cream}" stroke-width="${s.sw ?? 3.2}" stroke-linejoin="round"${s.op !== undefined ? ` opacity="${s.op}"` : ""}/>`;
};
/** the paper-cut look: one soft shadow layer behind everything, then every piece with a cream cut edge */
export const paper = (pal: Pal, ...items: (Item | Item[])[]): string => {
  const flat: Item[] = ([] as Item[]).concat(...items.map((i) => (Array.isArray(i) ? i : [i])));
  const shapes = flat.filter((i): i is Shape => typeof i !== "string");
  const sh = shapes.filter((s) => !s.noShadow).map((s) =>
    s.stroke ? `<path d="${s.d}" fill="none" stroke="${pal.shadow}" stroke-width="${s.sw ?? 3}" stroke-linecap="round"/>` : `<path d="${s.d}" fill="${pal.shadow}"/>`).join("");
  const body = flat.map((i) => (typeof i === "string" ? i : elem(i, pal.cream))).join("");
  return `<g transform="translate(8 11)" opacity=".5">${sh}</g>${body}`;
};

/* ---------- reusable composite parts */
export const flame = (x: number, y: number, s: number, t: number, pal: Pal, k = 0): Item[] => {
  const fl = sw(t, 3.1, 0.07, k) + sw(t, 7.3, 0.04, k * 2);
  const sx = 1 + fl, sy = 1 - fl * 0.6, lean = sw(t, 1.7, 4 * s, k);
  const d = `M${f1(x)},${f1(y + 10 * s)}C${f1(x - 22 * s)},${f1(y - 4 * s)} ${f1(x - 10 * s + lean)},${f1(y - 36 * s)} ${f1(x + lean)},${f1(y - 58 * s * sy)}C${f1(x + 12 * s + lean)},${f1(y - 34 * s)} ${f1(x + 22 * s)},${f1(y - 4 * s)} ${f1(x)},${f1(y + 10 * s)}Z`;
  const d2 = `M${f1(x)},${f1(y + 6 * s)}C${f1(x - 11 * s)},${f1(y - 2 * s)} ${f1(x - 5 * s)},${f1(y - 18 * s)} ${f1(x + lean * 0.5)},${f1(y - 28 * s * sx)}C${f1(x + 7 * s)},${f1(y - 16 * s)} ${f1(x + 11 * s)},${f1(y - 2 * s)} ${f1(x)},${f1(y + 6 * s)}Z`;
  return [path(d, pal.accent2, 2.4 * s), path(d2, "#ffe9a8", 1.5 * s)];
};
export const halo = (cx: number, cy: number, r: number, pal: Pal, t = 0, rays = 16): Item[] => {
  const out: Item[] = [];
  let ray = "";
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + t * 0.35;
    const r1 = r * 0.92, r2 = r * (1.2 + 0.06 * Math.sin(t * 3 + i));
    ray += `<path d="M${f1(cx + Math.cos(a - 0.07) * r1)},${f1(cy + Math.sin(a - 0.07) * r1)}L${f1(cx + Math.cos(a) * r2)},${f1(cy + Math.sin(a) * r2)}L${f1(cx + Math.cos(a + 0.07) * r1)},${f1(cy + Math.sin(a + 0.07) * r1)}Z" fill="${pal.gold}" opacity=".85"/>`;
  }
  out.push(ray);
  out.push(circ(cx, cy, r, pal.gold, 3.5));
  out.push(circ(cx, cy, r * 0.8, pal.paper[2], 2.5));
  return out;
};
export const lotus = (cx: number, y: number, w: number, pal: Pal, col?: string): Item[] => {
  const c = col || pal.accent;
  const out: Item[] = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const k = (i - (n - 1) / 2) / ((n - 1) / 2);
    const x = cx + k * w * 0.46, hgt = w * (0.34 - Math.abs(k) * 0.12), tilt = k * w * 0.2;
    out.push(path(`M${f1(x)},${f1(y)}C${f1(x - w * 0.1 + tilt * 0.3)},${f1(y - hgt * 0.5)} ${f1(x + tilt * 0.6)},${f1(y - hgt * 0.8)} ${f1(x + tilt)},${f1(y - hgt)}C${f1(x + w * 0.1 + tilt * 0.6)},${f1(y - hgt * 0.7)} ${f1(x + w * 0.1)},${f1(y - hgt * 0.4)} ${f1(x)},${f1(y)}Z`, i % 2 ? c : pal.paper[0], 2.6));
  }
  out.push(path(`M${f1(cx - w / 2)},${f1(y)}Q${f1(cx)},${f1(y + w * 0.14)} ${f1(cx + w / 2)},${f1(y)}Q${f1(cx)},${f1(y - w * 0.07)} ${f1(cx - w / 2)},${f1(y)}Z`, pal.leaf[0], 2.6));
  return out;
};
export const cloud = (x: number, y: number, s: number, fill: string): Item[] => [
  ell(x, y, 74 * s, 22 * s, fill, 2.4),
  circ(x - 34 * s, y - 14 * s, 26 * s, fill, 2.4),
  circ(x + 6 * s, y - 28 * s, 34 * s, fill, 2.4),
  circ(x + 44 * s, y - 12 * s, 24 * s, fill, 2.4),
  ell(x, y + 4 * s, 70 * s, 16 * s, fill, 0.1),
];
export const tree = (x: number, y: number, s: number, pal: Pal, kind: "round" | "pine" | "palm" | "banyan" = "round", k = 0): Item[] => {
  const o: Item[] = [];
  if (kind === "pine") {
    o.push(rect(x - 7 * s, y - 40 * s, 14 * s, 40 * s, pal.cloth[3] || "#6b4a2a", 0, 2.4));
    for (let i = 0; i < 4; i++) o.push(poly([[x - (62 - i * 12) * s, y - (30 + i * 46) * s], [x + (62 - i * 12) * s, y - (30 + i * 46) * s], [x, y - (92 + i * 46) * s]], pal.leaf[i % 3], 2.6));
  } else if (kind === "palm") {
    o.push(path(`M${f1(x - 8 * s)},${f1(y)}Q${f1(x + 22 * s)},${f1(y - 90 * s)} ${f1(x + 6 * s)},${f1(y - 170 * s)}L${f1(x + 18 * s)},${f1(y - 170 * s)}Q${f1(x + 40 * s)},${f1(y - 90 * s)} ${f1(x + 10 * s)},${f1(y)}Z`, pal.cloth[3] || "#6b4a2a", 2.4));
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI + (i / 5) * Math.PI, lx = x + 12 * s + Math.cos(a) * 92 * s, ly = y - 170 * s + Math.sin(a) * 44 * s + 26 * s;
      o.push(path(`M${f1(x + 12 * s)},${f1(y - 170 * s)}Q${f1((x + 12 * s + lx) / 2)},${f1(y - 214 * s)} ${f1(lx)},${f1(ly)}Q${f1((x + 12 * s + lx) / 2)},${f1(y - 186 * s)} ${f1(x + 12 * s)},${f1(y - 164 * s)}Z`, pal.leaf[i % 3], 2.2));
    }
  } else if (kind === "banyan") {
    o.push(path(`M${f1(x - 30 * s)},${f1(y)}Q${f1(x - 10 * s)},${f1(y - 70 * s)} ${f1(x - 18 * s)},${f1(y - 140 * s)}L${f1(x + 18 * s)},${f1(y - 140 * s)}Q${f1(x + 10 * s)},${f1(y - 70 * s)} ${f1(x + 30 * s)},${f1(y)}Z`, pal.cloth[3] || "#6b4a2a", 2.4));
    o.push(ell(x, y - 190 * s, 120 * s, 62 * s, pal.leaf[1], 2.8), ell(x - 70 * s, y - 160 * s, 66 * s, 42 * s, pal.leaf[0], 2.6), ell(x + 74 * s, y - 164 * s, 62 * s, 40 * s, pal.leaf[2], 2.6));
    for (const dx of [-80, -46, 52, 90]) o.push(rect(x + dx * s - 3 * s, y - 150 * s, 6 * s, 150 * s, pal.cloth[3] || "#6b4a2a", 2, 1.6));
  } else {
    o.push(rect(x - 8 * s, y - 70 * s, 16 * s, 70 * s, pal.cloth[3] || "#6b4a2a", 0, 2.4));
    o.push(circ(x, y - 100 * s, 54 * s, pal.leaf[k % 3], 2.8), circ(x - 38 * s, y - 78 * s, 34 * s, pal.leaf[(k + 1) % 3], 2.6), circ(x + 38 * s, y - 80 * s, 36 * s, pal.leaf[(k + 2) % 3], 2.6));
  }
  return o;
};
export const mountains = (pal: Pal, y: number, seed: number, snow = true, x0 = 0, x1 = 600, hmax = 190): Item[] => {
  const r = rnd(seed);
  const o: Item[] = [];
  const n = 4;
  for (let i = 0; i < n; i++) {
    const cx = x0 + ((i + 0.5) / n) * (x1 - x0) + (r() - 0.5) * 40, hh = hmax * (0.55 + r() * 0.45), ww = (x1 - x0) / n * (0.95 + r() * 0.5);
    o.push(poly([[cx - ww, y], [cx, y - hh], [cx + ww, y]], pal.paper[(i + 2) % 5], 2.8));
    if (snow) o.push(poly([[cx - ww * 0.26, y - hh * 0.74], [cx, y - hh], [cx + ww * 0.26, y - hh * 0.74], [cx + ww * 0.1, y - hh * 0.8], [cx, y - hh * 0.7], [cx - ww * 0.1, y - hh * 0.8]], pal.cream, 2));
  }
  return o;
};
export const ground = (pal: Pal, y: number, w = 600, col?: string): Item[] => [
  path(`M-10,${y}Q${w * 0.25},${y - 22} ${w * 0.5},${y - 8}T${w + 10},${y - 10}V${y + 60}H-10Z`, col || pal.paper[3], 3),
];
export const stars = (n: number, seed: number, w = 600, h = 300, t = 0, col = "#fff4c8") => {
  const r = rnd(seed);
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rr = 1.6 + r() * 2.6, tw = 0.6 + 0.4 * Math.sin(t * 2.4 + i * 1.7);
    s += `<path d="M${f1(x)},${f1(y - rr * 2)}L${f1(x + rr * 0.6)},${f1(y - rr * 0.6)}L${f1(x + rr * 2)},${f1(y)}L${f1(x + rr * 0.6)},${f1(y + rr * 0.6)}L${f1(x)},${f1(y + rr * 2)}L${f1(x - rr * 0.6)},${f1(y + rr * 0.6)}L${f1(x - rr * 2)},${f1(y)}L${f1(x - rr * 0.6)},${f1(y - rr * 0.6)}Z" fill="${col}" opacity="${f1(tw)}"/>`;
  }
  return s;
};
