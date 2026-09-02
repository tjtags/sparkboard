import { joinLeague, leagueByInvite } from "@/lib/engine";
import { noteJoinProbe } from "@/lib/auth-users";
import { actorId, fail, formRedirect, needDesk } from "@/lib/http";
import { mutate } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const userId = await actorId();
    if (!userId) return needDesk();
    const form = await req.formData();
    const raw = String(form.get("invite") ?? form.get("leagueId") ?? "");
    const leagueId = await mutate((s) => {
      const byCode = leagueByInvite(s, raw);
      const id = byCode?.id ?? String(form.get("leagueId") ?? "");
      try {
        joinLeague(s, userId, id, byCode?.inviteCode ?? raw);
        noteJoinProbe(s, userId, true);
      } catch (e) {
        noteJoinProbe(s, userId, false);
        throw e;
      }
      return id;
    });
    formRedirect(`/leagues/${leagueId}`);
  } catch (e) {
    return fail(e);
  }
}
