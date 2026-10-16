import wave, sys, json
import numpy as np

path = sys.argv[1]
w = wave.open(path)
sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
dur = len(x) / sr
hop = 256
n_fft = 1024
frames = 1 + (len(x) - n_fft) // hop
win = np.hanning(n_fft).astype(np.float32)
idx = np.arange(n_fft)[None, :] + hop * np.arange(frames)[:, None]
S = np.abs(np.fft.rfft(x[idx] * win, axis=1))
logS = np.log1p(10 * S)
flux = np.maximum(0, np.diff(logS, axis=0)).sum(axis=1)
flux = np.concatenate([[0], flux])
flux -= np.convolve(flux, np.ones(16) / 16, mode="same")
flux = np.maximum(flux, 0)
fr = sr / hop  # onset frames per sec

# tempo via autocorrelation over 60..200 bpm
seg = flux[int(30 * fr):int(200 * fr)]
ac = np.correlate(seg, seg, mode="full")[len(seg) - 1:]
lags = np.arange(len(ac))
bpms = 60 * fr / np.maximum(lags, 1)
mask = (bpms > 90) & (bpms < 200)
best = lags[mask][np.argmax(ac[mask])]
# refine with parabolic
bpm = 60 * fr / best
# fine search for bpm maximizing comb alignment
def score(b, ph):
    period = 60 / b
    t = np.arange(ph, dur, period)
    i = (t * fr).astype(int)
    i = i[i < len(flux)]
    return flux[i].sum()
cands = np.arange(150, 160, 0.01)
best_s, best_b, best_p = -1, 0, 0
for b in cands:
    period = 60 / b
    for ph in np.arange(0, period, 0.005):
        s = score(b, ph)
        if s > best_s:
            best_s, best_b, best_p = s, b, ph
print("duration", round(dur, 3))
print("autocorr bpm", round(bpm, 2), "refined bpm", round(best_b, 3), "phase", round(best_p, 3))

# RMS energy per 1s
rms_hop = sr // 2
rms = [float(np.sqrt(np.mean(x[i:i + rms_hop] ** 2))) for i in range(0, len(x), rms_hop)]
mx = max(rms)
print("energy per 0.5s (0-9):")
line = ""
for k, r in enumerate(rms):
    if k % 20 == 0:
        print(line)
        line = f"{k/2:6.1f}s "
    line += str(min(9, int(r / mx * 10)))
print(line)

# low band energy (kick) per beat-ish: band < 150Hz
freqs = np.fft.rfftfreq(n_fft, 1 / sr)
low = S[:, freqs < 150].sum(axis=1)
json.dump({"bpm": best_b, "phase": best_p, "dur": dur}, open(sys.argv[2], "w"))

