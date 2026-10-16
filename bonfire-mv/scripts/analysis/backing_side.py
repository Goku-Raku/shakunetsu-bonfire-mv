import wave, sys
import numpy as np
w = wave.open(sys.argv[1]); sr = w.getframerate()
a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32).reshape(-1, 2) / 32768
L, R = a[:, 0], a[:, 1]
n, hop = 2048, 256
win = np.hanning(n).astype(np.float32)
f = np.fft.rfftfreq(n, 1 / sr)
band = (f > 400) & (f < 3000)
BEAT = 60 / 155
for item in sys.argv[2:]:
    t0, t1, lab = item.split("|"); t0 = float(t0); t1 = float(t1)
    i0, i1 = int(t0 * sr), int(t1 * sr)
    fr = 1 + (i1 - i0 - n) // hop
    idx = i0 + np.arange(n)[None, :] + hop * np.arange(fr)[:, None]
    SL = np.fft.rfft(L[idx] * win, axis=1)[:, band]
    SR = np.fft.rfft(R[idx] * win, axis=1)[:, band]
    mid = np.log1p(50 * np.abs(SL + SR) / 2).sum(1)
    sid = np.log1p(50 * np.abs(SL - SR) / 2).sum(1)
    tt = t0 + (np.arange(fr) * hop + n / 2) / sr
    def row(e):
        lo, hi = np.percentile(e, 5), np.percentile(e, 95)
        s = ""
        t = t0
        while t < t1:
            i = np.argmin(abs(tt - t)); s += str(int(np.clip((e[i] - lo) / (hi - lo + 1e-9), 0, 0.999) * 10)); t += 0.05
        return s
    print(f"--- {lab} from {t0} (0.05s/char) beat0={(t0-0.2)/BEAT:.2f}")
    print("  mid ", row(mid))
    print("  side", row(sid))
