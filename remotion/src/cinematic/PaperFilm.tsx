import React, {useMemo, useState, useEffect, createContext, useContext} from "react";
import {AbsoluteFill, Audio, Easing, Img, Sequence, delayRender, continueRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {PFAccent, PFProps, PFScene} from "./types";
import {MapItem, mapTimes} from "./MapItem";
import {
  PaperTempleCutout, PaperCityCutout, PaperCharDhamCutout, PaperDwarkadhishCutout,
  PaperArmyCutout, PaperCowsCutout, PaperWeaponsCutout, PaperVachanCutout,
  PaperShivaLingamCutout, PaperTrishulCutout, PaperChariotCutout, PaperMountainCaveCutout, PaperSudarshanCutout
} from "./PaperSvgAssets";
import {Look, LOOKS, pickLook, SheetKind} from "./kit/looks";
import {planArt, renderArt, ArtPlan} from "./kit/compose";

/* ------------------------------------------------------------------ fonts */
const FONTS: [string, string, string][] = [
  ["PF Display", "RozhaOne-Regular.ttf", "400"],
  ["PF Hand", "YatraOne-Regular.ttf", "400"],
  ["PF Bold", "Mukta-ExtraBold.ttf", "800"],
  ["PF Body", "Mukta-Medium.ttf", "500"],
];
const DISPLAY = "'PF Display','Mukta',serif";
const HAND = "'PF Hand','Mukta',serif";
const BOLD = "'PF Bold','Mukta',sans-serif";
const BODY = "'PF Body','Mukta',sans-serif";
const FONT_OF = {display: DISPLAY, hand: HAND, bold: BOLD};

const useFonts = () => {
  const [h] = useState(() => delayRender("paperfilm-fonts"));
  useEffect(() => {
    Promise.all(FONTS.map(async ([name, file, weight]) => {
      const ff = new FontFace(name, `url(${staticFile("fonts/" + file)})`, {weight});
      await ff.load();
      document.fonts.add(ff);
    })).catch(() => undefined).finally(() => continueRender(h));
  }, [h]);
};

/* ----------------------------------------------- the LOOK of this video (board, sheets, camera, captions) */
const LookCtx = createContext<Look>(LOOKS[0]);
const useLook = () => useContext(LookCtx);
const ACCENT_CYCLE: PFAccent[] = ["red", "teal", "mustard", "ink"];
const accIdx = (a: PFAccent | undefined, i: number) => (a ? ACCENT_CYCLE.indexOf(a) : i) ;
const accOf = (look: Look, a: PFAccent | undefined, i: number) => look.accents[Math.max(0, accIdx(a, i)) % look.accents.length];
const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  if (h.length < 6) return true;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
};

/* ---------------------------------------------------------------- helpers */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeIO = Easing.bezier(0.65, 0, 0.25, 1);
const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** torn / scissor-cut outline: a rectangle whose edges wobble a little */
const jagged = (w: number, h: number, seed: number, amp = 7, step = 44) => {
  const r = rng(seed);
  const pts: string[] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(2, Math.round(len / step));
    for (let i = 0; i < n; i++) {
      const t = i / n, o = (r() - 0.5) * 2 * amp;
      pts.push(`${(lerp(x0, x1, t) + nx * o).toFixed(1)},${(lerp(y0, y1, t) + ny * o).toFixed(1)}`);
    }
  };
  edge(0, 0, w, 0, 0, 1); edge(w, 0, w, h, 1, 0); edge(w, h, 0, h, 0, 1); edge(0, h, 0, 0, 1, 0);
  return "M" + pts.join("L") + "Z";
};

/** outline of every sheet shape the looks use (archway, ticket, scroll, rounded card, polaroid, torn paper) */
const sheetPath = (kind: SheetKind, w: number, h: number, seed: number, layer: number): string => {
  const wob = (layer + 1) * 3;
  switch (kind) {
    case "rounded": {
      const r = 84;
      return `M${r},0H${w - r}Q${w},0 ${w},${r}V${h - r}Q${w},${h} ${w - r},${h}H${r}Q0,${h} 0,${h - r}V${r}Q0,0 ${r},0Z`;
    }
    case "arch": {
      const R = w / 2;
      return `M0,${h}V${R}A${R},${R} 0 0 1 ${w},${R}V${h}Z`;
    }
    case "ticket": {
      const c = 30, m = 34, hh = h / 2;
      return `M${c},0H${w - c}A${c},${c} 0 0 0 ${w},${c}V${hh - m}A${m},${m} 0 0 0 ${w},${hh + m}V${h - c}A${c},${c} 0 0 0 ${w - c},${h}H${c}A${c},${c} 0 0 0 0,${h - c}V${hh + m}A${m},${m} 0 0 0 0,${hh - m}V${c}A${c},${c} 0 0 0 ${c},0Z`;
    }
    case "scroll":
      return `M0,34Q${w * 0.25},${-6 + wob} ${w * 0.5},34T${w},34V${h - 34}Q${w * 0.75},${h + 6 - wob} ${w * 0.5},${h - 34}T0,${h - 34}Z`;
    case "polaroid":
      return `M14,0H${w - 14}Q${w},0 ${w},14V${h - 14}Q${w},${h} ${w - 14},${h}H14Q0,${h} 0,${h - 14}V14Q0,0 14,0Z`;
    default:
      return jagged(w, h, seed + layer, layer === 2 ? 5 : 9, layer === 2 ? 60 : 44);
  }
};

