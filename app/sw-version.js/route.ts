import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const buildId = process.env.NEXT_PUBLIC_APP_BUILD_ID || "development";
  const source = `self.__EXBOARD_BUILD_ID__ = ${JSON.stringify(buildId)};\n`;

  return new NextResponse(source, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
