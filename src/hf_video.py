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

HF_I2V_MODELS = [
    "Wan-AI/Wan2.1-I2V-14B-480P",
    "Lightricks/LTX-Video",
]

HF_T2V_MODELS = [
    "Wan-AI/Wan2.1-T2V-1.3B",
    "Lightricks/LTX-Video",
]


def _get_hf_token(token: str | None = None) -> str:
    return (
        token
        or os.environ.get("HF_TOKEN")
        or os.environ.get("HUGGINGFACE_API_KEY")
        or os.environ.get("HUGGINGFACE_TOKEN")
        or ""
    ).strip()


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


def _generate_via_gradio_space(prompt: str, out_path: Path, hf_token: str = "") -> Path:
    """Fallback to public HuggingFace Gradio Space (works even without HF_TOKEN)."""
    from gradio_client import Client
    from PIL import Image

    kwargs = {"token": hf_token} if hf_token else {}
    client = Client("black-forest-labs/FLUX.1-schnell", **kwargs)
    print(f"[HF-Video] Generating via public Space (FLUX.1-schnell): {prompt[:90]}...")
    res = client.predict(
        prompt=prompt,
        seed=0,
        randomize_seed=True,
        width=768,
        height=1344,
        num_inference_steps=4,
        api_name="/infer",
    )
    img_info = res[0] if isinstance(res, (tuple, list)) else res
    src_file = img_info.get("path") if isinstance(img_info, dict) else str(img_info)
    if not src_file or not Path(src_file).exists():
        raise RuntimeError(f"Gradio Space did not return a valid image file: {res}")
    with Image.open(src_file) as im:
        im.save(str(out_path), format="PNG")
    if out_path.exists() and out_path.stat().st_size > 10000:
        return out_path
    raise RuntimeError(f"Generated Space image too small ({out_path.stat().st_size} bytes)")


def _generate_via_ai_horde(prompt: str, out_path: Path, timeout_s: int = 120) -> Path:
    """Token-free open-generative fallback via AI Horde (384x640 9:16 vertical)."""
    import base64
    import time
    import requests
    from PIL import Image
    import io

    headers = {"apikey": "0000000000", "Client-Agent": "MindSpark:1.0:studio"}
    payload = {
        "prompt": prompt[:900],
        "params": {"width": 384, "height": 640, "steps": 20, "n": 1},
    }
    print(f"[HF-Video] Generating via AI Horde (open-generative, no token): {prompt[:80]}...")
    r = requests.post(
        "https://aihorde.net/api/v2/generate/async",
        headers=headers,
        json=payload,
        timeout=25,
    )
    if r.status_code not in (200, 202):
        raise RuntimeError(f"AI Horde submit failed ({r.status_code}): {r.text[:200]}")
    job_id = r.json()["id"]

    deadline = time.time() + timeout_s
    while time.time() < deadline:
        time.sleep(3)
        chk = requests.get(
            f"https://aihorde.net/api/v2/generate/check/{job_id}",
            headers=headers,
            timeout=15,
        )
        if chk.ok and chk.json().get("done"):
            break
    else:
        raise RuntimeError(f"AI Horde job {job_id} timed out after {timeout_s}s")

    st = requests.get(
        f"https://aihorde.net/api/v2/generate/status/{job_id}",
        headers=headers,
        timeout=20,
    )
    st.raise_for_status()
    gens = st.json().get("generations") or []
    if not gens:
        raise RuntimeError(f"AI Horde returned no generations for {job_id}")
    img_val = gens[0]["img"]
    if img_val.startswith("http"):
        img_bytes = requests.get(img_val, timeout=30).content
    else:
        img_bytes = base64.b64decode(img_val)
    with Image.open(io.BytesIO(img_bytes)) as im:
        im.convert("RGB").save(str(out_path), format="PNG")
    if out_path.exists() and out_path.stat().st_size > 5000:
        return out_path
    raise RuntimeError("AI Horde generated image too small")


