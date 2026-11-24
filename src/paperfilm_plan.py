"""PaperFilm plan maker: topic -> LLM -> clean scenes the PaperFilm Remotion engine can render.

Flow (used by daily_pipeline.run_paperfilm_pipeline):
    make_plan(topic, custom_script, seed)  -> {"youtube": {...}, "scenes": [...]}
    tts.narrate(scenes, ...)               -> adds durationSec + words[] to every scene
    resolve_hits(scenes)                   -> turns hit_word / hit2_word into hit / hit2 (index into words[])
"""
import re, json, random
from pathlib import Path

from common import ROOT
import llm
try:
    from hindi_numbers import normalize_hindi_numbers
except ImportError:
    try:
        from src.hindi_numbers import normalize_hindi_numbers
    except ImportError:
        def normalize_hindi_numbers(t): return t

try:
    from hinglish_utils import ensure_hinglish_narration
except ImportError:
    try:
        from src.hinglish_utils import ensure_hinglish_narration
    except ImportError:
        def ensure_hinglish_narration(n, t): return n

try:
    from geo_places import PLACES, STATE_HI_ALL, detect_place, detect_state
except ImportError:
    from src.geo_places import PLACES, STATE_HI_ALL, detect_place, detect_state

KINDS = ["title", "card", "number", "quote", "list", "map"]   # "photo" is not used: no images in the pipeline
ACCENTS = ["red", "teal", "mustard", "ink"]
DATA_DIR = ROOT / "remotion" / "src" / "cinematic" / "data"

BACKGROUNDS = [
    "village", "forest", "river_ghat", "mountains_temple", "palace_courtyard",
    "desert", "ocean_boat", "night_sky", "cave", "battlefield"
]
TIMES_OF_DAY = ["dawn", "day", "dusk", "night"]
PROPS = [
    "hut", "tree_banyan", "tree_pine", "tree_palm", "cow", "boat", "well",
    "diya", "fire", "banner", "cloud", "bird", "bell", "chariot", "bow",
    "mace", "crown", "pot"
]
CHAR_BUILDS = ["normal", "muscular", "slender", "elder"]
CHAR_TYPES = ["warrior", "king", "rishi", "commoner", "deity", "guard"]
CHAR_POSES = ["idle_breath", "blink", "walk", "run", "sit", "bow", "point", "raise_hands", "talk"]
CHAR_EMOTIONS = ["calm", "fierce", "joy", "sorrow"]
CAMERA_PRESETS = ["push-in", "pull-out", "pan", "orbit", "crane"]
TRANSITIONS = ["slide", "tear", "fold", "page-turn"]


def derive_paper_spec(spec, seed, scene_idx, context_text=""):
    """
    Validates LLM-supplied paper_spec against the library.
    If missing or invalid, derives a rich, seeded spec matching context_text.
    Two videos will never share the same opening, background, camera path or closing effect!
    """
    rnd = random.Random((seed or 42) + scene_idx * 1337)
    ctx = str(context_text).lower()

    # 1. Determine Background
    bg = None
    if isinstance(spec, dict) and spec.get("bg") in BACKGROUNDS:
        bg = spec["bg"]
    else:
        if any(w in ctx for w in ["युद्ध", "लड़ाई", "battle", "सेना", "तलवार", "वीर", "रक्त", "बाजीप्रभु", "पवनखिंड"]):
            bg = "battlefield"
        elif any(w in ctx for w in ["मंदिर", "temple", "पहाड़", "शिखर", "तीर्थ", "शिव", "कैलाश", "पूजा", "घंटी"]):
            bg = "mountains_temple"
        elif any(w in ctx for w in ["गंगा", "नदी", "घाट", "river", "जल", "स्नान", "काशी", "वाराणसी"]):
            bg = "river_ghat"
        elif any(w in ctx for w in ["महल", "दरबार", "राजा", "सिंहासन", "राजधानी", "किला", "palace"]):
            bg = "palace_courtyard"
        elif any(w in ctx for w in ["जंगल", "वन", "forest", "पेड़", "ऋषि", "आश्रम", "तपस्या"]):
            bg = "forest"
        elif any(w in ctx for w in ["गुफा", "cave", "अमरनाथ", "रहस्य", "तहखाना"]):
            bg = "cave"
        elif any(w in ctx for w in ["समुद्र", "सागर", "नाव", "द्वारका", "डूबी", "ocean"]):
            bg = "ocean_boat"
        elif any(w in ctx for w in ["रात", "रात्रि", "night", "अंधकार", "तारे", "चाँद"]):
            bg = "night_sky"
        elif any(w in ctx for w in ["रेगिस्तान", "मरुस्थल", "dune", "desert", "रेत"]):
            bg = "desert"
        elif any(w in ctx for w in ["गाँव", "गांव", "कुआं", "झोपड़ी", "किसान", "village"]):
            bg = "village"
        else:
            bg = rnd.choice(BACKGROUNDS)

    variant = spec.get("variant") if isinstance(spec, dict) and isinstance(spec.get("variant"), int) and 0 <= spec["variant"] <= 2 else rnd.choice([0, 1, 2])
    time_of_day = spec.get("timeOfDay") if isinstance(spec, dict) and spec.get("timeOfDay") in TIMES_OF_DAY else (
        "night" if bg == "night_sky" else rnd.choice(["dawn", "day", "dusk", "night"])
    )

    # 2. Props
    props = []
    if isinstance(spec, dict) and isinstance(spec.get("props"), list):
        for p in spec["props"]:
            if isinstance(p, dict) and p.get("type") in PROPS:
                props.append({
                    "type": p["type"],
                    "x": int(p.get("x", 540)),
                    "y": int(p.get("y", 1250)),
                    "scale": float(p.get("scale", 1.0)),
                    "flip": bool(p.get("flip", False)),
                })
    if not props:
        if bg == "battlefield":
            props = [{"type": "banner", "x": 300, "y": 1280, "scale": 1.1}, {"type": "fire", "x": 780, "y": 1320, "scale": 1.0}]
        elif bg == "mountains_temple":
            props = [{"type": "diya", "x": 450, "y": 1260, "scale": 0.9}, {"type": "bell", "x": 640, "y": 950, "scale": 0.9}]
        elif bg == "village":
            props = [{"type": "tree_banyan", "x": 220, "y": 1200, "scale": 1.0}, {"type": "well", "x": 750, "y": 1300, "scale": 0.9}]
        elif bg == "river_ghat":
            props = [{"type": "diya", "x": 420, "y": 1400, "scale": 0.9}, {"type": "boat", "x": 780, "y": 1360, "scale": 0.9}]
        else:
            p_type = rnd.choice(["fire", "diya", "banner", "cloud", "tree_pine", "tree_palm"])
            props = [{"type": p_type, "x": rnd.randint(250, 800), "y": rnd.randint(1100, 1400), "scale": 1.0}]

    # 3. Characters
    characters = []
    if isinstance(spec, dict) and isinstance(spec.get("characters"), list):
        for c in spec["characters"]:
            if isinstance(c, dict):
                c_type = c.get("type") if c.get("type") in CHAR_TYPES else "warrior"
                c_pose = c.get("pose") if c.get("pose") in CHAR_POSES else "idle_breath"
                c_build = c.get("build") if c.get("build") in CHAR_BUILDS else "normal"
                c_emotion = c.get("emotion") if c.get("emotion") in CHAR_EMOTIONS else "calm"
                characters.append({
                    "type": c_type,
                    "pose": c_pose,
                    "build": c_build,
                    "emotion": c_emotion,
                    "x": int(c.get("x", 540)),
                    "y": int(c.get("y", 1250)),
                    "scale": float(c.get("scale", 1.1)),
                    "flip": bool(c.get("flip", False)),
                })
    if not characters:
        c_type = "warrior" if bg == "battlefield" else ("rishi" if bg == "forest" else ("king" if bg == "palace_courtyard" else "warrior"))
        c_pose = "talk" if scene_idx == 0 else rnd.choice(["idle_breath", "point", "talk", "walk"])
        characters = [{
            "type": c_type,
            "pose": c_pose,
            "build": "muscular" if c_type == "warrior" else "normal",
            "emotion": "fierce" if bg == "battlefield" else "calm",
            "x": 540,
            "y": 1250,
            "scale": 1.15
        }]

    # 4. Camera preset (Never a fixed camera)
    cam_move = None
    if isinstance(spec, dict) and isinstance(spec.get("camera"), dict) and spec["camera"].get("move") in CAMERA_PRESETS:
        cam_move = spec["camera"]["move"]
    else:
        cam_presets_order = ["push-in", "pull-out", "pan", "orbit", "crane"]
        cam_move = cam_presets_order[(scene_idx + rnd.randint(0, 4)) % len(cam_presets_order)]

    cam_speed = float(spec["camera"].get("speed", 1.0)) if (isinstance(spec, dict) and isinstance(spec.get("camera"), dict)) else 1.0

    # 5. Transitions
    trans = None
    if isinstance(spec, dict) and spec.get("transition") in TRANSITIONS:
        trans = spec["transition"]
    else:
        trans = rnd.choice(TRANSITIONS)

    scene_seed = (rnd.randint(1000, 99999) + scene_idx * 997)

    return {
        "bg": bg,
        "variant": variant,
        "timeOfDay": time_of_day,
        "props": props,
        "characters": characters,
        "camera": {"move": cam_move, "speed": cam_speed},
        "transition": trans,
        "seed": scene_seed,
    }



