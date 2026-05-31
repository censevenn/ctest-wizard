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
    // Используем прямой токен OpenRouter или OpenAI, который мы сохраним в панели Supabase
    const apiKey = Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("ИИ-ключ (OPENROUTER_API_KEY или OPENAI_API_KEY) не настроен в Supabase Vault!");

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
- Erlaubte Zeichen: deutsche Buchstaben inkl. Umlaute/ß, Ziffern bei Bedarf, sowie die Satzzeichen . , ; : ? ! und Bindestriche in echten zusammengesetzten Wörtern.
- VERBOTEN: Unterstriche (_), Sternchen (*), Schrägstriche (/), Klammern, Anführungszeichen, Aufzählungen, Listen, Überschriften, Emojis, Punkte hintereinander (…), eckige/geschweifte Klammern, JSON, HTML.
- Liefere immer einen prägnanten Titel (max. 6 Wörter, deutsch) im Feld "title".
- Gib das Ergebnis ausschließlich в формате JSON, используя структуру параметров функции return_ctest_text. Respond with JSON containing title, topic, level, and text properties.`;

    const user = `Schreibe einen C-Test-Text passend zu: "${topic}". Niveau ${requestedLevel}. Titel nicht vergessen.`;

    // Переключаем отправку на официальный эндпоинт OpenRouter
    const gatewayUrl = "https://openrouter.ai/api/v1/chat/completions";

    const aiResp = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/censevenn/ctest-wizard", // Для верификации запросов
      },
      body: JSON.stringify({
        // Здесь можно указать любую модель. Например, отличную бесплатную "google/gemini-2.5-flash" или мощную "meta-llama/llama-3-70b-instruct"
        model: "google/gemini-2.5-flash", 
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" } // Заставляем ИИ возвращать чистый JSON объект
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      return new Response(JSON.stringify({ error: `AI Gateway Error: ${aiResp.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const messageContent = data?.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("Пустой ответ от нейросети.");
    }

    // Парсим JSON, полученный напрямую из текстового ответа
    const parsed = JSON.parse(messageContent);
    const rawTitle = String(parsed.title ?? "").trim();
    const title = rawTitle.length > 0 ? rawTitle.slice(0, 80) : `Thema: ${String(parsed.topic ?? topic).slice(0, 60)}`;

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
