import React from "react";
import { AbsoluteFill, Easing, interpolate, random } from "remotion";
import { useAbsFrame } from "../context";
import { FONT_DISPLAY, FONT_EN, FONT_JP, FONT_MONO } from "../fonts";
import { TRANSITIONS } from "../cuts";
import { FireWord } from "./FireText";
import { Lyric, LYRICS } from "../lyrics";
import { B, BAR, beatPulse, FPS, OFFSET } from "../timing";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outBack = Easing.bezier(0.34, 1.56, 0.64, 1);
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

const INK = "#120818";
const CREAM = "#FFF6E8";
const FIRE_GRADIENT = "linear-gradient(180deg, #FFF3B0 0%, #FFC93C 35%, #FF6A1F 70%, #E8261C 100%)";
const ACCENTS = ["#FF5A1F", "#FF2E88", "#2EE6FF", "#FFC93C"];

/** 估算字寬：全形 1、半形 0.58 */
const measure = (s: string) => Array.from(s).reduce((w, c) => w + (c.charCodeAt(0) < 0x2000 ? 0.58 : 1), 0);
const fit = (s: string, max: number, width = 1700) => Math.min(max, width / Math.max(1, measure(s)));

type P = { l: Lyric; f: number; dur: number };

/** 進出場共用的淡出 */
const exitOpacity = (f: number, dur: number, frames = 6) => interpolate(f, [dur - frames, dur], [1, 0], clamp);

/* 「最強」等關鍵字上色 */
const KEYWORDS = ["最強", "灼熱", "Revolution", "Bonfire!", "本気", "Speed", "Hot", "Soul", "Mental", "Action", "Vibes"];
const isKey = (s: string) => KEYWORDS.includes(s);
const splitKeys = (text: string) => {
  const re = new RegExp(`(${KEYWORDS.map((k) => k.replace(/[!?]/g, "\\$&")).join("|")})`, "g");
  return text.split(re).filter((p) => p.length);
};

/**
 * 漫畫描邊字：底層粗墨線＋硬陰影、上層實心字。
 * 用兩層疊起來，而不是靠 paint-order，確保渲染器一定畫得出來。
 */
const Ink: React.FC<{ children: React.ReactNode; stroke?: number; shadow?: string; shadowOff?: number; color?: string; style?: React.CSSProperties }> = ({
  children,
  stroke = 12,
  shadow,
  shadowOff = 8,
  color = CREAM,
  style,
}) => (
  <span style={{ position: "relative", display: "inline-block", whiteSpace: "pre", ...style }}>
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        color: INK,
        WebkitTextStroke: `${stroke}px ${INK}`,
        filter: shadow ? `drop-shadow(${shadowOff}px ${shadowOff}px 0 ${shadow})` : undefined,
      }}
    >
      {children}
    </span>
    <span style={{ position: "relative", color }}>{children}</span>
  </span>
);

/* ─── 開場 rap：一次只出現一個字，每個字一種構圖，硬切（放在畫面下半，不擋臉） ─── */
const SHOUT_LAYOUTS = [
  { x: 50, y: 66, rot: -6, slab: "#FF2E88" },
  { x: 32, y: 62, rot: 4, slab: "#2EE6FF" },
  { x: 66, y: 70, rot: -3, slab: "#FF5A1F" },
  { x: 50, y: 64, rot: 7, slab: "#FFC93C" },
];
const Shout: React.FC<P> = ({ l, f, dur }) => {
  const words = l.text.split(" ");
  const span = dur * 0.86;
  const per = span / words.length; // 沒有 wordTimes 時的估算：單字均分整句
  // 每個字出現的影格：有實測的唱字時間就用它（提早 1 格，畫面略早於聲音）
  const s0 = Math.round(l.start * FPS);
  const starts = l.wordTimes ? l.wordTimes.map((t) => Math.round(t * FPS) - s0 - 1) : words.map((_, k) => k * per);
  if (f < starts[0]) return null;
  let i = 0;
  for (let k = 0; k < starts.length; k++) if (f >= starts[k]) i = k;
  const lf = f - starts[i];
  const w = words[i];
  const L = SHOUT_LAYOUTS[(i + Math.round(l.start)) % SHOUT_LAYOUTS.length];
  const pop = interpolate(lf, [0, 3], [1.7, 1], { ...clamp, easing: outExpo });
  const shake = interpolate(lf, [0, 5], [14, 0], clamp);
  const sx = (random(`sh-${l.start}-${i}-${Math.floor(lf)}`) - 0.5) * shake;
  const size = Math.min(300, 1450 / Math.max(3, w.length * 0.62));
  return (
    <AbsoluteFill style={{ opacity: exitOpacity(f, dur, 3) }}>
      <div
        style={{
          position: "absolute",
          left: "-10%",
          right: "-10%",
          top: `${L.y - 13}%`,
          height: "26%",
          background: L.slab,
          rotate: `${L.rot}deg`,
          scale: `${interpolate(lf, [0, 4], [0, 1], { ...clamp, easing: outExpo })} 1`,
          opacity: 0.85,
          mixBlendMode: "multiply",
          borderTop: `8px solid ${INK}`,
          borderBottom: `8px solid ${INK}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${L.x}%`,
          top: `${L.y}%`,
          translate: `calc(-50% + ${sx}px) -50%`,
          rotate: `${L.rot}deg`,
          scale: String(pop),
          fontFamily: FONT_EN,
          fontSize: size,
          lineHeight: 1,
          whiteSpace: "nowrap",
          letterSpacing: "0.02em",
        }}
      >
        <Ink stroke={16} shadow={L.slab} shadowOff={12}>
          {w.toUpperCase()}
        </Ink>
      </div>
    </AbsoluteFill>
  );
};