GEO_LORE = {
    "pawankhind": {"state": "Maharashtra", "district": "Kolhapur", "name": "पावनखिंड", "lat": 16.89, "lon": 73.83, "aliases": ["पावनखिंड", "बाजीप्रभु", "विशालगढ़", "baji", "pawankhind"]},
    "somnath": {"state": "Gujarat", "district": "Gir Somnath", "name": "सोमनाथ मंदिर", "lat": 20.8880, "lon": 70.4012, "aliases": ["सोमनाथ", "somnath"]},
    "dwarka": {"state": "Gujarat", "district": "Devbhumi Dwarka", "name": "द्वारकाधीश", "lat": 22.2376, "lon": 68.9674, "aliases": ["द्वारका", "dwarka"]},
    "pabuji": {"state": "Rajasthan", "district": "Nagaur", "name": "कोलूमण्ड", "lat": 27.05, "lon": 72.85, "aliases": ["पाबूजी", "राठौड़", "pabuji", "चारणी"]},
    "amarkantak": {"state": "Madhya Pradesh", "district": "Anuppur", "name": "अमरकंटक", "lat": 22.67, "lon": 81.75, "aliases": ["अमरकंटक", "शोणदेश", "amarkantak", "shonadesh"]},
    "padmanabhaswamy": {"state": "Kerala", "district": "Thiruvananthapuram", "name": "पद्मनाभस्वामी", "lat": 8.4830, "lon": 76.9436, "aliases": ["पद्मनाभस्वामी", "padmanabha"]},
    "ellora": {"state": "Maharashtra", "district": "Aurangabad", "name": "एलोरा कैलाश", "lat": 20.0238, "lon": 75.1793, "aliases": ["एलोरा", "कैलाश मंदिर", "ellora"]},
    "konark": {"state": "Odisha", "district": "Puri", "name": "कोणार्क सूर्य मंदिर", "lat": 19.8876, "lon": 86.0945, "aliases": ["कोणार्क", "konark"]},
    "lepakshi": {"state": "Andhra Pradesh", "district": "Sri Sathya Sai", "name": "लेपाक्षी मंदिर", "lat": 13.8041, "lon": 77.6067, "aliases": ["लेपाक्षी", "lepakshi"]},
    "amarnath": {"state": "Jammu and Kashmir", "name": "अमरनाथ गुफा", "lat": 34.2157, "lon": 75.5036, "aliases": ["अमरनाथ", "amarnath", "कश्मीर"]},
    "pushkar": {"state": "Rajasthan", "district": "Ajmer", "name": "पुष्कर", "lat": 26.49, "lon": 74.55, "aliases": ["पुष्कर", "मणिबंध", "pushkar"]},
    "kashi": {"state": "Uttar Pradesh", "district": "Varanasi", "name": "काशी विश्वनाथ", "lat": 25.3109, "lon": 83.0107, "aliases": ["काशी", "वाराणसी", "kashi"]},
    "ayodhya": {"state": "Uttar Pradesh", "district": "Ayodhya", "name": "अयोध्या धाम", "lat": 26.7922, "lon": 82.1998, "aliases": ["अयोध्या", "ayodhya"]},
    "kurukshetra": {"state": "Haryana", "district": "Kurukshetra", "name": "कुरुक्षेत्र", "lat": 29.9695, "lon": 76.8783, "aliases": ["कुरुक्षेत्र", "kurukshetra"]},
    "hampi": {"state": "Karnataka", "district": "Vijayanagara", "name": "हम्पी विजयनगर", "lat": 15.3350, "lon": 76.4600, "aliases": ["हम्पी", "hampi", "विजयनगर"]},
    "khodiyar": {"state": "Gujarat", "district": "Bhavnagar", "name": "राजपरा खोडियार धाम", "lat": 21.7645, "lon": 72.1519, "aliases": ["खोडियार", "khodiyar", "मगरमच्छ"]},
    "vimala": {"state": "Odisha", "district": "Puri", "name": "विमला शक्तिपीठ (पुरी)", "lat": 19.8049, "lon": 85.8179, "aliases": ["विमला", "vimala", "रोहिणी कुंड", "rohini"]},
    "godavari": {"state": "Andhra Pradesh", "district": "East Godavari", "name": "कोटिलिंगेश्वर (राजमहेंद्रवरम)", "lat": 16.9891, "lon": 81.7770, "aliases": ["गोदावरी", "godavari", "राजमहेंद्रवरम", "rajahmundry", "कोटिलिंगेश्वर", "kotilingeshwar", "सर्वशैल"]},
}

STATE_HI = {
    "Maharashtra": "महाराष्ट्र", "Gujarat": "गुजरात", "Rajasthan": "राजस्थान",
    "Madhya Pradesh": "मध्य प्रदेश", "Uttar Pradesh": "उत्तर प्रदेश",
    "Kerala": "केरल", "Karnataka": "कर्नाटक", "Odisha": "ओडिशा",
    "Andhra Pradesh": "आंध्र प्रदेश", "Jammu and Kashmir": "जम्मू-कश्मीर",
    "Haryana": "हरियाणा", "Punjab": "पंजाब", "Bihar": "बिहार", "West Bengal": "पश्चिम बंगाल",
    "Uttarakhand": "उत्तराखंड", "Himachal Pradesh": "हिमाचल प्रदेश", "Assam": "असम",
    "Tamil Nadu": "तमिलनाडु", "Telangana": "तेलंगाना",
}


# the old 18 hand-written places stay; the big gazetteer (geo_places.py) adds ~65 more (shaktipeeth, jyotirlinga, forts ...)
for _k, _v in PLACES.items():
    GEO_LORE.setdefault(_k, _v)
for _st, _hi in STATE_HI_ALL.items():
    STATE_HI.setdefault(_st, _hi)


def _detect_geo(topic, extra_text=""):
    """place (exact) -> else a gazetteer place named anywhere in the text -> else just the state -> else None"""
    if not isinstance(topic, dict):
        topic = {"title": str(topic)}
    hay = " ".join(str(topic.get(k, "")) for k in ("title", "summary", "topic", "topic_title")).lower()
    for k, data in GEO_LORE.items():
        if k in hay:
            return data
        for al in data.get("aliases", []):
            if al.lower() in hay:
                return data
    full = hay + " " + (extra_text or "").lower()
    return detect_place(full) or detect_state(full)


def _load_geo():
    states, districts = [], {}
    try:
        for f in json.loads((DATA_DIR / "india-states.json").read_text(encoding="utf-8")):
            states.append(f["n"])
        for f in json.loads((DATA_DIR / "india-districts.json").read_text(encoding="utf-8")):
            districts.setdefault(f.get("s"), set()).add(f["n"])
    except Exception as e:
        print(f"[PaperFilm] geo data not readable ({e}) - map scenes will be turned into cards")
    return states, districts


