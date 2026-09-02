import { challengeMarket } from "@/lib/engine";
import { actorId, fail, formRedirect, needDesk } from "@/lib/http";
import { mutate } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const userId = await actorId();
    if (!userId) return needDesk();
    const form = await req.formData();
    const marketId = String(form.get("marketId"));
    await mutate((s) => challengeMarket(s, userId, marketId, { note: String(form.get("note") ?? "") }));
    formRedirect(`/markets/${marketId}`);
  } catch (e) {
    return fail(e);
  }
}
