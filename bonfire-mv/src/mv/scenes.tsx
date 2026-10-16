import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random } from "remotion";
import { getKick } from "./audio";
import { AssetId, MemberId, MEMBERS, PALETTE, resolveAsset } from "./assets";
import { AssetImage, Cam } from "./components/AssetImage";
import { BigSpectrum, BootText, CrowdForeground, CYBER, GlitchBurst, GridFloor, Reticle, useKickShake } from "./components/cyber";
import { Burst, FireworksCanvas, skyLight } from "./components/FireworksCanvas";
import { MemberFigure, snapLag } from "./components/MemberFigure";
import { FireWord } from "./components/FireText";
import { Beams, Bonfire, Embers, Flash, SpeedLines, Tint } from "./components/fx";
import { useAbsFrame, useFrame, useShot } from "./context";
import { FONT_DISPLAY, FONT_EN, FONT_JP, FONT_MONO } from "./fonts";
import { BAR, barPulse, beatPhase, beatPulse, FPS } from "./timing";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
const BARF = BAR * FPS; // 一小節的影格數（小數）

/** 跟大鼓輕微放大，讓整個畫面「呼吸」 */
export const Punch: React.FC<{ amount?: number; origin?: string; children: React.ReactNode }> = ({ amount = 0.04, origin, children }) => {
  const abs = useAbsFrame();
  const k = Math.max(getKick(abs), beatPulse(abs, 7) * 0.6);
  return <AbsoluteFill style={{ scale: String(1 + k * amount), transformOrigin: origin }}>{children}</AbsoluteFill>;
};

/* ═════════ 0. 開機 → 一粒火種（0 – 小節4） ═════════ */
export const IntroEmber: React.FC = () => {
  const { frame, dur } = useShot();
  const rise = interpolate(frame, [0, dur], [1080 * 0.85, 1080 * 0.45], { easing: Easing.bezier(0.4, 0, 0.2, 1) });
  const glow = interpolate(frame, [0, dur], [0.15, 0.9], clamp);
  const flick = 0.8 + 0.2 * Math.sin(frame * 0.9) * Math.sin(frame * 0.37);
  return (
    <AbsoluteFill style={{ background: PALETTE.night }}>
      <GridFloor opacity={interpolate(frame, [0, dur * 0.6, dur], [0, 0.35, 0.6])} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% ${(rise / 1080) * 100}%, rgba(255,110,40,${glow * 0.35}) 0%, transparent 35%)`,
        }}
      />
      <Embers count={14} seed="intro" speed={60} size={3} opacity={interpolate(frame, [0, dur], [0.2, 0.8])} />
      <div
        style={{
          position: "absolute",
          left: 960 - 9,
          top: rise - 9,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#FFE6A0",
          boxShadow: `0 0 ${30 * flick}px 10px #FF8A2A, 0 0 ${90 * flick}px 30px rgba(255,74,28,0.55)`,
        }}
      />
      <Reticle x={960} y={rise} size={120} color={CYBER.CYAN} at={Math.round(dur * 0.45)} />
      <BootText
        lines={[
          { at: 4, text: "> RAS_SYSTEM ONLINE" },
          { at: 30, text: "> LOADING BONFIRE.EXE ........ OK" },
          { at: 70, text: "> BPM 155 // SYNC OK" },
          { at: 110, text: "> MEMBERS: LAYER LOCK MASKING PAREO CHU²" },
          { at: 150, text: "> IGNITION" },
        ]}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
        <div
          style={{
            fontFamily: FONT_EN,
            fontSize: 40,
            letterSpacing: "0.8em",
            color: "#FFF6E8",
            opacity: interpolate(frame, [40, 70, dur - 20, dur], [0, 0.75, 0.75, 0], clamp),
          }}
        >
          RAISE A SUILEN
        </div>
      </AbsoluteFill>
      <GlitchBurst at={dur - 8} dur={8} />
    </AbsoluteFill>
  );
};

/* ═════════ 1. CHU² 開場 rap ═════════ */
export const RapIntro: React.FC = () => {
  const { frame } = useShot();
  const bar = Math.floor(frame / BARF);
  const colors = [PALETTE.neon, PALETTE.cyan, PALETTE.ember, PALETTE.flame];
  const local = frame - bar * BARF;
  const shake = useKickShake(16);
  return (
    <AbsoluteFill style={{ background: PALETTE.night, translate: shake }}>
      <AbsoluteFill style={{ scale: String(1.05 + bar * 0.06 + interpolate(local, [0, 6], [0.1, 0], clamp)), rotate: `${[0, -2, 2, -1][bar % 4]}deg` }}>
        <AssetImage id="chu2_rap" accent={MEMBERS.chu2.color} cam={{ zoom: [1, 1], x: [0, 0] }} />
      </AbsoluteFill>
      <Tint color={colors[bar % 4]} opacity={0.3} blend="color" />
      <BigSpectrum opacity={0.35} color={colors[(bar + 1) % 4]} />
      <SpeedLines opacity={0.2} seed="rap" />
      <GlitchBurst at={Math.round(bar * BARF)} dur={4} strength={0.7} />
    </AbsoluteFill>
  );
};

