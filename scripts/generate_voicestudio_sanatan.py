import sys, os, time, subprocess
from pathlib import Path
import torch
import scipy.io.wavfile
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "temp_voicestudio"))

from omnivoice.models.omnivoice import OmniVoice
from omnivoice.utils.audio import save_audio
from common import load_env
import requests
load_env()

out_dir = ROOT / "data" / "voicestudio_samples"
out_dir.mkdir(parents=True, exist_ok=True)

TEXT = "कुरुक्षेत्र के इस महायुद्ध में जब अर्जुन कांप उठे, तब योगेश्वर भगवान श्रीकृष्ण ने विराट दिव्य रूप दिखाया! हे पार्थ, धर्म की रक्षा के लिए युद्ध कर!"

print("Loading OmniVoice (VoiceStudio Engine)...")
device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32

model = OmniVoice.from_pretrained(
    "k2-fsa/OmniVoice",
    device_map=device,
    dtype=dtype,
    allow_tokenizer_fallback=True
)
print("OmniVoice loaded successfully!")

# 1. VoiceStudio Voice Design: Sanatani Storyteller
wav_1 = out_dir / "voicestudio_sanatan_design.wav"
mp3_1 = out_dir / "voicestudio_sanatan_design.mp3"

if not mp3_1.exists():
    print("\n[VoiceStudio 1] Generating Voice Design (Sanatan Divine Storyteller)...")
    audios1 = model.generate(
        text=TEXT,
        language="hi",
        instruct="male, indian accent, middle-aged, low pitch",
        num_step=16,
        speed=1.0,
        denoise=True
    )
    save_audio(str(wav_1), audios1[0], model.sampling_rate)

    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_1),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=10",
        "-c:a", "libmp3lame", "-b:a", "192k", str(mp3_1)
    ], check=True)
    print(f"Generated: {mp3_1}")
else:
    print(f"[VoiceStudio 1] Already exists: {mp3_1}")

# 2. VoiceStudio Voice Clone: With Reference Audio
ref_audio_path = ROOT / "data" / "voice_references" / "xtts_ref_1.wav"
wav_2 = out_dir / "voicestudio_sanatan_clone.wav"
mp3_2 = out_dir / "voicestudio_sanatan_clone.mp3"

if ref_audio_path.exists():
    print(f"\n[VoiceStudio 2] Generating Voice Clone with ref={ref_audio_path.name}...")
    ref_text = (ROOT / "data" / "voice_references" / "ref_transcription.txt").read_text(encoding="utf-8").strip()
    audios2 = model.generate(
        text=TEXT,
        language="hi",
        ref_audio=str(ref_audio_path),
        ref_text=ref_text,
        num_step=16,
        speed=1.0,
        denoise=True
    )
    save_audio(str(wav_2), audios2[0], model.sampling_rate)

    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_2),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=10",
        "-c:a", "libmp3lame", "-b:a", "192k", str(mp3_2)
    ], check=True)
    print(f"Generated: {mp3_2}")

print("\n🎉 ALL VOICESTUDIO AUDIO FILES GENERATED!")

# Send to Telegram
token = (os.environ.get("TELEGRAM_BOT_TOKEN") or "").strip().strip('"').strip("'")
chat_id = str(os.environ.get("TELEGRAM_CHAT_ID") or "").strip().strip('"').strip("'")

if token and chat_id:
    print("\n📤 Delivering VoiceStudio audio samples directly to Telegram...")
    if mp3_1.exists():
        with open(mp3_1, "rb") as af:
            requests.post(
                f"https://api.telegram.org/bot{token}/sendAudio",
                timeout=120,
                data={
                    "chat_id": chat_id,
                    "title": "VoiceStudio: Sanatan Voice Design",
                    "performer": "debpalash/VoiceStudio (OmniVoice)",
                    "caption": (
                        "🌟 *debpalash/VoiceStudio — Official OmniVoice Model*\n\n"
                        "✨ *Mode:* Voice Design (Deep Sanatan Storyteller)\n"
                        "📜 *Prompt:* Male, deep authoritative Indian voice, divine sacred Sanatan narrator\n"
                        "🔥 *Repo:* https://github.com/debpalash/voicestudio"
                    ),
                    "parse_mode": "Markdown"
                },
                files={"audio": af}
            )
        print("  ✅ Sent VoiceStudio Sample 1 to Telegram!")

    if mp3_2.exists():
        with open(mp3_2, "rb") as af:
            requests.post(
                f"https://api.telegram.org/bot{token}/sendAudio",
                timeout=120,
                data={
                    "chat_id": chat_id,
                    "title": "VoiceStudio: Sanatan Cloned Engine",
                    "performer": "debpalash/VoiceStudio (OmniVoice)",
                    "caption": (
                        "🌟 *debpalash/VoiceStudio — Official OmniVoice Clone*\n\n"
                        "✨ *Mode:* Reference Voice Cloning\n"
                        "📜 *Source:* Pure Sanatan Divine Voice Reference\n"
                        "🔥 *Repo:* https://github.com/debpalash/voicestudio"
                    ),
                    "parse_mode": "Markdown"
                },
                files={"audio": af}
            )
        print("  ✅ Sent VoiceStudio Sample 2 to Telegram!")
