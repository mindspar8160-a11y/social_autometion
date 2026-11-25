import os
import sys
import json
import argparse
from pathlib import Path

# Enforce UTF-8 for Windows console
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]

def get_refresh_token(client_id=None, client_secret=None):
    print("=" * 65)
    print("🎬 MINDSPARK YOUTUBE REFRESH TOKEN GENERATOR")
    print("=" * 65)

    secrets_file = ROOT / "config" / "client_secrets.json"
    token_file = ROOT / "config" / "youtube_token.json"

    if client_id and client_secret:
        client_id = client_id.strip().strip('"').strip("'")
        client_secret = client_secret.strip().strip('"').strip("'")
        client_config = {
            "installed": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "redirect_uris": ["http://localhost:8080/", "http://localhost"]
            }
        }
        secrets_file.parent.mkdir(parents=True, exist_ok=True)
        with open(secrets_file, "w", encoding="utf-8") as f:
            json.dump(client_config, f, indent=2)
        print(f"✅ Updated {secrets_file.name} with provided credentials.")
    elif secrets_file.exists():
        try:
            with open(secrets_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            info = data.get("installed") or data.get("web") or {}
            client_id = info.get("client_id")
            client_secret = info.get("client_secret")
            client_config = data
            print(f"📂 Loaded existing credentials from {secrets_file.name}")
        except Exception as e:
            print(f"❌ Failed to read {secrets_file}: {e}")
            return
    else:
        print(f"❌ Error: {secrets_file} not found and no credentials passed.")
        return

    FIXED_STATE = "mindspark_youtube_auth"
    flow = InstalledAppFlow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri="http://localhost:8080/"
    )

    auth_url, _ = flow.authorization_url(
        prompt="consent",
        access_type="offline",
        state=FIXED_STATE
    )

    url_file = ROOT / "data" / "oauth_url.txt"
    url_file.parent.mkdir(parents=True, exist_ok=True)
    url_file.write_text(auth_url, encoding="utf-8")

    print("\n👉 AUTHORIZATION URL:\n" + auth_url + "\n", flush=True)
    print("🌐 Listening on http://localhost:8080/ for Google callback...", flush=True)

    try:
        creds = flow.run_local_server(
            port=8080,
            prompt="consent",
            access_type="offline",
            state=FIXED_STATE,
            open_browser=True
        )

        refresh_token = creds.refresh_token

        # Save to token file
        token_file.parent.mkdir(parents=True, exist_ok=True)
        with open(token_file, "w", encoding="utf-8") as f:
            f.write(creds.to_json())

        print("\n" + "=" * 65)
        print("🎉 SUCCESS! NEW YOUTUBE TOKENS GENERATED!")
        print("=" * 65)
        print(f"\n📌 REFRESH TOKEN:\n{refresh_token}\n")
        print(f"💾 Saved credentials to: {token_file}")

        try:
            yt = build("youtube", "v3", credentials=creds)
            res = yt.channels().list(part="snippet", mine=True).execute()
            if res.get("items"):
                ch = res["items"][0]["snippet"]
                print(f"📺 Connected Channel: {ch.get('title')}")
                print(f"🆔 Channel ID: {res['items'][0].get('id')}")
        except Exception as ve:
            print(f"⚠️ Note on channel verification: {ve}")

        print("=" * 65)
        print("🚀 Video upload is ready to roll!")
        print("=" * 65)

    except Exception as e:
        print(f"\n❌ Authorization failed: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate YouTube Refresh Token")
    parser.add_argument("--client-id", help="Google Cloud OAuth Client ID")
    parser.add_argument("--client-secret", help="Google Cloud OAuth Client Secret")
    args = parser.parse_args()

    get_refresh_token(args.client_id, args.client_secret)
