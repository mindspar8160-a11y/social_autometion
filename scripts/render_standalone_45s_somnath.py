"""Render full 45-50s standalone video for Somnath Jyotirlinga (No Parts!) and send to Telegram."""
import sys, os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

import common
common.load_env()

import daily_pipeline
import types

voice_cfg = common.jload(ROOT / "config" / "voice_config.json", {})

# Standalone Topic definition
topic_obj = {
    "title": "सोमनाथ ज्योतिर्लिंग: 16 बार टूट कर भी फिर उठ खड़ा हुआ अमर मंदिर",
    "topic": "somnath_eternal",
    "summary": "गुजरात के प्रभास पाटन में स्थित प्रथम ज्योतिर्लिंग सोमनाथ, जिसे महमूद गजनवी और आक्रांताओं ने 16 बार लूटा और तोड़ा, पर हर बार यह और भव्य होकर खड़ा हुआ। सरदार पटेल के संकल्प और भगवान शिव के आशीर्वाद की अमर गाथा।"
}

class Args:
    book = None
    script = None
    topic = "सोमनाथ ज्योतिर्लिंग: 16 बार टूट कर भी फिर उठ खड़ा हुआ अमर मंदिर"
    part = None
    mode = "myth"
    myth = True
    engine = "paperfilm"
    template = None
    style = None
    headless = True
    standalone = True
    series = False

a = Args()

print("=================================================================")
print("🚀 RENDERING FULL 45-50s STANDALONE VIDEO: SOMNATH JYOTIRLINGA")
print("=================================================================")

daily_pipeline.run_paperfilm_pipeline(a, voice_cfg, custom_script=None)
print("🎉 FULL 45-50s STANDALONE VIDEO COMPLETED & SENT TO TELEGRAM!")
