import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {MapItem} from "../cinematic/MapItem";
import type {PFScene} from "../cinematic/types";

export interface VoxEditorialScene {
  heading?: string;
  title?: string;
  narration: string;
  tts_text?: string;
  durationSec: number;
  layout?: string;
  words?: Array<{w: string; s: number; e: number}>;
  state?: string;
  place?: {name: string; lat: number; lon: number};
}

export interface VoxEditorialProps {
  topicTitle: string;
  scenes: VoxEditorialScene[];
  seed?: number;
  geo?: {name?: string; state?: string; lat?: number; lon?: number} | null;
  hashtags?: string[];
}

export const totalFramesVoxEditorial = (scenes: VoxEditorialScene[], fps = 30) =>
  Math.max(30, scenes.reduce((sum, s) => sum + Math.max(15, Math.round((s.durationSec || 4) * fps)), 0));

const ACCENTS = ["#D92D20", "#F59E0B", "#1D4ED8", "#0F766E", "#7C3AED", "#B45309"];
const BG_PALETTES = [
  {bg: "#F3EFE6", grid: "rgba(24,24,27,0.055)", ink: "#18181B"},
  {bg: "#EFECE4", grid: "rgba(180,83,9,0.065)", ink: "#1C1917"},
  {bg: "#F5F0E1", grid: "rgba(29,78,216,0.05)", ink: "#0F172A"},
];

const LAYOUTS = [
  "hero_cutout",
  "paper_cut_scroll",
  "newspaper_oped",
  "kinetic_split",
  "polaroid_stack",
  "detective_board",
  "dramatic_climax",
] as const;

const splitChunks = (text: string, maxWords = 4): string[] => {
  const clean = (text || "").replace(/\[.*?\]|\(.*?\)/g, "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const words = clean.split(" ");
  const out: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    out.push(words.slice(i, i + maxWords).join(" "));
  }
  return out;
};

type SvgMotif =
  | "temple"
  | "warrior"
  | "bow_arrow"
  | "diya_fire"
  | "sun_chakra"
  | "mountain_river"
  | "scroll_granth"
  | "lotus";

function pickSvgMotif(text: string, idx: number): SvgMotif {
  const t = text.toLowerCase();
  if (/मंदिर|शक्तिपीठ|ज्योतिर्लिंग|धाम|पुरी|temple|shrine|द्वार/.test(t)) return "temple";
  if (/युद्ध|तलवार|सेना|मुगल|रण|वीर|रानी|राणा|योद्धा|sword|war|battle/.test(t)) return "warrior";
  if (/बाण|धनुष|तीर|कर्ण|अर्जुन|राम|bow|arrow/.test(t)) return "bow_arrow";
  if (/अग्नि|आग|दीपक|ज्वाला|बलिदान|जौहर|भस्म|fire|flame/.test(t)) return "diya_fire";
  if (/पर्वत|हिमालय|नदी|गंगा|समुद्र|लहर|mountain|river/.test(t)) return "mountain_river";
  if (/ग्रंथ|वेद|गीता|शास्त्र|कथा|इतिहास|scroll|book/.test(t)) return "scroll_granth";
  if (/कमल|देवी|माता|सती|लक्ष्मी|सरस्वती|lotus/.test(t)) return "lotus";
  const pool: SvgMotif[] = ["sun_chakra", "temple", "diya_fire", "scroll_granth", "lotus", "mountain_river"];
  return pool[idx % pool.length];
}

