import type { Transition } from "./components/cyber";
import { B, S } from "./timing";

// 剪接點（絕對影格）與它的轉場。歌詞層也用這份清單：
// 一句歌詞若拖過剪接點，會在剪接點前一拍爆散消失，不會殘留到下一個鏡頭。
/**
 * 1:39 重型段的重擊（絕對影格）。用 64 樣本的細解析度頻譜通量量出起音：
 * 98.731 / 99.692 / 101.245 / 101.828 / 102.783 秒，再各提早 1 格，畫面會比聲音略早一點點，看起來剛好對上。
 */
export const HEAVY_HITS = [2961, 2990, 3036, 3054, 3082];

export const TRANSITIONS: Transition[] = [
  { at: B(4), type: "glitch" }, { at: B(8), type: "slash", color: "#FF2E88" }, { at: S(17.55), type: "impact" },
  { at: B(14), type: "shutter" }, { at: B(22), type: "pillar" }, { at: S(40.759), type: "pillar" },
  { at: B(30), type: "slash", color: "#2EE6FF" }, { at: B(30), type: "impact" }, { at: S(53.114), type: "impact" }, { at: S(60.167), type: "impact" },
  { at: B(39), type: "impact" }, { at: B(43), type: "slash" }, { at: B(47), type: "pillar" }, { at: B(51), type: "shutter", color: "#FF2E88" },
  { at: B(55), type: "impact" }, { at: B(57), type: "slash", color: "#FFC93C" }, { at: B(61), type: "iris" }, { at: HEAVY_HITS[0], type: "impact" }, { at: B(67), type: "pillar" },
  { at: S(110.449), type: "glitch" }, { at: B(75), type: "slash", color: "#2EE6FF" }, { at: B(75), type: "impact" }, { at: S(122.935), type: "impact" },
  { at: S(129.719), type: "impact" }, { at: B(84), type: "impact" }, { at: B(88), type: "slash", color: "#FF2E88" },
  { at: B(92), type: "shutter" }, { at: B(96), type: "slash", color: "#2EE6FF" }, { at: B(100), type: "impact" },
  { at: B(102), type: "pillar" }, { at: S(164.182), type: "glitch" }, { at: B(109), type: "glitch" }, { at: B(111), type: "glitch" },
  { at: B(113), type: "glitch" }, { at: B(114), type: "glitch" }, { at: B(116), type: "impact" }, { at: B(120), type: "slash" },
  { at: B(124), type: "pillar" }, { at: B(128), type: "shutter", color: "#FF2E88" }, { at: B(132), type: "impact" },
  { at: B(134), type: "slash", color: "#FFC93C" }, { at: B(138), type: "iris" },
];
