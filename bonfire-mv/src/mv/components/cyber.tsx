import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random } from "remotion";
import { getBands, getKick } from "../audio";
import { faceOf, MemberId, MEMBERS, resolveAsset } from "../assets";
import { useAbsFrame, useFrame } from "../context";
import { FONT_EN, FONT_MONO } from "../fonts";
import { B, beatIndex, beatPulse, FPS } from "../timing";

const W = 1920;
const H = 1080;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
const inExpo = Easing.bezier(0.7, 0, 0.84, 0);

const CYAN = "#2EE6FF";
const INK = "#120818";
const PINK = "#FF2E88";

/* ───────────── 段落名稱（給 HUD 顯示） ───────────── */
const SECTIONS: [number, string][] = [
  [0, "BOOT"], [4, "INTRO // RAP"], [11, "IGNITION"], [14, "MEMBER SCAN"], [22, "VERSE 01"], [30, "PRE-CHORUS"],
  [39, "CHORUS 01"], [61, "FEED IN"], [67, "VERSE 02"], [75, "PRE-CHORUS"], [84, "CHORUS 02"], [106, "REFLECTION"],
  [109, "SOLO"], [116, "FINAL CHORUS"], [138, "OUTRO"],
];
const sectionAt = (abs: number) => {
  let name = SECTIONS[0][1];
  for (const [bar, n] of SECTIONS) if (abs >= B(bar)) name = n;
  return name;
};

const pad = (n: number, l = 2) => String(Math.floor(n)).padStart(l, "0");

