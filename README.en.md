# Shakunetsu Bonfire! — Unofficial RAISE A SUILEN Music Video (Remotion)

[繁體中文](README.md) ｜ **English** ｜ [日本語](README.ja.md)

A fan-made music video for RAISE A SUILEN's "灼熱 Bonfire!" (Shakunetsu Bonfire!), built entirely in code with [Remotion](https://www.remotion.dev/) (React). Shots, transitions, fireworks, the bonfire, lyric typography and the cyber-style HUD are all driven by the song's measured beats and vocal timing. Character artwork was generated with NovelAI.

> ⚠️ This is an **unofficial, non-commercial** fan work. This repository does **not** include the song audio, the official lyrics or any official character art. Please read the [Disclaimer](DISCLAIMER.md) first.

![Title](docs/images/02_title.jpg)

| | |
| --- | --- |
| ![Boot](docs/images/01_boot.jpg) | ![Member card](docs/images/03_member_card.jpg) |
| ![Headbang section](docs/images/04_headbang.jpg) | ![Instrument solo](docs/images/05_solo.jpg) |

## Highlights

- **Music-driven timeline**: audio analysis measured 155 BPM, the first downbeat, the heavy hits and vocal onsets. Cuts land on bar lines and lyrics appear when they are actually sung.
- **Smooth 60 fps**: every animation is computed from time, so a 60 fps render produces a genuinely new image on every frame. Render at 1080p30 or 4K60.
- **Comic punk × RAS cyber style**: inked comic lettering, explosion balloons, slash transitions, cut-ins, HUD, live spectrum, glitches, and a penlight-waving crowd silhouette that moves with the kick drum.
- **Procedural effects**: canvas comic-style fireworks (chrysanthemum, willow, ring, crossette, strobe), a particle bonfire and embers.
- **Reproducible AI assets**: model, full prompts, seeds, sizes and post-processing for all 20 images are documented in [docs/ASSETS.md](docs/ASSETS.md) (in Chinese; prompts are in English).

## Repository layout

```
.
├── bonfire-mv/                 Remotion project
│   ├── src/mv/
│   │   ├── BonfireMV.tsx       Full timeline (47 shots)
│   │   ├── scenes.tsx          Scenes
│   │   ├── components/         Lyric layer, fireworks, cyber UI, portraits, lettering
│   │   ├── timing.ts           BPM and bar helpers B()/S()
│   │   ├── cuts.ts             Cut points, transitions, heavy-section hits
│   │   ├── lyrics.ts           Lyric timing and layout settings
│   │   └── data/
│   │       ├── audio.json          Per-frame spectrum and kick envelope (analysed from the song)
│   │       └── lyrics.sample.json  Lyric template (text replaced with ○)
│   ├── public/images/          The 20 NovelAI images
│   └── scripts/analysis/       BPM, spectrum and vocal-onset analysis scripts
├── source/novelai/
│   ├── requests/ requests_v2/  Full NovelAI request for every image
│   └── scripts/                Generation and green-screen keying scripts
├── tools/novelai/              Local NovelAI API tool (PowerShell)
└── docs/                       Storyboard, assets & prompts, AI tools
```

## Running it

Requires Node.js 20.19+ / 22.13+ / 24+ and an internet connection (fonts load from Google Fonts).

1. **Install**
   ```bash
   cd bonfire-mv
   npm install
   ```
2. **Audio**: obtain the song legally and save it as `bonfire-mv/public/RAISE A SUILEN - 灼熱 Bonfire!.flac` (the file name must match). Beat and lyric timings were measured on a 3:44.80 version; other versions may need retiming.
3. **Lyrics**: copy `src/mv/data/lyrics.sample.json` to `src/mv/data/lyrics.json` and replace every ○ with lyrics you obtained yourself (`text`, `backing`, `layout.lines`, `hero[].text`).
4. **Preview**
   ```bash
   npm run dev
   ```
5. **Render**
   ```bash
   # 1080p 30fps
   npx remotion render BonfireMV out/bonfire_1080p30.mp4
   # 4K 60fps
   npx remotion render BonfireMV-60fps out/bonfire_4k60.mp4 --scale=2 --jpeg-quality=95
   ```

## Regenerating the images

Images were generated with NovelAI Diffusion Anime V4.5 Full. You need your own NovelAI account and Persistent API Token.

1. Set up the token following [tools/novelai/README.md](tools/novelai/README.md) (stored locally, encrypted with Windows DPAPI).
2. Edit the `ROOT` path at the top of `source/novelai/scripts/nai2.py`, then run for example:
   ```bash
   python source/novelai/scripts/nai2.py --style bold group_stage@1
   ```
3. Portraits are generated on a green screen and keyed with `chroma.py`:
   ```bash
   python source/novelai/scripts/chroma.py input.png bonfire-mv/public/images/member_lock.png preview.jpg
   ```

Each generation costs NovelAI Anlas (about 11–12 Anlas per 1-megapixel image in this project).

## Tools and models

| Purpose | Tool |
| --- | --- |
| Video engine | Remotion 4.0.536, React 19, TypeScript |
| Character and scene images | NovelAI Diffusion Anime V4.5 Full |
| Planning, storyboard, code, audio analysis, docs | Claude (Anthropic), via Claude Code |
| Audio analysis | Python, NumPy, Remotion's bundled FFmpeg |
| Background removal | Python, Pillow |
| Fonts | Dela Gothic One, Zen Kaku Gothic New, Anton, Share Tech Mono (all SIL Open Font License) |

See [docs/AI_TOOLS.md](docs/AI_TOOLS.md) for the production workflow and analysis methods, and [docs/STORYBOARD.md](docs/STORYBOARD.md) for the shot design (both in Chinese).

## License

- **Code** (`bonfire-mv/src`, `scripts`, `tools`, `source/novelai/scripts`): MIT License, see [LICENSE](LICENSE).
- **AI-generated images and prompts**: shared for non-commercial fan creation and learning only. Rights to the depicted characters belong to their owners; this project grants no rights to the characters.
- **Remotion** has its own license (free for individuals and small teams): <https://www.remotion.dev/license>.
- **Fonts** are under their respective SIL Open Font Licenses.

## Credits

- Original song: RAISE A SUILEN, "灼熱 Bonfire!"
- The BanG Dream! project
- Direction and review: Gokuraku
