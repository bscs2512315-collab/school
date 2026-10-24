"""Produce contact sheets of live Class X Mathematics diagrams for visual review."""

import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path("tmp/pdfs/class-x-math")
DATA = json.loads((ROOT / "all-image-urls.json").read_text())
IMAGE_DIR = ROOT / "all-live-images"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)
FONT = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 24)


def fetch(row):
    key = f"{row['year']}-p{row['paper_number']}-q{row['question_number']}-{row['question_part'] or 'whole'}"
    destination = IMAGE_DIR / f"{key}.png"
    if not destination.exists():
        destination.write_bytes(urlopen(row["image_url"], timeout=20).read())
    return row, destination


with ThreadPoolExecutor(max_workers=8) as pool:
    fetched = list(pool.map(fetch, DATA))

papers = sorted({(row["year"], row["paper_number"]) for row in DATA})
for year, paper in papers:
    matches = [(row, path) for row, path in fetched if (row["year"], row["paper_number"]) == (year, paper)]
    for chunk in range(0, len(matches), 20):
        portion = matches[chunk:chunk + 20]
        cell_w, cell_h = 470, 350
        sheet = Image.new("RGB", (cell_w * 4, cell_h * 5), "white")
        draw = ImageDraw.Draw(sheet)
        for index, (row, path) in enumerate(portion):
            image = Image.open(path).convert("RGB")
            fitted = ImageOps.contain(image, (cell_w - 22, cell_h - 64))
            x = (index % 4) * cell_w + 11
            y = (index // 4) * cell_h + 38
            sheet.paste(fitted, (x, y))
            suffix = f":{row['question_part']}" if row["question_part"] else ""
            draw.text((x, y - 31), f"Q{row['question_number']}{suffix}", fill="black", font=FONT)
        destination = ROOT / f"image-sheet-{year}-p{paper}-{chunk // 20 + 1}.jpg"
        sheet.save(destination, quality=90)
        print(destination)