/* ───────────── 常駐 HUD：四角框、時間碼、BPM、段落、頻譜 ───────────── */
export const HUD: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const abs = useAbsFrame();
  const sec = abs / FPS;
  const beat = beatIndex(abs);
  const bp = beatPulse(abs, 9);
  const bands = getBands(abs);
  const bar = Math.max(0, Math.floor(beat / 4));
  const corner = (style: React.CSSProperties) => (
    <div style={{ position: "absolute", width: 70, height: 70, borderColor: CYAN, borderStyle: "solid", borderWidth: 0, opacity: 0.85, ...style }} />
  );
  const glitchOn = random(`hud-${Math.floor(abs / 3)}`) > 0.97;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, fontFamily: FONT_MONO, color: CYAN, translate: glitchOn ? "6px 0px" : "0px 0px" }}>
      {corner({ left: 34, top: 30, borderLeftWidth: 3, borderTopWidth: 3 })}
      {corner({ right: 34, top: 30, borderRightWidth: 3, borderTopWidth: 3 })}
      {corner({ left: 34, bottom: 30, borderLeftWidth: 3, borderBottomWidth: 3 })}
      {corner({ right: 34, bottom: 30, borderRightWidth: 3, borderBottomWidth: 3 })}

      <div style={{ position: "absolute", left: 56, top: 48, fontSize: 22, letterSpacing: "0.18em", textShadow: `0 0 8px ${CYAN}` }}>
        RAISE A SUILEN <span style={{ color: PINK }}>//</span> BONFIRE.EXE
        <div style={{ fontSize: 16, opacity: 0.75, marginTop: 4 }}>
          <span style={{ color: "#FF5A1F" }}>●</span> REC&nbsp;&nbsp;{sectionAt(abs)}
        </div>
      </div>

      <div style={{ position: "absolute", right: 56, top: 48, textAlign: "right", fontSize: 22, letterSpacing: "0.12em", textShadow: `0 0 8px ${CYAN}` }}>
        {pad(sec / 60)}:{pad(sec % 60)}:{pad(abs % FPS)}
        <div style={{ fontSize: 16, opacity: 0.8, marginTop: 4 }}>
          BPM 155&nbsp;&nbsp;BAR {pad(bar, 3)}&nbsp;&nbsp;
          <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 6, background: PINK, opacity: 0.25 + bp * 0.75, boxShadow: `0 0 ${bp * 14}px ${PINK}` }} />
        </div>
      </div>

      {/* 右下迷你頻譜 */}
      <div style={{ position: "absolute", right: 60, bottom: 46, display: "flex", alignItems: "flex-end", gap: 4, height: 54 }}>
        {bands.map((v, i) => (
          <div key={i} style={{ width: 8, height: 4 + v * 50, background: i % 6 === 0 ? PINK : CYAN, opacity: 0.85, boxShadow: `0 0 6px ${CYAN}` }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 60, bottom: 50, fontSize: 15, opacity: 0.6, letterSpacing: "0.2em" }}>
        SYNC {pad(97 + (beat % 3), 3)}%&nbsp;&nbsp;HEAT {pad(60 + getKick(abs) * 39, 2)}°
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── 全螢幕頻譜柱（間奏、副歌底層用） ───────────── */
export const BigSpectrum: React.FC<{ color?: string; opacity?: number; mirror?: boolean }> = ({ color = CYAN, opacity = 0.5, mirror = true }) => {
  const abs = useAbsFrame();
  const bands = getBands(abs);
  const all = mirror ? [...bands.slice().reverse(), ...bands] : bands;
  const bw = W / all.length;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, mixBlendMode: "screen" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {all.map((v, i) => {
          const h = 20 + v * H * 0.55;
          const segs = Math.floor(h / 22);
          return (
            <g key={i}>
              {new Array(segs).fill(0).map((_, s) => (
                <rect key={s} x={i * bw + 3} y={H - (s + 1) * 22} width={bw - 6} height={16} fill={s > segs - 3 ? PINK : color} opacity={0.35 + (s / Math.max(1, segs)) * 0.65} />
              ))}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ───────────── 數位網格地板 ───────────── */
export const GridFloor: React.FC<{ color?: string; opacity?: number }> = ({ color = CYAN, opacity = 0.5 }) => {
  const abs = useAbsFrame();
  const scroll = (abs * 6) % 80;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", perspective: 600, opacity }}>
      <div
        style={{
          position: "absolute",
          left: "-50%",
          width: "200%",
          bottom: "-10%",
          height: "70%",
          transformOrigin: "50% 100%",
          rotate: "x 72deg",
          backgroundImage: `linear-gradient(${color} 2px, transparent 2px), linear-gradient(90deg, ${color} 2px, transparent 2px)`,
          backgroundSize: "80px 80px",
          backgroundPosition: `0px ${scroll}px`,
          maskImage: "linear-gradient(0deg, black 20%, transparent 90%)",
          WebkitMaskImage: "linear-gradient(0deg, black 20%, transparent 90%)",
          filter: `drop-shadow(0 0 6px ${color})`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ───────────── 前景人群（遮擋）：漫畫墨線風的觀眾剪影揮著應援棒，跟著拍子一起擺 ───────────── */
const STICK_COLORS = ["#2EE6FF", "#FF2E88", "#FFC93C", "#4BE38A", "#FF5A1F", "#B44CFF", "#FFFFFF"];
type HairType = "spiky" | "twin" | "bun" | "cap" | "bob" | "pony";
const HAIRS: HairType[] = ["spiky", "twin", "bun", "cap", "bob", "pony"];

const Head: React.FC<{ x: number; y: number; r: number; type: HairType; fill: string; rim: string; rimSide: number; seed: string }> = ({ x, y, r, type, fill, rim, rimSide, seed }) => {
  const sw = Math.max(3, r * 0.14);
  const common = { fill, stroke: INK, strokeWidth: sw, strokeLinejoin: "round" as const };
  let hair: React.ReactNode = null;
  if (type === "spiky") {
    const pts: string[] = [`${x - r * 1.05},${y + r * 0.35}`];
    const n = 9;
    for (let k = 0; k <= n; k++) {
      const a = Math.PI + (k / n) * Math.PI;
      const rr = k % 2 === 0 ? r * (1.0 + random(`${seed}-sp-${k}`) * 0.1) : r * (1.45 + random(`${seed}-sp-${k}`) * 0.25);
      pts.push(`${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`);
    }
    pts.push(`${x + r * 1.05},${y + r * 0.35}`);
    hair = <polygon points={pts.join(" ")} {...common} />;
  } else if (type === "twin") {
    hair = (
      <g {...common}>
        <ellipse cx={x - r * 1.15} cy={y + r * 0.7} rx={r * 0.42} ry={r * 1.05} transform={`rotate(18 ${x - r * 1.15} ${y + r * 0.7})`} />
        <ellipse cx={x + r * 1.15} cy={y + r * 0.7} rx={r * 0.42} ry={r * 1.05} transform={`rotate(-18 ${x + r * 1.15} ${y + r * 0.7})`} />
      </g>
    );
  } else if (type === "bun") {
    hair = (
      <g {...common}>
        <circle cx={x - r * 0.62} cy={y - r * 0.85} r={r * 0.45} />
        <circle cx={x + r * 0.62} cy={y - r * 0.85} r={r * 0.45} />
      </g>
    );
  } else if (type === "cap") {
    hair = <path d={`M ${x - r * 1.0} ${y - r * 0.15} Q ${x} ${y - r * 1.45} ${x + r * 1.0} ${y - r * 0.15} L ${x + r * 1.0 + rimSide * r * 0.9} ${y - r * 0.05} L ${x + r * 1.0} ${y + r * 0.08} Z`} {...common} />;
  } else if (type === "bob") {
    hair = <path d={`M ${x - r * 1.15} ${y + r * 0.95} Q ${x - r * 1.35} ${y - r * 1.3} ${x} ${y - r * 1.2} Q ${x + r * 1.35} ${y - r * 1.3} ${x + r * 1.15} ${y + r * 0.95} Z`} {...common} />;
  } else {
    hair = <path d={`M ${x + rimSide * -r * 0.6} ${y - r * 0.6} Q ${x + rimSide * -r * 2.0} ${y - r * 0.2} ${x + rimSide * -r * 1.6} ${y + r * 1.6} Q ${x + rimSide * -r * 1.1} ${y + r * 0.4} ${x + rimSide * -r * 0.7} ${y + r * 0.1} Z`} {...common} />;
  }
  return (
    <g>
      {type === "twin" || type === "pony" || type === "bun" ? hair : null}
      <circle cx={x} cy={y} r={r} {...common} />
      {type === "spiky" || type === "cap" || type === "bob" ? hair : null}
      {/* 光棒照到的輪廓光 */}
      <path d={`M ${x + rimSide * r * 0.15} ${y - r * 0.95} A ${r * 0.95} ${r * 0.95} 0 0 ${rimSide > 0 ? 1 : 0} ${x + rimSide * r * 0.9} ${y + r * 0.35}`} fill="none" stroke={rim} strokeWidth={sw * 1.1} strokeLinecap="round" opacity={0.9} />
    </g>
  );
};

export const CrowdForeground: React.FC<{ rim?: string; height?: number; seed?: string; colors?: string[]; wild?: boolean }> = ({
  height = 0.26,
  seed = "crowd",
  colors = STICK_COLORS,
  wild = false,
}) => {
  const abs = useAbsFrame();
  const kick = getKick(abs);
  const beatT = (abs / FPS - 0.2) / (60 / 155);
  const scale = height / 0.26;
  const amp = wild ? 42 : 28;
  const rows = [
    { n: 14, y: H - 125 * scale, r: 30 * scale, fill: "#2a1a44", seedOff: 0 },
    { n: 10, y: H - 45 * scale, r: 44 * scale, fill: "#160d26", seedOff: 100 },
  ];
  const swingAt = (t: number, ri: number, k: number) => Math.sin(Math.PI * t * (wild ? 2 : 1) + ri * 0.6 + (random(`${seed}-p-${k}`) - 0.5) * 0.5) * amp;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id={`stick-glow-${seed}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={10 * scale} />
          </filter>
        </defs>
        {rows.map((row, ri) =>
          new Array(row.n).fill(0).map((_, i) => {
            const k = i + row.seedOff;
            const x = ((i + 0.5) / row.n) * W + (random(`${seed}-x-${k}`) - 0.5) * 70;
            const bounce = wild ? Math.abs(Math.sin(Math.PI * beatT)) * 14 : 0;
            const hy = row.y + (random(`${seed}-y-${k}`) - 0.5) * 20 - kick * 10 * random(`${seed}-j-${k}`) + bounce;
            const side = random(`${seed}-s-${k}`) > 0.5 ? 1 : -1;
            const col = colors[Math.floor(random(`${seed}-c-${k}`) * colors.length)];
            const type = HAIRS[Math.floor(random(`${seed}-h-${k}`) * HAIRS.length)];
            const ang = ((side * 18 + swingAt(beatT, ri, k)) * Math.PI) / 180;
            const shoulderX = x + side * row.r * 1.1;
            const shoulderY = hy + row.r * 1.3;
            const handX = shoulderX + Math.sin(ang) * row.r * 2.6;
            const handY = shoulderY - Math.cos(ang) * row.r * 2.6 - kick * 12;
            const len = row.r * 2.6;
            const tipX = handX + Math.sin(ang) * len;
            const tipY = handY - Math.cos(ang) * len;
            const trail = [-0.12, -0.24].map((dt) => {
              const a2 = ((side * 18 + swingAt(beatT + dt, ri, k)) * Math.PI) / 180;
              return { x: handX + Math.sin(a2) * len, y: handY - Math.cos(a2) * len };
            });
            const sw = Math.max(3, row.r * 0.14);
            return (
              <g key={`${ri}-${i}`}>
                {trail.map((t, ti) => (
                  <line key={ti} x1={handX} y1={handY} x2={t.x} y2={t.y} stroke={col} strokeWidth={row.r * 0.32} strokeLinecap="round" opacity={0.22 - ti * 0.08} />
                ))}
                <line x1={handX} y1={handY} x2={tipX} y2={tipY} stroke={col} strokeWidth={row.r * 0.8} strokeLinecap="round" opacity={0.55} filter={`url(#stick-glow-${seed})`} />
                <line x1={handX} y1={handY} x2={tipX} y2={tipY} stroke={INK} strokeWidth={row.r * 0.46 + sw} strokeLinecap="round" />
                <line x1={handX} y1={handY} x2={tipX} y2={tipY} stroke={col} strokeWidth={row.r * 0.46} strokeLinecap="round" />
                <line x1={handX + Math.sin(ang) * len * 0.15} y1={handY - Math.cos(ang) * len * 0.15} x2={tipX - Math.sin(ang) * len * 0.1} y2={tipY + Math.cos(ang) * len * 0.1} stroke="#FFFFFF" strokeWidth={row.r * 0.14} strokeLinecap="round" />
                {/* 手臂（墨線外框） */}
                <line x1={shoulderX} y1={shoulderY} x2={handX} y2={handY} stroke={INK} strokeWidth={row.r * 0.55 + sw * 2} strokeLinecap="round" />
                <line x1={shoulderX} y1={shoulderY} x2={handX} y2={handY} stroke={row.fill} strokeWidth={row.r * 0.55} strokeLinecap="round" />
                <circle cx={handX} cy={handY} r={row.r * 0.36} fill={row.fill} stroke={INK} strokeWidth={sw} />
                {/* 肩膀 */}
                <path d={`M ${x - row.r * 2.1} ${hy + row.r * 4.4} Q ${x - row.r * 2.0} ${hy + row.r * 1.15} ${x} ${hy + row.r * 1.15} Q ${x + row.r * 2.0} ${hy + row.r * 1.15} ${x + row.r * 2.1} ${hy + row.r * 4.4} Z`} fill={row.fill} stroke={INK} strokeWidth={sw} />
                <Head x={x} y={hy} r={row.r} type={type} fill={row.fill} rim={col} rimSide={side} seed={`${seed}-${k}`} />
              </g>
            );
          }),
        )}
      </svg>
    </AbsoluteFill>
  );
};

/* ───────────── 故障閃爍（區塊雜訊 + 色偏） ───────────── */
export const GlitchBurst: React.FC<{ at: number; dur?: number; strength?: number }> = ({ at, dur = 6, strength = 1 }) => {
  const frame = useFrame();
  const lf = frame - at;
  if (lf < 0 || lf >= dur) return null;
  const k = (1 - lf / dur) * strength;
  const n = 9;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(n).fill(0).map((_, i) => {
        const y = random(`gb-${at}-${lf}-${i}`) * 100;
        const h = 1 + random(`gbh-${at}-${lf}-${i}`) * 7;
        const x = (random(`gbx-${at}-${lf}-${i}`) - 0.5) * 160 * k;
        const col = i % 3 === 0 ? PINK : i % 3 === 1 ? CYAN : "#FFFFFF";
        return <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${y}%`, height: `${h}%`, translate: `${x}px 0px`, background: col, opacity: 0.35 * k, mixBlendMode: "screen" }} />;
      })}
      <AbsoluteFill style={{ background: "#fff", mixBlendMode: "difference", opacity: lf < 2 ? 0.9 * strength : 0 }} />
    </AbsoluteFill>
  );
};

/* ───────────── 轉場（蓋住剪接點） ───────────── */
export type TransitionType = "slash" | "shutter" | "iris" | "pillar" | "impact" | "glitch";
export type Transition = { at: number; type: TransitionType; color?: string };

const Slash: React.FC<{ p: number; color: string }> = ({ p, color }) => {
  // p: -1 → 0（蓋滿）→ 1
  const x = p * 140;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: "-20%", translate: `${x - 18}% 0%`, background: color, clipPath: "polygon(20% 0, 70% 0, 50% 100%, 0 100%)" }} />
      <div style={{ position: "absolute", inset: "-20%", translate: `${x}% 0%`, background: "#07040c", clipPath: "polygon(30% 0, 100% 0, 80% 100%, 10% 100%)" }} />
      <div style={{ position: "absolute", inset: "-20%", translate: `${x + 22}% 0%`, background: CYAN, clipPath: "polygon(78% 0, 82% 0, 62% 100%, 58% 100%)" }} />
    </AbsoluteFill>
  );
};

const Shutter: React.FC<{ p: number; color: string }> = ({ p, color }) => {
  const n = 9;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(n).fill(0).map((_, i) => {
        const d = (i / n) * 0.35;
        const q = p < 0 ? interpolate(p, [-1 + d, -0.2 + d * 0.5], [0, 1], { ...clamp, easing: inExpo }) : interpolate(p, [d * 0.5, 0.65 + d], [1, 0], { ...clamp, easing: outExpo });
        return (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${(i / n) * 100}%`, height: `${100 / n + 0.3}%`, background: i % 2 ? "#07040c" : color, scale: `1 ${q}` }} />
        );
      })}
    </AbsoluteFill>
  );
};

const Iris: React.FC<{ p: number; color: string }> = ({ p, color }) => {
  const r = p < 0 ? interpolate(p, [-1, 0], [130, 0], { easing: inExpo }) : interpolate(p, [0, 1], [0, 130], { easing: outExpo });
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: `radial-gradient(circle at 50% 50%, transparent ${r}%, ${color} ${r + 0.5}%, ${color} ${r + 2}%, #07040c ${r + 2.5}%)`,
      }}
    />
  );
};

