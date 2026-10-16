import wave, sys
import numpy as np
w = wave.open(sys.argv[1]); sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
BEAT = 60 / 155
def onsets(t0, t1, lo=700, hi=3500, k=0.6, mind=0.1):
    seg = x[int(t0 * sr):int(t1 * sr)]
    hop, n = 64, 1024
    win = np.hanning(n).astype(np.float32)
    fr = 1 + (len(seg) - n) // hop
    idx = np.arange(n)[None, :] + hop * np.arange(fr)[:, None]
    S = np.abs(np.fft.rfft(seg[idx] * win, axis=1))
    f = np.fft.rfftfreq(n, 1 / sr)
    b = np.log1p(30 * S[:, (f >= lo) & (f < hi)])
    d = np.concatenate([[0], np.maximum(0, np.diff(b, axis=0)).sum(1)])
    d = np.convolve(d, np.ones(5) / 5, mode="same")
    tt = t0 + (np.arange(fr) * hop + n / 2) / sr
    thr = np.median(d) + k * d.std()
    out = []
    for i in range(1, len(d) - 1):
        if d[i] > thr and d[i] >= d[i-1] and d[i] >= d[i+1]:
            if out and tt[i] - out[-1][0] < mind:
                if d[i] > out[-1][1]: out[-1] = (tt[i], d[i])
                continue
            out.append((tt[i], d[i]))
    return out
for t0, t1, lab in [(6.5, 8.35, "Hey Hey Go Go Go"), (8.25, 9.9, "Bang Bang Shout x3"), (9.8, 11.4, "Hey Hey Raise x3"), (11.3, 13.05, "Bang Bang Once more again")]:
    ps = onsets(t0, t1)
    print(lab)
    print("  " + "  ".join(f"{t:.3f}(b{(t-0.2)/BEAT:.2f})" for t, v in ps))