_PROMPT = """Tum ek anubhavi Hindi kahani-kaar aur viral YouTube Shorts / Instagram Reels scriptwriter ho jo YouTube Shorts ke liye "paper-cut film" style video ka script likhte ho.
Ek kahani ko __N__ chhote scenes me todo. Har scene ek torn paper card jaisa dikhega: bada text, ek stamp ya highlight, aur cinematic voiceover.

__CONTEXT__

VIRAL REELS SCRIPTING FRAMEWORK (HIGH-RETENTION RULES):
1. HOOK TAXONOMY (0-3s / Scene 1) - SCROLL-STOPPING PATTERN INTERRUPT:
   - Pehle 3 second me thumb-stop hona chahiye.
   - KABHI BHI "I" ya generic prastavana ("aaj ke video me", "doston suniye", "chaliye jaante hain") mat bolo!
   - Proven Viral Hook Patterns:
     * High-Stakes Paradox: "San 1660 mein, 300 Maratha veeron ne 4000 ki sena ko akele kaise rok diya?"
     * Bold Historic/Spiritual Truth: "Puri Jagannath mandir ka wo rahasya, jise vigyan bhi nahi suljha paya!"
     * Deep Sensory Mystery: "Gufa ke andar se aati wo aawaz aam nahi thi... wo ek devta ki chetavani thi!"
   - ZERO DUPLICATION: Hook aur Scene 1 ki pehli line me koi sthan ya shabd 2 baar repeat nahi hona chahiye!
   - KABHI BHI "पिछले भाग में देखा था" ya dry recap mat likho! Seedha fresh ghatna se shuru karo.

2. PACING & CORE BEATS (2 KEY BEATS MAXIMUM PER VIDEO):
   - Har video me zyada se zyada 2 CORE PLOT BEATS ho, 3+ points se kahani bheed-bhad aur rushed lagti hai.
   - STAGE 1: HOOK (0-4s) - Strike curiosity, establish hero/place/stakes.
   - STAGE 2: VALUE & CONFLICT (5-25s) - Asli katha ka cause-and-effect progression: Nayak ka vachan, sankat, ya kshatriya dharm ki raksha.
   - STAGE 3: CLIMAX & TURNING POINT (26-38s) - Sankat charam par pahunchta hai, aakhri ghadi ka sangharsh ya chamatkar.
   - STAGE 4: CLIFFHANGER / SACRED LOOP (38-42s):
     * Non-final part: Solid Narrative Cliffhanger (jaise: '...aur tabhi samandar se uthi aisi pralayankari lehar, jisne aakash ko hila diya!') (Screen Stamp: 'अगला भाग'). KABHI BHI 'dekhiye agle episode' mat bolo!
     * Final part: Divya chamatkar aur pavitra antim jaikara (jaise: 'बोलिए हर हर महादेव!' / 'बोलिए जय श्री कृष्ण!') (Screen Stamp: 'कथा सम्पूर्ण').

3. SENTENCE-LEVEL RETENTION & AUDIO PACING:
   - Chhote vaakya (STRICTLY 8-12 words per scene narration).
   - Flowing sentence rhythm: 3 ya zyada toote hue tukde (staccato fragments) mat banao, unhe ek pravahi vakya me jodo.
   - Never state the conclusion early: tathya aur ghatnayen khud suspense banayein.
   - KABHI BHI "इसका रहस्य जानिए", "जानिए इसका रहस्य", "रहस्य जानिए", "आँखें खोलें", "कदम बढ़ाएँ" jaise cheap filler phrases mat likho!
   - PUNCTUATION-DRIVEN EMOTION: TTS aawaz me natural emotion laane ke liye sahi viram-chinh use karo: vismay ke liye `!`, jigyasa ke liye `?`, thehraav ke liye `...`, aur natakiya mod ke liye `—`. (Bracketed tags jaise [whispers] mat likho).

OUTPUT: sirf ek JSON object (koi markdown nahi, koi explanation nahi):
{
  "youtube": {"title": "Hindi title with emoji, max 60 chars, concrete proper name/number", "description": "3-4 line Hindi description + hashtags", "tags": ["..."]},
  "scenes": [
    {
      "kind": "title | card | number | quote | list | map",
      "emotion": "heroic | suspense | conversational | emotional | divine (har scene ka bhav)",
      "narration": "STRICTLY Hinglish (Hindi bolchal in Roman / English alphabet, jaise WhatsApp par likhte hain: 'Shivaji Maharaj Vishalgadh mein ghire hue the'). KABHI BHI English bhasha ke words (jaise 'were trapped', 'surrounded by', 'facing', 'their eyes') mat likho! Ye video screen par LYRICS / SUBTITLE banegi, STRICTLY 8-12 words max.",
      "tts_text": "WAHI line shuddh Devanagari Hindi me, voice ke liye. Numbers aur Saal (years) bilkul shabdon me likho (jaise 1660 ko 'सन सोलह सौ साठ', 1947 ko 'सन उन्नीस सौ सैंतालीस', 300 ko 'तीन सौ', 4000 ko 'चार हज़ार'). Kabhi bhi 'सौ छह सौ' ya toote shabdon me mat likho.",
      "text": "Screen par bada text, Devanagari, max 6 words",
      "sub": "chhoti line (optional), max 6 words",
      "hit_word": "narration ka ek word jis par effect (highlight / stamp) lage - narration se hu-ba-hu copy karo",
      "stamp": "optional lal stamp, 1-3 words Devanagari (sirf 2-3 scenes me)",
      "accent": "red | teal | mustard | ink"
    }
  ]
}

KIND ke extra fields:
- number: "number": 1500 (sirf ank, JSON number), "unit": "साल" ya "%" ya "करोड़" (optional).
- list: "items": ["max 4 words", "max 4 words", "max 4 words"]  (3 items).
- quote: "text" = kisi paatra ka dialogue, "sub" = kisne bola.
- paper_spec (OPTIONAL, Handcrafted 2D Paper Stage visual scene spec):
    "bg": "village | forest | river_ghat | mountains_temple | palace_courtyard | desert | ocean_boat | night_sky | cave | battlefield",
    "variant": 0,
    "timeOfDay": "dawn | day | dusk | night",
    "camera": {"move": "push-in | pull-out | pan | orbit | crane", "speed": 1.0},
    "transition": "slide | tear | fold | page-turn"
- map: sirf tab jab kahani Bharat ki kisi asli jagah par ho. Fields:
    "state": __STATES__ me se EXACT ek naam (English),
    "district": "English zila (optional, pakka ho tabhi)",
    "place": {"name": "jagah ka naam Devanagari me", "lat": 22.2376, "lon": 68.9674},
    "text": "भारत → राज्य → जगह"  (teen naam, → se alag),
    "hit_word": narration ka wo word jab RAJYA ka naam bola jata hai,
    "hit2_word": narration ka wo word jab JAGAH ka naam bola jata hai.
  Poore video me zyada se zyada 1 map scene, aur wo scene 2 ya 3 me.

RULES:
1. Scene 1 hamesha kind "title" ho: 3 second ka hook, kahani ka naam ya sabse chaunkane wali baat.
2. Aakhri scene me kahani ka antim prabhavshali sandesh/conclusion ho. KABHI BHI 'subscribe kare' ya 'like kare' ya channel promotion mat bolo.
3. Kahani ke asli naam, jagah aur ghatnayen use karo. Kuch bhi apni taraf se mat gadho. Ek hi kind lagatar 3 baar mat lagao.
4. Beech ke scenes me kam se kam 1 "quote" ya "number" ho agar kahani me dialogue ya ank ho.
5. STRICT TIMELINE RULE: Poora video STRICTLY 38 se 45 second ka hona chahiye (kabhi bhi 45s se upar na jaye). Har scene narration STRICTLY 8 se 12 words ki concise aur fast-paced ho!
6. JSON compact rakho, trailing comma mat lagao.
"""


def _context(topic, custom_script):
    title = topic.get("title", str(topic)) if isinstance(topic, dict) else str(topic)
    summary = topic.get("summary", "") if isinstance(topic, dict) else ""
    key = topic.get("topic", "") if isinstance(topic, dict) else ""
    if custom_script:
        return (f"KAHANI (user ne di hai, isi ko faithfully adapt karo, koi aur kahani nahi):\n"
                f"Title: {title}\n\"\"\"{custom_script}\"\"\"")
    lore = None
    hay = f"{key} {title} {summary}".lower()
    for k, data in getattr(llm, "HISTORICAL_LORE", {}).items():
        if k in hay or any(p in hay for p in k.split("_") if len(p) > 3):
            lore = data
            break
    if lore:
        return ("ASLI ITIHAAS / PURAN DOSSIER (isi par tike raho):\n"
                f"Title: {lore.get('title')}\nNayak: {lore.get('protagonist')}\n"
                f"Khalnayak: {lore.get('antagonist', '')}\nSankat: {lore.get('crisis')}\n"
                f"Chamatkar: {lore.get('miracle', lore.get('miracle_climax', ''))}\n"
                f"Climax: {lore.get('climax', '')}\n"
                f"In naamo ko zaroor bolo: {', '.join(lore.get('mandatory_names', []))}\n"
                f"Dialogues: {lore.get('sample_dialogues', [])}")
    return f"KAHANI: {title}\nSummary: {summary}"