/* ─── 故障字 ─── */
const Glitch: React.FC<P> = ({ l, f, dur }) => {
  const abs = useAbsFrame();
  const step = Math.floor(abs / 2);
  const chars = Array.from(l.text);
  const shown = Math.ceil(interpolate(f, [0, Math.min(dur * 0.6, chars.length * 2)], [0, chars.length], clamp));
  const txt = chars.slice(0, shown).join("");
  const size = fit(l.text, 104);
  const jx = (random(`g-${step}`) - 0.5) * 18;
  const jy = (random(`gy-${step}`) - 0.5) * 6;
  const base: React.CSSProperties = { position: "absolute", width: "100%", textAlign: "center", top: "76%", fontFamily: FONT_DISPLAY, fontSize: size, whiteSpace: "nowrap" };
  return (
    <AbsoluteFill style={{ opacity: exitOpacity(f, dur, 3) }}>
      <div style={{ ...base, color: "#2EE6FF", translate: `${jx}px ${jy}px`, mixBlendMode: "screen" }}>{txt}</div>
      <div style={{ ...base, color: "#FF2E88", translate: `${-jx}px ${-jy}px`, mixBlendMode: "screen" }}>{txt}</div>
      <div style={base}>
        <Ink stroke={12}>{txt}</Ink>
      </div>
    </AbsoluteFill>
  );
};

