import os, sys, time, shutil, subprocess, json, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from common import load_env, jload, jsave
load_env()

import series_manager
import daily_pipeline

def render_part2():
    print("\n" + "=" * 65)
    print("🚀 STARTING RENDER FOR PURI JAGANNATH PART 2/3")
    print("=" * 65)

    state = series_manager.load_series_state()
    puri_idx = None
    for idx, t in enumerate(state.get("active_topics", [])):
        if t.get("topic_id") == "puri_jagannath_7_mysteries":
            puri_idx = idx
            break
    
    if puri_idx is None:
        raise RuntimeError("Puri topic not found in active_topics!")

    state["current_index"] = puri_idx
    state["active_topics"][puri_idx]["current_part"] = 2
    series_manager.save_series_state(state)

    class Args:
        mode = "myth"
        engine = "paperfilm"
        book = "myth"
        dry_run = False
        headless = True
        interactive = False
        custom_script = None

    args = Args()
    voice_cfg = jload(ROOT / "config" / "voice_config.json", {})
    
    daily_pipeline.run_paperfilm_pipeline(args, voice_cfg)
    print("✅ PURI JAGANNATH PART 2/3 COMPLETED & SENT TO TELEGRAM!")

if __name__ == "__main__":
    render_part2()
