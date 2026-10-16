import { continueRender, delayRender } from "remotion";
import { LYRICS } from "./lyrics";
import { MEMBERS } from "./assets";

// 日文 Google 字型整套很大，這裡只用 Google Fonts 的 text= 子集，
// 下載 MV 實際用到的字。新增畫面文字時，記得也加進 EXTRA_TEXT。
export const FONT_DISPLAY = "'Dela Gothic One', 'Zen Kaku Gothic New', sans-serif";
export const FONT_JP = "'Zen Kaku Gothic New', 'Dela Gothic One', sans-serif";
export const FONT_EN = "'Anton', 'Dela Gothic One', sans-serif";
export const FONT_MONO = "'Share Tech Mono', monospace";

const EXTRA_TEXT =
  "灼熱 Bonfire! RAISE A SUILEN 2021 SAVAGE Domination to world FEEL HEAT BEAT 最強 夢 花火 楽園 女神 NO もしも それじゃ どうしよう 煙火 IMG 佔位 圖片 待補 public images" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?.,&()×²・—-_/:'「」？！　～>_[]{}<>#%+=|*~@$^;`\\\"" +
  "SYSTEM ONLINE LOADING BONFIRE.EXE SYNC OK IGNITION BPM BAR SECTION INTRO VERSE PRE CHORUS BRIDGE OUTRO FEED IN MEMBER ID POWER HEAT ROLE REC LIVE CUT-IN";

const corpus = () => {
  const parts = [EXTRA_TEXT];
  for (const l of LYRICS) parts.push(l.text, l.backing ?? "");
  for (const m of Object.values(MEMBERS)) parts.push(m.name, m.kana, m.role);
  return Array.from(new Set(parts.join(""))).join("");
};

const load = async () => {
  const text = encodeURIComponent(corpus());
  const url =
    "https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Zen+Kaku+Gothic+New:wght@500;900&family=Anton&family=Share+Tech+Mono&display=block&text=" +
    text;
  const css = await fetch(url).then((r) => r.text());
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  const sample = corpus();
  await Promise.all([
    document.fonts.load("400 40px 'Dela Gothic One'", sample),
    document.fonts.load("500 40px 'Zen Kaku Gothic New'", sample),
    document.fonts.load("900 40px 'Zen Kaku Gothic New'", sample),
    document.fonts.load("400 40px 'Anton'", sample),
    document.fonts.load("400 40px 'Share Tech Mono'", sample),
  ]);
};

if (typeof document !== "undefined") {
  const handle = delayRender("Loading Google Fonts subset");
  load()
    .catch((e) => {
      // 離線時退回系統字型，不阻擋預覽
      console.warn("Font load failed", e);
    })
    .finally(() => continueRender(handle));
}
