"""HuggingFace AI Scene Image + Ken Burns Motion + Devanagari Subtitles video renderer.

Generates per-scene 9:16 vertical illustrations via HuggingFace Inference API
(FLUX.1-schnell with SDXL fallback), applies smooth Ken Burns camera motion
at 1080x1920 30fps, burns in consistent Devanagari ASS subtitles, and muxes
with the mastered 4C Cool voiceover + BGM track.
"""
from __future__ import annotations

import os
import platform
import re
import subprocess
from pathlib import Path

from huggingface_hub import InferenceClient

STYLE_SUFFIX = (
    "Cinematic Indian epic digital painting, rich warm golden lighting, "
    "dramatic atmosphere, expressive characters, ultra-detailed, "
    "vertical 9:16 portrait composition, no text, no watermark, no letters"
)

HF_IMAGE_MODELS = [
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-xl-base-1.0",
]


def _get_hf_token(token: str | None = None) -> str:
    tok = (
        token
        or os.environ.get("HF_TOKEN")
        or os.environ.get("HUGGINGFACE_API_KEY")
        or os.environ.get("HUGGINGFACE_TOKEN")
        or ""
    ).strip()
    if not tok:
        raise RuntimeError(
            "HF_TOKEN / HUGGINGFACE_API_KEY is not set; cannot generate HuggingFace AI images."
        )
    return tok


def build_scene_prompt(topic_title: str, scene: dict, idx: int, total_scenes: int) -> str:
    """Build a vivid visual prompt for a scene without mismatched generic icons."""
    explicit = (scene.get("visual_prompt") or scene.get("image_prompt") or "").strip()
    if explicit:
        return f"{explicit}, {STYLE_SUFFIX}"

    heading = (scene.get("heading") or scene.get("title") or "").strip()
    narration = (scene.get("tts_text") or scene.get("narration") or "").strip()
    # Keep prompt concise and focused on the visual story moment
    context = f"{topic_title}. {heading}. {narration[:180]}".strip()
    if idx == 0:
        shot = "Dramatic close-up opening hook shot, intense emotion and glowing aura"
    elif idx == total_scenes - 1:
        shot = "Inspiring wide epic finale shot, divine golden rays and glowing sky"
    else:
        shot = "Dynamic mid-action storytelling shot, rich historical/mythological setting"
    return f"{shot} depicting: {context}. {STYLE_SUFFIX}"


def generate_scene_image(prompt: str, out_path: Path, token: str | None = None) -> Path:
    """Generate a 9:16 vertical image using HuggingFace InferenceClient."""
    tok = _get_hf_token(token)
    client = InferenceClient(token=tok)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    last_err = None
    for model in HF_IMAGE_MODELS:
        try:
            print(f"[HF-Video] Generating image ({model}): {prompt[:90]}...")
            img = client.text_to_image(
                prompt,
                model=model,
                width=768,
                height=1344,
            )
            img.save(str(out_path), format="PNG")
            if out_path.exists() and out_path.stat().st_size > 10000:
                return out_path
            raise RuntimeError(f"Generated image too small ({out_path.stat().st_size} bytes)")
        except Exception as e:
            last_err = e
            print(f"[HF-Video] {model} failed: {e}")
    raise RuntimeError(f"All HuggingFace image models failed: {last_err}")


def _ass_time(sec: float) -> str:
    sec = max(0.0, float(sec))
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def _split_chunks(text: str, max_words: int = 4) -> list[str]:
    clean = re.sub(r"\s+", " ", (text or "").strip())
    if not clean:
        return []
    words = clean.split(" ")
    return [" ".join(words[i : i + max_words]) for i in range(0, len(words), max_words)]


def build_ass_subtitles(scenes: list[dict], ass_path: Path) -> Path:
    """Create consistent Devanagari ASS subtitles timed to each scene's durationSec."""
    font_name = "Nirmala UI" if platform.system() == "Windows" else "Noto Sans Devanagari"
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},64,&H00FFFFFF,&H0000D7FF,&H00000000,&H99000000,-1,0,0,0,100,100,0,0,1,5,2,2,60,60,260,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header]
    t = 0.0
    for sc in scenes:
        dur = float(sc.get("durationSec") or sc.get("voiceSec") or sc.get("sec") or 5.0)
        # Always use Devanagari tts_text (fallback to narration) for script consistency
        raw_text = (sc.get("tts_text") or sc.get("narration") or "").strip()
        raw_text = re.sub(r"\[.*?\]|\(.*?\)", "", raw_text).strip()
        chunks = _split_chunks(raw_text, max_words=4)
        if not chunks:
            t += dur
            continue
        total_chars = sum(len(c) for c in chunks) or 1
        cur = t
        for idx, chunk in enumerate(chunks):
            frac = len(chunk) / total_chars
            c_dur = dur * frac if idx < len(chunks) - 1 else (t + dur - cur)
            c_dur = max(0.25, c_dur)
            start_s = _ass_time(cur)
            end_s = _ass_time(min(t + dur, cur + c_dur))
            safe = chunk.replace("{", "").replace("}", "").replace("\n", " ")
            lines.append(f"Dialogue: 0,{start_s},{end_s},Default,,0,0,0,,{safe}\n")
            cur += c_dur
        t += dur

    ass_path.write_text("".join(lines), encoding="utf-8")
    return ass_path


