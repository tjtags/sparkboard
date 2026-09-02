import { joinLeague } from "@/lib/engine";
import { actorId, fail, formRedirect } from "@/lib/http";
import { mutate } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const userId = await actorId();
    const form = await req.formData();
    const leagueId = String(form.get("leagueId"));
    await mutate((s) => joinLeague(s, userId, leagueId, String(form.get("invite") ?? "")));
    formRedirect(`/leagues/${leagueId}`);
  } catch (e) {
    return fail(e);
  }
}
