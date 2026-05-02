// Generate a German B2/C1 short text suitable for a C-Test
// Returns: { title, level, topic, text }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOPICS = [
  "Wissenschaft und Forschung",
  "Geschichte Europas",
  "Klimawandel und Umwelt",
  "Studium am Studienkolleg in Deutschland",
  "Digitalisierung und Gesellschaft",
  "Kunst und Architektur",
  "Wirtschaft und Globalisierung",
  "Psychologie und Lernen",
  "Medizin und Gesundheit",
  "Migration und Integration",
  "Erneuerbare Energien",
  "Philosophie und Ethik",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const requestedLevel: string = body?.level === "C1" ? "C1" : body?.level === "B2" ? "B2" : Math.random() < 0.5 ? "B2" : "C1";
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    const system = `Du bist ein Deutschlehrer, der akademische Kurztexte für C-Tests am Studienkolleg schreibt.
Anforderungen:
- Sprache: Deutsch.
- Niveau: ${requestedLevel}.
- Länge: 6-9 Sätze, ca. 90-130 Wörter.
- Inhaltlich kohärent, sachlich-akademischer Stil.
- Der ERSTE Satz ist eine vollständige Einleitung (er bleibt im C-Test ungekürzt).
- KEINE Aufzählungen, KEINE Überschriften innerhalb des Texts, KEINE Klammern, KEINE Anführungszeichen, keine Emojis.
- Nur normale Satzzeichen: . , ; : ? !
- Gib das Ergebnis ausschließlich als JSON via Tool-Call zurück.`;

    const user = `Schreibe einen C-Test-Text zum Thema: "${topic}". Niveau ${requestedLevel}.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_ctest_text",
              description: "Return a generated German C-Test text.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Kurzer Titel (max 6 Wörter)" },
                  topic: { type: "string", description: "Thema des Texts" },
                  level: { type: "string", enum: ["B2", "C1"] },
                  text: { type: "string", description: "Der vollständige deutsche Text, 6-9 Sätze." },
                },
                required: ["title", "topic", "level", "text"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_ctest_text" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte gleich nochmal versuchen." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht. Bitte im Workspace aufladen." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      console.error("No tool call args in response", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "AI antwortete unerwartet." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(argsStr);

    return new Response(
      JSON.stringify({
        title: String(parsed.title ?? topic).slice(0, 80),
        topic: String(parsed.topic ?? topic),
        level: parsed.level === "C1" ? "C1" : "B2",
        text: String(parsed.text ?? "").trim(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-ctest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
