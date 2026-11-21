import json
import subprocess
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ART = Path(r"C:\Users\Asus\.gemini\antigravity\brain\62b7a0c1-df03-4115-a869-7e88d08cc9f0")

base_props = json.load(open(ROOT / "data/work/2026-11-21_140100_pf_story_851157/pf_props.json", encoding="utf-8"))

tests = [
    {
        "name": "test_cow",
        "text": "देवल की पवित्र गायें",
        "sub": "गोमाता और बछड़ा",
        "narration": "Deval Charani ki pavitra gayen aur bheda",
    },
    {
        "name": "test_vachan",
        "text": "पाबूजी का अखंड वचन",
        "sub": "देवल माता का आशीर्वाद",
        "narration": "Pabuji ne pavitra vachan diya aur mata ne aashirwad diya",
    },
    {
        "name": "test_weapon",
        "text": "राजपूत तलवार और ढाल",
        "sub": "धनुष-बाण का संधान",
        "narration": "Veer ne talwar dhal aur dhanush baan uthaya",
    },
]

for t in tests:
    props = dict(base_props)
    props["scenes"] = [dict(base_props["scenes"][0])]
    props["scenes"][0]["text"] = t["text"]
    props["scenes"][0]["sub"] = t["sub"]
    props["scenes"][0]["narration"] = t["narration"]
    
    prop_path = ROOT / f"{t['name']}_props.json"
    with open(prop_path, "w", encoding="utf-8") as f:
        json.dump(props, f, ensure_ascii=False, indent=2)
    
    out_img = ROOT / f"{t['name']}_frame.jpg"
    cmd = [
        "npx.cmd", "remotion", "still",
        "src/cinematic/entry.tsx", "PaperFilm",
        str(out_img),
        f"--props={str(prop_path)}",
        "--frame=30"
    ]
    print(f"Rendering {t['name']}...")
    subprocess.run(cmd, cwd=ROOT / "remotion", check=True)
    
    dest = ART / f"{t['name']}_frame.jpg"
    shutil.copyfile(out_img, dest)
    print(f"Saved: {dest}")

print("All 3 SVG previews rendered successfully!")
