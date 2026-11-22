"""MINDSPARK Multi-Part Series Manager & 3-Topic Rotation Engine.

Features:
1. Full Story Multi-Part Generation:
   Takes a rich topic, writes the full detailed narrative, and splits it into
   2 to 4 sequential parts (each part strictly <= 45s for YouTube Shorts).
2. 3-Topic Parallel Rotation Queue:
   Maintains an active pool of exactly 3 topics.
   Rotates round-robin:
     Topic A (Part 1) -> Topic B (Part 1) -> Topic C (Part 1) ->
     Topic A (Part 2) -> Topic B (Part 2) -> Topic C (Part 2) ...
3. Auto-Replenishment:
   When any topic finishes all its parts, it is archived to completed list,
   and a brand new topic is automatically picked and queued into the active pool.
"""

import os, re, json, datetime, random
from pathlib import Path

from common import ROOT, jload, jsave, load_env
import llm
from myth_picker import pick_myth_topic

STATE_FILE = ROOT / "data" / "active_series.json"
HISTORY_FILE = ROOT / "data" / "rendered_parts_history.json"


def load_rendered_history():
    """Load the immutable ledger of all rendered parts."""
    hist = jload(HISTORY_FILE, [])
    return hist if isinstance(hist, list) else []


def save_rendered_history(hist):
    """Save the immutable ledger of all rendered parts."""
    jsave(HISTORY_FILE, hist)


def is_part_already_rendered(topic_id, part_num):
    """Checks if a specific topic part has already been rendered."""
    hist = load_rendered_history()
    key = f"{topic_id}_part{part_num}"
    for item in hist:
        if isinstance(item, dict):
            if item.get("key") == key or (item.get("topic_id") == topic_id and item.get("part_num") == part_num):
                return True
    return False


def record_rendered_part(topic_id, part_num, topic_title="", part_title="", video_dir=None):
    """Records a completed render into the permanent ledger file."""
    hist = load_rendered_history()
    key = f"{topic_id}_part{part_num}"
    if not any(isinstance(x, dict) and x.get("key") == key for x in hist):
        hist.append({
            "key": key,
            "topic_id": topic_id,
            "part_num": part_num,
            "topic_title": topic_title,
            "part_title": part_title,
            "rendered_at": str(datetime.datetime.now()),
            "video_dir": str(video_dir) if video_dir else None
        })
        save_rendered_history(hist)
        print(f"[SeriesManager] 📝 Ledger updated: Recorded '{key}' into {HISTORY_FILE.name}")


