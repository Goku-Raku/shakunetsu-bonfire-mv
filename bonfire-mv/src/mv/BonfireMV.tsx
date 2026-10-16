import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, random, staticFile } from "remotion";
import "./fonts";
import { PALETTE } from "./assets";
import { AbsFrameContext, Shot, useFrame } from "./context";
import { Beams, BottomShade, Embers, FilmOverlay, Flash, Tint } from "./components/fx";
import { Burst, BurstKind } from "./components/FireworksCanvas";
import { CutIn, GlitchBurst, HUD, TransitionLayer } from "./components/cyber";
import { HEAVY_HITS, TRANSITIONS } from "./cuts";
import { LyricLayer } from "./components/LyricLayer";
import {
  BandSlash,
  BeachBonfire,
  ChorusStage,
  FireworkSky,
  FiveStage,
  HeadbangBreak,
  ImageShot,
  InstrumentCut,
  IntroEmber,
  Kaleido,
  MemberCard,
  MemberCuts,
  MemberStrobe,
  NegativeBubbles,
  Outro,
  RapIntro,
  Split,
  TitleIgnite,
  WhiteOut,
} from "./scenes";
import { B, BEAT, S, SONG_FRAMES } from "./timing";

const FW_COLORS: [string, string][] = [
  ["#FFC93C", "#FFF3B0"],
  ["#FF2E88", "#FFD1E8"],
  ["#2EE6FF", "#E0FBFF"],
  ["#FF5A1F", "#FFE07A"],
  ["#B44CFF", "#F0D6FF"],
  ["#4BE38A", "#E3FFEE"],
];

/** 依歌曲秒數產生煙火（at 轉為鏡頭內影格） */
const bursts = (times: number[], shotFrom: number, seed: string, size = 300, kinds: BurstKind[] = ["peony", "chrys", "strobe"], rise = true): Burst[] =>
  times.map((t, i) => {
    const c = FW_COLORS[Math.floor(random(`${seed}-c-${i}`) * FW_COLORS.length)];
    return {
      at: S(t) - shotFrom,
      x: 0.15 + random(`${seed}-x-${i}`) * 0.7,
      y: 0.18 + random(`${seed}-y-${i}`) * 0.3,
      color: c[0],
      color2: c[1],
      size: size * (0.75 + random(`${seed}-s-${i}`) * 0.5),
      seed: `${seed}-${i}`,
      rise,
      kind: kinds[i % kinds.length],
    };
  });

/** 從 start 起每隔 step 秒一發，共 n 發 */
const every = (start: number, step: number, n: number) => new Array(n).fill(0).map((_, i) => start + i * step);



