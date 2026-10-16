import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, random } from "remotion";
import { useFrame } from "../context";
import { FPS } from "../timing";

const W = 1920;
const H = 1080;
const INK = "#120818"; // 漫畫墨線色

export type BurstKind = "peony" | "chrys" | "willow" | "ring" | "crossette" | "strobe";

export type Burst = {
  at: number; // 鏡頭內影格（爆開瞬間）
  x: number; // 0..1
  y: number; // 0..1
  color: string;
  color2?: string;
  size?: number; // 擴散半徑 px
  seed: string;
  rise?: boolean;
  kind?: BurstKind;
};

type Spec = { n: number; drag: number; grav: number; life: number; trail: number; dt: number; width: number };
const SPEC: Record<BurstKind, Spec> = {
  peony: { n: 36, drag: 2.0, grav: 110, life: 1.6, trail: 6, dt: 0.03, width: 9 },
  chrys: { n: 44, drag: 1.6, grav: 90, life: 2.0, trail: 12, dt: 0.035, width: 7 },
  willow: { n: 34, drag: 2.4, grav: 75, life: 3.0, trail: 18, dt: 0.05, width: 6 },
  ring: { n: 30, drag: 1.8, grav: 80, life: 1.7, trail: 6, dt: 0.03, width: 9 },
  crossette: { n: 10, drag: 1.4, grav: 90, life: 1.9, trail: 7, dt: 0.035, width: 8 },
  strobe: { n: 34, drag: 2.0, grav: 70, life: 2.4, trail: 4, dt: 0.03, width: 8 },
};

/** 有空氣阻力與重力的封閉解：任何影格都能直接算出位置 */
const pos = (ox: number, oy: number, vx: number, vy: number, k: number, g: number, t: number) => {
  const e = 1 - Math.exp(-k * t);
  return [ox + (vx / k) * e, oy + (vy / k) * e + (g / k) * t - (g / (k * k)) * e] as const;
};

type Stroke = { pts: (readonly [number, number])[]; color: string; width: number; alpha: number; star: boolean };

/** 四角星（漫畫閃光） */
const star4 = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.28;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
};

/** 爆炸星形（BAM 形狀） */
const burstStar = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, spikes: number, seed: string) => {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r * (0.85 + random(`${seed}-bs-${i}`) * 0.3) : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
};

const collect = (b: Burst, t: number): { strokes: Stroke[]; flash: number } => {
  const kind = b.kind ?? "peony";
  const sp = SPEC[kind];
  const ox = b.x * W;
  const oy = b.y * H;
  const size = b.size ?? 320;
  const strokes: Stroke[] = [];
  const fade = (tt: number) => Math.max(0, Math.min(1, 1.2 - tt / sp.life));
  const tilt = 0.55 + random(`${b.seed}-tilt`) * 0.45;
  for (let i = 0; i < sp.n; i++) {
    const ang = (i / sp.n) * Math.PI * 2 + random(`${b.seed}-a-${i}`) * (kind === "ring" ? 0.02 : 0.16);
    let spd = size * (kind === "ring" ? 1 : 0.7 + random(`${b.seed}-v-${i}`) * 0.45) * sp.drag;
    if (kind !== "ring") spd *= Math.sqrt(1 - random(`${b.seed}-z-${i}`) ** 2) * 0.3 + 0.7;
    const vx = Math.cos(ang) * spd;
    let vy = Math.sin(ang) * spd * (kind === "ring" ? tilt : 1);
    if (kind === "willow") vy -= 40;
    const color = kind === "willow" ? "#FFC93C" : i % 2 === 0 ? b.color : b.color2 ?? "#FFFFFF";
    const twinkle = kind === "strobe" && t > 0.5 ? random(`${b.seed}-tw-${i}-${Math.floor(t * 12)}`) > 0.4 : true;
    const alpha = fade(t);
    if (alpha <= 0.02 || !twinkle) continue;
    // 越到後面線越細（燒完的感覺）
    const width = sp.width * (0.45 + 0.55 * alpha);

    if (kind === "crossette" && t > 0.55) {
      const [px, py] = pos(ox, oy, vx, vy, sp.drag, sp.grav, 0.55);
      const e = Math.exp(-sp.drag * 0.55);
      const cvx = vx * e;
      const cvy = vy * e + (sp.grav / sp.drag) * (1 - e);
      for (let s = 0; s < 4; s++) {
        const a2 = ang + Math.PI / 4 + (s * Math.PI) / 2;
        const v2 = size * 0.45 * sp.drag;
        const pts: (readonly [number, number])[] = [];
        for (let j = 0; j < sp.trail; j++) {
          const tt = t - 0.55 - j * sp.dt;
          if (tt < 0) break;
          pts.push(pos(px, py, cvx * 0.4 + Math.cos(a2) * v2, cvy * 0.4 + Math.sin(a2) * v2, sp.drag, sp.grav, tt));
        }
        strokes.push({ pts, color: b.color2 ?? "#FFFFFF", width: width * 0.8, alpha, star: true });
      }
      continue;
    }
    const pts: (readonly [number, number])[] = [];
    for (let j = 0; j < sp.trail; j++) {
      const tt = t - j * sp.dt;
      if (tt < 0) break;
      pts.push(pos(ox, oy, vx, vy, sp.drag, sp.grav, tt));
    }
    strokes.push({ pts, color, width, alpha, star: kind === "strobe" || (kind === "peony" && i % 3 === 0) });
  }
  return { strokes, flash: Math.max(0, 1 - t * 4.5) };
};

