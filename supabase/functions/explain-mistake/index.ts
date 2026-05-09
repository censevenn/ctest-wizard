// Briefly explain a German C-Test mistake (grammar/spelling) for a learner (B2/C1).
// Body: { word: string, userInput: string, context?: string }
// Returns: { explanation: string }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const word: string = String(body?.word ?? "").slice(0, 80);
    const userInput: string = String(body?.userInput ?? "").slice(0, 80);
    const context: string = String(body?.context ?? "").slice(0, 1200);
    if (!word) {
      return new Response(JSON.stringify({ error: "word is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system =
      "Du bist ein freundlicher Deutschlehrer. Erkläre einem B2/C1-Lerner kurz (max. 2 Sätze, ca. 35 Wörter) den Fehler. Keine Anrede, keine Floskeln. Nenne Wortart, Form (Kasus/Tempus/Genus) oder Rechtschreibregel, falls hilfreich.";
    const user = `Korrektes Wort: "${word}"\nMeine Eingabe: "${userInput}"\nKontext: ${context}\n\nWarum ist meine Eingabe falsch?`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return new Response(JSON.stringify({ error: `AI gateway: ${r.status} ${text}` }), {
        status: r.status === 429 || r.status === 402 ? r.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const explanation: string =
      data?.choices?.[0]?.message?.content?.trim?.() ?? "Keine Erklärung erhalten.";

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
