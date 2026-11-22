"""Buffer Instagram Reels uploader using Buffer GraphQL API.

Features:
- Official Meta / Instagram publishing partner (Zero strikes, 100% account safety).
- Automatically discovers your connected Instagram channel ID.
- Uploads MP4 to temporary direct public host (Catbox / tmpfiles) so Buffer can ingest it.
- Publishes Reel immediately to Instagram (mode: shareNow).
- Sends success/failure notification to Telegram.

Required Environment Variable:
- BUFFER_API_KEY (from https://publish.buffer.com/settings/api)
Optional:
- BUFFER_CHANNEL_ID (if you have multiple Instagram accounts in Buffer)
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Optional, Dict, Any, Tuple

import requests

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

try:
    from common import load_env
    load_env()
except Exception:
    pass

BUFFER_GRAPHQL_ENDPOINT = "https://api.buffer.com"


def _tg_send(text: str) -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip().strip('"').strip("'")
    chat = str(os.environ.get("TELEGRAM_CHAT_ID", "")).strip().strip('"').strip("'")
    if not token or not chat:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data={"chat_id": chat, "text": text},
            timeout=15,
        )
    except Exception as e:
        print(f"[Buffer] Telegram message failed: {e}")


def upload_temp_video(video_path: Path) -> str:
    """Uploads local MP4 file to a fast temporary direct public host so Buffer can ingest it."""
    print(f"[Buffer] Uploading video ({video_path.stat().st_size / (1024*1024):.1f} MB) to temporary public host...")

    # Method 1: Catbox.moe (Reliable, high speed, direct MP4 link)
    try:
        with open(video_path, "rb") as f:
            r = requests.post(
                "https://catbox.moe/user/api.php",
                data={"reqtype": "fileupload"},
                files={"fileToUpload": (video_path.name, f, "video/mp4")},
                timeout=120,
            )
        if r.status_code == 200 and r.text.startswith("http"):
            url = r.text.strip()
            print(f"[Buffer] Temporary public video URL ready: {url}")
            return url
    except Exception as e:
        print(f"[Buffer] Catbox upload error: {e}. Trying fallback...")

    # Method 2: tmpfiles.org
    try:
        with open(video_path, "rb") as f:
            r = requests.post(
                "https://tmpfiles.org/api/v1/upload",
                files={"file": (video_path.name, f, "video/mp4")},
                timeout=120,
            )
        if r.status_code == 200:
            data = r.json()
            raw_url = data.get("data", {}).get("url", "")
            if raw_url:
                # Convert https://tmpfiles.org/12345/video.mp4 -> https://tmpfiles.org/dl/12345/video.mp4
                dl_url = raw_url.replace("tmpfiles.org/", "tmpfiles.org/dl/")
                print(f"[Buffer] Temporary public video URL ready via tmpfiles: {dl_url}")
                return dl_url
    except Exception as e:
        print(f"[Buffer] tmpfiles fallback error: {e}")

    raise RuntimeError("Failed to obtain a public video URL for Buffer upload.")


def get_instagram_channel(api_key: str, preferred_channel_id: Optional[str] = None) -> Tuple[str, str]:
    """Queries Buffer account channels and returns (channel_id, channel_name)."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    query = """
    query GetChannels {
      account {
        channels {
          id
          name
          service
          serviceType
        }
      }
    }
    """
    res = requests.post(BUFFER_GRAPHQL_ENDPOINT, json={"query": query}, headers=headers, timeout=20)
    if res.status_code != 200:
        raise RuntimeError(f"Buffer API error ({res.status_code}): {res.text}")

    data = res.json()
    if "errors" in data and data["errors"]:
        raise RuntimeError(f"Buffer GraphQL error: {data['errors']}")

    channels = data.get("data", {}).get("account", {}).get("channels", [])
    if not channels:
        raise RuntimeError("No channels found in your Buffer account! Please connect your Instagram account on buffer.com first.")

    # If preferred channel is set and matches
    if preferred_channel_id:
        for ch in channels:
            if ch.get("id") == preferred_channel_id:
                return ch["id"], ch.get("name", "Instagram")

    # Look for Instagram channel
    for ch in channels:
        if ch.get("service") == "instagram":
            return ch["id"], ch.get("name", "Instagram")

    # Fallback: if only 1 channel exists
    if len(channels) == 1:
        return channels[0]["id"], channels[0].get("name", "Social Channel")

    names = [f"{ch.get('name')} ({ch.get('service')}, id={ch.get('id')})" for ch in channels]
    raise RuntimeError(f"Could not identify an Instagram channel. Found channels: {', '.join(names)}. Please set BUFFER_CHANNEL_ID.")


def publish_reel(api_key: str, channel_id: str, video_url: str, caption: str) -> Dict[str, Any]:
    """Calls Buffer createPost mutation to publish Instagram Reel immediately."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    mutation = """
    mutation CreateImmediateInstagramReel($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess {
          post {
            id
            status
          }
        }
        ... on MutationError {
          message
        }
      }
    }
    """
    variables = {
        "input": {
            "channelId": channel_id,
            "text": caption,
            "schedulingType": "automatic",
            "mode": "shareNow",
            "assets": [
                {
                    "video": {
                        "url": video_url
                    }
                }
            ],
            "metadata": {
                "instagram": {
                    "type": "reel",
                    "shouldShareToFeed": True
                }
            }
        }
    }

    res = requests.post(
        BUFFER_GRAPHQL_ENDPOINT,
        json={"query": mutation, "variables": variables},
        headers=headers,
        timeout=30,
    )
    if res.status_code != 200:
        raise RuntimeError(f"Buffer createPost HTTP {res.status_code}: {res.text}")

    result = res.json()
    if "errors" in result and result["errors"]:
        raise RuntimeError(f"Buffer GraphQL Errors: {result['errors']}")

    create_data = result.get("data", {}).get("createPost", {})
    if "message" in create_data:
        # MutationError
        raise RuntimeError(f"Buffer Mutation Error: {create_data['message']}")

    post_info = create_data.get("post", {})
    return post_info


def find_latest_output_dir(base_dir: Optional[str] = None) -> Optional[Path]:
    out_dir = Path(base_dir) if base_dir else (ROOT / "data" / "output")
    if not out_dir.exists():
        return None
    dirs = [d for d in out_dir.iterdir() if d.is_dir() and (d / "final.mp4").exists()]
    if not dirs:
        return None
    dirs.sort(key=lambda d: d.stat().st_mtime, reverse=True)
    return dirs[0]


def main():
    api_key = (os.environ.get("BUFFER_API_KEY") or "").strip().strip('"').strip("'")
    if not api_key:
        print("[Buffer] ℹ️ BUFFER_API_KEY is not set in environment or GitHub Secrets.")
        print("[Buffer] To enable 100% automated Instagram Reel uploads:")
        print("  1. Connect Instagram at https://buffer.com")
        print("  2. Get API key from https://publish.buffer.com/settings/api")
        print("  3. Add BUFFER_API_KEY to your GitHub Repository Secrets.")
        print("[Buffer] Skipping Instagram upload for this run.")
        sys.exit(0)

    # Find video
    target_dir = None
    if len(sys.argv) > 1 and sys.argv[1]:
        p = Path(sys.argv[1])
        if p.is_file() and p.name.endswith(".mp4"):
            video_file = p
            target_dir = p.parent
        elif p.is_dir():
            target_dir = p
            video_file = p / "final.mp4"
        else:
            target_dir = find_latest_output_dir(sys.argv[1])
            video_file = (target_dir / "final.mp4") if target_dir else None
    else:
        target_dir = find_latest_output_dir()
        video_file = (target_dir / "final.mp4") if target_dir else None

    if not video_file or not video_file.exists():
        print("[Buffer] ❌ No final.mp4 video file found to upload.")
        sys.exit(1)

    # Build Caption (Title + Description + Hashtags)
    title = ""
    desc = ""
    tags = []
    if target_dir:
        meta_file = target_dir / "meta.json"
        plan_file = target_dir / "plan.json"
        if meta_file.exists():
            try:
                m = json.loads(meta_file.read_text(encoding="utf-8"))
                y = m.get("youtube", {})
                title = y.get("title", "")
                desc = y.get("description", "")
                tags = y.get("tags", [])
            except Exception:
                pass
        elif plan_file.exists():
            try:
                p = json.loads(plan_file.read_text(encoding="utf-8"))
                y = p.get("youtube", {})
                title = y.get("title", "")
                desc = y.get("description", "")
                tags = y.get("tags", [])
            except Exception:
                pass

    if not title:
        title = "सनातन गाथा | रहस्य और इतिहास"

    tag_str = " ".join([f"#{t.replace(' ', '')}" for t in tags if t])
    if not tag_str:
        tag_str = "#sanatandharma #hindumythology #reels #viralreels #shorts"

    caption = f"{title}\n\n{desc}\n\n{tag_str}".strip()

    print("=" * 60)
    print("🚀 STARTING INSTAGRAM REEL UPLOAD VIA BUFFER")
    print(f"🎬 Video: {video_file} ({video_file.stat().st_size / (1024*1024):.1f} MB)")
    print(f"📝 Title: {title}")
    print("=" * 60)

    try:
        # Step 1: Discover channel
        pref_id = os.environ.get("BUFFER_CHANNEL_ID")
        channel_id, channel_name = get_instagram_channel(api_key, pref_id)
        print(f"[Buffer] Found Instagram Channel: {channel_name} (ID: {channel_id})")

        # Step 2: Upload temporary video
        public_url = upload_temp_video(video_file)

        # Step 3: Publish Reel via Buffer
        print("[Buffer] Publishing Reel to Instagram via Buffer API...")
        post = publish_reel(api_key, channel_id, public_url, caption)
        post_id = post.get("id", "ok")
        print(f"🎉 SUCCESS! Instagram Reel published successfully via Buffer! (Post ID: {post_id})")

        _tg_send(
            f"📸 *Instagram Reel Published!* (via Buffer)\n\n"
            f"📌 *Title:* {title}\n"
            f"👤 *Channel:* {channel_name}\n"
            f"✅ *Status:* Live on Instagram Reels"
        )
    except Exception as e:
        err_msg = f"❌ Instagram upload via Buffer failed: {e}"
        print(f"[Buffer] {err_msg}")
        _tg_send(err_msg)
        sys.exit(1)


if __name__ == "__main__":
    main()
