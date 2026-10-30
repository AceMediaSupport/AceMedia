#!/usr/bin/env python3
"""
get_videos.py — list video links from an Instagram / TikTok / YouTube channel
within a date range.

Usage:
    python get_videos.py <channel_url> --from 2026-01-01 --to 2026-10-30
    python get_videos.py https://www.youtube.com/@aceprodigy --from 2026-05-01 --to 2026-10-30 --shorts-only
    python get_videos.py https://www.tiktok.com/@aceprodigy --from 2026-01-01 --to 2026-10-30
    python get_videos.py https://www.instagram.com/aceprodigy --from 2026-01-01 --to 2026-10-30 --cookies ig_cookies.txt

Outputs <out_dir>/videos_<platform>_<handle>_<from>_<to>.json and .csv.
"""

import argparse
import csv
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urlparse

try:
    from yt_dlp import YoutubeDL
    from yt_dlp.utils import DownloadError
except ImportError:
    sys.exit("yt-dlp is required. Install with: pip install -r requirements.txt")


PLATFORMS = {
    "youtube.com": "youtube",
    "youtu.be": "youtube",
    "tiktok.com": "tiktok",
    "instagram.com": "instagram",
}


def detect_platform(url: str) -> str:
    host = urlparse(url).netloc.lower().removeprefix("www.").removeprefix("m.")
    for domain, name in PLATFORMS.items():
        if host == domain or host.endswith("." + domain):
            return name
    raise ValueError(f"Unsupported URL host: {host!r}. Supply a YouTube, TikTok, or Instagram URL.")


def extract_handle(url: str, platform: str) -> str:
    path = urlparse(url).path.strip("/")
    if not path:
        return "channel"
    first = path.split("/")[0]
    if platform == "youtube":
        return first.lstrip("@") or "channel"
    return first.lstrip("@") or "channel"


def normalize_url(url: str, platform: str, shorts_only: bool) -> str:
    if platform == "youtube" and shorts_only:
        parsed = urlparse(url)
        path = parsed.path.rstrip("/")
        if not path.endswith("/shorts"):
            path = f"{path}/shorts"
        url = parsed._replace(path=path).geturl()
    return url


def parse_date(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


def to_yyyymmdd(d: date) -> str:
    return d.strftime("%Y%m%d")


def entry_upload_date(entry: dict) -> date | None:
    for key in ("upload_date", "release_date"):
        val = entry.get(key)
        if val and re.fullmatch(r"\d{8}", val):
            return datetime.strptime(val, "%Y%m%d").date()
    ts = entry.get("timestamp") or entry.get("release_timestamp")
    if isinstance(ts, (int, float)):
        return datetime.utcfromtimestamp(ts).date()
    return None


def enumerate_entries(url: str, cookies: str | None) -> list[dict]:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": "in_playlist",
        "skip_download": True,
        "ignoreerrors": True,
    }
    if cookies:
        opts["cookiefile"] = cookies

    with YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)

    if not info:
        return []
    entries = info.get("entries") or []
    # Some channel URLs come back as a list of tabs (home, videos, shorts, …).
    # Flatten one level deeper when the "entries" are themselves playlists.
    flat: list[dict] = []
    for e in entries:
        if not e:
            continue
        if e.get("_type") == "playlist" and e.get("entries"):
            for sub in e["entries"]:
                if sub:
                    flat.append(sub)
        else:
            flat.append(e)
    return flat


def hydrate_entry(entry: dict, cookies: str | None) -> dict:
    """When extract_flat omits upload_date, pull it with a per-video lookup."""
    if entry_upload_date(entry):
        return entry
    video_url = entry.get("url") or entry.get("webpage_url")
    if not video_url:
        return entry
    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "ignoreerrors": True,
    }
    if cookies:
        opts["cookiefile"] = cookies
    try:
        with YoutubeDL(opts) as ydl:
            full = ydl.extract_info(video_url, download=False)
        if full:
            entry = {**entry, **full}
    except DownloadError:
        pass
    return entry


def canonical_video_url(entry: dict, platform: str) -> str:
    url = entry.get("webpage_url") or entry.get("original_url") or entry.get("url") or ""
    vid = entry.get("id") or ""
    if url.startswith("http"):
        return url
    if platform == "youtube" and vid:
        return f"https://www.youtube.com/watch?v={vid}"
    if platform == "tiktok" and vid:
        return f"https://www.tiktok.com/video/{vid}"
    if platform == "instagram" and vid:
        return f"https://www.instagram.com/reel/{vid}/"
    return url


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("url", help="Channel / profile URL (YouTube, TikTok, or Instagram)")
    ap.add_argument("--from", dest="date_from", required=True, help="Start date (YYYY-MM-DD, inclusive)")
    ap.add_argument("--to", dest="date_to", required=True, help="End date (YYYY-MM-DD, inclusive)")
    ap.add_argument("--shorts-only", action="store_true", help="YouTube only: restrict to the /shorts tab")
    ap.add_argument("--cookies", help="Path to a Netscape-format cookies file (recommended for Instagram)")
    ap.add_argument("--out-dir", default="out", help="Output directory (default: ./out)")
    ap.add_argument("--max", type=int, default=0, help="Hard cap on entries scanned before date filtering (0 = no cap)")
    args = ap.parse_args()

    try:
        d_from = parse_date(args.date_from)
        d_to = parse_date(args.date_to)
    except ValueError as e:
        sys.exit(f"Bad date: {e}")
    if d_from > d_to:
        sys.exit("--from must be <= --to")

    try:
        platform = detect_platform(args.url)
    except ValueError as e:
        sys.exit(str(e))

    handle = extract_handle(args.url, platform)
    source_url = normalize_url(args.url, platform, args.shorts_only)

    print(f"[1/3] Enumerating {platform} profile: {source_url}", file=sys.stderr)
    entries = enumerate_entries(source_url, args.cookies)
    if args.max > 0:
        entries = entries[: args.max]
    print(f"      Found {len(entries)} candidate entries", file=sys.stderr)

    print(f"[2/3] Checking upload dates and filtering {d_from}..{d_to}", file=sys.stderr)
    results = []
    scanned = 0
    for entry in entries:
        scanned += 1
        d = entry_upload_date(entry)
        if d is None:
            entry = hydrate_entry(entry, args.cookies)
            d = entry_upload_date(entry)
        if d is None:
            continue
        if d < d_from or d > d_to:
            continue
        results.append({
            "platform": platform,
            "id": entry.get("id"),
            "url": canonical_video_url(entry, platform),
            "title": entry.get("title") or "",
            "upload_date": d.isoformat(),
            "duration_seconds": entry.get("duration"),
            "view_count": entry.get("view_count"),
            "like_count": entry.get("like_count"),
        })
        if scanned % 25 == 0:
            print(f"      scanned {scanned}, kept {len(results)}", file=sys.stderr)

    results.sort(key=lambda r: r["upload_date"], reverse=True)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = f"videos_{platform}_{handle}_{d_from.isoformat()}_{d_to.isoformat()}"
    json_path = out_dir / f"{stem}.json"
    csv_path = out_dir / f"{stem}.csv"

    print(f"[3/3] Writing {len(results)} rows", file=sys.stderr)
    json_path.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "platform", "id", "url", "title", "upload_date",
            "duration_seconds", "view_count", "like_count",
        ])
        writer.writeheader()
        writer.writerows(results)

    print(f"\nWrote {json_path}", file=sys.stderr)
    print(f"Wrote {csv_path}", file=sys.stderr)
    print(f"{len(results)} videos matched.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