def _norm(t):
    return re.sub(r"[^\w\u0900-\u097F]+", "", str(t).lower())


def _num(v):
    try:
        return float(v)
    except Exception:
        return None


def clean_plan(plan, seed=None):
    """Make the LLM output safe for the engine. Returns the plan or raises ValueError."""
    scenes = plan.get("scenes") if isinstance(plan, dict) else None
    if not isinstance(scenes, list) or len(scenes) < 4:
        raise ValueError("plan has fewer than 4 scenes")
    states, districts = _load_geo()
    out = []
    for i, s in enumerate(scenes):
        if not isinstance(s, dict):
            continue
        narr = str(s.get("narration") or "").strip()
        if not narr:
            continue
        kind = s.get("kind") if s.get("kind") in KINDS else "card"
        sc = {
            "kind": kind,
            "narration": narr,
            "tts_text": str(s.get("tts_text") or "").strip() or narr,
            "text": str(s.get("text") or "").strip() or narr.split(".")[0][:40],
        }
        if s.get("sub"):
            sc["sub"] = str(s["sub"]).strip()
        if s.get("hit_word"):
            sc["hit_word"] = str(s["hit_word"]).strip()
        if s.get("stamp"):
            sc["stamp"] = str(s["stamp"]).strip()[:24]
        if s.get("accent") in ACCENTS:
            sc["accent"] = s["accent"]

        if kind == "number":
            n = _num(s.get("number"))
            if n is None:
                sc["kind"] = "card"
            else:
                sc["number"] = n
                if s.get("unit"):
                    sc["unit"] = str(s["unit"]).strip()
        elif kind == "list":
            items = [str(x).strip() for x in (s.get("items") or []) if str(x).strip()][:4]
            if len(items) < 2:
                sc["kind"] = "card"
            else:
                sc["items"] = items
        elif kind == "map":
            st = next((n for n in states if n.lower() == str(s.get("state") or "").strip().lower()), None)
            if not st:
                sc["kind"] = "card"
                sc["text"] = re.sub(r"\s*→\s*", " ", sc["text"]).strip()
            else:
                sc["state"] = st
                d = str(s.get("district") or "").strip()
                if d and d in districts.get(st, set()):
                    sc["district"] = d
                pl = s.get("place") if isinstance(s.get("place"), dict) else None
                if pl and _num(pl.get("lat")) is not None and _num(pl.get("lon")) is not None and pl.get("name"):
                    sc["place"] = {"name": str(pl["name"]).strip(), "lat": _num(pl["lat"]), "lon": _num(pl["lon"])}
                    if s.get("hit2_word"):
                        sc["hit2_word"] = str(s["hit2_word"]).strip()
                if s.get("span") and _num(s["span"]):
                    sc["span"] = max(0.3, min(4.0, _num(s["span"])))

        # Validate / enrich paper_spec for 2D paper stage engine
        context_str = f"{sc.get('text', '')} {sc.get('narration', '')} {sc.get('tts_text', '')}"
        sc["paper_spec"] = derive_paper_spec(s.get("paper_spec"), seed, i, context_str)
        out.append(sc)

    if len(out) < 4:
        raise ValueError("fewer than 4 usable scenes")
    # Cap at 11 scenes max for 45-50s timeline
    if len(out) > 11:
        out = out[:10] + [out[-1]]
    # only one map scene
    seen_map = False
    for sc in out:
        if sc["kind"] == "map":
            if seen_map:
                sc["kind"] = "card"
                sc["text"] = re.sub(r"\s*→\s*", " ", sc["text"]).strip()
            seen_map = True
    if out[0]["kind"] not in ("map", "title"):
        out[0]["kind"] = "title"
    out[0].pop("items", None)
    out[0].pop("number", None)

    # Stamp deduplication: only 1 'भाग X' stamp allowed (on Scene 0)
    seen_part_stamp = False
    for sc in out:
        st = sc.get("stamp", "")
        if "भाग" in st and "अगला" not in st and "सम्पूर्ण" not in st:
            if seen_part_stamp:
                sc.pop("stamp", None)
            else:
                seen_part_stamp = True

    # Clean up any subscribe / channel promotion mentions across all scenes
    for sc in out:
        for k in ["narration", "tts_text", "text", "sub"]:
            if k in sc and isinstance(sc[k], str):
                sc[k] = re.sub(r"(?i)\s*(?:aisi\s+aur\s+gathaon\s+ke\s+liye\s+)?(?:mindspark|माइंडस्पार्क)\s*(?:ko|को)?\s*(?:subscribe|सब्सक्राइब)\s*(?:karein?|करें)?[.!।]?", "", sc[k]).strip()
                sc[k] = re.sub(r"(?i)\s*(?:subscribe|सब्सक्राइब)\s*(?:karein?|करें)?[.!।]?", "", sc[k]).strip()
        # Voiceover should say natural "dekhiye agle video mein" instead of robotic "dekhiye bhaag 2"
        for k in ["narration", "tts_text"]:
            if k in sc and isinstance(sc[k], str):
                sc[k] = re.sub(r"(?i)\b(?:dekhiye|janein?|jaaniye)?\s*(?:bhaag|bhag|part)\s*(?:\d+|do|teen|char|2|3|4)\s*(?:mein|me)?\b", "dekhiye agle video mein", sc[k])
                sc[k] = re.sub(r"(?i)\b(?:bhaag|bhag|part)\s*(?:\d+|do|teen|char|2|3|4)\b", "agle video", sc[k])
                sc[k] = re.sub(r"(?i)(?:देखिए|जानें|जानिए)?\s*भाग\s*(?:\d+|दो|तीन|चार|२|३|४)\s*(?:में)?", "देखिए अगले वीडियो में", sc[k])
                sc[k] = re.sub(r"(?i)भाग\s*(?:\d+|दो|तीन|चार|२|३|४)", "अगले वीडियो", sc[k])

        # Normalize numbers & historical years in tts_text so voice speaks proper words (e.g. 1660 -> सन सोलह सौ साठ)
        if sc.get("tts_text"):
            sc["tts_text"] = normalize_hindi_numbers(sc["tts_text"])

        # Ensure narration is STRICTLY Hinglish (screen lyrics in Roman Hindi, never pure English)
        if sc.get("tts_text"):
            sc["narration"] = ensure_hinglish_narration(sc.get("narration", ""), sc["tts_text"])

    y = plan.get("youtube") if isinstance(plan.get("youtube"), dict) else {}
    if y.get("title") and len(y["title"]) > 60:
        y["title"] = y["title"][:60].rstrip()
    return {"youtube": y, "scenes": out}


def _clean_stutters(text: str) -> str:
    if not text:
        return ""
    # Remove duplicate repeated phrases up to 4 words (e.g. "Madhya Pradesh ke Amarkantak mein")
    t = re.sub(r'([\u0900-\u097F\w]+(?:\s+[\u0900-\u097F\w]+){0,3})\s*[,]?\s+\1', r'\1', text, flags=re.IGNORECASE)
    # Remove repeated particles "mein mein", "में में", "ke ke"
    t = re.sub(r'(?i)\b(mein|के|ke|ki|की)\s*[,]?\s+\1\b', r'\1', t)
    # Clean consecutive commas or excessive spaces
    t = re.sub(r'\s*,\s*,\s*', ', ', t)
    return re.sub(r'\s+', ' ', t).strip(' ,')


