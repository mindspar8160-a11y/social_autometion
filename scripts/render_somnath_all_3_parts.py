import os, sys, time, shutil, subprocess, json, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from common import load_env, jload, jsave
load_env()

import series_manager
import daily_pipeline

def render_part(expected_part_num):
    print("\n" + "=" * 65)
    print(f"🚀 STARTING RENDER FOR SOMNATH PART {expected_part_num}/3")
    print("=" * 65)

    # Force topic_id and current_index so it strictly renders Somnath
    state = series_manager.load_series_state()
    somnath_idx = None
    for idx, t in enumerate(state.get("active_topics", [])):
        if t.get("topic_id") == "somnath_first_jyotirlinga_curse":
            somnath_idx = idx
            break
    
    if somnath_idx is None:
        raise RuntimeError("Somnath topic not found in active_topics!")
    
    state["current_index"] = somnath_idx
    state["active_topics"][somnath_idx]["current_part"] = expected_part_num
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
    print(f"✅ SOMNATH PART {expected_part_num}/3 COMPLETED & SENT TO TELEGRAM!")

if __name__ == "__main__":
    for p in [1, 2, 3]:
        render_part(p)
        print(f"\n⏳ Waiting 5 seconds before next part...")
        time.sleep(5)
    print("\n🎉 ALL 3 SOMNATH PARTS SUCCESSFULLY RENDERED & DELIVERED TO TELEGRAM!")
