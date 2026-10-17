# 製作流程與 AI 工具

這份文件記錄這支 MV 用了哪些 AI 模型與工具、各自負責什麼，以及音樂分析的做法，方便別人重現或參考。

## 分工

| 角色 | 負責 |
| --- | --- |
| 人（Gokuraku） | 企劃方向、提供素材（音檔、歌詞、角色資料）、每一輪審片與修改意見、最終取捨 |
| Claude（Anthropic，透過 Claude Code） | 分鏡設計、全部 Remotion 程式、音訊分析腳本、NovelAI 提示詞、圖片挑選與去背、文件 |
| OpenAI Codex | 參與編寫本地 NovelAI 接入工具（`tools/novelai/`）、離線測試與使用文件 |
| NovelAI Diffusion Anime V4.5 Full | 生成 20 張角色與場景圖 |

全片經過十多輪「看片 → 文字回饋 → 修改」的迭代，回饋大多是像「1:27 的字出現早了一點」「剪影歸位要更有力量感」這種具體描述，再由 AI 對照音訊分析與抽影格去修正。

## 使用的模型與服務

| 名稱 | 用途 | 備註 |
| --- | --- | --- |
| Claude（Anthropic） | 企劃、程式、分析、文件 | 透過 Claude Code 在本機操作專案、執行指令、抽影格檢查畫面 |
| OpenAI Codex | 本地 NovelAI 接入工具的程式與文件協作 | PowerShell API 接入、遮罩 Token 設定介面、Windows DPAPI 憑證保存、單張文生圖／圖生圖與離線測試；見 [工具說明](../tools/novelai/README.md) |
| NovelAI Diffusion Anime V4.5 Full（`nai-diffusion-4-5-full`） | 角色與場景圖 | 經 `tools/novelai/NovelAI.ps1` 呼叫官方 API；參數見 [ASSETS.md](ASSETS.md) |
| GPT Image 2 | 第一版草圖 | 畫風太偏 3D，最後沒有採用，圖片也不在 repo 裡 |

## 圖片製作

本 repo 已收錄由 OpenAI Codex 參與編寫的本地 NovelAI plugin／API 接入工具。程式、請求範例與離線測試位於 [`tools/novelai/`](../tools/novelai/)；使用者須自行設定帳號憑證，加密 Token 檔不納入 Git。

1. **角色鎖定**：對照官方立繪，把每位成員的辨識特徵寫成固定標籤（髮色、瞳色、髮型），服裝另外寫成 MV 專用的「Bonfire」舞台裝標籤，兩者分開組合。
2. **畫風測試**：同一組提示詞試了官方風、扁平圖像、漫畫網點、90 年代復古、塗鴉龐克、粗線條動畫等畫風，最後選粗線條、高對比的龐克動畫風（`--style bold`）。
3. **多人圖**：用 V4.5 的角色提示詞（`char_captions`）加位置座標，避免五人特徵互相混在一起；每張多人圖抽 3～7 個 seed 挑選。
4. **透明背景**：NovelAI 的 API 不會輸出真正的透明 PNG（`tag_hint_transparent_background` 只是提示，回傳的圖仍是不透明的），所以立繪改成在純綠背景上生成，再用 `source/novelai/scripts/chroma.py` 去背：依綠色強度算出柔邊 alpha、保留小塊封閉的綠（眼睛）、去掉大塊封閉的綠（手臂間的空隙），最後去除邊緣綠溢色。
5. **費用**：這個專案的 1MP 圖每張大約消耗 11～12 Anlas。

## 音樂分析

所有分析腳本在 `bonfire-mv/scripts/analysis/`，需要 Python 3 與 NumPy。音檔先用 Remotion 內建的 FFmpeg 轉成 WAV：

```bash
npx remotion ffmpeg -i "public/RAISE A SUILEN - 灼熱 Bonfire!.flac" -vn -ac 1 -ar 22050 -c:a pcm_s16le mono.wav
npx remotion ffmpeg -i "public/RAISE A SUILEN - 灼熱 Bonfire!.flac" -vn -ac 2 -ar 22050 -c:a pcm_s16le stereo.wav
```

| 腳本 | 做什麼 | 結果 |
| --- | --- | --- |
| `tempo.py mono.wav out.json` | 頻譜通量＋節拍梳狀比對找 BPM 與第一拍 | 155 BPM，第 0 小節強拍在 0.20 秒（`src/mv/timing.ts`） |
| `spectrum.py mono.wav audio.json` | 逐格（30fps）算 24 個對數頻段、大鼓起音包絡、音量 | `src/mv/data/audio.json`，驅動頻譜、震動、觀眾擺動 |
| `onsets_verse.py mono.wav` | 人聲頻段（700–3500 Hz）起音，對到八分音符 | 主歌每一行的出現時間（`layout.times`） |
| `onsets_rap.py mono.wav` | 開場 rap 每個單字的起音 | 前兩字各一拍、後三字附點八分（`wordTimes`） |
| `onsets_heavy.py mono.wav` | 64 樣本細解析度的低頻／全頻通量 | 1:39 重型段 5 個重擊（`HEAVY_HITS`） |
| `backing_side.py stereo.wav "起|迄|標籤"` | 比較中央（L+R）與兩側（L−R）聲道 | 和聲（偏兩側）在 LRC 後約 0.25 秒開始、唱滿一小節，主唱接在後面 |

分析只是輔助，最後的對時都經過人實際聽、回報「早了／晚了」再修正。畫面一律比聲音提早約 1 格（1/30 秒）出現，看起來才會剛好對上。

## 畫面技術

- **時間單位**：程式以「30fps 的格」為單位撰寫（`B(小節)`、`S(秒)`），`useFrame()` 會把 60fps 的實際影格換算成小數，讓同一套動畫在 60fps 下自動變平滑。
- **剪接點清單**：`src/mv/cuts.ts` 統一管理剪接點與轉場，歌詞層會讀它，讓拖過剪接點的歌詞在剪接點前一拍爆散消失。
- **煙火**：canvas 繪製，粒子位置用「有空氣阻力與重力」的封閉解計算，任何影格都能直接算出、不需要逐格模擬；畫成墨線外框的漫畫花瓣。
- **立繪剪影**：同一張去背圖用 `drop-shadow` 投出成員色與暗色兩層剪影，進場時用彈簧曲線（`snapLag`）彈回。
- **字型**：日文字型用 Google Fonts 的 `text=` 參數只下載 MV 用到的字，渲染時需要連網。
