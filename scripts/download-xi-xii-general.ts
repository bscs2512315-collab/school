import fs from "fs";
import path from "path";
import https from "https";

interface PaperTarget {
  classLevel: "XI" | "XII";
  subject: string;
  year: number;
  folder: string;
  paperUrl: string;
  paperFileName: string;
  keyUrl?: string;
  keyFileName?: string;
}

const TARGETS: PaperTarget[] = [
  // ==========================================
  // CLASS XI (HSSC-I)
  // ==========================================

  // 1. English Compulsory XI
  {
    classLevel: "XI",
    subject: "English Compulsory",
    year: 2025,
    folder: "pastpapers/downloads/ClassXI_General/English",
    paperUrl: "https://files.akuebresources.com/2025/11/English-Compulsory-XI-Paper-I-2025.pdf",
    paperFileName: "English-Compulsory-XI-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/English-Compulsory-XI-Keys-2025.pdf",
    keyFileName: "English-Compulsory-XI-Keys-2025.pdf",
  },
  {
    classLevel: "XI",
    subject: "English Compulsory",
    year: 2024,
    folder: "pastpapers/downloads/ClassXI_General/English",
    paperUrl: "https://files.akuebresources.com/2024/11/English-XI-Paper-I-2024.pdf",
    paperFileName: "English-Compulsory-XI-Paper-I-2024.pdf",
    keyUrl: "https://files.akuebresources.com/2025/01/English-Compulsory-XI-Keys-2024.pdf",
    keyFileName: "English-Compulsory-XI-Keys-2024.pdf",
  },
  {
    classLevel: "XI",
    subject: "English Compulsory",
    year: 2023,
    folder: "pastpapers/downloads/ClassXI_General/English",
    paperUrl: "https://files.akuebresources.com/2024/07/English-XI-Paper-I-2023.pdf",
    paperFileName: "English-Compulsory-XI-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/English-XI-Keys-2023.pdf",
    keyFileName: "English-Compulsory-XI-Keys-2023.pdf",
  },
  {
    classLevel: "XI",
    subject: "English Compulsory",
    year: 2022,
    folder: "pastpapers/downloads/ClassXI_General/English",
    paperUrl: "https://files.akuebresources.com/2024/07/English-XI-Paper-I-2022.pdf",
    paperFileName: "English-Compulsory-XI-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/English-XI-Keys-2022.pdf",
    keyFileName: "English-Compulsory-XI-Keys-2022.pdf",
  },

  // 2. Urdu Compulsory XI
  {
    classLevel: "XI",
    subject: "Urdu Compulsory",
    year: 2025,
    folder: "pastpapers/downloads/ClassXI_General/Urdu",
    paperUrl: "https://files.akuebresources.com/2025/11/Urdu-Compulsory-XI-Paper-I-2025.pdf",
    paperFileName: "Urdu-Compulsory-XI-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/Urdu-Compulsory-XI-Keys-2025.pdf",
    keyFileName: "Urdu-Compulsory-XI-Keys-2025.pdf",
  },
  {
    classLevel: "XI",
    subject: "Urdu Compulsory",
    year: 2024,
    folder: "pastpapers/downloads/ClassXI_General/Urdu",
    paperUrl: "https://files.akuebresources.com/2024/11/Urdu-Compulsory-XI-Paper-I-2024.pdf",
    paperFileName: "Urdu-Compulsory-XI-Paper-I-2024.pdf",
  },
  {
    classLevel: "XI",
    subject: "Urdu Compulsory",
    year: 2023,
    folder: "pastpapers/downloads/ClassXI_General/Urdu",
    paperUrl: "https://files.akuebresources.com/2024/07/Urdu-XI-Paper-I-2023.pdf",
    paperFileName: "Urdu-Compulsory-XI-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Urdu-XI-Keys-2023.pdf",
    keyFileName: "Urdu-Compulsory-XI-Keys-2023.pdf",
  },
  {
    classLevel: "XI",
    subject: "Urdu Compulsory",
    year: 2022,
    folder: "pastpapers/downloads/ClassXI_General/Urdu",
    paperUrl: "https://files.akuebresources.com/2024/07/Urdu-XI-Paper-I-2022.pdf",
    paperFileName: "Urdu-Compulsory-XI-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Urdu-XI-Keys-2022.pdf",
    keyFileName: "Urdu-Compulsory-XI-Keys-2022.pdf",
  },

  // 3. Business Mathematics XI
  {
    classLevel: "XI",
    subject: "Business Mathematics",
    year: 2025,
    folder: "pastpapers/downloads/ClassXI_General/Business_Mathematics",
    paperUrl: "https://files.akuebresources.com/2025/11/Business-Mathematics-XI-Paper-I-2025.pdf",
    paperFileName: "Business-Mathematics-XI-Paper-I-2025.pdf",
  },
  {
    classLevel: "XI",
    subject: "Business Mathematics",
    year: 2024,
    folder: "pastpapers/downloads/ClassXI_General/Business_Mathematics",
    paperUrl: "https://files.akuebresources.com/2024/11/Business-Mathematics-XI-Paper-I-2024.pdf",
    paperFileName: "Business-Mathematics-XI-Paper-I-2024.pdf",
  },
  {
    classLevel: "XI",
    subject: "Business Mathematics",
    year: 2023,
    folder: "pastpapers/downloads/ClassXI_General/Business_Mathematics",
    paperUrl: "https://files.akuebresources.com/2024/07/Business-Mathematics-XI-Paper-I-2023.pdf",
    paperFileName: "Business-Mathematics-XI-Paper-I-2023.pdf",
  },
  {
    classLevel: "XI",
    subject: "Business Mathematics",
    year: 2022,
    folder: "pastpapers/downloads/ClassXI_General/Business_Mathematics",
    paperUrl: "https://files.akuebresources.com/2024/07/Business-Mathematics-XI-Paper-I-2022.pdf",
    paperFileName: "Business-Mathematics-XI-Paper-I-2022.pdf",
  },

  // 4. Principles of Accounting XI
  {
    classLevel: "XI",
    subject: "Principles of Accounting",
    year: 2025,
    folder: "pastpapers/downloads/ClassXI_General/Principles_of_Accounting",
    paperUrl: "https://files.akuebresources.com/2025/11/Principles-of-Accounting-XI-Paper-I-2025.pdf",
    paperFileName: "Principles-of-Accounting-XI-Paper-I-2025.pdf",
  },
  {
    classLevel: "XI",
    subject: "Principles of Accounting",
    year: 2024,
    folder: "pastpapers/downloads/ClassXI_General/Principles_of_Accounting",
    paperUrl: "https://files.akuebresources.com/2024/11/Principles-of-Accounting-XI-Paper-I-2024.pdf",
    paperFileName: "Principles-of-Accounting-XI-Paper-I-2024.pdf",
  },
  {
    classLevel: "XI",
    subject: "Principles of Accounting",
    year: 2023,
    folder: "pastpapers/downloads/ClassXI_General/Principles_of_Accounting",
    paperUrl: "https://files.akuebresources.com/2024/07/Principles-of-Accounting-XI-Paper-I-2023.pdf",
    paperFileName: "Principles-of-Accounting-XI-Paper-I-2023.pdf",
  },
  {
    classLevel: "XI",
    subject: "Principles of Accounting",
    year: 2022,
    folder: "pastpapers/downloads/ClassXI_General/Principles_of_Accounting",
    paperUrl: "https://files.akuebresources.com/2024/07/Principles-of-Accounting-XI-Paper-I-2022.pdf",
    paperFileName: "Principles-of-Accounting-XI-Paper-I-2022.pdf",
  },
  {
    classLevel: "XI",
    subject: "Principles of Accounting",
    year: 2021,
    folder: "pastpapers/downloads/ClassXI_General/Principles_of_Accounting",
    paperUrl: "https://files.akuebresources.com/2024/07/Principles-of-Accounting-XI-Paper-I-2021.pdf",
    paperFileName: "Principles-of-Accounting-XI-Paper-I-2021.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Principles-of-Accounting-XI-Keys-2021.pdf",
    keyFileName: "Principles-of-Accounting-XI-Keys-2021.pdf",
  },

  // 5. Principles of Commerce XI
  {
    classLevel: "XI",
    subject: "Principles of Commerce",
    year: 2024,
    folder: "pastpapers/downloads/ClassXI_General/Principles_of_Commerce",
    paperUrl: "https://files.akuebresources.com/2024/11/Principles-of-Commerce-XI-Paper-I-2024.pdf",
    paperFileName: "Principles-of-Commerce-XI-Paper-I-2024.pdf",
  },
  {
    classLevel: "XI",
    subject: "Principles of Commerce",
    year: 2023,
    folder: "pastpapers/downloads/ClassXI_General/Principles_of_Commerce",
    paperUrl: "https://files.akuebresources.com/2024/07/Principles-of-Commerce-XI-Paper-I-2023.pdf",
    paperFileName: "Principles-of-Commerce-XI-Paper-I-2023.pdf",
  },
  {
    classLevel: "XI",
    subject: "Principles of Commerce",
    year: 2022,
    folder: "pastpapers/downloads/ClassXI_General/Principles_of_Commerce",
    paperUrl: "https://files.akuebresources.com/2024/07/Principles-of-Commerce-XI-Paper-I-2022.pdf",
    paperFileName: "Principles-of-Commerce-XI-Paper-I-2022.pdf",
  },

  // 6. Principles of Economics XI
  {
    classLevel: "XI",
    subject: "Principles of Economics",
    year: 2023,
    folder: "pastpapers/downloads/ClassXI_General/Principles_of_Economics",
    paperUrl: "https://files.akuebresources.com/2024/07/Principles-of-Economics-XI-Paper-I-2023.pdf",
    paperFileName: "Principles-of-Economics-XI-Paper-I-2023.pdf",
  },
  {
    classLevel: "XI",
    subject: "Principles of Economics",
    year: 2022,
    folder: "pastpapers/downloads/ClassXI_General/Principles_of_Economics",
    paperUrl: "https://files.akuebresources.com/2024/07/Principles-of-Economics-XI-Paper-I-2022.pdf",
    paperFileName: "Principles-of-Economics-XI-Paper-I-2022.pdf",
  },

  // ==========================================
  // CLASS XII (HSSC-II)
  // ==========================================

  // 7. English Compulsory XII
  {
    classLevel: "XII",
    subject: "English Compulsory",
    year: 2025,
    folder: "pastpapers/downloads/ClassXII_General/English",
    paperUrl: "https://files.akuebresources.com/2025/11/English-Compulsory-XII-Paper-I-2025.pdf",
    paperFileName: "English-Compulsory-XII-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/English-Compulsory-XII-Keys-2025.pdf",
    keyFileName: "English-Compulsory-XII-Keys-2025.pdf",
  },
  {
    classLevel: "XII",
    subject: "English Compulsory",
    year: 2024,
    folder: "pastpapers/downloads/ClassXII_General/English",
    paperUrl: "https://files.akuebresources.com/2024/11/English-Compulsory-XII-Paper-I-2024.pdf",
    paperFileName: "English-Compulsory-XII-Paper-I-2024.pdf",
    keyUrl: "https://files.akuebresources.com/2025/01/English-XII-Keys-2024.pdf",
    keyFileName: "English-Compulsory-XII-Keys-2024.pdf",
  },
  {
    classLevel: "XII",
    subject: "English Compulsory",
    year: 2023,
    folder: "pastpapers/downloads/ClassXII_General/English",
    paperUrl: "https://files.akuebresources.com/2024/07/English-XII-Paper-I-2023.pdf",
    paperFileName: "English-Compulsory-XII-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/English-XII-Keys-2023.pdf",
    keyFileName: "English-Compulsory-XII-Keys-2023.pdf",
  },
  {
    classLevel: "XII",
    subject: "English Compulsory",
    year: 2022,
    folder: "pastpapers/downloads/ClassXII_General/English",
    paperUrl: "https://files.akuebresources.com/2024/07/English-XII-Paper-I-2022.pdf",
    paperFileName: "English-Compulsory-XII-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/English-XII-Keys-2022.pdf",
    keyFileName: "English-Compulsory-XII-Keys-2022.pdf",
  },

  // 8. Urdu Compulsory XII
  {
    classLevel: "XII",
    subject: "Urdu Compulsory",
    year: 2025,
    folder: "pastpapers/downloads/ClassXII_General/Urdu",
    paperUrl: "https://files.akuebresources.com/2025/11/Urdu-Compulsory-XII-Paper-I-2025.pdf",
    paperFileName: "Urdu-Compulsory-XII-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/Urdu-Compulsory-XII-Keys-2025.pdf",
    keyFileName: "Urdu-Compulsory-XII-Keys-2025.pdf",
  },
  {
    classLevel: "XII",
    subject: "Urdu Compulsory",
    year: 2024,
    folder: "pastpapers/downloads/ClassXII_General/Urdu",
    paperUrl: "https://files.akuebresources.com/2024/11/Urdu-Compulsory-XII-Paper-I-2024.pdf",
    paperFileName: "Urdu-Compulsory-XII-Paper-I-2024.pdf",
    keyUrl: "https://files.akuebresources.com/2025/01/Urdu-XII-Keys-2024.pdf",
    keyFileName: "Urdu-Compulsory-XII-Keys-2024.pdf",
  },
  {
    classLevel: "XII",
    subject: "Urdu Compulsory",
    year: 2023,
    folder: "pastpapers/downloads/ClassXII_General/Urdu",
    paperUrl: "https://files.akuebresources.com/2024/07/Urdu-XII-Paper-I-2023.pdf",
    paperFileName: "Urdu-Compulsory-XII-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Urdu-XII-Keys-2023.pdf",
    keyFileName: "Urdu-Compulsory-XII-Keys-2023.pdf",
  },
  {
    classLevel: "XII",
    subject: "Urdu Compulsory",
    year: 2022,
    folder: "pastpapers/downloads/ClassXII_General/Urdu",
    paperUrl: "https://files.akuebresources.com/2024/07/Urdu-XII-Paper-I-2022.pdf",
    paperFileName: "Urdu-Compulsory-XII-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Urdu-XII-Keys-2022.pdf",
    keyFileName: "Urdu-Compulsory-XII-Keys-2022.pdf",
  },

  // 9. Pakistan Studies XII (English)
  {
    classLevel: "XII",
    subject: "Pakistan Studies",
    year: 2025,
    folder: "pastpapers/downloads/ClassXII_General/Pakistan_Studies_English",
    paperUrl: "https://files.akuebresources.com/2025/11/Pakistan-Studies-XII-Paper-I-2025-English.pdf",
    paperFileName: "Pakistan-Studies-English-XII-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/Pakistan-Studies-XII-Keys-2025.pdf",
    keyFileName: "Pakistan-Studies-XII-Keys-2025.pdf",
  },
  {
    classLevel: "XII",
    subject: "Pakistan Studies",
    year: 2024,
    folder: "pastpapers/downloads/ClassXII_General/Pakistan_Studies_English",
    paperUrl: "https://files.akuebresources.com/2024/11/Pakistan-Studies-XII-Paper-I-2024-English.pdf",
    paperFileName: "Pakistan-Studies-English-XII-Paper-I-2024.pdf",
    keyUrl: "https://files.akuebresources.com/2025/02/Pakistan-Studies-XII-Keys-2024.pdf",
    keyFileName: "Pakistan-Studies-XII-Keys-2024.pdf",
  },
  {
    classLevel: "XII",
    subject: "Pakistan Studies",
    year: 2023,
    folder: "pastpapers/downloads/ClassXII_General/Pakistan_Studies_English",
    paperUrl: "https://files.akuebresources.com/2024/07/Pakistan-Studies-English-XII-Paper-I-2023.pdf",
    paperFileName: "Pakistan-Studies-English-XII-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Pakistan-Studies-XII-Keys-2023.pdf",
    keyFileName: "Pakistan-Studies-XII-Keys-2023.pdf",
  },
  {
    classLevel: "XII",
    subject: "Pakistan Studies",
    year: 2022,
    folder: "pastpapers/downloads/ClassXII_General/Pakistan_Studies_English",
    paperUrl: "https://files.akuebresources.com/2024/07/Pakistan-Studies-English-XII-Paper-I-2022.pdf",
    paperFileName: "Pakistan-Studies-English-XII-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Pakistan-Studies-XII-Keys-2022.pdf",
    keyFileName: "Pakistan-Studies-XII-Keys-2022.pdf",
  },

  // 10. Pakistan Studies XII (Urdu)
  {
    classLevel: "XII",
    subject: "Pakistan Studies (Urdu)",
    year: 2023,
    folder: "pastpapers/downloads/ClassXII_General/Pakistan_Studies_Urdu",
    paperUrl: "https://files.akuebresources.com/2024/07/Pakistan-Studies-Urdu-XII-Paper-I-2023.pdf",
    paperFileName: "Pakistan-Studies-Urdu-XII-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Pakistan-Studies-XII-Keys-2023.pdf",
    keyFileName: "Pakistan-Studies-XII-Keys-2023.pdf",
  },
  {
    classLevel: "XII",
    subject: "Pakistan Studies (Urdu)",
    year: 2022,
    folder: "pastpapers/downloads/ClassXII_General/Pakistan_Studies_Urdu",
    paperUrl: "https://files.akuebresources.com/2024/07/Pakistan-Studies-Urdu-XII-Paper-I-2022.pdf",
    paperFileName: "Pakistan-Studies-Urdu-XII-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Pakistan-Studies-XII-Keys-2022.pdf",
    keyFileName: "Pakistan-Studies-XII-Keys-2022.pdf",
  },

  // 11. Islamiyat XII (English)
  {
    classLevel: "XII",
    subject: "Islamiyat",
    year: 2025,
    folder: "pastpapers/downloads/ClassXII_General/Islamiyat_English",
    paperUrl: "https://files.akuebresources.com/2025/11/Islamiyat-XII-Paper-I-2025-English.pdf",
    paperFileName: "Islamiyat-English-XII-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/Islamiyat-XII-Keys-2025.pdf",
    keyFileName: "Islamiyat-XII-Keys-2025.pdf",
  },
  {
    classLevel: "XII",
    subject: "Islamiyat",
    year: 2024,
    folder: "pastpapers/downloads/ClassXII_General/Islamiyat_English",
    paperUrl: "https://files.akuebresources.com/2024/11/Islamiyat-XII-Paper-I-2024-English.pdf",
    paperFileName: "Islamiyat-English-XII-Paper-I-2024.pdf",
    keyUrl: "https://files.akuebresources.com/2025/02/Islamiyat-XII-Keys-2024.pdf",
    keyFileName: "Islamiyat-XII-Keys-2024.pdf",
  },
  {
    classLevel: "XII",
    subject: "Islamiyat",
    year: 2023,
    folder: "pastpapers/downloads/ClassXII_General/Islamiyat_English",
    paperUrl: "https://files.akuebresources.com/2024/07/Islamiyat-English-XII-Paper-I-2023.pdf",
    paperFileName: "Islamiyat-English-XII-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Islamiyat-XII-Keys-2023.pdf",
    keyFileName: "Islamiyat-XII-Keys-2023.pdf",
  },
  {
    classLevel: "XII",
    subject: "Islamiyat",
    year: 2022,
    folder: "pastpapers/downloads/ClassXII_General/Islamiyat_English",
    paperUrl: "https://files.akuebresources.com/2024/07/Islamiyat-English-XII-Paper-I-2022.pdf",
    paperFileName: "Islamiyat-English-XII-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Islamiyat-XII-Keys-2022.pdf",
    keyFileName: "Islamiyat-XII-Keys-2022.pdf",
  },

  // 12. Islamiyat XII (Urdu)
  {
    classLevel: "XII",
    subject: "Islamiyat (Urdu)",
    year: 2025,
    folder: "pastpapers/downloads/ClassXII_General/Islamiyat_Urdu",
    paperUrl: "https://files.akuebresources.com/2025/11/Islamiyat-XII-Paper-I-2025-Urdu.pdf",
    paperFileName: "Islamiyat-Urdu-XII-Paper-I-2025.pdf",
    keyUrl: "https://files.akuebresources.com/2026/04/Islamiyat-XII-Keys-2025.pdf",
    keyFileName: "Islamiyat-XII-Keys-2025.pdf",
  },
  {
    classLevel: "XII",
    subject: "Islamiyat (Urdu)",
    year: 2024,
    folder: "pastpapers/downloads/ClassXII_General/Islamiyat_Urdu",
    paperUrl: "https://files.akuebresources.com/2024/11/Islamiyat-XII-Paper-I-2024-Urdu.pdf",
    paperFileName: "Islamiyat-Urdu-XII-Paper-I-2024.pdf",
    keyUrl: "https://files.akuebresources.com/2025/02/Islamiyat-XII-Keys-2024.pdf",
    keyFileName: "Islamiyat-XII-Keys-2024.pdf",
  },
  {
    classLevel: "XII",
    subject: "Islamiyat (Urdu)",
    year: 2023,
    folder: "pastpapers/downloads/ClassXII_General/Islamiyat_Urdu",
    paperUrl: "https://files.akuebresources.com/2024/07/Islamiyat-Urdu-XII-Paper-I-2023.pdf",
    paperFileName: "Islamiyat-Urdu-XII-Paper-I-2023.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Islamiyat-XII-Keys-2023.pdf",
    keyFileName: "Islamiyat-XII-Keys-2023.pdf",
  },
  {
    classLevel: "XII",
    subject: "Islamiyat (Urdu)",
    year: 2022,
    folder: "pastpapers/downloads/ClassXII_General/Islamiyat_Urdu",
    paperUrl: "https://files.akuebresources.com/2024/07/Islamiyat-Urdu-XII-Paper-I-2022.pdf",
    paperFileName: "Islamiyat-Urdu-XII-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Islamiyat-XII-Keys-2022.pdf",
    keyFileName: "Islamiyat-XII-Keys-2022.pdf",
  },

  // 13. Principles of Accounting XII
  {
    classLevel: "XII",
    subject: "Principles of Accounting",
    year: 2025,
    folder: "pastpapers/downloads/ClassXII_General/Principles_of_Accounting",
    paperUrl: "https://files.akuebresources.com/2025/11/Principles-of-Accounting-XII-Paper-I-2025.pdf",
    paperFileName: "Principles-of-Accounting-XII-Paper-I-2025.pdf",
  },
  {
    classLevel: "XII",
    subject: "Principles of Accounting",
    year: 2024,
    folder: "pastpapers/downloads/ClassXII_General/Principles_of_Accounting",
    paperUrl: "https://files.akuebresources.com/2025/01/Principles-of-Accounting-XII-Paper-I-2024.pdf",
    paperFileName: "Principles-of-Accounting-XII-Paper-I-2024.pdf",
  },
  {
    classLevel: "XII",
    subject: "Principles of Accounting",
    year: 2023,
    folder: "pastpapers/downloads/ClassXII_General/Principles_of_Accounting",
    paperUrl: "https://files.akuebresources.com/2024/08/Principles-of-Accounting-XII-Paper-I-2023.pdf",
    paperFileName: "Principles-of-Accounting-XII-Paper-I-2023.pdf",
  },
  {
    classLevel: "XII",
    subject: "Principles of Accounting",
    year: 2022,
    folder: "pastpapers/downloads/ClassXII_General/Principles_of_Accounting",
    paperUrl: "https://files.akuebresources.com/2026/08/Priciples-of-Accounting-XII-Paper-I-2022.pdf",
    paperFileName: "Principles-of-Accounting-XII-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2026/08/Principles-of-Accounting-XII-Keys-2022.pdf",
    keyFileName: "Principles-of-Accounting-XII-Keys-2022.pdf",
  },

  // 14. Commercial Geography XII
  {
    classLevel: "XII",
    subject: "Commercial Geography",
    year: 2025,
    folder: "pastpapers/downloads/ClassXII_General/Commercial_Geography",
    paperUrl: "https://files.akuebresources.com/2025/11/Commercial-Geography-XII-Paper-I-2025.pdf",
    paperFileName: "Commercial-Geography-XII-Paper-I-2025.pdf",
  },
  {
    classLevel: "XII",
    subject: "Commercial Geography",
    year: 2024,
    folder: "pastpapers/downloads/ClassXII_General/Commercial_Geography",
    paperUrl: "https://files.akuebresources.com/2024/11/Commercial-Geography-XII-Paper-I-2024.pdf",
    paperFileName: "Commercial-Geography-XII-Paper-I-2024.pdf",
  },
  {
    classLevel: "XII",
    subject: "Commercial Geography",
    year: 2023,
    folder: "pastpapers/downloads/ClassXII_General/Commercial_Geography",
    paperUrl: "https://files.akuebresources.com/2024/07/Commercial-Geography-XII-Paper-I-2023.pdf",
    paperFileName: "Commercial-Geography-XII-Paper-I-2023.pdf",
  },
  {
    classLevel: "XII",
    subject: "Commercial Geography",
    year: 2022,
    folder: "pastpapers/downloads/ClassXII_General/Commercial_Geography",
    paperUrl: "https://files.akuebresources.com/2024/07/Commercial-Geography-XII-Paper-I-2022.pdf",
    paperFileName: "Commercial-Geography-XII-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Commercial-Geography-XII-Keys-2022.pdf",
    keyFileName: "Commercial-Geography-XII-Keys-2022.pdf",
  },
  {
    classLevel: "XII",
    subject: "Commercial Geography",
    year: 2021,
    folder: "pastpapers/downloads/ClassXII_General/Commercial_Geography",
    paperUrl: "https://files.akuebresources.com/2024/07/Commercial-Geography-XII-Paper-I-2021.pdf",
    paperFileName: "Commercial-Geography-XII-Paper-I-2021.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Commercial-Geography-XII-Keys-2021.pdf",
    keyFileName: "Commercial-Geography-XII-Keys-2021.pdf",
  },

  // 15. Business Statistics XII
  {
    classLevel: "XII",
    subject: "Business Statistics",
    year: 2025,
    folder: "pastpapers/downloads/ClassXII_General/Business_Statistics",
    paperUrl: "https://files.akuebresources.com/2025/11/Business-Statistics-XII-Paper-I-2025.pdf",
    paperFileName: "Business-Statistics-XII-Paper-I-2025.pdf",
  },
  {
    classLevel: "XII",
    subject: "Business Statistics",
    year: 2024,
    folder: "pastpapers/downloads/ClassXII_General/Business_Statistics",
    paperUrl: "https://files.akuebresources.com/2024/11/Business-Statistics-XII-Paper-I-2024.pdf",
    paperFileName: "Business-Statistics-XII-Paper-I-2024.pdf",
  },
  {
    classLevel: "XII",
    subject: "Business Statistics",
    year: 2023,
    folder: "pastpapers/downloads/ClassXII_General/Business_Statistics",
    paperUrl: "https://files.akuebresources.com/2024/07/Business-Statistics-XII-Paper-I-2023.pdf",
    paperFileName: "Business-Statistics-XII-Paper-I-2023.pdf",
  },
  {
    classLevel: "XII",
    subject: "Business Statistics",
    year: 2022,
    folder: "pastpapers/downloads/ClassXII_General/Business_Statistics",
    paperUrl: "https://files.akuebresources.com/2024/07/Business-Statistics-XII-Paper-I-2022.pdf",
    paperFileName: "Business-Statistics-XII-Paper-I-2022.pdf",
    keyUrl: "https://files.akuebresources.com/2024/07/Business-Statistics-XII-Keys-2022.pdf",
    keyFileName: "Business-Statistics-XII-Keys-2022.pdf",
  },
  {
    classLevel: "XII",
    subject: "Business Statistics",
    year: 2021,
    folder: "pastpapers/downloads/ClassXII_General/Business_Statistics",
    paperUrl: "https://files.akuebresources.com/2024/07/Business-Statistics-XII-Paper-I-2021.pdf",
    paperFileName: "Business-Statistics-XII-Paper-I-2021.pdf",
  },

  // 16. Banking XII
  {
    classLevel: "XII",
    subject: "Banking",
    year: 2025,
    folder: "pastpapers/downloads/ClassXII_General/Banking",
    paperUrl: "https://files.akuebresources.com/2025/11/Banking-XII-Paper-I-2025.pdf",
    paperFileName: "Banking-XII-Paper-I-2025.pdf",
  },
  {
    classLevel: "XII",
    subject: "Banking",
    year: 2024,
    folder: "pastpapers/downloads/ClassXII_General/Banking",
    paperUrl: "https://files.akuebresources.com/2024/11/Banking-XII-Paper-I-2024.pdf",
    paperFileName: "Banking-XII-Paper-I-2024.pdf",
  },
  {
    classLevel: "XII",
    subject: "Banking",
    year: 2023,
    folder: "pastpapers/downloads/ClassXII_General/Banking",
    paperUrl: "https://files.akuebresources.com/2024/07/Banking-XII-Paper-I-2023.pdf",
    paperFileName: "Banking-XII-Paper-I-2023.pdf",
  },
  {
    classLevel: "XII",
    subject: "Banking",
    year: 2022,
    folder: "pastpapers/downloads/ClassXII_General/Banking",
    paperUrl: "https://files.akuebresources.com/2024/07/Banking-XII-Paper-I-2022.pdf",
    paperFileName: "Banking-XII-Paper-I-2022.pdf",
  },
  {
    classLevel: "XII",
    subject: "Banking",
    year: 2021,
    folder: "pastpapers/downloads/ClassXII_General/Banking",
    paperUrl: "https://files.akuebresources.com/2024/07/Banking-XII-Paper-I-2021.pdf",
    paperFileName: "Banking-XII-Paper-I-2021.pdf",
  },
];

function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
      console.log(`  ⏩ Exists: ${path.basename(destPath)}`);
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
  console.log(`📥 Downloading ${TARGETS.length} Class XI & XII General & Commerce Past Papers and Keys...\n`);

  let successCount = 0;
  for (const item of TARGETS) {
    const dir = path.resolve(process.cwd(), item.folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const paperDest = path.join(dir, item.paperFileName);
    console.log(`[Class ${item.classLevel} | ${item.subject} | ${item.year}] Paper 1...`);
    const pOk = await downloadFile(item.paperUrl, paperDest);
    if (pOk) successCount++;

    if (item.keyUrl && item.keyFileName) {
      const keyDest = path.join(dir, item.keyFileName);
      console.log(`[Class ${item.classLevel} | ${item.subject} | ${item.year}] Answer Key...`);
      await downloadFile(item.keyUrl, keyDest);
    }
  }

  console.log(`\n🎉 Download complete! Successfully downloaded/verified ${successCount}/${TARGETS.length} papers.`);
}

main().catch(console.error);
