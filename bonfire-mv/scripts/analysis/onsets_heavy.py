import wave, sys
import numpy as np
w = wave.open(sys.argv[1]); sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
t0, t1 = 96.0, 104.5
seg = x[int(t0 * sr):int(t1 * sr)]
hop, n = 64, 1024
win = np.hanning(n).astype(np.float32)
fr = 1 + (len(seg) - n) // hop
idx = np.arange(n)[None, :] + hop * np.arange(fr)[:, None]
S = np.abs(np.fft.rfft(seg[idx] * win, axis=1))
f = np.fft.rfftfreq(n, 1 / sr)
def flux(lo, hi):
    b = np.log1p(30 * S[:, (f >= lo) & (f < hi)])
    d = np.maximum(0, np.diff(b, axis=0)).sum(1)
    return np.concatenate([[0], d])
low = flux(30, 150); full = flux(30, 8000)
rms = np.sqrt((seg[idx] ** 2).mean(1))
tt = t0 + (np.arange(fr) * hop + n / 2) / sr
def peaks(v, thr, mind=0.08):
    out = []
    for i in range(1, len(v) - 1):
        if v[i] > thr and v[i] >= v[i-1] and v[i] >= v[i+1]:
            if out and tt[i] - out[-1][0] < mind:
                if v[i] > out[-1][1]: out[-1] = (tt[i], v[i])
                continue
            out.append((tt[i], v[i]))
    return out
BEAT = 60/155
for name, v in [("low", low), ("full", full)]:
    thr = np.percentile(v, 97)
    print(name, "thr", round(float(thr), 1))
    for t, val in peaks(v, thr):
        b = (t - 0.2) / BEAT
        print(f"  {t:7.3f}s beat {b:7.2f} (bar {b/4:6.2f}) strength {val:6.1f}")
# rms envelope in 0.05s steps 97.5-100
print("rms")
for s in np.arange(97.0, 100.5, 0.1):
    i = np.argmin(abs(tt - s)); print(f"  {s:5.1f} {rms[i]:.3f}")