/** 尾端尖、頭端粗的花瓣形線條 */
const petal = (ctx: CanvasRenderingContext2D, pts: (readonly [number, number])[], width: number) => {
  if (pts.length < 2) return;
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let j = 0; j < pts.length; j++) {
    const [x, y] = pts[j];
    const [nx, ny] = pts[Math.min(pts.length - 1, j + 1)];
    const [px, py] = pts[Math.max(0, j - 1)];
    let dx = nx - px;
    let dy = ny - py;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    const w = (width / 2) * (1 - j / (pts.length - 1)) ** 0.8;
    left.push([x - dy * w, y + dx * w]);
    right.push([x + dy * w, y - dx * w]);
  }
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (const p of left) ctx.lineTo(p[0], p[1]);
  for (let j = right.length - 1; j >= 0; j--) ctx.lineTo(right[j][0], right[j][1]);
  ctx.arc(pts[0][0], pts[0][1], width / 2, 0, Math.PI * 2);
  ctx.closePath();
};

const drawRise = (ctx: CanvasRenderingContext2D, b: Burst, local: number) => {
  const riseT = 0.55;
  if (!b.rise || local < -riseT) return;
  const ox = b.x * W;
  const oy = b.y * H;
  const p = 1 - -local / riseT;
  const ease = 1 - (1 - p) ** 2;
  const sy = H + 30 + (oy - H - 30) * ease;
  const tail = Math.min(220, (H - sy) * 0.6);
  ctx.lineCap = "round";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(ox, sy + tail);
  ctx.lineTo(ox, sy);
  ctx.stroke();
  ctx.strokeStyle = "#FFE7A0";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  star4(ctx, ox, sy, 16);
  ctx.fill();
  ctx.stroke();
};

/** 煙火（canvas，漫畫風）：粗墨線外框的花瓣、BAM 星形閃光、四角星閃爍 */
export const FireworksCanvas: React.FC<{ bursts: Burst[]; opacity?: number }> = ({ bursts, opacity = 1 }) => {
  const frame = useFrame();
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = "round";
    for (const b of bursts) {
      const local = (frame - b.at) / FPS;
      if (local < 0) {
        drawRise(ctx, b, local);
        continue;
      }
      const sp = SPEC[b.kind ?? "peony"];
      if (local > sp.life + 0.6) continue;
      const ox = b.x * W;
      const oy = b.y * H;
      const size = b.size ?? 320;
      const { strokes, flash } = collect(b, local);

      // 柔光底（讓夜空被染色）
      const glow = Math.max(0, 0.28 * (1 - local / sp.life));
      if (glow > 0) {
        const gr = ctx.createRadialGradient(ox, oy, 0, ox, oy, size * 1.5);
        gr.addColorStop(0, b.color);
        gr.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = glow;
        ctx.fillStyle = gr;
        ctx.fillRect(ox - size * 1.6, oy - size * 1.6, size * 3.2, size * 3.2);
        ctx.globalAlpha = 1;
      }

      // 第一層：墨線外框
      for (const s of strokes) {
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = INK;
        petal(ctx, s.pts, s.width + 7);
        ctx.fill();
      }
      // 第二層：平塗顏色
      for (const s of strokes) {
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        petal(ctx, s.pts, s.width);
        ctx.fill();
      }
      // 第三層：白色高光與閃星
      for (const s of strokes) {
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = "#FFFFFF";
        petal(ctx, s.pts.slice(0, Math.max(2, Math.ceil(s.pts.length / 2))), s.width * 0.35);
        ctx.fill();
        if (s.star && s.pts.length) {
          const [hx, hy] = s.pts[0];
          ctx.strokeStyle = INK;
          ctx.lineWidth = 3;
          star4(ctx, hx, hy, s.width * 1.6);
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // BAM 星形閃光
      if (flash > 0) {
        const r = size * (0.35 + (1 - flash) * 0.35);
        ctx.fillStyle = "#FFF6D0";
        ctx.strokeStyle = INK;
        ctx.lineWidth = 6;
        ctx.globalAlpha = Math.min(1, flash * 1.4);
        burstStar(ctx, ox, oy, r, 12, b.seed);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = b.color;
        burstStar(ctx, ox, oy, r * 0.55, 8, `${b.seed}-in`);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }, [frame, bursts]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};

/** 目前畫面被煙火照亮的程度 0..1（給背景調亮用） */
export const skyLight = (bursts: Burst[], frame: number) =>
  bursts.reduce((acc, b) => {
    const t = (frame - b.at) / FPS;
    return t >= 0 && t < 1.2 ? Math.max(acc, (1 - t / 1.2) ** 2) : acc;
  }, 0);