const SvgEditorialArt: React.FC<{
  text: string;
  index: number;
  accent: string;
  frame: number;
  scale?: number;
}> = ({text, index, accent, frame, scale = 1}) => {
  const motif = pickSvgMotif(text, index);
  const pulse = 1 + Math.sin(frame / 10) * 0.04;
  const spin = (frame * 1.4) % 360;
  const floatY = Math.sin(frame / 12) * 8;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(160deg, #1E1B18 0%, #2C241E 55%, #18181B 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg
        viewBox="0 0 600 600"
        style={{width: "92%", height: "92%", transform: `scale(${scale})`}}
      >
        {/* Ambient radial sun/mandala halo */}
        <circle cx="300" cy="290" r={195 * pulse} fill={accent} opacity={0.18} />
        <circle cx="300" cy="290" r={140} fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="12 10" transform={`rotate(${spin} 300 290)`} opacity={0.55} />

        {motif === "temple" && (
          <g transform={`translate(0, ${floatY * 0.4})`} stroke="#18181B" strokeWidth="6" strokeLinejoin="round">
            <rect x="130" y="450" width="340" height="45" fill="#E7DFCF" />
            <rect x="160" y="410" width="280" height="40" fill="#FBF7EE" />
            <polygon points="200,410 300,140 400,410" fill="#F59E0B" />
            <polygon points="235,410 300,210 365,410" fill="#FBF7EE" />
            <path d="M270,410 L270,320 A30,30 0 0 1 330,320 L330,410 Z" fill="#18181B" />
            <circle cx="300" cy="122" r="18" fill="#FBBF24" />
            <line x1="300" y1="65" x2="300" y2="105" stroke="#FBBF24" strokeWidth="6" />
            <polygon points="300,68 355,84 300,100" fill={accent} />
          </g>
        )}

        {motif === "warrior" && (
          <g transform={`translate(0, ${floatY * 0.5})`} stroke="#18181B" strokeWidth="6" strokeLinejoin="round">
            {/* Crossed Swords & Shield */}
            <line x1="160" y1="430" x2="440" y2="150" stroke="#E5E7EB" strokeWidth="18" strokeLinecap="round" />
            <line x1="440" y1="430" x2="160" y2="150" stroke="#E5E7EB" strokeWidth="18" strokeLinecap="round" />
            <circle cx="300" cy="295" r="105" fill={accent} />
            <circle cx="300" cy="295" r="72" fill="#F59E0B" />
            <circle cx="300" cy="295" r="28" fill="#FBF7EE" />
          </g>
        )}

        {motif === "bow_arrow" && (
          <g transform={`translate(0, ${floatY * 0.5})`} stroke="#18181B" strokeWidth="6" strokeLinejoin="round">
            <path d="M210,120 Q390,290 210,460" fill="none" stroke="#F59E0B" strokeWidth="18" strokeLinecap="round" />
            <line x1="210" y1="120" x2="210" y2="460" stroke="#FBF7EE" strokeWidth="4" />
            <line x1="150" y1="290" x2="450" y2="290" stroke="#FBF7EE" strokeWidth="10" strokeLinecap="round" />
            <polygon points="450,290 412,270 412,310" fill={accent} />
          </g>
        )}

        {motif === "diya_fire" && (
          <g transform={`translate(0, ${floatY * 0.3})`} stroke="#18181B" strokeWidth="6" strokeLinejoin="round">
            <path d="M300,130 C350,210 365,265 300,320 C235,265 250,210 300,130 Z" fill="#F59E0B" transform={`scale(${pulse})`} style={{transformOrigin: "300px 290px"}} />
            <path d="M300,185 C325,230 330,270 300,305 C270,270 275,230 300,185 Z" fill="#FEF08A" />
            <path d="M165,330 Q300,375 435,330 Q400,435 300,435 Q200,435 165,330 Z" fill={accent} />
          </g>
        )}

        {motif === "mountain_river" && (
          <g stroke="#18181B" strokeWidth="6" strokeLinejoin="round">
            <polygon points="80,430 230,170 380,430" fill="#D6C7AE" />
            <polygon points="220,430 375,140 520,430" fill="#FBF7EE" />
            <polygon points="375,140 335,215 375,205 415,215" fill="#FFFFFF" />
            <path d="M70,445 Q185,415 300,445 T530,445 L530,500 L70,500 Z" fill="#0EA5E9" />
          </g>
        )}

        {motif === "scroll_granth" && (
          <g transform={`translate(0, ${floatY * 0.4})`} stroke="#18181B" strokeWidth="6" strokeLinejoin="round">
            <rect x="175" y="140" width="250" height="320" rx="14" fill="#FBF7EE" />
            <rect x="155" y="125" width="290" height="34" rx="17" fill="#F59E0B" />
            <rect x="155" y="440" width="290" height="34" rx="17" fill="#F59E0B" />
            <line x1="220" y1="215" x2="380" y2="215" stroke={accent} strokeWidth="10" strokeLinecap="round" />
            <line x1="220" y1="265" x2="380" y2="265" stroke="#18181B" strokeWidth="8" strokeLinecap="round" />
            <line x1="220" y1="315" x2="350" y2="315" stroke="#18181B" strokeWidth="8" strokeLinecap="round" />
            <line x1="220" y1="365" x2="370" y2="365" stroke="#18181B" strokeWidth="8" strokeLinecap="round" />
          </g>
        )}

        {motif === "lotus" && (
          <g transform={`translate(0, ${floatY * 0.5})`} stroke="#18181B" strokeWidth="5" strokeLinejoin="round">
            <path d="M300,150 C350,235 350,335 300,395 C250,335 250,235 300,150 Z" fill={accent} />
            <path d="M225,195 C270,255 280,340 265,395 C205,355 185,265 225,195 Z" fill="#F59E0B" />
            <path d="M375,195 C330,255 320,340 335,395 C395,355 415,265 375,195 Z" fill="#F59E0B" />
            <path d="M155,270 C215,305 245,355 245,400 C175,395 135,340 155,270 Z" fill="#FBF7EE" />
            <path d="M445,270 C385,305 355,355 355,400 C425,395 465,340 445,270 Z" fill="#FBF7EE" />
            <ellipse cx="300" cy="425" rx="165" ry="26" fill="#0F766E" />
          </g>
        )}

        {motif === "sun_chakra" && (
          <g stroke="#18181B" strokeWidth="6" strokeLinejoin="round">
            <g transform={`rotate(${spin} 300 290)`}>
              {Array.from({length: 12}, (_, k) => (
                <polygon
                  key={k}
                  points="300,105 282,165 318,165"
                  fill="#F59E0B"
                  transform={`rotate(${k * 30} 300 290)`}
                />
              ))}
            </g>
            <circle cx="300" cy="290" r="105" fill={accent} />
            <circle cx="300" cy="290" r="65" fill="#FEF08A" />
            <circle cx="300" cy="290" r="24" fill="#18181B" />
          </g>
        )}
      </svg>
    </div>
  );
};

