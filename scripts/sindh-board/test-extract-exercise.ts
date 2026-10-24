import axios from "axios";

export interface ExerciseImageResult {
  title: string;
  images: string[];
}

export async function extractImagesFromPost(postUrl: string): Promise<ExerciseImageResult> {
  const res = await axios.get(postUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    }
  });

  const html = res.data as string;

  // Extract Title
  let title = "";
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/<[^>]+>/g, "").replace("Adamjee Coaching:", "").trim();
  }

  // Extract high-res image URLs
  // Pattern: images in #bigimages or blogger.googleusercontent.com
  const imgMatches = html.matchAll(/src=["'](https:\/\/blogger\.googleusercontent\.com\/img\/b\/[a-zA-Z0-9_\-]+\/[^"']+)["']/gi);
  const rawImages: string[] = [];

  for (const match of imgMatches) {
    let url = match[1];
    // Filter out banners / generic buttons / thumbnails
    if (url.includes("Fill In The Blanks") || url.includes("s100/") || url.includes("w1200-h630")) {
      continue;
    }
    // Upgrade to high-res s1600
    url = url.replace(/\/s\d+\//, "/s1600/");
    if (!rawImages.includes(url)) {
      rawImages.push(url);
    }
  }

  return {
    title,
    images: rawImages
  };
}

async function test() {
  const sample = "https://adamjeecoaching.blogspot.com/2022/11/sets-and-functions-exercise-17-1-mathematics-10th.html";
  console.log(`Extracting from: ${sample}`);
  const result = await extractImagesFromPost(sample);
  console.log("Result:", result);
}

test();
