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
    const apiKey = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const requestedLevel: string = body?.level === "C1" ? "C1" : body?.level === "B2" ? "B2" : Math.random() < 0.5 ? "B2" : "C1";
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    const system = `Du bist ein Deutschlehrer, der akademische Kurztexte für C-Tests am Studienkolleg schreibt.

WICHTIG: Liefere AUSSCHLIESSLICH sauberen, vollständigen, fließenden deutschen Text. Der C-Test wird CLIENT-SEITIG mechanisch aus deinem Text erzeugt — du darfst NIEMALS Lücken, Unterstriche, Platzhalter, fehlende Buchstaben, eckige/geschweifte Klammern, Markdown oder irgendwelche Formatierung einbauen. Jedes Wort muss vollständig ausgeschrieben sein.

Anforderungen:
- Sprache: Deutsch.
- Niveau: ${requestedLevel}.
- Länge: 100–150 Wörter, 6–9 zusammenhängende Sätze.
- Themen bevorzugt: Ethik, Digitalisierung, Naturwissenschaften (passe thematisch auf "${topic}" an, falls sinnvoll).
- Perfekte Grammatik und Rechtschreibung nach Duden. Sachlich-akademischer Stil, kohärenter Fließtext.
- Der ERSTE Satz ist eine vollständige Einleitung (er bleibt im C-Test ungekürzt).
- Erlaubte Zeichen: deutsche Buchstaben inkl. Umlaute/ß, Ziffern bei Bedarf, sowie die Satzzeichen . , ; : ? !  und Bindestriche in echten zusammengesetzten Wörtern.
- VERBOTEN: Unterstriche (_), Sternchen (*), Schrägstriche (/), Klammern, Anführungszeichen, Aufzählungen, Listen, Überschriften, Emojis, Punkte hintereinander (…), eckige/geschweifte Klammern, JSON, HTML.
- Liefere immer einen prägnanten Titel (max. 6 Wörter, deutsch) im Feld "title".
- Gib das Ergebnis ausschließlich als JSON via Tool-Call zurück.`;

    const user = `Schreibe einen C-Test-Text passend zu: "${topic}". Niveau ${requestedLevel}. Titel nicht vergessen.`;

    const gatewayUrl =
      Deno.env.get("AI_GATEWAY_URL") ?? "https://ai.gateway.lovable.dev/v1/chat/completions";

    const aiResp = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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

    const rawTitle = String(parsed.title ?? "").trim();
    const title =
      rawTitle.length > 0 ? rawTitle.slice(0, 80) : `Thema: ${String(parsed.topic ?? topic).slice(0, 60)}`;

    return new Response(
      JSON.stringify({
        title,
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
