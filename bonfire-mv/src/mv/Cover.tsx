import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import "./fonts";
import { MemberId, MEMBERS, PALETTE } from "./assets";
import { FireWord } from "./components/FireText";
import { Beams, Embers, FilmOverlay } from "./components/fx";
import { GridFloor } from "./components/cyber";
import { MemberFigure } from "./components/MemberFigure";
import { FONT_EN, FONT_MONO } from "./fonts";

// 影片封面：同一份版面依寬高自動排版，註冊成 3:2 與 4:3 兩個 Still。
const LINEUP: { id: MemberId; x: number; w: number; h: number; z: number; tilt: number }[] = [
  { id: "lock", x: 11, w: 30, h: 54, z: 1, tilt: -3 },
  { id: "masking", x: 28, w: 30, h: 59, z: 2, tilt: -1.5 },
  { id: "layer", x: 50, w: 32, h: 64, z: 3, tilt: 0 },
  { id: "pareo", x: 72, w: 30, h: 59, z: 4, tilt: 1.5 },
  { id: "chu2", x: 89, w: 30, h: 54, z: 5, tilt: 3 },
];

const Corner: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div style={{ position: "absolute", width: 64, height: 64, borderColor: "#2EE6FF", borderStyle: "solid", borderWidth: 0, opacity: 0.9, ...style }} />
);

export const Cover: React.FC = () => {
  const { width, height } = useVideoConfig();
  const tall = height / width; // 3:2 → 0.667，4:3 → 0.75
  const unit = width / 100;
  const figScale = tall > 0.7 ? 1 : 0.93;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 85%, #6a1a10 0%, #2a0c2e 38%, ${PALETTE.night} 75%)`, overflow: "hidden" }}>
      {/* 背景：放射光、光束、網格地板 */}
      <AbsoluteFill style={{ background: "repeating-conic-gradient(from 0deg at 50% 92%, rgba(255,90,31,0.18) 0deg 6deg, transparent 6deg 14deg)" }} />
      <Beams count={8} intensity={0.7} />
      <GridFloor color="#FF2E88" opacity={0.55} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(255,140,40,0.55) 0%, rgba(255,60,20,0.2) 30%, transparent 55%)", mixBlendMode: "screen" }} />

      {/* 巨大團名浮水印 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: `${tall * 44}%`, textAlign: "center", fontFamily: FONT_EN, fontSize: unit * 20, lineHeight: 1, whiteSpace: "nowrap", color: "transparent", WebkitTextStroke: `${unit * 0.18}px rgba(255,46,136,0.45)` }}>
        RAISE A SUILEN
      </div>

      {/* 五人 */}
      {LINEUP.map((f) => (
        <div
          key={f.id}
          style={{
            position: "absolute",
            left: `${f.x - (f.w * figScale) / 2}%`,
            width: `${f.w * figScale}%`,
            bottom: 0,
            height: `${f.h * (tall > 0.7 ? 1.02 : 1)}%`,
            zIndex: f.z,
            rotate: `${f.tilt}deg`,
            transformOrigin: "50% 100%",
          }}
        >
          <MemberFigure member={f.id} center shadow={MEMBERS[f.id].color} lag={[f.x < 50 ? -18 : f.x > 50 ? 18 : 0, 0]} />
        </div>
      ))}

      <Embers count={60} seed="cover" speed={160} size={5} />

      {/* 標題 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: `${tall > 0.7 ? 5 : 3.5}%`, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10, rotate: "-4deg" }}>
        <FireWord font={"'Dela Gothic One', sans-serif"} size={unit * 10.5} fill="#FFF6E8" shadow="#FF5A1F" style={{ letterSpacing: "0.08em" }}>
          灼熱
        </FireWord>
        <FireWord font={FONT_EN} size={unit * 15} shadow="#FF2E5B" style={{ marginTop: -unit * 1.4, letterSpacing: "0.02em" }}>
          BONFIRE!
        </FireWord>
      </div>

      {/* 標籤 */}
      <div style={{ position: "absolute", left: unit * 3, top: unit * 2.6, zIndex: 11, fontFamily: FONT_MONO, color: "#2EE6FF", fontSize: unit * 1.35, letterSpacing: "0.2em", textShadow: "0 0 8px #2EE6FF" }}>
        RAISE A SUILEN <span style={{ color: "#FF2E88" }}>//</span> BONFIRE.EXE
        <div style={{ opacity: 0.8 }}>BPM 155 · 4K60</div>
      </div>
      <div style={{ position: "absolute", right: unit * 3, top: unit * 2.6, zIndex: 11, padding: `${unit * 0.4}px ${unit * 1.2}px`, background: "#FF2E5B", color: "#120818", fontFamily: FONT_EN, fontSize: unit * 2.2, letterSpacing: "0.08em", border: `${unit * 0.25}px solid #120818`, boxShadow: `${unit * 0.4}px ${unit * 0.4}px 0 #120818`, rotate: "4deg" }}>
        FAN MADE MV
      </div>

      <Corner style={{ left: 22, top: 22, borderLeftWidth: 4, borderTopWidth: 4 }} />
      <Corner style={{ right: 22, top: 22, borderRightWidth: 4, borderTopWidth: 4 }} />
      <Corner style={{ left: 22, bottom: 22, borderLeftWidth: 4, borderBottomWidth: 4 }} />
      <Corner style={{ right: 22, bottom: 22, borderRightWidth: 4, borderBottomWidth: 4 }} />
      <FilmOverlay vignette={0.55} />
    </AbsoluteFill>
  );
};
