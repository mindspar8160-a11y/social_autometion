"""Motivational background music selection ducked under the voice."""
import random, subprocess
from pathlib import Path
from common import ROOT

BGM_DIR = ROOT / "data" / "audio" / "bgm"

PREFERRED_BGM = "modern-classical-calm-discovery-152248.mp3"

def pick_random_bgm(bgm_dir=None):
    """Picks the preferred calm divine BGM if present, otherwise a random track from data/audio/bgm/."""
    target_dir = Path(bgm_dir) if bgm_dir else BGM_DIR
    if not target_dir.exists():
        return None
    preferred = target_dir / PREFERRED_BGM
    if preferred.exists() and preferred.stat().st_size > 10000:
        print(f"[Audio] Selected finalized divine BGM: {preferred.name}")
        return preferred
    tracks = [p for p in target_dir.glob("*.mp3") if p.stat().st_size > 10000]
    if not tracks:
        return None
    selected = random.choice(tracks)
    print(f"[Audio] Selected random motivational BGM: {selected.name}")
    return selected

def mix(voice, total, out, bgm_file=None):
    """Mixes voice with calm divine BGM (lowpass 4.5kHz, ducked cleanly under voice)."""
    if bgm_file is None or not Path(bgm_file).exists():
        bgm_file = pick_random_bgm()

    if bgm_file and Path(bgm_file).exists():
        fc = (f"[1:a]volume=0.14,lowpass=f=4500,afade=t=in:d=1.2,afade=t=out:st={max(0, total - 1.5):.2f}:d=1.5[m];"
              "[0:a][m]amix=inputs=2:duration=first:normalize=0[a]")
        cmd = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(voice),
            "-stream_loop", "-1", "-i", str(bgm_file),
            "-filter_complex", fc,
            "-map", "[a]",
            "-t", str(total),
            "-ar", "44100",
            str(out)
        ]
        subprocess.run(cmd, check=True)
    else:
        # Fallback harmonic ambient chords
        d = total + 1
        fc = ("[1][2][3]amix=inputs=3:normalize=0,tremolo=f=0.25:d=0.5,volume=-21dB,"
              f"afade=t=in:d=2,afade=t=out:st={max(0, total - 2):.2f}:d=2[m];"
              "[0][m]amix=inputs=2:duration=first:normalize=0[a]")
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(voice)]
        for f in (130.81, 164.81, 196.0):
            cmd += ["-f", "lavfi", "-i", f"sine=f={f}:d={d}"]
        cmd += ["-filter_complex", fc, "-map", "[a]", "-ar", "44100", str(out)]
        subprocess.run(cmd, check=True)
