"""Create clean, self-contained diagrams for verified Class X source questions."""

from pathlib import Path
from urllib.request import urlopen
from PIL import Image, ImageDraw, ImageFont

OUT = Path("tmp/pdfs/class-x-math/clean-diagrams")
OUT.mkdir(parents=True, exist_ok=True)
FONT_PATH = "/System/Library/Fonts/Supplemental/Arial.ttf"


def font(size: int):
    return ImageFont.truetype(FONT_PATH, size)


def number_line():
    image = Image.new("RGB", (1000, 200), "white")
    draw = ImageDraw.Draw(image)
    step, origin, axis_y = 68, 500, 122
    draw.line((52, axis_y, 948, axis_y), fill="black", width=3)
    draw.polygon([(45, axis_y), (59, axis_y - 7), (59, axis_y + 7)], fill="black")
    draw.polygon([(955, axis_y), (941, axis_y - 7), (941, axis_y + 7)], fill="black")
    for value in range(-6, 7):
        x = origin + value * step
        draw.ellipse((x - 5, axis_y - 5, x + 5, axis_y + 5), fill="black")
        label = str(value).replace("-", "−")
        box = draw.textbbox((0, 0), label, font=font(26))
        draw.text((x - (box[2] - box[0]) / 2, axis_y + 19), label, fill="black", font=font(26))
    left, right, interval_y = origin + 1.5 * step, origin + 5 * step, 49
    draw.line((left, interval_y, right, interval_y), fill="black", width=3)
    draw.ellipse((left - 7, interval_y - 7, left + 7, interval_y + 7), fill="black")
    draw.ellipse((right - 8, interval_y - 8, right + 8, interval_y + 8), fill="black")
    draw.ellipse((right - 5, interval_y - 5, right + 5, interval_y + 5), fill="white")
    image.save(OUT / "2024-p1-q18-number-line.png")


def ladder():
    image = Image.new("RGB", (680, 450), "white")
    draw = ImageDraw.Draw(image)
    regular, small = font(31), font(26)
    base, top, corner = (95, 370), (390, 60), (390, 370)
    draw.rectangle((390, 50, 530, 370), fill="#e8ebef")
    for y in range(78, 370, 38):
        draw.line((390, y, 530, y), fill="#bec5ce", width=2)
    for i, y in enumerate(range(78, 370, 38)):
        x = 465 if i % 2 else 420
        draw.line((x, y, x, min(y + 38, 370)), fill="#bec5ce", width=2)
    draw.line((62, 370, 560, 370), fill="black", width=3)
    draw.line((390, 370, 390, 60), fill="black", width=4)
    draw.line((95, 370, 390, 60), fill="black", width=5)
    draw.line((108, 382, 403, 72), fill="black", width=3)
    for portion in [i / 10 for i in range(1, 10)]:
        x = base[0] + (top[0] - base[0]) * portion
        y = base[1] + (top[1] - base[1]) * portion
        draw.line((x, y, x + 13, y + 12), fill="black", width=2)
    draw.line((corner[0] - 24, corner[1], corner[0] - 24, corner[1] - 24), fill="black", width=2)
    draw.line((corner[0] - 24, corner[1] - 24, corner[0], corner[1] - 24), fill="black", width=2)
    draw.arc((base[0] - 65, base[1] - 65, base[0] + 65, base[1] + 65), 315, 360, fill="black", width=2)
    draw.text((174, 326), "30°", fill="black", font=small)
    draw.text((405, 198), "3 m", fill="black", font=regular)
    image.save(OUT / "2024-p1-q31-q32-ladder.png")


def graph_without_duplicate_choices():
    source_url = (
        "https://res.cloudinary.com/deudkn2gw/image/upload/v1789763104/"
        "zentix/questions/1789763103929-diagram_p8_q20.png"
    )
    original_path = OUT / "2023-p1-q20-original.png"
    if not original_path.exists():
        original_path.write_bytes(urlopen(source_url, timeout=15).read())
    source = Image.open(original_path).convert("RGB")
    graph = source.crop((0, 0, 642, 515))
    image = Image.new("RGB", (682, 555), "white")
    image.paste(graph, (20, 30))
    # The old crop clipped the y-axis label at the upper edge.
    draw = ImageDraw.Draw(image)
    draw.rectangle((295, 28, 345, 49), fill="white")
    draw.text((316, 5), "y", fill="black", font=font(27))
    image.save(OUT / "2023-p1-q20-graph.png")


def crop_2021_diagram(question: int, box, filename: str, whiteout=None):
    image = Image.open(f"tmp/pdfs/class-x-math/2021/live-q{question}.png").convert("RGB")
    if whiteout:
        ImageDraw.Draw(image).rectangle(whiteout, fill="white")
    image.crop(box).save(OUT / filename)


def class_x_2021_diagrams():
    crop_2021_diagram(27, (0, 34, 484, 311), "2021-p1-q27-q28-graph.png")
    crop_2021_diagram(30, (0, 0, 489, 380), "2021-p1-q30-triangle.png")
    crop_2021_diagram(34, (0, 0, 365, 420), "2021-p1-q34-triangle.png")
    crop_2021_diagram(42, (0, 0, 810, 291), "2021-p1-q42-tangents.png")
    image = Image.open("tmp/pdfs/class-x-math/2021/live-q48.png").convert("RGB")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 80, 55), fill="white")
    draw.rectangle((335, 0, 635, 130), fill="white")
    image.crop((0, 0, 390, 415)).save(OUT / "2021-p1-q48-circle.png")

    image = Image.new("RGB", (560, 430), "white")
    draw = ImageDraw.Draw(image)
    a, b, c = (115, 45), (115, 355), (425, 355)
    draw.line((a, b, c, a), fill="black", width=3)
    draw.line((115, 355, 155, 355, 155, 315, 115, 315), fill="black", width=2)
    for label, position in [("A", (94, 4)), ("B", (92, 359)), ("C", (433, 348)),
                            ("19.5 cm", (4, 184)), ("21.5 cm", (240, 365))]:
        draw.text(position, label, fill="black", font=font(26))
    image.save(OUT / "2021-p1-q35-triangle.png")

    image = Image.new("RGB", (510, 460), "white")
    draw = ImageDraw.Draw(image)
    center = (250, 245)
    draw.ellipse((75, 70, 425, 420), outline="black", width=3)
    b, a = (165, 92), (370, 116)
    draw.line((center, b), fill="black", width=3)
    draw.line((center, a), fill="black", width=3)
    draw.arc((205, 200, 295, 290), 245, 315, fill="black", width=2)
    for label, position in [("A", (377, 99)), ("B", (133, 69)), ("C", (238, 250)),
                            ("0.5 rad", (105, 162)), ("9 m", (324, 177))]:
        draw.text(position, label, fill="black", font=font(26))
    image.save(OUT / "2021-p1-q31-sector.png")


number_line()
ladder()
graph_without_duplicate_choices()
class_x_2021_diagrams()
print(OUT)
