import React from "react";

const INK = "#120818";
export const FIRE_GRADIENT = "linear-gradient(180deg, #FFF3B0 0%, #FFC93C 35%, #FF6A1F 70%, #E8261C 100%)";

/**
 * 結尾「BONFIRE!」那種字：粗墨線外框＋彩色硬陰影＋火焰漸層（或指定實心色）。
 * 用在標題、Feed in、結尾，讓字在亮背景上也跳得出來。
 */
export const FireWord: React.FC<{
  children: string;
  size: number;
  font: string;
  shadow?: string;
  stroke?: number;
  fill?: string;
  style?: React.CSSProperties;
}> = ({ children, size, font, shadow = "#FF2E5B", stroke, fill, style }) => {
  const sw = stroke ?? Math.round(size * 0.078);
  const off = Math.round(size * 0.052);
  return (
    <div style={{ position: "relative", display: "inline-block", fontFamily: font, fontSize: size, lineHeight: 1.05, whiteSpace: "nowrap", ...style }}>
      <div aria-hidden style={{ position: "absolute", left: 0, top: 0, color: INK, WebkitTextStroke: `${sw}px ${INK}`, filter: `drop-shadow(${off}px ${off}px 0 ${shadow})` }}>
        {children}
      </div>
      {fill ? (
        <div style={{ position: "relative", color: fill }}>{children}</div>
      ) : (
        <div style={{ position: "relative", backgroundImage: FIRE_GRADIENT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{children}</div>
      )}
    </div>
  );
};
