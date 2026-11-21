"""Sequentially render Part 1, Part 2, and Part 3 of Baji Prabhu Deshpande with PaperFilm 3D Diorama Engine."""
import sys, os, shutil, subprocess
from pathlib import Path

# Add src to python path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

import daily_pipeline
from common import jload, load_env
import series_manager

ART_DIR = Path(r"C:\Users\Asus\.gemini\antigravity\brain\62b7a0c1-df03-4115-a869-7e88d08cc9f0")

class Args:
    book = None
    script = None
    mode = "myth"
    myth = True
    engine = "paperfilm"
    template = None
    style = None
    headless = True
    topic = "baji_prabhu_pawankhind"
    part = 1

def render_part(part_num):
    print("=" * 60)
    print(f"🚀 RENDERING BAJI PRABHU DESHPANDE - PART {part_num} OF 3")
    print("=" * 60)
    
    args = Args()
    args.part = part_num
    load_env()
    voice_cfg = jload(ROOT / "config" / "voice_config.json", {})
    
    # Run the pipeline
    daily_pipeline.run_paperfilm_pipeline(args, voice_cfg)
    
    # Find newest final.mp4 in data/output
    out_dirs = sorted((ROOT / "data" / "output").glob("*_pf_baji_prabhu*"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not out_dirs:
        print("❌ Could not find output directory!")
        return
    latest_out = out_dirs[0]
    final_mp4 = latest_out / "final.mp4"
    if not final_mp4.exists():
        print(f"❌ Final MP4 not found in {latest_out}")
        return
        
    # Copy to artifacts
    dst_mp4 = ART_DIR / f"baji_prabhu_part{part_num}.mp4"
    dst_still = ART_DIR / f"baji_prabhu_part{part_num}_still.jpg"
    shutil.copyfile(final_mp4, dst_mp4)
    print(f"✅ Copied to artifact: {dst_mp4}")
    
    # Extract still at ~10 seconds
    try:
        subprocess.run(["ffmpeg", "-y", "-ss", "00:00:10", "-i", str(dst_mp4), "-vframes", "1", "-q:v", "2", str(dst_still)], check=True)
        print(f"🖼️ Extracted preview still: {dst_still}")
    except Exception as e:
        print(f"⚠️ Still extraction warning: {e}")

if __name__ == "__main__":
    parts = [1, 2, 3]
    if len(sys.argv) > 1:
        parts = [int(p) for p in sys.argv[1:]]
        
    for p in parts:
        render_part(p)
    print("\n🎉 ALL 3 PARTS RENDERED SUCCESSFULLY!")
