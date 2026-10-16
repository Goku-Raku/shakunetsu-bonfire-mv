"""NovelAI V4.5 generator for the Bonfire MV (v2: MV outfit + selectable style + green-screen cutouts).
usage:
  python nai2.py [--style NAME] [--out DIR] <asset_id>[@seedOffset] ...
  python nai2.py list
"""
import json, subprocess, sys, shutil, zlib, argparse
from pathlib import Path

ROOT = Path(r"F:\ai影片\灼熱bonfire mv")
REQ_DIR = ROOT / "source" / "novelai" / "requests_v2"
TOOL = ROOT / "tools" / "novelai" / "NovelAI.ps1"

STYLES = {
    "bold": "1.3::bold lineart, thick outlines, high contrast, sharp shadows, cel shading::, vivid colors, dynamic composition, anime key visual",
    "official": "anime coloring, cel shading, vibrant colors, cinematic lighting",
    "graphic": "1.4::flat color, bold lineart, thick outlines, high contrast, limited palette::, 1.2::neon pink and flame orange, geometric flames, graphic design, dynamic composition::",
    "manga": "1.3::manga::, monochrome, greyscale, spot color, orange spot color, screentones, halftone, ink, bold lineart, speed lines, dynamic angle",
    "retro": "1990s (style), retro artstyle, cel animation, film grain, city pop, warm sunset colors, soft glow",
    "punk": "poster, graffiti, paint splatter, sticker, punk, grunge, bold shapes, halftone, risograph, neon orange and hot pink",
}
QUALITY = "masterpiece, best quality, very aesthetic, absurdres, no text"
NEG = ("lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, "
       "artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, "
       "3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry, copyright notice, copyright name, artist name, card (medium), border")

# 認人用的特徵（對照官方立繪），不含服裝
ID = {
    "layer": "wakana rei, long hair, dark brown hair, parted bangs, forehead, purple eyes, freckles, youthful face, round face, large eyes, small chin",
    "lock": "asahi rokka, long hair, grey-blue hair, green eyes, hairclip",
    "masking": "satou masuki, short hair, blonde hair, yellow eyes, forehead, sharp eyes",
    "pareo": "nyubara reona, very long hair, twintails, two-tone hair, pink hair, light blue hair, streaked hair, blunt bangs, red eyes",
    "chu2": "tamade chiyu, petite, long hair, pink hair, ahoge, aqua eyes, cat ear headphones",
}
# MV 專用「Bonfire」舞台裝：RAS 一貫的黑色龐克底（皮帶、鍊條、頸圈）＋ 夏季活動裝的迷你禮帽與星星 ＋ 營火的橘紅金
OUTFIT = {
    "layer": "black cropped jacket with flame orange trim, open jacket, black sports bra, midriff, gold chain necklace, black choker, high-waist black flared pants, belt chain, black mini top hat with orange ribbon, star earrings",
    "lock": "black crop top, sheer orange cropped jacket, black pleated miniskirt with orange trim, single fishnet thighhigh, thigh strap, fingerless gloves, chain necklace, star hair ornament, platform boots",
    "masking": "black sleeveless crop top, cleavage cutout, open short-sleeved shirt with flame print, black shorts, studded belt, wristbands, fingerless gloves, combat boots",
    "pareo": "black frilled crop top, orange polka dot puffy sleeves, orange ribbon, black tiered miniskirt, black mini top hat, star hair ornament, thigh strap, platform shoes",
    "chu2": "oversized black jacket with flame print, off shoulder, black crop top, black shorts, thigh strap, glowing orange headphones",
}
INSTR = {"layer": "red electric bass guitar", "lock": "blue electric guitar", "masking": "drumsticks", "pareo": "keytar", "chu2": ""}


def who(k, extra="", instrument=True, girl=True):
    parts = (["girl"] if girl else []) + [ID[k], OUTFIT[k]]
    if instrument and INSTR[k]:
        parts.append(INSTR[k])
    if extra:
        parts.append(extra)
    return ", ".join(parts)


W, H = 1344, 768
PW, PH = 832, 1216
GREEN = "simple background, green background, chroma key, solid green background, no shadow"