/* ═════════ 2. 五人閃現（快嘴段） ═════════ */
const ORDER: MemberId[] = ["chu2", "pareo", "masking", "lock", "layer"];
export const MemberStrobe: React.FC = () => {
  const { frame, dur } = useShot();
  const slot = dur / 7;
  const i = Math.min(6, Math.floor(frame / slot));
  const m = MEMBERS[ORDER[i % 5]];
  const abs = useAbsFrame();
  const jx = (random(`ms-${Math.floor(abs / 2)}`) - 0.5) * 30;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(120deg, ${PALETTE.night} 0%, ${m.color}66 100%)` }}>
      <GridFloor color={m.color} opacity={0.6} />
      <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 6px)` }} />
      <div style={{ position: "absolute", left: "22%", width: "56%", top: "6%", height: "94%", translate: `${jx}px 0px`, scale: String(interpolate(frame - i * slot, [0, slot], [1.12, 1.02])) }}>
        <MemberFigure member={ORDER[i % 5]} center lag={[snapLag(frame - i * slot, i % 2 ? 240 : -240) + jx, 0]} />
      </div>
      <div style={{ position: "absolute", left: 60, top: 110, fontFamily: FONT_EN, fontSize: 120, color: "transparent", WebkitTextStroke: `3px ${m.color}`, opacity: 0.8 }}>
        {m.name}
      </div>
      <GlitchBurst key={i} at={Math.round(i * slot)} dur={4} />
    </AbsoluteFill>
  );
};

/* ═════════ 3. 標題點火：灼熱 Bonfire! ═════════ */
export const TitleIgnite: React.FC = () => {
  const { frame, dur } = useShot();
  const ignite = interpolate(frame, [0, 20], [0, 1.25], { ...clamp, easing: outExpo });
  const titleIn = interpolate(frame, [4, 14], [0, 1], clamp);
  const abs = useAbsFrame();
  const shake = useKickShake(14);
  return (
    <AbsoluteFill style={{ background: "#07040c", translate: shake }}>
      <AssetImage id="bg_beach_bonfire" accent={PALETTE.ember} cam={{ zoom: [1.25, 1.1] }} filter="brightness(0.55)" />
      <Bonfire intensity={ignite} scale={1.25} seed="title" />
      <Embers count={70} seed="title-e" speed={260} size={5} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: titleIn * interpolate(frame, [dur - 10, dur], [1, 0], clamp),
          scale: String(interpolate(frame, [4, 14, dur], [1.5, 1, 1.06], { ...clamp, easing: outExpo }) + barPulse(abs, 6) * 0.02),
        }}
      >
        <FireWord font={FONT_DISPLAY} size={280} fill="#FFF6E8" shadow="#FF5A1F" style={{ letterSpacing: "0.08em" }}>
          灼熱
        </FireWord>
        <FireWord font={FONT_EN} size={230} shadow="#FF2E5B" style={{ marginTop: -10, letterSpacing: "0.03em" }}>
          BONFIRE!
        </FireWord>
      </AbsoluteFill>
      <Flash at={0} dur={12} color="#FFE6A0" />
    </AbsoluteFill>
  );
};

/* ═════════ 4. 樂團 logo 閃字 ═════════ */
export const BandSlash: React.FC = () => {
  const { frame, dur } = useShot();
  const logo = resolveAsset("ras_logo");
  return (
    <AbsoluteFill style={{ background: PALETTE.ember, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: PALETTE.night, clipPath: `polygon(0 ${interpolate(frame, [0, dur], [100, 0])}%, 100% 0, 100% 100%, 0 100%)` }} />
      <GridFloor opacity={0.5} />
      {logo ? (
        <Img src={logo} style={{ width: 900, scale: String(interpolate(frame, [0, dur], [1.2, 1])) }} />
      ) : (
        <div style={{ fontFamily: FONT_EN, fontSize: 200, color: "#FFF6E8", letterSpacing: "0.1em", scale: String(interpolate(frame, [0, dur], [1.2, 1])), textShadow: `6px 0 0 ${CYBER.PINK}, -6px 0 0 ${CYBER.CYAN}` }}>
          RAISE A SUILEN
        </div>
      )}
      <GlitchBurst at={0} dur={5} />
    </AbsoluteFill>
  );
};

