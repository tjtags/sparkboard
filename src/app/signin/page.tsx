import { EmailForm } from "@/components/EmailForm";
import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { actorId } from "@/lib/http";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const id = await actorId();
  if (id) redirect("/");
  const github = Boolean(process.env.AUTH_GITHUB_ID);

  return (
    <Shell here="/">
      <Kicker>AUTH // DESK</Kicker>
      <h1 className="mt-2 text-3xl">Session</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Email confirm via Resend. GitHub if configured. Or an invite handle at /join/DESK12.
        Play-money. No cash-out.
      </p>
      <EmailForm />
      {github && (
        <a
          href="/api/auth/signin/github"
          className="mt-6 inline-block border border-mag px-3 py-2 text-[11px] tracking-widest text-mag"
        >
          GITHUB
        </a>
      )}
    </Shell>
  );
}