SERIES_PROMPT = """Tum ek anubhavi Hindi dharmik/mythological katha-vachak aur viral YouTube Shorts / Instagram Reels scriptwriter ho.
Ek poori dharmik/mythological katha ko ek hi baar me shuru se aakhir tak likho, aur use seedha 3 connected sequential parts (Part 1, Part 2, Part 3) me divide karo.

TOPIC:
Title: {title}
Summary: {summary}

VIRAL REELS SCRIPTING RULES (ONE CONTINUOUS STORY IN 3 CONNECTED PARTS):
1. HAR PART me STRICTLY 6 se 7 scenes hone chahiye:
   - Narration: STRICTLY Hinglish (Hindi in English/Roman alphabet, jaise: 'Shivaji Maharaj Vishalgadh mein khade the', STRICTLY 8-12 words max). KABHI BHI English words mat likho!
   - tts_text: Shuddh Devanagari Hindi (8-12 words max). Saal aur sankhya shabdon me likho (jaise 1660 ko 'सन सोलह सौ साठ', 300 ko 'तीन सौ').
   - text: Screen par bada text, Devanagari (3-5 words max).
   - kind: "title | card | number | quote | list | map".
   - emotion: "heroic | suspense | conversational | emotional | divine".
   - accent: "red | teal | mustard | ink".

2. STAMP RULE (IMPORTANT - NO POPUP OVERLOAD):
   - Sirf Scene 1 me 'भाग X' ka stamp lagao (jaise: 'भाग 1').
   - Beech ke scenes (scenes 2, 3, 4, 5) me 'भाग X' ya repetitive stamp MAT LAGAO! Khali chhod do ("stamp": null ya omit karo).
   - Aakhri scene me 'अगला भाग' (Part 1, 2) ya 'कथा सम्पूर्ण' (Part 3) lagao.

3. MAP RULE (NO FORCED MAPS):
   - Faltu me har video me map scene mat thoso! Sirf tab 'map' lagao jab katha me sthan ka bhaugolik sankat ya yatra dikhana anivarya ho. Varna card, quote ya title use karo.

4. HOOK (0-3s):
   - Scene 1 seedha katha ke mukhya rochak bindu ya sankat se shuru ho taaki audience ka dhyan turant aakarshit ho.

5. PART 1 (Scenes 1 to 6/7) - THE HOOK & CRISIS:
   - Scene 1: High-stakes curiosity hook (0-3s thumb-stopper, concrete name, year, place, or paradox).
   - Scenes 2 to 5/6: Katha ki shuruat, nayak ka sankalp, sankat ka aagaz.
   - Scene AAKHRI (Ending): Ek TEEVRA JIGYASA WALA SAWAL (High-Stakes Curiosity Question Hook) jo viewer ko Part 2 dekhne par majboor kar de! (jaise: '...Lekin kya paatal ka wo vishal jeev amrit dega, ya sab nigaal jayega?'). Stamp: 'अगला भाग'.

6. PART 2 (Scenes 1 to 6/7) - THE STRUGGLE & OBSTACLE:
   - Scene 1: Part 1 ke aakhri sawal se seedha shuru ho (KABHI BHI 'pichhle bhag me dekha tha' mat likho).
   - Scenes 2 to 5/6: Kathin sangharsh, balidan, ya kathin pariksha (Cause-and-Effect flow).
   - Scene AAKHRI (Ending): Doosra TEEVRA JIGYASA WALA SAWAL jo viewer ko Part 3 dekhne ke liye uttejit kare! (jaise: '...Lekin kya suryoday se pehle amrit pahunch payega, ya saansein tham jayengi?'). Stamp: 'अगला भाग'.

7. PART 3 (Scenes 1 to 6/7) - THE CLIMAX & SACRED VICTORY:
   - Scene 1: Antim charam seema aur divya chamatkar ka aagaz.
   - Scenes 2 to 5/6: Alaukik chamatkar, nayak/mata ki amar vijay, bhakton ko mukti ka aashirwaad.
   - Scene AAKHRI (Ending): MATA YA DEVTA KA NAAM + KATHA SAMPURNA + DIVINE JAIKARA! (jaise: 'Mata ke is divya chamatkar ne sabko jhuka diya. Boliye Jai Maa Khodiyar!' / 'Boliye Har Har Mahadev!'). Stamp: 'कथा सम्पूर्ण'.

8. BANNED PHRASES:
   - KABHI BHI 'dekhiye agle video me' ya 'dekhiye agle episode me' mat bolo.
   - KABHI BHI 'iska rahasya janiye' ya 'aankhein kholein' jaise cheap filler mat likho.

OUTPUT: STRICTLY sirf ek valid JSON object (koi markdown nahi, koi extra text nahi):
{{
  "topic_title": "{title}",
  "story_synopsis": "3-4 lines summary",
  "total_parts": 3,
  "parts": [
    {{
      "part_num": 1,
      "part_title": "Hindi title with emoji (max 50 chars)",
      "hook_line": "Scene 1 hook line",
      "end_question": "Aakhri scene ka curiosity question",
      "cliffhanger": "Aakhri scene ka dialogue",
      "part_summary": "Is part ki detailed story",
      "scenes": [
        {{
          "kind": "title",
          "emotion": "heroic",
          "narration": "Hinglish 8-12 words max",
          "tts_text": "Devanagari 8-12 words max",
          "text": "Devanagari 3-5 words",
          "stamp": "भाग 1",
          "accent": "red"
        }}
      ]
    }}
  ]
}}
"""


