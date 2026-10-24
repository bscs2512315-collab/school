import axios from "axios";

async function discoverAllClass10MathLinks() {
  const seedUrls = [
    "https://adamjeecoaching.blogspot.com/2022/11/sets-and-functions-exercise-17-1-mathematics-10th.html",
    "https://adamjeecoaching.blogspot.com/search/label/Mathematics%20Notes%2010th?max-results=50"
  ];

  const foundLinks = new Map<string, string>(); // url -> text

  for (const seed of seedUrls) {
    try {
      console.log(`Fetching seed: ${seed}`);
      const res = await axios.get(seed, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        }
      });
      const html = res.data as string;
      const regex = /<a[^>]+href=["'](https:\/\/adamjeecoaching\.blogspot\.com\/[0-9]{4}\/[0-9]{2}\/[^"']+\.html)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const url = match[1];
        const text = match[2].replace(/<[^>]+>/g, "").trim();
        if (
          url.includes("exercise") || 
          url.includes("sets-and-functions") || 
          url.includes("variations") || 
          url.includes("matrices") ||
          url.includes("theory-of-quadratic") ||
          url.includes("partial-fractions") ||
          url.includes("basic-statistics") ||
          url.includes("trigonometry") ||
          url.includes("pythagoras") ||
          url.includes("ratio-and-proportion") ||
          url.includes("circle")
        ) {
          if (!foundLinks.has(url)) {
            foundLinks.set(url, text);
          }
        }
      }
    } catch (e: any) {
      console.log(`Failed seed: ${e.message}`);
    }
  }

  console.log(`Total unique links found: ${foundLinks.size}`);
  for (const [url, text] of foundLinks.entries()) {
    console.log(`- [${text}](${url})`);
  }
}

discoverAllClass10MathLinks();
