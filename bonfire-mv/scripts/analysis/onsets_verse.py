import wave, sys
import numpy as np

w = wave.open(sys.argv[1])
sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
hop = 128
n_fft = 1024
win = np.hanning(n_fft).astype(np.float32)
freqs = np.fft.rfftfreq(n_fft, 1 / sr)
band = (freqs > 700) & (freqs < 3500)
BEAT = 60 / 155
EIGHTH = BEAT / 2

def onsets(t0, t1):
    a = int(t0 * sr)
    b = int(t1 * sr)
    seg = x[a:b]
    frames = 1 + (len(seg) - n_fft) // hop
    idx = np.arange(n_fft)[None, :] + hop * np.arange(frames)[:, None]
    S = np.log1p(20 * np.abs(np.fft.rfft(seg[idx] * win, axis=1))[:, band])
    flux = np.maximum(0, np.diff(S, axis=0)).sum(1)
    flux = np.concatenate([[0], flux])
    flux = np.convolve(flux, np.ones(3) / 3, mode="same")
    thr = np.median(flux) + 0.6 * flux.std()
    fr = sr / hop
    peaks = []
    mind = int(0.11 * fr)
    for i in range(1, len(flux) - 1):
        if flux[i] > thr and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]:
            if peaks and i - peaks[-1][0] < mind:
                if flux[i] > peaks[-1][1]:
                    peaks[-1] = (i, flux[i])
                continue
            peaks.append((i, flux[i]))
    return [(t0 + i / fr, v) for i, v in peaks]

for (t0, t1, label) in [(34.4, 39.1, "波風"), (38.95, 40.8, "笑わせ"), (40.7, 43.3, "ド派手"), (43.2, 47.2, "楽園"),
                        (104.2, 106.8, "もしも"), (106.6, 108.8, "あ～"), (108.7, 110.5, "出す"), (110.4, 113.5, "たまには"), (113.4, 117.0, "美味い")]:
    ps = onsets(t0, t1)
    out = []
    for t, v in ps:
        grid = round((t - 0.2) / EIGHTH)
        gt = 0.2 + grid * EIGHTH
        out.append(f"{t:.2f}({(t-gt)*1000:+.0f})")
    print(label, len(ps), " ".join(out))
