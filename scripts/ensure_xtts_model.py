"""Pre-flight check for Coqui XTTS-v2 model weights.
Checks local cache directory. If model files exist, skips download.
If missing, downloads once from HuggingFace coqui/XTTS-v2 with automatic resume.
Keeps Git repo completely clean (never commits large 1.8GB weights to Git).
"""

import os, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from common import load_env
load_env()

XTTS_REPO = "coqui/XTTS-v2"
REQUIRED_FILES = ["config.json", "model.pth", "vocab.json", "speakers_xtts.pth", "dvae.pth", "mel_stats.pth"]

def ensure_model():
    print("=" * 60)
    print("🔍 XTTS-v2 MODEL PRE-FLIGHT CHECK")
    print("=" * 60)

    from huggingface_hub import snapshot_download, try_to_load_from_cache

    # 1. Check if all required files already exist in cache
    all_cached = True
    for f in REQUIRED_FILES:
        loc = try_to_load_from_cache(XTTS_REPO, f)
        if loc is None or not isinstance(loc, str) or not Path(loc).exists():
            all_cached = False
            break

    if all_cached:
        print("✅ XTTS-v2 model already exists in cache! No download needed.")
        return True

    print("📥 XTTS-v2 model missing from cache. Downloading from Hugging Face...")
    tok = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN") or None
    try:
        mdir = snapshot_download(
            repo_id=XTTS_REPO,
            allow_patterns=REQUIRED_FILES,
            token=tok,
            resume_download=True
        )
        print(f"✅ XTTS-v2 model successfully downloaded to cache: {mdir}")
        return True
    except Exception as e:
        print(f"⚠️ Warning during XTTS-v2 download: {e}")
        return False

if __name__ == "__main__":
    ensure_model()
