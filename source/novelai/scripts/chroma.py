"""Green-screen key for NovelAI renders. usage: chroma.py in.png out.png preview.jpg
Soft alpha from green dominance, keeps small enclosed green areas (eyes), despills the edge band."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, dst, prev = sys.argv[1:4]
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
gn = g - np.maximum(r, b)  # green dominance

border = np.concatenate([gn[0], gn[-1], gn[:, 0], gn[:, -1]])
gbg = float(np.median(border))
lo, hi = gbg * 0.22, gbg * 0.6
key = np.clip((gn - lo) / (hi - lo), 0, 1)  # 1 = background
alpha = 1 - key

# 只把「跟邊框相連」的綠色區域當背景；小塊封閉的綠（眼睛）保留
bgmask = (key > 0.5)
m = Image.fromarray((bgmask * 255).astype(np.uint8), "L").copy()
w, h = m.size
for x in range(0, w, 6):
    for y in (0, h - 1):
        if m.getpixel((x, y)) == 255:
            ImageDraw.floodfill(m, (x, y), 128)
for y in range(0, h, 6):
    for x in (0, w - 1):
        if m.getpixel((x, y)) == 255:
            ImageDraw.floodfill(m, (x, y), 128)
mm = np.asarray(m)
enclosed = mm == 255
# 大塊封閉綠（手臂與身體間的空隙）也要去掉，小塊（眼睛）保留
work = Image.fromarray((enclosed * 255).astype(np.uint8), "L").copy()
ys, xs = np.nonzero(enclosed)
keep = np.zeros_like(enclosed)
for y, x in zip(ys[::5], xs[::5]):
    if work.getpixel((int(x), int(y))) != 255:
        continue
    ImageDraw.floodfill(work, (int(x), int(y)), 77)
    comp = np.asarray(work) == 77
    if comp.sum() < 600 and gn[comp].mean() < gbg * 0.75:
        keep |= comp
    work = Image.fromarray(np.where(comp, 1, np.asarray(work)).astype(np.uint8), "L").copy()
keep = np.asarray(Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
alpha = np.where(keep, 1.0, alpha)

# 邊緣去綠溢色
near_bg = np.asarray(Image.fromarray(((alpha < 0.98) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
near_bg &= ~keep
g2 = np.where(near_bg, np.minimum(g, np.maximum(r, b) * 1.02 + 4), g)
rgb = np.dstack([r, g2, b])
alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))).astype(np.float32)
out = np.dstack([np.clip(rgb, 0, 255), alpha]).astype(np.uint8)
Image.fromarray(out, "RGBA").save(dst)

pv = Image.new("RGBA", im.size, (40, 20, 60, 255))
pv.alpha_composite(Image.fromarray(out, "RGBA"))
pv.convert("RGB").save(prev, quality=88)
print("ok", dst, "bg green", round(gbg), "transparent%", round((alpha < 10).mean() * 100, 1))