/* ═════════ 5. 成員介紹卡（cyber ID） ═════════ */
export const MemberCard: React.FC<{ member: MemberId; side: "left" | "right" }> = ({ member, side }) => {
  const { frame, dur } = useShot();
  const m = MEMBERS[member];
  const enter = interpolate(frame, [0, 10], [0, 1], { ...clamp, easing: outExpo });
  const exit = interpolate(frame, [dur - 5, dur], [0, 1], clamp);
  const dir = side === "left" ? -1 : 1;
  const scanY = interpolate(frame, [0, dur], [-10, 110]);
  const stats = [
    ["POWER", 0.7 + random(`${member}-p`) * 0.3],
    ["HEAT", 0.75 + random(`${member}-h`) * 0.25],
    ["SYNC", 0.85 + random(`${member}-s`) * 0.15],
  ] as const;
  return (
    <AbsoluteFill style={{ background: PALETTE.night, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `repeating-linear-gradient(${side === "left" ? 115 : 65}deg, ${m.color}22 0 40px, transparent 40px 80px)`, translate: `${frame * 3 * dir}px 0px`, scale: "1.3" }} />
      <GridFloor color={m.color} opacity={0.55} />
      <div style={{ position: "absolute", top: "8%", left: 0, right: 0, fontFamily: FONT_EN, fontSize: 420, lineHeight: 1, color: "transparent", WebkitTextStroke: `4px ${m.color}`, opacity: 0.45, whiteSpace: "nowrap", translate: `${-dir * 200 + frame * 4 * dir}px 0px` }}>
        {m.name} {m.name}
      </div>
      <div
        style={{
          position: "absolute",
          [side === "left" ? "left" : "right"]: "6%",
          bottom: 0,
          width: "46%",
          height: "100%",
          translate: `${(1 - enter) * 400 * dir + exit * 200 * -dir}px 0px`,
          opacity: 1 - exit,
        }}
      >
        <MemberFigure member={member} aim={{ at: 6, size: 210 }} lag={[snapLag(frame, 280 * -dir), snapLag(frame, -60)]} style={{ scale: String(interpolate(frame, [0, dur], [1, 1.05])) }} />
      </div>
      {/* 掃描線 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: `${scanY}%`, height: 4, background: m.color, boxShadow: `0 0 30px 8px ${m.color}`, opacity: 0.7 }} />
      <div style={{ position: "absolute", [side === "left" ? "right" : "left"]: 120, bottom: 150, textAlign: side === "left" ? "right" : "left", translate: `${(1 - enter) * -300 * dir}px 0px`, opacity: enter * (1 - exit) }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 26, color: CYBER.CYAN, letterSpacing: "0.2em" }}>MEMBER_ID://{m.name.replace("²", "2")}</div>
        <div style={{ fontFamily: FONT_EN, fontSize: 44, letterSpacing: "0.3em", color: m.color }}>{m.role}</div>
        <div style={{ fontFamily: FONT_EN, fontSize: 210, lineHeight: 0.95, color: "#FFF6E8", textShadow: `8px 8px 0 ${m.color}` }}>{m.name}</div>
        <div style={{ fontFamily: FONT_JP, fontWeight: 900, fontSize: 52, color: "#FFF6E8", opacity: 0.85 }}>{m.kana}</div>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8, alignItems: side === "left" ? "flex-end" : "flex-start" }}>
          {stats.map(([k, v], i) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: FONT_MONO, fontSize: 20, color: CYBER.CYAN }}>
              <span style={{ width: 70 }}>{k}</span>
              <div style={{ width: 300, height: 12, border: `1px solid ${CYBER.CYAN}` }}>
                <div style={{ width: `${interpolate(frame, [8 + i * 4, 22 + i * 4], [0, v * 100], { ...clamp, easing: outExpo })}%`, height: "100%", background: m.color, boxShadow: `0 0 10px ${m.color}` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <GlitchBurst at={0} dur={5} />
    </AbsoluteFill>
  );
};

/* ═════════ 通用：單張圖 + 運鏡 + 疊效果 ═════════ */
export const ImageShot: React.FC<{
  id: AssetId;
  cam?: Cam;
  accent?: string;
  filter?: string;
  objectPosition?: string;
  children?: React.ReactNode;
  flashColor?: string;
  shake?: number;
}> = ({ id, cam, accent, filter, objectPosition, children, flashColor, shake = 0 }) => {
  const sh = useKickShake(shake);
  return (
    <AbsoluteFill style={{ background: PALETTE.night, translate: shake ? sh : undefined }}>
      <AssetImage id={id} cam={cam} accent={accent} filter={filter} objectPosition={objectPosition} />
      {children}
      {flashColor ? <Flash at={0} dur={6} color={flashColor} peak={0.7} /> : null}
    </AbsoluteFill>
  );
};

/* ═════════ 煙火夜空 ═════════ */
export const FireworkSky: React.FC<{ bursts: Burst[]; cam?: Cam; crowd?: boolean }> = ({ bursts, cam, crowd = true }) => {
  const frame = useFrame();
  const lit = skyLight(bursts, frame);
  return (
    <AbsoluteFill style={{ background: PALETTE.night }}>
      <AssetImage id="bg_night_sky" accent={PALETTE.cyan} cam={cam ?? { zoom: [1.05, 1.12], y: [20, -20] }} filter={`brightness(${0.7 + lit * 0.7})`} />
      <FireworksCanvas bursts={bursts} />
      <Embers count={20} seed="sky" speed={50} size={2} opacity={0.6} />
      {crowd ? <CrowdForeground rim="#FFC93C" height={0.2} seed="sky-crowd" /> : null}
    </AbsoluteFill>
  );
};

/* ═════════ 海邊營火 ═════════ */
export const BeachBonfire: React.FC<{ intensity?: [number, number]; cam?: Cam; shake?: boolean }> = ({ intensity = [0.8, 1.3], cam, shake }) => {
  const { progress } = useShot();
  const abs = useAbsFrame();
  const k = interpolate(progress, [0, 1], intensity);
  const s = shake ? progress * 10 : 0;
  return (
    <AbsoluteFill style={{ background: PALETTE.night, translate: `${(random(`bb-${abs}`) - 0.5) * s}px ${(random(`bby-${abs}`) - 0.5) * s}px` }}>
      <AssetImage id="bg_beach_bonfire" accent={PALETTE.ember} cam={cam ?? { zoom: [1.05, 1.25] }} filter={`brightness(${0.7 + k * 0.2})`} />
      <Bonfire intensity={k} scale={0.9 + k * 0.25} seed="beach" />
      <Embers count={80} seed="beach" speed={200 + k * 120} size={5} fromBottom />
    </AbsoluteFill>
  );
};

/* ═════════ 副歌舞台 ═════════ */
export const ChorusStage: React.FC<{ id?: AssetId; cam?: Cam; hue?: string; fireworks?: Burst[]; crowd?: boolean; origin?: string; children?: React.ReactNode }> = ({
  id = "group_stage",
  cam,
  hue,
  fireworks,
  crowd = true,
  origin = "50% 0%",
  children,
}) => {
  const abs = useAbsFrame();
  const shake = useKickShake(12);
  return (
    <AbsoluteFill style={{ background: PALETTE.night, translate: shake }}>
      <Punch origin={origin}>
        <AssetImage id={id} accent={PALETTE.ember} cam={{ zoom: [1.02, 1.08], ...cam, origin }} />
      </Punch>
      {hue ? <Tint color={hue} opacity={0.28} blend="color" /> : null}
      {fireworks ? <FireworksCanvas bursts={fireworks} /> : null}
      <Beams />
      <Embers count={50} seed="stage-e" speed={220} size={4} />
      {crowd ? <CrowdForeground rim={hue ?? "#FF5A1F"} /> : null}
      {children}
      <AbsoluteFill style={{ background: "#fff", opacity: barPulse(abs, 9) * 0.12, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};


/* ═════════ 終副歌：乾淨的程式舞台，五人半身並排 ═════════ */
// x 是人像中心（畫面寬 %）。數值是量每張立繪頭部到肩膀的實際輪廓寬度後算出來的：
// 讓相鄰兩人輪廓之間的空隙一樣大（LAYER 的頭髮往左飄、PAREO 的雙馬尾很寬，所以中心不是等距）。
const FIVE: { id: MemberId; x: number; w: number; h: number; z: number }[] = [
  { id: "lock", x: 10.9, w: 30, h: 68, z: 1 },
  { id: "masking", x: 27.1, w: 30, h: 75, z: 2 },
  { id: "layer", x: 51.2, w: 30, h: 84, z: 3 },
  { id: "pareo", x: 75.9, w: 30, h: 75, z: 4 },
  { id: "chu2", x: 91.1, w: 30, h: 68, z: 5 },
];
export const FiveStage: React.FC<{ fireworks?: Burst[]; hue?: string }> = ({ fireworks, hue = "#FF2E88" }) => {
  const { frame, dur } = useShot();
  const abs = useAbsFrame();
  const shake = useKickShake(10);
  const kick = getKick(abs);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, ${hue}55 0%, #1a0b33 45%, #07040c 85%)`, translate: shake, overflow: "hidden" }}>
      <BigSpectrum opacity={0.3} />
      <div style={{ position: "absolute", top: "10%", left: 0, right: 0, fontFamily: FONT_EN, fontSize: 300, lineHeight: 1, whiteSpace: "nowrap", color: "transparent", WebkitTextStroke: `3px ${hue}`, opacity: 0.35, translate: `${-frame * 5}px 0px` }}>
        RAISE A SUILEN RAISE A SUILEN RAISE A SUILEN
      </div>
      {fireworks ? <FireworksCanvas bursts={fireworks} /> : null}
      <Beams count={8} intensity={0.8} />
      <GridFloor color={hue} opacity={0.55} />
      {/* 每人一道代表色聚光燈 */}
      {FIVE.map((f, i) => (
        <div
          key={`spot-${f.id}`}
          style={{
            position: "absolute",
            left: `${f.x - 11}%`,
            width: "22%",
            top: 0,
            bottom: 0,
            background: `linear-gradient(180deg, ${MEMBERS[f.id].color}aa 0%, ${MEMBERS[f.id].color}22 70%, transparent 100%)`,
            clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)",
            opacity: 0.35 + beatPulse(abs, 6) * 0.25 * (i % 2 ? 1 : 0.6),
            mixBlendMode: "screen",
          }}
        />
      ))}
      {FIVE.map((f, i) => {
        const enter = interpolate(frame, [i * 3, i * 3 + 12], [0, 1], { ...clamp, easing: outExpo });
        const bob = Math.sin(abs * 0.32 + i * 1.3) * 6 - kick * 14 * (i === 2 ? 1.4 : 1);
        return (
          <div
            key={f.id}
            style={{
              position: "absolute",
              left: `${f.x - f.w / 2}%`,
              width: `${f.w}%`,
              bottom: 0,
              height: `${f.h}%`,
              translate: `0px ${(1 - enter) * 500 + bob}px`,
              zIndex: f.z,
            }}
          >
            <MemberFigure member={f.id} lag={[snapLag(frame - i * 3, 200 * (i < 2 ? -1 : 1)), snapLag(frame - i * 3, -50)]} />
          </div>
        );
      })}
      <CrowdForeground rim={hue} height={0.22} seed="five" />
      <AbsoluteFill style={{ background: "#fff", opacity: barPulse(abs, 9) * 0.1 + interpolate(frame, [0, 6, dur], [0.6, 0, 0], clamp), mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

/* ═════════ 成員快切（每段一人，掃描鎖定） ═════════ */
export const MemberCuts: React.FC<{ members: MemberId[]; beatsEach?: number }> = ({ members, beatsEach = 4 }) => {
  const { frame } = useShot();
  const slot = (beatsEach / 4) * BARF;
  const i = Math.min(members.length - 1, Math.floor(frame / slot));
  const m = MEMBERS[members[i]];
  const local = frame - i * slot;
  const dir = i % 2 ? 1 : -1;
  const shake = useKickShake(14);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 60%, ${m.color} 0%, ${PALETTE.night} 75%)`, translate: shake }}>
      <BigSpectrum color={m.color} opacity={0.45} />
      <GridFloor color="#FFF6E8" opacity={0.25} />
      <SpeedLines color="#FFF6E8" opacity={0.3} seed={`mc-${i}`} />
      <div
        style={{
          position: "absolute",
          left: "22%",
          width: "56%",
          top: "3%",
          height: "97%",
          scale: String(interpolate(local, [0, slot], [1.12, 1.0])),
          translate: `${interpolate(local, [0, 8], [160 * dir, 0], { ...clamp, easing: outExpo })}px 0px`,
          rotate: `${interpolate(local, [0, 8], [6 * dir, 0], { ...clamp, easing: outExpo })}deg`,
        }}
      >
        <MemberFigure member={members[i]} center aim={{ at: Math.round(i * slot) + 2, size: 210 }} lag={[snapLag(local, -300 * dir), snapLag(local, -40)]} />
      </div>
      <div style={{ position: "absolute", left: 90, top: 120, fontFamily: FONT_EN, fontSize: 90, color: "#FFF6E8", letterSpacing: "0.12em", textShadow: `6px 6px 0 ${m.color}` }}>
        {m.name}
        <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: CYBER.CYAN, letterSpacing: "0.2em" }}>LOCK-ON // {m.role}</div>
      </div>
      <GlitchBurst key={`g${i}`} at={Math.round(i * slot)} dur={4} strength={0.8} />
    </AbsoluteFill>
  );
};

/* ═════════ 分割畫面 ═════════ */
export const Split: React.FC<{ members: MemberId[] }> = ({ members }) => {
  const { frame } = useShot();
  const n = members.length;
  const shake = useKickShake(10);
  return (
    <AbsoluteFill style={{ background: PALETTE.night, translate: shake }}>
      <BigSpectrum opacity={0.35} />
      {members.map((id, i) => {
        const m = MEMBERS[id];
        const enter = interpolate(frame, [i * 3, i * 3 + 10], [0, 1], { ...clamp, easing: outExpo });
        const w = 100 / n;
        const skew = 6;
        return (
          <div
            key={id}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${i * w - 3}%`,
              width: `${w + 6}%`,
              clipPath: `polygon(${skew}% 0, 100% 0, ${100 - skew}% 100%, 0 100%)`,
              background: `linear-gradient(180deg, ${m.color}aa 0%, ${PALETTE.night}dd 90%)`,
              translate: `0px ${(1 - enter) * (i % 2 ? 1 : -1) * 1080}px`,
              overflow: "hidden",
            }}
          >
            <GridFloor color={m.color} opacity={0.5} />
            <div style={{ position: "absolute", inset: n > 2 ? "8% -25% 0 -25%" : "6% 0 0 0" }}>
              <MemberFigure member={id} lag={[snapLag(frame - i * 3, 220), 0]} />
            </div>
            <div
              style={{
                position: "absolute",
                left: `${skew + 4}%`,
                bottom: n > 2 ? 330 : 300,
                writingMode: "vertical-rl",
                rotate: "180deg",
                fontFamily: FONT_EN,
                fontSize: n > 2 ? 54 : 84,
                color: "#FFF6E8",
                letterSpacing: "0.1em",
                textShadow: `5px 5px 0 ${m.color}, -2px -2px 0 #120818, 2px 2px 0 #120818`,
              }}
            >
              {m.name}
              <span style={{ fontFamily: FONT_MONO, fontSize: n > 2 ? 22 : 30, color: CYBER.CYAN, marginTop: 10 }}>{m.role}</span>
            </div>
          </div>
        );
      })}
      <Beams intensity={0.6} />
    </AbsoluteFill>
  );
};