def load_series_state():
    """Load or initialize active series state."""
    default_state = {
        "current_index": 0,
        "active_topics": [],
        "completed_series": [],
        "total_series_completed": 0,
        "last_updated": str(datetime.datetime.now())
    }
    state = jload(STATE_FILE, default_state)
    if not isinstance(state, dict):
        state = default_state
    state.setdefault("current_index", 0)
    state.setdefault("active_topics", [])
    state.setdefault("completed_series", [])
    return state


def save_series_state(state):
    """Save active series state."""
    state["last_updated"] = str(datetime.datetime.now())
    jsave(STATE_FILE, state)


def generate_series_for_topic(topic):
    """Uses Groq LLM to write a complete connected story and split into 3 sequential parts upfront."""
    title = topic.get("title", str(topic)) if isinstance(topic, dict) else str(topic)
    summary = topic.get("summary", "") if isinstance(topic, dict) else ""
    topic_id = topic.get("topic") or re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")

    prompt = SERIES_PROMPT.format(title=title, summary=summary)
    print(f"[SeriesManager] ✍️ Writing full unified 3-part script for: '{title}'...")

    for attempt in range(3):
        try:
            raw = llm._call(prompt, max_tokens=4000).strip()
            if "{" in raw and "}" in raw:
                raw = raw[raw.index("{"): raw.rindex("}") + 1]
            data = llm._salvage_json(raw)
            parts = data.get("parts")
            if not isinstance(parts, list) or len(parts) < 2:
                raise ValueError("Must have at least 2 parts")

            # Validate each part and preserve pre-written scenes
            clean_parts = []
            for idx, p in enumerate(parts):
                p_scenes = p.get("scenes", [])
                if not isinstance(p_scenes, list) or len(p_scenes) < 4:
                    print(f"[SeriesManager] Part {idx+1} has fewer than 4 pre-written scenes, fallback will be used if needed")
                else:
                    print(f"[SeriesManager] ✅ Part {idx+1} generated with {len(p_scenes)} pre-written scenes!")

                hook_str = str(p.get("hook_line") or (p_scenes[0].get("tts_text") if p_scenes else "")).strip()
                end_q = str(p.get("end_question") or (p_scenes[-1].get("tts_text") if p_scenes else "")).strip()
                cliff_str = str(p.get("cliffhanger") or (p_scenes[-1].get("tts_text") if p_scenes else "")).strip()

                clean_parts.append({
                    "part_num": idx + 1,
                    "part_title": str(p.get("part_title") or f"{title} - भाग {idx + 1}").strip(),
                    "hook_line": hook_str,
                    "end_question": end_q,
                    "recap_bridge": str(p.get("recap_bridge") or "").strip(),
                    "cliffhanger": cliff_str,
                    "part_summary": str(p.get("part_summary") or "").strip(),
                    "scenes": p_scenes,
                    "completed": False,
                    "rendered_at": None,
                    "video_dir": None
                })

            series_obj = {
                "topic_id": topic_id,
                "topic_title": title,
                "story_synopsis": data.get("story_synopsis", summary),
                "total_parts": len(clean_parts),
                "current_part": 1,
                "created_at": str(datetime.datetime.now()),
                "parts": clean_parts
            }
            print(f"[SeriesManager] 🌟 Successfully authored full connected {len(clean_parts)}-part series for '{title}'!")
            return series_obj
        except Exception as e:
            print(f"[SeriesManager] Attempt {attempt + 1} failed: {e}")

    # Fallback 2-part structure if LLM json fails
    fallback_parts = [
        {
            "part_num": 1,
            "part_title": f"{title} - भाग 1: रहस्य और संकट",
            "hook_line": f"{title} का वह रहस्य जो आज तक कोई नहीं जान सका।",
            "end_question": "लेकिन इसके बाद जो हुआ, उसने सबको चौंका दिया?",
            "recap_bridge": "",
            "cliffhanger": "लेकिन इसके बाद जो हुआ, उसने सबको चौंका दिया।",
            "part_summary": f"{title}: कथा की शुरुआत और प्रथम अध्याय। {summary}",
            "scenes": [],
            "completed": False,
            "rendered_at": None,
            "video_dir": None
        },
        {
            "part_num": 2,
            "part_title": f"{title} - भाग 2: अंतिम चमत्कार",
            "hook_line": f"संकट के बाद अब देखिए अंतिम विजय।",
            "end_question": "",
            "recap_bridge": "",
            "cliffhanger": "यही था इस दिव्य कथा का अमर सत्य।",
            "part_summary": f"{title}: कथा का चरमोत्कर्ष, चमत्कार और अंतिम उपसंहार।",
            "scenes": [],
            "completed": False,
            "rendered_at": None,
            "video_dir": None
        }
    ]
    return {
        "topic_id": topic_id,
        "topic_title": title,
        "story_synopsis": summary,
        "total_parts": 2,
        "current_part": 1,
        "created_at": str(datetime.datetime.now()),
        "parts": fallback_parts
    }


