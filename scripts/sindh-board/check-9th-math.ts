import axios from "axios";

async function check9thFeed() {
  const feedUrl = "https://adamjeecoaching.blogspot.com/feeds/posts/default/-/Mathematics%20Notes%209th?alt=json&max-results=50";
  try {
    const res = await axios.get(feedUrl);
    const entries = res.data.feed.entry || [];
    console.log(`Found ${entries.length} posts for Class 9th Mathematics`);
    entries.slice(0, 5).forEach((e: any) => console.log(`- ${e.title.$t}`));
  } catch (e: any) {
    console.log(`Failed: ${e.message}`);
  }
}

check9thFeed();