def generate_scene_image(prompt: str, out_path: Path, token: str | None = None) -> Path:
    """Generate a 9:16 vertical image via HF InferenceClient, public FLUX Space, or AI Horde."""
    tok = _get_hf_token(token)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    last_err = None
    if tok:
        client = InferenceClient(token=tok)
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

    try:
        return _generate_via_gradio_space(prompt, out_path, hf_token=tok)
    except Exception as e:
        last_err = e
        print(f"[HF-Video] Public Space failed: {e}")

    try:
        return _generate_via_ai_horde(prompt, out_path)
    except Exception as e:
        last_err = e
        print(f"[HF-Video] AI Horde failed: {e}")

    raise RuntimeError(f"All HuggingFace / open-generative image generators failed: {last_err}")


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


def _generate_video_via_free_spaces(
    prompt: str,
    img_path: Path,
    raw_vid_path: Path,
    hf_token: str = "",
) -> Path | None:
    """Try 100% free HuggingFace Video Spaces (LTX-Video-Distilled & AnimateDiff-Lightning)."""
    import shutil
    from gradio_client import Client, handle_file

    kwargs = {"token": hf_token} if hf_token else {}

    # 1. Lightricks/ltx-video-distilled (Image-to-Video if image exists, else Text-to-Video)
    try:
        client = Client("Lightricks/ltx-video-distilled", **kwargs)
        if img_path.exists():
            print("[HF-Video] Trying free Space: Lightricks/ltx-video-distilled (I2V)...")
            res = client.predict(
                prompt,
                "worst quality, inconsistent motion, blurry, jittery, distorted",
                handle_file(str(img_path)),
                None,
                768,
                512,
                "image-to-video",
                3,
                9,
                42,
                True,
                1,
                True,
                api_name="/image_to_video",
            )
        else:
            print("[HF-Video] Trying free Space: Lightricks/ltx-video-distilled (T2V)...")
            res = client.predict(
                prompt,
                "worst quality, inconsistent motion, blurry, jittery, distorted",
                None,
                None,
                768,
                512,
                "text-to-video",
                3,
                9,
                42,
                True,
                1,
                True,
                api_name="/text_to_video",
            )
        vid_info = res[0] if isinstance(res, (tuple, list)) else res
        src_vid = vid_info.get("video") if isinstance(vid_info, dict) else str(vid_info)
        if src_vid and Path(src_vid).exists() and Path(src_vid).stat().st_size > 20000:
            shutil.copyfile(src_vid, raw_vid_path)
            return raw_vid_path
    except Exception as e:
        print(f"[HF-Video] Free Space ltx-video-distilled failed: {e}")

    # 2. ByteDance/AnimateDiff-Lightning (Text-to-Video)
    try:
        client = Client("ByteDance/AnimateDiff-Lightning", **kwargs)
        print("[HF-Video] Trying free Space: ByteDance/AnimateDiff-Lightning (T2V)...")
        res = client.predict(
            prompt[:300],
            "epiCRealism",
            "guoyww/animatediff-motion-lora-zoom-in",
            "4",
            api_name="/generate_image",
        )
        src_vid = res.get("video") if isinstance(res, dict) else str(res)
        if src_vid and Path(src_vid).exists() and Path(src_vid).stat().st_size > 20000:
            shutil.copyfile(src_vid, raw_vid_path)
            return raw_vid_path
    except Exception as e:
        print(f"[HF-Video] Free Space AnimateDiff-Lightning failed: {e}")

    return None


def generate_scene_video(
    prompt: str,
    img_path: Path,
    raw_vid_path: Path,
    token: str | None = None,
) -> Path | None:
    """Try generating real AI video motion via free HF Spaces first, then InferenceClient."""
    tok = _get_hf_token(token)
    motion_prompt = (
        f"Smooth cinematic camera movement, subtle character and cloth motion, "
        f"flickering warm firelight and glowing atmosphere: {prompt[:300]}"
    )

    # 0. Try 100% free HuggingFace Spaces first (works with free HF_TOKEN or anonymous quota)
    free_vid = _generate_video_via_free_spaces(motion_prompt, img_path, raw_vid_path, hf_token=tok)
    if free_vid:
        return free_vid

    if not tok:
        return None
    client = InferenceClient(token=tok)

    # 1. Try Image-to-Video if we have a reference image
    if img_path.exists():
        img_bytes = img_path.read_bytes()
        for model in HF_I2V_MODELS:
            try:
                print(f"[HF-Video] Generating AI video motion (I2V: {model})...")
                vid_bytes = client.image_to_video(
                    img_bytes,
                    prompt=motion_prompt,
                    model=model,
                )
                if vid_bytes and len(vid_bytes) > 20000:
                    raw_vid_path.write_bytes(vid_bytes)
                    return raw_vid_path
            except Exception as e:
                print(f"[HF-Video] I2V {model} failed: {e}")

    # 2. Try Text-to-Video directly
    for model in HF_T2V_MODELS:
        try:
            print(f"[HF-Video] Generating AI video motion (T2V: {model})...")
            vid_bytes = client.text_to_video(
                motion_prompt,
                model=model,
            )
            if vid_bytes and len(vid_bytes) > 20000:
                raw_vid_path.write_bytes(vid_bytes)
                return raw_vid_path
        except Exception as e:
            print(f"[HF-Video] T2V {model} failed: {e}")

    return None


