"""Hashtags + tags for every video (was: 4 fixed hashtags and 5 tags -> almost no reach from hashtag search).

build_hashtags()  -> ordered list like ['#Shaktipeeth', '#Gujarat', '#Shorts', ...]  (topic specific first)
chip_tags()       -> the 4 that Remotion shows as chips on the closing pull-back
apply_to_meta()   -> rewrites meta['title'] / ['description'] / ['tags'] (title gets #Shorts + 1 topic tag,
                     description ends with 10-12 hashtags; total stays under YouTube's 15-hashtag limit)
"""
import re

BASE = ["#Shorts", "#HinduMythology", "#SanatanDharma", "#IndianMythology", "#Hinduism", "#MindSpark", "#Viral", "#Hindi"]

# trigger words (Hindi / Hinglish / English)  ->  hashtags
THEMES = [
    (["शक्तिपीठ", "shaktipeeth", "shakti peeth", "सती"], ["#Shaktipeeth", "#ShaktiPeeth", "#MaaSati", "#DeviMaa"]),
    (["देवी", "माता", "दुर्गा", "devi", "durga", "mata", "भवानी", "आई "], ["#DeviMaa", "#MataRani", "#Navratri", "#Durga"]),
    (["काली", "kali"], ["#MaaKali", "#KaliMaa"]),
    (["शिव", "महादेव", "shiva", "mahadev", "भोलेनाथ", "ज्योतिर्लिंग"], ["#Mahadev", "#HarHarMahadev", "#Shiva", "#Jyotirlinga"]),
    (["कृष्ण", "krishna", "द्वारका", "राधा", "कान्हा"], ["#Krishna", "#JaiShriKrishna", "#Radhe"]),
    (["राम", "ram", "अयोध्या", "रामायण", "सीता"], ["#JaiShriRam", "#Ramayan", "#Ayodhya"]),
    (["हनुमान", "hanuman", "बजरंग"], ["#Hanuman", "#Bajrangbali", "#JaiHanuman"]),
    (["गणेश", "ganesh", "गणपति"], ["#Ganesha", "#GanpatiBappa"]),
    (["विष्णु", "vishnu", "नारायण"], ["#Vishnu", "#Narayan"]),
    (["महाभारत", "कुरुक्षेत्र", "अर्जुन", "mahabharat", "गीता"], ["#Mahabharat", "#BhagavadGita"]),
    (["रानी", "राणा", "राजपूत", "जौहर", "बलिदान", "वीर", "योद्धा", "veer", "शिवाजी", "मराठा", "युद्ध"], ["#IndianHistory", "#Veer", "#Bravery", "#Bharat"]),
    (["मंदिर", "temple", "mandir", "धाम", "तीर्थ"], ["#Mandir", "#HinduTemple", "#TempleOfIndia", "#Tirth"]),
    (["रहस्य", "चमत्कार", "mystery", "miracle", "अद्भुत"], ["#Mystery", "#Miracle", "#UnsolvedMystery", "#IncredibleIndia"]),
    (["ऋषि", "तपस्या", "योग", "साधना", "rishi", "ध्यान"], ["#Rishi", "#Tapasya", "#Yoga", "#Spirituality"]),
    (["नदी", "गंगा", "यमुना", "घाट", "काशी", "वाराणसी"], ["#Ganga", "#Kashi", "#Varanasi"]),
    (["कथा", "कहानी", "लोककथा", "katha", "story"], ["#Katha", "#Kahani", "#Storytime"]),
]
STATE_TAG = {
    "Gujarat": "#Gujarat", "Rajasthan": "#Rajasthan", "Maharashtra": "#Maharashtra", "West Bengal": "#WestBengal", "Uttar Pradesh": "#UttarPradesh",
    "Madhya Pradesh": "#MadhyaPradesh", "Tamil Nadu": "#TamilNadu", "Kerala": "#Kerala", "Karnataka": "#Karnataka", "Odisha": "#Odisha",
    "Andhra Pradesh": "#AndhraPradesh", "Telangana": "#Telangana", "Uttarakhand": "#Uttarakhand", "Himachal Pradesh": "#HimachalPradesh",
    "Jammu and Kashmir": "#Kashmir", "Bihar": "#Bihar", "Assam": "#Assam", "Punjab": "#Punjab", "Haryana": "#Haryana", "Jharkhand": "#Jharkhand",
}


def _latin_tag(geo):
    """English hashtag for a place: first latin alias of the gazetteer entry, else nothing."""
    for al in (geo or {}).get("aliases", []):
        if re.fullmatch(r"[A-Za-z ]{4,}", al):
            return "#" + "".join(w.capitalize() for w in al.split())
    return None


def _uniq(seq):
    seen, out = set(), []
    for t in seq:
        k = t.lower()
        if k not in seen:
            seen.add(k)
            out.append(t)
    return out


def build_hashtags(title, story_text="", geo=None):
    hay = f"{title} {story_text}".lower()
    topic = []
    place = _latin_tag(geo)
    if place:
        topic.append(place)
    if geo and geo.get("state") in STATE_TAG:
        topic.append(STATE_TAG[geo["state"]])
    for words, tags in THEMES:
        if any(w.lower() in hay for w in words):
            topic.extend(tags[:3])
    topic = _uniq(topic)[:9]
    return _uniq(topic + BASE)[:13]


def chip_tags(tags):
    """4 chips for the closing pull-back: 2 topic tags + 2 channel tags."""
    topic = [t for t in tags if t not in BASE][:2]
    return _uniq(topic + ["#HinduMythology", "#MindSpark"])[:4]


def _strip_tags(text):
    return re.sub(r"\s*#\w+", "", text or "").strip()


def apply_to_meta(meta, title, story_text="", geo=None):
    tags = build_hashtags(title, story_text, geo)
    topic = [t for t in tags if t not in BASE]
    base_title = _strip_tags(meta.get("title") or f"{title} | MindSpark")
    base_title = base_title[:72].rstrip(" |-")
    head = " ".join(["#Shorts"] + topic[:1])
    meta["title"] = f"{base_title} {head}"[:100]
    desc = _strip_tags(meta.get("description") or "").strip()
    # title carries 2 hashtags, description carries up to 11 more (<= 15 total keeps them all active)
    desc_tags = [t for t in tags if t.lower() not in head.lower().split()][:11]
    meta["description"] = (desc + "\n\n" if desc else "") + " ".join(desc_tags) + "\n\n🔔 Subscribe MindSpark for daily Hindi mythology shorts."
    words = []
    for t in tags + [x.lstrip("#") for x in (meta.get("tags") or [])]:
        w = t.lstrip("#")
        words.append(w)
        spaced = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", w)
        if spaced != w:
            words.append(spaced.lower())
    words += ["hindi mythology", "hindu mythology stories", "pauranik katha", "bharat ki kahaniyan", "shorts"]
    out, total = [], 0
    for w in _uniq(words):
        if total + len(w) + 1 > 450:
            break
        out.append(w)
        total += len(w) + 1
    meta["tags"] = out
    return tags