/* ═════════ 洗脳Reflection：萬花筒 ═════════ */
export const Kaleido: React.FC = () => {
  const { frame } = useShot();
  const abs = useAbsFrame();
  const rot = frame * 0.6;
  const quads: { s: string }[] = [{ s: "1 1" }, { s: "-1 1" }, { s: "1 -1" }, { s: "-1 -1" }];
  return (
    <AbsoluteFill style={{ background: "#12062a", overflow: "hidden" }}>
      <AbsoluteFill style={{ rotate: `${rot}deg`, scale: String(1.6 + beatPulse(abs, 6) * 0.08) }}>
        {quads.map((q, i) => (
          <div key={i} style={{ position: "absolute", width: "50%", height: "50%", left: i % 2 ? "50%" : 0, top: i > 1 ? "50%" : 0, overflow: "hidden" }}>
            <div style={{ position: "absolute", width: "200%", height: "200%", left: i % 2 ? "-100%" : 0, top: i > 1 ? "-100%" : 0, scale: q.s }}>
              <AssetImage id="group_stage" accent="#B44CFF" cam={{ zoom: [1.1, 1.3] }} />
            </div>
          </div>
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `repeating-radial-gradient(circle at 50% 50%, transparent 0 ${40 + (frame % 30)}px, rgba(255,46,136,0.25) ${44 + (frame % 30)}px ${60 + (frame % 30)}px)`, mixBlendMode: "screen" }} />
      <Tint color="#7B2EFF" opacity={0.3} blend="color" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((b) => (
        <GlitchBurst key={b} at={Math.round(b * BARF * 0.5)} dur={3} strength={0.6} />
      ))}
    </AbsoluteFill>
  );
};

