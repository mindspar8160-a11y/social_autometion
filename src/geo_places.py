"""Big gazetteer for the map scene (Bharat -> rajya -> jagah).

Why: the old GEO_LORE knew only ~18 places, so most videos (Shaktipeeth, Charani Mata, forts ...) got NO map scene.
Now: place match (exact pin) -> else district-only highlight -> else just the state map.
lat/lon = None means 'exact pin not sure': the engine then zooms to the district (or state) instead of a wrong pin.
"""
import re

def _p(state, name, aliases, district=None, lat=None, lon=None):
    return {"state": state, "district": district, "name": name, "lat": lat, "lon": lon, "aliases": aliases}

PLACES = {
    # ---- Shaktipeeth / Devi
    "kalighat": _p("West Bengal", "कालीघाट शक्तिपीठ", ["कालीघाट", "kalighat", "काली घाट"], "Kolkata", 22.5200, 88.3426),
    "attahas": _p("West Bengal", "अट्टहास शक्तिपीठ", ["अट्टहास", "लाभपुर", "attahas", "labhpur"], "Birbhum"),
    "tarapith": _p("West Bengal", "तारापीठ", ["तारापीठ", "tarapith"], "Birbhum", 24.1134, 87.7797),
    "kamakhya": _p("Assam", "कामाख्या देवी", ["कामाख्या", "kamakhya"], None, 26.1664, 91.7058),
    "jwalamukhi": _p("Himachal Pradesh", "ज्वालामुखी देवी", ["ज्वालामुखी", "ज्वाला देवी", "jwalamukhi", "jwala devi"], "Kangra", 31.8761, 76.3236),
    "naina_devi": _p("Himachal Pradesh", "नैना देवी", ["नैना देवी", "naina devi"], "Bilaspur", 31.3050, 76.5330),
    "chintpurni": _p("Himachal Pradesh", "चिंतपूर्णी", ["चिंतपूर्णी", "chintpurni"], "Una"),
    "vindhyachal": _p("Uttar Pradesh", "विंध्याचल धाम", ["विंध्याचल", "विन्ध्याचल", "vindhyachal", "विंध्यवासिनी"], "Mirzapur", 25.1670, 82.5190),
    "ambaji": _p("Gujarat", "अम्बाजी शक्तिपीठ", ["अम्बाजी", "अंबाजी", "ambaji", "अरासुरी"], "Banaskantha", 24.3330, 72.8470),
    "pavagadh": _p("Gujarat", "पावागढ़ महाकाली", ["पावागढ़", "पावागढ", "pavagadh", "pavagarh"], "Panchmahal", 22.4600, 73.5300),
    "chehar": _p("Gujarat", "चेहर माता धाम", ["चेहर माता", "चेहर", "chehar", "चेहरमाता", "चोहर"]),
    "mogal": _p("Gujarat", "आई मोगल धाम", ["मोगल", "mogal", "आई मोगल", "मोगल माँ"]),
    "mahalakshmi_kolhapur": _p("Maharashtra", "महालक्ष्मी मंदिर कोल्हापुर", ["कोल्हापुर", "kolhapur", "अंबाबाई", "ambabai"], "Kolhapur", 16.7050, 74.2433),
    "tuljapur": _p("Maharashtra", "तुलजा भवानी", ["तुलजापुर", "तुलजा भवानी", "tuljapur", "tulja bhavani"], None, 18.0060, 76.1330),
    "mahur": _p("Maharashtra", "रेणुका माता माहूर", ["माहूर", "mahur", "रेणुका"], "Nanded"),
    "saptashrungi": _p("Maharashtra", "सप्तश्रृंगी देवी", ["सप्तश्रृंगी", "सप्तशृंगी", "saptashrungi", "सप्तश्रुंगी"], "Nashik"),
    "alampur": _p("Telangana", "जोगुलम्बा आलमपुर", ["जोगुलम्बा", "आलमपुर", "jogulamba", "alampur"], None, 15.8890, 78.1330),
    "srisailam": _p("Andhra Pradesh", "श्रीशैलम", ["श्रीशैलम", "srisailam", "मल्लिकार्जुन", "mallikarjuna", "भ्रमराम्बा"], None, 16.0740, 78.8680),
    "kanchi": _p("Tamil Nadu", "कांची कामाक्षी", ["कांची", "कामाक्षी", "kanchipuram", "kamakshi"], None, 12.8350, 79.7030),
    "meenakshi": _p("Tamil Nadu", "मीनाक्षी मंदिर मदुरै", ["मीनाक्षी", "मदुरै", "meenakshi", "madurai"], "Madurai", 9.9195, 78.1193),
    "kanyakumari": _p("Tamil Nadu", "कन्याकुमारी", ["कन्याकुमारी", "kanyakumari", "कन्या कुमारी"], "Kanyakumari", 8.0883, 77.5385),
    "mookambika": _p("Karnataka", "मूकाम्बिका देवी", ["मूकाम्बिका", "mookambika", "कोल्लूर"], "Udupi", 13.8630, 74.8140),
    "chamundeshwari": _p("Karnataka", "चामुंडेश्वरी देवी", ["चामुंडेश्वरी", "chamundeshwari", "मैसूर", "mysuru", "mysore"], "Mysuru", 12.2725, 76.6700),
    "biraja": _p("Odisha", "बिरजा देवी जाजपुर", ["बिरजा", "biraja", "जाजपुर", "jajpur"], "Jajpur", 20.8500, 86.3300),
    "harsiddhi": _p("Madhya Pradesh", "हरसिद्धि माता उज्जैन", ["हरसिद्धि", "harsiddhi"], "Ujjain", 23.1840, 75.7660),
    "maihar": _p("Madhya Pradesh", "शारदा माता मैहर", ["मैहर", "maihar", "शारदा माता"], "Satna", 24.2680, 80.7560),
    "vaishno": _p("Jammu and Kashmir", "वैष्णो देवी", ["वैष्णो देवी", "vaishno", "त्रिकुटा", "कटरा", "katra"], "Reasi", 33.0300, 74.9490),
    "jagannath": _p("Odisha", "जगन्नाथ पुरी", ["जगन्नाथ", "jagannath", "पुरी धाम", "रथ यात्रा"], "Puri", 19.8049, 85.8179),
    # ---- Jyotirlinga / dham
    "mahakal": _p("Madhya Pradesh", "महाकालेश्वर उज्जैन", ["महाकाल", "महाकालेश्वर", "उज्जैन", "ujjain", "mahakal"], "Ujjain", 23.1828, 75.7683),
    "omkareshwar": _p("Madhya Pradesh", "ओंकारेश्वर", ["ओंकारेश्वर", "omkareshwar"], "Khandwa", 22.2450, 76.1500),
    "kedarnath": _p("Uttarakhand", "केदारनाथ धाम", ["केदारनाथ", "kedarnath"], "Rudraprayag", 30.7352, 79.0669),
    "badrinath": _p("Uttarakhand", "बद्रीनाथ धाम", ["बद्रीनाथ", "badrinath", "बद्रीविशाल"], "Chamoli", 30.7433, 79.4938),
    "gangotri": _p("Uttarakhand", "गंगोत्री", ["गंगोत्री", "gangotri"], "Uttarkashi", 30.9940, 78.9400),
    "yamunotri": _p("Uttarakhand", "यमुनोत्री", ["यमुनोत्री", "yamunotri"], "Uttarkashi", 31.0130, 78.4500),
    "trimbakeshwar": _p("Maharashtra", "त्र्यंबकेश्वर", ["त्र्यंबकेश्वर", "त्र्यम्बकेश्वर", "trimbakeshwar", "trimbak"], "Nashik", 19.9320, 73.5310),
    "nashik": _p("Maharashtra", "नासिक पंचवटी", ["नासिक", "नाशिक", "nashik", "पंचवटी"], "Nashik", 19.9975, 73.7898),
    "bhimashankar": _p("Maharashtra", "भीमाशंकर", ["भीमाशंकर", "bhimashankar"], "Pune", 19.0720, 73.5350),
    "nageshwar": _p("Gujarat", "नागेश्वर ज्योतिर्लिंग", ["नागेश्वर", "nageshwar"], "Devbhumi Dwarka", 22.3340, 69.0870),
    "rameshwaram": _p("Tamil Nadu", "रामेश्वरम", ["रामेश्वरम", "rameshwaram", "रामसेतु", "ram setu"], "Ramanathapuram", 9.2881, 79.3174),
    "baidyanath": _p("Jharkhand", "बैद्यनाथ धाम देवघर", ["बैद्यनाथ", "देवघर", "baidyanath", "deoghar"], "Deoghar", 24.4920, 86.7000),
    "tirupati": _p("Andhra Pradesh", "तिरुपति बालाजी", ["तिरुपति", "बालाजी", "tirupati", "tirumala", "तिरुमला"], None, 13.6833, 79.3472),
    "shirdi": _p("Maharashtra", "शिरडी", ["शिरडी", "shirdi", "साईं बाबा", "sai baba"], None, 19.7667, 74.4769),
    "pandharpur": _p("Maharashtra", "पंढरपुर", ["पंढरपुर", "pandharpur", "विठोबा", "vitthal", "विट्ठल"], "Solapur", 17.6790, 75.3200),
    "mathura": _p("Uttar Pradesh", "मथुरा", ["मथुरा", "mathura", "कृष्ण जन्मभूमि"], "Mathura", 27.4924, 77.6737),
    "vrindavan": _p("Uttar Pradesh", "वृंदावन", ["वृंदावन", "vrindavan", "बरसाना", "बांके बिहारी", "गोवर्धन"], "Mathura", 27.5800, 77.7000),
    "prayagraj": _p("Uttar Pradesh", "प्रयागराज संगम", ["प्रयागराज", "प्रयाग", "संगम", "prayagraj", "kumbh", "कुंभ"], "Prayagraj", 25.4358, 81.8463),
    "haridwar": _p("Uttarakhand", "हरिद्वार", ["हरिद्वार", "haridwar", "हर की पौड़ी"], "Haridwar", 29.9457, 78.1642),
    "rishikesh": _p("Uttarakhand", "ऋषिकेश", ["ऋषिकेश", "rishikesh", "लक्ष्मण झूला"], None, 30.0869, 78.2676),
    "bodhgaya": _p("Bihar", "बोधगया", ["बोधगया", "bodh gaya", "bodhgaya", "पिंडदान", "गयाजी"], "Gaya", 24.6961, 84.9914),
    "amritsar": _p("Punjab", "स्वर्ण मंदिर अमृतसर", ["स्वर्ण मंदिर", "अमृतसर", "golden temple", "amritsar", "हरमंदिर"], "Amritsar", 31.6200, 74.8765),
    "sabarimala": _p("Kerala", "सबरीमाला", ["सबरीमाला", "sabarimala", "अयप्पा", "ayyappa"], "Pathanamthitta", 9.4360, 77.0810),
    "guruvayur": _p("Kerala", "गुरुवायूर", ["गुरुवायूर", "guruvayur"], "Thrissur", 10.5946, 76.0397),
    # ---- Rajasthan lore, forts
    "chittorgarh": _p("Rajasthan", "चित्तौड़गढ़ किला", ["चित्तौड़", "चित्तौड़गढ़", "चित्तौडगढ", "पद्मिनी", "जौहर", "chittor", "chittorgarh", "महाराणा प्रताप", "rana kumbha"], "Chittorgarh", 24.8887, 74.6269),
    "hadi_rani": _p("Rajasthan", "हाड़ी रानी सलूम्बर", ["हाड़ी रानी", "हाडी रानी", "hadi rani", "सलूम्बर", "salumbar", "रतन सिंह चूंडावत"]),
    "ranthambore": _p("Rajasthan", "रणथंभौर किला", ["रणथंभौर", "रणथम्भौर", "ranthambore"], "Sawai Madhopur", 26.0173, 76.5026),
    "jaisalmer": _p("Rajasthan", "जैसलमेर", ["जैसलमेर", "jaisalmer", "थार"], "Jaisalmer", 26.9157, 70.9083),
    "tanot": _p("Rajasthan", "तनोट माता", ["तनोट", "tanot"], "Jaisalmer"),
    "ramdevra": _p("Rajasthan", "रामदेवरा", ["रामदेवरा", "रामदेव", "ramdevra", "बाबा रामदेव"], "Jaisalmer"),
    "khatu_shyam": _p("Rajasthan", "खाटू श्याम जी", ["खाटू", "khatu", "श्याम बाबा"], "Sikar", 27.3600, 75.4000),
    "salasar": _p("Rajasthan", "सालासर बालाजी", ["सालासर", "salasar"], "Churu", 27.7300, 74.7200),
    "nathdwara": _p("Rajasthan", "नाथद्वारा श्रीनाथजी", ["नाथद्वारा", "nathdwara", "श्रीनाथ"], "Rajsamand", 24.9370, 73.8230),
    "karni_mata": _p("Rajasthan", "करणी माता देशनोक", ["करणी माता", "देशनोक", "karni mata", "deshnok", "चूहों का मंदिर"], "Bikaner", 27.7900, 73.3400),
    "raigad": _p("Maharashtra", "रायगढ़ किला", ["रायगढ़", "रायगड", "raigad", "शिवाजी महाराज", "शिवराय"], "Raigad", 18.2340, 73.4400),
    "sinhagad": _p("Maharashtra", "सिंहगढ़ किला", ["सिंहगढ़", "सिंहगड", "sinhagad", "तानाजी", "कोंढाणा"], "Pune", 18.3660, 73.7550),
    "panhala": _p("Maharashtra", "पन्हाला किला", ["पन्हाला", "panhala"], "Kolhapur", 16.8110, 74.1100),
}

