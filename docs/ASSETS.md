# 圖片素材與提示詞

MV 用到的 20 張圖都是用 **NovelAI Diffusion Anime V4.5 Full**（`nai-diffusion-4-5-full`）生成的，放在 `bonfire-mv/public/images/`。
下面每一張都附上送給 NovelAI 的完整參數，可以直接重現。原始請求檔在 `source/novelai/requests_v2/`（`hands_dj` 在 `source/novelai/requests/`）。

> 角色屬於《BanG Dream!》企劃，這些圖是 AI 生成的二次創作，詳見 [DISCLAIMER.md](../DISCLAIMER.md)。

## 共通設定

| 項目 | 值 |
| --- | --- |
| 模型 | `nai-diffusion-4-5-full` |
| 取樣器 | `k_euler_ancestral`，noise schedule `karras` |
| 步數 | 23 |
| CFG（scale） | 5.5 |
| 尺寸 | 橫式 1344×768（16:9 附近）、立繪 832×1216 |
| 多人圖 | V4.5 角色提示詞（`char_captions`）＋位置座標 |
| 立繪 | 綠幕背景生成，再用 `source/novelai/scripts/chroma.py` 去背（NovelAI 不能直接輸出透明背景） |

## 總覽

![overview](images/overview.jpg)

| 檔名 | 用在哪裡 | 版本 | seed | 尺寸 | 後製 |
| --- | --- | --- | --- | --- | --- |
| `bg_beach_bonfire.png` | 標題、預副歌點火、Feed in | bg_beach_bonfire__bold | 1585473999 | 1344×768 | — |
| `bg_night_sky.png` | 所有煙火段 | bg_night_sky__bold | 430211194 | 1344×768 | — |
| `bg_stage_wide.png` | ダイブ、Party lighting | bg_stage_wide__bold | 1542156019 | 1344×768 | — |
| `bg_paradise.png` | 樂園段（0:43） | bg_paradise__bold | 1414399060 | 1344×768 | — |
| `bg_festival_street.png` | 主歌 2 祭典街道 | bg_festival_street__bold | 1345037381 | 1344×768 | — |
| `chu2_rap.png` | 開場 rap、2:35 | chu2_rap__bold@1 | 3957949752 | 1344×768 | — |
| `layer_sing.png` | 主歌 1、副歌 1 LAYER 特寫 | layer_sing__bold@3 | 3814017356 | 1344×768 | — |
| `group_stage.png` | 副歌合奏（6 次）、萬花筒 | group_stage__bold@1 | 2454763535 | 1344×768 | — |
| `group_back.png` | 未使用（終副歌改成程式繪製的五人舞台） | group_back__bold@1 | 1150589512 | 1344×768 | — |
| `pareo_chu2_festival.png` | 主歌 2 後半 | pareo_chu2_festival__bold@1 | 2370258766 | 1344×768 | — |
| `group_relax.png` | 結尾 | group_relax__bold2@10 | 2047998290 | 1344×768 | — |
| `hands_guitar.png` | 間奏 吉他 | hands_guitar__bold | 248126601 | 1344×768 | — |
| `hands_drums.png` | 間奏 鼓 | hands_drums__bold | 3104574321 | 1344×768 | — |
| `hands_keys.png` | 間奏 鍵盤 | hands_keys__bold | 1912987631 | 1344×768 | — |
| `hands_dj.png` | 間奏 DJ（第一版畫風） | hands_dj | 2805849227 | 1344×768 | — |
| `member_layer.png` | 成員卡、快切、切入、五人舞台 | member_layer__bold@3 | 2264577260 | 832×1216 | 綠幕去背 |
| `member_lock.png` | 同上 | member_lock__bold@1 | 2064103251 | 832×1216 | 綠幕去背 |
| `member_masking.png` | 同上 | member_masking__bold | 917123408 | 832×1216 | 綠幕去背 |
| `member_pareo.png` | 同上 | member_pareo__bold@1 | 1287212371 | 832×1216 | 綠幕去背 |
| `member_chu2.png` | 同上 | member_chu2__bold | 671411462 | 832×1216 | 綠幕去背 |

