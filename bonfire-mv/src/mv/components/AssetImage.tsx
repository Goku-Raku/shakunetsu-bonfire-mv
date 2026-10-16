import React from "react";
import { AbsoluteFill, Easing, Img, interpolate } from "remotion";
import { ASSET_LABELS, AssetId, resolveAsset } from "../assets";
import { useShot } from "../context";
import { FONT_JP } from "../fonts";

export type Cam = {
  zoom?: [number, number];
  x?: [number, number]; // px
  y?: [number, number]; // px
  rot?: [number, number]; // deg
  origin?: string; // 縮放基準點，例如 "50% 0%" 讓上緣固定
};

const ease = Easing.bezier(0.33, 0, 0.2, 1);

const lerp = (r: [number, number] | undefined, p: number, d: number) =>
  r ? interpolate(p, [0, 1], r, { easing: ease }) : d;

/** 佔位卡：素材未到時顯示這張，標明要放哪個檔 */
export const Placeholder: React.FC<{
  id: AssetId;
  accent?: string;
  cutout?: boolean;
}> = ({ id, accent = "#FF5A1F", cutout }) => {
  if (cutout) {
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end" }}>
        <svg viewBox="0 0 400 600" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id={`pg-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={accent} stopOpacity="0.95" />
              <stop offset="1" stopColor="#120c2a" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <circle cx="200" cy="140" r="72" fill={`url(#pg-${id})`} />
          <path
            d="M70 600 C80 380 120 250 200 240 C280 250 320 380 330 600 Z"
            fill={`url(#pg-${id})`}
          />
          <rect x="6" y="6" width="388" height="588" fill="none" stroke={accent} strokeWidth="3" strokeDasharray="14 10" opacity="0.7" />
          <text x="200" y="420" textAnchor="middle" fill="#fff" fontSize="22" fontFamily={FONT_JP} fontWeight="900">
            {ASSET_LABELS[id]}
          </text>
          <text x="200" y="452" textAnchor="middle" fill="#fff" opacity="0.75" fontSize="16" fontFamily="monospace">
            images/{id}.png
          </text>
        </svg>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 60%, ${accent}66 0%, #1a1036 55%, #07060f 100%)`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 40,
          border: `3px dashed ${accent}aa`,
          borderRadius: 12,
        }}
      />
    </AbsoluteFill>
  );
};

/** 佔位標籤（不跟運鏡縮放，永遠看得到） */
const PlaceholderLabel: React.FC<{ id: AssetId }> = ({ id }) => (
  <div
    style={{
      position: "absolute",
      right: 60,
      top: 50,
      textAlign: "right",
      color: "#fff",
      fontFamily: FONT_JP,
      fontWeight: 900,
      fontSize: 30,
      opacity: 0.75,
      textShadow: "0 2px 8px #000",
    }}
  >
    {ASSET_LABELS[id]}
    <div style={{ fontFamily: "monospace", fontWeight: 400, fontSize: 20 }}>images/{id}.png</div>
  </div>
);

/** 有運鏡的圖片層（Ken Burns），素材缺時自動換佔位卡 */
export const AssetImage: React.FC<{
  id: AssetId;
  cam?: Cam;
  accent?: string;
  cutout?: boolean;
  objectPosition?: string;
  style?: React.CSSProperties;
  filter?: string;
}> = ({ id, cam, accent, cutout, objectPosition = "50% 50%", style, filter }) => {
  const { progress } = useShot();
  const src = resolveAsset(id);
  const zoom = lerp(cam?.zoom, progress, 1.06);
  const x = lerp(cam?.x, progress, 0);
  const y = lerp(cam?.y, progress, 0);
  const rot = lerp(cam?.rot, progress, 0);

  return (
    <>
    <AbsoluteFill
      style={{
        scale: String(zoom),
        translate: `${x}px ${y}px`,
        rotate: `${rot}deg`,
        transformOrigin: cam?.origin,
        filter,
        ...style,
      }}
    >
      {src ? (
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: cutout ? "contain" : "cover",
            objectPosition: cutout ? "50% 100%" : objectPosition,
          }}
        />
      ) : (
        <Placeholder id={id} accent={accent} cutout={cutout} />
      )}
    </AbsoluteFill>
    {!src && !cutout ? <PlaceholderLabel id={id} /> : null}
    </>
  );
};
