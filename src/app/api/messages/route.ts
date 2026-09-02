import { actorId, fail, needDesk } from "@/lib/http";
import { mutate } from "@/lib/store";
import { EngineError } from "@/lib/engine";

export async function POST(req: Request) {
  const userId = await actorId();
  if (!userId) return needDesk();
  try {
    const body = (await req.json()) as { body?: string; leagueId?: string; toHandle?: string };
    const text = (body.body ?? "").trim().slice(0, 500);
    if (text.length < 1) throw new EngineError("bad_handle", "Empty packet");
    await mutate((s) => {
      let toId: string | undefined;
      const dest = body.toHandle;
      if (dest) {
        const t = s.users.find((u) => u.handle === dest.toLowerCase());
        if (!t) throw new EngineError("no_user", "Unknown desk");
        toId = t.id;
      }
      if (body.leagueId) {
        const inL = s.memberships.some((m) => m.userId === userId && m.leagueId === body.leagueId);
        if (!inL) throw new EngineError("forbidden", "Not in that league");
      }
      s.messages.push({
        id: `msg_${crypto.randomUUID().slice(0, 8)}`,
        fromId: userId,
        toId,
        leagueId: body.leagueId,
        body: text,
        at: new Date().toISOString(),
      });
      s.messages = s.messages.slice(-400);
    });
    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
