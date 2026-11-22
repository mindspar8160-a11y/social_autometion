---
name: reels-scripting
description: >
  Turn historical, mythological, and cultural topics into viral, high-retention scripts for YouTube Shorts and Instagram Reels (30-45s). Powered by Groq API (GROQ_API_KEY) in place of Google AI/Apify, and tightly integrated into MindSpark's PaperFilm Remotion engine.
---

# MindSpark Viral Reels Scripting Engine

This skill equips MindSpark's LLM pipeline with outlier viral scripting frameworks adapted specifically for short-form video (YouTube Shorts & Instagram Reels) in Hindi / Hinglish.

> [!NOTE]
> In MindSpark, we use **Groq API** (`GROQ_API_KEY`) configured via GitHub Secrets and local environment (`qwen/qwen3.8-27b`, `llama-3.3-70b-versatile`, `openai/gpt-oss-120b`). We do not require Google AI API or Apify tokens.

---

## 1. The 4-Stage Viral Retention Framework

```
[0-3s HOOK] -> [3-8s BRIDGE & STAKES] -> [8-28s CORE VALUE/CONFLICT] -> [28-38s CLIMAX] -> [38-42s CLIFFHANGER/LOOP]
```

### Stage 1: The Thumb-Stopper Hook (0-3s)
- **Goal**: Prevent scroll in the first 3 seconds with high-stakes intrigue or paradox.
- **Rule 1**: Never open with "I", "Doston", "Aaj ke video me", or "Kya aap jante hain".
- **Rule 2**: Ground the hook immediately with a concrete name, year, place, or number.
- **Proven Hook Formulas**:
  - *High-Stakes Paradox*: `"San 1660 mein, 300 Maratha veeron ne 4000 ki sena ko akele kaise rok diya?"`
  - *Bold Sacred/Historic Truth*: `"Puri Jagannath mandir ka wo rahasya, jise vigyan bhi nahi suljha paya!"`
  - *Sensory Mystery*: `"Gufa ke andar se aati wo aawaz aam nahi thi... wo ek devta ki chetavani thi!"`
- **Zero Duplication**: Never repeat the place or subject twice across Scene 1 subtitles and narration.
- **No Dry Recaps**: For multi-part series, NEVER open Part 2 or Part 3 with *"पिछले भाग में देखा था"*. Start immediately with the ongoing crisis.

---

### Stage 2: Narrative Pacing & The 2-Beat Core Focus (5-28s)
- **2 Key Beats Maximum**: A 35-42s short must focus on at most 2 core narrative turning points (not 3+ cluttered events).
- **Cause-and-Effect Progression**: Each scene must naturally link to the previous scene using organic narrative connectors:
  - *"Lekin tabhi..."*
  - *"Vachan ki maryada ke liye..."*
  - *"Aur tabhi ek aisi aawaz aayi..."*
- **Never State the Conclusion Early**: Let the historical facts and character actions build natural suspense.
- **Zero Cheap Filler**: Phrases like *"iska rahasya janiye"*, *"aankhein kholen"*, *"dhyan se sunein"* are strictly banned.

---

### Stage 3: Climax & Turning Point (28-38s)
- The pivotal sacrifice, the divine intervention, or the critical decision.
- Striking contrast between human impossibility and extraordinary divine/heroic will.

---

### Stage 4: Cliffhangers & The Sacred Loop (38-42s)
- **Non-Final Episodes (Parts 1 & 2)**:
  - Must end on a solid, dramatic **Narrative Cliffhanger** (e.g. *"...aur tabhi samandar se uthi aisi pralayankari lehar, jisne aakash ko hila diya!"*).
  - Screen displays the stamp: `अगला भाग`.
  - Banned: Robotic *"dekhiye agle episode mein"*.
- **Final Episode (Part 3 / Climax)**:
  - Must end on a powerful divine resolution and sacred chant.
  - Examples:
    - Shiva stories: `बोलिए हर हर महादेव!`
    - Krishna stories: `बोलिए जय श्री कृष्ण!`
    - Devi stories: `बोलिए जय माँ भवानी!` / `बोलिए जय माँ खोडियार!`
  - Screen displays the stamp: `कथा सम्पूर्ण`.

---

## 2. Sentence-Level Cadence & TTS Audio Optimization

To prevent robotic voiceover and maintain natural breathing cadence in Edge-TTS / AI4Bharat:
1. **Scene Narration Length**: Strictly 8 to 12 words per scene.
2. **Flowing Sentences**: Never leave 3 or more choppy staccato fragments. Combine them into flowing, rhythmic sentences.
3. **Punctuation-Driven Emotion**:
   - `!` for heroic, high-energy declarations.
   - `?` for intrigue and curiosity.
   - `...` and `—` for dramatic suspense and natural inhalation pauses.
   - Banned: Raw bracketed cues like `[whispers]` or `[laughs]`. Emotion must emerge from the words and punctuation.
4. **Pronunciation Formatting**:
   - Numbers and years written out fully in Devanagari Hindi (e.g. `सन सोलह सौ साठ`, `तीन सौ`, `चार हज़ार`).

---

## 3. Groq LLM Routing Configuration

In `src/llm.py`, scripts are generated through Groq with automatic model fallbacks:
```python
models = [
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "llama-3.1-8b-instant"
]
```

- **Environment Variable**: `GROQ_API_KEY` (configured in GitHub Secrets and `.env`).
- **Response Format**: Strictly JSON with structure conforming to `make_plan` / `make_series_part_plan`.
