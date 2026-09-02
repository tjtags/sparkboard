import { appOrigin } from "@/lib/mail";
import { forecastsCsv, publicForecasts } from "@/lib/forecasts";
import { loadState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = await loadState();
  const origin = appOrigin();
  const rows = publicForecasts(s, origin);
  const url = new URL(req.url);
  const body = {
    at: new Date().toISOString(),
    source: "sparkboard",
    playMoney: true,
    attribution: "Sparkboard play-money LMSR. Not a cash market. Quote with permalink.",
    markets: rows,
  };
  const headers = {
    "cache-control": "public, max-age=60",
    "access-control-allow-origin": "*",
  };
  if (url.searchParams.get("format") === "csv") {
    return new Response(forecastsCsv(rows), {
      headers: {
        ...headers,
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "inline; filename=sparkboard-forecasts.csv",
      },
    });
  }
  return Response.json(body, { headers });
}
