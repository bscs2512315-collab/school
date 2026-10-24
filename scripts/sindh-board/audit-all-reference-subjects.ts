import "dotenv/config";
import axios from "axios";
import { db } from "../../lib/db";

async function auditReferenceWebsite() {
  console.log("==========================================================================");
  console.log("🔍 COMPREHENSIVE AUDIT: REFERENCE WEBSITE vs DATABASE");
  console.log("==========================================================================\n");

  // 1. Fetch entire label cloud and all past paper posts from Adamjee Coaching
  console.log("📡 Fetching category labels and sitemap from Adamjee Coaching...");
  
  let allEntries: any[] = [];
  let startIndex = 1;
  const maxResults = 150;

  while (true) {
    const feedUrl = `https://adamjeecoaching.blogspot.com/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${maxResults}`;
    try {
      const res = await axios.get(feedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
        timeout: 10000,
      });
      const entries = res.data?.feed?.entry || [];
      if (entries.length === 0) break;
      allEntries.push(...entries);
      startIndex += maxResults;
      if (entries.length < maxResults) break;
    } catch (e: any) {
      console.warn(`Feed fetch stopped at ${startIndex}: ${e.message}`);
      break;
    }
  }

  console.log(`✅ Fetched ${allEntries.length} total posts from reference blog.\n`);

  // 2. Parse all past paper posts from the reference website
  interface DiscoveredPaper {
    grade: string;
    subject: string;
    year: number;
    title: string;
    url: string;
  }

  const blogPapers: DiscoveredPaper[] = [];
  const blogSubjectsByGrade: Record<string, Set<string>> = {
    IX: new Set(),
    X: new Set(),
    XI: new Set(),
    XII: new Set(),
  };

  for (const entry of allEntries) {
    const title = entry.title?.$t || "";
    const links = entry.link || [];
    const url = links.find((l: any) => l.rel === "alternate")?.href || "";
    const lowerTitle = title.toLowerCase();
    const lowerUrl = url.toLowerCase();

    const isPastPaper =
      lowerTitle.includes("past year paper") ||
      lowerTitle.includes("past paper") ||
      lowerTitle.includes("annual examination") ||
      lowerUrl.includes("past-year-paper") ||
      lowerUrl.includes("past-paper") ||
      lowerUrl.includes("annual-examination");

    if (!isPastPaper) continue;

    let grade = "Unknown";
    if (lowerTitle.includes("9th") || lowerTitle.includes("ix") || lowerUrl.includes("9th") || lowerUrl.includes("-ix-") || lowerUrl.includes("class-9")) {
      grade = "IX";
    } else if (lowerTitle.includes("10th") || lowerTitle.includes("matric") || lowerUrl.includes("10th") || lowerUrl.includes("-x-") || lowerUrl.includes("class-10")) {
      grade = "X";
    } else if (lowerTitle.includes("11th") || lowerTitle.includes("first year") || lowerTitle.includes("xi") || lowerUrl.includes("11th") || lowerUrl.includes("-xi-") || lowerUrl.includes("class-11")) {
      grade = "XI";
    } else if (lowerTitle.includes("12th") || lowerTitle.includes("second year") || lowerTitle.includes("xii") || lowerUrl.includes("12th") || lowerUrl.includes("-xii-") || lowerUrl.includes("class-12")) {
      grade = "XII";
    }

    let subject = "Other / Uncategorized";
    if (lowerTitle.includes("botany") || lowerUrl.includes("botany")) subject = "Botany";
    else if (lowerTitle.includes("zoology") || lowerUrl.includes("zoology")) subject = "Zoology";
    else if (lowerTitle.includes("physics") || lowerUrl.includes("physics")) subject = "Physics";
    else if (lowerTitle.includes("chemistry") || lowerUrl.includes("chemistry")) subject = "Chemistry";
    else if (lowerTitle.includes("biology") || lowerUrl.includes("biology")) subject = "Biology";
    else if (lowerTitle.includes("computer") || lowerUrl.includes("computer")) subject = "Computer Science";
    else if (lowerTitle.includes("mathematics") || lowerTitle.includes("maths") || lowerUrl.includes("mathematics") || lowerUrl.includes("maths")) subject = "Mathematics";
    else if (lowerTitle.includes("general math") || lowerUrl.includes("general-math")) subject = "General Mathematics";
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
    else if (lowerTitle.includes("commerce") || lowerUrl.includes("principles-of-commerce")) subject = "Principles of Commerce";
    else if (lowerTitle.includes("economics") || lowerUrl.includes("economics")) subject = "Principles of Economics";
    else if (lowerTitle.includes("civics") || lowerUrl.includes("civics")) subject = "Civics";
    else if (lowerTitle.includes("education") || lowerUrl.includes("education")) subject = "Education";
    else if (lowerTitle.includes("sociology") || lowerUrl.includes("sociology")) subject = "Sociology";

    const yearMatch = (title + " " + url).match(/(201[2-9]|202[0-6])/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

    if (grade !== "Unknown") {
      blogSubjectsByGrade[grade].add(subject);
      blogPapers.push({ grade, subject, year, title, url });
    }
  }

  // 3. Query our Database for Sindh Board and AKUEB
  const { rows: dbRows } = await db.query(`
    SELECT pp.class, pp.board, pp.subject, COUNT(DISTINCT pp.id) as papers, COUNT(q.id) as questions,
           MIN(pp.year) as min_year, MAX(pp.year) as max_year, COUNT(DISTINCT pp.year) as years_count
    FROM past_papers pp
    LEFT JOIN questions q ON q.past_paper_id = pp.id
    GROUP BY pp.class, pp.board, pp.subject
    ORDER BY pp.class, pp.board, pp.subject;
  `);

  console.log("==========================================================================");
  console.log("📊 COMPARISON PER GRADE (SINDH BOARD)");
  console.log("==========================================================================");

  const grades = ["IX", "X", "XI", "XII"];

  for (const g of grades) {
    console.log(`\n--------------------------------------------------------------------------`);
    console.log(`🎓 GRADE ${g} - SUBJECT AUDIT`);
    console.log(`--------------------------------------------------------------------------`);

    const blogSubjs = Array.from(blogSubjectsByGrade[g] || []).sort();
    const dbSubjsForGrade = dbRows.filter((r) => r.class === g && r.board === "Sindh Board");
    const dbSubjsSet = new Set(dbSubjsForGrade.map((r) => r.subject));

    const auditTable = blogSubjs.map((subj) => {
      const dbRecord = dbSubjsForGrade.find((r) => r.subject === subj);
      const blogPapersForSubj = blogPapers.filter((p) => p.grade === g && p.subject === subj);
      const blogYears = Array.from(new Set(blogPapersForSubj.map((p) => p.year).filter((y) => y > 0))).sort();

      return {
        Subject: subj,
        "Available on Blog": `${blogPapersForSubj.length} posts (${blogYears.join(", ") || "N/A"})`,
        "Imported in DB": dbRecord ? `✅ ${dbRecord.papers} papers (${dbRecord.questions} Qs)` : "❌ Not in DB",
        Status: dbRecord ? "IMPORTED" : "AVAILABLE ON BLOG ONLY",
      };
    });

    console.table(auditTable);

    // Also check if DB has extra subjects not in blog scan
    const extraInDb = dbSubjsForGrade.filter((r) => !blogSubjs.includes(r.subject));
    if (extraInDb.length > 0) {
      console.log(`ℹ️ Additional subjects in DB for Grade ${g}: ${extraInDb.map((e) => e.subject).join(", ")}`);
    }
  }

  console.log("\n==========================================================================");
  console.log("📊 ALL SUBJECTS IN DATABASE (SINDH BOARD + AKUEB)");
  console.log("==========================================================================");
  console.table(
    dbRows.map((r) => ({
      Class: r.class,
      Board: r.board,
      Subject: r.subject,
      Papers: Number(r.papers),
      Questions: Number(r.questions),
      "Years Range": `${r.min_year}–${r.max_year} (${r.years_count} yrs)`,
    }))
  );
}

auditReferenceWebsite()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
