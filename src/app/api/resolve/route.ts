import { resolveMarket } from "@/lib/engine";
import { actorId, fail, formRedirect } from "@/lib/http";
import { mutate } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const userId = await actorId();
    const form = await req.formData();
    const marketId = String(form.get("marketId"));
    await mutate((s) => resolveMarket(s, userId, marketId, String(form.get("outcomeId"))));
    formRedirect(`/markets/${marketId}`);
  } catch (e) {
    return fail(e);
  }
}
