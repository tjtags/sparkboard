import { createLeague } from "@/lib/engine";
import { actorId, fail, formRedirect } from "@/lib/http";
import { mutate } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const userId = await actorId();
    const form = await req.formData();
    const league = await mutate((s) =>
      createLeague(s, userId, String(form.get("name") ?? ""), String(form.get("blurb") ?? "")),
    );
    formRedirect(`/leagues/${league.id}`);
  } catch (e) {
    return fail(e);
  }
}
