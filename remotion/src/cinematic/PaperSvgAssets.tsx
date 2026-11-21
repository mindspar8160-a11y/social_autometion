import React from "react";
import { interpolate } from "remotion";

/* 
 * MINDSPARK SANJHI & PAPER-CRAFT ASSETS
 * Designed to match MapItem.tsx EXACTLY:
 * 1. Palette: Cream (#fbf5e6), Kraft Parchment (#efe3c6, #e3d3ab, #dcc9a0), Deep Ink (#1d1b1a), Terracotta Red (#d8452e), Antique Gold (#d4aa48).
 * 2. Physical paper drop shadow layer offset behind every piece (fill="#7a6a4a", opacity=0.55).
 * 3. Thick cream paper cut border (stroke="#fbf5e6" strokeWidth={3.5} strokeLinejoin="round").
 * 4. Genuine handcrafted layered paper look (like traditional Sanjhi paper-cut art).
 */

const PALETTE = ["#efe3c6", "#e3d3ab", "#f6eed8", "#dcc9a0", "#ead9b3"];
const CREAM = "#fbf5e6";
const INK = "#1d1b1a";
const SHADOW = "#7a6a4a";
const RED = "#d8452e";
const RED_DARK = "#9c2c1b";
const GOLD = "#c89b3c";

