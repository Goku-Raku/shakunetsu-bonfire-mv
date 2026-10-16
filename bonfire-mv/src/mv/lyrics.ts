import data from "./data/lyrics.json";

// 歌詞文字放在 data/lyrics.json（官方歌詞有版權，不放進公開的 repo）。
// 第一次使用：把 data/lyrics.sample.json 複製成 data/lyrics.json，再把 ○ 換成你自己取得的歌詞。
// 歌詞來源：官方歌詞 LRC（逐句時間）。
// start/end 為秒。end 取下一句或 LRC 空行；少數長尾音改成提早淡出。
// backing = 括號裡的和聲／呼應，與主唱句分開排版。
// 逐字填色（karaoke）是依字數估算，並非逐字對拍。

export type LyricStyle =
  | "shout" // 開場 rap：單字逐一砸進畫面
  | "glitch" // 括號快嘴段：故障字
  | "none" // 由場景自己呈現（標題）
  | "verse" // 主歌：左下角打字機
  | "callout" // (Can challenge it)：右上斜貼紙
  | "callBig" // Party lighting!：中央爆字
  | "pre" // 預副歌：中央發光
  | "preBig" // 預副歌最後一句：放大、加速
  | "chorus" // 副歌：中央大字 + 火焰填色
  | "stamp" // NO, NO!!：蓋章
  | "whisper" // Feed in：安靜、拉開字距
  | "hypno" // 洗脳Reflection：鏡像
  | "finale" // 結尾
  | "hero"; // 文字當畫面主體（畫面沒有人物時）

export type Lyric = {
  start: number;
  end: number;
  text: string;
  backing?: string;
  style: LyricStyle;
  /** verse 的排版：x/y 為畫面百分比（左上角或中心），lines 分行，vertical 直排 */
  layout?: { x: number; y: number; anchor?: "left" | "center" | "right"; lines?: string[]; size?: number; vertical?: boolean; times?: number[] };
  /** 主唱實際唱的長度（秒），給填色用；沒填就依字數估算 */
  sing?: number;
  /** shout 樣式：每個單字實際唱到的秒數（人聲起音分析） */
  wordTimes?: number[];
  /** hero 樣式的分段：每段一行，size 為字級 */
  hero?: { text: string; size: number; key?: boolean; at?: number }[];
};

export const LYRICS = data as Lyric[];
