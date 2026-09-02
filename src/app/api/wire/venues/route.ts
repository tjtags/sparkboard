import { pullVenues } from "@/lib/connectors";
import type { Venue } from "@/lib/connectors";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(req: Request) {
  const src = new URL(req.url).searchParams.get("source") ?? "all";
  const which = src === "kalshi" || src === "polymarket" ? src : "all";
  const snap = await pullVenues(which as "all" | Venue);
  return Response.json(snap);
}