/* ------------------------------------------------------ paper sheet layers (5-Layer 3D Physical Parallax) */
const Sheet: React.FC<{w: number; h: number; seed: number; accent: PFAccent; idx: number; tilt?: number; lf?: number; fps?: number; children?: React.ReactNode}> = ({w, h, seed, accent, idx, tilt = 0, lf = 0, fps = 30, children}) => {
  const look = useLook();
  const kind = look.sheet;
  const paths = useMemo(() => [
    sheetPath(kind, w, h, seed, 0),
    sheetPath(kind, w, h, seed, 1),
    sheetPath(kind, w, h, seed, 2),
    sheetPath(kind, w, h, seed, 3),
    sheetPath(kind, w, h, seed, 4),
  ], [kind, w, h, seed]);
  const a = accOf(look, accent, idx);
  const shadowC = look.board.dark ? "rgba(0,0,0,.65)" : "rgba(35,20,8,.42)";

  // Subtle natural paper breathing & parallax motion
  const prog = lf / Math.max(1, fps * 4);
  const paraX = Math.sin(prog * Math.PI) * 5;
  const paraY = Math.cos(prog * Math.PI) * 4;

  const layer = (d: string, color: string, dx: number, dy: number, rot: number, blur: number, op = 1, paraFactor = 1) => (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{
      position: "absolute",
      left: dx + paraX * paraFactor,
      top: dy + paraY * paraFactor,
      overflow: "visible",
      transform: `rotate(${rot}deg)`,
      filter: blur > 0 ? `drop-shadow(0 ${blur}px ${blur * 1.4}px ${shadowC})` : undefined,
      opacity: op,
    }}>
      <path d={d} fill={color} />
    </svg>
  );

  const padTop = kind === "arch" ? 170 : kind === "scroll" ? 92 : kind === "polaroid" ? 70 : 64;
  const padBottom = kind === "scroll" ? 92 : kind === "polaroid" ? 110 : 64;

  return (
    <div style={{position: "relative", width: w, height: h, transform: `rotate(${tilt}deg)`}}>
      {/* Layer 0: Deep Ambient Shadow Layer (Furthest depth, slow parallax) */}
      {layer(paths[0], shadowC, 24, 32, 2.0, 26, 0.45, 0.4)}
      
      {/* Layer 1: Burnt Terracotta / Dark Craft backing layer */}
      {layer(paths[1], a.dark, kind === "polaroid" ? 10 : 18, kind === "polaroid" ? 12 : 22, kind === "polaroid" ? 0.9 : 1.6, 16, 0.95, 0.65)}
      
      {/* Layer 2: Rich Accent Craft / Saffron Trim */}
      {layer(paths[2], a.main, kind === "polaroid" ? -5 : -9, kind === "polaroid" ? 6 : 10, kind === "polaroid" ? -0.7 : -1.2, 10, 0.98, 0.85)}
      
      {/* Layer 3: Warm Antique Gold / Ochre Deckle Edge Spacer */}
      {layer(paths[3], look.pal.paper[1] || "#e3d3ab", 3, -4, 0.5, 4, 0.85, 0.95)}
      
      {/* Layer 4: Front Kraft Paper Sheet (Full tactile paper texture) */}
      {layer(paths[4], look.sheetFill, 0, 0, 0, 4, 1.0, 1.0)}

      {kind === "scroll" && [-14, h - 62].map((y, k) => <div key={k} style={{position: "absolute", left: -26, top: y, width: w + 52, height: 76, borderRadius: 38, background: `linear-gradient(${k ? 0 : 180}deg, ${look.pal.paper[3]}, ${look.pal.paper[0]} 60%, ${look.pal.paper[2]})`, boxShadow: "0 8px 14px rgba(0,0,0,.28)", border: `4px solid ${look.pal.cream}`}} />)}
      {kind === "ticket" && <div style={{position: "absolute", left: 40, right: 40, top: 40, bottom: 40, border: `4px dashed ${a.main}`, opacity: 0.45, borderRadius: 26}} />}
      {kind === "arch" && <div style={{position: "absolute", left: w / 2 - 34, top: 36, width: 68, height: 68, borderRadius: 34, background: a.main, border: `5px solid ${look.pal.gold}`, boxShadow: "0 5px 10px rgba(0,0,0,.3)"}} />}
      {(kind === "torn" || kind === "polaroid" || kind === "rounded") && <Tape rot={tilt > 0 ? 2 : -3} />}

      {/* Layer 5: Foreground Content with Hero Elevation */}
      <div style={{
        position: "absolute",
        inset: 0,
        padding: `${padTop}px 64px ${padBottom}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        color: look.ink,
        transform: `translate(${paraX * 1.15}px, ${paraY * 1.15}px)`,
      }}>
        {children}
      </div>
    </div>
  );
};

const Tape: React.FC<{rot?: number}> = ({rot = -4}) => (
  <div style={{position: "absolute", top: -26, left: "50%", marginLeft: -90, width: 180, height: 56, background: "rgba(240,225,170,.82)", transform: `rotate(${rot}deg)`, boxShadow: "0 3px 6px rgba(0,0,0,.18)"}} />
);

/* ------------------------------------------------------------ effects */
const Highlighter: React.FC<{start: number; f: number; color: string; children: React.ReactNode; style?: React.CSSProperties}> = ({start, f, color, children, style}) => {
  const look = useLook();
  const p = easeIO(clamp((f - start) / 11));
  const v = look.highlight;
  const bar: React.CSSProperties = v === "underline"
    ? {position: "absolute", left: -4, right: -4, bottom: "2%", height: "9%", background: color, transformOrigin: "left center", transform: `scaleX(${p})`, borderRadius: 6}
    : v === "box"
      ? {position: "absolute", left: -16, right: -16, top: "6%", bottom: "2%", background: color, opacity: 0.5, transformOrigin: "center", transform: `scale(${p}, ${0.6 + 0.4 * p})`, borderRadius: 16}
      : {position: "absolute", left: -10, right: -10, bottom: "6%", height: "42%", background: color, opacity: 0.62, transformOrigin: "left center", transform: `scaleX(${p}) skewX(-8deg)`, borderRadius: 6};
  return (
    <span style={{position: "relative", display: "inline-block", ...style}}>
      <span style={bar} />
      <span style={{position: "relative"}}>{children}</span>
    </span>
  );
};

const Stamp: React.FC<{text: string; start: number; f: number; fps: number; solid?: boolean}> = ({text, start, f, fps, solid}) => {
  const look = useLook();
  const col = look.accents[0].main;
  if (f < start) return null;
  const s = spring({frame: f - start, fps, config: {damping: 11, stiffness: 240, mass: 0.7}});
  return (
    <div style={{position: "absolute", right: -30, top: -50, transform: `rotate(-12deg) scale(${lerp(2.6, 1, clamp(s, 0, 1.15))})`, opacity: clamp((f - start) / 3), border: `10px solid ${col}`, color: col, padding: "6px 30px", borderRadius: 14, fontFamily: DISPLAY, fontSize: 96, lineHeight: 1.1, background: solid ? look.sheetFill : look.sheetFill + "e6", mixBlendMode: (solid ? "normal" : "multiply") as "normal" | "multiply"}}>
      {text}
    </div>
  );
};

/* --------------------------------------------------------------- map route text */
const MapRoute: React.FC<{s: PFScene; lf: number; fps: number; text: React.CSSProperties; body: React.CSSProperties; strip?: boolean}> = ({s, lf, fps, text, body, strip}) => {
  const look = useLook();
  const {t1, t2, Z} = mapTimes(s, fps);
  const parts = s.text.split("→").map((x) => x.trim()).filter(Boolean);
  const at = [Math.round((s.words[0]?.s ?? 0.3) * fps), t1 + Math.round(Z * 0.6), t2 + Math.round(Z * 0.6)];
  const show = (k: number) => easeIO(clamp((lf - at[Math.min(k, 2)]) / 9));
  return (
    <div style={{marginTop: strip ? 0 : 22, textAlign: "center", minHeight: strip ? 0 : 150}}>
      <div style={{...text, display: "flex", justifyContent: "center", alignItems: "center", gap: 18, ...(strip ? {background: look.sheetFill, padding: "10px 34px", borderRadius: 10, boxShadow: "0 8px 18px rgba(0,0,0,.45)", transform: "rotate(-1deg)", width: "fit-content", margin: "0 auto"} : {})}}>
        {parts.map((pt, k) => show(k) <= 0 ? null : (
          <React.Fragment key={k}>
            {k > 0 && <span style={{opacity: show(k), fontSize: 44}}>→</span>}
            <span style={{opacity: show(k), display: "inline-block", transform: `translateY(${(1 - show(k)) * 14}px)`}}>{pt}</span>
          </React.Fragment>
        ))}
      </div>
      {s.sub && <div style={{...body, marginTop: strip ? 16 : 6, opacity: (strip ? 1 : 0.75) * show(2), ...(strip ? {color: look.sheetFill, textShadow: "0 3px 10px rgba(0,0,0,.8)"} : {})}}>{s.sub}</div>}
    </div>
  );
};

/* ---------------------------------------- full-screen scenes: map / photo */
export const isFull = (s: PFScene) => s.kind === "map" || (s.kind === "photo" && !!s.image);

const FullScene: React.FC<{s: PFScene; i: number; lf: number; fps: number; width: number; height: number}> = ({s, i, lf, fps, width, height}) => {
  const look = useLook();
  const a = accOf(look, s.accent, i);
  const t = (size: number, font = BOLD) => ({fontFamily: font, fontSize: size, lineHeight: 1.18, color: look.ink} as React.CSSProperties);
  if (s.kind === "map") {
    return (
      <AbsoluteFill>
        <MapItem s={s} lf={lf} fps={fps} accent={a.main} accentDark={a.dark} full w={width} h={height} />
        <div style={{position: "absolute", left: 40, right: 40, top: 150}}>
          <MapRoute s={s} lf={lf} fps={fps} text={t(74, DISPLAY)} body={t(46, BODY)} strip />
        </div>
        {s.stamp && <div style={{position: "absolute", right: 60, top: 290}}><Stamp solid text={s.stamp} start={Math.round((s.words[0]?.s ?? 0.3) * fps)} f={lf} fps={fps} /></div>}
      </AbsoluteFill>
    );
  }
  if (s.kind === "photo" && s.image) {
    const z = 1 + 0.12 * clamp(lf / Math.max(1, Math.round(s.durationSec * fps)));
    return (
      <AbsoluteFill style={{background: "#111"}}>
        <Img src={staticFile(s.image as string)} style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})`, filter: "sepia(.22) contrast(1.06) saturate(.95)"}} />
        <AbsoluteFill style={{background: "linear-gradient(rgba(10,6,2,.6) 0%, rgba(10,6,2,0) 28%, rgba(10,6,2,0) 50%, rgba(10,6,2,.72) 100%), radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(10,6,2,.5) 100%)"}} />
        <div style={{position: "absolute", left: 40, right: 40, top: 150, display: "flex", justifyContent: "center"}}>
          <div style={{...t(74, DISPLAY), background: look.sheetFill, padding: "10px 34px", borderRadius: 10, boxShadow: "0 8px 18px rgba(0,0,0,.45)", transform: "rotate(-1deg)", textAlign: "center"}}>
            <Highlighter start={Math.round((s.words[s.hit ?? 0]?.s ?? 0.4) * fps)} f={lf} color={a.main}>{s.text}</Highlighter>
          </div>
        </div>
        {s.stamp && <div style={{position: "absolute", right: 60, top: 330}}><Stamp solid text={s.stamp} start={Math.round((s.words[s.hit ?? 0]?.s ?? 0.4) * fps)} f={lf} fps={fps} /></div>}
      </AbsoluteFill>
    );
  }
  return null;
};


