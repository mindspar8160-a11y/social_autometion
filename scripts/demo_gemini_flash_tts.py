"""
Demo script to test Google Gemini Flash TTS with emotional Hindi voices.
Gemini 2.0 Flash supports native emotional audio output (Kore, Puck, Charon, Fenrir, Aoede).
"""
import os, sys, base64, wave, subprocess, argparse, requests
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
from common import load_env, ROOT
import telegram_notifier

load_env()

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"

DEFAULT_HINDI_TEXT = "सन सोलह सौ साठ में, महाराष्ट्र के पावनखिंड में, तीन सौ मराठा वीरों ने चार हज़ार मुग़ल सेना को रोक दिया था! बाजीप्रभु देशपांडे ने अपनी अंतिम सांस तक तलवार नहीं छोड़ी!"

def synthesize_gemini_voice(text, voice="Charon", style="dramatic intense mythological storytelling", model="gemini-2.0-flash", out_path=None):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY is not set in .env! Please get a free key from https://aistudio.google.com and set GEMINI_API_KEY=your_key in .env")
        return None

    if not out_path:
        out_path = ROOT / "data" / f"gemini_{voice.lower()}_sample.mp3"
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    url = f"{GEMINI_BASE}/models/{model}:generateContent?key={api_key}"
    prompt_text = f"{style}: {text}" if style else text

    body = {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": voice
                    }
                }
            }
        }
    }

    print(f"🎙️ Calling Gemini 2.0 Flash TTS (Voice: {voice}, Model: {model})...")
    r = requests.post(url, json=body, timeout=60)
    if r.status_code != 200:
        print(f"❌ Error {r.status_code}: {r.text[:300]}")
        return None

    data = r.json()
    part = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0]
    inline = part.get("inlineData") or part.get("inline_data")
    if not inline:
        print("❌ No audio inline data returned in response:", data)
        return None

    raw_bytes = base64.b64decode(inline["data"])
    mime = inline.get("mimeType") or inline.get("mime_type") or "audio/L16;rate=24000"

    wav = out_path.with_suffix(".tmp.wav")
    rate = 24000
    if "rate=" in mime:
        try:
            rate = int(mime.split("rate=")[1].split(";")[0])
        except Exception:
            pass

    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(raw_bytes)

    # Convert to MP3
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
                    "-ar", "44100", "-ac", "2", "-b:a", "192k", str(out_path)], check=True)
    if wav.exists():
        wav.unlink()

    print(f"✅ Generated emotional Hindi audio at: {out_path} ({out_path.stat().st_size / 1024:.1f} KB)")
    return out_path


def main():
    parser = argparse.ArgumentParser(description="Test Gemini Flash TTS for Hindi")
    parser.add_argument("--text", default=DEFAULT_HINDI_TEXT, help="Hindi text to synthesize")
    parser.add_argument("--voice", default="Charon", choices=["Charon", "Puck", "Kore", "Fenrir", "Aoede"], help="Gemini Voice")
    parser.add_argument("--style", default="dramatic intense mythological storytelling", help="Emotion / style descriptor")
    parser.add_argument("--telegram", action="store_true", help="Send audio directly to Telegram")
    args = parser.parse_args()

    audio_file = synthesize_gemini_voice(args.text, voice=args.voice, style=args.style)
    if audio_file and args.telegram:
        caption = f"🎙️ <b>Gemini Flash TTS Hindi Demo</b>\nVoice: {args.voice}\nStyle: {args.style}\n\n<i>\"{args.text[:100]}...\"</i>"
        telegram_notifier.send_audio(audio_file, caption=caption)
        print("📲 Sent sample audio to Telegram!")

if __name__ == "__main__":
    main()
