import fs from "fs";
import path from "path";
import https from "https";

interface ScrapedSubject {
  class: "XI" | "XII";
  subject: string;
  url: string;
  pdfs: string[];
}

function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
      const stats = fs.statSync(destPath);
      console.log(`  ⏩ [EXISTS] ${(stats.size / 1024).toFixed(1)} KB: ${path.basename(destPath)}`);
      resolve(true);
      return;
    }

    const file = fs.createWriteStream(destPath);
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            downloadFile(redirectUrl, destPath).then(resolve);
            return;
          }
        }
        if (res.statusCode !== 200) {
          console.error(`  ❌ HTTP ${res.statusCode} for ${url}`);
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          resolve(false);
          return;
        }

        res.pipe(file);
        file.on("finish", () => {
          file.close();
          setTimeout(() => {
            try {
              const header = Buffer.alloc(5);
              const fd = fs.openSync(destPath, "r");
              fs.readSync(fd, header, 0, 5, 0);
              fs.closeSync(fd);
              if (header.toString() === "%PDF-") {
                const stats = fs.statSync(destPath);
                console.log(`  ✅ ${(stats.size / 1024).toFixed(1)} KB: ${path.basename(destPath)}`);
                resolve(true);
              } else {
                console.error(`  ❌ Invalid PDF header for ${destPath}`);
                if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
                resolve(false);
              }
            } catch (e: any) {
              console.error(`  ❌ Read error for ${destPath}:`, e.message);
              resolve(false);
            }
          }, 50);
        });
      })
      .on("error", (err) => {
        console.error(`  ❌ Error downloading ${url}:`, err.message);
        try {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        } catch {}
        resolve(false);
      });
  });
}

async function main() {
  const jsonPath = path.resolve(process.cwd(), "pastpapers/xi_xii_scraped_links.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("Missing pastpapers/xi_xii_scraped_links.json");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as Record<string, ScrapedSubject>;
  console.log("📥 Processing All Scraped Class XI & XII Links from akuebresources.com...\n");

  const downloadQueue: Array<{
    classLevel: string;
    subject: string;
    year: number;
    folder: string;
    url: string;
    fileName: string;
    type: "PAPER" | "KEY";
  }> = [];

  for (const [key, subjObj] of Object.entries(raw)) {
    const classLevel = subjObj.class;
    const subject = subjObj.subject;
    const sanitizedSubject = subject.replace(/[^a-zA-Z0-9]/g, "_");
    const targetFolder = `pastpapers/downloads/Class${classLevel}_General/${sanitizedSubject}`;

    for (const pdfUrl of subjObj.pdfs) {
      const fileName = pdfUrl.split("/").pop() || "";
      const lower = fileName.toLowerCase();

      // Skip Model papers, E-marking notes, Syllabus, books, listening passages, Paper II
      if (
        lower.includes("model") ||
        lower.includes("e-marking") ||
        lower.includes("syllabus") ||
        lower.includes("book") ||
        lower.includes("listening") ||
        lower.includes("paper-ii") ||
        lower.includes("paper-2")
      ) {
        continue;
      }

      // Detect Year
      const yearMatch = fileName.match(/(20\d\d)/);
      if (!yearMatch) continue;
      const year = parseInt(yearMatch[1], 10);

      // We focus on 2021 to 2025
      if (year < 2021 || year > 2025) continue;

      if (lower.includes("paper-i") || lower.includes("paper-1") || lower.includes("paper-20") || lower.includes("paper_i")) {
        downloadQueue.push({
          classLevel,
          subject,
          year,
          folder: targetFolder,
          url: pdfUrl,
          fileName,
          type: "PAPER",
        });
      } else if (lower.includes("key") || lower.includes("keys")) {
        downloadQueue.push({
          classLevel,
          subject,
          year,
          folder: targetFolder,
          url: pdfUrl,
          fileName,
          type: "KEY",
        });
      }
    }
  }

  console.log(`Found ${downloadQueue.length} targeted Paper 1 and Key PDFs to download.\n`);

  let success = 0;
  for (const item of downloadQueue) {
    const dir = path.resolve(process.cwd(), item.folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const destPath = path.join(dir, item.fileName);
    console.log(`[Class ${item.classLevel} | ${item.subject} | ${item.year} | ${item.type}] ${item.fileName}`);
    const ok = await downloadFile(item.url, destPath);
    if (ok) success++;
  }

  console.log(`\n🎉 Download complete! Successfully downloaded/verified ${success}/${downloadQueue.length} files.`);
}

main().catch(console.error);
