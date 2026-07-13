import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