/* ═════════ 主歌 2：負面泡泡（もしも／それじゃ／どうしよう）→ 漫畫異形對話框 ═════════ */
type BalloonKind = "cloud" | "spiky" | "wobble";
const balloonPath = (kind: BalloonKind, w: number, h: number, seed: string) => {
  const cx = w / 2;
  const cy = h / 2;
  const n = kind === "spiky" ? 36 : 64;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let r = 1;
    if (kind === "cloud") r = 1 + 0.13 * Math.abs(Math.sin(a * 5));
    if (kind === "spiky") r = i % 2 === 0 ? 1.12 + random(`${seed}-${i}`) * 0.12 : 0.86;
    if (kind === "wobble") r = 1 + 0.07 * Math.sin(a * 4 + 1.3) + 0.04 * Math.sin(a * 9);
    pts.push(`${cx + Math.cos(a) * (w / 2) * 0.86 * r},${cy + Math.sin(a) * (h / 2) * 0.8 * r}`);
  }
  return pts.join(" ");
};

const Balloon: React.FC<{ kind: BalloonKind; text: string; w: number; h: number; tailX: number; seed: string; accent: string }> = ({ kind, text, w, h, tailX, seed, accent }) => (
  <div style={{ position: "relative", width: w, height: h + 60 }}>
    <svg width={w} height={h + 60} viewBox={`0 0 ${w} ${h + 60}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* 尾巴：雲朵型用小圓點（心裡話），其他用尖角 */}
      {kind === "cloud" ? (
        <g fill="#F4F0FA" stroke="#120818" strokeWidth={5}>
          <circle cx={w * tailX} cy={h + 14} r={14} />
          <circle cx={w * tailX + 18} cy={h + 44} r={8} />
        </g>
      ) : (
        <polygon points={`${w * tailX - 26},${h * 0.8} ${w * tailX + 22},${h * 0.82} ${w * tailX + 34},${h + 52}`} fill="#F4F0FA" stroke="#120818" strokeWidth={6} strokeLinejoin="round" />
      )}
      <polygon points={balloonPath(kind, w, h, seed)} fill={accent} transform="translate(10 10)" stroke="#120818" strokeWidth={5} strokeLinejoin="round" />
      <polygon points={balloonPath(kind, w, h, seed)} fill="#F4F0FA" stroke="#120818" strokeWidth={7} strokeLinejoin="round" />
    </svg>
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, fontSize: kind === "spiky" ? 70 : 62, color: "#120818", letterSpacing: kind === "wobble" ? "0.1em" : 0 }}>
      {text}
    </div>
  </div>
);

export const NegativeBubbles: React.FC<{ words: { text: string; at: number; x: number; y: number }[]; popAt: number; blowAt: number }> = ({ words, popAt, blowAt }) => {
  const frame = useFrame();
  const blow = interpolate(frame, [blowAt, blowAt + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  // 下一句開始時泡泡破掉化成霧，畫面上不留上一句的字
  const pop = interpolate(frame, [popAt, popAt + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const fogIn = interpolate(frame, [words[0].at, words[0].at + 20, popAt, popAt + 10], [0, 0.7, 0.7, 1], clamp);
  const kinds: BalloonKind[] = ["cloud", "spiky", "wobble"];
  const accents = ["#B44CFF", "#FF2E88", "#2EE6FF"];
  const sizes = [
    [380, 200],
    [440, 230],
    [500, 210],
  ];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(60,50,80,0.8) 0%, rgba(20,15,30,0.6) 60%, transparent 100%)", opacity: fogIn * (1 - blow), scale: String(1 + blow * 0.6) }} />
      {words.map((w, i) => {
        const lf = frame - w.at;
        if (lf < 0 || pop >= 1) return null;
        const inS = interpolate(lf, [0, 6], [0, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
        const bob = Math.sin((frame + i * 20) / 10) * 8;
        const [bw, bh] = sizes[i % 3];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${w.x}%`,
              top: `${w.y}%`,
              scale: String(inS * (1 + pop * 0.6)),
              opacity: 1 - pop,
              filter: pop > 0 ? `blur(${pop * 16}px)` : undefined,
              translate: `0px ${bob}px`,
              rotate: `${(i - 1) * 7}deg`,
            }}
          >
            <Balloon kind={kinds[i % 3]} text={w.text} w={bw} h={bh} tailX={i % 2 ? 0.3 : 0.65} seed={`bal-${i}`} accent={accents[i % 3]} />
          </div>
        );
      })}
      <Flash at={blowAt} dur={8} color="#FFC93C" peak={0.6} />
    </AbsoluteFill>
  );
};

