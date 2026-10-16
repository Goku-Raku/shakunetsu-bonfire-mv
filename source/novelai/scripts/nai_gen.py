"""Build NovelAI V4.5 requests for the MV assets and run the user's NovelAI.ps1 tool.
usage: python nai_gen.py <asset_id> [<asset_id> ...]   (use 'list' to print ids, 'dry' prefix to only write requests)
"""
import json, subprocess, sys, shutil, zlib
from pathlib import Path

ROOT = Path(r"F:\ai影片\灼熱bonfire mv")
REQ_DIR = ROOT / "source" / "novelai" / "requests"
PICK_DIR = ROOT / "source" / "novelai" / "picked"
TOOL = ROOT / "tools" / "novelai" / "NovelAI.ps1"

QUALITY = "masterpiece, best quality, very aesthetic, absurdres, anime coloring, cel shading, vibrant colors, cinematic lighting, detailed background, no text"
NEG = ("lowres, worst quality, bad quality, displeasing, very displeasing, jpeg artifacts, scan artifacts, chromatic aberration, "
       "artistic error, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra arms, extra legs, "
       "3d, realistic, photorealistic, render, cgi, text, english text, japanese text, logo, signature, watermark, username, multiple views, blurry")

C = {
    "layer": "girl, wakana rei, bang dream!, long hair, dark brown hair, parted bangs, forehead, purple eyes, freckles, black choker, black crop top, see-through sleeves, purple straps, black cargo pants, red electric bass guitar",
    "lock": "girl, asahi rokka, bang dream!, long hair, grey-blue hair, green eyes, hairclip, black choker, chain necklace, black vest, black crop top, fingerless gloves, black shorts, fishnet thighhighs, blue electric guitar",
    "masking": "girl, satou masuki, bang dream!, short hair, blonde hair, yellow eyes, forehead, sharp eyes, black shirt, cropped shirt, cleavage cutout, midriff, fingerless gloves, black pants, see-through skirt, drumsticks",
    "pareo": "girl, nyubara reona, bang dream!, very long hair, twintails, multicolored hair, pink hair, aqua hair, streaked hair, blunt bangs, red eyes, black leather vest, red shirt, midriff, fingerless gloves",
    "chu2": "girl, tamade chiyu, bang dream!, petite, long hair, pink hair, ahoge, aqua eyes, cat ear headphones, black headphones, black choker, purple off-shoulder shirt, black crop top, black shorts, thigh strap",
}
# 1girl 版本（單人圖寫在主提示詞裡）
def solo(k):
    return C[k].replace("girl, ", "", 1)

W, H = 1344, 768  # 16:9 附近
PW, PH = 832, 1216  # 直式立繪

def seed(name):
    return zlib.crc32(name.encode()) % 4294967295

A = {}
def bg(id_, prompt, extra_neg=""):
    A[id_] = dict(w=W, h=H, prompt=prompt, neg=extra_neg, chars=[])

bg("bg_beach_bonfire", "no humans, scenery, night, beach, sand, huge bonfire, tall flames, sparks, embers, starry sky, ocean, waves, horizon, firelight reflection on water, distant crowd silhouette, low angle, wide shot, bonfire in lower center, vast night sky")
bg("bg_night_sky", "no humans, scenery, night sky, starry sky, calm sea, ocean, horizon, distant town lights on shoreline, reflection, dark, midnight, deep navy sky, dark purple gradient, dim lighting, muted colors, wide shot, empty sky, calm", "fireworks, clouds, moon, bright, saturated, daytime")
bg("bg_stage_wide", "scenery, night, outdoor stage, music festival, concert, stage lights, spotlight, light beams, pink light, cyan light, haze, pyrotechnics, stage fire, huge crowd, crowd silhouette, raised hands, glowstick, from behind audience, wide shot, tiny band on distant stage")
bg("bg_paradise", "no humans, scenery, tropical island, paradise, dawn, sunrise, golden light, light rays, palm tree, hibiscus, flowers, glowing, sparkle, light particles, pillar of light, ethereal, fantasy, sea, wide shot, gold and coral sky")
bg("bg_festival_street", "no humans, scenery, japanese summer festival, night, street, food stall, yatai, paper lantern, red lantern, string lights, steam, smoke, one-point perspective, bokeh, warm lighting, crowded street atmosphere", "kanji, writing, sign text")

def member(id_, key, pose):
    A[id_] = dict(w=PW, h=PH, prompt=f"1girl, solo, full body, standing, looking at viewer, simple background, white background, {solo(key)}, {pose}", neg="background scenery, cropped feet, cropped head", chars=[])

member("member_layer", "layer", "holding bass guitar, playing guitar, confident smile, hair blowing in wind")
member("member_lock", "lock", "playing guitar, determined expression, leaning forward, dynamic pose, open mouth")
member("member_masking", "masking", "holding drumsticks, pointing drumstick at viewer, grin, hand on hip")
member("member_pareo", "pareo", "small black hat, holding keytar, peace sign, v, open mouth smile, cheerful")
member("member_chu2", "chu2", "hands on hips, smug, grin, confident, one foot forward")

def scene(id_, prompt, chars=(), neg=""):
    A[id_] = dict(w=W, h=H, prompt=prompt, neg=neg, chars=list(chars))