_STATE_ALIASES = {
    "Andhra Pradesh": ["आंध्र प्रदेश", "आंध्र", "andhra"], "Arunachal Pradesh": ["अरुणाचल", "arunachal"], "Assam": ["असम", "assam"],
    "Bihar": ["बिहार", "bihar"], "Chhattisgarh": ["छत्तीसगढ़", "छत्तीसगढ", "chhattisgarh"], "Goa": ["गोवा", "goa"], "Gujarat": ["गुजरात", "gujarat", "सौराष्ट्र", "saurashtra", "कच्छ", "kutch"],
    "Haryana": ["हरियाणा", "haryana"], "Himachal Pradesh": ["हिमाचल", "himachal"], "Jharkhand": ["झारखंड", "jharkhand"], "Karnataka": ["कर्नाटक", "karnataka"],
    "Kerala": ["केरल", "kerala"], "Madhya Pradesh": ["मध्य प्रदेश", "मध्यप्रदेश", "madhya pradesh"], "Maharashtra": ["महाराष्ट्र", "maharashtra", "मराठा"],
    "Odisha": ["ओडिशा", "उड़ीसा", "odisha", "orissa"], "Punjab": ["पंजाब", "punjab"], "Rajasthan": ["राजस्थान", "rajasthan", "मारवाड़", "मेवाड़", "marwar", "mewar", "राजपूताना"],
    "Tamil Nadu": ["तमिलनाडु", "तमिल", "tamil nadu", "tamilnadu"], "Telangana": ["तेलंगाना", "telangana"], "Uttar Pradesh": ["उत्तर प्रदेश", "उत्तरप्रदेश", "uttar pradesh"],
    "Uttarakhand": ["उत्तराखंड", "उत्तराखण्ड", "uttarakhand", "देवभूमि"], "West Bengal": ["पश्चिम बंगाल", "बंगाल", "bengal"], "Jammu and Kashmir": ["कश्मीर", "जम्मू", "kashmir", "jammu"],
    "Delhi": ["दिल्ली", "delhi", "इंद्रप्रस्थ"], "Tripura": ["त्रिपुरा", "tripura"], "Meghalaya": ["मेघालय", "meghalaya"], "Manipur": ["मणिपुर", "manipur"],
    "Ladakh": ["लद्दाख", "ladakh"], "Sikkim": ["सिक्किम", "sikkim"],
}
STATE_HI_ALL = {st: al[0] for st, al in _STATE_ALIASES.items()}


def detect_place(text):
    hay = (text or "").lower()
    best, blen = None, 0
    for key, d in PLACES.items():
        for al in d["aliases"] + [key]:
            a = al.lower()
            if len(a) >= 3 and a in hay and len(a) > blen:
                best, blen = d, len(a)
    return best


def detect_state(text):
    hay = (text or "").lower()
    best, score = None, 0
    for st, als in _STATE_ALIASES.items():
        sc = 0
        for a in als:
            a = a.lower()
            if re.fullmatch(r"[a-z ]+", a):
                sc += len(re.findall(r"\b" + re.escape(a) + r"\b", hay)) * 2
            else:
                sc += hay.count(a) * 2
        if sc > score:
            best, score = st, sc
    if not best:
        return None
    return {"state": best, "district": None, "name": STATE_HI_ALL.get(best, best), "lat": None, "lon": None,
            "aliases": _STATE_ALIASES[best], "state_only": True}
