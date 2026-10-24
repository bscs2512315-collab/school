import axios from "axios";
import fs from "fs";
import path from "path";

interface PaperLink {
  grade: "IX" | "X" | "XI" | "XII" | "Unknown";
  subject: string;
  year: number;
  url: string;
  title: string;
}

async function discoverAllPapers() {
  console.log("🚀 Scanning entire Adamjee Coaching Blog for Past Papers (IX, X, XI, XII)...");

  let startIndex = 1;
  const maxResults = 150;
  let totalProcessed = 0;
  const allPapers: PaperLink[] = [];
  const seenUrls = new Set<string>();

  while (true) {
    const feedUrl = `https://adamjeecoaching.blogspot.com/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${maxResults}`;
    console.log(`📡 Fetching feed page: startIndex=${startIndex}...`);

    let res;
    try {
      res = await axios.get(feedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        timeout: 15000,
      });
    } catch (e: any) {
      console.warn(`⚠️ Feed fetch failed at ${startIndex}: ${e.message}`);
      break;
    }

    const entries = res.data?.feed?.entry || [];
    if (entries.length === 0) {
      console.log("🏁 Reached end of feed.");
      break;
    }

    totalProcessed += entries.length;

    for (const entry of entries) {
      const title = entry.title?.$t || "";
      const links = entry.link || [];
      const altLink = links.find((l: any) => l.rel === "alternate")?.href || "";
      if (!altLink || seenUrls.has(altLink)) continue;

      const lowerTitle = title.toLowerCase();
      const lowerUrl = altLink.toLowerCase();

      // Check if it's a past paper
      const isPastPaper =
        lowerTitle.includes("past year paper") ||
        lowerTitle.includes("past paper") ||
        lowerTitle.includes("annual examination") ||
        lowerUrl.includes("past-year-paper") ||
        lowerUrl.includes("past-paper") ||
        lowerUrl.includes("annual-examination");

      if (!isPastPaper) continue;

      // Determine Grade
      let grade: "IX" | "X" | "XI" | "XII" | "Unknown" = "Unknown";
      if (
        lowerTitle.includes("9th") ||
        lowerTitle.includes("ix") ||
        lowerTitle.includes("class 9") ||
        lowerUrl.includes("9th") ||
        lowerUrl.includes("-ix-") ||
        lowerUrl.includes("class-9")
      ) {
        grade = "IX";
      } else if (
        lowerTitle.includes("10th") ||
        lowerTitle.includes("matric") ||
        lowerTitle.includes("class 10") ||
        lowerUrl.includes("10th") ||
        lowerUrl.includes("-x-") ||
        lowerUrl.includes("class-10")
      ) {
        grade = "X";
      } else if (
        lowerTitle.includes("11th") ||
        lowerTitle.includes("first year") ||
        lowerTitle.includes("xi") ||
        lowerTitle.includes("class 11") ||
        lowerUrl.includes("11th") ||
        lowerUrl.includes("-xi-") ||
        lowerUrl.includes("class-11")
      ) {
        grade = "XI";
      } else if (
        lowerTitle.includes("12th") ||
        lowerTitle.includes("second year") ||
        lowerTitle.includes("xii") ||
        lowerTitle.includes("class 12") ||
        lowerUrl.includes("12th") ||
        lowerUrl.includes("-xii-") ||
        lowerUrl.includes("class-12")
      ) {
        grade = "XII";
      }

      // Determine Subject
      let subject = "Unknown";
      if (lowerTitle.includes("botany") || lowerUrl.includes("botany")) subject = "Botany";
      else if (lowerTitle.includes("zoology") || lowerUrl.includes("zoology")) subject = "Zoology";
      else if (lowerTitle.includes("physics") || lowerUrl.includes("physics")) subject = "Physics";
      else if (lowerTitle.includes("chemistry") || lowerUrl.includes("chemistry")) subject = "Chemistry";
      else if (lowerTitle.includes("biology") || lowerUrl.includes("biology")) subject = "Biology";
      else if (lowerTitle.includes("computer") || lowerUrl.includes("computer")) subject = "Computer Science";
      else if (lowerTitle.includes("mathematics") || lowerTitle.includes("maths") || lowerUrl.includes("mathematics") || lowerUrl.includes("maths")) subject = "Mathematics";
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
      else if (lowerTitle.includes("economics") || lowerUrl.includes("economics")) subject = "Principles of Economics";

      const yearMatch = (title + " " + altLink).match(/(201[2-9]|202[0-6])/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

      if (year > 0 && grade !== "Unknown" && subject !== "Unknown") {
        seenUrls.add(altLink);
        allPapers.push({
          grade,
          subject,
          year,
          url: altLink,
          title,
        });
      }
    }

    startIndex += maxResults;
    if (entries.length < maxResults) break;
  }

  console.log(`\n🎉 Processed ${totalProcessed} total blog entries.`);
  console.log(`Found ${allPapers.length} valid Past Papers across grades.`);

  const ixPapers = allPapers.filter((p) => p.grade === "IX");
  const xiiPapers = allPapers.filter((p) => p.grade === "XII");

  console.log(`\n================== CLASS IX PAPERS (${ixPapers.length}) ==================`);
  console.table(ixPapers.map((p) => ({ Subject: p.subject, Year: p.year, URL: p.url })));

  console.log(`\n================== CLASS XII PAPERS (${xiiPapers.length}) ==================`);
  console.table(xiiPapers.map((p) => ({ Subject: p.subject, Year: p.year, URL: p.url })));

  fs.writeFileSync(
    path.join(__dirname, "discovered_papers.json"),
    JSON.stringify({ ix: ixPapers, xii: xiiPapers, all: allPapers }, null, 2)
  );
  console.log("💾 Saved to discovered_papers.json");
}

discoverAllPapers().catch(console.error);
