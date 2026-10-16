import React, { createContext, useContext } from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { FPS } from "./timing";

/**
 * 動畫時間單位：全片程式都以「30fps 的格」計算（B()、S()、各種 interpolate 的格數）。
 * 用 60fps 輸出時，這裡把實際影格換算回 30fps 單位，每一格會是 0.5 的小數，
 * 所以所有動畫都會在 60fps 下平滑地多出中間格，而不是每格重複一次。
 */
export const useFrame = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (frame * FPS) / fps;
};

// 絕對影格：讓任何深度的元件都能對齊全曲拍點
export const AbsFrameContext = createContext(0);
export const useAbsFrame = () => useContext(AbsFrameContext);

// 鏡頭長度：讓鏡頭內元件知道自己進行到多少
const ShotContext = createContext({ dur: 1 });

export const useShot = () => {
  const frame = useFrame();
  const { dur } = useContext(ShotContext);
  return { frame, dur, progress: Math.min(1, Math.max(0, frame / dur)) };
};

/** 入鏡方式：whip = 甩鏡帶動態模糊、zoom = 從大縮回、drop = 從上砸下、tilt = 斜切旋入 */
export type Enter = "none" | "whip" | "whipL" | "zoom" | "drop" | "tilt";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

const ShotMotion: React.FC<{ enter: Enter; children: React.ReactNode }> = ({ enter, children }) => {
  const frame = useFrame();
  if (enter === "none") return <>{children}</>;
  const p = interpolate(frame, [0, 9], [1, 0], { ...clamp, easing: outExpo });
  let style: React.CSSProperties = {};
  if (enter === "whip" || enter === "whipL") {
    const d = enter === "whip" ? 1 : -1;
    style = { translate: `${p * 420 * d}px 0px`, filter: p > 0.02 ? `blur(${p * 26}px)` : undefined, scale: String(1 + p * 0.08) };
  } else if (enter === "zoom") {
    style = { scale: String(1 + p * 0.45), filter: p > 0.02 ? `blur(${p * 14}px)` : undefined };
  } else if (enter === "drop") {
    style = { translate: `0px ${-p * 500}px`, filter: p > 0.02 ? `blur(${p * 18}px)` : undefined };
  } else if (enter === "tilt") {
    style = { rotate: `${p * -9}deg`, scale: String(1 + p * 0.3), filter: p > 0.02 ? `blur(${p * 12}px)` : undefined };
  }
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

/** 一個鏡頭：from/to 為絕對影格 */
export const Shot: React.FC<{
  name: string;
  from: number;
  to: number;
  enter?: Enter;
  children: React.ReactNode;
}> = ({ name, from, to, enter = "none", children }) => {
  const dur = Math.max(1, to - from);
  const { fps } = useVideoConfig();
  const k = fps / FPS; // 30 單位 → 實際影格
  const f0 = Math.round(from * k);
  const f1 = Math.round(to * k);
  return (
    <Sequence name={name} from={f0} durationInFrames={Math.max(1, f1 - f0)}>
      <ShotContext.Provider value={{ dur }}>
        <ShotMotion enter={enter}>{children}</ShotMotion>
      </ShotContext.Provider>
    </Sequence>
  );
};