def ensure_active_pool(state, pool_size=3):
    """Guarantees that there are exactly `pool_size` active multi-part topics."""
    active = state.get("active_topics", [])
    existing_ids = {t["topic_id"] for t in active}
    for comp in state.get("completed_series", []):
        existing_ids.add(comp.get("topic_id"))

    while len(active) < pool_size:
        # Pick fresh myth topic that isn't currently active or recently completed
        new_topic = pick_myth_topic()
        tid = new_topic.get("topic") or re.sub(r"[^a-z0-9]+", "_", new_topic.get("title", "").lower()).strip("_")
        if tid in existing_ids:
            # force generate unique
            new_topic["topic"] = f"{tid}_{len(existing_ids) + 1}"

        series_obj = generate_series_for_topic(new_topic)
        active.append(series_obj)
        existing_ids.add(series_obj["topic_id"])
        print(f"[SeriesManager] Added '{series_obj['topic_title']}' ({series_obj['total_parts']} parts) to active pool (Active: {len(active)}/{pool_size})")

    state["active_topics"] = active
    save_series_state(state)
    return state


def get_next_slot(pool_size=3):
    """
    Returns the next active topic and part to render in round-robin order.
    Format returned: (topic_obj, part_obj, slot_info)
    Guarantees that already-rendered parts recorded in the immutable ledger
    (data/rendered_parts_history.json) are NEVER repeated!
    """
    max_check_loops = pool_size * 6
    for _ in range(max_check_loops):
        state = load_series_state()
        ensure_active_pool(state, pool_size=pool_size)

        active = state["active_topics"]
        if not active:
            raise RuntimeError("No active topics available")

        # Round-robin index safely wrapped
        idx = state.get("current_index", 0) % len(active)
        topic = active[idx]
        current_part_num = topic.get("current_part", 1)

        # CHECK IMMUTABLE LEDGER: Was this part already rendered?
        if is_part_already_rendered(topic["topic_id"], current_part_num):
            print(f"[SeriesManager] 🛡️ Guard: '{topic['topic_title']}' Part {current_part_num} is already in ledger! Auto-advancing...")
            mark_slot_completed(topic["topic_id"], current_part_num)
            continue

        # Find the part object
        part = next((p for p in topic["parts"] if p["part_num"] == current_part_num), None)
        if not part:
            part = topic["parts"][-1]

        # Auto-populate pre-written scenes if missing or empty
        if not part.get("scenes") or len(part.get("scenes", [])) < 4:
            print(f"[SeriesManager] ✍️ Topic '{topic['topic_title']}' needs unified script with pre-written scenes. Generating now...")
            refreshed = generate_series_for_topic({
                "title": topic["topic_title"],
                "topic": topic["topic_id"],
                "summary": topic.get("story_synopsis", "")
            })
            if refreshed and refreshed.get("parts"):
                for p_idx, old_p in enumerate(topic["parts"]):
                    if p_idx < len(refreshed["parts"]):
                        new_p = refreshed["parts"][p_idx]
                        old_p["scenes"] = new_p.get("scenes", [])
                        old_p["part_title"] = new_p.get("part_title", old_p.get("part_title", ""))
                        old_p["hook_line"] = new_p.get("hook_line", old_p.get("hook_line", ""))
                        old_p["end_question"] = new_p.get("end_question", old_p.get("end_question", ""))
                        old_p["cliffhanger"] = new_p.get("cliffhanger", old_p.get("cliffhanger", ""))
                save_series_state(state)
                part = next((p for p in topic["parts"] if p["part_num"] == current_part_num), topic["parts"][0])

        slot_info = {
            "topic_index": idx,
            "topic_id": topic["topic_id"],
            "topic_title": topic["topic_title"],
            "current_part": current_part_num,
            "total_parts": topic["total_parts"],
            "active_pool_count": len(active),
            "is_final_part": current_part_num >= topic["total_parts"]
        }

        return topic, part, slot_info

    raise RuntimeError("Failed to resolve next slot: all topics/parts in rotation loop were already rendered")