const Pillar: React.FC<{ p: number }> = ({ p }) => {
  // 前景柱子快速橫過鏡頭，剪接點藏在柱子後面
  const x = interpolate(p, [-1, 1], [-60, 130]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: "-10%", bottom: "-10%", left: `${x}%`, width: "58%", background: "linear-gradient(90deg, transparent, #050308 18%, #0b0812 50%, #050308 82%, transparent)", filter: "blur(14px)", rotate: "4deg" }} />
      <div style={{ position: "absolute", top: "-10%", bottom: "-10%", left: `${x + 18}%`, width: "1.2%", background: "#FF5A1F", opacity: 0.6, filter: "blur(6px)", rotate: "4deg" }} />
    </AbsoluteFill>
  );
};

const HALF = 7; // 轉場前後各 7 格

/** 依剪接點清單，畫出蓋住剪接點的轉場 */
export const TransitionLayer: React.FC<{ items: Transition[] }> = ({ items }) => {
  const abs = useAbsFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {items.map((t) => {
        const d = abs - t.at;
        if (d < -HALF || d > HALF) return null;
        const p = d / HALF;
        const color = t.color ?? "#FF5A1F";
        switch (t.type) {
          case "slash":
            return <Slash key={`${t.at}-${t.type}`} p={p} color={color} />;
          case "shutter":
            return <Shutter key={`${t.at}-${t.type}`} p={p} color={color} />;
          case "iris":
            return <Iris key={`${t.at}-${t.type}`} p={p} color={color} />;
          case "pillar":
            return <Pillar key={`${t.at}-${t.type}`} p={p} />;
          case "impact":
            return d >= 0 && d < 3 ? <AbsoluteFill key={`${t.at}-${t.type}`} style={{ background: "#fff", mixBlendMode: "difference" }} /> : null;
          case "glitch":
            return d >= -2 && d < 4 ? <GlitchAt key={`${t.at}-${t.type}`} lf={d + 2} seed={t.at} /> : null;
          default:
            return null;
        }
      })}
    </AbsoluteFill>
  );
};