/* ─── 主歌：斜色帶上的描邊字，一個字一個字砸下來。layout 可指定放在畫面留白處、分行或直排 ─── */
const Verse: React.FC<P> = ({ l, f, dur }) => {
  const L = l.layout;
  const lines = L?.lines ?? [l.text];
  const vertical = !!L?.vertical;
  const center = L?.anchor === "center";
  const total = lines.reduce((n, s) => n + Array.from(s).length, 0);
  const typeDur = Math.min(dur * 0.6, total * 0.08 * FPS);
  // 每個字出現的影格：有 times（人聲起音對到的時間）就用它，否則平均分配
  const s0 = Math.round(l.start * FPS);
  // 有 times（人聲起音）時以「一個文字格」為單位：整格在該行第一個字唱到前 3 格一起出現，不逐字跳
  const LEAD = 3;
  const rowMode = !!L?.times;
  const rowAt = (k: number) => Math.max(0, Math.round((L?.times?.[k] ?? 0) * FPS) - s0 - LEAD);
  const charAt = (k: number) => (k / total) * typeDur;
  const size = L?.size ?? fit(l.text, 86, 1180);
  const lineNo = LYRICS.filter((x) => x.style === "verse" && x.start <= l.start).length;
  const accent = ACCENTS[lineNo % ACCENTS.length];
  const tag = interpolate(f, [0, 6], [0, 1], clamp);
  const out = interpolate(f, [dur - 6, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const pos: React.CSSProperties = L ? { left: `${L.x}%`, top: `${L.y}%`, translate: center ? "-50% 0%" : undefined } : { left: 96, bottom: 120 };
  let idx = 0;
  return (
    <AbsoluteFill style={{ opacity: 1 - out, translate: `${-out * 80}px 0px` }}>
      <div style={{ position: "absolute", ...pos, display: "flex", flexDirection: "column", alignItems: center ? "center" : "flex-start" }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: "#2EE6FF", letterSpacing: "0.25em", marginBottom: 10, marginLeft: 6, opacity: tag, whiteSpace: "nowrap" }}>
          {l.start < 100 ? "VERSE 01" : "VERSE 02"} <span style={{ color: accent }}>//</span> LINE {String(lineNo).padStart(2, "0")}
        </div>
        <div style={{ display: "flex", flexDirection: vertical ? "row-reverse" : "column", gap: vertical ? 22 : 12, alignItems: vertical ? "flex-start" : center ? "center" : "flex-start" }}>
          {lines.map((line, li) => {
            const chars = Array.from(line);
            const first = idx;
            idx += chars.length;
            const t0 = rowMode ? rowAt(first) : charAt(first);
            const t1 = rowMode ? t0 + 1 : charAt(idx - 1) + 2;
            const slab = interpolate(f, [t0 - 1, t0, t1 + 4], [0, rowMode ? 0.35 : 0.12, 1], { ...clamp, easing: rowMode ? outExpo : Easing.out(Easing.quad) });
            const col = ACCENTS[(lineNo + li) % ACCENTS.length];
            return (
              <div key={li} style={{ position: "relative", padding: vertical ? "26px 14px 34px" : "0 34px 0 26px", marginLeft: vertical || center ? 0 : li * size * 0.35 }}>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: vertical ? 0 : "12%",
                    bottom: vertical ? 0 : "2%",
                    background: col,
                    transform: vertical ? "skewY(-10deg)" : "skewX(-14deg)",
                    border: `5px solid ${INK}`,
                    boxShadow: `10px 10px 0 ${INK}`,
                    scale: vertical ? `1 ${slab}` : `${slab} 1`,
                    transformOrigin: vertical ? "50% 0%" : "0% 50%",
                  }}
                />
                <div style={{ position: "relative", fontFamily: FONT_DISPLAY, fontSize: size, lineHeight: 1.2, whiteSpace: "nowrap", writingMode: vertical ? "vertical-rl" : undefined }}>
                  {chars.map((c, i) => {
                    // 文字格模式：整格一起落下，只留 1 格的細微先後，看起來是一整塊砸進來
                    const at = rowMode ? t0 + Math.min(i, 4) * 0.6 : charAt(first + i);
                    const p = interpolate(f, [at, at + 5], [0, 1], { ...clamp, easing: outBack });
                    const rot = (random(`vr-${l.start}-${first + i}`) - 0.5) * 30;
                    return (
                      <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p > 0 ? 1 : 0, translate: `0px ${(1 - p) * -60}px`, rotate: `${(1 - p) * rot}deg`, scale: String(1 + (1 - p) * 0.6) }}>
                        <Ink stroke={11} shadow={INK} shadowOff={6}>
                          {c}
                        </Ink>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ─── (Can challenge it)：漫畫爆炸對話框，單字一個個彈出 ─── */
const burstPoints = (w: number, h: number, seed: string, spikes = 22) => {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 1 + random(`${seed}-o-${i}`) * 0.16 : 0.78 + random(`${seed}-i-${i}`) * 0.06;
    pts.push(`${w / 2 + Math.cos(a) * (w / 2) * r * 0.92},${h / 2 + Math.sin(a) * (h / 2) * r * 0.92}`);
  }
  return pts.join(" ");
};
const Callout: React.FC<P> = ({ l, f, dur }) => {
  const second = l.text.startsWith("Will");
  const words = l.text.split(" ");
  const fill = second ? "#2EE6FF" : "#FFC93C";
  const shadow = second ? "#FF2E88" : "#FF5A1F";
  const pop = interpolate(f, [0, 6], [0, 1], { ...clamp, easing: outBack });
  const wobble = Math.sin(f / 3) * 2;
  const W2 = 880;
  const H2 = 360;
  return (
    <AbsoluteFill style={{ opacity: exitOpacity(f, dur, 4) }}>
      <div style={{ position: "absolute", width: W2, height: H2, right: second ? undefined : 70, left: second ? 70 : undefined, top: second ? 150 : 110, rotate: `${(second ? 6 : -7) + wobble}deg`, scale: String(pop) }}>
        <svg width={W2} height={H2} viewBox={`0 0 ${W2} ${H2}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {new Array(10).fill(0).map((_, i) => {
            const a = (i / 10) * Math.PI * 2 + 0.3;
            const r1 = 1.05;
            const r2 = 1.25 + random(`cl-${l.start}-${i}`) * 0.15;
            return (
              <line key={i} x1={W2 / 2 + Math.cos(a) * (W2 / 2) * r1} y1={H2 / 2 + Math.sin(a) * (H2 / 2) * r1} x2={W2 / 2 + Math.cos(a) * (W2 / 2) * r2} y2={H2 / 2 + Math.sin(a) * (H2 / 2) * r2} stroke={INK} strokeWidth={8} strokeLinecap="round" />
            );
          })}
          <polygon points={burstPoints(W2, H2, `cb-${l.start}`)} fill={shadow} transform="translate(14 14)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <polygon points={burstPoints(W2, H2, `cb-${l.start}`)} fill={fill} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 22, padding: "0 120px", fontFamily: FONT_EN, color: INK, whiteSpace: "nowrap" }}>
          {words.map((w, i) => {
            const wp = interpolate(f, [2 + i * 3, 7 + i * 3], [0, 1], { ...clamp, easing: outBack });
            const last = i === words.length - 1;
            const word = w.toUpperCase() + (last ? "!" : "");
            return (
              <span key={i} style={{ position: "relative", display: "inline-block", fontSize: last ? 88 : 68, scale: String(wp), rotate: `${(i % 2 ? 4 : -4) * (1 - wp)}deg` }}>
                <span aria-hidden style={{ position: "absolute", left: 0, top: 0, color: "#FFF6E8", WebkitTextStroke: "12px #FFF6E8", filter: `drop-shadow(5px 5px 0 ${INK})` }}>
                  {word}
                </span>
                <span style={{ position: "relative" }}>{word}</span>
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ─── 文字主體（畫面沒有人物時，讓歌詞自己撐起構圖） ─── */
const Hero: React.FC<P> = ({ l, f, dur }) => {
  const chunks = l.hero ?? [{ text: l.text, size: 120 }];
  const singDur = Math.min(dur * 0.75, (Array.from(l.text).length * 0.12 + 0.2) * FPS);
  const per = singDur / chunks.length;
  const accent = l.start < 42 ? "#FF2E88" : "#FFC93C";
  const grad = l.start < 42 ? FIRE_GRADIENT : "linear-gradient(180deg, #FFFFFF 0%, #FFF0B0 40%, #FFC93C 75%, #FF8A1F 100%)";
  const abs = useAbsFrame();
  const xs = [-170, 30, 190];
  // 色帶在關鍵字（第二段）唱到時展開
  const bandAt = chunks[1]?.at !== undefined ? Math.round(chunks[1].at * FPS) - Math.round(l.start * FPS) : per * 0.8;
  const rots = [-6, -2, -4];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: exitOpacity(f, dur, 6), scale: String(interpolate(f, [0, dur], [1, 1.06])) }}>
      {/* 主體後方的爆炸色帶 */}
      <div style={{ position: "absolute", left: "-10%", right: "-10%", top: "38%", height: "26%", background: accent, rotate: "-4deg", borderTop: `10px solid ${INK}`, borderBottom: `10px solid ${INK}`, scale: `${interpolate(f, [bandAt, bandAt + 6], [0, 1], { ...clamp, easing: outExpo })} 1`, opacity: 0.9 }} />
      {chunks.map((c, i) => {
        const at = c.at !== undefined ? Math.max(0, Math.round(c.at * FPS) - Math.round(l.start * FPS)) : i * per;
        const lf = f - at;
        const p = interpolate(lf, [0, 5], [0, 1], { ...clamp, easing: outBack });
        const shake = interpolate(lf, [0, 6], [c.key ? 18 : 8, 0], clamp);
        const sx = (random(`hero-${l.start}-${i}-${abs}`) - 0.5) * shake;
        const dir = i % 2 ? 1 : -1;
        return (
          <div
            key={i}
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: c.size,
              lineHeight: 1.04,
              whiteSpace: "nowrap",
              opacity: lf >= 0 ? 1 : 0,
              translate: `${xs[i % 3] + sx + (1 - p) * 260 * dir}px 0px`,
              rotate: `${rots[i % 3]}deg`,
              scale: String(1 + (1 - p) * 0.9),
            }}
          >
            {c.key ? (
              <span style={{ position: "relative", display: "inline-block" }}>
                <span aria-hidden style={{ position: "absolute", left: 0, top: 0, color: INK, WebkitTextStroke: `22px ${INK}`, filter: `drop-shadow(14px 14px 0 ${l.start < 42 ? "#2EE6FF" : "#FF2E88"})` }}>
                  {c.text}
                </span>
                <span style={{ position: "relative", backgroundImage: grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{c.text}</span>
              </span>
            ) : (
              <Ink stroke={15} shadow={accent} shadowOff={10}>
                {c.text}
              </Ink>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ─── Party lighting! ─── */
const CallBig: React.FC<P> = ({ l, f, dur }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: exitOpacity(f, dur, 3) }}>
    <div style={{ fontFamily: FONT_EN, fontSize: 240, scale: String(interpolate(f, [0, dur], [0.7, 1.15], { ...clamp, easing: outExpo })), letterSpacing: "0.04em", whiteSpace: "nowrap", filter: "drop-shadow(0 0 30px #FF2E88)" }}>
      <Ink stroke={16} shadow="#FF2E88" shadowOff={12}>
        {l.text.toUpperCase()}
      </Ink>
    </div>
  </AbsoluteFill>
);

/* ─── 預副歌：逐字由模糊變清楚，描邊＋火光 ─── */
const Pre: React.FC<P & { big?: boolean }> = ({ l, f, dur, big }) => {
  const lines = big ? l.text.split("　") : [l.text];
  const all = Array.from(l.text.replace("　", ""));
  const revealDur = Math.min(dur * 0.55, all.length * 0.12 * FPS);
  const grow = big ? interpolate(f, [0, dur], [1, 1.16], clamp) : 1;
  const abs = useAbsFrame();
  const shake = big ? interpolate(f, [dur * 0.5, dur], [0, 7], clamp) : 0;
  const sx = (random(`ps-${abs}`) - 0.5) * shake;
  const sy = (random(`psy-${abs}`) - 0.5) * shake;
  const heat = big ? 0.4 + (f / dur) * 0.6 : 0.5;
  let idx = 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: exitOpacity(f, dur, 5), scale: String(grow), translate: `${sx}px ${sy}px` }}>
      {lines.map((line, li) => (
        <div
          key={li}
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: big ? fit(line, 126, 1560) : 136,
            whiteSpace: "nowrap",
            lineHeight: 1.3,
            marginTop: big ? 0 : 300,
            filter: `drop-shadow(0 0 24px rgba(255,110,30,${heat}))`,
          }}
        >
          {Array.from(line).map((c) => {
            const at = (idx++ / all.length) * revealDur;
            const o = interpolate(f, [at, at + 6], [0, 1], clamp);
            return (
              <span key={idx} style={{ display: "inline-block", whiteSpace: "pre", opacity: o, filter: o < 1 ? `blur(${(1 - o) * 12}px)` : undefined, scale: String(1 + (1 - o) * 0.6) }}>
                <Ink stroke={13} shadow="#FF5A1F" shadowOff={8}>
                  {c}
                </Ink>
              </span>
            );
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};

/* ─── 副歌：墨線描邊大字，唱到哪裡燒成火焰色（填色進度為估算）。layout 可放到畫面留白處、分行或直排 ─── */
const ChorusText: React.FC<{ text: string; size: number; wipe: number; vertical?: boolean }> = ({ text, size, wipe, vertical }) => {
  const parts = splitKeys(text);
  const st: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontSize: size, whiteSpace: "nowrap", lineHeight: 1.15, letterSpacing: "0.01em", writingMode: vertical ? "vertical-rl" : undefined };
  const sw = Math.round(size * 0.12);
  const off = Math.round(size * 0.078);
  return (
    <div style={{ position: "relative" }}>
      <div aria-hidden style={{ ...st, position: "absolute", left: 0, top: 0, color: INK, WebkitTextStroke: `${sw}px ${INK}`, filter: `drop-shadow(${off}px ${off}px 0 #FF2E5B)` }}>
        {text}
      </div>
      <div style={{ ...st, position: "relative", color: CREAM }}>
        {parts.map((p, i) => (
          <span key={i} style={{ color: isKey(p) ? "#FFE07A" : CREAM }}>
            {p}
          </span>
        ))}
      </div>
      <div
        style={{
          ...st,
          position: "absolute",
          left: 0,
          top: 0,
          backgroundImage: vertical ? FIRE_GRADIENT.replace("180deg", "90deg") : FIRE_GRADIENT,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          clipPath: vertical ? `inset(-20% -20% ${100 - wipe}% -20%)` : `inset(-20% ${100 - wipe}% -20% 0)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Backing: React.FC<{ text: string; wipe: number; f: number; vertical?: boolean }> = ({ text, wipe, f, vertical }) => (
  <div style={{ position: "relative", fontFamily: FONT_JP, fontWeight: 900, fontSize: 54, rotate: vertical ? "2deg" : "-3deg", scale: String(interpolate(f, [0, 5], [0.5, 1], { ...clamp, easing: outBack })), whiteSpace: "nowrap", writingMode: vertical ? "vertical-rl" : undefined }}>
    <span style={{ display: "inline-block", padding: vertical ? "22px 4px" : "2px 22px", background: INK, border: `3px solid #2EE6FF`, boxShadow: `6px 6px 0 #2EE6FF` }}>
      <span style={{ position: "relative" }}>
        <span style={{ color: "transparent", WebkitTextStroke: `2px ${CREAM}` }}>{text}</span>
        <span style={{ position: "absolute", left: 0, top: 0, color: "#2EE6FF", clipPath: vertical ? `inset(0 0 ${100 - wipe}% 0)` : `inset(0 ${100 - wipe}% 0 0)` }}>{text}</span>
      </span>
    </span>
  </div>
);

const Chorus: React.FC<P> = ({ l, f, dur }) => {
  const abs = useAbsFrame();
  const L = l.layout;
  const lines = L?.lines ?? [l.text];
  const vertical = !!L?.vertical;
  // 和聲句的實際結構（左右聲道分析量出來的）：和聲在 LRC 時間後約 0.25 秒才開始唱，唱滿一小節，主唱接在後面。
  // 所以和聲框在那時才出現，主唱那一行等和聲唱完才砸進來，不會先把整句攤在畫面上。
  const bAt = l.backing ? 7 : 0;
  const mAt = l.backing ? Math.round(7 + BAR * FPS) : 0;
  const mainChars = Array.from(l.text).length;
  const mainSing = l.sing ? l.sing * FPS : Math.min(Math.max(6, (dur - mAt) * 0.9), (mainChars * 0.2 + 0.2) * FPS);
  const wipeMain = interpolate(f, [mAt, mAt + mainSing], [0, 1], clamp);
  const wipeBack = l.backing ? interpolate(f, [bAt, mAt - 2], [0, 100], clamp) : 0;
  const size = L?.size ?? fit(l.text, 116, 1560);
  const pop = interpolate(f, [mAt, mAt + 6], [1.25, 1], { ...clamp, easing: outBack });
  const mainOn = f >= mAt;
  const bounce = 1 + beatPulse(abs, 8) * 0.025;
  const counts = lines.map((s) => Array.from(s).length);
  const total = counts.reduce((a, b) => a + b, 0);
  let acc = 0;
  const wipes = counts.map((n) => {
    const w = Math.max(0, Math.min(1, (wipeMain * total - acc) / n)) * 100;
    acc += n;
    return w;
  });
  const fade = exitOpacity(f, dur, 5) * interpolate(f, [0, 3], [0, 1], clamp);

  if (!L) {
    return (
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 104, opacity: fade }}>
        {l.backing ? (
          <div style={{ marginBottom: 10, opacity: f >= bAt ? 1 : 0 }}>
            <Backing text={l.backing} wipe={wipeBack} f={f - bAt} />
          </div>
        ) : null}
        <div style={{ scale: String(pop * bounce), opacity: mainOn ? 1 : 0 }}>
          <ChorusText text={l.text} size={size} wipe={wipes[0]} />
        </div>
      </AbsoluteFill>
    );
  }

  const anchor = L.anchor ?? "left";
  const pos: React.CSSProperties =
    anchor === "right" ? { right: `${100 - L.x}%`, top: `${L.y}%` } : anchor === "center" ? { left: `${L.x}%`, top: `${L.y}%`, translate: "-50% 0%" } : { left: `${L.x}%`, top: `${L.y}%` };
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <div
        style={{
          position: "absolute",
          ...pos,
          display: "flex",
          flexDirection: vertical ? "row-reverse" : "column",
          alignItems: vertical ? "flex-start" : anchor === "center" ? "center" : "flex-start",
          gap: vertical ? 18 : 8,
          scale: String(bounce),
          transformOrigin: anchor === "right" ? "100% 0%" : "0% 0%",
        }}
      >
        {l.backing ? (
          <div style={{ marginBottom: vertical ? 0 : 6, marginTop: vertical ? 30 : 0, opacity: f >= bAt ? 1 : 0 }}>
            <Backing text={l.backing} wipe={wipeBack} f={f - bAt} vertical={vertical} />
          </div>
        ) : null}
        {lines.map((ln, i) => {
          const at = i === 0 ? mAt : mAt + (counts.slice(0, i).reduce((a, b) => a + b, 0) / total) * mainSing - 2;
          const p = interpolate(f, [at, at + 5], [0, 1], { ...clamp, easing: outBack });
          return (
            <div key={i} style={{ marginLeft: vertical || anchor !== "left" ? 0 : i * size * 0.3, marginTop: vertical ? i * size * 0.4 : 0, opacity: f >= at ? 1 : 0, scale: String(i === 0 ? pop : 1 + (1 - p) * 0.5) }}>
              <ChorusText text={ln} size={size} wipe={wipes[i]} vertical={vertical} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ─── NO, NO!! 蓋章：印章和後半句左右並列在畫面下方，兩邊都有框，視覺份量相當 ─── */
const Stamp: React.FC<P> = ({ l, f, dur }) => {
  const abs = useAbsFrame();
  const [no, rest] = l.text.split("　");
  const slam = interpolate(f, [0, 4], [3, 1], { ...clamp, easing: outExpo });
  // 後半句（真夏の本気／食らいついてこい）實際在下一個小節的強拍才唱，提早 1 格出現
  const restAt = B(Math.ceil((l.start - OFFSET) / BAR)) - Math.round(l.start * FPS) - 1;
  const rf = f - restAt;
  const rslam = interpolate(rf, [0, 4], [2.2, 1], { ...clamp, easing: outExpo });
  // 兩次落地各震一次
  const shake = Math.max(interpolate(f, [4, 14], [16, 0], clamp), interpolate(rf, [3, 12], [12, 0], clamp));
  const sx = (random(`st-${abs}`) - 0.5) * shake;
  const sy = (random(`sty-${abs}`) - 0.5) * shake * 0.5;
  // 後半句的字級：讓它的寬度和印章差不多（約 700px）
  const restSize = Math.min(132, 700 / Math.max(1, measure(rest)));
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", paddingBottom: 92, opacity: exitOpacity(f, dur, 5), translate: `${sx}px ${sy}px` }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 46 }}>
        <div
          style={{
            fontFamily: FONT_EN,
            fontSize: 168,
            color: "#FF2E5B",
            border: "12px solid #FF2E5B",
            outline: `6px solid ${INK}`,
            padding: "0 40px",
            rotate: "-7deg",
            scale: String(slam),
            lineHeight: 1.05,
            background: "rgba(18,8,24,0.8)",
            boxShadow: `12px 12px 0 ${INK}`,
            whiteSpace: "nowrap",
          }}
        >
          {no}
        </div>
        <div style={{ position: "relative", rotate: "-4deg", opacity: rf >= 0 ? 1 : 0, scale: String(rslam), padding: "14px 34px 18px" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#FF2E5B",
              transform: "skewX(-12deg)",
              border: `6px solid ${INK}`,
              boxShadow: `12px 12px 0 ${INK}`,
              scale: `${interpolate(rf, [0, 5], [0.2, 1], { ...clamp, easing: outExpo })} 1`,
              transformOrigin: "0% 50%",
            }}
          />
          <div style={{ position: "relative", fontFamily: FONT_DISPLAY, fontSize: restSize, lineHeight: 1.15, whiteSpace: "nowrap" }}>
            <Ink stroke={Math.round(restSize * 0.11)} shadow={INK} shadowOff={Math.round(restSize * 0.06)}>
              {rest}
            </Ink>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ─── Feed in：安靜、拉開字距 ─── */
const Whisper: React.FC<P> = ({ l, f, dur }) => {
  const [jp, en] = l.text.split(" Feed in");
  const chars = Array.from(jp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: exitOpacity(f, dur, 24), translate: `0px ${interpolate(f, [0, dur], [20, -20])}px` }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 76, letterSpacing: "0.3em" }}>
        {chars.map((c, i) => (
          <span key={i} style={{ display: "inline-block", opacity: interpolate(f, [i * 5, i * 5 + 14], [0, 1], clamp), translate: `0px ${interpolate(f, [i * 5, i * 5 + 14], [16, 0], clamp)}px` }}>
            <Ink stroke={11} shadow="#FF5A1F" shadowOff={7}>
              {c}
            </Ink>
          </span>
        ))}
      </div>
      <div style={{ marginTop: 18, opacity: interpolate(f, [chars.length * 5, chars.length * 5 + 12], [0, 1], clamp), scale: String(interpolate(f, [chars.length * 5, chars.length * 5 + 12], [1.3, 1], { ...clamp, easing: outExpo })) }}>
        <FireWord font={FONT_EN} size={170} shadow="#FF2E5B" style={{ letterSpacing: "0.22em" }}>
          {`FEED IN${en ?? ""}`}
        </FireWord>
      </div>
    </AbsoluteFill>
  );
};

/* ─── 洗脳Reflection：上下鏡像 ─── */
const Hypno: React.FC<P> = ({ l, f, dur }) => {
  const abs = useAbsFrame();
  const size = fit(l.text, 116, 1560);
  const wave = Math.sin(f / 6) * 3;
  const style: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontSize: size, whiteSpace: "nowrap" };
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: exitOpacity(f, dur, 8) * interpolate(f, [0, 6], [0, 1], clamp), scale: String(1 + beatPulse(abs, 6) * 0.04) }}>
      <div style={{ ...style, rotate: `${wave}deg`, filter: "drop-shadow(0 0 24px #FF2E88)" }}>
        <Ink stroke={13} shadow="#7B2EFF" shadowOff={9}>
          {l.text}
        </Ink>
      </div>
      <div style={{ ...style, color: CREAM, scale: "1 -1", opacity: 0.3, rotate: `${-wave}deg`, filter: "blur(2px)" }}>{l.text}</div>
    </AbsoluteFill>
  );
};

/* ─── 結尾：放在畫面下方，不擋五人的臉 ─── */
const Finale: React.FC<P> = ({ l, f, dur }) => {
  const [jp] = l.text.split(" Bonfire!");
  const bAt = 1.4 * FPS;
  const bo = interpolate(f, [bAt, bAt + 8], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 70, opacity: exitOpacity(f, dur, 20) }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 70, letterSpacing: "0.18em", opacity: interpolate(f, [0, 10], [0, 1], clamp) }}>
        <Ink stroke={11} shadow="#FF5A1F" shadowOff={7}>
          {jp}
        </Ink>
      </div>
      <div style={{ opacity: bo, scale: String(interpolate(bo, [0, 1], [1.6, 1])) }}>
        <FireWord font={FONT_EN} size={230} shadow="#FF2E5B">
          BONFIRE!
        </FireWord>
      </div>
    </AbsoluteFill>
  );
};

const STYLE_MAP: Record<string, React.FC<P>> = {
  shout: Shout,
  glitch: Glitch,
  verse: Verse,
  callout: Callout,
  callBig: CallBig,
  pre: (p) => <Pre {...p} />,
  preBig: (p) => <Pre {...p} big />,
  chorus: Chorus,
  stamp: Stamp,
  whisper: Whisper,
  hypno: Hypno,
  finale: Finale,
  hero: Hero,
};

const CUT_FRAMES = Array.from(new Set(TRANSITIONS.map((t) => t.at))).sort((x, y) => x - y);

/** 歌詞拖過剪接點時，提早一拍開始放大、模糊、燒白後消失，正好在剪接點那一格不見 */
const CutExit: React.FC<{ f: number; dur: number; children: React.ReactNode }> = ({ f, dur, children }) => {
  const w = Math.min(11, Math.max(4, Math.floor(dur / 4)));
  const p = interpolate(f, [dur - w, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  if (p <= 0) return <>{children}</>;
  return <AbsoluteFill style={{ scale: String(1 + p * 0.35), filter: `blur(${p * 10}px) brightness(${1 + p * 1.6})`, opacity: 1 - p }}>{children}</AbsoluteFill>;
};

/** 全片歌詞層：依絕對時間挑出當下的句子 */
export const LyricLayer: React.FC = () => {
  const abs = useAbsFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {LYRICS.map((l) => {
        const s = Math.round(l.start * FPS);
        const e0 = Math.round(l.end * FPS);
        // 句子開始 1 秒後才遇到的剪接點：句子在那裡結束
        // 開場 rap 的最後一個字（again!）是在小節線之後才唱，跟著聲音跨過剪接點，不提早消失
        const cut = l.style === "shout" ? undefined : CUT_FRAMES.find((c) => c >= s + FPS && c < e0);
        const e = cut ?? e0;
        if (abs < s || abs >= e || l.style === "none") return null;
        const C = STYLE_MAP[l.style];
        return cut ? (
          <CutExit key={l.start} f={abs - s} dur={e - s}>
            <C l={l} f={abs - s} dur={e - s} />
          </CutExit>
        ) : (
          <C key={l.start} l={l} f={abs - s} dur={e - s} />
        );
      })}
    </AbsoluteFill>
  );
};