def _ken_burns_filter(idx: int, frames: int) -> str:
    """Return a dynamic 30fps 1080x1920 dolly + breathing sway filter for image fallback."""
    mode = idx % 4
    if mode == 0:
        # Dynamic push-in with subtle vertical breathing
        z = "min(zoom+0.0022,1.22)"
        x = "iw/2-(iw/zoom/2)+sin(on/18)*14"
        y = "ih/2-(ih/zoom/2)+cos(on/24)*10"
    elif mode == 1:
        # Dynamic pull-out with subtle horizontal drift
        z = "if(lte(on,1),1.22,max(1.02,zoom-0.0020))"
        x = "iw/2-(iw/zoom/2)-sin(on/20)*14"
        y = "ih/2-(ih/zoom/2)"
    elif mode == 2:
        # Fast pan right + gentle zoom
        z = "min(zoom+0.0010,1.16)"
        x = f"(iw-iw/zoom)*on/{max(frames, 1)}"
        y = "ih/2-(ih/zoom/2)+sin(on/16)*12"
    else:
        # Fast pan left + gentle zoom
        z = "min(zoom+0.0010,1.16)"
        x = f"(iw-iw/zoom)*(1-on/{max(frames, 1)})"
        y = "ih/2-(ih/zoom/2)+cos(on/16)*12"

    return (
        f"scale=1620:2880:flags=lanczos,"
        f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s=1080x1920:fps=30,"
        f"eq=contrast=1.05:saturation=1.10,format=yuv420p"
    )


