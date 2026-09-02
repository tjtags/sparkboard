import { NextResponse } from "next/server";
import { applyTrade, EngineError } from "@/lib/engine";
import { PLAYER_COOKIE } from "@/lib/session";
import { mutate } from "@/lib/store";

export async function POST(req: Request) {
  const body = await req.json();
  const userId = req.headers.get("cookie")?.match(new RegExp(`${PLAYER_COOKIE}=([^;]+)`))?.[1];
  if (!userId) return NextResponse.json({ error: "Pick a desk first" }, { status: 401 });
  try {
    const trade = await mutate((s) =>
      applyTrade(s, {
        userId,
        marketId: body.marketId,
        outcomeId: body.outcomeId,
        side: body.side,
        amount: Number(body.amount),
        mode: body.mode ?? "spend",
      }),
    );
    return NextResponse.json({ ok: true, trade });
  } catch (e) {
    const err = e as EngineError;
    return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
  }
}
