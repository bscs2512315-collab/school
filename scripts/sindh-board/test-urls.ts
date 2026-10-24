import axios from "axios";

interface SubjectTest {
  subject: string;
  urls: { year: number; url: string }[];
}

const TEST_SUBJECTS: SubjectTest[] = [
  {
    subject: "Physics",
    urls: [
      { year: 2025, url: "https://adamjeecoaching.blogspot.com/2026/02/physics-10th-past-year-paper-2025.html" },
      { year: 2024, url: "https://adamjeecoaching.blogspot.com/2024/12/physics-10th-past-year-paper-2024.html" },
      { year: 2019, url: "https://adamjeecoaching.blogspot.com/2019/08/10th-physics-past-year-paper-2019.html" },
      { year: 2018, url: "https://adamjeecoaching.blogspot.com/2018/08/10th-physics-past-year-paper-2018.html" },
      { year: 2017, url: "https://adamjeecoaching.blogspot.com/2017/08/x-physics-past-year-paper-2017.html" },
      { year: 2016, url: "https://adamjeecoaching.blogspot.com/2016/09/x-physics-past-year-paper-2016.html" },
      { year: 2015, url: "https://adamjeecoaching.blogspot.com/2015/09/x-physics-past-year-paper-2015.html" },
    ]
  },
  {
    subject: "Chemistry",
    urls: [
      { year: 2025, url: "https://adamjeecoaching.blogspot.com/2026/02/chemistry-10th-past-year-paper-2025.html" },
      { year: 2024, url: "https://adamjeecoaching.blogspot.com/2024/12/chemistry-10th-solved-numericals-past-year-paper-2024.html" },
      { year: 2019, url: "https://adamjeecoaching.blogspot.com/2019/08/10th-chemistry-past-year-paper-2019.html" },
      { year: 2018, url: "https://adamjeecoaching.blogspot.com/2018/08/10th-chemistry-past-year-paper-2018.html" },
      { year: 2017, url: "https://adamjeecoaching.blogspot.com/2017/08/x-chemistry-past-year-paper-2017.html" },
      { year: 2016, url: "https://adamjeecoaching.blogspot.com/2016/09/x-chemistry-past-year-paper-2016.html" },
      { year: 2015, url: "https://adamjeecoaching.blogspot.com/2015/09/x-chemistry-past-year-paper-2015.html" },
    ]
  },
  {
    subject: "Biology",
    urls: [
      { year: 2025, url: "https://adamjeecoaching.blogspot.com/2026/02/biology-10th-past-year-paper-2025.html" },
      { year: 2024, url: "https://adamjeecoaching.blogspot.com/2024/12/biology-10th-past-year-paper-2024.html" },
      { year: 2019, url: "https://adamjeecoaching.blogspot.com/2019/08/10th-biology-past-year-paper-2019.html" },
      { year: 2018, url: "https://adamjeecoaching.blogspot.com/2018/08/10th-biology-past-year-paper-2018.html" },
      { year: 2017, url: "https://adamjeecoaching.blogspot.com/2017/08/x-biology-past-year-paper-2017.html" },
      { year: 2016, url: "https://adamjeecoaching.blogspot.com/2016/09/x-biology-past-year-paper-2016.html" },
      { year: 2015, url: "https://adamjeecoaching.blogspot.com/2015/09/x-biology-past-year-paper-2015.html" },
    ]
  },
  {
    subject: "Computer Science",
    urls: [
      { year: 2025, url: "https://adamjeecoaching.blogspot.com/2026/02/computer-studies-10th-past-year-paper-2025.html" },
      { year: 2024, url: "https://adamjeecoaching.blogspot.com/2024/12/computer-studies-10th-past-year-paper-2024.html" },
      { year: 2019, url: "https://adamjeecoaching.blogspot.com/2019/08/10th-computer-studies-past-year-paper-2019.html" },
      { year: 2018, url: "https://adamjeecoaching.blogspot.com/2018/08/10th-computer-studies-past-year-paper-2018.html" },
      { year: 2017, url: "https://adamjeecoaching.blogspot.com/2017/08/x-computer-studies-past-year-paper-2017.html" },
      { year: 2016, url: "https://adamjeecoaching.blogspot.com/2016/09/x-computer-studies-past-year-paper-2016.html" },
      { year: 2015, url: "https://adamjeecoaching.blogspot.com/2015/09/x-computer-studies-past-year-paper-2015.html" },
    ]
  },
  {
    subject: "English",
    urls: [
      { year: 2025, url: "https://adamjeecoaching.blogspot.com/2026/02/english-10th-past-year-paper-2025.html" },
      { year: 2024, url: "https://adamjeecoaching.blogspot.com/2024/12/english-10th-past-year-paper-2024.html" },
      { year: 2019, url: "https://adamjeecoaching.blogspot.com/2019/08/10th-english-past-year-paper-2019.html" },
      { year: 2018, url: "https://adamjeecoaching.blogspot.com/2018/08/10th-english-past-year-paper-2018.html" },
      { year: 2017, url: "https://adamjeecoaching.blogspot.com/2017/08/x-english-past-year-paper-2017.html" },
      { year: 2016, url: "https://adamjeecoaching.blogspot.com/2016/09/x-english-past-year-paper-2016.html" },
      { year: 2015, url: "https://adamjeecoaching.blogspot.com/2015/09/x-english-past-year-paper-2015.html" },
    ]
  },
  {
    subject: "Pakistan Studies",
    urls: [
      { year: 2025, url: "https://adamjeecoaching.blogspot.com/2026/02/pakistan-studies-english-10th-past-year-paper-2025.html" },
      { year: 2024, url: "https://adamjeecoaching.blogspot.com/2024/12/pakistan-studies-english-10th-past-year-paper-2024.html" },
    ]
  }
];

async function testAll() {
  for (const s of TEST_SUBJECTS) {
    console.log(`\nTesting ${s.subject}:`);
    for (const u of s.urls) {
      try {
        const res = await axios.get(u.url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 8000
        });
        const html = res.data as string;
        const postBodyMatch = html.match(/<div class=["\x27]post-body[\s\S]*?<\/div>\s*<div class=["\x27]post-footer/i);
        const body = postBodyMatch ? postBodyMatch[0] : html;
        const imgs = [...body.matchAll(/<img[^>]+src=["\x27]([^"\x27]+)["\x27]/gi)].map(m => m[1]);
        const validImgs = [...new Set(imgs.map(img => img.replace(/\/s\d+(-[a-z0-9]+)?\//i, "/s1600/")))].filter(
          img => !img.includes("Fill In The Blanks") && !img.includes("button") && !img.includes("badge") && !img.includes("ads")
        );
        console.log(`  ✓ ${u.year}: Status ${res.status}, Images: ${validImgs.length}`);
      } catch (e: any) {
        console.log(`  ✗ ${u.year}: ${e.message}`);
      }
    }
  }
}

testAll();
