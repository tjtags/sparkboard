import { NextResponse } from "next/server";
import { devSwitcherEnabled } from "@/lib/flags";
import { storeKind } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    ok: true,
    store: storeKind(),
    vercel: Boolean(process.env.VERCEL),
    auth: Boolean(process.env.AUTH_SECRET),
    github: Boolean(process.env.AUTH_GITHUB_ID),
    grok: Boolean(process.env.XAI_API_KEY),
    resend: Boolean(process.env.RESEND_API_KEY),
    admin: Boolean(process.env.SPARKBOARD_ADMIN_SECRET || process.env.SPARKBOARD_ADMIN_EMAIL),
    switcher: devSwitcherEnabled(),
  });
}
