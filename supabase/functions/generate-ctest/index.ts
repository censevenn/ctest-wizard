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
    // Используем бесплатный токен Hugging Face
    const apiKey = Deno.env.get("HUGGINGFACE_API_KEY");
    if (!apiKey) throw new Error("HUGGINGFACE_API_KEY ist in den Supabase-Geheimnissen nicht konfiguriert!");

    const body = await req.json().catch(() => ({}));
    const requestedLevel: string = body?.level === "C1" ? "C1" : body?.level === "B2" ? "B2" : Math.random() < 0.5 ? "B2" : "C1";
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    const systemPrompt = `Du bist ein Deutschlehrer, der akademische Kurztexte für C-Tests am Studienkolleg schreibt.

WICHTIG: Liefere AUSSCHLIESSLICH sauberen, vollständigen, fließenden deutschen Text im JSON-Format. Der C-Test wird CLIENT-SEITIG mechanisch aus deinem Text erzeugt — du darfst NIEMALS Lücken, Unterstriche, Platzhalter, fehlende Buchstaben, eckige/geschweifte Klammern, Markdown oder irgendwelche Formatierung einbauen. Jedes Wort muss vollständig ausgeschrieben sein.

Anforderungen:
- Sprache: Deutsch.
- Niveau: ${requestedLevel}.
- Länge: 100–150 Wörter, 6–9 zusammenhängende Sätze.
- Thema: "${topic}".
- Perfekte Grammatik und Rechtschreibung nach Duden. Sachlich-akademischer Stil, kohärenter Fließtext.
- Der ERSTE Satz ist eine vollständige Einleitung (er bleibt im C-Test ungekürzt).
- Erlaubte Zeichen: deutsche Buchstaben inkl. Umlaute/ß, Ziffern bei Bedarf, sowie die Satzzeichen . , ; : ? ! und Bindestriche in echten zusammengesetzten Wörtern.
- VERBOTEN: Unterstriche (_), Sternchen (*), Schrägstriche (/), Klammern, Anführungszeichen, Aufzählungen, Listen, Überschriften, Emojis, Punkte hintereinander (…), eckige/geschweifte Klammern, HTML.

Antworte IMMER im folgenden JSON-Format ohne Markdown-Codeblöcke:
{
  "title": "Prägnanter Titel max 6 Wörter",
  "topic": "${topic}",
  "level": "${requestedLevel}",
  "text": "Hier steht der komplette, unzensierte, fließende Fließtext ohne jegliche Lücken oder Formatierungen."
}`;

    const userPrompt = `Schreibe einen C-Test-Text passend zu: "${topic}". Niveau ${requestedLevel}. Liefere nur das JSON-Objekt.`;

    // Используем бесплатную модель Meta Llama 3 через Serverless API от Hugging Face
    const gatewayUrl = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct";

    const aiResp = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${userPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false
        }
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("Hugging Face API Error:", aiResp.status, errText);
      return new Response(JSON.stringify({ error: `AI Gateway Error: ${aiResp.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    let messageContent = data?.[0]?.generated_text || data?.generated_text;
    
    if (!messageContent) {
      throw new Error("Leere Antwort von der KI-Schnittstelle.");
    }

    // Очистка от возможных Markdown-оберток
    messageContent = messageContent.replace(/```json/g, "").replace(/```/g, "").trim();

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
