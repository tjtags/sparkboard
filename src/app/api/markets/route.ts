import { createMarket } from "@/lib/engine";
import { actorId, fail, formRedirect } from "@/lib/http";
import { mutate } from "@/lib/store";
import type { Category } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const userId = await actorId();
    const form = await req.formData();
    const priorYes = Number(form.get("priorYes") ?? 50) / 100;
    const closes = String(form.get("closesAt") || "2026-11-03");
    const market = await mutate((s) =>
      createMarket(s, userId, {
        leagueId: String(form.get("leagueId")),
        question: String(form.get("question") ?? ""),
        description: String(form.get("description") ?? ""),
        resolutionCriteria: String(form.get("resolutionCriteria") ?? ""),
        category: String(form.get("category") ?? "politics") as Category,
        outcomeNames: [String(form.get("yes") || "Yes"), String(form.get("no") || "No")],
        prior: [priorYes, 1 - priorYes],
        b: Number(form.get("b") || 40000),
        callSheet: form.get("callSheet") === "on",
        closesAt: new Date(closes + "T23:59:00.000Z").toISOString(),
      }),
    );
    formRedirect(`/markets/${market.id}`);
  } catch (e) {
    return fail(e);
  }
}
