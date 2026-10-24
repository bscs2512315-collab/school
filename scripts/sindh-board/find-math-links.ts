import axios from "axios";

async function fetchMainMathIndex() {
  const urlsToTry = [
    "https://adamjeecoaching.blogspot.com/2022/11/sets-and-functions-exercise-17-1-mathematics-10th.html"
  ];

  for (const url of urlsToTry) {
    try {
      console.log(`Trying ${url}...`);
      const res = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        }
      });
      const html = res.data as string;
      const links: { title: string; href: string }[] = [];
      const regex = /<a[^>]+href=["'](https:\/\/[^"']+\.html)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const href = match[1];
        const text = match[2].replace(/<[^>]+>/g, "").trim();
        if (text && (text.includes("Exercise") || text.includes("Unit") || text.includes("Chapter"))) {
          links.push({ title: text, href });
        }
      }
      console.log(`Found ${links.length} matching exercise links in ${url}`);
    } catch (e: any) {
      console.log(`Failed for ${url}: ${e.message}`);
    }
  }
}

fetchMainMathIndex();