## 每張圖的完整參數

### bg_beach_bonfire

- 請求檔：`source/novelai/requests_v2/bg_beach_bonfire__bold.json`
- seed `1585473999`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, no humans, scenery, night, beach, sand, huge bonfire, tall flames, sparks, embers, starry sky, ocean, waves, horizon, firelight reflection on water, distant crowd silhouette, low angle, wide shot, bonfire in lower center, vast night sky, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border
```

### bg_night_sky

- 請求檔：`source/novelai/requests_v2/bg_night_sky__bold.json`
- seed `430211194`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, no humans, scenery, night sky, starry sky, calm sea, ocean, horizon, distant town lights on shoreline, reflection, dark, midnight, deep navy sky, dark purple gradient, dim lighting, wide shot, empty sky, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border, fireworks, clouds, moon, bright, daytime
```

### bg_stage_wide

- 請求檔：`source/novelai/requests_v2/bg_stage_wide__bold.json`
- seed `1542156019`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, scenery, night, outdoor stage, beach music festival, concert, stage lights, light beams, pink light, orange light, haze, pyrotechnics, stage fire, huge crowd, crowd silhouette, raised hands, glowstick, from behind audience, wide shot, tiny band on distant stage, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border
```

### bg_paradise

- 請求檔：`source/novelai/requests_v2/bg_paradise__bold.json`
- seed `1414399060`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, no humans, scenery, tropical island, paradise, dawn, sunrise, golden light, light rays, palm tree, hibiscus, glowing, sparkle, light particles, pillar of light, ethereal, fantasy, sea, wide shot, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border
```

### bg_festival_street

- 請求檔：`source/novelai/requests_v2/bg_festival_street__bold.json`
- seed `1345037381`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, no humans, scenery, japanese summer festival, night, street, food stall, yatai, paper lantern, red lantern, string lights, steam, one-point perspective, bokeh, warm lighting, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border, kanji, writing, sign text
```

### chu2_rap

- 請求檔：`source/novelai/requests_v2/chu2_rap__bold@1.json`
- seed `3957949752`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, 1girl, solo, tamade chiyu, petite, long hair, pink hair, ahoge, aqua eyes, cat ear headphones, oversized black jacket with flame print, off shoulder, black crop top, black shorts, thigh strap, glowing orange headphones, dj, turntable, dj booth, pointing at viewer, grin, leaning forward, foreshortening, neon lights, led screen, upper body, centered, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border
```

### layer_sing

- 請求檔：`source/novelai/requests_v2/layer_sing__bold@3.json`
- seed `3814017356`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, 1girl, solo, wakana rei, long hair, dark brown hair, parted bangs, forehead, purple eyes, freckles, youthful face, round face, large eyes, small chin, black cropped jacket with flame orange trim, open jacket, black sports bra, midriff, gold chain necklace, black choker, high-waist black flared pants, belt chain, black mini top hat with orange ribbon, star earrings, upper body, close-up, singing, holding microphone, eyes half-closed, sweat, firelight from below, embers, depth of field, face on right side of frame, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border, long face, long chin, narrow face, mature female
```

### group_stage

- 請求檔：`source/novelai/requests_v2/group_stage__bold@1.json`
- seed `2454763535`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, 5girls, multiple girls, rock band, concert, live performance, outdoor beach stage, night, music festival, stage lights, light beams, pyrotechnics, fire pillars, sparks, 1.2::from below, dutch angle, dynamic pose, jumping, motion lines, energetic::, wide shot, masterpiece, best quality, very aesthetic, absurdres, no text
```

**角色提示詞（char_captions，依序對應位置）**

