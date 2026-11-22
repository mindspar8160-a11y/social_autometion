# 👶 3D Cartoon Kids Comedy & Stories - Automated Shorts/Reels Channel Blueprint

> **How to use this file:**
> Copy this file directly into the root of any new repository or project directory. Any AI agent (or developer) reading this file will immediately understand the complete concept, visual animation style, AI script generation, voiceover settings, and multi-platform publishing pipelines (YouTube + Instagram + Telegram) to build the project end-to-end.

---

## 1. 🎯 Channel Concept & Content Formula

### Reference & Inspiration
- **Style Reference:** Instagram Reel `https://www.instagram.com/reels/DgAc-9kKFmY/` (Creator: **Sami Rock**).
- **Visual Style:** 3D animated cartoon character (e.g. Cute talking snake in blue t-shirt with red bandana, talking tiger, smart monkey, playful bear) with big expressive eyes, smiling mouth, cartoon white gloves, expressive hand gestures, in a vibrant colorful kids bedroom or jungle/school background.
- **Audio & Comedy Style:** Fast, ultra-engaging Hindi comedic punchlines, silly logic jokes, curious riddles, and lighthearted moral comparisons:
  > *"फिल्मों में अगर शादी हो जाए तो फिल्म खत्म हो जाती है, और रियल लाइफ में अगर शादी हो जाए तो फिल्म स्टार्ट हो जाती है! 😂"*
- **Format:** Vertical 9:16 Shorts/Reels (1080x1920).
- **Target Video Duration:** 10 to 18 seconds (fast retention, high completion rate, instant loop replay!).
- **Target Audience:** Kids, teenagers, and families (super high viral shareability on WhatsApp, YouTube Shorts, and Instagram Reels).

---

## 2. 🏗️ System Architecture & Technology Stack

```
                     ┌────────────────────────┐
                     │ 1. AI Script Generator │ (Groq / Gemini LLM - 10-15s Viral Kids Jokes/Riddles)
                     └───────────┬────────────┘
                                 │
                     ┌───────────▼────────────┐
                     │ 2. Voiceover & Audio   │ (Edge-TTS Cheerful Cartoon Voice + Sound FX + Upbeat BGM)
                     └───────────┬────────────┘
                                 │
                     ┌───────────▼────────────┐
                     │ 3. Animation Engine    │ (Remotion 1080x1920: 3D Talking Character + Bounce Subtitles)
                     └───────────┬────────────┘
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     │                           │                           │
┌────▼─────────────────┐   ┌─────▼────────────────┐   ┌──────▼─────────────────┐
│ YouTube Shorts       │   │ Instagram Reels      │   │ Telegram Bot Delivery  │
│ (youtube_upload.py)  │   │ (buffer_upload.py)   │   │ (Direct HD Video Path) │
│ Official Google API  │   │ Buffer GraphQL API   │   │ Instant Phone Backup   │
└──────────────────────┘   └──────────────────────┘   └────────────────────────┘
```

---

## 3. 📝 AI Script Generation Engine (LLM)

### Prompt Specification (`src/script_plan.py`):
```text
Role: You are an expert Hindi kids cartoon writer and comedy creator.
Task: Write a 10 to 14-second viral, hilarious Hindi dialogue for a cute 3D cartoon animal character.

Rules:
1. Pacing: Strictly 25 to 35 words total (exactly 10-14 seconds when spoken).
2. Format:
   - Line 1 (Setup, 0-4s): A relatable observation, question, or curious setup.
   - Line 2 (Punchline, 5-11s): A funny, unexpected comedic twist or silly logic conclusion.
   - Line 3 (Outro, 12-14s): Quick reaction/laugh (e.g. "हंसना मना है! 😜", "बोलो है कि नहीं? 😂").
3. Language: Clean, humorous spoken Hindi/Hinglish that kids and parents both love.
4. Output JSON:
   {
     "title": "Hindi catchy viral title",
     "script": "Full Hindi spoken narration with emotion markers",
     "tags": ["shorts", "comedy", "cartoon", "kidsjokes", "funny"]
   }
```

---

## 4. 🎙️ Voice & Audio Synthesis

### TTS Configuration
- **Engine:** `edge-tts` (100% Free, Zero GPU required, runs in GitHub Actions).
- **Voice Options:**
  - `hi-IN-SwaraNeural` (High energy, expressive, pitch shifted `+15%` for cute cartoon voice).
  - `hi-IN-MadhurNeural` (Playful boy/character voice, rate `+10%`, pitch `+10%`).
- **Sound Effects (SFX):**
  - **Start:** Pop / Whoosh sound on text entrance.
  - **Middle:** Boing / Spring sound effect on comedic gesture.
  - **Punchline:** Comedy laugh track / Rimshot / Cartoon slip sound.
- **Background Music (BGM):**
  - Playful, upbeat cartoon ukulele / whistle track mixed at `-22dB` under voice.

---

## 5. 🎬 Animation Engine (Remotion Vertical 1080x1920)

### Visual Components:
1. **Character Layer:**
   - 3D cartoon animal character (Talking head / upper torso).
   - Eye blinking (`Math.sin(frame * 0.1) > 0.95`).
   - Mouth open/close synced with speech volume or syllable timing.
   - Subtle body swaying and floating motion.
   - Cartoon gloved hands gesturing on punchlines.
