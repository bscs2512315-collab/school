import axios from "axios";

async function fetchBloggerFeed() {
  const feedUrl = "https://adamjeecoaching.blogspot.com/feeds/posts/default/-/Mathematics%20Notes%2010th?alt=json&max-results=150";
  console.log(`Fetching feed: ${feedUrl}`);
  const res = await axios.get(feedUrl);
  const feed = res.data.feed;
  console.log(`Total posts in feed: ${feed.entry ? feed.entry.length : 0}`);

  if (feed.entry) {
    feed.entry.forEach((item: any, idx: number) => {
      const title = item.title.$t;
      const htmlLink = item.link.find((l: any) => l.rel === "alternate")?.href;
      console.log(`${idx + 1}. [${title}] -> ${htmlLink}`);
    });
  }
}

fetchBloggerFeed();
