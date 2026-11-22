import os, sys, time, shutil, subprocess, json, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from common import load_env, jload, jsave
load_env()

import series_manager
import daily_pipeline

TOPIC_ID = "shakti_peeth_godavari_sarvashail"
TOPIC_TITLE = "कोटिलिंगेश्वर घाट (राजमहेंद्रवरम) शक्तिपीठ: माता सती का गाल जहाँ गिरा"
TOPIC_SUMMARY = "गोदावरी नदी के तट पर माता सती के दोनों गाल गिरे थे। यहाँ देवी विश्वेश्वरी और भैरव वत्सनाभ के रूप में पूजे जाते हैं। महर्षि गौतम ने यहाँ एक करोड़ शिवलिंगों की स्थापना की थी।"

def setup_topic():
    state = series_manager.load_series_state()
    topic_idx = None
    for idx, t in enumerate(state.get("active_topics", [])):
        if t.get("topic_id") == TOPIC_ID:
            topic_idx = idx
            break
    
    if topic_idx is None:
        raise RuntimeError(f"Topic {TOPIC_ID} not found in active_topics!")

    topic = state["active_topics"][topic_idx]
    # Check if scenes are populated, otherwise generate full unified script upfront
    has_scenes = all(len(p.get("scenes", [])) >= 4 for p in topic.get("parts", []))
    if not has_scenes:
        print(f"[Series] Generating full continuous 3-part script upfront with Groq...")
        refreshed = series_manager.generate_series_for_topic({
            "title": TOPIC_TITLE,
            "topic": TOPIC_ID,
            "summary": TOPIC_SUMMARY
        })
        if refreshed and refreshed.get("parts"):
            state["active_topics"][topic_idx]["parts"] = refreshed["parts"]
            state["active_topics"][topic_idx]["story_synopsis"] = refreshed.get("story_synopsis", TOPIC_SUMMARY)
    
    state["current_index"] = topic_idx
    state["active_topics"][topic_idx]["current_part"] = 1
    series_manager.save_series_state(state)
    print(f"[Series] Setup complete: Slot {topic_idx} set to Part 1 with unified pre-written scenes!")

def render_part(expected_part_num):
    print("\n" + "=" * 65)
    print(f"🚀 STARTING RENDER FOR {TOPIC_TITLE} | PART {expected_part_num}/3")
    print("=" * 65)

    state = series_manager.load_series_state()
    topic_idx = None
    for idx, t in enumerate(state.get("active_topics", [])):
        if t.get("topic_id") == TOPIC_ID:
            topic_idx = idx
            break
    
    if topic_idx is not None:
        state["current_index"] = topic_idx
        state["active_topics"][topic_idx]["current_part"] = expected_part_num
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
    print(f"✅ PART {expected_part_num}/3 COMPLETED & SENT TO TELEGRAM!")

if __name__ == "__main__":
    setup_topic()
    for p in [1, 2, 3]:
        render_part(p)
        print(f"\n⏳ Waiting 5 seconds before next part...")
        time.sleep(5)
    print("\n🎉 ALL 3 PARTS SUCCESSFULLY RENDERED & DELIVERED TO TELEGRAM!")
