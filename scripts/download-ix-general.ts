import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface DownloadTarget {
  name: string;
  url: string;
}

const TARGETS: DownloadTarget[] = [
  // Pakistan Studies (English)
  {
    name: "Pakistan-Studies-English-IX-Paper-I-2025.pdf",
    url: "https://files.akuebresources.com/2025/11/Pakistan-Studies-English-IX-Paper-I-2025.pdf",
  },
  {
    name: "Pakistan-Studies-IX-Keys-2025.pdf",
    url: "https://files.akuebresources.com/2026/04/Pakistan-Studies-IX-Keys-2025.pdf",
  },
  {
    name: "Pakistan-Studies-English-IX-Paper-I-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/Pakistan-Studies-English-IX-Paper-I-2024.pdf",
  },
  {
    name: "Pakistan-Studies-IX-Keys-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/Pakistan-Studies-IX-Keys-2024.pdf",
  },
  {
    name: "Pakistan-Studies-English-IX-Paper-I-2023.pdf",
    url: "https://files.akuebresources.com/2024/09/Pakistan-Studies-English-IX-Paper-I-2023.pdf",
  },
  {
    name: "Pakistan-Studies-IX-Keys-2023.pdf",
    url: "https://files.akuebresources.com/2024/09/Pakistan-Studies-IX-Keys-2023.pdf",
  },
  {
    name: "Pakistan-Studies-English-IX-Paper-I-2022.pdf",
    url: "https://files.akuebresources.com/2024/09/Pakistan-Studies-English-IX-Paper-I-2022.pdf",
  },
  {
    name: "Pakistan-Studies-IX-Keys-2022.pdf",
    url: "https://files.akuebresources.com/2024/09/Pakistan-Studies-IX-Keys-2022.pdf",
  },

  // Pakistan Studies (Urdu)
  {
    name: "Pakistan-Studies-Urdu-IX-Paper-I-2025.pdf",
    url: "https://files.akuebresources.com/2025/11/Pakistan-Studies-Urdu-IX-Paper-I-2025.pdf",
  },
  {
    name: "Pakistan-Studies-Urdu-IX-Paper-I-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/Pakistan-Studies-Urdu-IX-Paper-I-2024.pdf",
  },
  {
    name: "Pakistan-Studies-Urdu-IX-Paper-I-2023.pdf",
    url: "https://files.akuebresources.com/2024/09/Pakistan-Studies-Urdu-IX-Paper-I-2023.pdf",
  },
  {
    name: "Pakistan-Studies-Urdu-IX-Paper-I-2022.pdf",
    url: "https://files.akuebresources.com/2024/09/Pakistan-Studies-Urdu-IX-Paper-I-2022.pdf",
  },

  // English Compulsory
  {
    name: "English-Compulsory-IX-Paper-I-2025.pdf",
    url: "https://files.akuebresources.com/2025/11/English-Compulsory-IX-Paper-I-2025-1.pdf",
  },
  {
    name: "English-Compulsory-IX-Keys-2025.pdf",
    url: "https://files.akuebresources.com/2026/04/English-Compulsory-IX-Keys-2025.pdf",
  },
  {
    name: "English-Compulsory-IX-Paper-I-2024.pdf",
    url: "https://files.akuebresources.com/2024/11/English-Compulsory-IX-Paper-I-2024.pdf",
  },
  {
    name: "English-Compulsory-IX-Keys-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/English-Compulsory-IX-Keys-2024.pdf",
  },
  {
    name: "English-IX-Paper-I-2023.pdf",
    url: "https://files.akuebresources.com/2024/08/English-IX-Paper-I-2023-.pdf",
  },
  {
    name: "English-IX-Keys-2023.pdf",
    url: "https://files.akuebresources.com/2024/08/English-IX-Keys-2023.pdf",
  },
  {
    name: "English-IX-Paper-I-2022.pdf",
    url: "https://files.akuebresources.com/2024/08/English-IX-Paper-I-2022.pdf",
  },
  {
    name: "English-IX-Keys-2022.pdf",
    url: "https://files.akuebresources.com/2025/05/English-IX-Keys-2022.pdf",
  },

  // General Mathematics
  {
    name: "General-Mathematics-IX-Paper-I-2025.pdf",
    url: "https://files.akuebresources.com/2025/11/General-Mathematics-IX-Paper-I-2025.pdf",
  },
  {
    name: "General-Mathematics-IX-Paper-I-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/General-Mathematics-IX-Paper-I-2024.pdf",
  },
  {
    name: "General-Mathematics-IX-Paper-I-2023.pdf",
    url: "https://files.akuebresources.com/2024/08/General-Mathematics-IX-Paper-I-2023.pdf",
  },
  {
    name: "General-Mathematics-IX-Paper-I-2022.pdf",
    url: "https://files.akuebresources.com/2024/08/General-Mathematics-IX-Paper-I-2022.pdf",
  },
  {
    name: "General-Mathematics-IX-Keys-2022.pdf",
    url: "https://files.akuebresources.com/2024/08/General-Mathematics-IX-Keys-2022.pdf",
  },
  {
    name: "General-Mathematics-IX-Paper-I-2021.pdf",
    url: "https://files.akuebresources.com/2024/08/General-Mathematics-IX-Paper-I-2021.pdf",
  },
  {
    name: "General-Mathematics-IX-Keys-2021.pdf",
    url: "https://files.akuebresources.com/2024/08/General-Mathematics-IX-Keys-2021.pdf",
  },

  // Islamiyat (English)
  {
    name: "Islamiyat-English-IX-Paper-I-2025.pdf",
    url: "https://files.akuebresources.com/2025/11/Islamiyat-English-IX-Paper-I-2025.pdf",
  },
  {
    name: "Islamiyat-IX-Keys-2025.pdf",
    url: "https://files.akuebresources.com/2026/04/Islamiyat-IX-Keys-2025.pdf",
  },
  {
    name: "Islamiyat-English-IX-Paper-I-2023.pdf",
    url: "https://files.akuebresources.com/2024/09/Islamiyat-English-IX-Paper-I-2023.pdf",
  },
  {
    name: "Islamiyat-IX-Keys-2023.pdf",
    url: "https://files.akuebresources.com/2024/09/Islamiyat-IX-Keys-2023.pdf",
  },
  {
    name: "Islamiyat-English-IX-Paper-I-2022.pdf",
    url: "https://files.akuebresources.com/2024/09/Islamiyat-English-IX-Paper-I-2022.pdf",
  },
  {
    name: "Islamiyat-IX-Keys-2022.pdf",
    url: "https://files.akuebresources.com/2024/09/Islamiyat-IX-Keys-2022.pdf",
  },

  // Islamiyat (Urdu)
  {
    name: "Islamiyat-Urdu-IX-Paper-I-2025.pdf",
    url: "https://files.akuebresources.com/2025/11/Islamiyat-Urdu-IX-Paper-I-2025.pdf",
  },
  {
    name: "Islamiyat-Urdu-IX-Paper-I-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/Islamiyat-Urdu-IX-Paper-I-2024.pdf",
  },
  {
    name: "Islamiyat-IX-Keys-2024.pdf",
    url: "https://files.akuebresources.com/2024/12/Islamiyat-IX-Keys-2024.pdf",
  },
  {
    name: "Islamiyat-Urdu-IX-Paper-I-2023.pdf",
    url: "https://files.akuebresources.com/2024/09/Islamiyat-Urdu-IX-Paper-I-2023.pdf",
  },
  {
    name: "Islamiyat-Urdu-IX-Paper-I-2022.pdf",
    url: "https://files.akuebresources.com/2024/09/Islamiyat-Urdu-IX-Paper-I-2022.pdf",
  },
];

const DOWNLOAD_DIR = path.join(process.cwd(), "pastpapers", "downloads", "ClassIX_General");

function downloadFile(url: string, dest: string): boolean {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log(`[SKIP] Already exists: ${path.basename(dest)}`);
    return true;
  }

  try {
    execSync(`curl -sL --max-time 30 -A "Mozilla/5.0" "${url}" -o "${dest}"`, {
      stdio: "pipe",
    });
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`[DONE] Downloaded: ${path.basename(dest)} (${fs.statSync(dest).size} bytes)`);
      return true;
    } else {
      console.error(`[FAIL] File empty or <1KB: ${path.basename(dest)}`);
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      return false;
    }
  } catch (err: any) {
    console.error(`[ERROR] ${err.message} for ${url}`);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  console.log(`Starting download of ${TARGETS.length} Class IX papers to ${DOWNLOAD_DIR}...`);
  let successCount = 0;
  for (const t of TARGETS) {
    const dest = path.join(DOWNLOAD_DIR, t.name);
    const ok = downloadFile(t.url, dest);
    if (ok) successCount++;
  }
  console.log(`\nFinished: ${successCount}/${TARGETS.length} files successfully downloaded.`);
}

main().catch(console.error);