def _render_via_vox_remotion(
    scenes: list[dict],
    media_entries: list[tuple[Path, bool]],
    work_dir: Path,
    audio_path: Path,
    out_mp4: Path,
    topic_title: str,
    geo: dict | None = None,
    hashtags: list[str] | None = None,
    seed: int = 1234,
) -> bool:
    """Render 3-layer Vox Editorial Motion Graphics via Remotion VoxEditorial composition."""
    import json
    import shutil

    root = Path(__file__).resolve().parent.parent
    remotion_dir = root / "remotion"
    if not remotion_dir.exists():
        return False

    run_key = work_dir.name
    pub_media_dir = remotion_dir / "public" / "hf_media" / run_key
    pub_media_dir.mkdir(parents=True, exist_ok=True)

    vox_scenes = []
    for i, (sc, (mpath, is_vid)) in enumerate(zip(scenes, media_entries)):
        ext = mpath.suffix or (".mp4" if is_vid else ".png")
        dest_name = f"scene_{i}{ext}"
        shutil.copyfile(mpath, pub_media_dir / dest_name)
        dur = max(1.0, float(sc.get("durationSec") or sc.get("voiceSec") or sc.get("sec") or 5.0))
        entry = {
            "heading": sc.get("heading") or sc.get("title") or topic_title,
            "title": sc.get("title") or "",
            "narration": sc.get("narration") or "",
            "tts_text": sc.get("tts_text") or sc.get("narration") or "",
            "durationSec": dur,
            "mediaSrc": f"hf_media/{run_key}/{dest_name}",
            "isVideo": bool(is_vid),
        }
        if sc.get("words"):
            entry["words"] = sc["words"]
        if sc.get("state"):
            entry["state"] = sc["state"]
        if sc.get("place"):
            entry["place"] = sc["place"]
        vox_scenes.append(entry)

    props_path = work_dir / "vox_props.json"
    props_path.write_text(
        json.dumps(
            {
                "topicTitle": topic_title,
                "scenes": vox_scenes,
                "seed": seed,
                "geo": geo,
                "hashtags": hashtags or [],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    rendered_mp4 = (work_dir / "vox_rendered.mp4").resolve()
    npx = shutil.which("npx.cmd") or shutil.which("npx") or "npx.cmd"
    try:
        print("🎬 Rendering 3-layer VoxEditorial Motion Graphics via Remotion...")
        subprocess.run(
            [
                npx, "remotion", "render", "src/index.ts", "VoxEditorial", str(rendered_mp4),
                f"--props={props_path.resolve().as_posix()}",
                "--concurrency=1",
                "--gl=angle",
            ],
            cwd=remotion_dir,
            check=True,
        )
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(rendered_mp4),
                "-i", str(audio_path),
                "-map", "0:v", "-map", "1:a",
                "-c:v", "libx264", "-preset", "medium", "-b:v", "3500k",
                "-maxrate", "4500k", "-bufsize", "7000k",
                "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                "-c:a", "aac", "-b:a", "128k", "-shortest",
                str(out_mp4),
            ],
            check=True,
        )
        return out_mp4.exists() and out_mp4.stat().st_size > 50000
    except Exception as e:
        print(f"[HF-Video] VoxEditorial Remotion render failed ({e}), falling back to FFmpeg...")
        return False
    finally:
        shutil.rmtree(pub_media_dir, ignore_errors=True)


def render_hf_video(
    scenes: list[dict],
    work_dir: Path,
    audio_path: Path,
    out_mp4: Path,
    topic_title: str = "",
    token: str | None = None,
    geo: dict | None = None,
    hashtags: list[str] | None = None,
    seed: int = 1234,
) -> Path:
    """Generate scene images/video via HuggingFace/AI Horde, then render via VoxEditorial Remotion (or FFmpeg fallback)."""
    img_dir = work_dir / "hf_images"
    clip_dir = work_dir / "hf_clips"
    img_dir.mkdir(parents=True, exist_ok=True)
    clip_dir.mkdir(parents=True, exist_ok=True)

    media_entries: list[tuple[Path, bool]] = []
    clip_paths: list[Path] = []
    total_scenes = len(scenes)
    for i, sc in enumerate(scenes):
        img_path = img_dir / f"scene_{i}.png"
        raw_vid_path = clip_dir / f"raw_{i}.mp4"
        prompt = build_scene_prompt(topic_title, sc, i, total_scenes)

        if not img_path.exists():
            try:
                generate_scene_image(prompt, img_path, token=token)
            except Exception as img_e:
                print(f"[HF-Video] Scene {i} image failed ({img_e}), trying direct T2V...")

        dur = max(1.0, float(sc.get("durationSec") or sc.get("voiceSec") or sc.get("sec") or 5.0))
        clip_path = clip_dir / f"clip_{i}.mp4"

        ai_vid = generate_scene_video(prompt, img_path, raw_vid_path, token=token)
        if ai_vid and ai_vid.exists():
            media_entries.append((ai_vid, True))
        elif img_path.exists():
            media_entries.append((img_path, False))
        else:
            raise RuntimeError(f"Neither AI video nor AI image succeeded for scene {i}")

    if _render_via_vox_remotion(
        scenes, media_entries, work_dir, audio_path, out_mp4, topic_title,
        geo=geo, hashtags=hashtags, seed=seed,
    ):
        return out_mp4

    for i, (sc, (mpath, is_vid)) in enumerate(zip(scenes, media_entries)):
        dur = max(1.0, float(sc.get("durationSec") or sc.get("voiceSec") or sc.get("sec") or 5.0))
        frames = max(30, int(round(dur * 30)))
        clip_path = clip_dir / f"clip_{i}.mp4"
        if is_vid:
            subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-stream_loop", "-1", "-i", str(mpath),
                    "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p",
                    "-t", f"{dur:.3f}", "-an",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
                    str(clip_path),
                ],
                check=True,
            )
        else:
            vf = _ken_burns_filter(i, frames)
            subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-loop", "1", "-i", str(mpath),
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