const GlitchAt: React.FC<{ lf: number; seed: number }> = ({ lf, seed }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {new Array(10).fill(0).map((_, i) => {
      const y = random(`ga-${seed}-${lf}-${i}`) * 100;
      const h = 1 + random(`gah-${seed}-${lf}-${i}`) * 8;
      const x = (random(`gax-${seed}-${lf}-${i}`) - 0.5) * 200;
      return <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${y}%`, height: `${h}%`, translate: `${x}px 0px`, background: i % 2 ? PINK : CYAN, opacity: 0.45, mixBlendMode: "screen" }} />;
    })}
  </AbsoluteFill>
);

/* ───────────── 切入（カットイン）：斜帶裡的成員半身＋彩色剪影，名字放在臉的另一側 ───────────── */
export const CutIn: React.FC<{ member: MemberId; at: number; dur: number; y?: number; flip?: boolean }> = ({ member, at, dur, y = 34, flip = false }) => {
  const frame = useFrame();
  const lf = frame - at;
  if (lf < 0 || lf > dur) return null;
  const m = MEMBERS[member];
  const src = resolveAsset(m.asset);
  const dir = flip ? -1 : 1;
  const inP = interpolate(lf, [0, 7], [1, 0], { ...clamp, easing: outExpo });
  const outP = interpolate(lf, [dur - 5, dur], [0, 1], { ...clamp, easing: inExpo });
  const x = (inP * 115 - outP * 115) * dir;
  const x2 = (inP * 160 - outP * 80) * dir; // 後面那條細帶走得比較快（視差）
  const drift = interpolate(lf, [0, dur], [0, -40]) * dir;
  const namePop = interpolate(lf, [3, 9], [0, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  const OFF = 6000;
  const BAND_H = 360;
  // 臉的目標位置：從左切入時在畫面 30%，從右切入時在 70%；臉的高度在色帶的上方 40%
  const IMG_W = 1000;
  const IMG_H = (IMG_W * 1216) / 832;
  const [fx, fy] = faceOf(member);
  const BAND_LEFT = -192; // 色帶從畫面 -10% 開始
  const imgLeft = (flip ? 1344 : 576) - BAND_LEFT - fx * IMG_W;
  const imgTop = BAND_H * 0.4 - fy * IMG_H;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* 後方細帶 */}
      <div style={{ position: "absolute", left: "-10%", width: "120%", top: `calc(${y}% - 34px)`, height: BAND_H + 68, rotate: `${-7 * dir}deg`, translate: `${x2}% 0%`, background: m.color, borderTop: `6px solid ${INK}`, borderBottom: `6px solid ${INK}`, opacity: 0.95 }} />
      {/* 主帶 */}
      <div style={{ position: "absolute", left: "-10%", width: "120%", top: `${y}%`, height: BAND_H, rotate: `${-7 * dir}deg`, translate: `${x}% 0%`, overflow: "hidden", background: INK, borderTop: `8px solid #FFF6E8`, borderBottom: `8px solid #FFF6E8` }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(${110 * dir}deg, ${m.color}33 0 18px, transparent 18px 46px)`, translate: `${lf * 14 * dir}px 0px` }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${m.color}66 2.5px, transparent 2.5px)`, backgroundSize: "16px 16px", maskImage: `linear-gradient(${flip ? 270 : 90}deg, black 20%, transparent 70%)`, WebkitMaskImage: `linear-gradient(${flip ? 270 : 90}deg, black 20%, transparent 70%)` }} />
        {src ? (
          <div style={{ position: "absolute", left: imgLeft, top: imgTop, width: IMG_W, height: IMG_H, translate: `${drift}px 0px`, rotate: `${7 * dir}deg`, transformOrigin: `${fx * 100}% ${fy * 100}%` }}>
            <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: "100%", translate: `-${OFF}px 0px`, filter: `drop-shadow(${OFF + 30 * dir}px 14px 0 ${m.color})` }} />
            <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: "100%" }} />
          </div>
        ) : null}
        <div style={{ position: "absolute", [flip ? "left" : "right"]: "17%", top: 70, rotate: `${7 * dir}deg`, scale: String(namePop), textAlign: flip ? "left" : "right" }}>
          <div style={{ position: "relative", fontFamily: FONT_EN, fontSize: 176, lineHeight: 1, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
            <span style={{ position: "absolute", left: 0, top: 0, color: INK, WebkitTextStroke: `16px ${INK}`, filter: `drop-shadow(10px 10px 0 ${m.color})` }}>{m.name}</span>
            <span style={{ position: "relative", color: "#FFF6E8" }}>{m.name}</span>
          </div>
          <div style={{ display: "inline-block", marginTop: 6, padding: "2px 16px", background: m.color, color: INK, fontFamily: FONT_EN, fontSize: 44, letterSpacing: "0.12em", border: `4px solid ${INK}` }}>{m.role}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── 開機字幕（前奏的 cyber 開場） ───────────── */
export const BootText: React.FC<{ lines: { at: number; text: string }[] }> = ({ lines }) => {
  const frame = useFrame();
  return (
    <div style={{ position: "absolute", left: 90, top: 150, fontFamily: FONT_MONO, fontSize: 30, color: CYAN, lineHeight: 1.6, textShadow: `0 0 10px ${CYAN}` }}>
      {lines.map((l, i) => {
        const lf = frame - l.at;
        if (lf < 0) return null;
        const n = Math.min(l.text.length, Math.floor(lf * 1.6));
        const cursor = i === lines.filter((x) => frame >= x.at).length - 1 && Math.floor(frame / 8) % 2 === 0;
        return (
          <div key={i} style={{ color: l.text.includes("IGNITION") ? "#FF5A1F" : CYAN }}>
            {l.text.slice(0, n)}
            {cursor ? "_" : ""}
          </div>
        );
      })}
    </div>
  );
};

/* ───────────── 鎖定框（掃描準星） ───────────── */
export const Reticle: React.FC<{ x: number; y: number; size?: number; color?: string; at?: number }> = ({ x, y, size = 260, color = CYAN, at = 0 }) => {
  const frame = useFrame();
  const lf = frame - at;
  const s = interpolate(lf, [0, 8], [1.8, 1], { ...clamp, easing: outExpo });
  const o = interpolate(lf, [0, 4], [0, 1], clamp);
  const rot = lf * 1.5;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, scale: String(s), opacity: o, pointerEvents: "none" }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", filter: `drop-shadow(0 0 4px ${color})` }}>
        <g fill="none" stroke={color} strokeWidth={1.2}>
          <path d="M0 18 V0 H18 M82 0 H100 V18 M100 82 V100 H82 M18 100 H0 V82" strokeWidth={2} />
          <circle cx={50} cy={50} r={30} strokeDasharray="6 5" transform={`rotate(${rot} 50 50)`} />
          <line x1={50} y1={10} x2={50} y2={22} />
          <line x1={50} y1={78} x2={50} y2={90} />
          <line x1={10} y1={50} x2={22} y2={50} />
          <line x1={78} y1={50} x2={90} y2={50} />
        </g>
      </svg>
    </div>
  );
};

/** 相機在大鼓上的震動（副歌用） */
export const useKickShake = (amount = 10) => {
  const abs = useAbsFrame();
  const k = getKick(abs);
  return `${(random(`ks-${abs}`) - 0.5) * k * amount}px ${(random(`ksy-${abs}`) - 0.5) * k * amount}px`;
};

export const CYBER = { CYAN, PINK, H, W };
