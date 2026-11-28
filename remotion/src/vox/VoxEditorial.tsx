import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
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
  mediaSrc: string;
  isVideo?: boolean;
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

const MediaBox: React.FC<{src: string; isVideo?: boolean; scale: number; filter?: string}> = ({
  src,
  isVideo,
  scale,
  filter,
}) => (
  <>
    {isVideo ? (
      <OffthreadVideo
        src={src}
        muted
        style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})`, filter}}
      />
    ) : (
      <Img
        src={src}
        style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})`, filter}}
      />
    )}
    <AbsoluteFill
      style={{
        backgroundImage: "radial-gradient(rgba(0,0,0,0.14) 1px, transparent 1px)",
        backgroundSize: "6px 6px",
        opacity: 0.24,
        pointerEvents: "none",
      }}
    />
  </>
);

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

  // Pick distinct layout per scene:
  // Any scene mentioning a place/state -> geo_map!
  // Scene 0: hero_cutout | Last: pullback_cta | Others: cycle varied layouts
  let layout: string = scene.layout || LAYOUTS[(index + seed) % LAYOUTS.length];
  if (index === 0) layout = "hero_cutout";
  else if (scene.state || scene.place || (index === 1 && geo?.state)) layout = "geo_map";
  else if (isLast) layout = "pullback_cta";

  // 7 distinct entrance motions
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

  // 2.5D Parallax + Camera Shake + Embers / Light Leak
  const parallaxBgX = interpolate(frame, [0, durationInFrames], [0, isLast ? 0 : -18]);
  const parallaxFgX = interpolate(frame, [0, durationInFrames], [0, isLast ? 0 : 14]);
  const isClimax = layout === "dramatic_climax";
  const shakeActive = isClimax && frame < 10;
  const shakeX = shakeActive ? Math.sin(frame * 2.8) * 12 : 0;
  const shakeY = shakeActive ? Math.cos(frame * 3.4) * 9 : 0;
  const punchScale = shakeActive ? 1.04 : 1;

  // Typewriter reveal for archive/date tag
  const typeText = `ARCHIVE #${(seed % 900) + 100} • MINDSPARK`;
  const typedCount = Math.min(typeText.length, Math.floor(interpolate(frame, [2, 24], [0, typeText.length], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})));
  const typeCursor = frame % 14 < 7 ? "▌" : "";

  const mediaScale = interpolate(frame, [0, durationInFrames], [1.0, 1.12], {extrapolateRight: "clamp"});
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
  const srcUrl = staticFile(scene.mediaSrc);

  // Build synthetic PFScene for MapItem when geo_map is active
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

      {/* MIDGROUND: Consistent 972x1020 stage box across all scenes */}
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
              <MapItem s={mapScene} lf={frame} fps={fps} accent="#D92D20" accentDark="#991B1B" w={972} h={1080} />
              {/* Polaroid Cutout Inset + Typewriter Location Tag */}
              <div
                style={{
                  position: "absolute",
                  right: 22,
                  bottom: 22,
                  width: 320,
                  backgroundColor: "#FFFFFF",
                  padding: "12px 12px 36px 12px",
                  border: "4px solid #18181B",
                  boxShadow: "10px 10px 0px #18181B",
                  transform: `translateX(${parallaxFgX}px) rotate(2deg)`,
                }}
              >
                <div style={{width: "100%", height: 340, overflow: "hidden", border: "2px solid #18181B", position: "relative"}}>
                  <MediaBox src={srcUrl} isVideo={scene.isVideo} scale={mediaScale} />
                </div>
                <div style={{marginTop: 8, fontSize: 17, fontWeight: 900, fontFamily: "monospace", color: "#18181B"}}>
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
            {/* Masking Tape Strip */}
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
            {/* Stamp */}
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
              <MediaBox src={srcUrl} isVideo={scene.isVideo} scale={mediaScale} />
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
              <MediaBox src={srcUrl} isVideo={scene.isVideo} scale={mediaScale} filter="contrast(1.08) sepia(0.12)" />
              {/* Spotlight Focus vignette */}
              <AbsoluteFill
                style={{
                  background: "radial-gradient(circle at 50% 45%, transparent 32%, rgba(0,0,0,0.48) 95%)",
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
            {/* Animated Red Thread SVG connecting two pinned notes */}
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
              <div style={{width: "100%", height: "100%", position: "relative", overflow: "hidden"}}>
                <MediaBox src={srcUrl} isVideo={scene.isVideo} scale={mediaScale} />
              </div>
            </div>
            <div style={{position: "absolute", bottom: 26, left: 32, backgroundColor: "#FEF08A", border: "3px solid #18181B", padding: "12px 18px", fontSize: 26, fontWeight: 900, transform: "rotate(2deg)", boxShadow: "6px 6px 0px #18181B", zIndex: 4}}>
              📌 {heading.slice(0, 34)}
            </div>
          </div>
        )}

        {layout === "dramatic_climax" && (
          <div style={{position: "relative", width: "100%", height: "100%"}}>
            {/* RGB Split / CRT Glitch offset layers */}
            <div style={{position: "absolute", inset: 0, transform: `translate(${shakeActive ? -10 : 10}px, 10px)`, backgroundColor: "#D92D20"}} />
            <div style={{position: "relative", width: "100%", height: "100%", border: "5px solid #18181B", overflow: "hidden", backgroundColor: "#000"}}>
              <MediaBox src={srcUrl} isVideo={scene.isVideo} scale={mediaScale * 1.03} filter="contrast(1.16) saturate(1.15)" />
              {/* CRT Scanlines */}
              <AbsoluteFill
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, transparent 2px, transparent 6px)",
                  pointerEvents: "none",
                }}
              />
              {/* Warm golden light flare */}
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
              <MediaBox src={srcUrl} isVideo={scene.isVideo} scale={mediaScale} />
            </div>
          </div>
        )}

        {layout === "polaroid_stack" && (
          <div style={{position: "relative", width: "100%", height: "100%"}}>
            {/* Rotated Back Card */}
            <div
              style={{
                position: "absolute",
                inset: 14,
                backgroundColor: "#E7DFCF",
                border: "4px solid #18181B",
                transform: "rotate(-3.5deg)",
              }}
            />
            {/* Front Polaroid Card */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor: "#FFFFFF",
                border: "4px solid #18181B",
                padding: "20px 20px 64px 20px",
                boxShadow: "12px 12px 0px rgba(24,24,27,0.3)",
                transform: "rotate(1.2deg)",
              }}
            >
              <div style={{width: "100%", height: "100%", position: "relative", border: "3px solid #18181B", overflow: "hidden"}}>
                <MediaBox src={srcUrl} isVideo={scene.isVideo} scale={mediaScale} />
              </div>
            </div>
          </div>
        )}

        {(layout === "hero_cutout" || layout === "pullback_cta") && (
          <div style={{position: "relative", width: "100%", height: "100%"}}>
            <div style={{position: "absolute", inset: 0, transform: "translate(16px, 16px)", backgroundColor: accent}} />
            <div style={{position: "relative", width: "100%", height: "100%", border: "5px solid #18181B", backgroundColor: "#18181B", overflow: "hidden"}}>
              <MediaBox src={srcUrl} isVideo={scene.isVideo} scale={mediaScale} />
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
