import { actorId, fail, formRedirect, needDesk } from "@/lib/http";
import { mutate } from "@/lib/store";
import { openWireBook } from "@/lib/wire-book";
import type { Venue } from "@/lib/connectors";

export async function POST(req: Request) {
  try {
    const userId = await actorId();
    if (!userId) return needDesk();
    const form = await req.formData();
    const venue = String(form.get("venue"));
    if (venue !== "kalshi" && venue !== "polymarket") {
      return Response.json({ error: "Unknown venue", code: "bad_venue" }, { status: 400 });
    }
    const yesRaw = String(form.get("yes") ?? "");
    const market = await mutate((s) =>
      openWireBook(s, userId, {
        venue: venue as Venue,
        id: String(form.get("id") ?? ""),
        title: String(form.get("title") ?? ""),
        category: String(form.get("category") ?? ""),
        url: String(form.get("url") ?? ""),
        yes: yesRaw ? Number(yesRaw) : null,
        volume24h: null,
        closesAt: String(form.get("closesAt") ?? "") || null,
        nOutcomes: 2,
      }),
    );
    formRedirect(`/markets/${market.id}`);
  } catch (e) {
    return fail(e);
  }
}
