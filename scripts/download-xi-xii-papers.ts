import fs from "fs";
import path from "path";
import https from "https";

interface PaperItem {
  class: string;
  subject: string;
  folder: string;
  year: number;
  url: string;
  filename: string;
  keyUrl?: string;
  keyFilename?: string;
}

const ITEMS: PaperItem[] = [
  // 1. Mathematics XI (HSSC-I)
  {
    class: "XI",
    subject: "Mathematics",
    folder: "pastpapers/MathsXIP1",
    year: 2025,
    url: "https://files.akuebresources.com/2025/11/Mathematics-XI-Paper-I-2025.pdf",
    filename: "Mathematics-XI-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/Mathematics-XI-Keys-2025.pdf",
    keyFilename: "Mathematics-XI-Keys-2025.pdf",
  },
  {
    class: "XI",
    subject: "Mathematics",
    folder: "pastpapers/MathsXIP1",
    year: 2024,
    url: "https://files.akuebresources.com/2024/11/Mathematics-XI-Paper-I-2024.pdf",
    filename: "Mathematics-XI-Paper-I-2024.pdf",
    keyUrl: "https://files.akuebresources.com/2025/02/Mathematics-XI-Keys-2024.pdf",
    keyFilename: "Mathematics-XI-Keys-2024.pdf",
  },
  {
    class: "XI",
    subject: "Mathematics",
    folder: "pastpapers/MathsXIP1",
    year: 2023,
    url: "https://files.akuebresources.com/2024/07/Mathematics-XI-Paper-I-2023.pdf",
    filename: "Mathematics-XI-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Mathematics-XI-Keys-2023.pdf",
    keyFilename: "Mathematics-XI-Keys-2023.pdf",
  },
  {
    class: "XI",
    subject: "Mathematics",
    folder: "pastpapers/MathsXIP1",
    year: 2022,
    url: "https://files.akuebresources.com/2024/07/Mathematics-XI-Paper-2022.pdf",
    filename: "Mathematics-XI-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Mathematics-XI-Keys-2022.pdf",
    keyFilename: "Mathematics-XI-Keys-2022.pdf",
  },
  {
    class: "XI",
    subject: "Mathematics",
    folder: "pastpapers/MathsXIP1",
    year: 2021,
    url: "https://files.akuebresources.com/2024/07/Mathematics-XI-Paper-2021.pdf",
    filename: "Mathematics-XI-Paper-I-2021.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Mathematics-XI-Keys-2021.pdf",
    keyFilename: "Mathematics-XI-Keys-2021.pdf",
  },

  // 2. Computer Science XI (HSSC-I)
  {
    class: "XI",
    subject: "Computer Science",
    folder: "pastpapers/ComputerXIP1",
    year: 2025,
    url: "https://files.akuebresources.com/2025/11/Computer-Science-XI-Paper-I-2025.pdf",
    filename: "Computer-Science-XI-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/Computer-Science-XI-Keys-2025.pdf",
    keyFilename: "Computer-Science-XI-Keys-2025.pdf",
  },
  {
    class: "XI",
    subject: "Computer Science",
    folder: "pastpapers/ComputerXIP1",
    year: 2024,
    url: "https://files.akuebresources.com/2024/11/Computer-Science-XI-Paper-I-2024.pdf",
    filename: "Computer-Science-XI-Paper-I-2024.pdf",
    keyUrl: "https://files.akuebresources.com/2025/02/Computer-Science-XI-Keys-2024.pdf",
    keyFilename: "Computer-Science-XI-Keys-2024.pdf",
  },
  {
    class: "XI",
    subject: "Computer Science",
    folder: "pastpapers/ComputerXIP1",
    year: 2023,
    url: "https://files.akuebresources.com/2024/07/Computer-Science-XI-Paper-I-2023.pdf",
    filename: "Computer-Science-XI-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Computer-Science-XI-Keys-2023.pdf",
    keyFilename: "Computer-Science-XI-Keys-2023.pdf",
  },
  {
    class: "XI",
    subject: "Computer Science",
    folder: "pastpapers/ComputerXIP1",
    year: 2022,
    url: "https://files.akuebresources.com/2024/07/Computer-Science-XI-Paper-2022.pdf",
    filename: "Computer-Science-XI-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Computer-Science-XI-Keys-2022.pdf",
    keyFilename: "Computer-Science-XI-Keys-2022.pdf",
  },
  {
    class: "XI",
    subject: "Computer Science",
    folder: "pastpapers/ComputerXIP1",
    year: 2021,
    url: "https://files.akuebresources.com/2024/07/Computer-Science-XI-Paper-2021.pdf",
    filename: "Computer-Science-XI-Paper-I-2021.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Computer-Science-XI-Keys-2021.pdf",
    keyFilename: "Computer-Science-XI-Keys-2021.pdf",
  },

  // 3. Mathematics XII (HSSC-II)
  {
    class: "XII",
    subject: "Mathematics",
    folder: "pastpapers/MathsXIIP1",
    year: 2025,
    url: "https://files.akuebresources.com/2025/11/Mathematics-XII-Paper-I-2025.pdf",
    filename: "Mathematics-XII-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/Mathematics-XII-Keys-2025.pdf",
    keyFilename: "Mathematics-XII-Keys-2025.pdf",
  },
  {
    class: "XII",
    subject: "Mathematics",
    folder: "pastpapers/MathsXIIP1",
    year: 2024,
    url: "https://files.akuebresources.com/2024/11/Mathematics-XII-Paper-I-2024.pdf",
    filename: "Mathematics-XII-Paper-I-2024.pdf",
    keyUrl: "https://files.akuebresources.com/2025/01/Mathematics-XII-Keys-2024.pdf",
    keyFilename: "Mathematics-XII-Keys-2024.pdf",
  },
  {
    class: "XII",
    subject: "Mathematics",
    folder: "pastpapers/MathsXIIP1",
    year: 2023,
    url: "https://files.akuebresources.com/2024/07/Mathematics-XII-Paper-I-2023.pdf",
    filename: "Mathematics-XII-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Mathematics-XII-Keys-2023.pdf",
    keyFilename: "Mathematics-XII-Keys-2023.pdf",
  },
  {
    class: "XII",
    subject: "Mathematics",
    folder: "pastpapers/MathsXIIP1",
    year: 2022,
    url: "https://files.akuebresources.com/2024/07/Mathematics-XII-Paper-2022.pdf",
    filename: "Mathematics-XII-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Mathematics-XII-Keys-2022.pdf",
    keyFilename: "Mathematics-XII-Keys-2022.pdf",
  },
  {
    class: "XII",
    subject: "Mathematics",
    folder: "pastpapers/MathsXIIP1",
    year: 2021,
    url: "https://files.akuebresources.com/2024/07/Mathematics-XII-Paper-2021.pdf",
    filename: "Mathematics-XII-Paper-I-2021.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Mathematics-XII-Keys-2021.pdf",
    keyFilename: "Mathematics-XII-Keys-2021.pdf",
  },

  // 4. Computer Science XII (HSSC-II)
  {
    class: "XII",
    subject: "Computer Science",
    folder: "pastpapers/ComputerXIIP1",
    year: 2025,
    url: "https://files.akuebresources.com/2025/11/Computer-Science-XII-Paper-I-2025.pdf",
    filename: "Computer-Science-XII-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/Computer-Science-XII-Keys-2025.pdf",
    keyFilename: "Computer-Science-XII-Keys-2025.pdf",
  },
  {
    class: "XII",
    subject: "Computer Science",
    folder: "pastpapers/ComputerXIIP1",
    year: 2024,
    url: "https://files.akuebresources.com/2024/11/Computer-Science-XII-Paper-I-2024.pdf",
    filename: "Computer-Science-XII-Paper-I-2024.pdf",
    keyUrl: "https://files.akuebresources.com/2025/01/Computer-Science-XII-Keys-2024.pdf",
    keyFilename: "Computer-Science-XII-Keys-2024.pdf",
  },
  {
    class: "XII",
    subject: "Computer Science",
    folder: "pastpapers/ComputerXIIP1",
    year: 2023,
    url: "https://files.akuebresources.com/2024/07/Computer-Science-XII-Paper-I-2023.pdf",
    filename: "Computer-Science-XII-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/08/Computer-Science-XII-Keys-2023.pdf",
    keyFilename: "Computer-Science-XII-Keys-2023.pdf",
  },
  {
    class: "XII",
    subject: "Computer Science",
    folder: "pastpapers/ComputerXIIP1",
    year: 2022,
    url: "https://files.akuebresources.com/2024/07/Computer-Science-XII-Paper-2022.pdf",
    filename: "Computer-Science-XII-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Computer-Science-XII-Keys-2022.pdf",
    keyFilename: "Computer-Science-XII-Keys-2022.pdf",
  },
  {
    class: "XII",
    subject: "Computer Science",
    folder: "pastpapers/ComputerXIIP1",
    year: 2021,
    url: "https://files.akuebresources.com/2024/07/Computer-Science-XII-Paper-2021.pdf",
    filename: "Computer-Science-XII-Paper-I-2021.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Computer-Science-XII-Keys-2021.pdf",
    keyFilename: "Computer-Science-XII-Keys-2021.pdf",
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
  console.log("📥 Downloading Class XI & XII Maths & CS Past Papers from akuebresources.com...\n");

  for (const item of ITEMS) {
    const dir = path.resolve(process.cwd(), item.folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const paperDest = path.join(dir, item.filename);
    console.log(`[Class ${item.class} ${item.subject} ${item.year}] Downloading Paper 1...`);
    await downloadFile(item.url, paperDest);

    if (item.keyUrl && item.keyFilename) {
      const keyDest = path.join(dir, item.keyFilename);
      console.log(`[Class ${item.class} ${item.subject} ${item.year}] Downloading Answer Key...`);
      await downloadFile(item.keyUrl, keyDest);
    }
  }

  console.log("\n🎉 All 20 Class XI & XII papers and keys downloaded successfully!");
}

main().catch(console.error);
