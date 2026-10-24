import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory audio buffer cache for instant zero-latency repeats
const audioCache = new Map<string, { buffer: Buffer; contentType: string }>();
let cachedAudioBytes = 0;
const MAX_CACHED_AUDIO_BYTES = 32 * 1024 * 1024;

// Ultra-fast in-memory rate limiting (zero DB queries, zero latency)
const ttsRateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkTtsRateLimit(ip: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = ttsRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ttsRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count++;
  return true;
}

function cleanTextForSpeech(text: string): string {
  if (!text) return "";

  return (
    text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code ticks
      .replace(/`([^`]+)`/g, "$1")
      // Remove URLs
      .replace(/https?:\/\/\S+/g, "")
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, "")
      // Format fractions like 8/10 to 8 out of 10
      .replace(/(\d+)\/(\d+)/g, "$1 out of $2")
      // Remove markdown bold and italics: **text**, *text*, __text__, _text_
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // Convert chemical/math arrows -> or => or -->
      .replace(/-->|->|=>/g, " yields ")
      // Convert common symbols for clear pronunciation
      .replace(/\+/g, " plus ")
      .replace(/%/g, " percent ")
      .replace(/°C/g, " degrees Celsius ")
      .replace(/°F/g, " degrees Fahrenheit ")
      .replace(/&/g, " and ")
      // Remove markdown bullet points (- or * or + at line start)
      .replace(/^\s*[-*+]\s+/gm, "")
      // Remove markdown blockquotes
      .replace(/^\s*>\s+/gm, "")
      // Remove citation tags like [1] or [Note]
      .replace(/\[\d+\]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove horizontal dividers
      .replace(/[-=_]{3,}/g, "")
      // Remove emojis and decorative Unicode symbols that distort speech synthesis
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      // Normalize pauses and line breaks
      .replace(/\n+/g, ". ")
      .replace(/\.+/g, ".")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function getCacheKey(text: string, voice: string, speed: number): string {
  return createHash("sha256").update(`${voice}_${speed}_${text}`).digest("hex");
}

function containsUrduScript(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function resolveVoice(text: string, lang: string, gender: string = "female", voiceOverride?: string): string {
  if (voiceOverride) {
    const v = voiceOverride.toLowerCase();
    if (v.includes("neerja")) return "en-IN-NeerjaExpressiveNeural";
    if (v.includes("uzma")) return "ur-PK-UzmaNeural";
    if (v.includes("asad")) return "ur-PK-AsadNeural";
    if (v.includes("gul")) return "ur-IN-GulNeural";
    if (v.includes("ava")) return "en-US-AvaMultilingualNeural";
    if (v.includes("jenny")) return "en-US-JennyNeural";
    if (v.includes("emma")) return "en-US-EmmaMultilingualNeural";
    if (v.includes("aria")) return "en-US-AriaNeural";
    if (v.includes("prabhat")) return "en-IN-PrabhatNeural";
    if (v.includes("guy")) return "en-US-GuyNeural";
    if (v.includes("chris") || v.includes("quaid") || v.includes("syed")) return "en-US-ChristopherNeural";
    if (v.includes("sonia")) return "en-GB-SoniaNeural";
    if (voiceOverride.startsWith("en-") || voiceOverride.startsWith("ur-")) return voiceOverride;
  }

  if (containsUrduScript(text) || lang === "ur" || lang === "urdu") {
    return gender === "male" ? "ur-PK-AsadNeural" : "ur-PK-UzmaNeural";
  }

  // Default: NeerjaExpressive - State of the art Pakistani/South Asian English + Urdu bilingual accent
  return "en-IN-NeerjaExpressiveNeural";
}

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Range",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

async function synthesizeSpeech(rawText: string, voice: string, speed: number): Promise<Buffer> {
  const text = cleanTextForSpeech(rawText).slice(0, 2500);
  const cacheKey = getCacheKey(text, voice, speed);
  const cached = audioCache.get(cacheKey);
  if (cached) {
    return cached.buffer;
  }

  const tts = new MsEdgeTTS();
  // 96kbps 24kHz delivers studio quality, removing robotic compression artifacts
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const ratePercent = Math.round((speed - 1.0) * 100);
  const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;

  const { audioStream } = tts.toStream(text, { rate: rateStr });

  const chunks: Buffer[] = [];
  let receivedBytes = 0;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      tts.close();
      reject(new Error("TTS synthesis timed out after 12s"));
    }, 12000);

    audioStream.on("data", (chunk: Buffer) => {
      receivedBytes += chunk.length;
      if (receivedBytes > 4 * 1024 * 1024) {
        tts.close();
        reject(new Error("Audio response is too large"));
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    audioStream.on("end", () => {
      clearTimeout(timer);
      tts.close();
      resolve();
    });
    audioStream.on("error", (err) => {
      clearTimeout(timer);
      tts.close();
      reject(err);
    });
  });

  const audioBuffer = Buffer.concat(chunks);
  if (audioBuffer.length === 0) {
    throw new Error("Empty audio buffer generated");
  }

  while (audioCache.size >= 300 || cachedAudioBytes + audioBuffer.length > MAX_CACHED_AUDIO_BYTES) {
    const firstKey = audioCache.keys().next().value;
    if (!firstKey) break;
    cachedAudioBytes -= audioCache.get(firstKey)?.buffer.length ?? 0;
    audioCache.delete(firstKey);
  }
  audioCache.set(cacheKey, { buffer: audioBuffer, contentType: "audio/mpeg" });
  cachedAudioBytes += audioBuffer.length;

  return audioBuffer;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "client";
    if (!checkTtsRateLimit(clientIp)) {
      return NextResponse.json({ error: "Too many TTS requests. Please wait a moment." }, { status: 429, headers: CORS_HEADERS });
    }

    const body = await req.json();
    const { text, lang = "en", gender = "female", voice, speed = 1.0 } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400, headers: CORS_HEADERS });
    }

    const selectedVoice = resolveVoice(text, lang, gender, voice);
    const audioBuffer = await synthesizeSpeech(text, selectedVoice, speed);

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("TTS POST Error:", error);
    const message = error instanceof Error ? error.message : "Failed to synthesize speech";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function GET(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "client";
  if (!checkTtsRateLimit(clientIp)) {
    return NextResponse.json({ error: "Too many TTS requests. Please wait a moment." }, { status: 429, headers: CORS_HEADERS });
  }

  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "";
  const lang = searchParams.get("lang") || "en";
  const gender = searchParams.get("gender") || "female";
  const voice = searchParams.get("voice") || undefined;
  const speed = parseFloat(searchParams.get("speed") || "1.0");

  if (!text.trim()) {
    return NextResponse.json({ error: "Text query parameter is required" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const selectedVoice = resolveVoice(text, lang, gender, voice);
    const audioBuffer = await synthesizeSpeech(text, selectedVoice, speed);

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("TTS GET Error:", error);
    const message = error instanceof Error ? error.message : "Failed to synthesize speech";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
