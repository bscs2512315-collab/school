import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface DownloadTarget {
  name: string;
  url: string;
}

const TARGETS: DownloadTarget[] = [
  // 1. Pakistan Studies (English) X
  {
    name: "Pakistan-Studies-English-X-Paper-I-2025.pdf",
    url: "https://files.akuebresources.com/2025/11/Pakistan-Studies-English-X-Paper-I-2025.pdf",
  },
  {
    name: "Pakistan-Studies-X-Keys-2025.pdf",
    url: "https://files.akuebresources.com/2026/04/Pakistan-Studies-X-Keys-2025.pdf",
  },
  {
    name: "Pakistan-Studies-English-X-Paper-I-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/Pakistan-Studies-English-X-Paper-I-2024.pdf",
  },
  {
    name: "Pakistan-Studies-X-Keys-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/Pakistan-Studies-X-Keys-2024.pdf",
  },
  {
    name: "Pakistan-Studies-English-X-Paper-I-2023.pdf",
    url: "https://files.akuebresources.com/2024/09/Pakistan-Studies-English-X-Paper-I-2023.pdf",
  },
  {
    name: "Pakistan-Studies-X-Keys-2023.pdf",
    url: "https://files.akuebresources.com/2024/09/Pakistan-Studies-X-Keys-2023.pdf",
  },
  {
    name: "Pakistan-Studies-English-X-Paper-I-2022.pdf",
    url: "https://files.akuebresources.com/2024/09/Pakistan-Studies-English-X-Paper-I-2022.pdf",
  },
  {
    name: "Pakistan-Studies-X-Keys-2022.pdf",
    url: "https://files.akuebresources.com/2024/09/Pakistan-Studies-X-Keys-2022.pdf",
  },

  // 2. Pakistan Studies (Urdu) X
  {
    name: "Pakistan-Studies-Urdu-X-Paper-I-2025.pdf",
    url: "https://files.akuebresources.com/2025/11/Pakistan-Studies-Urdu-X-Paper-I-2025.pdf",
  },
  {
    name: "Pakistan-Studies-Urdu-X-Paper-I-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/Pakistan-Studies-Urdu-X-Paper-I-2024.pdf",
  },
  {
    name: "Pakistan-Studies-Urdu-X-Paper-I-2023.pdf",
    url: "https://files.akuebresources.com/2024/09/Pakistan-Studies-Urdu-X-Paper-I-2023.pdf",
  },
  {
    name: "Pakistan-Studies-Urdu-X-Paper-I-2022.pdf",
    url: "https://files.akuebresources.com/2024/09/Pakistan-Studies-Urdu-X-Paper-I-2022.pdf",
  },

  // 3. English Compulsory X
  {
    name: "English-Compulsory-X-Paper-I-2025.pdf",
    url: "https://files.akuebresources.com/2025/11/English-Compulsory-X-Paper-I-2025.pdf",
  },
  {
    name: "English-Compulsory-X-Keys-2025.pdf",
    url: "https://files.akuebresources.com/2026/04/English-Compulsory-X-Keys-2025.pdf",
  },
  {
    name: "English-Compulsory-X-Paper-I-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/English-Compulsory-X-Paper-I-2024.pdf",
  },
  {
    name: "English-Compulsory-X-Keys-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/English-Compulsory-X-Keys-2024.pdf",
  },
  {
    name: "English-X-Paper-I-2023.pdf",
    url: "https://files.akuebresources.com/2024/08/English-X-Paper-I-2023.pdf",
  },
  {
    name: "English-X-Keys-2023.pdf",
    url: "https://files.akuebresources.com/2024/08/English-X-Keys-2023.pdf",
  },
  {
    name: "English-X-Paper-I-2022.pdf",
    url: "https://files.akuebresources.com/2024/08/English-X-Paper-I-2022.pdf",
  },
  {
    name: "English-X-Keys-2022.pdf",
    url: "https://files.akuebresources.com/2025/05/English-X-Keys-2022.pdf",
  },

  // 4. Urdu Compulsory X
  {
    name: "Urdu-Compulsory-X-Paper-I-2025.pdf",
    url: "https://files.akuebresources.com/2025/11/Urdu-Compulsory-X-Paper-I-2025.pdf",
  },
  {
    name: "Urdu-Compulsory-X-Keys-2025.pdf",
    url: "https://files.akuebresources.com/2026/04/Urdu-Compulsory-X-Keys-2025.pdf",
  },
  {
    name: "Urdu-Compulsory-X-Paper-I-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/Urdu-Compulsory-X-Paper-I-2024.pdf",
  },
  {
    name: "Urdu-X-Paper-I-2023.pdf",
    url: "https://files.akuebresources.com/2024/08/Urdu-X-Paper-I-2023.pdf",
  },
  {
    name: "Urdu-X-Keys-2023.pdf",
    url: "https://files.akuebresources.com/2024/08/Urdu-X-Keys-2023.pdf",
  },
  {
    name: "Urdu-X-Paper-I-2022.pdf",
    url: "https://files.akuebresources.com/2024/08/Urdu-X-Paper-I-2022.pdf",
  },

  // 5. Islamiyat (English) X
  {
    name: "Islamiyat-English-X-Paper-I-2025.pdf",
    url: "https://files.akuebresources.com/2025/11/Islamiyat-English-X-Paper-I-2025.pdf",
  },
  {
    name: "Islamiyat-X-Keys-2025.pdf",
    url: "https://files.akuebresources.com/2026/04/Islamiyat-X-Keys-2025.pdf",
  },
  {
    name: "Islamiyat-English-X-Paper-I-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/Islamiyat-English-X-Paper-I-2024.pdf",
  },
  {
    name: "Islamiyat-X-Keys-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/Islamiyat-X-Keys-2024-5.pdf",
  },
  {
    name: "Islamiyat-English-X-Paper-I-2023.pdf",
    url: "https://files.akuebresources.com/2024/09/Islamiyat-English-X-Paper-I-2023.pdf",
  },
  {
    name: "Islamiyat-X-Keys-2023.pdf",
    url: "https://files.akuebresources.com/2024/09/Islamiyat-X-Keys-2023.pdf",
  },
  {
    name: "Islamiyat-English-X-Paper-I-2022.pdf",
    url: "https://files.akuebresources.com/2024/09/Islamiyat-English-X-Paper-I-2022.pdf",
  },
  {
    name: "Islamiyat-X-Keys-2022.pdf",
    url: "https://files.akuebresources.com/2024/09/Islamiyat-X-Keys-2022.pdf",
  },

  // 6. Islamiyat (Urdu) X
  {
    name: "Islamiyat-Urdu-X-Paper-I-2025.pdf",
    url: "https://files.akuebresources.com/2025/11/Islamiyat-Urdu-X-Paper-I-2025.pdf",
  },
  {
    name: "Islamiyat-Urdu-X-Paper-I-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/Islamiyat-Urdu-X-Paper-I-2024.pdf",
  },
  {
    name: "Islamiyat-Urdu-X-Paper-I-2023.pdf",
    url: "https://files.akuebresources.com/2024/09/Islamiyat-Urdu-X-Paper-I-2023.pdf",
  },
  {
    name: "Islamiyat-Urdu-X-Paper-I-2022.pdf",
    url: "https://files.akuebresources.com/2024/09/Islamiyat-Urdu-X-Paper-I-2022.pdf",
  },

  // 7. General Mathematics X
  {
    name: "General-Mathematics-X-Paper-I-2025.pdf",
    url: "https://files.akuebresources.com/2025/11/General-Mathematics-X-Paper-I-2025.pdf",
  },
  {
    name: "General-Mathematics-X-Paper-I-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/General-Mathematics-X-Paper-I-2024.pdf",
  },
  {
    name: "General-Mathematics-X-Paper-I-2023.pdf",
    url: "https://files.akuebresources.com/2024/08/General-Mathematics-X-Paper-I-2023.pdf",
  },
  {
    name: "General-Mathematics-X-Paper-I-2022.pdf",
    url: "https://files.akuebresources.com/2024/08/General-Mathematics-X-Paper-I-2022.pdf",
  },
  {
    name: "General-Mathematics-X-Keys-2022.pdf",
    url: "https://files.akuebresources.com/2024/08/General-Mathematics-X-Keys-2022.pdf",
  },
  {
    name: "General-Mathematics-X-Paper-I-2021.pdf",
    url: "https://files.akuebresources.com/2024/08/General-Mathematics-X-Paper-I-2021.pdf",
  },
  {
    name: "General-Mathematics-X-Keys-2021.pdf",
    url: "https://files.akuebresources.com/2024/08/General-Mathematics-X-Keys-2021.pdf",
  },
];

