import { createHash, randomBytes } from "node:crypto";
import { Resend } from "resend";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken() {
  return randomBytes(24).toString("hex");
}

export function appOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://sparkboard-zeta.vercel.app";
}

export async function sendConfirmEmail(to: string, confirmUrl: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { sent: false as const, confirmUrl };
  }
  const resend = new Resend(key);
  const from = process.env.RESEND_FROM ?? "Sparkboard <onboarding@resend.dev>";
  await resend.emails.send({
    from,
    to,
    subject: "[SPARKBOARD] confirm desk",
    html: `<pre style="font-family:ui-monospace,monospace;background:#07090c;color:#7cffcb;padding:24px">
SPARKBOARD // confirm
---------------------
This is play-money. No cash-out.

Confirm this desk:
<a href="${confirmUrl}" style="color:#7cffcb">${confirmUrl}</a>

Link dies in 20 minutes.
</pre>`,
  });
  return { sent: true as const, confirmUrl };
}