2. **Text / Subtitle Layer:**
   - Pop-in, spring-bounce Devanagari Hindi text with bright yellow/cream font and bold dark outlines.
   - Active word highlighter synced with speech.
3. **Background Layer:**
   - Colorful, warm vector cartoon room / outdoor park with gentle parallax camera zoom.

---

## 6. 🚀 Multi-Platform Publishing Pipelines

### A. YouTube Shorts Auto-Upload (`src/youtube_upload.py`)
- Official Google YouTube Data API v3 (`insert_video`).
- Uploads directly as Public YouTube Short.
- **Critical Rule:** Never delete the output directory after YouTube upload, so downstream Instagram upload and GitHub artifacts have access to `final.mp4`.

### B. Instagram Reels 100% Safe Auto-Upload (`src/buffer_upload.py`)
- Uses **Buffer GraphQL API** (`https://api.buffer.com`) via `BUFFER_API_KEY`.
- **Zero Strike Risk:** Buffer is an official Meta publishing partner; account credentials are never touched by cloud scrapers.
- **1-to-1 Upload Parity:** Every single video uploaded to YouTube is simultaneously published to Instagram Reels (`mode: shareNow`).
- Auto-discovers connected Instagram channel ID.
- Uses temporary direct MP4 hosting (Catbox.moe / tmpfiles) to pass the video URL to Buffer.

### C. Telegram Instant Delivery
- Sends the rendered 1080x1920 MP4 directly to your Telegram chat/channel with Title, Description, and Hashtags for instant mobile access.

---

## 7. ⏱️ GitHub Actions Workflows (Viral Peak Timings)

### Workflow 1: `daily.yml`
```yaml
name: Daily Kids Cartoon Reels
on:
  schedule:
    # 4 Peak Kids & Family Viewing Slots in India (IST = UTC + 5:30):
    # 1. 08:30 AM IST (03:00 UTC) - Morning before school / weekend routine
    # 2. 01:00 PM IST (07:30 UTC) - Lunch & afternoon break
    # 3. 05:30 PM IST (12:00 UTC) - Playtime & evening family screen time
    # 4. 08:30 PM IST (15:00 UTC) - Bedtime comedy & dinner relaxation
    - cron: "0 3,12,15 * * *"
    - cron: "30 7 * * *"
  workflow_dispatch:
    inputs:
      force:
        description: "Force run (bypass night & duplicate guards)"
        type: boolean
        default: false
```

#### Night Sleep Guard (Inside `daily.yml`):
```bash
# Calculate current Indian Standard Time (IST = UTC + 5:30)
NOW_UTC=$(date -u +%s)
NOW_IST=$(( NOW_UTC + 19800 ))
IST_HOUR=$(date -u -d "@$NOW_IST" +%H)
IST_HOUR=$((10#$IST_HOUR))

# Night Guard: 10:00 PM to 08:00 AM IST - strictly OFF!
if [ "$IST_HOUR" -ge 22 ] || [ "$IST_HOUR" -lt 8 ]; then
  echo "🌙 Raat ka samay hai (${IST_HOUR}:00 IST). Audience offline hoti hai. Video generation & upload BAND."
  echo "skip=true" >> "$GITHUB_OUTPUT"
fi
```

### Workflow 2: `hourly-loop.yml`
- Loops during daytime peak hours.
- Before looping, checks `NEXT_IST_HOUR`. If next run falls in night (>= 22:00 or < 08:00 IST), automatically pauses until morning.

---

## 8. 🔐 Required Secrets Checklist

Add these in **GitHub Repository → Settings → Secrets and variables → Actions**:

| Secret Name | Purpose | Where to Get |
| :--- | :--- | :--- |
| `BUFFER_API_KEY` | Safe Instagram Reels auto-upload | https://publish.buffer.com/settings/api |
| `YT_CLIENT_ID` | YouTube Data API Client ID | Google Cloud Console |
| `YT_CLIENT_SECRET` | YouTube Data API Client Secret | Google Cloud Console |
| `YT_REFRESH_TOKEN` | YouTube OAuth Refresh Token | Google OAuth Playground |
| `GROQ_API_KEY` | Fast AI Script Generation | https://console.groq.com/keys |
| `TELEGRAM_BOT_TOKEN` | Telegram notifications & video delivery | @BotFather on Telegram |
| `TELEGRAM_CHAT_ID` | Telegram chat/channel ID | @userinfobot on Telegram |
| `GH_TOKEN` | GitHub Actions workflow trigger | GitHub Personal Access Token |

---

## 9. 🏁 Quickstart Guide for New Project

1. Initialize repository with Node.js (Remotion) and Python (TTS + uploaders).
2. Place this `PROJECT_BLUEPRINT_KIDS_ANIMATION.md` in the project root.
3. Install dependencies:
   ```bash
   pip install edge-tts requests
   cd remotion && npm install
   ```
4. Configure `.env` with your API keys.
5. Push to GitHub and enjoy 100% automated viral Kids Cartoon Reels & Shorts!
