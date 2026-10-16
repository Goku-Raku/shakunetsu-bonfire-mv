"""Per-frame audio features for the MV (30fps): 24 log bands, kick onset, rms. Writes compact JSON."""
import wave, sys, json
import numpy as np

src, dst = sys.argv[1:3]
w = wave.open(src)
sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
FPS = 30
n_frames = int(round(len(x) / sr * FPS))
win = 2048
hann = np.hanning(win).astype(np.float32)
freqs = np.fft.rfftfreq(win, 1 / sr)
edges = np.geomspace(50, 11000, 25)
band_idx = [np.where((freqs >= edges[i]) & (freqs < edges[i + 1]))[0] for i in range(24)]
bands = np.zeros((n_frames, 24), np.float32)
low = np.zeros(n_frames, np.float32)
rms = np.zeros(n_frames, np.float32)
for f in range(n_frames):
    c = int(f / FPS * sr)
    seg = x[max(0, c - win // 2): c + win // 2]
    if len(seg) < win:
        seg = np.pad(seg, (0, win - len(seg)))
    S = np.abs(np.fft.rfft(seg * hann))
    for i, idx in enumerate(band_idx):
        bands[f, i] = S[idx].mean() if len(idx) else 0
    low[f] = S[(freqs > 40) & (freqs < 130)].sum()
    rms[f] = np.sqrt((seg ** 2).mean())

db = 20 * np.log10(bands + 1e-6)
# 每個頻段各自正規化，避免低頻永遠最滿
lo = np.percentile(db, 5, axis=0)
hi = np.percentile(db, 99, axis=0)
norm = np.clip((db - lo) / (hi - lo), 0, 1)
onset = np.maximum(0, np.diff(low, prepend=low[0]))
onset = onset / (np.percentile(onset, 99) + 1e-6)
kick = np.zeros_like(onset)
env = 0.0
for i, o in enumerate(onset):
    env = max(env * 0.72, min(1.0, o))
    kick[i] = env
rmsn = np.clip(rms / np.percentile(rms, 99), 0, 1)

out = {
    "fps": FPS,
    "bands": [bytes((norm[f] * 255).astype(np.uint8)).hex() for f in range(n_frames)],
    "kick": bytes((kick * 255).astype(np.uint8)).hex(),
    "rms": bytes((rmsn * 255).astype(np.uint8)).hex(),
}
json.dump(out, open(dst, "w"))
print(n_frames, "frames")