def make_series_part_plan(topic, part, slot_info, seed=None):
    """Creates a strictly 35-45s PaperFilm plan for a specific Part in a multi-part series."""
    rnd = random.Random(seed)
    states, _ = _load_geo()
    topic_title = topic.get("topic_title") or topic.get("title") or "पौराणिक गाथा"
    part_num = slot_info.get("current_part", 1)
    tot_parts = slot_info.get("total_parts", 2)
    is_final = slot_info.get("is_final_part", False)
    geo = _detect_geo(topic)

    st_hi = {
        "Maharashtra": "महाराष्ट्र", "Gujarat": "गुजरात", "Rajasthan": "राजस्थान",
        "Madhya Pradesh": "मध्य प्रदेश", "Uttar Pradesh": "उत्तर प्रदेश",
        "Kerala": "केरल", "Karnataka": "कर्नाटक", "Odisha": "ओडिशा",
        "Andhra Pradesh": "आंध्र प्रदेश", "Jammu and Kashmir": "जम्मू-कश्मीर",
        "Haryana": "हरियाणा", "Punjab": "पंजाब", "Bihar": "बिहार",
    }.get(geo["state"] if geo else "", geo["state"] if geo else "")

    # 0. Check if scenes are already pre-written in unified full-story pass
    pre_scenes = part.get("scenes")
    if isinstance(pre_scenes, list) and len(pre_scenes) >= 4:
        print(f"[PaperFilm] 🎬 Using pre-written unified scenes for Part {part_num}/{tot_parts} (zero drift/hallucination)!")
        plan = {
            "youtube": {
                "title": f"{part.get('part_title', topic_title)} | MindSpark",
                "description": f"{part.get('part_title', topic_title)}\n\n#Shorts #Sanatan #MindSpark #History",
                "tags": ["MindSpark", "Shorts", "Sanatan", "Hindi"]
            },
            "scenes": [dict(s) for s in pre_scenes]
        }
        plan = clean_plan(plan, seed)
        scenes = plan["scenes"]

        # Smart Map Detection: JAHAN KISI JAGAH KA NAAM AAYE, WAHAN MAP SCENE AAYEGA!
        if geo:
            map_scene_idx = None
            for idx, sc in enumerate(scenes):
                if sc.get("kind") == "map":
                    map_scene_idx = idx
                    break
            if map_scene_idx is None:
                aliases = [geo["name"].lower()] + [al.lower() for al in geo.get("aliases", [])] + [geo["state"].lower(), st_hi.lower()]
                for idx, sc in enumerate(scenes):
                    sc_text = (sc.get("narration", "") + " " + sc.get("tts_text", "") + " " + sc.get("text", "")).lower()
                    if any(a in sc_text for a in aliases if len(a) > 2):
                        map_scene_idx = idx
                        break
            if map_scene_idx is None and len(scenes) > 2:
                map_scene_idx = 1   # no scene names the place: still show the map on scene 2
            if map_scene_idx is not None:
                for idx, sc in enumerate(scenes):
                    if idx == map_scene_idx:
                        sc["kind"] = "map"
                        sc["state"] = geo["state"]
                        if geo.get("district"):
                            sc["district"] = geo["district"]
                        if geo.get("lat") is not None:
                            sc["place"] = {"name": geo["name"], "lat": geo["lat"], "lon": geo["lon"]}
                        sc["text"] = f"भारत → {st_hi}" if geo.get("state_only") else f"भारत → {st_hi} → {geo['name']}"
                        sc["hit_word"] = st_hi if st_hi in sc.get("tts_text", "") else geo["state"]
                        sc["hit2_word"] = geo["name"].split()[0]
                    elif sc.get("kind") == "map":
                        sc["kind"] = "card"
                        sc["text"] = re.sub(r"\s*→\s*", " ", sc.get("text", "")).strip()

        # STAMPS RULE: Only Scene 0 (Hook) gets 'भाग X' once!
        # Intermediate scenes (1 to N-2) MUST NOT have 'भाग X' or repetitive popups.
        scenes[0]["stamp"] = f"भाग {part_num}"
        for sc in scenes[1:-1]:
            if sc.get("stamp") and ("भाग" in sc["stamp"] or sc["stamp"].startswith("भाग")):
                del sc["stamp"]
        if is_final:
            scenes[-1]["stamp"] = "कथा सम्पूर्ण"
        else:
            scenes[-1]["stamp"] = "अगला भाग"

        # Apply destutter, Hindi number normalizer, and Shiva chant fix
        for sc in scenes:
            if "tts_text" in sc:
                sc["tts_text"] = normalize_hindi_numbers(sc["tts_text"])
                if is_final:
                    sc["tts_text"] = re.sub(r'(?<!हर\s)हर\s+महादेव', 'हर हर महादेव', sc["tts_text"])
            if "narration" in sc:
                sc["narration"] = _clean_stutters(sc["narration"])

        return plan

    part_ctx = (
        f"KAHANI: {topic_title}\n"
        f"YE HAI: BHAG {part_num} (Kul {tot_parts} bhag me se)\n"
        f"PART TITLE: {part.get('part_title')}\n"
        f"IS BHAG KI ASLI KATHA (Real sequential story to narrate):\n{part.get('part_summary')}\n"
        f"HOOK LINE: {part.get('hook_line')}\n"
        f"RECAP BRIDGE: {part.get('recap_bridge')}\n"
        f"CLIFFHANGER: {part.get('cliffhanger')}\n\n"
        f"CRITICAL STORYTELLING RULES:\n"
        f"1. YE KOI TRAILER NAHI HAI! KABHI BHI disjointed cinematic teaser dialogues mat likho. Asli katha sunao.\n"
    )
    if geo:
        part_ctx += (
            f"2. CRITICAL HOOK & MAP RULES (HAR BHAAG ME MAP ZAROORI HAI):\n"
            f"   - SCENE 1 (THE HOOK): STRICTLY KIND 'title' ya 'card'.\n"
            f"     * KABHI BHI 'पिछले भाग में देखा था' ya 'पिछले भाग में हमने देखा' se shuru mat karo! KABHI NAHI!\n"
            f"     * Scene 1 hamesha ek DAMDAAR, CHOWKANE WALE SAWAL (Curiosity Question Hook) se shuru hoga taaki audience turant ruk jaye!\n"
            f"     * Udaharan: '{geo['name']} mein Sati ka ansh girte hi Bhairav ne kya bhayanak pratigya li thi?'\n"
            f"   - SCENE 2 (THE MAP SCENE): STRICTLY KIND 'map' HOGA (Bharat ke naksha zoom hokar rajya aur jagah dikhayega)!\n"
            f"     * 'state': '{geo['state']}'\n"
            f"     * 'district': '{geo.get('district', '')}'\n"
            f"     * 'place': {json.dumps({'name': geo['name'], 'lat': geo['lat'], 'lon': geo['lon']}, ensure_ascii=False)}\n"
            f"     * 'text': 'भारत → {geo['state']} → {geo['name']}'\n"
            f"     * 'hit_word': Narration ka wo word jab '{geo['state']}' bola jaye\n"
            f"     * 'hit2_word': Narration ka wo word jab '{geo['name'].split()[0]}' bola jaye\n"
            f"     * Narration me rajya aur jagah ka naam zaroor aana chahiye (jaise '{geo['state']} ke {geo['name']} mein Bhairav ne sthapana ki!')\n"
            f"   - Scene 1 Stamp: 'भाग {part_num}'\n"
        )
    else:
        part_ctx += (
            f"2. SCENE 1 (THE HOOK):\n"
            f"   - KABHI BHI 'पिछले भाग में देखा था' se shuru mat karo!\n"
            f"   - Scene 1 hamesha ek DAMDAAR, CHOWKANE WALE SAWAL (Curiosity Question Hook) se shuru karo!\n"
            f"   - 3D Pop-Up Paper stage par nayak, hathiyar aur ghatna samne aayegi!\n"
            f"   - Scene 1 Stamp: 'भाग {part_num}'\n"
        )

    if not is_final:
        part_ctx += (
            f"3. Aakhri scene ka narration ek SOLID, DRAMATIC NARRATIVE CLIFFHANGER dega (jaise: '...aur tabhi samandar se uthi ek aisi pralayankari lehar, jisne aakash ko tharthara diya!').\n"
            f"   (DHYAN DEIN: KABHI BHI 'dekhiye agle episode' ya 'dekhiye agle bhaag' ya 'iska rahasya jaaniye' mat bolo! Sirf kahani ka dramatic mod bolo!)\n"
            f"4. Aakhri scene ka 'stamp' STRICTLY 'अगला भाग' hoga!\n"
        )
    else:
        part_ctx += (
            f"3. Ye is kahani ka FINAL BHAG hai! Aakhri scene me kahani ka antim divya sandesh, purnata aur pavitra jaikara ho (jaise Shiv katha me: 'बोलिए हर हर महादेव!', Krishna katha me: 'बोलिए जय श्री कृष्ण!').\n"
            f"4. Aakhri scene ka 'stamp' 'कथा सम्पूर्ण' hoga.\n"
        )
    part_ctx += (
        f"5. NUMBERS AUR YEARS RULE:\n"
        f"   - Agar koi saal (year) aaye jaise 1660, 1947 to tts_text me use 'सन सोलह सौ साठ' ya 'सन उन्नीस सौ सैंतालीस' likho! Kabhi bhi 'सौ छह सौ' ya toote shabdon me mat likho!\n"
        f"   - Sankhya jaise 300 ko 'तीन सौ', 4000 ko 'चार हज़ार' likho.\n"
    )

    prompt = (_PROMPT
              .replace("__N__", rnd.choice(["7", "8", "7"]))
              .replace("__CONTEXT__", part_ctx)
              .replace("__STATES__", json.dumps(states, ensure_ascii=False)))
    
    err = None
    for attempt in range(3):
        try:
            p = prompt if not err else prompt + f"\n\nCRITICAL: pichhle output me ye galti thi: {err}. Isse theek karo."
            raw = llm._call(p, max_tokens=8000).strip()
            if "{" in raw and "}" in raw:
                raw = raw[raw.index("{"): raw.rindex("}") + 1]
            plan = clean_plan(llm._salvage_json(raw), seed)
            
            # Enforce series branding on scenes and metadata
            scenes = plan["scenes"]

            # Smart Map Detection: JAHAN KISI JAGAH KA NAAM AAYE, WAHAN MAP SCENE AAYEGA!
            if geo:
                map_scene_idx = None
                for idx, sc in enumerate(scenes):
                    if sc.get("kind") == "map":
                        map_scene_idx = idx
                        break
                if map_scene_idx is None:
                    aliases = [geo["name"].lower()] + [al.lower() for al in geo.get("aliases", [])] + [geo["state"].lower(), st_hi.lower()]
                    for idx, sc in enumerate(scenes):
                        sc_text = (sc.get("narration", "") + " " + sc.get("tts_text", "") + " " + sc.get("text", "")).lower()
                        if any(a in sc_text for a in aliases if len(a) > 2):
                            map_scene_idx = idx
                            break
                if map_scene_idx is None and len(scenes) > 2:
                    map_scene_idx = 1   # no scene names the place: still show the map on scene 2
                if map_scene_idx is not None:
                    for idx, sc in enumerate(scenes):
                        if idx == map_scene_idx:
                            sc["kind"] = "map"
                            sc["state"] = geo["state"]
                            if geo.get("district"):
                                sc["district"] = geo["district"]
                            if geo.get("lat") is not None:
                                sc["place"] = {"name": geo["name"], "lat": geo["lat"], "lon": geo["lon"]}
                            sc["text"] = f"भारत → {st_hi}" if geo.get("state_only") else f"भारत → {st_hi} → {geo['name']}"
                            sc["hit_word"] = st_hi if st_hi in sc.get("tts_text", "") else geo["state"]
                            sc["hit2_word"] = geo["name"].split()[0]
                        elif sc.get("kind") == "map":
                            sc["kind"] = "card"
                            sc["text"] = re.sub(r"\s*→\s*", " ", sc.get("text", "")).strip()

            def _clean_stutters(text: str) -> str:
                if not text:
                    return ""
                # Remove duplicate repeated phrases up to 4 words (e.g. "Madhya Pradesh ke Amarkantak mein")
                t = re.sub(r'([\u0900-\u097F\w]+(?:\s+[\u0900-\u097F\w]+){0,3})\s*[,]?\s+\1', r'\1', text, flags=re.IGNORECASE)
                # Remove repeated particles "mein mein", "में में", "ke ke"
                t = re.sub(r'(?i)\b(mein|के|ke|ki|की)\s*[,]?\s+\1\b', r'\1', t)
                # Clean consecutive commas or excessive spaces
                t = re.sub(r'\s*,\s*,\s*', ', ', t)
                return re.sub(r'\s+', ' ', t).strip(' ,')

            # Clean any repeated consecutive phrases in all scenes
            for sc in scenes:
                sc["narration"] = _clean_stutters(sc.get("narration", ""))
                sc["tts_text"] = _clean_stutters(sc.get("tts_text", sc["narration"]))

            # Clean any accidental repetition where Scene 1 starts with same words as Scene 0
            if len(scenes) > 1:
                s0_words = [w.lower() for w in re.findall(r'[\w\u0900-\u097F]+', scenes[0].get("narration", ""))]
                s1_narr = scenes[1].get("narration", "")
                s1_words = [w.lower() for w in re.findall(r'[\w\u0900-\u097F]+', s1_narr)]
                if len(s0_words) >= 3 and len(s1_words) >= 4 and s0_words[:3] == s1_words[:3]:
                    comma_pos = s1_narr.find(",")
                    if comma_pos != -1 and comma_pos < len(s1_narr) - 5:
                        scenes[1]["narration"] = s1_narr[comma_pos + 1:].strip()
                s1_tts = scenes[1].get("tts_text", "")
                s0_tts_words = [w.lower() for w in re.findall(r'[\w\u0900-\u097F]+', scenes[0].get("tts_text", ""))]
                s1_tts_words = [w.lower() for w in re.findall(r'[\w\u0900-\u097F]+', s1_tts)]
                if len(s0_tts_words) >= 3 and len(s1_tts_words) >= 4 and s0_tts_words[:3] == s1_tts_words[:3]:
                    comma_pos = s1_tts.find(",")
                    if comma_pos != -1 and comma_pos < len(s1_tts) - 5:
                        scenes[1]["tts_text"] = s1_tts[comma_pos + 1:].strip()

            # Clean any dry recap openers from Scene 0 (e.g. "पिछले भाग में देखा था")
            bad_recap_patterns = [
                r"^पिछले भाग में देखा था[,]?\s*",
                r"^पिछले भाग में हमने देखा था[,]?\s*",
                r"^पिछले भाग में हमने देखा[,]?\s*",
                r"^जैसा कि हमने पिछले भाग में देखा[,]?\s*",
                r"^pichhle bha?g me(in)? dekha tha[,]?\s*",
                r"^pichhle bha?g me(in)? humne dekha tha[,]?\s*",
            ]
            for pat in bad_recap_patterns:
                scenes[0]["narration"] = re.sub(pat, "", scenes[0].get("narration", ""), flags=re.IGNORECASE).strip()
                scenes[0]["tts_text"] = re.sub(pat, "", scenes[0].get("tts_text", ""), flags=re.IGNORECASE).strip()

            # Clean cheap filler phrases across all scenes
            def _clean_fillers(text: str) -> str:
                if not text:
                    return ""
                fillers = [
                    r"जानिए\s+इसका\s+रहस्य[!।?]?",
                    r"इसका\s+रहस्य\s+जानिए[!।?]?",
                    r"रहस्य\s+जानिए[!।?]?",
                    r"जानिए\s+यह\s+रहस्य[!।?]?",
                    r"का\s+क्या\s+था\s+रहस्य\?",
                    r"iska\s+rahasya\s+jaaniye",
                    r"jaaniye\s+iska\s+rahasya",
                    r"dekhiye\s+agle\s+(?:episode|video|bha?g)\s*(?:mein|me)?[!।?]?",
                    r"देखिए\s+अगले\s+(?:एपिसोड|वीडियो|भाग)\s*(?:में)?[!।?]?",
                    r"lekin\s+aage\s+kya\s+hua\??",
                    r"लेकिन\s+आगे\s+क्या\s+हुआ\??",
                ]
                t = text
                # Normalize any accidental single "हर महादेव" to "हर हर महादेव"
                t = re.sub(r'(?<!हर\s)हर\s+महादेव', 'हर हर महादेव', t)
                t = re.sub(r'(?i)(?<!har\s)har\s+mahadev', 'Har Har Mahadev', t)
                for f in fillers:
                    t = re.sub(f, "", t, flags=re.IGNORECASE)
                return re.sub(r"\s+", " ", t).strip(" ,-—")

            for sc in scenes:
                sc["narration"] = _clean_fillers(sc.get("narration", ""))
                sc["tts_text"] = _clean_fillers(sc.get("tts_text", sc["narration"]))

            scenes[0]["stamp"] = f"भाग {part_num}"
            for sc in scenes[1:-1]:
                if sc.get("stamp") and ("भाग" in sc["stamp"] or sc["stamp"].startswith("भाग")):
                    del sc["stamp"]
            if not is_final:
                scenes[-1]["stamp"] = "अगला भाग"
            else:
                scenes[-1]["stamp"] = "कथा सम्पूर्ण"
                # Solid sacred conclusion for final part
                topic_lower = topic_title.lower()
                last_tts = scenes[-1].get("tts_text", "")
                last_narr = scenes[-1].get("narration", "")
                if any(k in topic_lower for k in ["शिव", "सोमनाथ", "महादेव", "ज्योतिर्लिंग", "shiva", "somnath"]):
                    last_tts = re.sub(r'(?<!हर\s)हर\s+महादेव', 'हर हर महादेव', last_tts)
                    last_narr = re.sub(r'(?i)(?<!har\s)har\s+mahadev', 'Har Har Mahadev', last_narr)
                    if "हर हर महादेव" not in last_tts:
                        last_tts = f"{last_tts.rstrip('.!|। ')}। बोलिए हर हर महादेव!"
                        last_narr = f"{last_narr.rstrip('.!| ')}. Boliye Har Har Mahadev!"
                    scenes[-1]["tts_text"] = last_tts
                    scenes[-1]["narration"] = last_narr
                elif any(k in topic_lower for k in ["कृष्ण", "द्वारका", "krishna", "dwarka"]):
                    if "जय श्री कृष्ण" not in last_tts:
                        scenes[-1]["tts_text"] = f"{last_tts.rstrip('.!|। ')}। बोलिए जय श्री कृष्ण!"
                        scenes[-1]["narration"] = f"{last_narr.rstrip('.!| ')}. Boliye Jai Shri Krishna!"

            # YouTube Packaging with Series Badges
            clean_part_title = re.sub(r"\s*\|\s*MindSpark.*", "", part.get("part_title") or topic_title).strip()
            plan["youtube"] = {
                "title": f"🔱 {clean_part_title} | भाग {part_num}/{tot_parts} #Shorts",
                "description": (
                    f"🔱 {topic_title} - भाग {part_num} (Episode {part_num} of {tot_parts})\n\n"
                    f"{part.get('part_summary')}\n\n"
                    f"{'👉 भाग ' + str(part_num + 1) + ' जल्द ही आ रहा है!' if not is_final else '🙏 कथा सम्पूर्ण।'}\n"
                    f"#Shorts #HinduMythology #Part{part_num} #IndianHistory"
                ),
                "tags": [topic_title, f"भाग {part_num}", "shorts", "mythology", "history", "hindi stories"]
            }
            print(f"[PaperFilm] Series Part {part_num}/{tot_parts} plan ready: {len(scenes)} scenes")
            return plan
        except Exception as e:
            err = str(e)
            print(f"[PaperFilm] series part plan attempt {attempt + 1} failed: {err}")
    raise RuntimeError(f"Series Part plan failed after 3 attempts: {err}")