A = {}
def add(id_, prompt, chars=(), neg="", w=W, h=H, cut=False):
    A[id_] = dict(prompt=prompt, chars=list(chars), neg=neg, w=w, h=h, cut=cut)

add("bg_beach_bonfire", "no humans, scenery, night, beach, sand, huge bonfire, tall flames, sparks, embers, starry sky, ocean, waves, horizon, firelight reflection on water, distant crowd silhouette, low angle, wide shot, bonfire in lower center, vast night sky")
add("bg_night_sky", "no humans, scenery, night sky, starry sky, calm sea, ocean, horizon, distant town lights on shoreline, reflection, dark, midnight, deep navy sky, dark purple gradient, dim lighting, wide shot, empty sky", neg="fireworks, clouds, moon, bright, daytime")
add("bg_stage_wide", "scenery, night, outdoor stage, beach music festival, concert, stage lights, light beams, pink light, orange light, haze, pyrotechnics, stage fire, huge crowd, crowd silhouette, raised hands, glowstick, from behind audience, wide shot, tiny band on distant stage")
add("bg_paradise", "no humans, scenery, tropical island, paradise, dawn, sunrise, golden light, light rays, palm tree, hibiscus, glowing, sparkle, light particles, pillar of light, ethereal, fantasy, sea, wide shot")
add("bg_festival_street", "no humans, scenery, japanese summer festival, night, street, food stall, yatai, paper lantern, red lantern, string lights, steam, one-point perspective, bokeh, warm lighting", neg="kanji, writing, sign text")

for k, pose in {
    "layer": "holding bass guitar, playing guitar, confident smile, hair blowing in wind",
    "lock": "playing guitar, determined expression, leaning forward, dynamic pose, open mouth",
    "masking": "pointing drumstick at viewer, grin, hand on hip",
    "pareo": "holding keytar, peace sign, open mouth smile, cheerful",
    "chu2": "hands on hips, smug grin, confident, one foot forward",
}.items():
    add(f"member_{k}", f"1girl, solo, full body, standing, looking at viewer, {GREEN}, {who(k, pose, girl=False)}",
        neg="background scenery, cropped feet, cropped head, green clothes, green hair" + (", long face, long chin, narrow face, mature female" if k == "layer" else ""), w=PW, h=PH, cut=True)

add("group_stage",
    "5girls, multiple girls, rock band, concert, live performance, outdoor beach stage, night, music festival, stage lights, light beams, pyrotechnics, fire pillars, sparks, 1.2::from below, dutch angle, dynamic pose, jumping, motion lines, energetic::, wide shot",
    [(who("lock", "playing guitar, open mouth"), 0.1, 0.5),
     (who("masking", "drummer, sitting at drum set, hitting drums", instrument=False) + ", drumsticks", 0.3, 0.3),
     (who("layer", "singing, microphone stand, playing bass guitar"), 0.5, 0.5),
     (who("pareo", "playing keyboard, smile", instrument=False), 0.7, 0.5),
     (who("chu2", "dj, turntable, arm up"), 0.9, 0.5)])
add("layer_sing", neg="long face, long chin, narrow face, mature female", prompt=f"1girl, solo, {who('layer', 'upper body, close-up, singing, holding microphone, eyes half-closed, sweat, firelight from below, embers, depth of field, face on right side of frame', instrument=False, girl=False)}")
add("chu2_rap", f"1girl, solo, {who('chu2', 'dj, turntable, dj booth, pointing at viewer, grin, leaning forward, foreshortening, neon lights, led screen, upper body, centered', girl=False)}")
add("group_back",
    "5girls, multiple girls, from behind, back view, standing on stage edge, facing huge crowd, glowstick, sea of lights, night, giant bonfire in the distance, backlighting, rim light, open night sky, wide shot",
    [(who("lock", "from behind"), 0.1, 0.7), (who("masking", "from behind"), 0.3, 0.7), (who("layer", "from behind"), 0.5, 0.7),
     (who("pareo", "from behind", instrument=False), 0.7, 0.7), (who("chu2", "from behind"), 0.9, 0.7)])
