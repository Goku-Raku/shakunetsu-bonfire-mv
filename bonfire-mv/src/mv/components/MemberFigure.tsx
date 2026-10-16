import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { faceOf, MemberId, MEMBERS, resolveAsset } from "../assets";
import { Placeholder } from "./AssetImage";
import { Reticle } from "./cyber";

/**
 * 影子歸位的曲線：一開始拉得很遠，3～4 格內猛力彈回，稍微衝過頭再定住，表現力量感。
 * lf = 進場後經過的影格，amp = 起始的拉開距離（px）
 */
export const snapLag = (lf: number, amp: number) => (lf < 0 ? amp : amp * Math.exp(-lf * 0.6) * Math.cos(lf * 0.8));

/**
 * 成員半身像 + 身後的彩色剪影。
 * 剪影用「把圖移到畫面外、用 drop-shadow 把影子投回來」的作法，得到跟角色輪廓完全一致的單色影子。
 * half：只顯示上半身（約 55% 身高）；lag：影子相對本體的額外位移（做出殘影感）。
 */
export const MemberFigure: React.FC<{
  member: MemberId;
  half?: boolean;
  shadow?: string;
  shadow2?: string;
  lag?: [number, number];
  style?: React.CSSProperties;
  /** 在眼睛上畫鎖定準星：at = 準星出現的影格，size = 準星大小 */
  aim?: { at: number; size?: number; color?: string };
  /** 把臉（而不是圖片中心）對齊到容器的水平中線 */
  center?: boolean;
}> = ({ member, half = true, shadow, shadow2 = "#07040c", lag = [0, 0], style, aim, center = false }) => {
  const m = MEMBERS[member];
  const src = resolveAsset(m.asset);
  const sc = shadow ?? m.color;
  const visible = half ? 0.56 : 1; // 顯示多少比例的身高
  const tx = -50 - (center ? (faceOf(member)[0] - 0.5) * 100 : 0); // 圖片水平位移（自身寬度 %）
  const imgStyle: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: half ? "-3%" : "0%",
    height: `${100 / visible}%`,
    width: "auto",
    translate: `${tx}% 0%`,
  };
  const OFF = 6000;
  if (!src) {
    return (
      <AbsoluteFill style={style}>
        <Placeholder id={m.asset} accent={m.color} cutout />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ overflow: "visible", ...style }}>
      {/* 遠的暗影 */}
      <Img
        src={src}
        style={{
          ...imgStyle,
          translate: `calc(${tx}% - ${OFF}px) 0%`,
          filter: `drop-shadow(${OFF + 46 + lag[0] * 1.8}px ${22 + lag[1] * 1.8}px 0 ${shadow2})`,
          opacity: 0.75,
        }}
      />
      {/* 近的彩色影 */}
      <Img
        src={src}
        style={{
          ...imgStyle,
          translate: `calc(${tx}% - ${OFF}px) 0%`,
          filter: `drop-shadow(${OFF + 24 + lag[0]}px ${10 + lag[1]}px 0 ${sc})`,
        }}
      />
      <Img src={src} style={imgStyle} />
      {aim ? (
        <div style={{ position: "absolute", left: "50%", top: imgStyle.top, height: imgStyle.height, aspectRatio: "832 / 1216", translate: `${tx}% 0%` }}>
          <div style={{ position: "absolute", left: `${m.eye[0] * 100}%`, top: `${m.eye[1] * 100}%`, width: 0, height: 0 }}>
            <Reticle x={0} y={0} size={aim.size ?? 190} color={aim.color ?? m.color} at={aim.at} />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
