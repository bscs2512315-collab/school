from pathlib import Path
from PIL import Image, ImageOps
import fitz

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "tmp/pdfs/class-x-math/source-pages"
OUT = ROOT / "tmp/pdfs/class-x-math/corrected-crops"
CLEAN_PDFS = {
    "2021-p1": ROOT / "tmp/pdfs/class-x-math/processor/Mathematics-X-Paper-I-2021/Mathematics-X-Paper-I-2021_cleaned.pdf",
    "2022-p1": ROOT / "tmp/pdfs/class-x-math/processor/Mathematics-X-Paper-I-2022/Mathematics-X-Paper-I-2022_cleaned.pdf",
    "2025-p1": ROOT / "tmp/pdfs/class-x-math/processor/Mathematics-X-Paper-I-2025/Mathematics-X-Paper-I-2025_cleaned.pdf",
}

# Coordinates are measured on the 745x1053 page renders generated from the
# authoritative AKUEB PDFs. Each crop contains only the source material the
# corresponding question needs.
CROPS = {
    "2022-p1-q1-table.png": ("Mathematics-X-Paper-I-2022/page-02.png", (85, 155, 650, 385)),
    "2022-p1-q2-q3-chart.png": ("Mathematics-X-Paper-I-2022/page-02.png", (55, 585, 650, 960)),
    "2024-p1-q18-number-line.png": ("Mathematics-X-Paper-I-2024/page-07.png", (125, 715, 555, 775)),
    "2024-p1-q31-q32-ladder.png": ("Mathematics-X-Paper-I-2024/page-11.png", (125, 520, 615, 710)),
    "2023-p2-q3b-number-line.png": ("Mathematics-X-Paper-II-2023/page-05.png", (115, 820, 660, 925)),
    "2023-p2-q4i-table.png": ("Mathematics-X-Paper-II-2023/page-06.png", (120, 180, 450, 265)),
    "2023-p2-q4ii-grid.png": ("Mathematics-X-Paper-II-2023/page-06.png", (215, 580, 555, 900)),
    "2023-p2-q7a-triangle.png": ("Mathematics-X-Paper-II-2023/page-08.png", (110, 210, 380, 325)),
    "2023-p2-q7b-triangle.png": ("Mathematics-X-Paper-II-2023/page-08.png", (105, 385, 400, 540)),
    "2023-p2-q8a-tangents.png": ("Mathematics-X-Paper-II-2023/page-09.png", (110, 230, 515, 350)),
    "2023-p2-q8b-circle.png": ("Mathematics-X-Paper-II-2023/page-10.png", (105, 225, 445, 415)),
    "2024-p2-q3b-number-line.png": ("Mathematics-X-Paper-II-2024/page-05.png", (110, 310, 600, 375)),
    "2024-p2-q7b-ships.png": ("Mathematics-X-Paper-II-2024/page-09.png", (105, 280, 655, 490)),
    "2024-p2-q8b-tangents.png": ("Mathematics-X-Paper-II-2024/page-11.png", (105, 220, 610, 475)),
    "2025-p2-q1i-table.png": ("Mathematics-X-Paper-II-2025/page-03.png", (75, 200, 710, 500)),
    "2025-p2-q3b-number-line.png": ("Mathematics-X-Paper-II-2025/page-05.png", (115, 825, 655, 935)),
    "2025-p2-q8a-circle.png": ("Mathematics-X-Paper-II-2025/page-09.png", (155, 205, 640, 430)),
}

# These two crops deliberately come from the watermark-stripped PDF generated
# by the same ingestion pipeline used for uploads. They exclude duplicated
# question statements/options because the app already renders that text.
CLEAN_PDF_CROPS = {
    "2021-p1-q1-q2-table.png": ("2021-p1", 1, (75, 135, 300, 390)),
    "2021-p1-q27-q28-graph.png": ("2021-p1", 7, (50, 115, 510, 405)),
    "2021-p1-q43-q44-circle.png": ("2021-p1", 11, (60, 450, 420, 650)),
    "2022-p1-q48-q49-circle.png": ("2022-p1", 13, (55, 185, 660, 400)),
    "2025-p1-q20-graph.png": ("2025-p1", 6, (85, 300, 680, 490)),
    "2025-p1-q27-line-diagram.png": ("2025-p1", 8, (245, 495, 680, 630)),
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (relative_source, box) in CROPS.items():
        source = SRC / relative_source
        with Image.open(source) as page:
            crop = page.crop(box)
            crop = ImageOps.expand(crop, border=12, fill="white")
            crop.save(OUT / name, optimize=True)
            print(f"{name}\t{crop.width}x{crop.height}\t{relative_source}\t{box}")

    for source, pdf_path in CLEAN_PDFS.items():
        if not pdf_path.exists():
            raise FileNotFoundError(f"Missing watermark-free source PDF: {pdf_path}")
    documents = {source: fitz.open(pdf_path) for source, pdf_path in CLEAN_PDFS.items()}
    try:
        for name, (source, page_index, box) in CLEAN_PDF_CROPS.items():
            document = documents[source]
            pixmap = document[page_index].get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
            page = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            crop = ImageOps.expand(page.crop(box), border=12, fill="white")
            crop.save(OUT / name, optimize=True)
            print(f"{name}\t{crop.width}x{crop.height}\t{source}-page-{page_index + 1}\t{box}")
    finally:
        for document in documents.values():
            document.close()


if __name__ == "__main__":
    main()
