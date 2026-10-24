import assert from "node:assert/strict";
import { test } from "node:test";
import { convertMathToHTML } from "../lib/utils/math-notation";
import { downloadTrustedFile } from "../lib/security/download";
import { readFormDataLimited } from "../lib/security/form-data";
import { fetchImageAsBase64 } from "../lib/ai/vision-image";
import sharp from "sharp";

test("math rendering strips active SVG and malformed image attributes", () => {
  const svg = convertMathToHTML('<svg onload="globalThis.auditMarker=1"><foreignObject>bad</foreignObject></svg>');
  assert.doesNotMatch(svg, /onload|foreignObject/i);
  const malformed = convertMathToHTML('<img/src="x"/onerror="globalThis.auditMarker=1">');
  assert.doesNotMatch(malformed, /<img/i);
  assert.match(malformed, /&lt;img/i);
  const formula = convertMathToHTML("√(x+1)");
  assert.match(formula, /square-radical/);
  assert.match(formula, /viewBox=/);
});

test("trusted downloader refuses a redirect outside the approved host", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: "http://127.0.0.1/private" } });
  };
  try {
    await assert.rejects(
      downloadTrustedFile("https://files.example.test/a.pdf", {
        allowedHosts: ["files.example.test"], maxBytes: 10, timeoutMs: 1000, accept: "application/pdf",
      }),
      /approved HTTPS destination/,
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
  }
});

test("trusted downloader stops at the byte limit while streaming", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(11)); controller.close(); },
  }));
  try {
    await assert.rejects(
      downloadTrustedFile("https://files.example.test/a.pdf", {
        allowedHosts: ["files.example.test"], maxBytes: 10, timeoutMs: 1000, accept: "application/pdf",
      }),
      /maximum size/,
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("multipart parsing enforces the limit before accepting a file", async () => {
  const body = new FormData();
  body.set("selfie", new File([new Uint8Array(100)], "photo.jpg", { type: "image/jpeg" }));
  const request = new Request("https://app.example.test/upload", { method: "POST", body });
  await assert.rejects(readFormDataLimited(request, 50), /Upload is too large/);
});

test("vision attachments require a decodable image from the application's storage path", async () => {
  const originalFetch = globalThis.fetch;
  const originalCloud = process.env.CLOUDINARY_CLOUD_NAME;
  process.env.CLOUDINARY_CLOUD_NAME = "example-cloud";
  let body = Buffer.from("not an image");
  globalThis.fetch = async () => new Response(body);
  const approvedUrl = "https://res.cloudinary.com/example-cloud/image/upload/photo.png";
  try {
    await assert.rejects(fetchImageAsBase64("http://127.0.0.1/image.png"), /storage account/);
    await assert.rejects(fetchImageAsBase64(approvedUrl), /valid image/);
    body = await sharp({ create: { width: 1, height: 1, channels: 3, background: "white" } }).png().toBuffer();
    const image = await fetchImageAsBase64(approvedUrl);
    assert.equal(image.mimeType, "image/png");
    assert.equal(Buffer.from(image.base64, "base64").equals(body), true);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCloud === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
    else process.env.CLOUDINARY_CLOUD_NAME = originalCloud;
  }
});
