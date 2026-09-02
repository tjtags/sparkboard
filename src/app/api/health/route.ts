import { NextResponse } from "next/server";
import { storeKind } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    ok: true,
    store: storeKind(),
    vercel: Boolean(process.env.VERCEL),
  });
}
