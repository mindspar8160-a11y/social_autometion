import os, sys, time, shutil, subprocess, json, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from common import load_env, jload, jsave
load_env()

import series_manager
import daily_pipeline

def setup_vimala_topic():
    state = series_manager.load_series_state()
    vimala_idx = None
    for idx, t in enumerate(state.get("active_topics", [])):
        if t.get("topic_id") == "shakti_peeth_vimala_puri":
            vimala_idx = idx
            break
    
    if vimala_idx is None:
        raise RuntimeError("Vimala topic not found in active_topics!")

    topic = state["active_topics"][vimala_idx]
    # Check if scenes are populated, otherwise generate full unified script upfront
    has_scenes = all(len(p.get("scenes", [])) >= 4 for p in topic.get("parts", []))
    if not has_scenes:
        print(f"[Vimala] Generating full continuous 3-part script upfront with Groq...")
        refreshed = series_manager.generate_series_for_topic({
            "title": topic["topic_title"],
            "topic": topic["topic_id"],
            "summary": topic.get("story_synopsis", "")
        })
        if refreshed and refreshed.get("parts"):
            state["active_topics"][vimala_idx]["parts"] = refreshed["parts"]
            state["active_topics"][vimala_idx]["story_synopsis"] = refreshed.get("story_synopsis", topic.get("story_synopsis", ""))
    
    state["current_index"] = vimala_idx
    state["active_topics"][vimala_idx]["current_part"] = 1
    series_manager.save_series_state(state)
    print(f"[Vimala] Setup complete: Slot {vimala_idx} set to Part 1 with unified pre-written scenes!")

def render_part(expected_part_num):
    print("\n" + "=" * 65)
    print(f"🚀 STARTING RENDER FOR VIMALA SHAKTIPEETH PART {expected_part_num}/3")
    print("=" * 65)

    state = series_manager.load_series_state()
    vimala_idx = None
    for idx, t in enumerate(state.get("active_topics", [])):
        if t.get("topic_id") == "shakti_peeth_vimala_puri":
            vimala_idx = idx
            break
    
    if vimala_idx is not None:
        state["current_index"] = vimala_idx
        state["active_topics"][vimala_idx]["current_part"] = expected_part_num
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
    print(f"✅ VIMALA PART {expected_part_num}/3 COMPLETED & SENT TO TELEGRAM!")

if __name__ == "__main__":
    setup_vimala_topic()
    for p in [1, 2, 3]:
        render_part(p)
        print(f"\n⏳ Waiting 5 seconds before next part...")
        time.sleep(5)
    print("\n🎉 ALL 3 VIMALA SHAKTIPEETH PARTS SUCCESSFULLY RENDERED & DELIVERED TO TELEGRAM!")
