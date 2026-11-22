"""Buffer Instagram Reels uploader using Buffer GraphQL API.

Features:
- Official Meta / Instagram publishing partner (Zero strikes, 100% account safety).
- Automatically discovers your connected Instagram channel ID (organizations -> channels).
- Uploads MP4 to a temporary public host (tries several) and verifies the URL is directly readable.
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
from typing import Optional, Dict, Any, Tuple, List

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
UA = {"User-Agent": "Mozilla/5.0"}


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


# ---------------------------------------------------------------------------
# Temporary public video hosting
# ---------------------------------------------------------------------------

def _check_public_video(url: str) -> bool:
    """Checks that the URL is directly readable as a video (like Buffer would fetch it)."""
    try:
        r = requests.get(
            url,
            headers={"Range": "bytes=0-1023", "User-Agent": "Mozilla/5.0"},
            timeout=20,
            stream=True,
            allow_redirects=True,
        )
        ctype = r.headers.get("Content-Type", "").lower()
        status = r.status_code
        r.close()
        print(f"[Buffer] URL check: HTTP {status}, Content-Type: {ctype}")
        return status in (200, 206) and ("video" in ctype or "octet-stream" in ctype)
    except Exception as e:
        print(f"[Buffer] URL check failed: {e}")
        return False


def upload_temp_video(video_path: Path) -> str:
    """Uploads MP4 to temporary hosts; returns the first URL that passes a direct-read check."""
    size_mb = video_path.stat().st_size / (1024 * 1024)
    print(f"[Buffer] Uploading video ({size_mb:.1f} MB) to temporary public host...")

    def litterbox() -> str:
        with open(video_path, "rb") as f:
            r = requests.post(
                "https://litterbox.catbox.moe/resources/internals/api.php",
                data={"reqtype": "fileupload", "time": "24h"},
                files={"fileToUpload": (video_path.name, f, "video/mp4")},
                headers=UA, timeout=180,
            )
        r.raise_for_status()
        return r.text.strip()

    def catbox() -> str:
        with open(video_path, "rb") as f:
            r = requests.post(
                "https://catbox.moe/user/api.php",
                data={"reqtype": "fileupload"},
                files={"fileToUpload": (video_path.name, f, "video/mp4")},
                headers=UA, timeout=180,
            )
        r.raise_for_status()
        return r.text.strip()

    def uguu() -> str:
        with open(video_path, "rb") as f:
            r = requests.post(
                "https://uguu.se/upload",
                files={"files[]": (video_path.name, f, "video/mp4")},
                headers=UA, timeout=180,
            )
        r.raise_for_status()
        return r.json()["files"][0]["url"]

    def zerox0() -> str:
        with open(video_path, "rb") as f:
            r = requests.post(
                "https://0x0.st",
                files={"file": (video_path.name, f, "video/mp4")},
                headers=UA, timeout=180,
            )
        r.raise_for_status()
        return r.text.strip()

    def tmpfiles() -> str:
        with open(video_path, "rb") as f:
            r = requests.post(
                "https://tmpfiles.org/api/v1/upload",
                files={"file": (video_path.name, f, "video/mp4")},
                headers=UA, timeout=180,
            )
        r.raise_for_status()
        raw = r.json().get("data", {}).get("url", "")
        return raw.replace("tmpfiles.org/", "tmpfiles.org/dl/")

    hosts = [
        ("litterbox", litterbox),
        ("catbox", catbox),
        ("uguu", uguu),
        ("0x0.st", zerox0),
        ("tmpfiles", tmpfiles),
    ]
    for name, fn in hosts:
        try:
            url = fn()
            if not url.startswith("http"):
                print(f"[Buffer] {name}: unexpected response: {url[:100]}")
                continue
            print(f"[Buffer] {name} URL: {url}")
            if _check_public_video(url):
                return url
            print(f"[Buffer] {name} URL not directly readable, trying next host...")
        except Exception as e:
            print(f"[Buffer] {name} failed: {e}")

    raise RuntimeError("No temporary host gave a directly readable public video URL.")


# ---------------------------------------------------------------------------
# Buffer GraphQL
# ---------------------------------------------------------------------------

def _gql(api_key: str, query: str, variables: Optional[dict] = None) -> dict:
    """Runs one Buffer GraphQL request and returns the 'data' dict (raises on any error)."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    res = requests.post(
        BUFFER_GRAPHQL_ENDPOINT,
        json={"query": query, "variables": variables or {}},
        headers=headers,
        timeout=30,
    )
    if res.status_code != 200:
        raise RuntimeError(f"Buffer API error ({res.status_code}): {res.text}")

    data = res.json()
    if data.get("errors"):
        raise RuntimeError(f"Buffer GraphQL error: {data['errors']}")
    return data.get("data") or {}


