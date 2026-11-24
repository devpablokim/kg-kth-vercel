"""Generate site images with the OpenAI Images API.

Usage:  python3 scripts/gen_images.py [name ...]
Reads OPENAI_API_KEY / OPENAI_IMAGE_MODEL from .env, writes PNGs to site/assets/.
"""
import base64, json, os, sys, urllib.request, urllib.error, pathlib, concurrent.futures as cf

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "assets"

def load_env():
    for line in (ROOT / ".env").read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

CURSOR_STYLE = (
    "A single 3D computer mouse-pointer arrow icon, sculpted from glossy pearl-white ceramic with soft "
    "subsurface glow, rounded bevelled edges, a subtle cool-blue (#7AB1FE) rim light from the right, "
    "soft studio lighting, high-end product render, octane quality, crisp silhouette, centered, "
    "isolated object on a fully transparent background, no shadow on ground, no text."
)

JOBS = {
    "cursor-hero": dict(
        prompt=CURSOR_STYLE + " The arrow points up-left in a classic cursor pose, seen in a slight three-quarter "
        "perspective, floating weightlessly as if in zero gravity.",
        size="1024x1024", background="transparent"),
    "cursor-cta": dict(
        prompt=CURSOR_STYLE + " The arrow is tilted and rotated about 35 degrees, tip pointing up-right, seen "
        "slightly from below, mid-motion as if about to click.",
        size="1024x1024", background="transparent"),
    "og": dict(
        prompt="Cinematic dark space scene for a website social preview: pure black sky with fine twinkling stars, "
        "the right edge of a huge dark planet with a thin luminous blue-white atmospheric rim, a faint elliptical "
        "orbit line with tiny glowing dots, and one bright glowing guide star in the center-left. Minimal, elegant, "
        "lots of negative space on the left for a title. In thin elegant sans-serif white type on the left: "
        "'HOBBYTAN AI' and below in smaller grey type 'AI 전환 컨설팅 · 슈퍼AI워크샵'. No other text.",
        size="1536x1024", background="opaque"),
}

def generate(name, job):
    body = {"model": os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-2.5-sunburst"),
            "prompt": job["prompt"], "size": job["size"], "n": 1, "quality": "high",
            "output_format": "png", "background": job["background"]}
    for attempt in range(2):
        req = urllib.request.Request("https://api.openai.com/v1/images/generations",
            data=json.dumps(body).encode(), method="POST",
            headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                data = json.load(r)
            (OUT / f"{name}.png").write_bytes(base64.b64decode(data["data"][0]["b64_json"]))
            return f"{name}: ok"
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:400]
            # drop parameters the model rejects and retry once
            if attempt == 0 and "background" in msg:
                body.pop("background", None); continue
            if attempt == 0 and "quality" in msg:
                body["quality"] = "auto"; continue
            return f"{name}: HTTP {e.code} {msg}"
    return f"{name}: failed"

if __name__ == "__main__":
    load_env()
    OUT.mkdir(parents=True, exist_ok=True)
    names = sys.argv[1:] or list(JOBS)
    with cf.ThreadPoolExecutor(3) as ex:
        for res in ex.map(lambda n: generate(n, JOBS[n]), names):
            print(res, flush=True)
