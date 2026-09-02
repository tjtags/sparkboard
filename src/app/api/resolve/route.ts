import { adminSecretOk } from "@/lib/admin";
import { DESK_USER_ID } from "@/lib/constants";
import { resolveMarket } from "@/lib/engine";
import { actorId, fail, formRedirect, needDesk } from "@/lib/http";
import { mutate } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const oracle = adminSecretOk(req);
    const userId = oracle ? DESK_USER_ID : await actorId();
    if (!userId) return needDesk();
    const form = await req.formData();
    const marketId = String(form.get("marketId"));
    await mutate((s) =>
      resolveMarket(s, userId, marketId, String(form.get("outcomeId")), {
        sourceUrl: String(form.get("sourceUrl") ?? ""),
        note: String(form.get("note") ?? ""),
      }),
    );
    formRedirect(`/markets/${marketId}`);
  } catch (e) {
    return fail(e);
  }
}
