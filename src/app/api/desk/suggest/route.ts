import { formRedirect } from "@/lib/http";

const FALLBACK = [
  "Will Democrats net 3 or more House seats in 2026?",
  "Does the GOP still hold the Senate on January 3, 2027?",
  "Will early vote in Pennsylvania exceed 2.0 million ballots?",
  "Does Collins win Maine by fewer than 3 points?",
];

export async function POST(req: Request) {
  const form = await req.formData();
  const topic = String(form.get("topic") || "2026 US midterms");
  const key = process.env.XAI_API_KEY;
  if (key) {
    try {
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
      console.log("grok draft", text);
    } catch (e) {
      console.error(e);
    }
  }
  void FALLBACK;
  formRedirect(`/markets/new?topic=${encodeURIComponent(topic)}`);
}