scene("group_stage",
      "5girls, multiple girls, rock band, concert, live performance, outdoor stage, night, music festival, stage lights, light beams, pyrotechnics, fire pillars, sparks, from below, wide shot, full body, energetic",
      [(C["lock"] + ", playing guitar, open mouth", 0.1, 0.5),
       (C["masking"].replace(", drumsticks", "") + ", drummer, sitting at drum set, hitting drums with drumsticks, no guitar", 0.3, 0.3),
       (C["layer"] + ", singing, microphone stand, playing bass guitar", 0.5, 0.5),
       (C["pareo"] + ", playing keyboard instrument, synthesizer, smile", 0.7, 0.5),
       (C["chu2"] + ", dj, turntable, arm up", 0.9, 0.5)])
scene("layer_sing",
      f"1girl, solo, {solo('layer')}, upper body, close-up, singing, holding microphone, eyes half-closed, sweat, firelight from below, red stage light, embers, depth of field, face on right side of frame, dark lower left")
scene("chu2_rap",
      f"1girl, solo, {solo('chu2')}, dj, turntable, dj booth, pointing at viewer, grin, leaning forward, foreshortening, neon lights, pink light, cyan light, led screen, upper body, centered")
scene("group_back",
      "5girls, multiple girls, from behind, back view, standing on stage edge, facing huge crowd, glowstick, sea of lights, night, giant bonfire in the distance, backlighting, rim light, holding instruments, open night sky, wide shot",
      [(C["lock"] + ", from behind, holding guitar", 0.1, 0.7),
       (C["masking"] + ", from behind, holding drumsticks", 0.3, 0.7),
       (C["layer"] + ", from behind, holding bass guitar", 0.5, 0.7),
       (C["pareo"] + ", from behind, twintails", 0.7, 0.7),
       (C["chu2"] + ", from behind, cat ear headphones", 0.9, 0.7)])
scene("pareo_chu2_festival",
      "2girls, japanese summer festival, night, food stall, paper lantern, warm lighting, bokeh, takoyaki, feeding, eating, casual clothes, happy, comedic",
      [("girl, nyubara reona, bang dream!, very long hair, twintails, multicolored hair, pink hair, aqua hair, blunt bangs, red eyes, white cardigan, purple t-shirt, pink skirt, holding takoyaki, offering food, open mouth smile", 0.5, 0.5),
       ("girl, tamade chiyu, bang dream!, petite, long hair, pink hair, ahoge, aqua eyes, headphones around neck, black hoodie, black shorts, cheek bulge, eating, blush, looking away", 0.8, 0.5)],
      neg="kanji, writing, sign text")
scene("group_relax",
      "5girls, multiple girls, sitting around campfire, beach, night, starry sky, relaxed, smile, sparks, warm lighting, medium shot, after concert, peaceful",
      [(C["lock"].replace(", blue electric guitar", "") + ", sitting, leaning on guitar case, smile", 0.1, 0.6),
       (C["masking"].replace(", drumsticks", "") + ", sitting, laughing", 0.3, 0.6),
       (C["layer"].replace(", red electric bass guitar", "") + ", sitting, holding cup, gentle smile", 0.5, 0.6),
       (C["pareo"] + ", sitting, smile", 0.7, 0.6),
       (C["chu2"] + ", sitting, sleepy, half-closed eyes", 0.9, 0.6)])
for id_, p in {
    "hands_guitar": "close-up, hands, playing guitar, electric guitar, fretboard, guitar pick, fingerless gloves, motion blur, sparks, green stage light, sweat, dynamic angle",
    "hands_drums": "close-up, drumsticks, hitting cymbal, snare drum, drum set, motion blur, light flare, amber stage light, sparks, impact, dynamic angle",
    "hands_keys": "close-up, hands, playing keyboard instrument, synthesizer, piano keys, glowing keys, pink light, knobs, sparkle, dynamic angle",
    "hands_dj": "close-up, hand, dj, scratching vinyl record, turntable, mixer, crossfader, cyan light, pink led lights, motion blur, sparks",
}.items():
    scene(id_, f"1girl, head out of frame, {p}", neg="face, eyes")


def build(id_, off=0):
    a = A[id_]
    prompt = f"{a['prompt']}, {QUALITY}"
    neg = NEG + (", " + a["neg"] if a["neg"] else "")
    chars = [{"char_caption": c, "centers": [{"x": x, "y": y}]} for c, x, y in a["chars"]]
    return {
        "input": prompt,
        "model": "nai-diffusion-4-5-full",
        "action": "generate",
        "parameters": {
            "params_version": 4,
            "width": a["w"], "height": a["h"],
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
    args = sys.argv[1:]
    if args == ["list"]:
        print("\n".join(A)); return
    dry = args and args[0] == "dry"
    if dry: args = args[1:]
    REQ_DIR.mkdir(parents=True, exist_ok=True); PICK_DIR.mkdir(parents=True, exist_ok=True)
    for arg in args:
        id_, _, off = arg.partition("@")
        off = int(off or 0)
        name = id_ if not off else f"{id_}@{off}"
        req = REQ_DIR / f"{name}.json"
        req.write_text(json.dumps(build(id_, off), ensure_ascii=False, indent=2), encoding="utf-8")
        if dry:
            print("wrote", req); continue
        r = subprocess.run(["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(TOOL),
                            "-Action", "Generate", "-RequestFile", str(req), "-Execute"], capture_output=True, text=True, encoding="utf-8", errors="replace")
        if r.returncode != 0:
            print("FAIL", name, r.stderr.strip()[:500]); continue
        out = json.loads(r.stdout)
        dst = PICK_DIR / f"{name}.png"
        shutil.copyfile(out["image_path"], dst)
        print("OK", name, out["image_path"])


if __name__ == "__main__":
    main()
