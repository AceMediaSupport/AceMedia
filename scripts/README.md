# get_videos.py

List every video link from an **Instagram**, **TikTok**, or **YouTube** channel between two dates.
Outputs JSON + CSV with URL, title, upload date, duration, views, likes.

## Install

```bash
cd scripts
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Needs Python 3.10+.

## Use

```bash
# YouTube — all videos
python get_videos.py https://www.youtube.com/@aceprodigy \
    --from 2026-01-01 --to 2026-10-30

# YouTube — Shorts only
python get_videos.py https://www.youtube.com/@aceprodigy \
    --from 2026-01-01 --to 2026-10-30 --shorts-only

# TikTok
python get_videos.py https://www.tiktok.com/@aceprodigy \
    --from 2026-01-01 --to 2026-10-30

# Instagram (needs cookies — see below)
python get_videos.py https://www.instagram.com/aceprodigy \
    --from 2026-01-01 --to 2026-10-30 --cookies ig_cookies.txt
```

Results land in `./out/videos_<platform>_<handle>_<from>_<to>.json` and `.csv`.

## Flags

| Flag            | What it does                                                         |
|-----------------|----------------------------------------------------------------------|
| `--from DATE`   | Start of range, `YYYY-MM-DD`, inclusive. Required.                   |
| `--to DATE`     | End of range, `YYYY-MM-DD`, inclusive. Required.                     |
| `--shorts-only` | YouTube: hit the `/shorts` tab instead of all videos.                |
| `--cookies F`   | Netscape cookies file. Needed for Instagram, sometimes TikTok.       |
| `--out-dir DIR` | Where to write results. Default `./out`.                             |
| `--max N`       | Cap on candidates enumerated before date filtering. 0 = no cap.      |

## Getting a cookies file (Instagram)

Instagram throttles anonymous requests hard. Export cookies from a logged-in browser:

1. Install the "Get cookies.txt LOCALLY" extension (Chrome / Firefox).
2. Log in to instagram.com, click the extension, export → `ig_cookies.txt`.
3. Pass with `--cookies ig_cookies.txt`.

Keep that file out of git — it's a session key.

## Notes & limits

- Enumerating very large channels is slow. Use `--max` to cap scanning if you only
  need recent uploads (sorted newest first by the platforms themselves).
- TikTok and Instagram sometimes rate-limit; wait a few minutes and retry if you
  see empty results or `HTTP 429`.
- yt-dlp changes often — if a platform breaks, `pip install -U yt-dlp` first.
- Scraping may conflict with each platform's ToS. Use with content you own or
  have rights to analyze.
