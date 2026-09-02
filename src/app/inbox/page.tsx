import Link from "next/link";
import { Compose } from "@/components/Compose";
import { Kicker } from "@/components/Bits";
import { Shell } from "@/components/Shell";
import { actorId } from "@/lib/http";
import { loadState } from "@/lib/store";
import { currentUser } from "@/lib/views";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const s = await loadState();
  const me = currentUser(s, (await actorId()) ?? undefined);
  if (!me) redirect("/signin");
  const mine = s.messages
    .filter((m) => m.toId === me.id || m.fromId === me.id)
    .slice(-40)
    .reverse();

  return (
    <Shell here="/inbox">
      <Kicker>COMMS // DIRECT</Kicker>
      <h1 className="mt-2 text-3xl">Packets</h1>
      <ul className="mt-6 max-w-xl space-y-2">
        {mine.map((m) => {
          const from = s.users.find((u) => u.id === m.fromId);
          const to = s.users.find((u) => u.id === m.toId);
          return (
            <li key={m.id} className="border border-line p-3 text-[13px]">
              <div className="text-[10px] tracking-widest text-muted">
                {m.at.slice(11, 19)}Z · @{from?.handle} → @{to?.handle ?? "league"}
              </div>
              <p className="mt-1">{m.body}</p>
              {from && (
                <Link href={`/d/${from.handle}`} className="text-[11px] text-spark">
                  node
                </Link>
              )}
            </li>
          );
        })}
        {mine.length === 0 && <li className="text-muted">No packets.</li>}
      </ul>
      <div className="mt-8 max-w-sm">
        <Kicker>NEW PACKET</Kicker>
        <Compose />
      </div>
    </Shell>
  );
}
