import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { useAbsFrame, useFrame } from "../context";
import { beatPulse, FPS } from "../timing";

const W = 1920;
const H = 1080;

/* ───────────── 火星：整支 MV 的母題，從一粒火種長成營火 ───────────── */
export const Embers: React.FC<{
  count?: number;
  seed?: string;
  speed?: number; // px / s
  size?: number;
  colors?: string[];
  opacity?: number;
  fromBottom?: boolean; // 只從下方升起（營火）
}> = ({
  count = 60,
  seed = "embers",
  speed = 140,
  size = 6,
  colors = ["#FFD36B", "#FF8A2A", "#FF4A1C"],
  opacity = 1,
  fromBottom = false,
}) => {
  const frame = useAbsFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <radialGradient id={`eg-${seed}`}>
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.35" stopColor="#fff" stopOpacity="0.6" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {new Array(count).fill(0).map((_, i) => {
          const r1 = random(`${seed}-x-${i}`);
          const r2 = random(`${seed}-s-${i}`);
          const r3 = random(`${seed}-p-${i}`);
          const sp = speed * (0.5 + r2);
          const travel = H + 200;
          const y0 = fromBottom ? H + 40 : H + 40 - r3 * travel;
          const life = travel / sp;
          const age = ((t + r3 * life) % life) / life; // 0..1
          const y = fromBottom ? y0 - age * travel * 0.8 : H + 40 - age * travel;
          const baseX = fromBottom ? W * (0.35 + r1 * 0.3) : r1 * W;
          const x = baseX + Math.sin(t * (1 + r2 * 2) + i) * (30 + r3 * 60) * age;
          const s = size * (0.4 + r2) * (fromBottom ? 1 - age * 0.7 : 1);
          const flick = 0.6 + 0.4 * Math.sin(t * 13 + i * 7.1);
          const fade = fromBottom ? 1 - age : Math.min(1, age * 4) * Math.min(1, (1 - age) * 3);
          const c = colors[i % colors.length];
          return (
            <g key={i} opacity={fade * flick}>
              <circle cx={x} cy={y} r={s * 3} fill={`url(#eg-${seed})`} style={{ color: c }} opacity={0.35} />
              <circle cx={x} cy={y} r={s} fill={c} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ───────────── 煙火：每發都有固定 seed，跳到任何影格都一致 ───────────── */
export type Burst = {
  at: number; // 鏡頭內影格（爆開瞬間）
  x: number; // 0..1
  y: number; // 0..1
  color: string;
  color2?: string;
  size?: number; // 半徑 px
  seed: string;
  rise?: boolean; // 顯示升空軌跡
};

export const Fireworks: React.FC<{ bursts: Burst[] }> = ({ bursts }) => {
  const frame = useFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id="fw-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {bursts.map((b) => {
          const local = frame - b.at;
          const riseFrames = 16;
          const ox = b.x * W;
          const oy = b.y * H;
          if (local < -riseFrames || local > 3.2 * FPS) return null;
          if (local < 0) {
            if (!b.rise) return null;
            const p = (local + riseFrames) / riseFrames;
            const y = interpolate(p, [0, 1], [H + 20, oy]);
            return (
              <g key={b.seed} filter="url(#fw-glow)">
                <line x1={ox} y1={y + 90} x2={ox} y2={y} stroke={b.color} strokeWidth={3} strokeOpacity={0.6} />
                <circle cx={ox} cy={y} r={5} fill="#fff" />
              </g>
            );
          }
          const t = local / FPS;
          const size = b.size ?? 320;
          const n = 72;
          const expand = 1 - Math.exp(-t * 3.2);
          const fade = interpolate(t, [0, 0.15, 2.2, 3.2], [1, 1, 0.5, 0], {
            extrapolateRight: "clamp",
          });
          const flash = Math.max(0, 1 - t * 5);
          return (
            <g key={b.seed} filter="url(#fw-glow)">
              <circle cx={ox} cy={oy} r={size * 0.5 * (1 + t)} fill={b.color} opacity={flash * 0.35} />
              {new Array(n).fill(0).map((_, i) => {
                const a = (i / n) * Math.PI * 2 + random(`${b.seed}-a-${i}`) * 0.12;
                const v = size * (0.75 + random(`${b.seed}-v-${i}`) * 0.3);
                const g = 60 * t * t;
                const x = ox + Math.cos(a) * v * expand;
                const y = oy + Math.sin(a) * v * expand + g;
                const tx = ox + Math.cos(a) * v * expand * 0.82;
                const ty = oy + Math.sin(a) * v * expand * 0.82 + g * 0.8;
                const twinkle = t > 1.2 ? (Math.sin(t * 40 + i) > 0 ? 1 : 0.3) : 1;
                const c = i % 3 === 0 && b.color2 ? b.color2 : b.color;
                return (
                  <g key={i} opacity={fade * twinkle}>
                    <line x1={tx} y1={ty} x2={x} y2={y} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
                    <circle cx={x} cy={y} r={3} fill="#fff" />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ───────────── 營火：模糊色塊組成的粒子火焰 ───────────── */
export const Bonfire: React.FC<{
  x?: number; // 0..1
  baseY?: number; // 0..1
  scale?: number;
  intensity?: number; // 0..1.5
  seed?: string;
}> = ({ x = 0.5, baseY = 1.02, scale = 1, intensity = 1, seed = "fire" }) => {
  const abs = useAbsFrame();
  const t = abs / FPS;
  const pulse = beatPulse(abs, 6);
  const cx = x * W;
  const by = baseY * H;
  const h = 640 * scale * (0.35 + 0.65 * intensity + pulse * 0.06);
  const alpha = Math.min(1, intensity * 1.3);

  // 外焰（橘紅、大、很糊）＋ 內焰（白黃、小、較清楚），越往上越收窄
  const layer = (n: number, spread: number, r0: number, r1: number, reach: number, colors: string[], tag: string) =>
    new Array(n).fill(0).map((_, i) => {
      const life = 0.7 + random(`${seed}-${tag}-l-${i}`) * 0.7;
      const ph = random(`${seed}-${tag}-p-${i}`);
      const a = (((t / life + ph) % 1) + 1) % 1;
      const sx = (random(`${seed}-${tag}-x-${i}`) - 0.5) * spread * scale;
      const sway = Math.sin(t * 4 + i * 1.7) * 36 * scale * a;
      const px = cx + sx * Math.pow(1 - a, 1.4) + sway;
      const py = by - a * h * reach;
      const r = (r0 - (r0 - r1) * a) * scale * (0.75 + random(`${seed}-${tag}-r-${i}`) * 0.5);
      const c = colors[Math.min(colors.length - 1, Math.floor(a * colors.length))];
      return <circle key={i} cx={px} cy={py} r={r} fill={c} opacity={(1 - a * a) * 0.95} />;
    });

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none", opacity: alpha }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id={`fire-outer-${seed}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={20 * scale} />
          </filter>
          <filter id={`fire-core-${seed}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={9 * scale} />
          </filter>
          <radialGradient id={`fire-glow-${seed}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FF6A1F" stopOpacity={0.55} />
            <stop offset="0.45" stopColor="#B3201A" stopOpacity={0.25} />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={cx} cy={by - h * 0.3} rx={1000 * scale} ry={h * 1.2} fill={`url(#fire-glow-${seed})`} opacity={0.8 + pulse * 0.2} />
        <g filter={`url(#fire-outer-${seed})`}>
          {layer(44, 380, 85, 18, 1, ["#FF8A1F", "#FF5A1A", "#E8361C", "#A8161A"], "o")}
        </g>
        <g filter={`url(#fire-core-${seed})`}>
          {layer(30, 190, 52, 8, 0.72, ["#FFFBE0", "#FFE27A", "#FFB52E", "#FF7A1F"], "c")}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ───────────── 舞台光束（Party lighting） ───────────── */
export const Beams: React.FC<{
  colors?: string[];
  count?: number;
  intensity?: number;
  originY?: number;
}> = ({ colors = ["#FF2E88", "#2EE6FF", "#FFC93C"], count = 6, intensity = 1, originY = -0.05 }) => {
  const abs = useAbsFrame();
  const t = abs / FPS;
  const pulse = beatPulse(abs, 5);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none", overflow: "hidden" }}>
      {new Array(count).fill(0).map((_, i) => {
        const ox = ((i + 0.5) / count) * 100;
        const ang = Math.sin(t * 1.3 + i * 1.9) * 28 + (i % 2 ? 8 : -8);
        const c = colors[i % colors.length];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${ox}%`,
              top: `${originY * 100}%`,
              width: 260,
              height: 1500,
              marginLeft: -130,
              transformOrigin: "50% 0%",
              rotate: `${ang}deg`,
              background: `linear-gradient(180deg, ${c} 0%, ${c}55 40%, transparent 85%)`,
              clipPath: "polygon(46% 0, 54% 0, 100% 100%, 0 100%)",
              opacity: (0.32 + pulse * 0.4) * intensity,
              filter: "blur(6px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ───────────── 集中線 ───────────── */
export const SpeedLines: React.FC<{ color?: string; seed?: string; opacity?: number }> = ({
  color = "#fff",
  seed = "sl",
  opacity = 0.5,
}) => {
  const abs = useAbsFrame();
  const step = Math.floor(abs / 2); // 每 2 格換一次，有手繪抖動感
  const n = 90;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {new Array(n).fill(0).map((_, i) => {
          const a = (i / n) * Math.PI * 2 + random(`${seed}-${step}-${i}`) * 0.05;
          const inner = 380 + random(`${seed}-i-${step}-${i}`) * 260;
          const outer = 1400;
          const w = 2 + random(`${seed}-w-${i}`) * 8;
          const cx = W / 2;
          const cy = H / 2;
          const dx = Math.cos(a);
          const dy = Math.sin(a);
          const px = -dy * w;
          const py = dx * w;
          return (
            <polygon
              key={i}
              points={`${cx + dx * inner},${cy + dy * inner} ${cx + dx * outer + px},${cy + dy * outer + py} ${cx + dx * outer - px},${cy + dy * outer - py}`}
              fill={color}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ───────────── 閃白 ───────────── */
export const Flash: React.FC<{ at?: number; dur?: number; color?: string; peak?: number }> = ({
  at = 0,
  dur = 10,
  color = "#fff",
  peak = 1,
}) => {
  const frame = useFrame();
  const o = interpolate(frame, [at, at + 1, at + dur], [0, peak, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, pointerEvents: "none" }} />;
};

/* ───────────── 底片顆粒 + 暗角，全片統一質感 ───────────── */
export const FilmOverlay: React.FC<{ vignette?: number }> = ({ vignette = 0.75 }) => {
  const abs = useAbsFrame();
  const seed = Math.floor(abs / 2) % 60;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(4,2,12,${vignette}) 100%)`,
        }}
      />
      <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────── 色彩壓層 ───────────── */
export const Tint: React.FC<{ color: string; opacity?: number; blend?: React.CSSProperties["mixBlendMode"] }> = ({
  color,
  opacity = 0.4,
  blend = "multiply",
}) => <AbsoluteFill style={{ background: color, opacity, mixBlendMode: blend, pointerEvents: "none" }} />;

/** 下方壓暗，保護歌詞可讀 */
export const BottomShade: React.FC<{ strength?: number }> = ({ strength = 0.7 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, transparent 50%, rgba(5,3,14,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);
