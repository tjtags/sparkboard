import { applyTrade } from "@/lib/engine";
import { actorId, fail, needDesk } from "@/lib/http";
import { mutate } from "@/lib/store";

export async function POST(req: Request) {
  const userId = await actorId();
  if (!userId) return needDesk();
  const body = await req.json();
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
    return Response.json({ ok: true, trade });
  } catch (e) {
    return fail(e);
  }
}