| # | 位置 (x, y) | 提示詞 |
| --- | --- | --- |
| 1 | 0.1, 0.5 | girl, asahi rokka, long hair, grey-blue hair, green eyes, hairclip, black crop top, sheer orange cropped jacket, black pleated miniskirt with orange trim, single fishnet thighhigh, thigh strap, fingerless gloves, chain necklace, star hair ornament, platform boots, blue electric guitar, playing guitar, open mouth |
| 2 | 0.3, 0.3 | girl, satou masuki, short hair, blonde hair, yellow eyes, forehead, sharp eyes, black sleeveless crop top, cleavage cutout, open short-sleeved shirt with flame print, black shorts, studded belt, wristbands, fingerless gloves, combat boots, drummer, sitting at drum set, hitting drums, drumsticks |
| 3 | 0.5, 0.5 | girl, wakana rei, long hair, dark brown hair, parted bangs, forehead, purple eyes, freckles, mature, black cropped jacket with flame orange trim, open jacket, black sports bra, midriff, gold chain necklace, black choker, high-waist black flared pants, belt chain, black mini top hat with orange ribbon, star earrings, red electric bass guitar, singing, microphone stand, playing bass guitar |
| 4 | 0.7, 0.5 | girl, nyubara reona, very long hair, twintails, two-tone hair, pink hair, light blue hair, streaked hair, blunt bangs, red eyes, black frilled crop top, orange polka dot puffy sleeves, orange ribbon, black tiered miniskirt, black mini top hat, star hair ornament, thigh strap, platform shoes, playing keyboard, smile |
| 5 | 0.9, 0.5 | girl, tamade chiyu, petite, long hair, pink hair, ahoge, aqua eyes, cat ear headphones, oversized black jacket with flame print, off shoulder, black crop top, black shorts, thigh strap, glowing orange headphones, dj, turntable, arm up |

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border
```

### group_back

- 請求檔：`source/novelai/requests_v2/group_back__bold@1.json`
- seed `1150589512`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, 5girls, multiple girls, from behind, back view, standing on stage edge, facing huge crowd, glowstick, sea of lights, night, giant bonfire in the distance, backlighting, rim light, open night sky, wide shot, masterpiece, best quality, very aesthetic, absurdres, no text
```

**角色提示詞（char_captions，依序對應位置）**

| # | 位置 (x, y) | 提示詞 |
| --- | --- | --- |
| 1 | 0.1, 0.7 | girl, asahi rokka, long hair, grey-blue hair, green eyes, hairclip, black crop top, sheer orange cropped jacket, black pleated miniskirt with orange trim, single fishnet thighhigh, thigh strap, fingerless gloves, chain necklace, star hair ornament, platform boots, blue electric guitar, from behind |
| 2 | 0.3, 0.7 | girl, satou masuki, short hair, blonde hair, yellow eyes, forehead, sharp eyes, black sleeveless crop top, cleavage cutout, open short-sleeved shirt with flame print, black shorts, studded belt, wristbands, fingerless gloves, combat boots, drumsticks, from behind |
| 3 | 0.5, 0.7 | girl, wakana rei, long hair, dark brown hair, parted bangs, forehead, purple eyes, freckles, mature, black cropped jacket with flame orange trim, open jacket, black sports bra, midriff, gold chain necklace, black choker, high-waist black flared pants, belt chain, black mini top hat with orange ribbon, star earrings, red electric bass guitar, from behind |
| 4 | 0.7, 0.7 | girl, nyubara reona, very long hair, twintails, two-tone hair, pink hair, light blue hair, streaked hair, blunt bangs, red eyes, black frilled crop top, orange polka dot puffy sleeves, orange ribbon, black tiered miniskirt, black mini top hat, star hair ornament, thigh strap, platform shoes, from behind |
| 5 | 0.9, 0.7 | girl, tamade chiyu, petite, long hair, pink hair, ahoge, aqua eyes, cat ear headphones, oversized black jacket with flame print, off shoulder, black crop top, black shorts, thigh strap, glowing orange headphones, from behind |

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border
```

### pareo_chu2_festival

- 請求檔：`source/novelai/requests_v2/pareo_chu2_festival__bold@1.json`
- seed `2370258766`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, 2girls, japanese summer festival, night, food stall, paper lantern, warm lighting, bokeh, takoyaki, feeding, eating, happy, comedic, masterpiece, best quality, very aesthetic, absurdres, no text
```

