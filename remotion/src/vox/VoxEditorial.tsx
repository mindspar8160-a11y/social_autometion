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

export interface VoxEditorialScene {
  heading?: string;
  title?: string;
  narration: string;
  tts_text?: string;
  durationSec: number;
  mediaSrc: string; // relative path inside remotion/public/
  isVideo?: boolean;
}

export interface VoxEditorialProps {
  topicTitle: string;
  scenes: VoxEditorialScene[];
  seed?: number;
}

export const totalFramesVoxEditorial = (scenes: VoxEditorialScene[], fps = 30) =>
  Math.max(30, scenes.reduce((sum, s) => sum + Math.max(15, Math.round((s.durationSec || 4) * fps)), 0));

const ACCENTS = ["#D92D20", "#F59E0B", "#1D4ED8", "#0F766E"];

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

const EditorialPaperBackground: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#F3EFE6",
      backgroundImage: `
        linear-gradient(to right, rgba(24, 24, 27, 0.055) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(24, 24, 27, 0.055) 1px, transparent 1px)
      `,
      backgroundSize: "54px 54px",
    }}
  >
    {/* Subtle warm vignette */}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.22) 0%, rgba(214,205,188,0.35) 100%)",
      }}
    />
  </AbsoluteFill>
);

const SceneSlide: React.FC<{
  scene: VoxEditorialScene;
  index: number;
  total: number;
  topicTitle: string;
}> = ({scene, index, total, topicTitle}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const accent = ACCENTS[index % ACCENTS.length];
  const isEven = index % 2 === 0;
  const isLast = index === total - 1;

  // Snappy Vox-style entrance
  const enter = spring({
    frame,
    fps,
    config: {damping: 14, stiffness: 180, mass: 0.8},
  });

  // Slide-out on last 6 frames for crisp editorial cut
  const exit = interpolate(frame, [Math.max(0, durationInFrames - 6), durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(enter, [0, 1], [isEven ? 90 : -90, 0]) - exit * 40;
  const rotateDeg = interpolate(enter, [0, 1], [isEven ? -2.2 : 2.2, isEven ? -0.6 : 0.6]);
  const mediaScale = interpolate(frame, [0, durationInFrames], [1.0, 1.09], {
    extrapolateRight: "clamp",
  });

  // Animated amber highlighter sweep behind headline
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

  return (
    <AbsoluteFill style={{padding: "74px 58px 86px 58px", justifyContent: "space-between"}}>
      {/* Top Editorial Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "3px solid #18181B",
          paddingBottom: 14,
          fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
        }}
      >
        <div style={{display: "flex", alignItems: "center", gap: 12}}>
          <span
            style={{
              backgroundColor: accent,
              color: "#FFFFFF",
              fontWeight: 900,
              fontSize: 24,
              padding: "6px 14px",
              letterSpacing: 1,
            }}
          >
            MINDSPARK
          </span>
          <span style={{color: "#3F3F46", fontSize: 22, fontWeight: 700}}>सत्य • रहस्य • इतिहास</span>
        </div>
        <span style={{color: "#18181B", fontSize: 26, fontWeight: 900, fontFamily: "monospace"}}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* Headline with Animated Amber Highlighter Sweep */}
      <div style={{marginTop: 18, marginBottom: 14}}>
        <div
          style={{
            position: "relative",
            display: "inline-block",
            padding: "8px 18px",
            fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 8,
              bottom: 6,
              width: `${highlightPct}%`,
              backgroundColor: "#F59E0B",
              opacity: 0.42,
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              fontSize: 46,
              lineHeight: 1.25,
              fontWeight: 900,
              color: "#18181B",
            }}
          >
            {heading}
          </div>
        </div>
      </div>

      {/* Midground Cutout Frame with Offset Red/Amber Marker Backing */}
      <div
        style={{
          position: "relative",
          flex: 1,
          marginTop: 8,
          marginBottom: 24,
          transform: `translateY(${translateY}px) rotate(${rotateDeg}deg)`,
        }}
      >
        {/* Offset Marker Stroke Block */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: "translate(16px, 16px)",
            backgroundColor: accent,
          }}
        />
        {/* Crisp Ink Cutout Frame */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            border: "5px solid #18181B",
            backgroundColor: "#18181B",
            overflow: "hidden",
          }}
        >
          {scene.isVideo ? (
            <OffthreadVideo
              src={srcUrl}
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${mediaScale})`,
              }}
            />
          ) : (
            <Img
              src={srcUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${mediaScale})`,
              }}
            />
          )}
          {/* Subtle halftone / editorial print dot overlay */}
          <AbsoluteFill
            style={{
              backgroundImage: "radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)",
              backgroundSize: "6px 6px",
              opacity: 0.25,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* Foreground Synced Devanagari Caption Bar */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
        }}
      >
        {activeCaption ? (
          <div
            style={{
              backgroundColor: "#18181B",
              color: "#FFFFFF",
              borderLeft: `10px solid ${accent}`,
              padding: "18px 28px",
              fontSize: 44,
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
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const VoxEditorial: React.FC<VoxEditorialProps> = ({topicTitle, scenes}) => {
  const {fps} = useVideoConfig();
  let offset = 0;

  return (
    <AbsoluteFill>
      <EditorialPaperBackground />
      {scenes.map((scene, i) => {
        const dur = Math.max(15, Math.round((scene.durationSec || 4) * fps));
        const from = offset;
        offset += dur;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <SceneSlide
              scene={scene}
              index={i}
              total={scenes.length}
              topicTitle={topicTitle}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