def make_plan(topic, custom_script=None, seed=None):
    """Default entrypoint: Generates a full 45-50s standalone video plan (no parts)."""
    return make_standalone_45s_plan(topic, custom_script=custom_script, seed=seed)


_PROMPT_STANDALONE_45S = """Tum ek anubhavi Hindi kahani-kaar aur viral YouTube Shorts / Instagram Reels scriptwriter ho jo YouTube Shorts ke liye "paper-cut film" style video ka script likhte ho.
Ye video ek SINGLE FULL COMPLETE STANDALONE VIDEO hai (KOI PARTS NAHI, NO PART 1, 2, 3)! Poori kahani ek hi video me 45 se 50 second ki duration me aayegi.
Is kahani ko STRICTLY 9 se 10 chhote scenes me todo.

__CONTEXT__

VIRAL REELS SCRIPTING FRAMEWORK (FULL 45-50 SEC STANDALONE VIDEO):
1. PACING & TOTAL DURATION (TARGET 45-50 SECONDS):
   - Total Scenes: STRICTLY 9 se 10 scenes! (Na 8 se kam, na 11 se zyada).
   - Har scene ki narration length: STRICTLY 11-14 words!
   - Total words poore video me: ~115 se 130 words (jo 1.05 voice speed par theek 45-50 seconds banti hai).

2. STANDALONE NARRATIVE ARC:
   - Scene 1 (Hook, 0-4s): Scroll-stopping thumb-stop paradox / sensory curiosity hook. Stamp: "कथा" ya blank. KABHI BHI "भाग 1" mat likho!
   - Scene 2 (Setting / Origin, 5-9s): Sthan, kaal aur katha ka aagaaz. Agar sthan ka naam aaye to 'map' scene banega!
   - Scene 3-6 (Rising Action & Conflict, 10-28s): Kathin sangharsh, vachan, aakraman ya divya tapasya ka vistar.
   - Scene 7-8 (Climax & Turning Point, 29-41s): Sankat charam par, chamatkar ya antim vijay.
   - Scene 9-10 (Resolution & Divine Conclusion, 42-48s): Antim divya sandesh aur pavitra jaikara ('बोलिए हर हर महादेव!' ya 'बोलिए जय श्री कृष्ण!'). Stamp: STRICTLY 'कथा सम्पूर्ण'!

3. CRITICAL RULES:
   - KOI BHI PART NAHI: KABHI BHI 'भाग 1', 'भाग 2', 'अगला भाग', 'dekhiye agle video' mat likho! Poori kahani isi ek video me samapt hogi.
   - ZERO DUPLICATION: Hook aur Scene 2 me koi shabd ya naam dohrana nahi hai.
   - KABHI BHI "जानिए इसका रहस्य", "रहस्य जानिए" jaise filler phrases mat likho.
   - Shuddh Devanagari Hindi for tts_text, Hinglish for narration. Numbers aur Saal bilkul shabdon me likho (jaise 'सन सोलह सौ साठ').

OUTPUT: sirf ek JSON object (koi markdown nahi, koi explanation nahi):
{
  "youtube": {"title": "Hindi viral title without part numbers, max 60 chars", "description": "3-4 line Hindi description + hashtags", "tags": ["..."]},
  "scenes": [
    {
      "kind": "title | card | number | quote | list | map",
      "emotion": "heroic | suspense | conversational | emotional | divine (har scene ka bhav)",
      "narration": "STRICTLY Hinglish (Hindi bolchal in Roman / English alphabet). STRICTLY 11-14 words.",
      "tts_text": "WAHI line shuddh Devanagari Hindi me, voice ke liye. Numbers aur Saal shabdon me.",
      "text": "Screen par bada text, Devanagari, max 6 words",
      "sub": "chhoti line (optional), max 6 words",
      "hit_word": "narration ka ek word jis par effect lage",
      "stamp": "optional stamp (sirf Scene 0 me, intermediate scenes me nahi)",
      "accent": "red | teal | mustard | ink"
    }
  ]
}
"""


