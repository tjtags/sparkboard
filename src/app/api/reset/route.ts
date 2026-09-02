import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { resetState } from "@/lib/store";

function safeEq(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(req: Request) {
  const secret = process.env.SPARKBOARD_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "reset disabled", code: "forbidden" }, { status: 401 });
  }
  const got = req.headers.get("x-sparkboard-admin") ?? "";
  if (!safeEq(secret, got)) {
    return NextResponse.json({ error: "forbidden", code: "forbidden" }, { status: 403 });
  }
  await resetState();
  return NextResponse.json({ ok: true });
}