/* ------------------------------------------------------------------ 1. PAPER TEMPLE CUTOUT */
export const PaperTempleCutout: React.FC<{ progress: number; width?: number; height?: number }> = ({ progress, width = 680, height = 540 }) => {
  const p = Math.max(0, Math.min(1, progress));
  const s = interpolate(p, [0, 1], [0.88, 1]);

  return (
    <div style={{ width, height, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "flex-end", transform: `scale(${s})`, opacity: p }}>
      <svg width={width} height={height} viewBox="0 0 680 540" style={{ overflow: "visible" }}>
        {/* Layer 0: Physical Paper Shadow Layer (Exact Map Style offset) */}
        <g transform="translate(9, 12)" fill={SHADOW} opacity={0.52}>
          {/* Base Steps */}
          <path d="M50,520 L630,520 L610,485 L70,485 Z" />
          <path d="M90,485 L590,485 L570,450 L110,450 Z" />
          <path d="M130,450 L550,450 L530,415 L150,415 Z" />
          {/* Main Vimana Tiers */}
          <path d="M190,415 L490,415 L470,330 L210,330 Z" />
          <path d="M210,330 L470,330 L445,245 L235,245 Z" />
          <path d="M235,245 L445,245 L415,160 L265,160 Z" />
          <path d="M265,160 L415,160 L385,85 L295,85 Z" />
          {/* Amlaka & Kalash */}
          <ellipse cx={340} cy={72} rx={52} ry={18} />
          <path d="M326,70 Q320,38 340,30 Q360,38 354,70 Z" />
          <polygon points="340,5 334,30 346,30" />
          {/* Saffron Flag */}
          <path d="M340,-45 Q385,-32 430,-42 L405,-18 Q375,-28 340,-16 Z" />
        </g>

        {/* Layer 1: The Handcrafted Paper Cutout Pieces */}
        {/* Step 1 */}
        <path d="M50,520 L630,520 L610,485 L70,485 Z" fill={PALETTE[3]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
        {/* Step 2 */}
        <path d="M90,485 L590,485 L570,450 L110,450 Z" fill={PALETTE[1]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
        {/* Step 3 */}
        <path d="M130,450 L550,450 L530,415 L150,415 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />

        {/* Pillars / Mandapa Cutouts */}
        {[-150, -75, 75, 150].map((px, i) => (
          <g key={i} transform={`translate(${340 + px}, 415)`}>
            <rect x={-14} y={-100} width={28} height={100} rx={3} fill={PALETTE[4]} stroke={CREAM} strokeWidth={3} />
            <rect x={-20} y={-108} width={40} height={12} rx={3} fill={GOLD} stroke={CREAM} strokeWidth={2.5} />
          </g>
        ))}

        {/* Inner Sanctum / Garbhagriha Arch */}
        <path d="M275,415 L275,340 Q340,300 405,340 L405,415 Z" fill="#352618" stroke={CREAM} strokeWidth={4} />
        {/* Sacred Golden Jyoti flame */}
        <ellipse cx={340} cy={375} rx={16} ry={24} fill="#ffeaa7" stroke={GOLD} strokeWidth={2.5} />

        {/* Layered Pyramidal Stone Shikhar (4 Tiers of Cut Paper) */}
        <path d="M190,415 L490,415 L470,330 L210,330 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
        <path d="M210,330 L470,330 L445,245 L235,245 Z" fill={PALETTE[1]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
        <path d="M235,245 L445,245 L415,160 L265,160 Z" fill={PALETTE[2]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
        <path d="M265,160 L415,160 L385,85 L295,85 Z" fill={PALETTE[4]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />

        {/* Flanking Urushringa Miniature Shikhars */}
        <path d="M165,340 Q195,260 225,340 Z" fill={PALETTE[3]} stroke={CREAM} strokeWidth={3} strokeLinejoin="round" />
        <path d="M455,340 Q485,260 515,340 Z" fill={PALETTE[3]} stroke={CREAM} strokeWidth={3} strokeLinejoin="round" />

        {/* Traditional Amlaka Stone Disk */}
        <ellipse cx={340} cy={72} rx={52} ry={18} fill={GOLD} stroke={CREAM} strokeWidth={3.5} />
        <ellipse cx={340} cy={66} rx={38} ry={12} fill="#ffdd66" stroke={CREAM} strokeWidth={2.5} />

        {/* Golden Kalash & Stupi */}
        <path d="M326,70 Q320,38 340,30 Q360,38 354,70 Z" fill={GOLD} stroke={CREAM} strokeWidth={3} />
        <circle cx={340} cy={22} r={9} fill={CREAM} stroke={GOLD} strokeWidth={2.5} />
        <polygon points="340,5 334,30 346,30" fill={GOLD} stroke={CREAM} strokeWidth={2} />

        {/* Fluttering Sacred Saffron Dhwaja */}
        <g transform="translate(340, 5)">
          <line x1={0} y1={0} x2={0} y2={-55} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
          <path d="M0,-55 Q45,-42 90,-52 L65,-28 Q35,-38 0,-26 Z" fill={RED} stroke={RED_DARK} strokeWidth={2.5} strokeLinejoin="round" />
          {/* Sacred Sun Symbol on flag */}
          <circle cx={30} cy={-40} r={6} fill={CREAM} />
        </g>
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ 2. PAPER ANCIENT NAGARI / FORT CUTOUT */
export const PaperCityCutout: React.FC<{ progress: number; width?: number; height?: number }> = ({ progress, width = 720, height = 480 }) => {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div style={{ width, height, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "flex-end", opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
      <svg width={width} height={height} viewBox="0 0 720 480" style={{ overflow: "visible" }}>
        {/* Layer 0: Shadow Layer */}
        <g transform="translate(8, 11)" fill={SHADOW} opacity={0.5}>
          <path d="M0,480 Q90,445 180,480 T360,480 T540,480 T720,480 L720,420 Q540,390 360,420 T0,420 Z" />
          <path d="M40,410 L680,410 L680,280 L40,280 Z" />
          {/* Watchtower shadows */}
          <rect x={70} y={130} width={90} height={160} />
          <rect x={560} y={130} width={90} height={160} />
          <rect x={280} y={90} width={160} height={190} />
        </g>

        {/* Ocean Waves below city in Muted Paper Teal/Slate */}
        <path d="M0,480 Q90,445 180,480 T360,480 T540,480 T720,480 L720,420 Q540,390 360,420 T0,420 Z" fill="#9dbfc4" stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M0,445 Q90,415 180,445 T360,445 T540,445 T720,445 L720,390 Q540,360 360,390 T0,390 Z" fill="#b9d6d8" stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />

        {/* Walled Ramparts / Fort Battlement (Paper Cutout) */}
        <path d="M40,400 L680,400 L680,280 L40,280 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
        {/* Fort Kanguras / Crenellations */}
        {[0, 64, 128, 192, 256, 320, 384, 448, 512, 576].map((kx, i) => (
          <rect key={i} x={58 + kx} y={260} width={42} height={24} rx={3} fill={PALETTE[1]} stroke={CREAM} strokeWidth={3} />
        ))}

        {/* Central Torana Gateway */}
        <path d="M310,400 L310,310 Q360,265 410,310 L410,400 Z" fill="#443224" stroke={CREAM} strokeWidth={3.5} />

        {/* Flanking Palace Towers in Paper Layers */}
        <g transform="translate(115, 140)">
          <rect x={-45} y={0} width={90} height={140} fill={PALETTE[2]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M-60,0 Q0,-75 60,0 Z" fill={RED} stroke={RED_DARK} strokeWidth={3} strokeLinejoin="round" />
          <circle cx={0} cy={-80} r={8} fill={GOLD} stroke={CREAM} strokeWidth={2} />
        </g>
        <g transform="translate(605, 140)">
          <rect x={-45} y={0} width={90} height={140} fill={PALETTE[2]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M-60,0 Q0,-75 60,0 Z" fill={RED} stroke={RED_DARK} strokeWidth={3} strokeLinejoin="round" />
          <circle cx={0} cy={-80} r={8} fill={GOLD} stroke={CREAM} strokeWidth={2} />
        </g>

        {/* Central Royal Golden Palace Dome */}
        <g transform="translate(360, 90)">
          <rect x={-75} y={40} width={150} height={150} fill={PALETTE[3]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
          <path d="M-95,40 Q0,-80 95,40 Z" fill={GOLD} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={0} cy={-85} r={14} fill={CREAM} stroke={GOLD} strokeWidth={3} />
          <polygon points="0,-115 -8,-85 8,-85" fill={GOLD} stroke={CREAM} strokeWidth={2} />
          <path d="M0,-115 L50,-100 L0,-88 Z" fill={RED} stroke={RED_DARK} strokeWidth={2} />
        </g>
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ 3. PAPER CHAR DHAM SHRINES (Map Craft Style) */
export const PaperCharDhamCutout: React.FC<{ progress: number; width?: number; height?: number }> = ({ progress, width = 760, height = 480 }) => {
  const p = Math.max(0, Math.min(1, progress));
  const dhams = [
    { name: "बद्रीनाथ", dir: "उत्तर", accent: RED },
    { name: "द्वारका", dir: "पश्चिम", accent: "#1f8a87" },
    { name: "जगन्नाथ पुरी", dir: "पूर्व", accent: GOLD },
    { name: "रामेश्वरम", dir: "दक्षिण", accent: "#8a4f2a" },
  ];

  return (
    <div style={{ width, height, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px", opacity: p, transform: `scale(${interpolate(p, [0, 1], [0.92, 1])})` }}>
      {dhams.map((d, i) => {
        const itemP = Math.max(0, Math.min(1, (p - i * 0.16) / 0.36));
        return (
          <div
            key={i}
            style={{
              background: PALETTE[i % PALETTE.length],
              border: `3px solid ${CREAM}`,
              borderRadius: 14,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 18,
              transform: `translateY(${(1 - itemP) * 36}px) scale(${itemP})`,
              opacity: itemP,
              boxShadow: "0 10px 18px rgba(50,30,15,0.22), inset 0 0 0 2px rgba(255,255,255,0.6)",
              position: "relative",
            }}
          >
            {/* Handcut paper shrine silhouette inside card */}
            <svg width={76} height={84} viewBox="0 0 76 84" style={{ flexShrink: 0 }}>
              <g transform="translate(4, 5)" fill={SHADOW} opacity={0.45}>
                <path d="M12,78 L64,78 L56,52 L20,52 Z" />
                <path d="M20,52 L56,52 L48,26 L28,26 Z" />
                <path d="M28,26 Q38,8 48,26 Z" />
              </g>
              <path d="M12,78 L64,78 L56,52 L20,52 Z" fill={PALETTE[2]} stroke={CREAM} strokeWidth={2.5} strokeLinejoin="round" />
              <path d="M20,52 L56,52 L48,26 L28,26 Z" fill={d.accent} stroke={CREAM} strokeWidth={2.5} strokeLinejoin="round" />
              <path d="M28,26 Q38,8 48,26 Z" fill={GOLD} stroke={CREAM} strokeWidth={2.5} strokeLinejoin="round" />
              <circle cx={38} cy={8} r={4.5} fill={CREAM} stroke={GOLD} strokeWidth={2} />
              <path d="M38,8 L52,2 L38,14 Z" fill={RED} />
            </svg>
            <div>
              <div style={{ fontFamily: "'PF Display','Mukta',serif", fontSize: 42, fontWeight: 700, color: INK, lineHeight: 1.1 }}>{d.name}</div>
              <div style={{ fontFamily: "'PF Bold','Mukta',sans-serif", fontSize: 24, color: d.accent, marginTop: 4, letterSpacing: 1 }}>{d.dir} धाम</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ 4. PAPER DWARKADHISH / SANJHI ART CUTOUT */
export const PaperDwarkadhishCutout: React.FC<{ progress: number; width?: number; height?: number }> = ({ progress, width = 640, height = 540 }) => {
  const p = Math.max(0, Math.min(1, progress));
  const s = interpolate(p, [0, 1], [0.9, 1]);

  return (
    <div style={{ width, height, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "center", transform: `scale(${s})`, opacity: p }}>
      <svg width={width} height={height} viewBox="0 0 640 540" style={{ overflow: "visible" }}>
        {/* Layer 0: Shadow Layer (Same offset as MapItem) */}
        <g transform="translate(10, 14)" fill={SHADOW} opacity={0.52}>
          <circle cx={320} cy={185} r={120} />
          <ellipse cx={320} cy={480} rx={160} ry={35} />
          <path d="M255,290 L385,290 L410,450 L230,450 Z" />
          <path d="M255,130 L385,130 L375,290 L265,290 Z" />
          <ellipse cx={320} cy={85} rx={45} ry={52} />
          <path d="M275,45 L365,45 L355,-35 L320,-60 L285,-35 Z" />
        </g>

        {/* Divine Golden Cutout Halo (Sanjhi Layered Paper Cut) */}
        <g transform="translate(320, 185)">
          <circle cx={0} cy={0} r={125} fill={PALETTE[0]} stroke={CREAM} strokeWidth={5} />
          <circle cx={0} cy={0} r={105} fill={GOLD} stroke={CREAM} strokeWidth={4} />
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={i} x1={0} y1={0} x2={Math.cos((i * 22.5 * Math.PI) / 180) * 125} y2={Math.sin((i * 22.5 * Math.PI) / 180) * 125} stroke={CREAM} strokeWidth={3} strokeLinecap="round" />
          ))}
        </g>

        {/* Lord Dwarkadhish Figure in Authentic Paper Craft */}
        <g transform="translate(320, 250)">
          {/* Lotus Pedestal (Hand-cut Paper Petals) */}
          <ellipse cx={0} cy={230} rx={160} ry={34} fill={PALETTE[3]} stroke={CREAM} strokeWidth={4} />
          {[-120, -70, -20, 30, 80, 130].map((lx, i) => (
            <ellipse key={i} cx={lx} cy={225} rx={22} ry={13} fill={PALETTE[1]} stroke={CREAM} strokeWidth={2.5} />
          ))}

          {/* Pitambar (Radiant Paper Golden Yellow Dhoti with Paper Pleats) */}
          <path d="M-65,40 L65,40 L90,200 L-90,200 Z" fill={GOLD} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
          <path d="M-15,40 L15,40 L8,185 L0,200 L-8,185 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={2.5} strokeLinejoin="round" />
          <rect x={-65} y={30} width={130} height={16} rx={5} fill={PALETTE[1]} stroke={CREAM} strokeWidth={2.5} />

          {/* Torso in Muted Sanjhi Blue/Teal Paper */}
          <path d="M-65,-120 L65,-120 L55,40 L-55,40 Z" fill="#2d6a78" stroke={CREAM} strokeWidth={4.5} strokeLinejoin="round" />
          {/* Sacred White Janeu Thread */}
          <line x1={-45} y1={-120} x2={35} y2={40} stroke={CREAM} strokeWidth={3.5} />

          {/* Royal Kanthi Mala & Garland */}
          <path d="M-45,-110 Q0,0 45,-110" fill="none" stroke={CREAM} strokeWidth={5} />
          {[-30, -15, 0, 15, 30].map((mx, i) => (
            <circle key={i} cx={mx} cy={40 + (1 - Math.abs(mx) / 40) * 45} r={6} fill={i % 2 ? RED : GOLD} stroke={CREAM} strokeWidth={2} />
          ))}

          {/* Arms holding the Divine Paper Bansuri (Flute) */}
          <g transform="translate(0, -60)">
            <rect x={-140} y={-8} width={280} height={16} rx={6} fill={GOLD} stroke={CREAM} strokeWidth={3} transform="rotate(-16)" />
            {/* Hands holding flute */}
            <circle cx={-30} cy={10} r={16} fill="#2d6a78" stroke={CREAM} strokeWidth={3} />
            <circle cx={35} cy={-10} r={16} fill="#2d6a78" stroke={CREAM} strokeWidth={3} />
          </g>

          {/* Divine Face & Tilak */}
          <g transform="translate(0, -170)">
            <ellipse cx={0} cy={0} rx={44} ry={52} fill="#2d6a78" stroke={CREAM} strokeWidth={4} />
            {/* Sacred Urdhva Pundra Tilak */}
            <path d="M-8,-25 L-8,8 Q0,16 8,8 L8,-25" fill="none" stroke={CREAM} strokeWidth={3} />
            <line x1={0} y1={-20} x2={0} y2={10} stroke={RED} strokeWidth={3} />
            {/* Serene Smiling Eyes */}
            <path d="M-28,-2 Q-18,-8 -8,-2" fill="none" stroke={CREAM} strokeWidth={3} />
            <path d="M8,-2 Q18,-8 28,-2" fill="none" stroke={CREAM} strokeWidth={3} />

            {/* Handcrafted Golden Paper Mukut (Crown) */}
            <path d="M-45,-40 L45,-40 L35,-120 L0,-145 L-35,-120 Z" fill={GOLD} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
            <circle cx={0} cy={-85} r={12} fill={RED} stroke={CREAM} strokeWidth={2.5} />

            {/* Peacock Feather (मोरपंख - Handcrafted Paper Craft) */}
            <g transform="translate(18, -140) rotate(22)">
              <ellipse cx={0} cy={-36} rx={22} ry={36} fill="#2d7a58" stroke={CREAM} strokeWidth={2.5} />
              <ellipse cx={0} cy={-36} rx={14} ry={24} fill="#1f8a87" />
              <ellipse cx={0} cy={-36} rx={7} ry={12} fill="#2d6a78" />
              <line x1={0} y1={0} x2={0} y2={-72} stroke={GOLD} strokeWidth={2} />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ 5. PAPER ARMY / SENA CUTOUT */
export const PaperArmyCutout: React.FC<{ progress: number; width?: number; height?: number }> = ({ progress, width = 720, height = 500 }) => {
  const p = Math.max(0, Math.min(1, progress));
  const s = interpolate(p, [0, 1], [0.9, 1]);

  // A troop/sena formation of warriors with spears, shields, swords and fluttering saffron flags
  const warriors = [
    { x: -220, y: 40, scale: 0.75, weapon: "spear" },
    { x: -140, y: 15, scale: 0.85, weapon: "sword" },
    { x: -60, y: 30, scale: 0.8, weapon: "spear" },
    { x: 30, y: -10, scale: 0.95, weapon: "sword" }, // Commander / Nayak
    { x: 120, y: 20, scale: 0.85, weapon: "spear" },
    { x: 200, y: 45, scale: 0.78, weapon: "sword" },
    { x: 270, y: 10, scale: 0.72, weapon: "flag" },
  ];

  return (
    <div style={{ width, height, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "flex-end", transform: `scale(${s})`, opacity: p }}>
      <svg width={width} height={height} viewBox="-360 -240 720 480" style={{ overflow: "visible" }}>
        {/* Layer 0: Physical Paper Shadow */}
        <g transform="translate(10, 14)" fill={SHADOW} opacity={0.5}>
          {/* Ground ridge */}
          <path d="M-350,210 Q-150,180 0,200 Q180,180 350,210 L350,230 L-350,230 Z" />
          {/* Warriors shadow silhouettes */}
          {warriors.map((w, i) => (
            <g key={i} transform={`translate(${w.x}, ${w.y}) scale(${w.scale})`}>
              <circle cx={0} cy={-50} r={28} />
              <path d="M-30,-20 L30,-20 L38,130 L-38,130 Z" />
              {w.weapon === "spear" && <line x1={-35} y1={-140} x2={25} y2={130} stroke={SHADOW} strokeWidth={8} />}
              {w.weapon === "flag" && <path d="M0,-160 L70,-130 L0,-100 Z" />}
            </g>
          ))}
        </g>

        {/* Layer 1: Handcrafted Paper Cutout Ground Ridge */}
        <path d="M-350,210 Q-150,180 0,200 Q180,180 350,210 L350,230 L-350,230 Z" fill={PALETTE[3]} stroke={CREAM} strokeWidth={4} />

        {/* Layer 2: The Warriors / Sena Formation */}
        {warriors.map((w, i) => (
          <g key={i} transform={`translate(${w.x}, ${w.y}) scale(${w.scale})`}>
            {/* Dhoti / Trousers */}
            <path d="M-28,40 L28,40 L36,130 L-36,130 Z" fill={PALETTE[1]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
            <line x1={0} y1={55} x2={0} y2={130} stroke={CREAM} strokeWidth={2.5} />

            {/* Torso / Armor in Terracotta & Ink Paper */}
            <path d="M-32,-20 L32,-20 L28,45 L-28,45 Z" fill={i === 3 ? RED_DARK : INK} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
            {/* Belt */}
            <rect x={-30} y={35} width={60} height={12} rx={3} fill={GOLD} stroke={CREAM} strokeWidth={2} />

            {/* Shield (Dhal) */}
            <ellipse cx={-24} cy={30} rx={22} ry={22} fill={PALETTE[0]} stroke={CREAM} strokeWidth={3} />
            <circle cx={-24} cy={30} r={7} fill={GOLD} stroke={CREAM} strokeWidth={2} />

            {/* Weapon */}
            {w.weapon === "spear" && (
              <g>
                <line x1={-35} y1={-140} x2={25} y2={130} stroke={INK} strokeWidth={6} />
                <polygon points="-35,-165 -45,-135 -25,-135" fill={GOLD} stroke={CREAM} strokeWidth={2.5} />
              </g>
            )}
            {w.weapon === "sword" && (
              <g transform="translate(20, 20) rotate(-25)">
                <line x1={0} y1={-70} x2={0} y2={30} stroke={CREAM} strokeWidth={5} />
                <rect x={-10} y={15} width={20} height={6} rx={2} fill={GOLD} />
              </g>
            )}
            {w.weapon === "flag" && (
              <g>
                <line x1={0} y1={-170} x2={0} y2={130} stroke={INK} strokeWidth={5} />
                <path d="M0,-170 Q45,-155 80,-165 L60,-130 Q35,-140 0,-130 Z" fill={RED} stroke={CREAM} strokeWidth={3} />
              </g>
            )}

            {/* Head & Pagdi (Turban) */}
            <circle cx={0} cy={-50} r={24} fill="#e5b083" stroke={CREAM} strokeWidth={3} />
            {/* Saffron Turban */}
            <ellipse cx={0} cy={-64} rx={28} ry={15} fill={RED} stroke={CREAM} strokeWidth={3} />
            <rect x={-20} y={-66} width={40} height={8} rx={3} fill={GOLD} />
          </g>
        ))}
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ 6. PAPER COWS CUTOUT (Gau Mata & Calf) */
export const PaperCowsCutout: React.FC<{ progress: number; width?: number; height?: number }> = ({ progress, width = 720, height = 500 }) => {
  const p = Math.max(0, Math.min(1, progress));
  const s = interpolate(p, [0, 1], [0.9, 1]);

  return (
    <div style={{ width, height, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "flex-end", transform: `scale(${s})`, opacity: p }}>
      <svg width={width} height={height} viewBox="-360 -240 720 480" style={{ overflow: "visible" }}>
        {/* Layer 0: Physical Paper Shadow */}
        <g transform="translate(10, 14)" fill={SHADOW} opacity={0.5}>
          <path d="M-340,190 Q-120,160 0,175 Q150,160 340,195 L340,225 L-340,225 Z" />
          <path d="M-180,60 Q-160,20 -100,20 Q-70,-20 -20,-10 Q20,-10 60,30 Q120,30 160,70 Q170,120 150,170 L130,170 L120,110 L80,110 L70,170 L40,170 L50,100 L-40,100 L-50,170 L-80,170 L-70,110 L-120,110 L-130,170 L-160,170 Q-190,130 -180,60 Z" />
          <path d="M120,110 Q140,80 180,80 Q220,90 240,120 L240,180 L220,180 L210,140 L190,140 L180,180 L160,180 L170,140 L140,140 L130,180 L110,180 Z" />
        </g>

        {/* Layer 1: Handcrafted Ground Mound & Grass */}
        <path d="M-340,190 Q-120,160 0,175 Q150,160 340,195 L340,225 L-340,225 Z" fill={PALETTE[3]} stroke={CREAM} strokeWidth={4} />
        {[-220, -100, 40, 200, 280].map((gx, i) => (
          <path key={i} d={`M${gx},180 L${gx - 8},155 L${gx},162 L${gx + 8},150 L${gx + 4},180 Z`} fill="#4d7c43" stroke={CREAM} strokeWidth={2} />
        ))}

        {/* Layer 2: Main Sacred Cow (Gau Mata) */}
        <g transform="translate(-40, 20)">
          {/* Tail with tuft */}
          <path d="M-150,50 Q-190,90 -170,150" stroke={INK} strokeWidth={5} fill="none" />
          <ellipse cx={-170} cy={155} rx={9} ry={16} fill={INK} stroke={CREAM} strokeWidth={2} />

          {/* Back Legs */}
          <path d="M-125,70 L-135,160 L-115,160 L-105,75 Z" fill={PALETTE[1]} stroke={CREAM} strokeWidth={3} />
          <path d="M-150,65 L-160,160 L-140,160 L-130,70 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
          <rect x={-162} y={150} width={24} height={12} rx={2} fill={INK} />
          <rect x={-137} y={150} width={24} height={12} rx={2} fill={INK} />

          {/* Front Legs */}
          <path d="M75,65 L65,160 L85,160 L95,70 Z" fill={PALETTE[1]} stroke={CREAM} strokeWidth={3} />
          <path d="M45,65 L35,160 L55,160 L65,70 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
          <rect x={33} y={150} width={24} height={12} rx={2} fill={INK} />
          <rect x={63} y={150} width={24} height={12} rx={2} fill={INK} />

          {/* Cow Body */}
          <path d="M-140,65 Q-150,30 -90,25 Q-60,-15 -10,-10 Q40,-10 70,30 Q110,35 130,55 Q135,80 120,95 Q80,105 0,100 Q-80,102 -130,85 Z" fill={CREAM} stroke="#e4d8be" strokeWidth={4} strokeLinejoin="round" />

          {/* Desi Cow Hump (Kakud) */}
          <ellipse cx={-25} cy={-12} rx={34} ry={22} fill={CREAM} stroke="#e4d8be" strokeWidth={3} />

          {/* Decorative Embroidered Cloth (Jhool) on Back */}
          <path d="M-75,30 Q-15,22 45,30 L35,82 Q-15,88 -65,82 Z" fill={RED} stroke={GOLD} strokeWidth={3} />
          <path d="M-55,42 Q-15,36 25,42 L20,72 Q-15,76 -50,72 Z" fill={GOLD} stroke={CREAM} strokeWidth={2} />
          <circle cx={-15} cy={56} r={7} fill={CREAM} />

          {/* Dewlap (Gal-kambal) */}
          <path d="M80,55 Q105,85 115,115 Q125,85 110,65 Z" fill={CREAM} stroke="#e4d8be" strokeWidth={3} />

          {/* Head & Neck */}
          <path d="M85,45 Q120,25 150,35 Q175,55 160,85 Q135,90 100,75 Z" fill={CREAM} stroke="#e4d8be" strokeWidth={3.5} strokeLinejoin="round" />

          {/* Muzzle / Nose */}
          <ellipse cx={160} cy={70} rx={18} ry={14} fill="#e5b083" stroke={CREAM} strokeWidth={2} />
          <circle cx={162} cy={67} r={3} fill={INK} />

          {/* Eye */}
          <ellipse cx={136} cy={48} rx={6} ry={4} fill={INK} />
          <circle cx={137} cy={46} r={1.5} fill={CREAM} />

          {/* Ears */}
          <ellipse cx={105} cy={40} rx={16} ry={9} transform="rotate(-20 105 40)" fill={CREAM} stroke="#e4d8be" strokeWidth={2.5} />

          {/* Curved Horns with gold caps */}
          <path d="M120,32 Q125,-25 105,-55 Q115,-30 132,28 Z" fill={PALETTE[1]} stroke={CREAM} strokeWidth={3} />
          <path d="M136,32 Q150,-22 172,-48 Q152,-22 144,30 Z" fill={PALETTE[1]} stroke={CREAM} strokeWidth={3} />
          <polygon points="105,-55 102,-42 112,-44" fill={GOLD} stroke={CREAM} strokeWidth={1.5} />
          <polygon points="172,-48 162,-38 172,-36" fill={GOLD} stroke={CREAM} strokeWidth={1.5} />

          {/* Brass Bell Necklace around Neck */}
          <path d="M95,50 Q118,75 125,92" stroke={RED} strokeWidth={4} fill="none" />
          <circle cx={122} cy={95} r={8} fill={GOLD} stroke={CREAM} strokeWidth={2} />
          <circle cx={122} cy={97} r={2} fill={INK} />
        </g>

        {/* Layer 3: Sacred Calf (बछड़ा) playing beside mother */}
        <g transform="translate(160, 70)">
          <path d="M-40,40 Q-50,20 -10,15 Q20,15 45,35 Q60,55 50,75 Q20,80 -30,70 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={3} strokeLinejoin="round" />
          <rect x={-32} y={65} width={10} height={45} rx={2} fill={PALETTE[1]} stroke={CREAM} strokeWidth={2} />
          <rect x={-15} y={65} width={10} height={45} rx={2} fill={PALETTE[0]} stroke={CREAM} strokeWidth={2} />
          <rect x={15} y={65} width={10} height={45} rx={2} fill={PALETTE[1]} stroke={CREAM} strokeWidth={2} />
          <rect x={32} y={65} width={10} height={45} rx={2} fill={PALETTE[0]} stroke={CREAM} strokeWidth={2} />
          <circle cx={48} cy={30} r={18} fill={PALETTE[0]} stroke={CREAM} strokeWidth={2.5} />
          <ellipse cx={58} cy={35} rx={9} ry={7} fill="#e5b083" />
          <ellipse cx={48} cy={27} rx={3.5} ry={2.5} fill={INK} />
          <ellipse cx={38} cy={18} rx={9} ry={5} transform="rotate(-30 38 18)" fill={PALETTE[0]} stroke={CREAM} strokeWidth={1.5} />
          <path d="M38,36 Q45,46 50,48" stroke={RED} strokeWidth={3} fill="none" />
          <circle cx={50} cy={50} r={4} fill={GOLD} />
        </g>
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ 7. PAPER WEAPONS CUTOUT (Crossed Talwars & Shield) */
export const PaperWeaponsCutout: React.FC<{ progress: number; width?: number; height?: number }> = ({ progress, width = 720, height = 500 }) => {
  const p = Math.max(0, Math.min(1, progress));
  const s = interpolate(p, [0, 1], [0.88, 1]);

  return (
    <div style={{ width, height, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "flex-end", transform: `scale(${s})`, opacity: p }}>
      <svg width={width} height={height} viewBox="-360 -240 720 480" style={{ overflow: "visible" }}>
        {/* Layer 0: Physical Paper Shadow */}
        <g transform="translate(10, 14)" fill={SHADOW} opacity={0.52}>
          {/* Crossed swords shadow */}
          <g transform="rotate(45)"><rect x={-14} y={-190} width={28} height={380} rx={6} /></g>
          <g transform="rotate(-45)"><rect x={-14} y={-190} width={28} height={380} rx={6} /></g>
          {/* Bow shadow */}
          <path d="M-220,120 Q-270,0 -220,-120 L-200,-110 Q-245,0 -200,110 Z" />
          {/* Center Shield shadow */}
          <circle cx={0} cy={0} r={115} />
        </g>

        {/* Layer 1: The Bow (Dhanush) on the left */}
        <g transform="translate(-10, 0)">
          <path d="M-220,140 Q-280,0 -220,-140" stroke={PALETTE[4]} strokeWidth={18} fill="none" strokeLinecap="round" />
          <path d="M-220,140 Q-280,0 -220,-140" stroke={CREAM} strokeWidth={4} fill="none" />
          {/* Golden grips on bow */}
          <rect x={-265} y={-20} width={22} height={40} rx={4} fill={GOLD} stroke={CREAM} strokeWidth={2.5} />
          {/* Bowstring (Pratyancha) */}
          <line x1={-220} y1={-140} x2={-220} y2={140} stroke={INK} strokeWidth={3} />
        </g>

        {/* Layer 2: Sword 1 (Bottom Left to Top Right) */}
        <g transform="rotate(42)">
          {/* Curved steel blade */}
          <path d="M-10,-180 Q-15,-90 -8,110 L8,110 Q15,-90 0,-195 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
          <line x1={0} y1={-180} x2={0} y2={110} stroke="#d5c8a4" strokeWidth={2.5} />
          {/* Hilt Crossguard (Dastana) */}
          <rect x={-36} y={105} width={72} height={14} rx={4} fill={GOLD} stroke={CREAM} strokeWidth={3} />
          {/* Handle */}
          <rect x={-10} y={119} width={20} height={42} rx={3} fill={RED_DARK} stroke={CREAM} strokeWidth={2.5} />
          {/* Pommel Disc (Khanda Muth) */}
          <circle cx={0} cy={166} r={16} fill={GOLD} stroke={CREAM} strokeWidth={3} />
          <polygon points="0,178 -6,166 6,166" fill={CREAM} />
        </g>

        {/* Layer 3: Sword 2 (Bottom Right to Top Left) */}
        <g transform="rotate(-42)">
          {/* Curved steel blade */}
          <path d="M-10,-180 Q-15,-90 -8,110 L8,110 Q15,-90 0,-195 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
          <line x1={0} y1={-180} x2={0} y2={110} stroke="#d5c8a4" strokeWidth={2.5} />
          {/* Hilt Crossguard */}
          <rect x={-36} y={105} width={72} height={14} rx={4} fill={GOLD} stroke={CREAM} strokeWidth={3} />
          {/* Handle */}
          <rect x={-10} y={119} width={20} height={42} rx={3} fill={RED_DARK} stroke={CREAM} strokeWidth={2.5} />
          {/* Pommel Disc */}
          <circle cx={0} cy={166} r={16} fill={GOLD} stroke={CREAM} strokeWidth={3} />
          <polygon points="0,178 -6,166 6,166" fill={CREAM} />
        </g>

        {/* Layer 4: Golden Arrow (Teer / Baan) traversing diagonally */}
        <g transform="translate(15, -10) rotate(-28)">
          <line x1={0} y1={-190} x2={0} y2={180} stroke={INK} strokeWidth={5} />
          {/* Arrowhead */}
          <polygon points="0,-220 -15,-185 15,-185" fill={GOLD} stroke={CREAM} strokeWidth={3} />
          {/* Feathers / Fletching */}
          <path d="M0,140 L-18,175 L0,165 L18,175 Z" fill={RED} stroke={CREAM} strokeWidth={2} />
        </g>

        {/* Layer 5: Ornate Royal Rajput Shield (Dhal) in Center */}
        <g>
          {/* Outer Rim in Deep Terracotta Paper */}
          <circle cx={0} cy={0} r={105} fill={INK} stroke={CREAM} strokeWidth={5} />
          <circle cx={0} cy={0} r={92} fill={PALETTE[1]} stroke={GOLD} strokeWidth={4} />
          <circle cx={0} cy={0} r={76} fill={RED_DARK} stroke={CREAM} strokeWidth={3} />

          {/* Central Sunburst Motif (Surya) */}
          <circle cx={0} cy={0} r={28} fill={GOLD} stroke={CREAM} strokeWidth={3} />
          <circle cx={0} cy={0} r={14} fill={RED} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, i) => (
            <g key={i} transform={`rotate(${ang})`}>
              <polygon points="0,-48 -7,-32 7,-32" fill={GOLD} stroke={CREAM} strokeWidth={1.5} />
            </g>
          ))}

          {/* 4 Traditional Golden Bosses (Dhal Ke Chaar Kante) */}
          {[-45, 45].map((bx) =>
            [-45, 45].map((by) => (
              <g key={`${bx}-${by}`} transform={`translate(${bx}, ${by})`}>
                <circle cx={0} cy={0} r={14} fill={GOLD} stroke={CREAM} strokeWidth={2.5} />
                <circle cx={0} cy={0} r={6} fill={INK} />
              </g>
            ))
          )}
        </g>

        {/* Saffron Battle Ribbons */}
        <path d="M-60,95 Q-110,140 -160,130 L-130,165 Q-85,150 -45,105 Z" fill={RED} stroke={CREAM} strokeWidth={2} />
        <path d="M60,95 Q110,140 160,130 L130,165 Q85,150 45,105 Z" fill={RED} stroke={CREAM} strokeWidth={2} />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ 8. PAPER VACHAN CUTOUT (Two Characters: Solemn Vow & Blessing) */
export const PaperVachanCutout: React.FC<{ progress: number; width?: number; height?: number }> = ({ progress, width = 720, height = 500 }) => {
  const p = Math.max(0, Math.min(1, progress));
  const s = interpolate(p, [0, 1], [0.9, 1]);

  return (
    <div style={{ width, height, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "flex-end", transform: `scale(${s})`, opacity: p }}>
      <svg width={width} height={height} viewBox="-360 -240 720 480" style={{ overflow: "visible" }}>
        {/* Layer 0: Physical Paper Shadow */}
        <g transform="translate(10, 14)" fill={SHADOW} opacity={0.5}>
          {/* Ground ridge */}
          <path d="M-340,190 Q0,165 340,190 L340,225 L-340,225 Z" />
          {/* Left Character (Nayak / Vow Taker) */}
          <g transform="translate(-150, 40)">
            <circle cx={0} cy={-100} r={26} />
            <path d="M-35,-65 L35,-65 L45,130 L-45,130 Z" />
            <path d="M20,-40 L100,-20 L90,0 L20,-15 Z" />
          </g>
          {/* Right Character (Mata / Guru Giving Blessing) */}
          <g transform="translate(150, 20)">
            <circle cx={0} cy={-110} r={26} />
            <path d="M-40,-75 L40,-75 L50,150 L-50,150 Z" />
            <path d="M-20,-50 L-95,-80 L-85,-100 L-10,-65 Z" />
          </g>
          {/* Center Diya / Sacred Aura */}
          <ellipse cx={0} cy={60} rx={45} ry={18} />
        </g>

        {/* Layer 1: Ground Mound */}
        <path d="M-340,190 Q0,165 340,190 L340,225 L-340,225 Z" fill={PALETTE[3]} stroke={CREAM} strokeWidth={4} />

        {/* Layer 2: Sacred Vow Centerpiece (Divine Diya & Vow Rays) */}
        <g transform="translate(0, 60)">
          {/* Diya Base */}
          <ellipse cx={0} cy={40} rx={42} ry={14} fill={GOLD} stroke={CREAM} strokeWidth={3} />
          <path d="M-35,40 Q0,15 35,40 Z" fill={PALETTE[1]} stroke={CREAM} strokeWidth={2} />
          {/* Golden Flame (Jyoti) */}
          <ellipse cx={0} cy={16} rx={14} ry={24} fill="#ffeaa7" stroke={GOLD} strokeWidth={2.5} />
          <ellipse cx={0} cy={20} rx={7} ry={14} fill={RED} />

          {/* Divine Golden Rays radiating upward between both characters */}
          {[-40, -20, 0, 20, 40].map((rayAng, i) => (
            <line
              key={i}
              x1={0}
              y1={0}
              x2={Math.sin((rayAng * Math.PI) / 180) * 120}
              y2={-Math.cos((rayAng * Math.PI) / 180) * 120}
              stroke={GOLD}
              strokeWidth={3}
              strokeDasharray="8 6"
              opacity={0.7}
            />
          ))}
        </g>

        {/* Layer 3: Left Character - The Nayak / Warrior Taking the Vow (वचन लेते हुए) */}
        <g transform="translate(-150, 40)">
          {/* Dhoti / Robes */}
          <path d="M-32,35 L32,35 L40,145 L-40,145 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
          <line x1={0} y1={50} x2={0} y2={145} stroke={CREAM} strokeWidth={2.5} />

          {/* Angarkha / Kurta */}
          <path d="M-36,-65 L36,-65 L32,45 L-32,45 Z" fill={RED_DARK} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
          {/* Saffron Kamarband (Waist Sash) */}
          <rect x={-34} y={32} width={68} height={14} rx={3} fill={GOLD} stroke={CREAM} strokeWidth={2} />
          <path d="M-10,46 L-15,95 L0,95 L5,46 Z" fill={GOLD} stroke={CREAM} strokeWidth={2} />

          {/* Sword at waist */}
          <g transform="translate(-25, 40) rotate(35)">
            <line x1={0} y1={-25} x2={0} y2={65} stroke={CREAM} strokeWidth={4} />
            <rect x={-8} y={-10} width={16} height={5} rx={1} fill={GOLD} />
          </g>

          {/* Right Arm extended forward with open palm taking the vow (संकल्प मुद्रा) */}
          <path d="M15,-45 L85,-15 L78,6 L10,-28 Z" fill={RED_DARK} stroke={CREAM} strokeWidth={3} strokeLinejoin="round" />
          {/* Open Hand in Vow gesture touching near the sacred flame */}
          <ellipse cx={88} cy={-5} rx={10} ry={7} fill="#e5b083" stroke={CREAM} strokeWidth={2} />

          {/* Head & Pagdi */}
          <circle cx={0} cy={-100} r={24} fill="#e5b083" stroke={CREAM} strokeWidth={3} />
          {/* Rajput Saffron Pagdi with gold plume */}
          <ellipse cx={0} cy={-115} rx={28} ry={16} fill={RED} stroke={CREAM} strokeWidth={3} />
          <polygon points="0,-132 -6,-115 6,-115" fill={GOLD} stroke={CREAM} strokeWidth={2} />
          {/* Peaceful & determined face */}
          <ellipse cx={10} cy={-100} rx={3.5} ry={2.5} fill={INK} />
        </g>

        {/* Layer 4: Right Character - The Mata / Guru Giving Blessing (आशीर्वाद देते हुए) */}
        <g transform="translate(150, 20)">
          {/* Traditional Saree / Saffron Robes */}
          <path d="M-38,-40 L38,-40 L48,165 L-48,165 Z" fill={PALETTE[1]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
          {/* Saree Pleats & Borders */}
          <line x1={-10} y1={-20} x2={-15} y2={165} stroke={RED} strokeWidth={3} />
          <line x1={12} y1={-20} x2={18} y2={165} stroke={RED} strokeWidth={3} />
          <rect x={-46} y={150} width={92} height={12} fill={GOLD} stroke={CREAM} strokeWidth={2} />

          {/* Saree Pallu draped gracefully over head and shoulders */}
          <path d="M-35,-125 Q0,-145 35,-125 Q45,-70 38,-30 L-38,-30 Q-45,-70 -35,-125 Z" fill={GOLD} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />

          {/* Face */}
          <circle cx={0} cy={-105} r={22} fill="#e5b083" stroke={CREAM} strokeWidth={2.5} />
          {/* Red Bindi */}
          <circle cx={-8} cy={-112} r={3} fill={RED} />
          {/* Eye in benevolent gaze */}
          <ellipse cx={-8} cy={-104} rx={3.5} ry={2} fill={INK} />

          {/* Right Arm raised high in Abhaya Mudra (आशीर्वाद / अभय मुद्रा) */}
          <path d="M-15,-55 L-85,-90 L-76,-108 L-6,-72 Z" fill={GOLD} stroke={CREAM} strokeWidth={3} strokeLinejoin="round" />
          {/* Raised Blessing Palm */}
          <g transform="translate(-86, -108)">
            <ellipse cx={0} cy={0} rx={12} ry={9} transform="rotate(-15)" fill="#e5b083" stroke={CREAM} strokeWidth={2} />
            {/* Sacred Lotus symbol on palm */}
            <circle cx={0} cy={0} r={3} fill={RED} />
          </g>
        </g>
      </svg>
    </div>
  );
};

