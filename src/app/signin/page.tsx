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
      <Kicker>Desk</Kicker>
      <h1 className="display mt-2 text-4xl">Sign in</h1>
      <p className="mt-2 max-w-xl text-muted">
        GitHub is a durable desk. Friends without GitHub should use an invite link instead.
      </p>
      {github ? (
        <a
          href="/api/auth/signin/github"
          className="mt-6 inline-block rounded-md bg-spark px-4 py-2 text-sm text-ink"
        >
          Sign in with GitHub
        </a>
      ) : (
        <p className="mt-6 text-muted">
          GitHub OAuth is not configured on this deploy. Use a league invite — try{" "}
          <a href="/join/DESK12" className="text-spark">
            /join/DESK12
          </a>
          .
        </p>
      )}
    </Shell>
  );
}