def mark_slot_completed(topic_id, part_num, video_dir=None):
    """
    Marks the given part as completed.
    If that was the final part of the topic:
      - Moves topic to completed_series.
      - Removes it from active_topics.
      - Automatically fetches a fresh topic to keep 3 active.
    Advances round-robin pointer.
    """
    state = load_series_state()
    active = state.get("active_topics", [])

    matched_topic_idx = None
    for i, t in enumerate(active):
        if t["topic_id"] == topic_id:
            matched_topic_idx = i
            break

    if matched_topic_idx is None:
        print(f"[SeriesManager] Warning: Topic {topic_id} not found in active topics")
        # Still record to immutable ledger if possible
        record_rendered_part(topic_id, part_num, video_dir=video_dir)
        return state

    topic = active[matched_topic_idx]
    part_title = ""
    # Mark part complete
    for p in topic["parts"]:
        if p["part_num"] == part_num:
            p["completed"] = True
            p["rendered_at"] = str(datetime.datetime.now())
            part_title = p.get("part_title", "")
            if video_dir:
                p["video_dir"] = str(video_dir)

    # 📝 Record into the immutable ledger so it can NEVER be repeated
    record_rendered_part(topic_id, part_num, topic_title=topic.get("topic_title", ""), part_title=part_title, video_dir=video_dir)

    topic["current_part"] = part_num + 1

    # Check if topic is completely finished
    if topic["current_part"] > topic["total_parts"]:
        print(f"🎉 [SeriesManager] Series '{topic['topic_title']}' FULLY COMPLETED across all {topic['total_parts']} parts!")
        completed_entry = dict(topic)
        completed_entry["completed_at"] = str(datetime.datetime.now())
        state["completed_series"].append(completed_entry)
        state["total_series_completed"] = state.get("total_series_completed", 0) + 1
        active.pop(matched_topic_idx)
        print(f"[SeriesManager] Removed '{topic['topic_title']}' from active topics.")
        # Advance index without skipping since one element was popped
        if active:
            state["current_index"] = matched_topic_idx % len(active)
    else:
        # Still has pending parts: advance to the next active topic for round-robin rotation
        state["current_index"] = (matched_topic_idx + 1) % len(active)

    state["active_topics"] = active
    # Ensure active pool is refilled to 3 topics immediately
    ensure_active_pool(state, pool_size=3)
    save_series_state(state)
    return state


def print_active_series_status():
    """Prints a clear overview of active series and their parts."""
    state = load_series_state()
    active = state.get("active_topics", [])
    print("=" * 60)
    print("📺 MINDSPARK ACTIVE 3-TOPIC ROTATION STATUS")
    print("=" * 60)
    print(f"Next Topic Up: Slot #{state.get('current_index', 0) + 1}")
    for idx, t in enumerate(active):
        pointer = "👉 " if idx == state.get("current_index", 0) else "   "
        done_parts = sum(1 for p in t["parts"] if p.get("completed"))
        print(f"{pointer}Slot {idx + 1}: {t['topic_title']}")
        print(f"       Progress: Part {t['current_part']}/{t['total_parts']} (Done: {done_parts}/{t['total_parts']})")
        for p in t["parts"]:
            status_icon = "✅" if p.get("completed") else "⏳"
            print(f"         {status_icon} Part {p['part_num']}: {p['part_title']}")
    print(f"\nTotal Series Completed So Far: {len(state.get('completed_series', []))}")
    print("=" * 60)