/* ═════════ 1:39 重型段（甩頭）：重擊硬切成員、整個畫面跟著點頭 ═════════ */
const BANG_WORDS = ["HEAD", "BANG", "HEAD", "BANG", "RAS!!"];
const BANG_MEMBERS: MemberId[] = ["masking", "layer", "lock", "chu2", "pareo"];
export const HeadbangBreak: React.FC<{ hits: number[] }> = ({ hits }) => {
  const { frame } = useShot();
  const abs = useAbsFrame();
  let idx = 0;
  for (let i = 0; i < hits.length; i++) if (frame >= hits[i]) idx = i;
  const lf = frame - hits[idx];
  const id = BANG_MEMBERS[idx % BANG_MEMBERS.length];
  const m = MEMBERS[id];
  const dir = idx % 2 ? 1 : -1;
  // 點頭與震動都跟著重擊走（這段的重擊是切分音，不在拍點上），拍點只留輕微的點頭
  const phase = beatPhase(abs);
  const nod = Math.exp(-lf * 0.32) * 54 + Math.exp(-phase * 6) * 12;
  const hitShake = Math.exp(-lf * 0.45) * 34;
  const sx = (random(`hbx-${abs}`) - 0.5) * hitShake;
  const sy = (random(`hby-${abs}`) - 0.5) * hitShake * 0.6;
  const slam = interpolate(lf, [0, 3], [1.7, 1], { ...clamp, easing: outExpo });
  const strobe = lf < 2 ? "#FFF6E8" : Math.floor(abs / 2) % 2 === 0 ? "#2a0006" : "#07040c";
  return (
    <AbsoluteFill style={{ background: strobe, overflow: "hidden" }}>
      <AbsoluteFill style={{ translate: `${sx}px ${nod + sy}px`, scale: String(1 + nod / 900) }}>
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 70%, ${m.color}88 0%, transparent 60%)` }} />
        <GridFloor color="#FF2E5B" opacity={0.7} />
        <BigSpectrum color="#FF2E5B" opacity={0.55} />
        <SpeedLines color="#FFF6E8" opacity={0.4} seed={`hb-${idx}`} />
        {/* 巨大字 */}
        <div style={{ position: "absolute", left: 0, right: 0, top: "8%", textAlign: "center", fontFamily: FONT_EN, fontSize: 470, lineHeight: 1, color: "transparent", WebkitTextStroke: `6px #FF2E5B`, scale: String(slam), rotate: `${dir * 4}deg`, opacity: 0.9 }}>
          {BANG_WORDS[idx % BANG_WORDS.length]}
        </div>
        <div style={{ position: "absolute", left: dir < 0 ? "6%" : "44%", width: "50%", top: "2%", height: "98%", translate: `${interpolate(lf, [0, 3], [dir * -200, 0], { ...clamp, easing: outExpo })}px 0px`, rotate: `${interpolate(lf, [0, 3], [dir * 8, 0], { ...clamp, easing: outExpo })}deg` }}>
          <MemberFigure member={id} center shadow="#FF2E5B" lag={[snapLag(lf, dir * -320), snapLag(lf, -80)]} />
        </div>
        <div style={{ position: "absolute", [dir < 0 ? "right" : "left"]: 90, bottom: 170, textAlign: dir < 0 ? "right" : "left" }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: CYBER.CYAN, letterSpacing: "0.3em" }}>HEADBANG // {m.role}</div>
          <div style={{ position: "relative", fontFamily: FONT_EN, fontSize: 150, lineHeight: 1 }}>
            <span style={{ position: "absolute", left: 0, top: 0, color: "#120818", WebkitTextStroke: "16px #120818", filter: `drop-shadow(10px 10px 0 ${m.color})` }}>{m.name}</span>
            <span style={{ position: "relative", color: "#FFF6E8" }}>{m.name}</span>
          </div>
        </div>
      </AbsoluteFill>
      <CrowdForeground wild height={0.24} seed="headbang" />
      {hits.map((h) => (
        <GlitchBurst key={h} at={h} dur={5} strength={1} />
      ))}
    </AbsoluteFill>
  );
};