add("pareo_chu2_festival",
    "2girls, japanese summer festival, night, food stall, paper lantern, warm lighting, bokeh, takoyaki, feeding, eating, happy, comedic",
    [("girl, " + ID["pareo"] + ", yukata, orange yukata with flame pattern, holding takoyaki, offering food, open mouth smile", 0.5, 0.5),
     ("girl, " + ID["chu2"] + ", black yukata, headphones around neck, cheek bulge, eating, blush, looking away", 0.8, 0.5)],
    neg="kanji, writing, sign text")
add("group_relax",
    "5girls, multiple girls, sitting around campfire, beach, night, starry sky, relaxed, smile, sparks, warm lighting, medium shot, after concert, peaceful",
    [(who("lock", "sitting, smile", instrument=False), 0.1, 0.6), (who("masking", "sitting, laughing", instrument=False), 0.3, 0.6),
     (who("layer", "sitting, holding cup, gentle smile", instrument=False), 0.5, 0.6), (who("pareo", "sitting, smile", instrument=False), 0.7, 0.6),
     (who("chu2", "sitting, sleepy, half-closed eyes", instrument=False), 0.9, 0.6)])
for id_, p in {
    "hands_guitar": "close-up, hands, playing guitar, blue electric guitar, fretboard, guitar pick, fingerless gloves, motion blur, sparks, orange stage light, sweat",
    "hands_drums": "close-up, drumsticks, hitting cymbal, snare drum, drum set, motion blur, light flare, amber stage light, sparks, impact",
    "hands_keys": "close-up, hands, playing keyboard instrument, synthesizer, glowing keys, pink light, orange light, sparkle",
    "hands_dj": "close-up, hand, dj, scratching vinyl record, turntable, mixer, crossfader, orange led lights, pink led lights, motion blur, sparks",
}.items():
    add(id_, f"1girl, head out of frame, {p}, dynamic angle", neg="face, eyes")


def seed(name):
    return zlib.crc32(name.encode()) % 4000000000


def build(id_, style, off):
    a = A[id_]
    prompt = f"{STYLES[style]}, {a['prompt']}, {QUALITY}"
    neg = NEG + (", " + a["neg"] if a["neg"] else "")
    chars = [{"char_caption": c, "centers": [{"x": x, "y": y}]} for c, x, y in a["chars"]]
    return {
        "input": prompt, "model": "nai-diffusion-4-5-full", "action": "generate",
        "parameters": {
            "params_version": 4, "width": a["w"], "height": a["h"],
            "scale": 5.5, "sampler": "k_euler_ancestral", "steps": 23, "n_samples": 1,
            "seed": seed(id_) + off, "ucPreset": 0, "qualityToggle": False,
            "sm": False, "sm_dyn": False, "dynamic_thresholding": False,
            "legacy": False, "legacy_v3_extend": False, "cfg_rescale": 0, "noise_schedule": "karras",
            "negative_prompt": neg,
            "v4_prompt": {"caption": {"base_caption": prompt, "char_captions": chars}, "use_coords": bool(chars), "use_order": True},
            "v4_negative_prompt": {"caption": {"base_caption": neg, "char_captions": [{"char_caption": "", "centers": c["centers"]} for c in chars]}, "legacy_uc": False},
        },
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--style", default="official")
    ap.add_argument("--out", default=str(ROOT / "source" / "novelai" / "picked_v2"))
    ap.add_argument("ids", nargs="+")
    a = ap.parse_args()
    if a.ids == ["list"]:
        print("\n".join(A)); return
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True); REQ_DIR.mkdir(parents=True, exist_ok=True)
    for arg in a.ids:
        id_, _, off = arg.partition("@"); off = int(off or 0)
        name = f"{id_}__{a.style}" + (f"@{off}" if off else "")
        req = REQ_DIR / f"{name}.json"
        req.write_text(json.dumps(build(id_, a.style, off), ensure_ascii=False, indent=2), encoding="utf-8")
        r = subprocess.run(["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(TOOL),
                            "-Action", "Generate", "-RequestFile", str(req), "-Execute"],
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
        if r.returncode != 0:
            print("FAIL", name, r.stderr.strip()[:300]); continue
        res = json.loads(r.stdout)
        shutil.copyfile(res["image_path"], out / f"{name}.png")
        print("OK", name)


if __name__ == "__main__":
    main()
