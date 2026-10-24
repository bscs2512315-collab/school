import os
import re
import json
import urllib.request
import urllib.error
import sys

TARGET_SUBJECTS = [
    # Class X
    {"class": "X", "subject": "Mathematics", "url": "https://akuebresources.com/past-papers/ssc-ii/mathematics", "folder": "pastpapers/ClassX_P2/Mathematics"},
    {"class": "X", "subject": "Chemistry", "url": "https://akuebresources.com/past-papers/ssc-ii/chemistry", "folder": "pastpapers/ClassX_P2/Chemistry"},
    {"class": "X", "subject": "Physics", "url": "https://akuebresources.com/past-papers/ssc-ii/physics", "folder": "pastpapers/ClassX_P2/Physics"},
    {"class": "X", "subject": "Biology", "url": "https://akuebresources.com/past-papers/ssc-ii/biology", "folder": "pastpapers/ClassX_P2/Biology"},
    {"class": "X", "subject": "Computer Science", "url": "https://akuebresources.com/past-papers/ssc-ii/computer-science", "folder": "pastpapers/ClassX_P2/Computer"},

    # Class XII
    {"class": "XII", "subject": "Chemistry", "url": "https://akuebresources.com/past-papers/hssc-ii/chemistry", "folder": "pastpapers/ClassXII_P2/Chemistry"},
    {"class": "XII", "subject": "Physics", "url": "https://akuebresources.com/past-papers/hssc-ii/physics", "folder": "pastpapers/ClassXII_P2/Physics"},
    {"class": "XII", "subject": "Biology", "url": "https://akuebresources.com/past-papers/hssc-ii/biology", "folder": "pastpapers/ClassXII_P2/Biology"},
]

TARGET_YEARS = [2021, 2022, 2023, 2024, 2025]

def download_file(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 1000:
        print(f"  ⏩ Already exists: {os.path.basename(dest)}", flush=True)
        return True
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as response, open(dest, 'wb') as out_file:
            out_file.write(response.read())
        print(f"  ✅ Downloaded: {os.path.basename(dest)} ({os.path.getsize(dest)} bytes)", flush=True)
        return True
    except Exception as e:
        print(f"  ❌ Error downloading {url}: {e}", flush=True)
        if os.path.exists(dest):
            try: os.remove(dest)
            except: pass
        return False

def main():
    print("=" * 65, flush=True)
    print("📥 Downloading Paper II & E-Marking Notes (Class X & XII, 2021-2025)", flush=True)
    print("=" * 65, flush=True)

    manifest = []

    for item in TARGET_SUBJECTS:
        print(f"\n🔍 Processing {item['class']} · {item['subject']}...", flush=True)
        os.makedirs(item["folder"], exist_ok=True)

        req = urllib.request.Request(item["url"], headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                links = sorted(list(set(re.findall(r'https?://files\.akuebresources\.com/[^\s\"\'<>]+\.pdf', html))))
        except Exception as e:
            print(f"  ❌ Failed to fetch page {item['url']}: {e}", flush=True)
            continue

        for year in TARGET_YEARS:
            str_year = str(year)

            # Paper II link: check filename (not upload URL path)
            paper_ii_links = [
                l for l in links
                if str_year in os.path.basename(l)
                and ("paper-ii" in os.path.basename(l).lower() or "paper-2" in os.path.basename(l).lower() or "paper_ii" in os.path.basename(l).lower())
                and "model" not in os.path.basename(l).lower()
                and "key" not in os.path.basename(l).lower()
            ]

            # E-marking link: check filename
            emarking_links = [
                l for l in links
                if str_year in os.path.basename(l)
                and ("e-marking" in os.path.basename(l).lower() or "emarking" in os.path.basename(l).lower())
                and "model" not in os.path.basename(l).lower()
            ]

            # Annual Exam link (2021/2022 if separate Paper II is not named): check filename
            annual_links = [
                l for l in links
                if str_year in os.path.basename(l)
                and "annual-exam" in os.path.basename(l).lower()
                and "key" not in os.path.basename(l).lower()
                and "model" not in os.path.basename(l).lower()
            ]

            paper_pdf_path = None
            marking_pdf_path = None

            if paper_ii_links:
                url = paper_ii_links[0]
                fname = os.path.basename(url)
                dest = os.path.join(item["folder"], fname)
                if download_file(url, dest):
                    paper_pdf_path = dest

            if emarking_links:
                url = emarking_links[0]
                fname = os.path.basename(url)
                dest = os.path.join(item["folder"], fname)
                if download_file(url, dest):
                    marking_pdf_path = dest

            if not paper_pdf_path and annual_links:
                url = annual_links[0]
                fname = os.path.basename(url)
                dest = os.path.join(item["folder"], fname)
                if download_file(url, dest):
                    paper_pdf_path = dest

            if paper_pdf_path or marking_pdf_path:
                manifest.append({
                    "class": item["class"],
                    "subject": item["subject"],
                    "year": year,
                    "paperPdf": paper_pdf_path,
                    "markingPdf": marking_pdf_path
                })
                print(f"  📌 Added to manifest: {item['class']} {item['subject']} {year} (Paper: {bool(paper_pdf_path)}, Marking: {bool(marking_pdf_path)})", flush=True)
            else:
                print(f"  ⚠️ No files found for {item['class']} {item['subject']} {year}", flush=True)

    manifest_path = "pastpapers/paper2_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print("\n" + "=" * 65, flush=True)
    print(f"🎉 Download Complete! Cataloged {len(manifest)} Paper 2 targets.", flush=True)
    print(f"📄 Manifest saved at: {manifest_path}", flush=True)
    print("=" * 65, flush=True)

if __name__ == "__main__":
    main()
