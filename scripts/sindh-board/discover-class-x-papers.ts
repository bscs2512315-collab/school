import axios from "axios";

async function discoverClass10PastPapers() {
  const seedUrls = [
    "https://adamjeecoaching.blogspot.com/p/past-papers.html",
    "https://adamjeecoaching.blogspot.com/p/10th.html",
    "https://adamjeecoaching.blogspot.com/search/label/Physics%20Past%20Papers%2010th?max-results=50",
    "https://adamjeecoaching.blogspot.com/search/label/Chemistry%20Past%20Papers%2010th?max-results=50",
    "https://adamjeecoaching.blogspot.com/search/label/Biology%20Past%20Papers%2010th?max-results=50",
    "https://adamjeecoaching.blogspot.com/search/label/Computer%20Past%20Papers%2010th?max-results=50",
    "https://adamjeecoaching.blogspot.com/search/label/English%20Past%20Papers%2010th?max-results=50",
    "https://adamjeecoaching.blogspot.com/search/label/Pakistan%20Studies%20Past%20Papers%2010th?max-results=50",
    "https://adamjeecoaching.blogspot.com/search/label/Islamiat%20Past%20Papers%2010th?max-results=50",
    "https://adamjeecoaching.blogspot.com/search/label/Urdu%20Past%20Papers%2010th?max-results=50",
    "https://adamjeecoaching.blogspot.com/search/label/Sindhi%20Past%20Papers%2010th?max-results=50",
  ];

  const foundLinks: { subjectHint: string; yearHint: number | null; url: string; title: string }[] = [];
  const seenUrls = new Set<string>();

  for (const seed of seedUrls) {
    try {
      console.log(`Fetching seed: ${seed}`);
      const res = await axios.get(seed, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        timeout: 10000
      });
      const html = res.data as string;
      const regex = /<a[^>]+href=["'](https:\/\/adamjeecoaching\.blogspot\.com\/[0-9]{4}\/[0-9]{2}\/[^"']+\.html)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const href = match[1];
        const text = match[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (seenUrls.has(href)) continue;

        const lowerHref = href.toLowerCase();
        const lowerText = text.toLowerCase();

        const is10th = lowerHref.includes("10th") || lowerHref.includes("-x-") || lowerHref.includes("class-10") || lowerText.includes("10th") || lowerText.includes("class 10") || lowerText.includes(" x ") || lowerText.includes("class x");
        const isPastPaper = lowerHref.includes("past-year-paper") || lowerHref.includes("past-paper") || lowerText.includes("past year paper") || lowerText.includes("past paper") || lowerText.includes("annual examination") || lowerHref.includes("annual-examination");

        if (is10th && isPastPaper) {
          seenUrls.add(href);

          let subjectHint = "Unknown";
          if (lowerHref.includes("physics") || lowerText.includes("physics")) subjectHint = "Physics";
          else if (lowerHref.includes("chemistry") || lowerText.includes("chemistry")) subjectHint = "Chemistry";
          else if (lowerHref.includes("biology") || lowerText.includes("biology")) subjectHint = "Biology";
          else if (lowerHref.includes("computer") || lowerText.includes("computer")) subjectHint = "Computer Science";
          else if (lowerHref.includes("mathematics") || lowerHref.includes("maths") || lowerText.includes("mathematics")) subjectHint = "Mathematics";
          else if (lowerHref.includes("english") || lowerText.includes("english")) subjectHint = "English";
          else if (lowerHref.includes("pakistan-studies") || lowerHref.includes("pak-studies") || lowerText.includes("pakistan studies") || lowerText.includes("pak studies")) subjectHint = "Pakistan Studies";
          else if (lowerHref.includes("islamiat") || lowerHref.includes("islamic") || lowerText.includes("islamiat") || lowerText.includes("islamiyat")) subjectHint = "Islamiat";
          else if (lowerHref.includes("urdu") || lowerText.includes("urdu")) subjectHint = "Urdu";
          else if (lowerHref.includes("sindhi") || lowerText.includes("sindhi")) subjectHint = "Sindhi";

          const yearMatch = href.match(/(201[4-9]|202[0-6])/);
          const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

          foundLinks.push({
            subjectHint,
            yearHint: year,
            url: href,
            title: text
          });
        }
      }
    } catch (e: any) {
      console.log(`Failed seed ${seed}: ${e.message}`);
    }
  }

  console.log(`\nFound ${foundLinks.length} Class 10 links:`);
  console.table(foundLinks);
}

discoverClass10PastPapers();
