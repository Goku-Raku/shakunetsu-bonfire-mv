import { getStaticFiles, staticFile } from "remotion";

// 圖片放在 public/images/<id>.png（.jpg / .webp 也可）。
// 檔案還沒放進去時，畫面會自動顯示佔位卡，放進去後重新整理 Studio 即替換。
// 提示詞與尺寸見 source/MV圖片提示詞_GPT-Image-2.md

export type AssetId =
  | "bg_stage_wide"
  | "bg_paradise"
  | "bg_night_sky"
  | "bg_beach_bonfire"
  | "bg_festival_street"
  | "member_layer"
  | "member_lock"
  | "member_masking"
  | "member_pareo"
  | "member_chu2"
  | "chu2_rap"
  | "layer_sing"
  | "group_stage"
  | "group_back"
  | "pareo_chu2_festival"
  | "group_relax"
  | "hands_guitar"
  | "hands_drums"
  | "hands_keys"
  | "hands_dj"
  | "ras_logo";

export const ASSET_LABELS: Record<AssetId, string> = {
  bg_stage_wide: "夜間露天舞台・遠景",
  bg_paradise: "楽園の女神・黎明光",
  bg_night_sky: "海上夜空（煙火用）",
  bg_beach_bonfire: "海邊巨大營火",
  bg_festival_street: "夏祭屋台街",
  member_layer: "LAYER 去背立繪",
  member_lock: "LOCK 去背立繪",
  member_masking: "MASKING 去背立繪",
  member_pareo: "PAREO 去背立繪",
  member_chu2: "CHU² 去背立繪",
  chu2_rap: "CHU² DJ 台開場",
  layer_sing: "LAYER 演唱特寫",
  group_stage: "五人舞台合奏",
  group_back: "五人背影面向觀眾",
  pareo_chu2_festival: "PAREO × CHU² 逛祭典",
  group_relax: "演出後營火旁",
  hands_guitar: "吉他手部特寫",
  hands_drums: "鼓棒特寫",
  hands_keys: "鍵盤手部特寫",
  hands_dj: "DJ 台手部特寫",
  ras_logo: "RAS 官方 Logo（選用）",
};

const EXTS = ["png", "jpg", "jpeg", "webp"];

let cache: Set<string> | null = null;
const files = () => {
  if (!cache) {
    cache = new Set(getStaticFiles().map((f) => f.name.replace(/\\/g, "/")));
  }
  return cache;
};

/** 找到 public/images 裡的檔案就回傳 URL，否則 null（顯示佔位卡） */
export const resolveAsset = (id: AssetId): string | null => {
  const set = files();
  for (const ext of EXTS) {
    const name = `images/${id}.${ext}`;
    if (set.has(name)) return staticFile(name);
  }
  return null;
};

export type MemberId = "layer" | "lock" | "masking" | "pareo" | "chu2";

export const MEMBERS: Record<
  MemberId,
  { name: string; kana: string; role: string; color: string; asset: AssetId; eye: [number, number] } // eye = 準星瞄準的那隻眼睛（立繪比例座標）
> = {
  chu2: { name: "CHU²", kana: "チュチュ", role: "DJ", color: "#35D7FF", asset: "member_chu2", eye: [0.453, 0.202] },
  pareo: { name: "PAREO", kana: "パレオ", role: "KB", color: "#FF5FB4", asset: "member_pareo", eye: [0.453, 0.141] },
  masking: { name: "MASKING", kana: "マスキング", role: "DR", color: "#FFC233", asset: "member_masking", eye: [0.473, 0.148] },
  lock: { name: "LOCK", kana: "ロック", role: "GT", color: "#4BE38A", asset: "member_lock", eye: [0.501, 0.177] },
  layer: { name: "LAYER", kana: "レイヤ", role: "VO&BA", color: "#FF3B4E", asset: "member_layer", eye: [0.445, 0.136] },
};

/** 臉部中心（立繪寬高的比例） */
export const faceOf = (id: MemberId): [number, number] => [MEMBERS[id].eye[0] + 0.037, MEMBERS[id].eye[1]];

export const PALETTE = {
  night: "#0A0818",
  navy: "#141036",
  ember: "#FF5A1F",
  flame: "#FFC93C",
  hot: "#FF2E5B",
  neon: "#FF2E88",
  cyan: "#2EE6FF",
  white: "#FFF6E8",
};