/* ------------------------------------------------------------- SVG Dynamic Motion Wrapper */
const SvgMotionWrapper: React.FC<{children: React.ReactNode; mode: number; lf: number; totalFrames: number}> = ({children, mode, lf, totalFrames}) => {
  const p = clamp(lf / Math.max(1, totalFrames));
  let scale = 1, tx = 0, ty = 0;
  const e = Easing.bezier(0.25, 0.1, 0.25, 1);
  if (mode === 0) { scale = interpolate(p, [0, 1], [0.98, 1.15], {easing: e}); ty = interpolate(p, [0, 1], [6, -8]); }
  else if (mode === 1) { scale = interpolate(p, [0, 1], [1.02, 1.1]); tx = interpolate(p, [0, 1], [-26, 26], {easing: e}); ty = Math.sin(p * Math.PI * 2) * 5; }
  else if (mode === 2) { scale = interpolate(p, [0, 1], [1.16, 1.0], {easing: e}); ty = interpolate(p, [0, 1], [-8, 6]); }
  else if (mode === 3) { scale = interpolate(p, [0, 1], [1.0, 1.11]); tx = interpolate(p, [0, 1], [26, -26], {easing: e}); ty = interpolate(p, [0, 1], [6, -6]); }
  else { scale = 1.05 + Math.sin(p * Math.PI * 2) * 0.05; ty = Math.cos(p * Math.PI * 2) * 8; tx = Math.sin(p * Math.PI * 2) * 6; }
  const enter = interpolate(Math.min(1, lf / 12), [0, 1], [0.88, 1.0], {easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return (
    <div style={{transform: `translate(${tx}px, ${ty}px) scale(${scale * enter})`, transformOrigin: "50% 65%", display: "flex", justifyContent: "center", alignItems: "center", width: "100%", filter: "drop-shadow(0 14px 28px rgba(40,25,10,0.18))"}}>
      {children}
    </div>
  );
};

/* -------------------------------------------- art: new SVG kit (many assets) or an old cutout */
const LEGACY_VIEW: Record<string, (p: number) => React.ReactNode> = {
  legacy_lingam: (p) => <PaperShivaLingamCutout progress={p} width={680} height={520} />,
  legacy_trishul: (p) => <PaperTrishulCutout progress={p} width={680} height={500} />,
  legacy_chariot: (p) => <PaperChariotCutout progress={p} width={700} height={490} />,
  legacy_cave: (p) => <PaperMountainCaveCutout progress={p} width={690} height={490} />,
  legacy_sudarshan: (p) => <PaperSudarshanCutout progress={p} width={680} height={500} />,
  legacy_cows: (p) => <PaperCowsCutout progress={p} width={720} height={500} />,
  legacy_vachan: (p) => <PaperVachanCutout progress={p} width={720} height={500} />,
  legacy_weapons: (p) => <PaperWeaponsCutout progress={p} width={720} height={500} />,
  legacy_army: (p) => <PaperArmyCutout progress={p} width={720} height={500} />,
  legacy_deity: (p) => <PaperDwarkadhishCutout progress={p} width={680} height={530} />,
  legacy_chardham: (p) => <PaperCharDhamCutout progress={p} width={740} height={490} />,
  legacy_city: (p) => <PaperCityCutout progress={p} width={700} height={490} />,
  legacy_temple: (p) => <PaperTempleCutout progress={p} width={660} height={520} />,
};

const ArtView: React.FC<{plan: ArtPlan; lf: number; fps: number}> = ({plan, lf, fps}) => {
  const look = useLook();
  const p = easeIO(clamp(lf / 14));
  if (plan.legacy) return <>{LEGACY_VIEW[plan.hero]?.(p)}</>;
  const svg = renderArt(plan, look.pal, lf / fps, p);
  return <div style={{width: 772, height: 520}} dangerouslySetInnerHTML={{__html: `<svg viewBox="0 0 900 560" width="850" height="528" style="overflow:visible;margin-left:-39px">${svg}</svg>`}} />;
};

/* ------------------------------------------------------------- scene item */
const W = 900;
const Item: React.FC<{s: PFScene; i: number; lf: number; fps: number; hitF: number; seed: number; plan: ArtPlan}> = ({s, i, lf, fps, hitF, seed, plan}) => {
  const look = useLook();
  const a = accOf(look, s.accent, i);
  const tilt = ((i % 2) ? 1 : -1) * (look.tiltAmp * 0.6 + (i % 3) * look.tiltAmp * 0.25);
  const sd = seed * 31 + i * 97;
  const tf = FONT_OF[look.titleFont];
  const text = (size: number, font = BOLD) => ({fontFamily: font, fontSize: size, lineHeight: 1.18} as React.CSSProperties);
  const sheetH = look.sheet === "polaroid" ? 1220 : 1180;

  if (s.kind === "map") {
    return (
      <Sheet w={W} h={1180} seed={sd} accent={s.accent || ACCENT_CYCLE[i % 4]} idx={i} tilt={tilt * 0.6} lf={lf} fps={fps}>
        <MapItem s={s} lf={lf} fps={fps} accent={a.main} accentDark={a.dark} />
        <MapRoute s={s} lf={lf} fps={fps} text={text(60)} body={text(40, BODY)} />
        {s.stamp && <Stamp text={s.stamp} start={hitF} f={lf} fps={fps} />}
      </Sheet>
    );
  }

  const totalFrames = Math.max(1, Math.round(s.durationSec * fps));
  const aiImageSrc = (s as any).image || (s as any).ai_bg;
  const art = aiImageSrc ? (
    <div style={{width: 772, height: 500, margin: "0 auto", borderRadius: 20, overflow: "hidden", boxShadow: "0 14px 28px rgba(35,20,8,0.32)", border: `6px solid ${look.pal.cream}`}}>
      <Img src={aiImageSrc} style={{width: "100%", height: "100%", objectFit: "cover"}} />
    </div>
  ) : (
    <SvgMotionWrapper mode={(i + Math.floor(seed)) % 5} lf={lf} totalFrames={totalFrames}>
      <ArtView plan={plan} lf={lf} fps={fps} />
    </SvgMotionWrapper>
  );
  const tsize = Math.round(((s.kind === "quote" ? 86 : s.kind === "title" ? 104 : 96) * look.titleScale));
  const stampEl = s.stamp ? <Stamp text={s.stamp} start={hitF} f={lf} fps={fps} /> : null;
  const sub = s.sub ? <div style={{...text(46, BODY), margin: look.titlePos === "top" ? "20px 0 0" : "0 0 18px", textAlign: "center", opacity: 0.8}}>{s.kind === "quote" ? "— " : ""}{s.sub}</div> : null;

  let head: React.ReactNode;
  if (s.kind === "number") {
    const v = (s.number ?? 0) * easeIO(clamp((lf - hitF) / (fps * 1.0)));
    const dec = Number.isInteger(s.number ?? 0) ? 0 : 1;
    head = (
      <div style={{textAlign: "center", margin: "0 0 14px"}}>
        <div style={{...text(150, DISPLAY), lineHeight: 1, color: a.main}}>{v.toLocaleString("en-IN", {minimumFractionDigits: dec, maximumFractionDigits: dec})}<span style={{fontSize: 85}}>{s.unit}</span></div>
        <div style={{...text(76), marginTop: 12}}><Highlighter start={hitF} f={lf} color={look.accents[Math.min(2, look.accents.length - 1)].main}>{s.text}</Highlighter></div>
      </div>
    );
  } else if (s.kind === "quote") {
    head = <div style={{...text(tsize, HAND), lineHeight: 1.25, textAlign: "center", margin: "0 0 18px"}}><Highlighter start={hitF} f={lf} color={look.accents[Math.min(2, look.accents.length - 1)].main}>“{s.text}”</Highlighter></div>;
  } else {
    head = <div style={{...text(tsize, tf), lineHeight: 1.18, textAlign: "center", margin: look.titlePos === "top" ? "0 0 20px" : "20px 0 0"}}><Highlighter start={hitF} f={lf} color={a.main}>{s.text}</Highlighter></div>;
  }

  return (
    <Sheet w={W} h={sheetH} seed={sd} accent={s.accent || ACCENT_CYCLE[i % 4]} idx={i} tilt={tilt} lf={lf} fps={fps}>
      {look.titlePos === "top" ? <>{head}{art}{sub}</> : <>{sub ? null : null}{art}{head}{s.sub ? <div style={{...text(46, BODY), marginTop: 14, textAlign: "center", opacity: 0.8}}>{s.sub}</div> : null}</>}
      {stampEl}
    </Sheet>
  );
};

/* --------------------------------------------------------------- captions (4 styles) */
const Captions: React.FC<{s: PFScene; lf: number; fps: number}> = ({s, lf, fps}) => {
  const look = useLook();
  const t = lf / fps;
  let idx = s.words.findIndex((w) => t >= w.s && t < w.e);
  if (idx < 0) idx = s.words.reduce((acc, w, k) => (t >= w.s ? k : acc), 0);
  const per = look.caption === "karaoke" ? 3 : 4;
  const chunk = Math.floor(idx / per);
  const ws = s.words.slice(chunk * per, chunk * per + per);
  if (!ws.length) return null;
  const surfaceLight = isLight(look.capColor);
  const txt = surfaceLight ? look.ink : look.sheetFill;
  const words = (size: number, onBg: string, onFg: string, offFg: string, pad = "0 12px") => ws.map((w, k) => {
    const on = chunk * per + k === idx;
    return <span key={k} style={{fontFamily: BOLD, fontSize: size, color: on ? onFg : offFg, background: on ? onBg : "transparent", padding: pad, borderRadius: 8}}>{w.w}</span>;
  });
  if (look.caption === "ribbon") {
    return (
      <div style={{position: "absolute", left: 0, right: 0, bottom: 240}}>
        <div style={{background: look.capColor, borderTop: `8px solid ${look.capHi}`, borderBottom: `8px solid ${look.capHi}`, padding: "18px 40px", display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", boxShadow: "0 10px 24px rgba(0,0,0,.4)"}}>
          {words(62, look.capHi, surfaceLight ? look.sheetFill : look.ink, txt)}
        </div>
      </div>
    );
  }
  if (look.caption === "karaoke") {
    return (
      <div style={{position: "absolute", left: 30, right: 30, bottom: 260, display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", textShadow: "0 0 0 #000"}}>
        {ws.map((w, k) => {
          const on = chunk * per + k === idx;
          return <span key={k} style={{fontFamily: BOLD, fontSize: on ? 92 : 78, color: on ? look.capHi : look.capColor, WebkitTextStroke: "0px", textShadow: "-5px -5px 0 #000, 5px -5px 0 #000, -5px 5px 0 #000, 5px 5px 0 #000, 0 9px 0 rgba(0,0,0,.6)", transform: `translateY(${on ? -6 : 0}px) rotate(${on ? -2 : 0}deg)`, display: "inline-block"}}>{w.w}</span>;
        })}
      </div>
    );
  }
  if (look.caption === "lower") {
    return (
      <div style={{position: "absolute", left: 40, bottom: 250, right: 90, display: "flex"}}>
        <div style={{width: 14, background: look.capHi, borderRadius: 8, marginRight: 0}} />
        <div style={{background: look.capColor, padding: "16px 30px", borderRadius: "0 16px 16px 0", display: "flex", gap: 14, flexWrap: "wrap", boxShadow: "0 8px 18px rgba(0,0,0,.35)"}}>
          {words(58, look.capHi, surfaceLight ? look.sheetFill : look.ink, txt, "0 10px")}
        </div>
      </div>
    );
  }
  return (
    <div style={{position: "absolute", left: 40, right: 40, bottom: 250, display: "flex", justifyContent: "center"}}>
      <div style={{background: look.capColor, padding: "14px 34px", borderRadius: 12, boxShadow: "0 8px 16px rgba(40,25,10,.3)", transform: "rotate(-.8deg)", display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center"}}>
        {words(60, look.capHi, look.capColor, txt)}
      </div>
    </div>
  );
};

/* ------------------------------------------------------- board + particles + hashtags */
const BoardBG: React.FC<{cx: number; cy: number; f: number; seed: number}> = ({cx, cy, f, seed}) => {
  const look = useLook();
  const b = look.board;
  const pos = `${-cx * 0.3}px ${-cy * 0.3}px`;
  const base: React.CSSProperties = {background: `linear-gradient(160deg, ${b.bg}, ${b.bg2})`};
  const pat = (() => {
    switch (b.pattern) {
      case "dots": return {backgroundImage: `radial-gradient(${b.patColor} 3px, transparent 4px)`, backgroundSize: "84px 84px", backgroundPosition: pos};
      case "grid": return {backgroundImage: `linear-gradient(${b.patColor} 2px, transparent 2px), linear-gradient(90deg, ${b.patColor} 2px, transparent 2px)`, backgroundSize: "90px 90px", backgroundPosition: pos};
      case "lines": return {backgroundImage: `repeating-linear-gradient(45deg, ${b.patColor} 0 3px, transparent 3px 34px)`, backgroundPosition: pos};
      case "diamonds": return {backgroundImage: `linear-gradient(45deg, ${b.patColor} 25%, transparent 25%), linear-gradient(-45deg, ${b.patColor} 25%, transparent 25%)`, backgroundSize: "96px 96px", backgroundPosition: pos};
      case "waves": return {backgroundImage: `radial-gradient(circle at 50% 100%, transparent 38px, ${b.patColor} 39px, ${b.patColor} 44px, transparent 45px)`, backgroundSize: "96px 48px", backgroundPosition: pos};
      default: return {};
    }
  })();
  const stars = useMemo(() => { const r = rng(seed + 5); return Array.from({length: 46}, () => ({x: r() * 100, y: r() * 100, s: 3 + r() * 6, k: r() * 6})); }, [seed]);
  return (
    <>
      <AbsoluteFill style={base} />
      <AbsoluteFill style={pat} />
      {b.pattern === "stars" && (
        <AbsoluteFill>
          {stars.map((st, k) => <div key={k} style={{position: "absolute", left: `${(st.x + (-cx * 0.01)) % 100}%`, top: `${st.y}%`, width: st.s, height: st.s, background: b.patColor, borderRadius: "50%", opacity: 0.45 + 0.55 * Math.abs(Math.sin(f / 22 + st.k)), boxShadow: `0 0 ${st.s * 2}px ${b.patColor}`}} />)}
        </AbsoluteFill>
      )}
    </>
  );
};

const Particles: React.FC<{f: number; width: number; height: number; seed: number}> = ({f, width, height, seed}) => {
  const look = useLook();
  const kind = look.particles;
  const items = useMemo(() => { const r = rng(seed * 3 + 11); return Array.from({length: 22}, () => ({x: r(), y: r(), s: 0.6 + r() * 1.1, v: 0.6 + r() * 1.4, ph: r() * 6.28, rot: r() * 360})); }, [seed]);
  if (kind === "none") return null;
  const col = {petals: "#ff8fb1", embers: "#ffb347", stars: "#fff1b0", dust: "rgba(255,240,200,.55)", leaves: "#9ad06a", bubbles: "rgba(220,250,255,.5)"}[kind];
  return (
    <AbsoluteFill style={{pointerEvents: "none", overflow: "hidden"}}>
      {items.map((p, k) => {
        const rising = kind === "embers" || kind === "bubbles";
        const prog = ((p.y + (f * p.v * (rising ? -1 : 1)) / 520) % 1 + 1) % 1;
        const x = (p.x * width + Math.sin(f / 30 + p.ph) * 40);
        const y = prog * (height + 120) - 60;
        const size = 18 * p.s;
        const shape: React.CSSProperties = kind === "petals" ? {width: size, height: size * 1.5, borderRadius: "70% 0 70% 0"} : kind === "leaves" ? {width: size * 1.4, height: size * 0.8, borderRadius: "100% 0 100% 0"} : kind === "stars" ? {width: size * 0.5, height: size * 0.5, borderRadius: "50%", boxShadow: `0 0 ${size}px ${col}`} : {width: size * (kind === "dust" ? 0.4 : 0.7), height: size * (kind === "dust" ? 0.4 : 0.7), borderRadius: "50%", ...(kind === "bubbles" ? {border: `3px solid ${col}`, background: "transparent"} : {})};
        return <div key={k} style={{position: "absolute", left: x, top: y, background: kind === "bubbles" ? undefined : col, opacity: kind === "stars" ? 0.4 + 0.6 * Math.abs(Math.sin(f / 15 + p.ph)) : 0.8, transform: `rotate(${p.rot + f * (kind === "petals" || kind === "leaves" ? 3 : 0)}deg)`, ...shape}} />;
      })}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- the film */
export const sceneFramesPF = (s: PFScene, fps = 30) => Math.max(15, Math.round(s.durationSec * fps));
export const totalFramesPF = (scenes: PFScene[], fps = 30) => scenes.reduce((a, s) => a + sceneFramesPF(s, fps), 0);

/** where each sheet lies on the table: every look has its own route (zigzag / scroll / strip / diagonal / spiral) */
const centersFor = (kind: Look["layout"], n: number, r: () => number) => Array.from({length: n}, (_, i) => {
  const jr = () => (r() - 0.5);
  switch (kind) {
    case "scroll": return {x: jr() * 90, y: i * 1500 + jr() * 80, rot: jr() * 3};
    case "strip": return {x: i * 1120 + jr() * 60, y: jr() * 220, rot: jr() * 4};
    case "diagonal": return {x: i * 520 + (i % 2 ? 260 : -260) + jr() * 80, y: i * 1180 + jr() * 80, rot: jr() * 5};
    case "spiral": { const R = 1500 + i * 70, a = i * (1300 / R) - 1.2; return {x: Math.cos(a) * R, y: Math.sin(a) * R * 1.15, rot: jr() * 6}; }
    default: { const row = Math.floor(i / 2), c = i % 2, col = row % 2 === 0 ? c : 1 - c; return {x: (col ? 640 : -640) + jr() * 140, y: row * 1500 + jr() * 120, rot: jr() * 5}; }
  }
});

export const PaperFilm: React.FC<PFProps> = ({scenes, seed = 7, captions = true, sfx = true, look: lookId, hashtags = []}) => {
  useFonts();
  const f = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const storyText = useMemo(() => scenes.map((s) => `${s.text} ${s.sub || ""} ${s.narration || ""}`).join(" "), [scenes]);
  const look = useMemo(() => pickLook(lookId, seed, storyText), [lookId, seed, storyText]);
  const plans = useMemo(() => planArt(scenes.map((s) => ({text: s.text, sub: s.sub, narration: s.narration || ""})), seed, look), [scenes, seed, look]);
  const MOVE = look.travel;

  const layout = useMemo(() => {
    const r = rng(seed);
    const starts: number[] = []; let acc = 0;
    scenes.forEach((s) => { starts.push(acc); acc += sceneFramesPF(s, fps); });
    const centers = centersFor(look.layout, scenes.length, r);
    const xs = centers.map((c) => c.x), ys = centers.map((c) => c.y);
    const bb = {cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2, w: Math.max(...xs) - Math.min(...xs) + W + 420, h: Math.max(...ys) - Math.min(...ys) + 1250};
    return {starts, centers, total: acc, bb};
  }, [scenes, seed, fps, look]);

  const cur = Math.max(0, layout.starts.reduce((a, st, k) => (f >= st ? k : a), 0));
  const lf = f - layout.starts[cur];
  const sc = scenes[cur];

  const here = layout.centers[cur];
  const prev = layout.centers[Math.max(0, cur - 1)];
  const travel = clamp(lf / MOVE);
  const p = cur === 0 ? 1 : easeIO(travel);
  let cx = lerp(prev.x, here.x, p), cy = lerp(prev.y, here.y, p);
  let rot = lerp(prev.rot, here.rot, p) + (cur === 0 ? 0 : look.wobble * Math.sin(Math.PI * travel) * (cur % 2 ? 1 : -1));
  const len = sceneFramesPF(sc, fps);
  let zoom = lerp(0.97, 1.0 + 0.07 * clamp(lf / len), p) - (cur === 0 ? 0 : 0.13 * Math.sin(Math.PI * travel));
  if (cur === 0) zoom = lerp(0.86, 1.0, easeIO(clamp(lf / 20))) + 0.06 * clamp(lf / len);

  const overview = Math.min(width / layout.bb.w, height / layout.bb.h);
  const lastSpan = Math.min(fps * 2.2, len * 0.45);
  let capOp = 1, chipQ = 0;
  if (scenes.length >= 3 && cur === scenes.length - 1) {
    const q = easeIO(clamp((lf - (len - lastSpan)) / lastSpan));
    cx = lerp(cx, layout.bb.cx, q); cy = lerp(cy, layout.bb.cy, q); zoom = lerp(zoom, overview, q); rot = lerp(rot, 0, q); capOp = 1 - clamp(q * 3);
    chipQ = clamp((q - 0.35) / 0.4);
  }

  let shx = 0, shy = 0;
  scenes.forEach((s, k) => {
    if (!s.stamp) return;
    const hf = layout.starts[k] + Math.round((s.words[s.hit ?? 0]?.s ?? 0) * fps);
    const d = f - hf;
    if (d >= 0 && d < 12) { const a = 16 * Math.exp(-d / 3); shx += Math.sin(d * 2.9) * a; shy += Math.cos(d * 3.7) * a; }
  });

  const hitOf = (s: PFScene) => Math.round((s.words[s.hit ?? Math.floor(s.words.length * 0.35)]?.s ?? 0.4) * fps);
  const tx = width / 2 + shx, ty = height * 0.46 + shy;
  const fullOp = isFull(sc) ? (cur === 0 ? clamp((len - lf) / 8) : clamp(lf / 8) * clamp((len - lf) / 8)) : 0;
  const vig = look.board.vignette;

  return (
    <LookCtx.Provider value={look}>
      <AbsoluteFill style={{background: look.board.bg, overflow: "hidden"}}>
        <BoardBG cx={cx} cy={cy} f={f} seed={seed} />

        {/* Garam Roshni (Warm Golden Volumetric Lighting with subtle breathing flame flicker) */}
        <AbsoluteFill style={{
          background: "radial-gradient(circle at 50% 40%, rgba(255, 190, 70, 0.28) 0%, rgba(230, 115, 30, 0.12) 48%, rgba(12, 8, 4, 0.68) 100%)",
          mixBlendMode: "screen",
          opacity: 0.88 + Math.sin(f / 22) * 0.12,
          pointerEvents: "none",
        }} />

        <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,.04) 25%, rgba(12,8,4,${vig}) 100%)`, pointerEvents: "none"}} />
        <div style={{position: "absolute", left: 0, top: 0, width: 0, height: 0, opacity: 1 - fullOp, transform: `translate(${tx}px,${ty}px) scale(${zoom}) rotate(${rot}deg) translate(${-cx}px,${-cy}px)`}}>
          {scenes.map((s, i) => {
            const st = layout.starts[i];
            if (f < st - 4 || isFull(s)) return null;
            const c = layout.centers[i];
            const lfi = f - st;
            const sp = clamp(spring({frame: Math.max(0, lfi + 4), fps, config: {damping: 13, stiffness: 120}}), 0, 1.1);
            const next = layout.starts[i + 1];
            const dim = next === undefined ? 0 : clamp((f - next) / 14);
            return (
              <div key={i} style={{position: "absolute", left: c.x, top: c.y, transform: `translate(-50%,-50%) translateY(${(1 - sp) * 160}px) scale(${lerp(0.82, 1, sp)})`, opacity: clamp(sp * 1.6), filter: `brightness(${1 - dim * 0.28}) saturate(${1 - dim * 0.3})`}}>
                <Item s={s} i={i} lf={lfi} fps={fps} hitF={hitOf(s)} seed={seed} plan={plans[i]} />
              </div>
            );
          })}
        </div>
        <Particles f={f} width={width} height={height} seed={seed} />
        
        {/* Soft Vignette Overlay */}
        <AbsoluteFill style={{background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(35,20,8,.32) 100%)", pointerEvents: "none"}} />
        
        {/* Tactile Paper Fiber & Grain Texture (SVG feTurbulence) */}
        <AbsoluteFill style={{mixBlendMode: "multiply", opacity: look.board.dark ? 0.14 : 0.28, pointerEvents: "none"}}>
          <svg width="100%" height="100%">
            <filter id="pfgrain">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed={seed} />
              <feColorMatrix values="0 0 0 0 .38  0 0 0 0 .28  0 0 0 0 .16  0 0 0 .95 0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#pfgrain)" />
          </svg>
        </AbsoluteFill>
        {isFull(sc) && fullOp > 0 && <AbsoluteFill style={{opacity: fullOp}}><FullScene s={sc} i={cur} lf={lf} fps={fps} width={width} height={height} /></AbsoluteFill>}
        {captions && capOp > 0 && <div style={{opacity: capOp}}><Captions s={sc} lf={lf} fps={fps} /></div>}
        {sfx && scenes.map((s, k) => {
          const st = layout.starts[k];
          return (
            <React.Fragment key={k}>
              {k > 0 && <Sequence from={st} durationInFrames={30}><Audio src={staticFile("myth-audio/whoosh.wav")} volume={0.45} /></Sequence>}
              {s.stamp && <Sequence from={st + hitOf(s)} durationInFrames={30}><Audio src={staticFile("myth-audio/thump.wav")} volume={0.7} /></Sequence>}
            </React.Fragment>
          );
        })}
      </AbsoluteFill>
    </LookCtx.Provider>
  );
};