**角色提示詞（char_captions，依序對應位置）**

| # | 位置 (x, y) | 提示詞 |
| --- | --- | --- |
| 1 | 0.5, 0.5 | girl, nyubara reona, very long hair, twintails, two-tone hair, pink hair, light blue hair, streaked hair, blunt bangs, red eyes, yukata, orange yukata with flame pattern, holding takoyaki, offering food, open mouth smile |
| 2 | 0.8, 0.5 | girl, tamade chiyu, petite, long hair, pink hair, ahoge, aqua eyes, cat ear headphones, black yukata, headphones around neck, cheek bulge, eating, blush, looking away |

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border, kanji, writing, sign text
```

### group_relax

- 請求檔：`source/novelai/requests_v2/group_relax__bold2@10.json`
- seed `2047998290`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.5::bold lineart, thick outlines, flat color, high contrast, sharp shadows::, 1.2::cel shading, vivid colors::, dynamic composition, anime key visual, 5girls, multiple girls, sitting around campfire, beach, night, starry sky, relaxed, smile, sparks, warm lighting, medium shot, after concert, peaceful, masterpiece, best quality, very aesthetic, absurdres, no text
```

**角色提示詞（char_captions，依序對應位置）**

| # | 位置 (x, y) | 提示詞 |
| --- | --- | --- |
| 1 | 0.1, 0.6 | girl, asahi rokka, long hair, grey-blue hair, green eyes, hairclip, black crop top, sheer orange cropped jacket, black pleated miniskirt with orange trim, single fishnet thighhigh, thigh strap, fingerless gloves, chain necklace, star hair ornament, platform boots, sitting, smile |
| 2 | 0.3, 0.6 | girl, satou masuki, short hair, blonde hair, yellow eyes, forehead, sharp eyes, black sleeveless crop top, cleavage cutout, open short-sleeved shirt with flame print, black shorts, studded belt, wristbands, fingerless gloves, combat boots, sitting, laughing |
| 3 | 0.5, 0.6 | girl, wakana rei, long hair, dark brown hair, parted bangs, forehead, purple eyes, freckles, youthful face, round face, large eyes, small chin, black cropped jacket with flame orange trim, open jacket, black sports bra, midriff, gold chain necklace, black choker, high-waist black flared pants, belt chain, black mini top hat with orange ribbon, star earrings, sitting, holding cup, gentle smile |
| 4 | 0.7, 0.6 | girl, nyubara reona, very long hair, twintails, two-tone hair, pink hair, light blue hair, streaked hair, blunt bangs, red eyes, black frilled crop top, orange polka dot puffy sleeves, orange ribbon, black tiered miniskirt, black mini top hat, star hair ornament, thigh strap, platform shoes, sitting, smile |
| 5 | 0.9, 0.6 | girl, tamade chiyu, petite, long hair, pink hair, ahoge, aqua eyes, cat ear headphones, oversized black jacket with flame print, off shoulder, black crop top, black shorts, thigh strap, glowing orange headphones, sitting, sleepy, half-closed eyes |

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border
```

### hands_guitar

- 請求檔：`source/novelai/requests_v2/hands_guitar__bold.json`
- seed `248126601`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, 1girl, head out of frame, close-up, hands, playing guitar, blue electric guitar, fretboard, guitar pick, fingerless gloves, motion blur, sparks, orange stage light, sweat, dynamic angle, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border, face, eyes
```

### hands_drums

- 請求檔：`source/novelai/requests_v2/hands_drums__bold.json`
- seed `3104574321`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, 1girl, head out of frame, close-up, drumsticks, hitting cymbal, snare drum, drum set, motion blur, light flare, amber stage light, sparks, impact, dynamic angle, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border, face, eyes
```

### hands_keys

- 請求檔：`source/novelai/requests_v2/hands_keys__bold.json`
- seed `1912987631`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, 1girl, head out of frame, close-up, hands, playing keyboard instrument, synthesizer, glowing keys, pink light, orange light, sparkle, dynamic angle, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border, face, eyes
```

