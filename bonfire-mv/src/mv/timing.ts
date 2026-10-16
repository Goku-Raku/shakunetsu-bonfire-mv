// 歌曲時鐘。BPM 與第一個強拍位置是用音訊實測（頻譜通量 + 節拍梳狀比對）得出，
// 再用 LRC 的歌詞起點交叉核對：副歌每兩句 ≈ 2 小節。
export const FPS = 30;
export const BPM = 155;
export const BEAT = 60 / BPM; // 0.387s
export const BAR = BEAT * 4; // 1.548s
export const OFFSET = 0.2; // 第 0 小節強拍（秒）
export const SONG_SECONDS = 224.8;
export const SONG_FRAMES = Math.round(SONG_SECONDS * FPS);

/** 第 n 小節開始的秒數（n 可為小數，0.25 = 一拍） */
export const barSec = (n: number) => OFFSET + n * BAR;
/** 第 n 小節開始的影格 */
export const B = (n: number) => Math.round(barSec(n) * FPS);
/** 秒 → 影格 */
export const S = (sec: number) => Math.round(sec * FPS);

/** 絕對影格所在的拍內相位 0..1 */
export const beatPhase = (absFrame: number) => {
  const t = absFrame / FPS - OFFSET;
  if (t < 0) return 0;
  return (t % BEAT) / BEAT;
};

/** 每拍一次、指數衰減的脈衝 1→0 */
export const beatPulse = (absFrame: number, decay = 7) => {
  const t = absFrame / FPS - OFFSET;
  if (t < 0) return 0;
  return Math.exp(-((t % BEAT) / BEAT) * decay);
};

/** 每小節第一拍的脈衝 */
export const barPulse = (absFrame: number, decay = 5) => {
  const t = absFrame / FPS - OFFSET;
  if (t < 0) return 0;
  return Math.exp(-((t % BAR) / BAR) * decay);
};

export const beatIndex = (absFrame: number) =>
  Math.floor((absFrame / FPS - OFFSET) / BEAT);
