import { createLeague } from "@/lib/engine";
import { actorId, fail, formRedirect, needDesk } from "@/lib/http";
import { mutate } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const userId = await actorId();
    if (!userId) return needDesk();
    const form = await req.formData();
    const sport = String(form.get("sportSeason") ?? "");
    const league = await mutate((s) =>
      createLeague(s, userId, String(form.get("name") ?? ""), String(form.get("blurb") ?? ""), {
        sportSeason: sport === "nfl" || sport === "nba" || sport === "mlb" ? sport : undefined,
      }),
    );
    formRedirect(`/leagues/${league.id}`);
  } catch (e) {
    return fail(e);
  }
}
