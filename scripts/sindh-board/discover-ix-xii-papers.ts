import axios from "axios";

async function discoverPapers(grade: string, labels: string[]) {
  console.log(`\n==========================================================================`);
  console.log(`🔍 DISCOVERING PAST PAPERS FOR CLASS ${grade.toUpperCase()}`);
  console.log(`==========================================================================\n`);

  const foundLinks: { grade: string; subject: string; year: number | null; url: string; title: string }[] = [];
  const seenUrls = new Set<string>();

  for (const label of labels) {
    // We can also query Blogger feed directly: /feeds/posts/default/-/<label>?alt=json&max-results=150
    const feedUrl = `https://adamjeecoaching.blogspot.com/feeds/posts/default/-/${encodeURIComponent(label)}?alt=json&max-results=150`;
    try {
      console.log(`📡 Querying feed for label: "${label}"...`);
      const res = await axios.get(feedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        timeout: 10000,
      });

      const entries = res.data?.feed?.entry || [];
      console.log(`   Found ${entries.length} entries in feed.`);

      for (const entry of entries) {
        const title = entry.title?.$t || "";
        const links = entry.link || [];
        const altLink = links.find((l: any) => l.rel === "alternate")?.href || "";
        if (!altLink || seenUrls.has(altLink)) continue;

        const lowerTitle = title.toLowerCase();
        const lowerUrl = altLink.toLowerCase();

        // Check if it is a past paper
        const isPastPaper =
          lowerTitle.includes("past year paper") ||
          lowerTitle.includes("past paper") ||
          lowerTitle.includes("annual examination") ||
          lowerUrl.includes("past-year-paper") ||
          lowerUrl.includes("past-paper") ||
          lowerUrl.includes("annual-examination");

        if (!isPastPaper) continue;

        seenUrls.add(altLink);

        let subject = "Unknown";
        if (lowerTitle.includes("physics") || lowerUrl.includes("physics")) subject = "Physics";
        else if (lowerTitle.includes("chemistry") || lowerUrl.includes("chemistry")) subject = "Chemistry";
        else if (lowerTitle.includes("biology") || lowerUrl.includes("biology")) subject = "Biology";
        else if (lowerTitle.includes("botany") || lowerUrl.includes("botany")) subject = "Botany";
        else if (lowerTitle.includes("zoology") || lowerUrl.includes("zoology")) subject = "Zoology";
        else if (lowerTitle.includes("computer") || lowerUrl.includes("computer")) subject = "Computer Science";
        else if (lowerTitle.includes("math") || lowerUrl.includes("math")) subject = "Mathematics";
        else if (lowerTitle.includes("english") || lowerUrl.includes("english")) subject = "English";
        else if (lowerTitle.includes("pakistan studies") || lowerTitle.includes("pak studies") || lowerUrl.includes("pakistan-studies") || lowerUrl.includes("pak-studies")) subject = "Pakistan Studies";
        else if (lowerTitle.includes("islamiat") || lowerTitle.includes("islamic") || lowerUrl.includes("islamiat") || lowerUrl.includes("islamiyat")) subject = "Islamiat";
        else if (lowerTitle.includes("urdu") || lowerUrl.includes("urdu")) subject = "Urdu";
        else if (lowerTitle.includes("sindhi") || lowerUrl.includes("sindhi")) subject = "Sindhi";
        else if (lowerTitle.includes("general science") || lowerUrl.includes("general-science")) subject = "General Science";
        else if (lowerTitle.includes("accounting") || lowerUrl.includes("accounting")) subject = "Principles of Accounting";
        else if (lowerTitle.includes("commercial geography") || lowerUrl.includes("commercial-geography")) subject = "Commercial Geography";
        else if (lowerTitle.includes("banking") || lowerUrl.includes("banking")) subject = "Banking";
        else if (lowerTitle.includes("statistics") || lowerUrl.includes("statistics")) subject = "Business Statistics";

        const yearMatch = (title + " " + altLink).match(/(201[4-9]|202[0-6])/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

        foundLinks.push({
          grade,
          subject,
          year,
          url: altLink,
          title,
        });
      }
    } catch (e: any) {
      console.warn(`   ⚠️ Feed query failed for "${label}": ${e.message}`);
    }
  }

  // Also query general past paper pages
  const seedPages = [
    grade === "IX" ? "https://adamjeecoaching.blogspot.com/p/9th.html" : "https://adamjeecoaching.blogspot.com/p/12th.html",
    "https://adamjeecoaching.blogspot.com/p/past-papers.html",
  ];

  for (const pageUrl of seedPages) {
    try {
      const res = await axios.get(pageUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
        timeout: 10000,
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

        const isTargetGrade =
          grade === "IX"
            ? lowerHref.includes("9th") || lowerHref.includes("-ix-") || lowerHref.includes("class-9") || lowerText.includes("9th") || lowerText.includes("class 9") || lowerText.includes(" ix ") || lowerText.includes("class ix")
            : lowerHref.includes("12th") || lowerHref.includes("-xii-") || lowerHref.includes("class-12") || lowerText.includes("12th") || lowerText.includes("class 12") || lowerText.includes(" xii ") || lowerText.includes("class xii");

        const isPastPaper =
          lowerHref.includes("past-year-paper") ||
          lowerHref.includes("past-paper") ||
          lowerText.includes("past year paper") ||
          lowerText.includes("past paper") ||
          lowerText.includes("annual examination") ||
          lowerHref.includes("annual-examination");

        if (isTargetGrade && isPastPaper) {
          seenUrls.add(href);

          let subject = "Unknown";
          if (lowerHref.includes("physics") || lowerText.includes("physics")) subject = "Physics";
          else if (lowerHref.includes("chemistry") || lowerText.includes("chemistry")) subject = "Chemistry";
          else if (lowerHref.includes("biology") || lowerText.includes("biology")) subject = "Biology";
          else if (lowerHref.includes("botany") || lowerText.includes("botany")) subject = "Botany";
          else if (lowerHref.includes("zoology") || lowerText.includes("zoology")) subject = "Zoology";
          else if (lowerHref.includes("computer") || lowerText.includes("computer")) subject = "Computer Science";
          else if (lowerHref.includes("math") || lowerText.includes("math")) subject = "Mathematics";
          else if (lowerHref.includes("english") || lowerText.includes("english")) subject = "English";
          else if (lowerHref.includes("pakistan-studies") || lowerHref.includes("pak-studies") || lowerText.includes("pakistan studies") || lowerText.includes("pak studies")) subject = "Pakistan Studies";
          else if (lowerHref.includes("islamiat") || lowerHref.includes("islamic") || lowerText.includes("islamiat") || lowerText.includes("islamiyat")) subject = "Islamiat";
          else if (lowerHref.includes("urdu") || lowerText.includes("urdu")) subject = "Urdu";
          else if (lowerHref.includes("sindhi") || lowerText.includes("sindhi")) subject = "Sindhi";
          else if (lowerHref.includes("accounting") || lowerText.includes("accounting")) subject = "Principles of Accounting";
          else if (lowerHref.includes("commercial-geography") || lowerText.includes("commercial geography")) subject = "Commercial Geography";
          else if (lowerHref.includes("banking") || lowerText.includes("banking")) subject = "Banking";
          else if (lowerHref.includes("statistics") || lowerText.includes("statistics")) subject = "Business Statistics";

          const yearMatch = href.match(/(201[4-9]|202[0-6])/);
          const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

          foundLinks.push({
            grade,
            subject,
            year,
            url: href,
            title: text,
          });
        }
      }
    } catch (e: any) {
      console.warn(`   ⚠️ Page query failed for "${pageUrl}": ${e.message}`);
    }
  }

  console.log(`\n🎉 Found ${foundLinks.length} Past Paper Links for Class ${grade}:`);
  console.table(
    foundLinks.map((l) => ({
      Subject: l.subject,
      Year: l.year,
      Title: l.title.length > 50 ? l.title.slice(0, 47) + "..." : l.title,
      URL: l.url,
    }))
  );

  return foundLinks;
}

