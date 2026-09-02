import { NextResponse } from "next/server";
import { adminSecretOk } from "@/lib/admin";
import { resetState } from "@/lib/store";

export async function POST(req: Request) {
  if (!process.env.SPARKBOARD_ADMIN_SECRET) {
    return NextResponse.json({ error: "reset disabled", code: "forbidden" }, { status: 401 });
  }
  if (!adminSecretOk(req)) {
    return NextResponse.json({ error: "forbidden", code: "forbidden" }, { status: 403 });
  }
  await resetState();
  return NextResponse.json({ ok: true });
}
