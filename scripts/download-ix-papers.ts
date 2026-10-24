import fs from "fs";
import path from "path";
import https from "https";

interface PaperItem {
  subject: string;
  folder: string;
  year: number;
  url: string;
  filename: string;
  keyUrl?: string;
  keyFilename?: string;
}

const ITEMS: PaperItem[] = [
  // Physics IX
  {
    subject: "Physics",
    folder: "pastpapers/PhysicsIXP1",
    year: 2025,
    url: "https://files.akuebresources.com/2025/11/Physics-IX-Paper-I-2025.pdf",
    filename: "Physics-IX-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/Physics-IX-Keys-2025.pdf",
    keyFilename: "Physics-IX-Keys-2025.pdf",
  },
  {
    subject: "Physics",
    folder: "pastpapers/PhysicsIXP1",
    year: 2024,
    url: "https://files.akuebresources.com/2024/12/Physics-IX-Paper-I-2024.pdf",
    filename: "Physics-IX-Paper-I-2024.pdf",
    keyUrl: "https://files.akuebresources.com/2024/12/Physics-IX-Keys-2024.pdf",
    keyFilename: "Physics-IX-Keys-2024.pdf",
  },
  {
    subject: "Physics",
    folder: "pastpapers/PhysicsIXP1",
    year: 2023,
    url: "https://files.akuebresources.com/2024/08/Physics-IX-Paper-I-2023.pdf",
    filename: "Physics-IX-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Physics-IX-Keys-2023.pdf",
    keyFilename: "Physics-IX-Keys-2023.pdf",
  },
  {
    subject: "Physics",
    folder: "pastpapers/PhysicsIXP1",
    year: 2022,
    url: "https://files.akuebresources.com/2024/08/Physics-IX-Paper-I-2022.pdf",
    filename: "Physics-IX-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Physics-IX-Keys-2022.pdf",
    keyFilename: "Physics-IX-Keys-2022.pdf",
  },
  {
    subject: "Physics",
    folder: "pastpapers/PhysicsIXP1",
    year: 2021,
    url: "https://files.akuebresources.com/2024/08/Physics-IX-Paper-I-2021.pdf",
    filename: "Physics-IX-Paper-I-2021.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Physics-IX-Keys-2021.pdf",
    keyFilename: "Physics-IX-Keys-2021.pdf",
  },

  // Chemistry IX
  {
    subject: "Chemistry",
    folder: "pastpapers/ChemistryIXP1",
    year: 2025,
    url: "https://files.akuebresources.com/2025/11/Chemistry-IX-Paper-I-2025.pdf",
    filename: "Chemistry-IX-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/Chemistry-IX-Keys-2025.pdf",
    keyFilename: "Chemistry-IX-Keys-2025.pdf",
  },
  {
    subject: "Chemistry",
    folder: "pastpapers/ChemistryIXP1",
    year: 2024,
    url: "https://files.akuebresources.com/2024/11/Chemistry-IX-Paper-I-2024.pdf",
    filename: "Chemistry-IX-Paper-I-2024.pdf",
    keyUrl: "https://files.akuebresources.com/2024/12/Chemistry-IX-Keys-2024.pdf",
    keyFilename: "Chemistry-IX-Keys-2024.pdf",
  },
  {
    subject: "Chemistry",
    folder: "pastpapers/ChemistryIXP1",
    year: 2023,
    url: "https://files.akuebresources.com/2024/08/Chemistry-IX-Paper-I-2023.pdf",
    filename: "Chemistry-IX-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Chemistry-IX-Keys-2023.pdf",
    keyFilename: "Chemistry-IX-Keys-2023.pdf",
  },
  {
    subject: "Chemistry",
    folder: "pastpapers/ChemistryIXP1",
    year: 2022,
    url: "https://files.akuebresources.com/2024/08/Chemistry-IX-Paper-I-2022.pdf",
    filename: "Chemistry-IX-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Chemistry-IX-Keys-2022.pdf",
    keyFilename: "Chemistry-IX-Keys-2022.pdf",
  },
  {
    subject: "Chemistry",
    folder: "pastpapers/ChemistryIXP1",
    year: 2021,
    url: "https://files.akuebresources.com/2024/08/Chemistry-IX-Paper-I-2021.pdf",
    filename: "Chemistry-IX-Paper-I-2021.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Chemistry-IX-Keys-2021.pdf",
    keyFilename: "Chemistry-IX-Keys-2021.pdf",
  },

  // Biology IX
  {
    subject: "Biology",
    folder: "pastpapers/BiologyIXP1",
    year: 2025,
    url: "https://files.akuebresources.com/2025/11/Biology-IX-Paper-I-2025.pdf",
    filename: "Biology-IX-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/Biology-IX-Keys-2025.pdf",
    keyFilename: "Biology-IX-Keys-2025.pdf",
  },
  {
    subject: "Biology",
    folder: "pastpapers/BiologyIXP1",
    year: 2024,
    url: "https://files.akuebresources.com/2024/11/Biology-IX-Paper-I-2024.pdf",
    filename: "Biology-IX-Paper-I-2024.pdf",
    keyUrl: "https://files.akuebresources.com/2024/12/Biology-IX-Keys-2024.pdf",
    keyFilename: "Biology-IX-Keys-2024.pdf",
  },
  {
    subject: "Biology",
    folder: "pastpapers/BiologyIXP1",
    year: 2023,
    url: "https://files.akuebresources.com/2024/08/Biology-IX-Paper-I-2023.pdf",
    filename: "Biology-IX-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Biology-IX-Keys-2023.pdf",
    keyFilename: "Biology-IX-Keys-2023.pdf",
  },
  {
    subject: "Biology",
    folder: "pastpapers/BiologyIXP1",
    year: 2022,
    url: "https://files.akuebresources.com/2024/08/Biology-IX-Paper-I-2022.pdf",
    filename: "Biology-IX-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Biology-IX-Keys-2022.pdf",
    keyFilename: "Biology-IX-Keys-2022.pdf",
  },
  {
    subject: "Biology",
    folder: "pastpapers/BiologyIXP1",
    year: 2021,
    url: "https://files.akuebresources.com/2024/08/Biology-IX-Paper-I-2021.pdf",
    filename: "Biology-IX-Paper-I-2021.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Biology-IX-Keys-2021.pdf",
    keyFilename: "Biology-IX-Keys-2021.pdf",
  },
];

function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
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
  console.log("📥 Downloading Class IX Past Papers from akuebresources.com...\n");

  for (const item of ITEMS) {
    const dir = path.resolve(process.cwd(), item.folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const paperDest = path.join(dir, item.filename);
    console.log(`[${item.subject} ${item.year}] Downloading Paper 1...`);
    await downloadFile(item.url, paperDest);

    if (item.keyUrl && item.keyFilename) {
      const keyDest = path.join(dir, item.keyFilename);
      console.log(`[${item.subject} ${item.year}] Downloading Answer Key...`);
      await downloadFile(item.keyUrl, keyDest);
    }
  }

  console.log("\n🎉 All downloads completed!");
}

main().catch(console.error);
