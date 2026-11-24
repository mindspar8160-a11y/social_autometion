"""Pick the visual LOOK of a PaperFilm video (board colour, sheet shape, camera route, captions ...).
The looks themselves live in remotion/src/cinematic/kit/looks.ts. Here we only choose an id so that
consecutive videos never share a look: the last 4 used are excluded; among the rest the story mood decides.
"""
import random
from common import ROOT, jload, jsave

HIST = ROOT / "state" / "recent-looks.json"
LOOKS = {   # id -> moods (keep in sync with looks.ts)
    "kraft_classic": ["story", "day", "village"],
    "midnight_gold": ["shiva", "night", "himalaya", "dhyan"],
    "saffron_dawn": ["devi", "temple", "sun", "day"],
    "emerald_grove": ["forest", "rishi", "village", "nature"],
    "crimson_war": ["war", "fort", "fire", "battle", "veer"],
    "ivory_minimal": ["story", "quote", "day", "calm"],
    "sandstone_desert": ["desert", "fort", "palace", "rajasthan"],
    "ocean_teal": ["sea", "river", "ghat", "water"],
    "lotus_pink": ["devi", "shakti", "temple", "flower"],
    "indigo_dusk": ["himalaya", "night", "shiva", "mystery", "cave"],
}
WORDS = {
    "war": ["युद्ध", "लड़ाई", "सेना", "तलवार", "वीर", "योद्धा", "बलिदान", "जौहर", "रानी", "battle"],
    "fort": ["किला", "दुर्ग", "गढ़"], "fire": ["आग", "अग्नि", "ज्वाला", "हवन", "यज्ञ"], "veer": ["वीर", "रानी", "राणा"],
    "devi": ["देवी", "माता", "शक्तिपीठ", "सती", "दुर्गा", "काली", "शक्ति", "भवानी", "आई"], "shakti": ["शक्तिपीठ", "सती", "शक्ति"],
    "shiva": ["शिव", "महादेव", "शंकर", "त्रिशूल", "कैलाश", "भैरव"], "night": ["रात", "रात्रि", "अंधकार", "चाँद", "चंद्र"],
    "himalaya": ["हिमालय", "कैलाश", "बर्फ", "केदारनाथ", "बद्रीनाथ", "अमरनाथ"], "cave": ["गुफा", "रहस्य", "तहखाना"],
    "forest": ["जंगल", "वन", "वृक्ष", "पेड़", "ऋषि", "आश्रम"], "rishi": ["ऋषि", "मुनि", "तपस्या"], "village": ["गाँव", "किसान", "कुआं"],
    "desert": ["रेगिस्तान", "मरुस्थल", "ऊँट", "राजस्थान", "जैसलमेर", "थार"], "palace": ["महल", "दरबार", "राजा", "सिंहासन"],
    "sea": ["समुद्र", "सागर", "नाव", "लहर", "द्वारका"], "river": ["नदी", "गंगा", "यमुना", "नर्मदा", "घाट", "काशी"],
    "ghat": ["घाट", "काशी", "वाराणसी"], "temple": ["मंदिर", "धाम", "पूजा", "आरती", "तीर्थ"], "sun": ["सूर्य", "सवेरा", "कोणार्क"],
    "flower": ["कमल", "फूल", "पुष्प"], "mystery": ["रहस्य", "चमत्कार", "अद्भुत"],
}


def pick_look(story_text, seed=None, record=True):
    rnd = random.Random(seed)
    hist = jload(HIST, [])
    t = (story_text or "").lower()
    moods = {m for m, ws in WORDS.items() if any(w in t for w in ws)}
    recent = set(hist[-4:])
    pool = [(len(set(ms) & moods), lid) for lid, ms in LOOKS.items() if lid not in recent]
    pool.sort(key=lambda x: -x[0])
    top = [lid for sc, lid in pool if sc > 0][:3] or [lid for _, lid in pool]
    choice = rnd.choice(top)
    if record:
        hist.append(choice)
        try:
            jsave(HIST, hist[-12:])
        except Exception:
            pass
    return choice
