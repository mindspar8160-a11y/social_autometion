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
  // Scene 0: hero_cutout | Scene 1 (if geo): geo_map | Last: pullback_cta | Others: cycle varied layouts
  let layout: string = scene.layout || LAYOUTS[(index + seed) % LAYOUTS.length];
  if (index === 0) layout = "hero_cutout";
  else if (index === 1 && geo?.state) layout = "geo_map";
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

  const mediaScale = interpolate(frame, [0, durationInFrames], [1.0, 1.1], {extrapolateRight: "clamp"});
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

      {/* MIDGROUND: 6 Distinct Visual Layouts */}
      <div
        style={{
          position: "relative",
          flex: 1,
          marginTop: 6,
          marginBottom: 20,
          transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${boxScale})`,
          zIndex: 2,
        }}
      >
        {layout === "geo_map" && (
          <div style={{position: "relative", width: "100%", height: "100%"}}>
            <div style={{position: "absolute", inset: 0, transform: "translate(14px, 14px)", backgroundColor: accent}} />
            <div style={{position: "relative", width: "100%", height: "100%", border: "5px solid #18181B", overflow: "hidden", backgroundColor: "#bcd3cf"}}>
              <MapItem s={mapScene} lf={frame} fps={fps} accent="#D92D20" accentDark="#991B1B" w={972} h={1080} />
              {/* Floating Cutout Inset of AI Media */}
              <div
                style={{
                  position: "absolute",
                  right: 24,
                  bottom: 24,
                  width: 320,
                  height: 400,
                  border: "4px solid #18181B",
                  boxShadow: "10px 10px 0px #18181B",
                  overflow: "hidden",
                  transform: "rotate(2deg)",
                }}
              >
                <MediaBox src={srcUrl} isVideo={scene.isVideo} scale={mediaScale} />
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
            <div style={{borderBottom: "2px solid #18181B", paddingBottom: 8, display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 800, color: "#52525B"}}>
              <span>भारत इतिहास अभिलेख</span>
              <span>ARCHIVE #{seed % 900 + 100}</span>
            </div>
            <div style={{flex: 1, position: "relative", border: "3px solid #18181B", overflow: "hidden"}}>
              <MediaBox src={srcUrl} isVideo={scene.isVideo} scale={mediaScale} filter="contrast(1.08) sepia(0.12)" />
            </div>
            <div style={{backgroundColor: "rgba(245,158,11,0.28)", borderLeft: `6px solid ${accent}`, padding: "10px 16px", fontSize: 28, fontWeight: 800, color: "#18181B"}}>
              “{spoken.slice(0, 72)}{spoken.length > 72 ? "…" : ""}”
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
