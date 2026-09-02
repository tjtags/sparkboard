import { hashToken, newToken, sendConfirmEmail, appOrigin } from "@/lib/mail";
import { fail } from "@/lib/http";
import { mutate } from "@/lib/store";
import { EngineError } from "@/lib/engine";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; handle?: string; invite?: string };
    const email = (body.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new EngineError("bad_handle", "Need a real email");
    }
    const token = newToken();
    const tokenHash = hashToken(token);
    const exp = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    await mutate((s) => {
      s.emailChallenges = s.emailChallenges.filter((c) => c.exp > new Date().toISOString());
      const recent = s.emailChallenges.filter((c) => c.email === email).length;
      if (recent >= 5) throw new EngineError("spawn_rate", "Too many confirm mails. Wait.");
      s.emailChallenges.push({
        email,
        tokenHash,
        handle: body.handle,
        invite: body.invite,
        exp,
        at: new Date().toISOString(),
      });
    });
    const confirmUrl = `${appOrigin()}/api/auth/email/confirm?token=${token}`;
    const result = await sendConfirmEmail(email, confirmUrl);
    return Response.json({
      ok: true,
      sent: result.sent,
      confirmUrl: result.sent ? undefined : result.confirmUrl,
    });
  } catch (e) {
    return fail(e);
  }
}