const EditorialPaperBackground: React.FC<{seed: number; sceneIdx: number}> = ({seed, sceneIdx}) => {
  const pal = BG_PALETTES[(seed + sceneIdx) % BG_PALETTES.length];
  return (
    <AbsoluteFill
      style={{
        backgroundColor: pal.bg,
        backgroundImage: `
          linear-gradient(to right, ${pal.grid} 1px, transparent 1px),
          linear-gradient(to bottom, ${pal.grid} 1px, transparent 1px)
        `,
        backgroundSize: "52px 52px",
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.22) 0%, rgba(205,195,175,0.36) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const FloatingParticles: React.FC<{frame: number; accent: string; seed: number}> = ({frame, accent, seed}) => {
  const dots = Array.from({length: 12}, (_, k) => {
    const x = ((k * 97 + seed * 31) % 980) + 50;
    const baseY = ((k * 173 + seed * 19) % 1600) + 120;
    const y = baseY - ((frame * (1.2 + (k % 3) * 0.5)) % 420);
    const size = 6 + (k % 4) * 3;
    const op = 0.14 + (k % 3) * 0.08;
    return {x, y: y < 60 ? y + 1700 : y, size, op};
  });
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.x,
            top: d.y,
            width: d.size,
            height: d.size,
            borderRadius: i % 2 === 0 ? "50%" : 2,
            backgroundColor: i % 3 === 0 ? accent : "#18181B",
            opacity: d.op,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const SceneSlide: React.FC<{
  scene: VoxEditorialScene;
  index: number;
  total: number;
  topicTitle: string;
  seed: number;
  geo?: VoxEditorialProps["geo"];
  hashtags?: string[];
}> = ({scene, index, total, topicTitle, seed, geo, hashtags}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const accent = ACCENTS[(index + seed) % ACCENTS.length];
  const isLast = index === total - 1;

  // Any scene mentioning a place/state -> geo_map!
  let layout: string = scene.layout || LAYOUTS[(index + seed) % LAYOUTS.length];
  if (index === 0) layout = "hero_cutout";
  else if (scene.state || scene.place || (index === 1 && geo?.state)) layout = "geo_map";
  else if (isLast) layout = "pullback_cta";

  const motionMode = (index * 3 + seed) % 7;
  const enter = spring({
    frame,
    fps,
    config: {damping: 13 + (index % 4), stiffness: 175, mass: 0.85},
  });
  const exit = interpolate(frame, [Math.max(0, durationInFrames - 5), durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let tx = 0;
  let ty = 0;
  let rot = 0;
  let boxScale = 1;
  if (motionMode === 0) {
    ty = interpolate(enter, [0, 1], [110, 0]) - exit * 45;
    rot = interpolate(enter, [0, 1], [-2.5, -0.5]);
  } else if (motionMode === 1) {
    tx = interpolate(enter, [0, 1], [-180, 0]) - exit * 60;
    rot = interpolate(enter, [0, 1], [2.2, 0.5]);
  } else if (motionMode === 2) {
    tx = interpolate(enter, [0, 1], [180, 0]) + exit * 60;
    rot = interpolate(enter, [0, 1], [-2.0, -0.4]);
  } else if (motionMode === 3) {
    boxScale = interpolate(enter, [0, 1], [0.84, 1]) * (1 - exit * 0.04);
  } else if (motionMode === 4) {
    ty = interpolate(enter, [0, 1], [-120, 0]) + exit * 40;
    rot = interpolate(enter, [0, 1], [3.0, 0.4]);
  } else if (motionMode === 5) {
    ty = interpolate(enter, [0, 1], [95, 0]);
    boxScale = interpolate(enter, [0, 1], [0.9, 1]);
  } else {
    tx = interpolate(enter, [0, 1], [-120, 0]);
    ty = interpolate(enter, [0, 1], [70, 0]);
  }

  const parallaxBgX = interpolate(frame, [0, durationInFrames], [0, isLast ? 0 : -18]);
  const parallaxFgX = interpolate(frame, [0, durationInFrames], [0, isLast ? 0 : 14]);
  const isClimax = layout === "dramatic_climax";
  const shakeActive = isClimax && frame < 10;
  const shakeX = shakeActive ? Math.sin(frame * 2.8) * 12 : 0;
  const shakeY = shakeActive ? Math.cos(frame * 3.4) * 9 : 0;
  const punchScale = shakeActive ? 1.04 : 1;

  const typeText = `ARCHIVE #${(seed % 900) + 100} • MINDSPARK`;
  const typedCount = Math.min(
    typeText.length,
    Math.floor(interpolate(frame, [2, 24], [0, typeText.length], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))
  );
  const typeCursor = frame % 14 < 7 ? "▌" : "";

  const mediaScale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], {extrapolateRight: "clamp"});
  const highlightPct = interpolate(frame, [3, 18], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const heading = (scene.heading || scene.title || topicTitle).trim();
  const spoken = (scene.tts_text || scene.narration || "").trim();
  const chunks = splitChunks(spoken, 4);
  const chunkIdx =
    chunks.length > 0
      ? Math.min(chunks.length - 1, Math.floor((frame / Math.max(1, durationInFrames)) * chunks.length))
      : 0;
  const activeCaption = chunks[chunkIdx] || "";
  const artQuery = `${heading} ${spoken}`;

  const mapScene: PFScene = {
    text: heading,
    narration: spoken,
    durationSec: scene.durationSec,
    words: scene.words || [{w: heading, s: 0.4, e: Math.max(1.5, scene.durationSec * 0.8)}],
    state: scene.state || geo?.state,
    place: scene.place || (geo?.lat && geo?.lon ? {name: geo.name || geo.state || "", lat: geo.lat, lon: geo.lon} : undefined),
    hit: 0,
    hit2: 0,
    items: [],
  };

  return (
    <AbsoluteFill style={{padding: "68px 54px 78px 54px", justifyContent: "space-between"}}>
      <FloatingParticles frame={frame} accent={accent} seed={seed + index} />

      {/* Top Editorial Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "3px solid #18181B",
          paddingBottom: 12,
          fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
          zIndex: 2,
        }}
      >
        <div style={{display: "flex", alignItems: "center", gap: 12}}>
          <span
            style={{
              backgroundColor: accent,
              color: "#FFFFFF",
              fontWeight: 900,
              fontSize: 23,
              padding: "6px 14px",
              letterSpacing: 1,
            }}
          >
            MINDSPARK
          </span>
          <span style={{color: "#3F3F46", fontSize: 21, fontWeight: 700}}>सत्य • रहस्य • इतिहास</span>
        </div>
        <span style={{color: "#18181B", fontSize: 25, fontWeight: 900, fontFamily: "monospace"}}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* Headline with Animated Amber Highlighter Sweep */}
      <div style={{marginTop: 14, marginBottom: 10, zIndex: 2}}>
        <div
          style={{
            position: "relative",
            display: "inline-block",
            padding: "6px 16px",
            fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 6,
              bottom: 4,
              width: `${highlightPct}%`,
              backgroundColor: "#F59E0B",
              opacity: 0.44,
              zIndex: 0,
            }}
          />
          <div style={{position: "relative", zIndex: 1, fontSize: 44, lineHeight: 1.24, fontWeight: 900, color: "#18181B"}}>
            {heading}
          </div>
        </div>
      </div>

      {/* MIDGROUND: Consistent 972x1020 stage box with pure SVG + MapItem */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 1020,
          flexShrink: 0,
          marginTop: 6,
          marginBottom: 18,
          transform: `translate(${tx + shakeX + parallaxBgX * 0.3}px, ${ty + shakeY}px) rotate(${rot}deg) scale(${boxScale * punchScale})`,
          zIndex: 2,
        }}
      >
        {layout === "geo_map" && (
          <div style={{position: "relative", width: "100%", height: "100%"}}>
            <div style={{position: "absolute", inset: 0, transform: "translate(14px, 14px)", backgroundColor: accent}} />
            <div style={{position: "relative", width: "100%", height: "100%", border: "5px solid #18181B", overflow: "hidden", backgroundColor: "#bcd3cf"}}>
              <MapItem s={mapScene} lf={frame} fps={fps} accent="#D92D20" accentDark="#991B1B" w={972} h={1020} />
              <div
                style={{
                  position: "absolute",
                  right: 22,
                  bottom: 22,
                  width: 300,
                  backgroundColor: "#FFFFFF",
                  padding: "12px 12px 32px 12px",
                  border: "4px solid #18181B",
                  boxShadow: "10px 10px 0px #18181B",
                  transform: `translateX(${parallaxFgX}px) rotate(2deg)`,
                }}
              >
                <div style={{width: "100%", height: 290, overflow: "hidden", border: "2px solid #18181B"}}>
                  <SvgEditorialArt text={artQuery} index={index} accent={accent} frame={frame} scale={mediaScale} />
                </div>
                <div style={{marginTop: 8, fontSize: 16, fontWeight: 900, fontFamily: "monospace", color: "#18181B"}}>
                  {typeText.slice(0, typedCount)}{typeCursor}
                </div>
              </div>
            </div>
          </div>
        )}

        {layout === "paper_cut_scroll" && (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              backgroundColor: "#FBF7EE",
              border: "4px solid #18181B",
              boxShadow: "14px 14px 0px rgba(24,24,27,0.25)",
              padding: "36px 28px 28px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -16,
                left: "50%",
                transform: "translateX(-50%) rotate(-1.5deg)",
                width: 210,
                height: 36,
                backgroundColor: "rgba(245, 158, 11, 0.55)",
                border: "1px solid rgba(24,24,27,0.25)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 18,
                right: 24,
                border: `4px solid ${accent}`,
                color: accent,
                padding: "4px 14px",
                fontWeight: 900,
                fontSize: 24,
                transform: "rotate(6deg)",
                backgroundColor: "#FBF7EE",
                zIndex: 4,
              }}
            >
              गाथा
            </div>
            <div style={{flex: 1, position: "relative", border: "4px solid #18181B", overflow: "hidden"}}>
              <SvgEditorialArt text={artQuery} index={index} accent={accent} frame={frame} scale={mediaScale} />
            </div>
          </div>
        )}

        {layout === "newspaper_oped" && (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              backgroundColor: "#FAF6EC",
              border: "4px solid #18181B",
              boxShadow: `14px 14px 0px ${accent}`,
              padding: 26,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{borderBottom: "2px solid #18181B", paddingBottom: 8, display: "flex", justifyContent: "space-between", fontSize: 21, fontWeight: 800, color: "#52525B", fontFamily: "monospace"}}>
              <span>भारत इतिहास अभिलेख</span>
              <span>{typeText.slice(0, typedCount)}{typeCursor}</span>
            </div>
            <div style={{flex: 1, position: "relative", border: "3px solid #18181B", overflow: "hidden"}}>
              <SvgEditorialArt text={artQuery} index={index} accent={accent} frame={frame} scale={mediaScale} />
              <AbsoluteFill
                style={{
                  background: "radial-gradient(circle at 50% 45%, transparent 32%, rgba(0,0,0,0.45) 95%)",
                  pointerEvents: "none",
                }}
              />
            </div>
            <div style={{position: "relative", backgroundColor: "rgba(245,158,11,0.32)", borderLeft: `6px solid ${accent}`, padding: "10px 16px", fontSize: 28, fontWeight: 800, color: "#18181B"}}>
              “{spoken.slice(0, 72)}{spoken.length > 72 ? "…" : ""}”
            </div>
          </div>
        )}

        {layout === "detective_board" && (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              backgroundColor: "#D6B88C",
              border: "5px solid #18181B",
              boxShadow: "12px 12px 0px #18181B",
              padding: 26,
              overflow: "hidden",
            }}
          >
            <svg width="100%" height="100%" style={{position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none"}}>
              <line
                x1="180" y1="120" x2="760" y2="740"
                stroke="#D92D20" strokeWidth="6" strokeDasharray="1000"
                strokeDashoffset={interpolate(frame, [4, 24], [1000, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}
              />
              <circle cx="180" cy="120" r="12" fill="#D92D20" stroke="#18181B" strokeWidth="3" />
              <circle cx="760" cy="740" r="12" fill="#D92D20" stroke="#18181B" strokeWidth="3" />
            </svg>
            <div style={{position: "relative", width: "84%", height: "72%", margin: "18px auto 0 auto", border: "4px solid #18181B", backgroundColor: "#FFF", padding: 14, transform: "rotate(-1.5deg)", boxShadow: "8px 8px 0px rgba(0,0,0,0.3)"}}>
              <div style={{width: "100%", height: "100%", overflow: "hidden"}}>
                <SvgEditorialArt text={artQuery} index={index} accent={accent} frame={frame} scale={mediaScale} />
              </div>
            </div>
            <div style={{position: "absolute", bottom: 26, left: 32, backgroundColor: "#FEF08A", border: "3px solid #18181B", padding: "12px 18px", fontSize: 26, fontWeight: 900, transform: "rotate(2deg)", boxShadow: "6px 6px 0px #18181B", zIndex: 4}}>
              📌 {heading.slice(0, 34)}
            </div>
          </div>
        )}

        {layout === "dramatic_climax" && (
          <div style={{position: "relative", width: "100%", height: "100%"}}>
            <div style={{position: "absolute", inset: 0, transform: `translate(${shakeActive ? -10 : 10}px, 10px)`, backgroundColor: "#D92D20"}} />
            <div style={{position: "relative", width: "100%", height: "100%", border: "5px solid #18181B", overflow: "hidden", backgroundColor: "#000"}}>
              <SvgEditorialArt text={artQuery} index={index} accent={accent} frame={frame} scale={mediaScale * 1.03} />
              <AbsoluteFill
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, transparent 2px, transparent 6px)",
                  pointerEvents: "none",
                }}
              />
              <AbsoluteFill
                style={{
                  background: "radial-gradient(circle at 20% 20%, rgba(245,158,11,0.32), transparent 55%)",
                  mixBlendMode: "screen",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        )}

        {layout === "kinetic_split" && (
          <div style={{position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 16}}>
            <div style={{height: 82, backgroundColor: accent, border: "4px solid #18181B", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", color: "#FFFFFF", fontWeight: 900, fontSize: 34}}>
              <span>अध्याय {index + 1}</span>
              <span>MINDSPARK</span>
            </div>
            <div style={{flex: 1, position: "relative", border: "5px solid #18181B", boxShadow: "12px 12px 0px #18181B", overflow: "hidden"}}>
              <SvgEditorialArt text={artQuery} index={index} accent={accent} frame={frame} scale={mediaScale} />
            </div>
          </div>
        )}

        {layout === "polaroid_stack" && (
          <div style={{position: "relative", width: "100%", height: "100%"}}>
            <div style={{position: "absolute", inset: 14, backgroundColor: "#E7DFCF", border: "4px solid #18181B", transform: "rotate(-3.5deg)"}} />
            <div style={{position: "relative", width: "100%", height: "100%", backgroundColor: "#FFFFFF", border: "4px solid #18181B", padding: "20px 20px 64px 20px", boxShadow: "12px 12px 0px rgba(24,24,27,0.3)", transform: "rotate(1.2deg)"}}>
              <div style={{width: "100%", height: "100%", border: "3px solid #18181B", overflow: "hidden"}}>
                <SvgEditorialArt text={artQuery} index={index} accent={accent} frame={frame} scale={mediaScale} />
              </div>
            </div>
          </div>
        )}

        {(layout === "hero_cutout" || layout === "pullback_cta") && (
          <div style={{position: "relative", width: "100%", height: "100%"}}>
            <div style={{position: "absolute", inset: 0, transform: "translate(16px, 16px)", backgroundColor: accent}} />
            <div style={{position: "relative", width: "100%", height: "100%", border: "5px solid #18181B", backgroundColor: "#18181B", overflow: "hidden"}}>
              <SvgEditorialArt text={artQuery} index={index} accent={accent} frame={frame} scale={mediaScale} />
            </div>
          </div>
        )}
      </div>

      {/* Foreground Synced Devanagari Caption Bar + Chips/CTA */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
          zIndex: 2,
        }}
      >
        {activeCaption ? (
          <div
            style={{
              backgroundColor: "#18181B",
              color: "#FFFFFF",
              borderLeft: `10px solid ${accent}`,
              padding: "16px 26px",
              fontSize: 42,
              fontWeight: 800,
              lineHeight: 1.3,
              textAlign: "center",
              boxShadow: "8px 8px 0px rgba(24,24,27,0.22)",
              maxWidth: "96%",
            }}
          >
            {activeCaption}
          </div>
        ) : null}

        {isLast ? (
          <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 10}}>
            {hashtags && hashtags.length > 0 ? (
              <div style={{display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8}}>
                {hashtags.slice(0, 4).map((tag, ti) => (
                  <span
                    key={ti}
                    style={{
                      backgroundColor: "#FBF7EE",
                      color: "#18181B",
                      border: "2px solid #18181B",
                      padding: "4px 12px",
                      fontSize: 22,
                      fontWeight: 800,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div
              style={{
                backgroundColor: "#D92D20",
                color: "#FFFFFF",
                padding: "10px 26px",
                fontSize: 30,
                fontWeight: 900,
                border: "3px solid #18181B",
                boxShadow: "5px 5px 0px #18181B",
              }}
            >
              🔔 SUBSCRIBE • MINDSPARK
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const VoxEditorial: React.FC<VoxEditorialProps> = ({
  topicTitle,
  scenes,
  seed = 1234,
  geo = null,
  hashtags = [],
}) => {
  const {fps} = useVideoConfig();
  let offset = 0;

  return (
    <AbsoluteFill>
      {scenes.map((scene, i) => {
        const dur = Math.max(15, Math.round((scene.durationSec || 4) * fps));
        const from = offset;
        offset += dur;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <EditorialPaperBackground seed={seed} sceneIdx={i} />
            <SceneSlide
              scene={scene}
              index={i}
              total={scenes.length}
              topicTitle={topicTitle}
              seed={seed}
              geo={geo}
              hashtags={hashtags}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