export const BonfireMV: React.FC = () => {
  const frame = useFrame();

  return (
    <AbsFrameContext.Provider value={frame}>
      <AbsoluteFill style={{ background: PALETTE.night }}>
        {/* ════════ INTRO ════════ */}
        <Shot name="00 火種" from={0} to={B(4)}>
          <IntroEmber />
        </Shot>
        <Shot name="01 CHU² rap" enter="zoom" from={B(4)} to={B(8)}>
          <RapIntro />
        </Shot>
        <Shot name="02 五人閃現" enter="tilt" from={B(8)} to={S(17.55)}>
          <MemberStrobe />
        </Shot>
        <Shot name="03 標題點火" from={S(17.55)} to={B(14)}>
          <TitleIgnite />
        </Shot>

        {/* ════════ 樂團介紹（間奏 8 小節） ════════ */}
        <Shot name="04 RAS" from={B(14)} to={B(14.5)}>
          <BandSlash />
        </Shot>
        <Shot name="05 CHU²" enter="whip" from={B(14.5)} to={B(16)}>
          <MemberCard member="chu2" side="left" />
        </Shot>
        <Shot name="06 PAREO" enter="whipL" from={B(16)} to={B(17.5)}>
          <MemberCard member="pareo" side="right" />
        </Shot>
        <Shot name="07 MASKING" enter="whip" from={B(17.5)} to={B(19)}>
          <MemberCard member="masking" side="left" />
        </Shot>
        <Shot name="08 LOCK" enter="whipL" from={B(19)} to={B(20.5)}>
          <MemberCard member="lock" side="right" />
        </Shot>
        <Shot name="09 LAYER" enter="whip" from={B(20.5)} to={B(22)}>
          <MemberCard member="layer" side="left" />
        </Shot>

        {/* ════════ VERSE 1 ════════ */}
        <Shot name="10 LAYER 演唱" enter="zoom" from={B(22)} to={S(40.759)}>
          <ImageShot id="layer_sing" cam={{ zoom: [1.02, 1.2], x: [30, -30] }} flashColor={PALETTE.ember}>
            <Embers count={30} seed="v1" speed={70} size={3} opacity={0.8} />
          </ImageShot>
        </Shot>
        <Shot name="11 ド派手にダイブ" enter="drop" from={S(40.759)} to={S(43.266)}>
          <ImageShot id="bg_stage_wide" cam={{ zoom: [1.0, 1.45], y: [-60, 120] }} flashColor="#FFF6E8" shake={18} filter="brightness(0.6) saturate(1.2)">
            <Beams intensity={0.7} />
          </ImageShot>
        </Shot>
        <Shot name="12 楽園の女神" enter="zoom" from={S(43.266)} to={B(30)}>
          <ImageShot id="bg_paradise" cam={{ zoom: [1.2, 1.05] }} flashColor="#FFE6A0" filter="brightness(0.7)">
            <Tint color="#FFB36B" opacity={0.18} blend="screen" />
            <Embers count={40} seed="goddess" speed={60} size={4} colors={["#FFF3D0", "#FFD36B"]} />
          </ImageShot>
        </Shot>

        {/* ════════ PRE-CHORUS 1：花火 → 點燃營火 ════════ */}
        <Shot name="13 花火のような" from={B(30)} to={S(53.114)}>
          <FireworkSky bursts={bursts([48.73, 49.5, 51.77, 52.3], B(30), "pre1", 360, ["chrys", "peony", "willow", "ring"])} />
        </Shot>
        <Shot name="14 今燃やしに行こう" enter="zoom" from={S(53.114)} to={S(60.167)}>
          <BeachBonfire intensity={[0.5, 1.5]} shake />
        </Shot>
        <Shot name="15 Party lighting" from={S(60.167)} to={B(39)}>
          <ImageShot id="bg_stage_wide" cam={{ zoom: [1.3, 1.1] }} flashColor="#FFFFFF">
            <Beams intensity={1.4} count={8} />
          </ImageShot>
        </Shot>

        {/* ════════ CHORUS 1 ════════ */}
        <Shot name="16 副歌1 合奏" enter="zoom" from={B(39)} to={B(43)}>
          <ChorusStage cam={{ zoom: [1.0, 1.08] }} />
        </Shot>
        <Shot name="17 副歌1 快切" enter="whip" from={B(43)} to={B(47)}>
          <MemberCuts members={["lock", "masking", "pareo", "chu2"]} />
        </Shot>
        <Shot name="18 副歌1 LAYER" enter="tilt" from={B(47)} to={B(51)}>
          <ChorusStage id="layer_sing" cam={{ zoom: [1.15, 1.3] }} />
        </Shot>
        <Shot name="19 副歌1 煙火" enter="drop" from={B(51)} to={B(55)}>
          <ChorusStage cam={{ zoom: [1.08, 1.02], x: [-30, 30] }} fireworks={bursts(every(79.6, BEAT * 4, 4), B(51), "c1d", 320, ["peony", "ring", "chrys", "strobe"])} />
        </Shot>
        <Shot name="20 NO NO 真夏の本気" enter="zoom" from={B(55)} to={B(57)}>
          <ChorusStage cam={{ zoom: [1.04, 1.1] }} hue="#FF2E5B" />
        </Shot>
        <Shot name="21 ギラギラ" enter="tilt" from={B(57)} to={B(61)}>
          <FireworkSky bursts={bursts(every(88.8, BEAT * 2, 8), B(57), "c1f", 360, ["strobe", "crossette", "strobe", "chrys"])} />
        </Shot>

        {/* ════════ 夢が飼う現実へ Feed in ＋ 安靜段 ════════ */}
        <Shot name="22 Feed in" from={B(61)} to={HEAVY_HITS[0]}>
          <BeachBonfire intensity={[1.0, 0.45]} cam={{ zoom: [1.25, 1.05], y: [-30, 20] }} />
        </Shot>
        <Shot name="22b 甩頭重型段" from={HEAVY_HITS[0]} to={B(67)}>
          <HeadbangBreak hits={HEAVY_HITS.map((h) => h - HEAVY_HITS[0])} />
        </Shot>

        {/* ════════ VERSE 2：祭典 ════════ */}
        <Shot name="23 もしも それじゃ" enter="whipL" from={B(67)} to={S(110.449)}>
          <ImageShot id="bg_festival_street" cam={{ zoom: [1.05, 1.18], x: [40, -40] }} flashColor={PALETTE.flame}>
            <NegativeBubbles
              popAt={S(106.709) - B(67)}
              blowAt={S(108.758) - B(67)}
              words={[
                { text: "もしも", at: S(104.32) - B(67), x: 14, y: 18 },
                { text: "それじゃ", at: S(105.09) - B(67), x: 58, y: 14 },
                { text: "どうしよう", at: S(105.67) - B(67), x: 34, y: 36 },
              ]}
            />
          </ImageShot>
        </Shot>
        <Shot name="24 美味いもん" enter="whip" from={S(110.449)} to={B(75)}>
          <ImageShot id="pareo_chu2_festival" cam={{ zoom: [1.12, 1.02], x: [-30, 20] }} flashColor="#FFF6E8">
            <Embers count={25} seed="festival" speed={60} size={3} colors={["#FFE07A", "#FF9A4A"]} opacity={0.7} />
          </ImageShot>
        </Shot>

        {/* ════════ PRE-CHORUS 2：一發 → 連發 ════════ */}
        <Shot name="25 一発鳴らせ" enter="drop" from={B(75)} to={S(122.935)}>
          <FireworkSky bursts={bursts([118.45, 121.5, 122.1], B(75), "pre2", 480, ["chrys", "willow", "ring"])} />
        </Shot>
        <Shot name="26 連続打ち上げ" enter="zoom" from={S(122.935)} to={S(129.719)}>
          <FireworkSky
            cam={{ zoom: [1.0, 1.25] }}
            bursts={bursts([...every(123.0, BEAT * 2, 6), ...every(127.7, BEAT, 4), ...every(128.9, BEAT / 2, 2)], S(122.935), "barrage", 300, ["peony", "crossette", "chrys", "strobe", "ring", "willow"])}
          />
        </Shot>
        <Shot name="27 Party lighting" from={S(129.719)} to={B(84)}>
          <ImageShot id="bg_stage_wide" cam={{ zoom: [1.3, 1.1] }} flashColor="#FFFFFF">
            <Beams intensity={1.4} count={8} colors={["#2EE6FF", "#FF2E88", "#FFFFFF"]} />
          </ImageShot>
        </Shot>

        {/* ════════ CHORUS 2 ════════ */}
        <Shot name="28 副歌2 合奏" enter="zoom" from={B(84)} to={B(88)}>
          <ChorusStage cam={{ zoom: [1.08, 1.03], x: [40, -40] }} />
        </Shot>
        <Shot name="29 副歌2 快切" enter="whipL" from={B(88)} to={B(92)}>
          <MemberCuts members={["chu2", "pareo", "masking", "lock"]} />
        </Shot>
        <Shot name="30 汗に溺れろ" enter="drop" from={B(92)} to={B(96)}>
          <Split members={["layer", "masking"]} />
        </Shot>
        <Shot name="31 傍観者には" enter="whip" from={B(96)} to={B(100)}>
          <Split members={["masking", "lock"]} />
        </Shot>
        <Shot name="32 食らいついてこい" enter="zoom" from={B(100)} to={B(102)}>
          <ImageShot id="chu2_rap" cam={{ zoom: [1.1, 1.35] }} flashColor="#FF2E5B">
            <Tint color="#FF2E5B" opacity={0.3} blend="color" />
          </ImageShot>
        </Shot>
        <Shot name="33 棲みついて" enter="whipL" from={B(102)} to={S(164.182)}>
          <Split members={["pareo", "chu2"]} />
        </Shot>
        <Shot name="34 洗脳Reflection" enter="tilt" from={S(164.182)} to={B(109)}>
          <Kaleido />
        </Shot>

        {/* ════════ 間奏：樂器特寫 ════════ */}
        <Shot name="35 吉他" enter="whip" from={B(109)} to={B(111)}>
          <InstrumentCut id="hands_guitar" color="#4BE38A" label="LOCK — GUITAR" />
        </Shot>
        <Shot name="36 鼓" enter="drop" from={B(111)} to={B(113)}>
          <InstrumentCut id="hands_drums" color="#FFC233" label="MASKING — DRUMS" />
        </Shot>
        <Shot name="37 鍵盤" enter="whipL" from={B(113)} to={B(114)}>
          <InstrumentCut id="hands_keys" color="#FF5FB4" label="PAREO — KEYS" />
        </Shot>
        <Shot name="38 DJ" enter="zoom" from={B(114)} to={B(115)}>
          <InstrumentCut id="hands_dj" color="#35D7FF" label="CHU² — DJ" />
        </Shot>
        <Shot name="39 白光" from={B(115)} to={B(116)}>
          <WhiteOut />
        </Shot>

        {/* ════════ FINAL CHORUS ════════ */}
        <Shot name="40 最強な僕らで" enter="zoom" from={B(116)} to={B(120)}>
          <FiveStage hue="#FF2E88" fireworks={bursts(every(180.0, BEAT * 4, 4), B(116), "f1", 340, ["chrys", "ring", "willow", "strobe"])} />
          <Flash at={0} dur={14} color="#FFFFFF" />
        </Shot>
        <Shot name="41 終副歌 快切" enter="whip" from={B(120)} to={B(124)}>
          <MemberCuts members={["lock", "masking", "pareo", "chu2", "layer"]} beatsEach={3} />
        </Shot>
        <Shot name="42 終副歌 合奏" enter="drop" from={B(124)} to={B(128)}>
          <ChorusStage cam={{ zoom: [1.0, 1.08] }} fireworks={bursts(every(192.6, BEAT * 2, 8), B(124), "f3", 320, ["peony", "crossette", "strobe", "chrys"])} />
        </Shot>
        <Shot name="43 五人並列" enter="tilt" from={B(128)} to={B(132)}>
          <Split members={["lock", "masking", "layer", "pareo", "chu2"]} />
        </Shot>
        <Shot name="44 NO NO 真夏の本気" enter="zoom" from={B(132)} to={B(134)}>
          <ChorusStage cam={{ zoom: [1.05, 1.1] }} hue="#FF2E5B" fireworks={bursts(every(205.0, BEAT, 6), B(132), "f5", 300, ["strobe", "peony", "ring"])} />
        </Shot>
        <Shot name="45 ギラギラ 終" enter="whipL" from={B(134)} to={B(138)}>
          <FiveStage
            hue="#FF5A1F"
            fireworks={bursts([...every(208.1, BEAT, 8), ...every(211.2, BEAT / 2, 6)], B(134), "f6", 360, ["willow", "chrys", "strobe", "crossette", "ring"])}
          />
        </Shot>

        {/* ════════ OUTRO ════════ */}
        <Shot name="46 夢が飼う今こそ Bonfire!" from={B(138)} to={SONG_FRAMES}>
          <Outro />
        </Shot>

        {/* ════════ 切入（カットイン）與關鍵字故障 ════════ */}
        {/* 切入規則：只在合奏畫面出現，放在每段合奏最後兩小節（歌詞第二句的長音），
            兩人一組接力、一左一右，配對取自人物指南裡的關係；最後兩小節五人依舞台站位連發 */}
        {/* 副歌1：PAREO → CHU²（招募與被看見） */}
        <CutIn member="pareo" at={B(41)} dur={B(42) - B(41)} />
        <CutIn member="chu2" at={B(42)} dur={B(43) - B(42)} flip />
        {/* 副歌1 後半：MASKING → LOCK（Galaxy 的互相認可） */}
        <CutIn member="masking" at={B(53)} dur={B(54) - B(53)} />
        <CutIn member="lock" at={B(54)} dur={B(55) - B(54)} flip />
        {/* 副歌2：CHU² → LAYER（推動方向的人，和把它唱出來的人） */}
        <CutIn member="chu2" at={B(86)} dur={B(87) - B(86)} />
        <CutIn member="layer" at={B(87)} dur={B(88) - B(87)} flip />
        {/* 終副歌：LAYER → MASKING（組團前就是搭檔） */}
        <CutIn member="layer" at={B(126)} dur={B(127) - B(126)} />
        <CutIn member="masking" at={B(127)} dur={B(128) - B(127)} flip />
        {/* 結尾前兩小節：五人依站位連發 */}
        <CutIn member="lock" at={B(136)} dur={B(136.5) - B(136)} y={14} />
        <CutIn member="masking" at={B(136.4)} dur={B(136.9) - B(136.4)} y={44} flip />
        <CutIn member="layer" at={B(136.8)} dur={B(137.3) - B(136.8)} y={18} />
        <CutIn member="pareo" at={B(137.2)} dur={B(137.7) - B(137.2)} y={46} flip />
        <CutIn member="chu2" at={B(137.5)} dur={B(138) - B(137.5)} y={28} />
        <GlitchBurst at={S(65.3)} dur={8} />
        <GlitchBurst at={S(135.6)} dur={6} />
        <GlitchBurst at={S(166.3)} dur={8} />
        <GlitchBurst at={S(184.6)} dur={8} />

        {/* ════════ 全片疊層 ════════ */}
        <TransitionLayer items={TRANSITIONS} />
        <HUD opacity={0.75} />
        <BottomShade strength={0.45} />
        <LyricLayer />
        <FilmOverlay />
        <Audio src={staticFile("RAISE A SUILEN - 灼熱 Bonfire!.flac")} />
      </AbsoluteFill>
    </AbsFrameContext.Provider>
  );
};
