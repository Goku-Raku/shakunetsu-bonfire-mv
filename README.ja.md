# 灼熱 Bonfire! — RAISE A SUILEN 非公式 MV（Remotion）

[繁體中文](README.md) ｜ [English](README.en.md) ｜ **日本語**

RAISE A SUILEN「灼熱 Bonfire!」のファンメイド MV です。[Remotion](https://www.remotion.dev/)（React）を使い、映像はすべてコードで描いています。カット、トランジション、花火、焚き火、歌詞のレイアウト、サイバー風の HUD は、楽曲から実測したビートと歌声のタイミングに合わせて動きます。キャラクターのイラストは NovelAI で生成しました。

> ⚠️ 本作は**非公式・非営利**の二次創作です。このリポジトリには楽曲の音源、公式歌詞、公式キャラクターイラストは**含まれていません**。ご利用の前に[免責事項](DISCLAIMER.md)をお読みください。

![タイトル](docs/images/02_title.jpg)

| | |
| --- | --- |
| ![起動](docs/images/01_boot.jpg) | ![メンバーカード](docs/images/03_member_card.jpg) |
| ![ヘドバンパート](docs/images/04_headbang.jpg) | ![間奏ソロ](docs/images/05_solo.jpg) |

## 特徴

- **音楽に合わせたタイムライン**：音声解析で 155 BPM、1 拍目の位置、キメ、歌い出しを測定。カットは小節線に、歌詞は実際に歌われた瞬間に出ます。
- **なめらかな 60fps**：アニメーションはすべて時間から計算しているので、60fps で書き出すと毎フレームが新しい絵になります。1080p30 と 4K60 に対応。
- **コミックパンク × RAS のサイバー感**：コミック風の縁取り文字、爆発フキダシ、斜めのトランジション、カットイン、HUD、リアルタイムのスペクトラム、グリッチ、バスドラムに合わせてペンライトを振る観客シルエット。
- **プログラムで描くエフェクト**：canvas によるコミック風花火（菊、柳、牡丹の輪、クロセット、点滅）、パーティクルの焚き火と火の粉。
- **再現できる AI 素材**：20 枚の画像のモデル、プロンプト全文、シード、サイズ、後処理を [docs/ASSETS.md](docs/ASSETS.md) に記録しています（説明は中国語、プロンプトは英語）。

## ディレクトリ構成

```
.
├── bonfire-mv/                 Remotion プロジェクト
│   ├── src/mv/
│   │   ├── BonfireMV.tsx       全体のタイムライン（47 カット）
│   │   ├── scenes.tsx          各シーン
│   │   ├── components/         歌詞レイヤー、花火、サイバー UI、立ち絵、文字
│   │   ├── timing.ts           BPM と小節の換算 B()/S()
│   │   ├── cuts.ts             カット位置とトランジション、ヘドバンパートのキメ
│   │   ├── lyrics.ts           歌詞のタイミングとレイアウト設定
│   │   └── data/
│   │       ├── audio.json          フレームごとのスペクトラムとキック（楽曲から解析）
│   │       └── lyrics.sample.json  歌詞テンプレート（本文は ○ に置き換え）
│   ├── public/images/          NovelAI で生成した 20 枚
│   └── scripts/analysis/       BPM、スペクトラム、歌い出しの解析スクリプト
├── source/novelai/
│   ├── requests/ requests_v2/  各画像の NovelAI リクエスト全文
│   └── scripts/                生成スクリプト、グリーンバック切り抜きスクリプト
├── tools/novelai/              NovelAI API のローカルツール（PowerShell）
└── docs/                       絵コンテ、素材とプロンプト、AI ツールの説明
```

## 実行方法

Node.js 20.19+ / 22.13+ / 24+ とインターネット接続（フォントを Google Fonts から読み込みます）が必要です。

1. **インストール**
   ```bash
   cd bonfire-mv
   npm install
   ```
2. **音源**：「灼熱 Bonfire!」の音源を正規に入手し、`bonfire-mv/public/RAISE A SUILEN - 灼熱 Bonfire!.flac` として保存してください（ファイル名は一致させてください）。ビートと歌詞のタイミングは 3:44.80 の音源で測定しています。別バージョンでは調整が必要な場合があります。
3. **歌詞**：`src/mv/data/lyrics.sample.json` を `src/mv/data/lyrics.json` にコピーし、○ をご自身で入手した歌詞に置き換えてください（`text`、`backing`、`layout.lines`、`hero[].text`）。
4. **プレビュー**
   ```bash
   npm run dev
   ```
5. **書き出し**
   ```bash
   # 1080p 30fps
   npx remotion render BonfireMV out/bonfire_1080p30.mp4
   # 4K 60fps
   npx remotion render BonfireMV-60fps out/bonfire_4k60.mp4 --scale=2 --jpeg-quality=95
   ```

## 画像の再生成

画像は NovelAI Diffusion Anime V4.5 Full で生成しました。ご自身の NovelAI アカウントと Persistent API Token が必要です。

1. [tools/novelai/README.md](tools/novelai/README.md) に従ってトークンを設定します（Windows DPAPI で暗号化してローカルに保存）。
2. `source/novelai/scripts/nai2.py` 冒頭の `ROOT` のパスを書き換えてから実行します。例：
   ```bash
   python source/novelai/scripts/nai2.py --style bold group_stage@1
   ```
3. 立ち絵はグリーンバックで生成し、`chroma.py` で切り抜きます：
   ```bash
   python source/novelai/scripts/chroma.py input.png bonfire-mv/public/images/member_lock.png preview.jpg
   ```

生成のたびに NovelAI の Anlas を消費します（本プロジェクトでは 1MP の画像 1 枚あたり約 11〜12 Anlas）。

## 使用したツールとモデル

| 用途 | ツール |
| --- | --- |
| 映像エンジン | Remotion 4.0.536、React 19、TypeScript |
| キャラクター・背景画像 | NovelAI Diffusion Anime V4.5 Full |
| 企画、絵コンテ、コード、音声解析、ドキュメント | Claude（Anthropic）、Claude Code を使用 |
| 音声解析 | Python、NumPy、Remotion 同梱の FFmpeg |
| 切り抜き | Python、Pillow |
| フォント | Dela Gothic One、Zen Kaku Gothic New、Anton、Share Tech Mono（いずれも SIL Open Font License） |

制作の流れと解析方法は [docs/AI_TOOLS.md](docs/AI_TOOLS.md)、カット設計は [docs/STORYBOARD.md](docs/STORYBOARD.md) をご覧ください（どちらも中国語）。

## ライセンス

- **コード**（`bonfire-mv/src`、`scripts`、`tools`、`source/novelai/scripts`）：MIT License（[LICENSE](LICENSE)）。
- **AI 生成画像とプロンプト**：非営利のファン創作と学習目的に限って公開しています。描かれたキャラクターの権利は権利者に帰属し、本プロジェクトはキャラクターに関するいかなる権利も付与しません。
- **Remotion** には独自のライセンスがあります（個人・小規模チームは無料）：<https://www.remotion.dev/license>
- **フォント** はそれぞれの SIL Open Font License に従います。

## クレジット

- 原曲：RAISE A SUILEN「灼熱 Bonfire!」
- 『BanG Dream!』プロジェクト
- 企画・チェック：Gokuraku
