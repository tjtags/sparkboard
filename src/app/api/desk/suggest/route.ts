import { actorId, fail, formRedirect, needDesk } from "@/lib/http";
import { mutate } from "@/lib/store";

const FALLBACK = [
  "Will Democrats net 3 or more House seats in 2026?",
  "Does the GOP still hold the Senate on January 3, 2027?",
  "Will early vote in Pennsylvania exceed 2.0 million ballots?",
  "Does Collins win Maine by fewer than 3 points?",
];

function parseQuestions(text: string): string[] {
  const json = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const o = JSON.parse(json) as { questions?: string[] };
    return (o.questions ?? []).filter((q) => typeof q === "string").slice(0, 4);
  } catch {
    return [];
  }
}

function clean(qs: string[]) {
  const banned = /\b(bet|odds|payout|wager|jackpot)\b/i;
  return qs.filter((q) => q.length > 12 && !banned.test(q));
}

export async function POST(req: Request) {
  try {
    const userId = await actorId();
    if (!userId) return needDesk();
    const form = await req.formData();
    const topic = String(form.get("topic") || "2026 US midterms").slice(0, 80);
    let questions = FALLBACK;
    let source: "grok" | "canned" = "canned";
    const key = process.env.XAI_API_KEY;
    if (key) {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${key}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-4.6",
          messages: [
            {
              role: "system",
              content:
                "You draft play-money prediction-market questions. Return JSON {questions: string[4]}. Binary, resolvable, no gambling language.",
            },
            { role: "user", content: `Topic: ${topic}` },
          ],
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      const parsed = clean(parseQuestions(text));
      if (parsed.length) {
        questions = parsed;
        source = "grok";
      }
    }
    await mutate((s) => {
      s.wireDrafts.unshift({
        id: `wire_${Date.now().toString(36)}`,
        topic,
        questions,
        source,
        createdAt: new Date().toISOString(),
        createdBy: userId,
      });
      s.wireDrafts = s.wireDrafts.slice(0, 8);
    });
    formRedirect("/call-sheet");
  } catch (e) {
    return fail(e);
  }
}