def _ken_burns_filter(idx: int, frames: int) -> str:
    """Return a smooth 30fps 1080x1920 zoompan filter alternating 4 camera motions."""
    mode = idx % 4
    if mode == 0:
        # Smooth zoom in
        z = "min(zoom+0.0012,1.15)"
        x = "iw/2-(iw/zoom/2)"
        y = "ih/2-(ih/zoom/2)"
    elif mode == 1:
        # Smooth zoom out
        z = "if(lte(on,1),1.15,max(1.0,zoom-0.0012))"
        x = "iw/2-(iw/zoom/2)"
        y = "ih/2-(ih/zoom/2)"
    elif mode == 2:
        # Gentle pan right while slightly zoomed
        z = "1.12"
        x = f"(iw-iw/zoom)*on/{max(frames, 1)}"
        y = "ih/2-(ih/zoom/2)"
    else:
        # Gentle pan left while slightly zoomed
        z = "1.12"
        x = f"(iw-iw/zoom)*(1-on/{max(frames, 1)})"
        y = "ih/2-(ih/zoom/2)"

    return (
        f"scale=1620:2880:flags=lanczos,"
        f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s=1080x1920:fps=30,"
        f"eq=contrast=1.04:saturation=1.08,format=yuv420p"
    )


def render_hf_video(
    scenes: list[dict],
    work_dir: Path,
    audio_path: Path,
    out_mp4: Path,
    topic_title: str = "",
    token: str | None = None,
) -> Path:
    """Generate scene images via HuggingFace, animate with Ken Burns, burn subtitles, mux audio."""
    img_dir = work_dir / "hf_images"
    clip_dir = work_dir / "hf_clips"
    img_dir.mkdir(parents=True, exist_ok=True)
    clip_dir.mkdir(parents=True, exist_ok=True)

    clip_paths: list[Path] = []
    total_scenes = len(scenes)
    for i, sc in enumerate(scenes):
        img_path = img_dir / f"scene_{i}.png"
        if not img_path.exists():
            prompt = build_scene_prompt(topic_title, sc, i, total_scenes)
            generate_scene_image(prompt, img_path, token=token)

        dur = max(1.0, float(sc.get("durationSec") or sc.get("voiceSec") or sc.get("sec") or 5.0))
        frames = max(30, int(round(dur * 30)))
        clip_path = clip_dir / f"clip_{i}.mp4"
        vf = _ken_burns_filter(i, frames)
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-loop", "1", "-i", str(img_path),
                "-vf", vf,
                "-t", f"{dur:.3f}",
                "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
                str(clip_path),
            ],
            check=True,
        )
        clip_paths.append(clip_path)

    concat_file = work_dir / "concat.txt"
    concat_file.write_text(
        "".join(f"file '{p.resolve().as_posix()}'\n" for p in clip_paths),
        encoding="utf-8",
    )
    merged_mp4 = work_dir / "merged_raw.mp4"
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(concat_file),
            "-c", "copy",
            str(merged_mp4),
        ],
        check=True,
    )

    ass_path = build_ass_subtitles(scenes, work_dir / "subtitles.ass")
    # Escape path for ffmpeg ass filter on Windows & POSIX
    ass_escaped = ass_path.resolve().as_posix().replace(":", "\\:")

    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(merged_mp4),
            "-i", str(audio_path),
            "-vf", f"ass='{ass_escaped}'",
            "-map", "0:v", "-map", "1:a",
            "-c:v", "libx264", "-preset", "medium", "-b:v", "3500k",
            "-maxrate", "4500k", "-bufsize", "7000k",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            "-c:a", "aac", "-b:a", "128k", "-shortest",
            str(out_mp4),
        ],
        check=True,
    )
    return out_mp4
