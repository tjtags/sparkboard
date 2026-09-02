import { setLockInPick } from "@/lib/lockin";
import { actorId, fail, needDesk } from "@/lib/http";
import { mutate } from "@/lib/store";

export async function POST(req: Request) {
  const userId = await actorId();
  if (!userId) return needDesk();
  try {
    const body = await req.json();
    const pick = await mutate((s) =>
      setLockInPick(s, userId, String(body.leagueId), String(body.marketId), String(body.outcomeId)),
    );
    return Response.json({ ok: true, pick });
  } catch (e) {
    return fail(e);
  }
}