/* ═════════ 樂器特寫（間奏） ═════════ */
export const InstrumentCut: React.FC<{ id: AssetId; color: string; label: string; cam?: Cam }> = ({ id, color, label, cam }) => {
  const { frame } = useShot();
  const abs = useAbsFrame();
  const shake = useKickShake(16);
  return (
    <AbsoluteFill style={{ background: PALETTE.night, translate: shake }}>
      <Punch amount={0.06}>
        <AssetImage id={id} accent={color} cam={cam ?? { zoom: [1.15, 1.3], rot: [-2, 2] }} />
      </Punch>
      <Tint color={color} opacity={0.22} blend="color" />
      <BigSpectrum color={color} opacity={0.4} />
      <AbsoluteFill style={{ boxShadow: `inset 0 0 ${120 + beatPulse(abs, 6) * 80}px ${color}` }} />
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 110,
          fontFamily: FONT_EN,
          fontSize: 150,
          lineHeight: 1,
          color: "#FFF6E8",
          textShadow: `6px 6px 0 ${color}`,
          opacity: interpolate(frame, [0, 6], [0, 1], clamp),
          translate: `${interpolate(frame, [0, 12], [-120, 0], { ...clamp, easing: outExpo })}px 0px`,
          letterSpacing: "0.06em",
        }}
      >
        {label}
        <div style={{ fontFamily: FONT_MONO, fontSize: 26, color: CYBER.CYAN, letterSpacing: "0.3em" }}>SOLO // LIVE INPUT</div>
      </div>
      <GlitchBurst at={0} dur={4} />
      <Embers count={30} seed={`inst-${id}`} speed={300} size={4} opacity={interpolate(frame, [0, 10], [0, 1], clamp)} />
    </AbsoluteFill>
  );
};

