"""White-background removal for anime full-body renders.
Flood-fills near-white from the border, also drops large enclosed pure-white holes,
then soft-unmixes the white fringe. usage: cutout.py in.png out.png preview.jpg"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, dst, prev = sys.argv[1:4]
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.float32)
mn = a.min(axis=2)
mx = a.max(axis=2)
near = (mn > 228) & (mx - mn < 22)

m = Image.fromarray((near * 255).astype(np.uint8), "L").copy()
w, h = m.size
for x in range(0, w, 8):
    for y in (0, h - 1):
        if m.getpixel((x, y)) == 255:
            ImageDraw.floodfill(m, (x, y), 128)
for y in range(0, h, 8):
    for x in (0, w - 1):
        if m.getpixel((x, y)) == 255:
            ImageDraw.floodfill(m, (x, y), 128)
mm = np.asarray(m).copy()
bg = mm == 128

# enclosed holes: remaining very white components bigger than 400 px
rest = (mm == 255)
lab = Image.fromarray((rest * 255).astype(np.uint8), "L")
arr = np.asarray(lab).copy()
ys, xs = np.nonzero(arr == 255)
seen = np.zeros_like(arr, dtype=bool)
work = lab.copy()
for y, x in zip(ys[::7], xs[::7]):
    if work.getpixel((int(x), int(y))) != 255:
        continue
    ImageDraw.floodfill(work, (int(x), int(y)), 77)
    comp = np.asarray(work) == 77
    if comp.sum() > 250:
        bg |= comp
    work = Image.fromarray(np.where(comp, 1, np.asarray(work)).astype(np.uint8), "L").copy()

alpha = np.where(bg, 0.0, 1.0)
# soft fringe: pixels within 3px of background get alpha from how non-white they are
band = np.asarray(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
band &= ~bg
fr = np.clip((255 - mn) / 70.0, 0, 1)
alpha = np.where(band, np.minimum(alpha, fr), alpha)
alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
alpha = np.where(bg, 0, alpha)
# un-mix white
aa = np.clip(alpha, 1e-3, 1)[..., None]
rgb = np.clip((a - (1 - aa) * 255) / aa, 0, 255)
out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
Image.fromarray(out, "RGBA").save(dst)

pv = Image.new("RGBA", im.size, (40, 20, 60, 255))
pv.alpha_composite(Image.fromarray(out, "RGBA"))
pv.convert("RGB").save(prev, quality=85)
print("ok", dst, "bg%", round(bg.mean() * 100, 1))
