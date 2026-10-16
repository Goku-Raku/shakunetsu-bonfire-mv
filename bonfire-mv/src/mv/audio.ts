// 預先從原曲算好的逐格音訊特徵（scratch 分析腳本產生，30fps）：
// bands = 24 個對數頻段 0..1、kick = 低頻起音包絡 0..1、rms = 音量 0..1
import data from "./data/audio.json";

const hexToBytes = (h: string) => {
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
};

const kick = hexToBytes(data.kick);
const rms = hexToBytes(data.rms);
const bandCache = new Map<number, Uint8Array>();

const clampFrame = (f: number) => Math.max(0, Math.min(data.bands.length - 1, Math.floor(f)));

const bandsAt = (f: number) => {
  let b = bandCache.get(f);
  if (!b) {
    b = hexToBytes(data.bands[f]);
    bandCache.set(f, b);
  }
  return b;
};

// absFrame 是 30fps 單位，60fps 輸出時會有小數，取相鄰兩格內插
export const getBands = (absFrame: number): number[] => {
  const f0 = clampFrame(absFrame);
  const f1 = clampFrame(absFrame + 1);
  const t = Math.max(0, Math.min(1, absFrame - Math.floor(absFrame)));
  const a = bandsAt(f0);
  const b = bandsAt(f1);
  return Array.from(a, (v, i) => (v + (b[i] - v) * t) / 255);
};

const lerpArr = (arr: Uint8Array, absFrame: number) => {
  const f0 = clampFrame(absFrame);
  const f1 = clampFrame(absFrame + 1);
  const t = Math.max(0, Math.min(1, absFrame - Math.floor(absFrame)));
  return (arr[f0] + (arr[f1] - arr[f0]) * t) / 255;
};

export const getKick = (absFrame: number) => lerpArr(kick, absFrame);
export const getRms = (absFrame: number) => lerpArr(rms, absFrame);