/* ═════════ 白光爆發轉場（間奏收尾） ═════════ */
export const WhiteOut: React.FC = () => {
  const { frame, dur } = useShot();
  const abs = useAbsFrame();
  const k = interpolate(frame, [0, dur], [0, 1]);
  const strobe = Math.floor(abs / 3) % 2;
  const ids: AssetId[] = ["hands_guitar", "hands_drums", "hands_keys", "hands_dj"];
  const id = ids[Math.floor(frame / 3) % 4];
  return (
    <AbsoluteFill style={{ background: PALETTE.night }}>
      <AssetImage id={id} accent={PALETTE.flame} cam={{ zoom: [1.3, 1.6] }} />
      <BigSpectrum opacity={0.6} />
      <AbsoluteFill style={{ background: "#FFF6E8", opacity: k * k * 0.9 + strobe * 0.15 * k }} />
    </AbsoluteFill>
  );
};

/* ═════════ 結尾 ═════════ */
export const Outro: React.FC = () => {
  const { frame, dur } = useShot();
  const fade = interpolate(frame, [dur - 2.5 * FPS, dur], [1, 0], clamp);
  const credit = interpolate(frame, [6.2 * FPS, 7 * FPS], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: fade }}>
        <AssetImage id="group_relax" accent={PALETTE.ember} cam={{ zoom: [1.12, 1.0], y: [-20, 10] }} />
        <Embers count={50} seed="outro-e" speed={120} size={4} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 55%, rgba(5,3,14,0.55) 100%)" }} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 90, opacity: credit }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 64, color: "#FFF6E8", letterSpacing: "0.15em", textShadow: "0 0 20px rgba(255,120,30,0.8)" }}>灼熱 Bonfire!</div>
          <div style={{ fontFamily: FONT_EN, fontSize: 34, color: "#FFC93C", letterSpacing: "0.6em", marginTop: 10 }}>RAISE A SUILEN</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: CYBER.CYAN, letterSpacing: "0.3em", marginTop: 14, opacity: 0.8 }}>{"> SYSTEM // SHUTDOWN"}</div>
        </AbsoluteFill>
      </AbsoluteFill>
      <GlitchBurst at={Math.round(dur - 2.5 * FPS)} dur={6} strength={0.6} />
    </AbsoluteFill>
  );
};