const OUT_DIR = path.resolve(process.cwd(), "pastpapers/downloads/ClassX_General");

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  console.log(`=======================================================`);
  console.log(`📥 Downloading Class X (SSC-II) Paper 1 & Keys`);
  console.log(`Target: ${OUT_DIR}`);
  console.log(`Total Files: ${TARGETS.length}`);
  console.log(`=======================================================\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < TARGETS.length; i++) {
    const item = TARGETS[i];
    const dest = path.join(OUT_DIR, item.name);

    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`[${i + 1}/${TARGETS.length}] ⏩ Skipped (already exists): ${item.name}`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${TARGETS.length}] ⬇️ Downloading: ${item.name}`);
    try {
      execSync(`curl -s -L -A "Mozilla/5.0" "${item.url}" -o "${dest}"`, {
        timeout: 30000,
      });
      if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
        console.log(`   ✅ Success (${Math.round(fs.statSync(dest).size / 1024)} KB)`);
        downloaded++;
      } else {
        console.error(`   ❌ Failed or empty file: ${item.name}`);
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        failed++;
      }
    } catch (err: any) {
      console.error(`   ❌ Error downloading ${item.name}:`, err.message);
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      failed++;
    }
  }

  console.log(`\n=======================================================`);
  console.log(`📊 Download Summary:`);
  console.log(`   ✅ Downloaded: ${downloaded}`);
  console.log(`   ⏩ Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`=======================================================`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