async function run() {
  const ixLabels = [
    "Physics Past Papers 9th",
    "Chemistry Past Papers 9th",
    "Biology Past Papers 9th",
    "Computer Past Papers 9th",
    "Mathematics Past Papers 9th",
    "English Past Papers 9th",
    "Pakistan Studies Past Papers 9th",
    "Islamiat Past Papers 9th",
    "Urdu Past Papers 9th",
    "Sindhi Past Papers 9th",
    "General Science Past Papers 9th",
  ];

  const xiiLabels = [
    "Physics Past Papers 12th",
    "Chemistry Past Papers 12th",
    "Botany Past Papers 12th",
    "Zoology Past Papers 12th",
    "Computer Past Papers 12th",
    "Mathematics Past Papers 12th",
    "English Past Papers 12th",
    "Pakistan Studies Past Papers 12th",
    "Urdu Past Papers 12th",
    "Accounting Past Papers 12th",
    "Commercial Geography Past Papers 12th",
    "Banking Past Papers 12th",
    "Statistics Past Papers 12th",
  ];

  const ixPapers = await discoverPapers("IX", ixLabels);
  const xiiPapers = await discoverPapers("XII", xiiLabels);

  console.log(`\n================== SUMMARY ==================`);
  console.log(`Class IX Past Papers found: ${ixPapers.length}`);
  console.log(`Class XII Past Papers found: ${xiiPapers.length}`);
}

run();