### hands_dj

- 請求檔：`source/novelai/requests/hands_dj.json`
- seed `2805849227`，1344×768，steps 23，scale 5.5

**Prompt**

```text
1girl, head out of frame, close-up, hand, dj, scratching vinyl record, turntable, mixer, crossfader, cyan light, pink led lights, motion blur, sparks, masterpiece, best quality, very aesthetic, absurdres, anime coloring, cel shading, vibrant colors, cinematic lighting, detailed background, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, face, eyes
```

### member_layer

- 請求檔：`source/novelai/requests_v2/member_layer__bold@3.json`
- seed `2264577260`，832×1216，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, 1girl, solo, full body, standing, looking at viewer, simple background, green background, chroma key, solid green background, no shadow, wakana rei, long hair, dark brown hair, parted bangs, forehead, purple eyes, freckles, youthful face, round face, large eyes, small chin, black cropped jacket with flame orange trim, open jacket, black sports bra, midriff, gold chain necklace, black choker, high-waist black flared pants, belt chain, black mini top hat with orange ribbon, star earrings, red electric bass guitar, holding bass guitar, playing guitar, confident smile, hair blowing in wind, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border, background scenery, cropped feet, cropped head, green clothes, green hair, long face, long chin, narrow face, mature female
```

### member_lock

- 請求檔：`source/novelai/requests_v2/member_lock__bold@1.json`
- seed `2064103251`，832×1216，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, 1girl, solo, full body, standing, looking at viewer, simple background, green background, chroma key, solid green background, no shadow, asahi rokka, long hair, grey-blue hair, green eyes, hairclip, black crop top, sheer orange cropped jacket, black pleated miniskirt with orange trim, single fishnet thighhigh, thigh strap, fingerless gloves, chain necklace, star hair ornament, platform boots, blue electric guitar, playing guitar, determined expression, leaning forward, dynamic pose, open mouth, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border, background scenery, cropped feet, cropped head, green clothes, green hair
```

### member_masking

- 請求檔：`source/novelai/requests_v2/member_masking__bold.json`
- seed `917123408`，832×1216，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, 1girl, solo, full body, standing, looking at viewer, simple background, green background, chroma key, solid green background, no shadow, satou masuki, short hair, blonde hair, yellow eyes, forehead, sharp eyes, black sleeveless crop top, cleavage cutout, open short-sleeved shirt with flame print, black shorts, studded belt, wristbands, fingerless gloves, combat boots, drumsticks, pointing drumstick at viewer, grin, hand on hip, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border, background scenery, cropped feet, cropped head, green clothes, green hair
```

### member_pareo

- 請求檔：`source/novelai/requests_v2/member_pareo__bold@1.json`
- seed `1287212371`，832×1216，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, 1girl, solo, full body, standing, looking at viewer, simple background, green background, chroma key, solid green background, no shadow, nyubara reona, very long hair, twintails, two-tone hair, pink hair, light blue hair, streaked hair, blunt bangs, red eyes, black frilled crop top, orange polka dot puffy sleeves, orange ribbon, black tiered miniskirt, black mini top hat, star hair ornament, thigh strap, platform shoes, keytar, holding keytar, peace sign, open mouth smile, cheerful, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border, background scenery, cropped feet, cropped head, green clothes, green hair
```

### member_chu2

- 請求檔：`source/novelai/requests_v2/member_chu2__bold.json`
- seed `671411462`，832×1216，steps 23，scale 5.5

**Prompt**

```text
1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual, 1girl, solo, full body, standing, looking at viewer, simple background, green background, chroma key, solid green background, no shadow, tamade chiyu, petite, long hair, pink hair, ahoge, aqua eyes, cat ear headphones, oversized black jacket with flame print, off shoulder, black crop top, black shorts, thigh strap, glowing orange headphones, hands on hips, smug grin, confident, one foot forward, masterpiece, best quality, very aesthetic, absurdres, no text
```

**Negative prompt**

```text
lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, 3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border, background scenery, cropped feet, cropped head, green clothes, green hair
```

