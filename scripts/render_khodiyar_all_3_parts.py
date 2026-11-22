import os, sys, time, shutil, subprocess, json, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from common import load_env, jload, jsave
load_env()

import series_manager
import daily_pipeline

def setup_khodiyar_topic():
    state = series_manager.load_series_state()
    khodiyar_idx = None
    for idx, t in enumerate(state.get("active_topics", [])):
        if t.get("topic_id") == "aai_khodiyar_miracle":
            khodiyar_idx = idx
            break
    
    if khodiyar_idx is None:
        raise RuntimeError("Khodiyar topic not found in active_topics!")

    # Set up high-retention reels-scripting parts
    state["current_index"] = khodiyar_idx
    state["active_topics"][khodiyar_idx]["current_part"] = 1
    state["active_topics"][khodiyar_idx]["parts"] = [
        {
            "part_num": 1,
            "part_title": "⚡ चारण कन्या का भीषण संकल्प",
            "hook_line": "एक छोटी सी कन्या ने पूरे गाँव की जान बचा ली, जब सबकी आँखों के सामने मौत ने कलम उठा ली थी!",
            "recap_bridge": "गाँव में मेहरक को जब विषैले नाग ने काटा, तो समय की रेत तेज़ी से फिसलने लगी।",
            "cliffhanger": "...और तभी खोडियार ने अपने बालों को खोलकर एक ऐसा वचन दिया, जिसने पाताल लोक के देवताओं को भी काँपने पर मजबूर कर दिया!",
            "part_summary": "गाँव में मेहरक नाग के डंक से मूर्छित हो गया। वैद्य ने कहा कि सूर्योदय से पहले यदि पाताल का अमृत न मिला, तो इसके प्राण नहीं बचेंगे। यह सुनकर चारण कन्या खोडियार ने अपनी जान की बाज़ी लगाने का भीषण संकल्प लिया।",
            "completed": False,
            "rendered_at": None,
            "video_dir": None
        },
        {
            "part_num": 2,
            "part_title": "🌊 पाताल लोक की ओर महाप्रस्थान",
            "hook_line": "जहाँ इंसानी पैर कभी नहीं पड़े, वहाँ एक कन्या ने मौत के दरवाज़े को खटखटाना शुरू कर दिया!",
            "recap_bridge": "अपने भाई के प्राण बचाने के लिए खोडियार माता अकेले गहरे समुद्र और दलदल की ओर दौड़ पड़ीं।",
            "cliffhanger": "...और तभी गहरे जल से निकला एक विशालकाय भयानक मगरमच्छ, जिसकी लाल आँखें अंगारों की तरह चमक उठीं!",
            "part_summary": "माता खोडियार अंधेरी रात में विकराल जलप्रवाह की ओर बढ़ीं। रास्ता दलदल और ज़हरीले जीवों से भरा था। सूर्योदय में कुछ ही क्षण शेष थे। तभी जल के भीतर से एक विशालकाय मगरमच्छ प्रकट हुआ, जिसने उनका मार्ग रोक लिया।",
            "completed": False,
            "rendered_at": None,
            "video_dir": None
        },
        {
            "part_num": 3,
            "part_title": "🐊 मगरमच्छ की सवारी और अमर चमत्कार",
            "hook_line": "जिस मगरमच्छ के नाम से दुनिया काँपती थी, वो एक छोटी सी कन्या के चरणों में सिर क्यों झुका बैठा?",
            "recap_bridge": "माता खोडियार ने निडर होकर जब उस विशाल जीव की आँखों में देखा, तो सृष्टि का नियम ही बदल गया।",
            "cliffhanger": "खोडियार माता की कृपा से मेहरक जीवित हो उठा। बोलिए जय माँ खोडियार! 🙏",
            "part_summary": "माता खोडियार के तपोबल को पहचानकर मगरमच्छ ने अपना शीश उनके चरणों में नवा दिया। माता उसकी पीठ पर सवार हुईं और पलक झपकते ही पाताल से संजीवनी रस लेकर लौटीं। उन्होंने मेहरक के मुख में अमृत डाला और वह जीवित हो उठा। आज भी माँ खोडियार मगरमच्छ पर विराजती हैं।",
            "completed": False,
            "rendered_at": None,
            "video_dir": None
        }
    ]
    series_manager.save_series_state(state)
    print(f"[Khodiyar] Configured active series slot {khodiyar_idx} with viral reels-scripting blueprint!")

def render_part(expected_part_num):
    print("\n" + "=" * 65)
    print(f"🚀 STARTING RENDER FOR KHODIYAR PART {expected_part_num}/3")
    print("=" * 65)

    # Make sure state has expected_part_num
    state = series_manager.load_series_state()
    khodiyar_idx = None
    for idx, t in enumerate(state.get("active_topics", [])):
        if t.get("topic_id") == "aai_khodiyar_miracle":
            khodiyar_idx = idx
            break
    
    if khodiyar_idx is not None:
        state["current_index"] = khodiyar_idx
        state["active_topics"][khodiyar_idx]["current_part"] = expected_part_num
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
    print(f"✅ KHODIYAR PART {expected_part_num}/3 COMPLETED & SENT TO TELEGRAM!")

if __name__ == "__main__":
    setup_khodiyar_topic()
    for p in [1, 2, 3]:
        render_part(p)
        print(f"\n⏳ Waiting 5 seconds before next part...")
        time.sleep(5)
    print("\n🎉 ALL 3 KHODIYAR PARTS SUCCESSFULLY RENDERED & DELIVERED TO TELEGRAM!")
