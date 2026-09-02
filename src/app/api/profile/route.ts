import { actorId, fail, needDesk } from "@/lib/http";
import { mutate } from "@/lib/store";

export async function POST(req: Request) {
  const userId = await actorId();
  if (!userId) return needDesk();
  try {
    const body = (await req.json()) as { bio?: string; displayName?: string; desk?: string };
    await mutate((s) => {
      const u = s.users.find((x) => x.id === userId);
      if (!u) return;
      if (typeof body.bio === "string") u.bio = body.bio.slice(0, 280);
      if (typeof body.displayName === "string" && body.displayName.trim()) {
        u.displayName = body.displayName.trim().slice(0, 40);
      }
      if (typeof body.desk === "string") u.desk = body.desk.trim().slice(0, 40);
    });
    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
