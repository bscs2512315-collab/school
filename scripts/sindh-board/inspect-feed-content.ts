import axios from "axios";

async function inspectFeedContent() {
  const feedUrl = "https://adamjeecoaching.blogspot.com/feeds/posts/default/-/Mathematics%20Notes%2010th?alt=json&max-results=5";
  const res = await axios.get(feedUrl);
  const entries = res.data.feed.entry || [];

  for (const entry of entries) {
    const title = entry.title.$t;
    const content = entry.content?.$t || "";
    
    // Extract image URLs
    const imgMatches = content.matchAll(/src=["'](https:\/\/blogger\.googleusercontent\.com\/img\/b\/[a-zA-Z0-9_\-]+\/[^"']+)["']/gi);
    const images: string[] = [];
    for (const m of imgMatches) {
      let url = m[1];
      if (!url.includes("Fill In The Blanks") && !url.includes("s100/") && !url.includes("w1200-h630")) {
        url = url.replace(/\/s\d+\//, "/s1600/");
        if (!images.includes(url)) images.push(url);
      }
    }

    console.log(`\n📘 Title: ${title}`);
    console.log(`📸 Extracted ${images.length} images:`);
    images.forEach((img, i) => console.log(`   Page ${i + 1}: ${img}`));
  }
}

inspectFeedContent();
