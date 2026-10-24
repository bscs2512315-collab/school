import axios from "axios";

const years = [2025, 2024, 2023, 2022, 2019, 2018, 2017, 2016, 2015];

async function checkUrl(url: string) {
  try {
    const res = await axios.head(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      timeout: 5000,
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function testSubject(grade: "IX" | "XII", subject: string, prefixes: string[]) {
  const validUrls: { year: number; url: string }[] = [];
  for (const year of years) {
    const candidates: string[] = [];

    if (grade === "XII") {
      const s = subject.toLowerCase().replace(/\s+/g, "-");
      // 2025 & 2024 & 2023
      candidates.push(`https://adamjeecoaching.blogspot.com/2026/04/${s}-12th-past-year-paper-${year}.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2025/04/${s}-12th-past-year-paper-${year}.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2025/02/${s}-12th-past-year-paper-${year}.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2024/12/${s}-12th-past-year-paper-${year}.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2024/05/${s}-12th-past-year-paper-${year}.html`);
      // 2019-2015
      candidates.push(`https://adamjeecoaching.blogspot.com/2019/08/12th-${s}-past-year-paper-2019.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2019/08/xii-${s}-past-year-paper-2019.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2018/08/12th-${s}-past-year-paper-2018.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2018/08/xii-${s}-past-year-paper-2018.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2017/09/xii-${s}-past-year-paper-2017.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2017/08/xii-${s}-past-year-paper-2017.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2016/10/xii-${s}-past-year-paper-2016.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2016/09/xii-${s}-past-year-paper-2016.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2015/09/xii-${s}-past-year-paper-2015.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2015/10/xii-${s}-past-year-paper-2015.html`);
    } else if (grade === "IX") {
      const s = subject.toLowerCase().replace(/\s+/g, "-");
      // 2025 & 2024
      candidates.push(`https://adamjeecoaching.blogspot.com/2026/02/${s}-9th-past-year-paper-${year}.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2026/03/${s}-9th-past-year-paper-${year}.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2024/12/${s}-9th-past-year-paper-${year}.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2024/11/${s}-9th-past-year-paper-${year}.html`);
      // 2019-2015
      candidates.push(`https://adamjeecoaching.blogspot.com/2019/08/9th-${s}-past-year-paper-2019.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2019/08/ix-${s}-past-year-paper-2019.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2018/08/9th-${s}-past-year-paper-2018.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2018/08/ix-${s}-past-year-paper-2018.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2017/08/ix-${s}-past-year-paper-2017.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2016/09/ix-${s}-past-year-paper-2016.html`);
      candidates.push(`https://adamjeecoaching.blogspot.com/2015/09/ix-${s}-past-year-paper-2015.html`);
    }

    for (const c of candidates) {
      if (await checkUrl(c)) {
        validUrls.push({ year, url: c });
        break;
      }
    }
  }

  console.log(`[Class ${grade} - ${subject}] Found ${validUrls.length} valid year papers:`);
  for (const v of validUrls) {
    console.log(`   ${v.year}: ${v.url}`);
  }
}

async function main() {
  console.log("Testing Class XII subjects...");
  await testSubject("XII", "Physics", []);
  await testSubject("XII", "Chemistry", []);
  await testSubject("XII", "Mathematics", []);
  await testSubject("XII", "Botany", []);
  await testSubject("XII", "Zoology", []);
  await testSubject("XII", "Computer Science", []);
  await testSubject("XII", "English", []);
  await testSubject("XII", "Pakistan Studies", []);
  await testSubject("XII", "Urdu", []);

  console.log("\nTesting Class IX subjects...");
  await testSubject("IX", "Physics", []);
  await testSubject("IX", "Chemistry", []);
  await testSubject("IX", "Biology", []);
  await testSubject("IX", "Computer Science", []);
  await testSubject("IX", "Mathematics", []);
  await testSubject("IX", "English", []);
  await testSubject("IX", "Islamiat", []);
  await testSubject("IX", "Urdu", []);
  await testSubject("IX", "Sindhi", []);
  await testSubject("IX", "Pakistan Studies", []);
}

main();