def make_standalone_45s_plan(topic, custom_script=None, seed=None):
    rnd = random.Random(seed)
    states, _ = _load_geo()
    prompt = (_PROMPT_STANDALONE_45S
              .replace("__CONTEXT__", _context(topic, custom_script))
              .replace("__STATES__", json.dumps(states, ensure_ascii=False)))
    
    topic_title = topic.get("title", "") if isinstance(topic, dict) else str(topic)
    topic_summary = topic.get("summary", "") if isinstance(topic, dict) else ""
    topic_key = topic.get("topic", "") if isinstance(topic, dict) else ""
    search_text = f"{topic_key} {topic_title} {topic_summary}".lower()
    
    geo = _detect_geo(topic if isinstance(topic, dict) else {"title": str(topic)}, str(custom_script or ""))
    if geo:
        st_hi0 = STATE_HI.get(geo["state"], geo["state"])
        prompt += (
            "\n\nMAP SCENE (zaroori): scene 2 ka kind 'map' rakho. Us scene ki narration me rajya ka naam '" + st_hi0 + "'"
            + ("" if geo.get("state_only") else " aur jagah ka naam '" + geo["name"] + "'")
            + " saaf bolo (jaise 'Bharat ke " + st_hi0 + " me...'). Map scene me 'state': '" + geo["state"] + "' likho. Baaki scenes me 'map' kind mat do."
        )

    err = None
    for attempt in range(3):
        try:
            p = prompt if not err else prompt + f"\n\nCRITICAL: pichhle output me ye galti thi: {err}. Isse theek karo."
            raw = llm._call(p, max_tokens=8000).strip()
            if "{" in raw and "}" in raw:
                raw = raw[raw.index("{"): raw.rindex("}") + 1]
            plan = clean_plan(llm._salvage_json(raw), seed)
            scenes = plan["scenes"]

            # Smart Map Detection: JAHAN KISI JAGAH KA NAAM AAYE, WAHAN MAP SCENE AAYEGA!
            if geo:
                st_hi = STATE_HI.get(geo["state"], geo["state"])
                map_scene_idx = None
                for idx, sc in enumerate(scenes):
                    if sc.get("kind") == "map":
                        map_scene_idx = idx
                        break
                if map_scene_idx is None:
                    aliases = [geo["name"].lower()] + [al.lower() for al in geo.get("aliases", [])] + [geo["state"].lower(), st_hi.lower()]
                    for idx, sc in enumerate(scenes):
                        sc_text = (sc.get("narration", "") + " " + sc.get("tts_text", "") + " " + sc.get("text", "")).lower()
                        if any(a in sc_text for a in aliases if len(a) > 2):
                            map_scene_idx = idx
                            break
                if map_scene_idx is None and len(scenes) > 2:
                    map_scene_idx = 1   # no scene names the place: still show the map on scene 2
                if map_scene_idx is not None:
                    for idx, sc in enumerate(scenes):
                        if idx == map_scene_idx:
                            sc["kind"] = "map"
                            sc["state"] = geo["state"]
                            if geo.get("district"):
                                sc["district"] = geo["district"]
                            if geo.get("lat") is not None:
                                sc["place"] = {"name": geo["name"], "lat": geo["lat"], "lon": geo["lon"]}
                            sc["text"] = f"भारत → {st_hi}" if geo.get("state_only") else f"भारत → {st_hi} → {geo['name']}"
                            sc["hit_word"] = st_hi if st_hi in sc.get("tts_text", "") else geo["state"]
                            sc["hit2_word"] = geo["name"].split()[0]
                        elif sc.get("kind") == "map":
                            sc["kind"] = "card"
                            sc["text"] = re.sub(r"\s*→\s*", " ", sc.get("text", "")).strip()

            # Clean stutters & fillers
            for sc in scenes:
                sc["narration"] = _clean_stutters(sc.get("narration", ""))
                sc["tts_text"] = _clean_stutters(sc.get("tts_text", sc["narration"]))

            def _clean_fillers(text: str) -> str:
                if not text:
                    return ""
                fillers = [
                    r"जानिए\s+इसका\s+रहस्य[!।?]?",
                    r"इसका\s+रहस्य\s+जानिए[!।?]?",
                    r"रहस्य\s+जानिए[!।?]?",
                    r"जानिए\s+यह\s+रहस्य[!।?]?",
                    r"का\s+क्या\s+था\s+रहस्य\?",
                    r"iska\s+rahasya\s+jaaniye",
                    r"jaaniye\s+iska\s+rahasya",
                    r"dekhiye\s+agle\s+(?:episode|video|bha?g)\s*(?:mein|me)?[!।?]?",
                    r"देखिए\s+अगले\s+(?:एपिसोड|वीडियो|भाग)\s*(?:में)?[!।?]?",
                    r"lekin\s+aage\s+kya\s+hua\??",
                    r"लेकिन\s+आगे\s+क्या\s+हुआ\??",
                    r"bha?g\s*\d+",
                    r"भाग\s*\d+",
                ]
                t = text
                t = re.sub(r'(?<!हर\s)हर\s+महादेव', 'हर हर महादेव', t)
                t = re.sub(r'(?i)(?<!har\s)har\s+mahadev', 'Har Har Mahadev', t)
                for f in fillers:
                    t = re.sub(f, "", t, flags=re.IGNORECASE)
                return re.sub(r"\s+", " ", t).strip(" ,-—")

            for sc in scenes:
                sc["narration"] = _clean_fillers(sc.get("narration", ""))
                sc["tts_text"] = _clean_fillers(sc.get("tts_text", sc["narration"]))

            # STAMPS RULE: Standalone video - NO "भाग X" anywhere!
            if scenes[0].get("stamp") and "भाग" in scenes[0]["stamp"]:
                scenes[0]["stamp"] = "कथा"
            for sc in scenes[1:-1]:
                sc.pop("stamp", None)
            scenes[-1]["stamp"] = "कथा सम्पूर्ण"

            # Sacred conclusion
            topic_lower = topic_title.lower()
            last_tts = scenes[-1].get("tts_text", "")
            last_narr = scenes[-1].get("narration", "")
            if any(k in topic_lower for k in ["शिव", "सोमनाथ", "महादेव", "ज्योतिर्लिंग", "shiva", "somnath"]):
                last_tts = re.sub(r'(?<!हर\s)हर\s+महादेव', 'हर हर महादेव', last_tts)
                last_narr = re.sub(r'(?i)(?<!har\s)har\s+mahadev', 'Har Har Mahadev', last_narr)
                if "हर हर महादेव" not in last_tts:
                    last_tts = f"{last_tts.rstrip('.!|। ')}। बोलिए हर हर महादेव!"
                    last_narr = f"{last_narr.rstrip('.!| ')}. Boliye Har Har Mahadev!"
                scenes[-1]["tts_text"] = last_tts
                scenes[-1]["narration"] = last_narr
            elif any(k in topic_lower for k in ["कृष्ण", "द्वारका", "krishna", "dwarka"]):
                if "जय श्री कृष्ण" not in last_tts:
                    scenes[-1]["tts_text"] = f"{last_tts.rstrip('.!|। ')}। बोलिए जय श्री कृष्ण!"
                    scenes[-1]["narration"] = f"{last_narr.rstrip('.!| ')}. Boliye Jai Shri Krishna!"
                scenes[-1]["tts_text"] = last_tts
                scenes[-1]["narration"] = last_narr

            # YouTube Packaging: Clean title without part numbers
            raw_title = plan.get("youtube", {}).get("title", topic_title)
            clean_title = re.sub(r"\s*\|\s*(?:भाग|part)\s*\d+.*", "", raw_title, flags=re.IGNORECASE).strip()
            clean_title = re.sub(r"#\w+", "", clean_title).strip()
            if not clean_title.startswith("🚩") and not clean_title.startswith("🔱"):
                clean_title = f"🔱 {clean_title}"
            clean_title = f"{clean_title} #Shorts"
            plan["youtube"] = {
                "title": clean_title[:70],
                "description": f"{topic_title}\n\n#shorts #mythology #sanatandharma #viralshorts",
                "tags": [topic_title, "shorts", "mythology", "history", "hindi stories"]
            }
            print(f"[PaperFilm] Standalone 45-50s plan ready: {len(scenes)} scenes")
            return plan
        except Exception as e:
            err = str(e)
            print(f"[PaperFilm] Standalone plan attempt {attempt + 1} failed: {err}")
    raise RuntimeError(f"Standalone plan failed after 3 attempts: {err}")


def _find(words, target, default_frac):
    if target:
        t = _norm(target.split()[0])
        if t:
            for k, w in enumerate(words):
                if _norm(w["w"]) == t:
                    return k
            for k, w in enumerate(words):
                if t in _norm(w["w"]):
                    return k
    return max(0, min(len(words) - 1, int(len(words) * default_frac)))


def resolve_hits(scenes):
    """Call after tts.narrate (needs words[]). Writes hit / hit2 as word indexes, drops the *_word helpers."""
    for s in scenes:
        words = s.get("words") or []
        if not words:
            continue
        if s["kind"] == "map":
            h1 = _find(words, s.pop("hit_word", None), 0.3)
            h2 = _find(words, s.pop("hit2_word", None), 0.62)
            if h2 <= h1:
                h2 = min(len(words) - 1, h1 + max(1, len(words) // 4))
            s["hit"], s["hit2"] = h1, h2
        else:
            s["hit"] = _find(words, s.pop("hit_word", None), 0.35)
            s.pop("hit2_word", None)
    return scenes
