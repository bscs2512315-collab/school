import os

svg_header = '<svg width="625" height="615" viewBox="0 0 625 615" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n'

with open("scripts/raw_badge.txt", "r") as f:
    body = f.read().strip()

if not body.startswith("<svg"):
    full_svg = svg_header + body
    if not full_svg.endswith("</svg>"):
        full_svg += "\n</svg>"
else:
    full_svg = body

os.makedirs("public/badges", exist_ok=True)
with open("public/badges/student-of-the-year.svg", "w") as f:
    f.write(full_svg)

with open("public/badges/student_of_the_year.svg", "w") as f:
    f.write(full_svg)

print("Saved student of the year badge SVG successfully!")