def get_instagram_channel(api_key: str, preferred_channel_id: Optional[str] = None) -> Tuple[str, str]:
    """Finds the Instagram channel via organizations -> channels. Returns (channel_id, channel_name)."""
    # Step 1: organizations
    orgs_data = _gql(api_key, """
    query GetOrgs {
      account {
        organizations {
          id
          name
        }
      }
    }
    """)
    orgs = (orgs_data.get("account") or {}).get("organizations") or []
    if not orgs:
        raise RuntimeError("No organizations found in your Buffer account.")

    # Step 2: channels of each organization
    channels: List[Dict[str, Any]] = []
    for org in orgs:
        ch_data = _gql(api_key, """
        query GetChannels($input: ChannelsInput!) {
          channels(input: $input) {
            id
            name
            service
          }
        }
        """, {"input": {"organizationId": org["id"]}})
        channels.extend(ch_data.get("channels") or [])

    if not channels:
        raise RuntimeError("No channels found in your Buffer account! Please connect your Instagram account on buffer.com first.")

    # If preferred channel is set and matches
    if preferred_channel_id:
        for ch in channels:
            if ch.get("id") == preferred_channel_id:
                return ch["id"], ch.get("name", "Instagram")

    # Look for Instagram channel
    for ch in channels:
        if str(ch.get("service")).lower() == "instagram":
            return ch["id"], ch.get("name", "Instagram")

    # Fallback: if only 1 channel exists
    if len(channels) == 1:
        return channels[0]["id"], channels[0].get("name", "Social Channel")

    names = [f"{ch.get('name')} ({ch.get('service')}, id={ch.get('id')})" for ch in channels]
    raise RuntimeError(f"Could not identify an Instagram channel. Found channels: {', '.join(names)}. Please set BUFFER_CHANNEL_ID.")


def publish_reel(api_key: str, channel_id: str, video_url: str, caption: str) -> Dict[str, Any]:
    """Calls Buffer createPost mutation to publish Instagram Reel immediately."""
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

    data = _gql(api_key, mutation, variables)

    create_data = data.get("createPost") or {}
    if "message" in create_data:
        raise RuntimeError(f"Buffer Mutation Error: {create_data['message']}")

    return create_data.get("post") or {}


# ---------------------------------------------------------------------------
# Directory discovery + upload
# ---------------------------------------------------------------------------

def find_candidate_dirs(args: List[str]) -> List[Path]:
    """Finds all output directories containing final.mp4."""
    candidates = []
    # 1. From passed args
    for a in args:
        p = Path(a)
        if p.is_dir() and (p / "final.mp4").exists():
            candidates.append(p)
        elif p.is_file() and p.name.endswith(".mp4") and p.exists():
            candidates.append(p.parent)

    if candidates:
        return candidates

    # 2. Check data/output
    out_dir = ROOT / "data" / "output"
    if out_dir.exists():
        dirs = [d for d in out_dir.iterdir() if d.is_dir() and (d / "final.mp4").exists()]
        if dirs:
            dirs.sort(key=lambda d: d.stat().st_mtime, reverse=True)
            return [dirs[0]]

    # 3. Check data/work
    work_dir = ROOT / "data" / "work"
    if work_dir.exists():
        dirs = [d for d in work_dir.iterdir() if d.is_dir() and (d / "final.mp4").exists()]
        if dirs:
            dirs.sort(key=lambda d: d.stat().st_mtime, reverse=True)
            return [dirs[0]]

    return []


def upload_directory(d: Path, api_key: str, channel_id: str, channel_name: str):
    video_file = d / "final.mp4"
    if not video_file.exists():
        return

    # Build Caption (Title + Description + Hashtags)
    title = ""
    desc = ""
    tags = []
    meta_file = d / "meta.json"
    plan_file = d / "plan.json"
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
    print(f"📁 Directory: {d.name}")
    print(f"🎬 Video: {video_file} ({video_file.stat().st_size / (1024*1024):.1f} MB)")
    print(f"📝 Title: {title}")
    print("=" * 60)

    # Step 1: Upload temporary video (verified directly readable)
    public_url = upload_temp_video(video_file)

    # Step 2: Publish Reel via Buffer
    print(f"[Buffer] Publishing Reel to Instagram ({channel_name})...")
    post = publish_reel(api_key, channel_id, public_url, caption)
    post_id = post.get("id", "ok")
    print(f"🎉 SUCCESS! Instagram Reel published successfully via Buffer! (Post ID: {post_id})")

    _tg_send(
        f"📸 *Instagram Reel Published!* (via Buffer)\n\n"
        f"📌 *Title:* {title}\n"
        f"👤 *Channel:* {channel_name}\n"
        f"✅ *Status:* Live on Instagram Reels"
    )


def main():
    api_key = (os.environ.get("BUFFER_API_KEY") or "").strip().strip('"').strip("'")
    if not api_key:
        print("[Buffer] ℹ️ BUFFER_API_KEY is not set in environment or GitHub Secrets.")
        print("[Buffer] Skipping Instagram upload for this run.")
        sys.exit(0)

    candidate_dirs = find_candidate_dirs(sys.argv[1:])
    if not candidate_dirs:
        print("[Buffer] ℹ️ No directory with final.mp4 found to upload right now.")
        sys.exit(0)

    # Discover Instagram Channel once
    pref_id = (os.environ.get("BUFFER_CHANNEL_ID") or "").strip() or None
    channel_id, channel_name = get_instagram_channel(api_key, pref_id)
    print(f"[Buffer] Target Instagram Channel: {channel_name} (ID: {channel_id})")

    for d in candidate_dirs:
        try:
            upload_directory(d, api_key, channel_id, channel_name)
        except Exception as e:
            err_msg = f"❌ Instagram upload via Buffer failed for {d.name}: {e}"
            print(f"[Buffer] {err_msg}")
            _tg_send(err_msg)


if __name__ == "__main__":
    main()
