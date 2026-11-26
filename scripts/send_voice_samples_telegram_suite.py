import sys, os, time, asyncio, subprocess
from pathlib import Path
import requests

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from common import load_env
load_env()

token = (os.environ.get("TELEGRAM_BOT_TOKEN") or "").strip().strip('"').strip("'")
chat_id = str(os.environ.get("TELEGRAM_CHAT_ID") or "").strip().strip('"').strip("'")
if not (token and chat_id):
    raise RuntimeError("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID")

out_dir = ROOT / "data" / "voice_samples_suite"
out_dir.mkdir(parents=True, exist_ok=True)

TEXT = "महाभारत युद्ध में जब घटोत्कच ने अपनी मायावी शक्ति से कौरव सेना में हाहाकार मचा दिया, तब कर्ण को विवश होकर अपना अमोघ दिव्यास्त्र चलाना पड़ा! भगवान श्रीकृष्ण ने मुस्कुराते हुए कहा—पार्थ, आज तुम्हारी रक्षा स्वयं घटोत्कच के बलिदान ने की है!"

print("Generating voice samples...")

# 1. Edge-TTS Madhur Neural (Pure & Clean)
async def gen_madhur():
    import edge_tts
    raw = out_dir / "madhur_raw.mp3"
    c = edge_tts.Communicate(TEXT, "hi-IN-MadhurNeural", rate="+0%", pitch="+0Hz")
    await c.save(str(raw))
    # ffmpeg master loudnorm
    master = out_dir / "sample_1_madhur_natural.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=10",
        "-c:a", "libmp3lame", "-b:a", "192k", str(master)
    ], check=True)

# 2. Edge-TTS Swara Neural (Spiritual Female)
async def gen_swara():
    import edge_tts
    raw = out_dir / "swara_raw.mp3"
    c = edge_tts.Communicate(TEXT, "hi-IN-SwaraNeural", rate="+0%", pitch="+0Hz")
    await c.save(str(raw))
    master = out_dir / "sample_2_swara_female.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=10",
        "-c:a", "libmp3lame", "-b:a", "192k", str(master)
    ], check=True)

asyncio.run(gen_madhur())
asyncio.run(gen_swara())

# Existing Cloned / AI4Bharat samples
ai4bharat_file = ROOT / "data" / "voice_options" / "opt1_ai4bharat_sample4.mp3"
raju_file = ROOT / "data" / "voice_options" / "opt2_raju_xtts_nosilence.mp3"

samples = [
    {
        "file": out_dir / "sample_1_madhur_natural.mp3",
        "title": "Voice 1: Madhur Studio (Clear Words & Zero Cuts)",
        "performer": "MindSpark Studio Engine",
        "caption": (
            "🎙️ *वॉयस 1: Madhur Studio Engine (New Fixed)*\n\n"
            "✨ *खासियत:* किसी भी शब्द को नहीं काटता, 'घटोत्कच', 'दिव्यास्त्र' जैसे कठिन संस्कृत-हिंदी शब्द 100% साफ बोलता है।\n"
            "🔊 *लुक:* क्रिस्प, लाउड और यूटूब/इंस्टाग्राम रील्स के लिए परफेक्ट।"
        )
    },
    {
        "file": raju_file,
        "title": "Voice 2: Raju Hindi Clone (High Energy Storyteller)",
        "performer": "VoiceStudio XTTS Clone",
        "caption": (
            "🎙️ *वॉयस 2: Raju Clone (VoiceStudio / XTTS Engine)*\n\n"
            "✨ *खासियत:* 100% असली इंसान जैसा भारी आवाज़, यूट्यूब केस स्टडी और माइथोलॉजी रील्स में बहुत ज्यादा वायरल होता है।\n"
            "⚡ *स्टाइल:* हाई-एनर्जी, नेचुरल सांस और ठहराव।"
        )
    },
    {
        "file": ai4bharat_file,
        "title": "Voice 3: AI4Bharat Native Storyteller (Sanatan Deep)",
        "performer": "AI4Bharat IIT Madras Engine",
        "caption": (
            "🎙️ *वॉयस 3: AI4Bharat Native Storyteller*\n\n"
            "✨ *खासियत:* शुद्ध भारतीय हिंदी उच्चारण, सनातन और पौराणिक कहानियों के लिए गंभीर और श्रद्धापूर्ण भाव।\n"
            "🙏 *स्टाइल:* डीप, ठहराव और इमोशनल नरेशन।"
        )
    },
    {
        "file": out_dir / "sample_2_swara_female.mp3",
        "title": "Voice 4: Swara Devotional Female",
        "performer": "MindSpark Studio Engine",
        "caption": (
            "🎙️ *वॉयस 4: Swara Devotional (महिला आवाज़)*\n\n"
            "✨ *खासियत:* मंत्र, भक्ति, मंदिर इतिहास और मधुर कथाओं के लिए बहुत ही शांत और मधुर आवाज़।"
        )
    }
]

print(f"Sending {len(samples)} voice samples to Telegram chat_id={chat_id}...")

for i, s in enumerate(samples, 1):
    fpath = Path(s["file"])
    if not fpath.exists():
        print(f"⚠️ Skipping {fpath.name} (not found)")
        continue
    
    print(f"[{i}/{len(samples)}] Sending {fpath.name}...")
    with open(fpath, "rb") as af:
        resp = requests.post(
            f"https://api.telegram.org/bot{token}/sendAudio",
            timeout=120,
            data={
                "chat_id": chat_id,
                "caption": s["caption"],
                "parse_mode": "Markdown",
                "title": s["title"],
                "performer": s["performer"]
            },
            files={"audio": af}
        )
    if resp.ok:
        print(f"  ✅ Sent successfully! Message ID: {resp.json().get('result', {}).get('message_id')}")
    else:
        print(f"  ❌ Failed: {resp.status_code} - {resp.text}")
    time.sleep(1)

print("All voice samples delivered to Telegram!")
