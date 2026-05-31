import { useCallback, useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CTestView, type CheckCompleteStats } from "@/components/CTestView";
import { CustomTextEditor } from "@/components/CustomTextEditor";
import { AppHeader } from "@/components/AppHeader";
import { GuestLanding } from "@/components/GuestLanding";
import { sampleTexts } from "@/data/sampleTexts";
import { fetchLibrary, saveLibraryItem, makeId, type LibraryItem, removeLibraryItem } from "@/lib/library";
import {
  defaultGuestProfile,
  loadGuestCode,
  loadGuestProfile,
  mergeGuestProfileAfterCheck,
  persistGuestProfile,
  saveGuestCode,
  clearGuestCode,
  isValidGuestCode,
  type GuestProfile,
} from "@/lib/guestProfile";
import { toast } from "sonner";

const Index = () => {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [activeId, setActiveId] = useState<string>(sampleTexts[0].id);
  const [guestCode, setGuestCode] = useState<string | null>(() => loadGuestCode());
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(() => {
    const c = loadGuestCode();
    return c ? loadGuestProfile(c) : null;
  });
  const [customText, setCustomText] = useState<string>("");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [customMode, setCustomMode] = useState<"editor" | "test">("editor");
  const [generating, setGenerating] = useState(false);

  const refreshLibrary = useCallback(async (code: string | null) => {
    if (!code) {
      setLibrary([]);
      return;
    }
    const items = await fetchLibrary(code);
    setLibrary(items);
  }, []);

  useEffect(() => {
    void refreshLibrary(guestCode);
  }, [guestCode, refreshLibrary]);

  const handleGuestLogin = useCallback((code: string) => {
    if (!isValidGuestCode(code)) return;
    saveGuestCode(code);
    setGuestCode(code);
    setGuestProfile(loadGuestProfile(code));
  }, []);

  const handleGuestLogout = useCallback(() => {
    clearGuestCode();
    setGuestCode(null);
    setGuestProfile(null);
  }, []);

  const handleCheckComplete = useCallback(
    (stats: CheckCompleteStats) => {
      const code = guestCode;
      if (!code) return;
      const prev = loadGuestProfile(code);
      const next = mergeGuestProfileAfterCheck(prev, {
        accuracyPercent: stats.accuracyPercent,
        allGapsFilled: stats.allGapsFilled,
        durationSeconds: stats.durationSeconds,
      });
      persistGuestProfile(code, next);
      setGuestProfile(next);
    },
    [guestCode]
  );

  const isCustom = activeId === "custom";

  const activeSample = useMemo(
    () => sampleTexts.find((t) => t.id === activeId),
    [activeId]
  );
  const activeLibrary = useMemo(
    () => library.find((t) => t.id === activeId),
    [library, activeId]
  );

  const openCustomEditor = () => {
    setActiveId("custom");
    setCustomMode(customText ? "test" : "editor");
  };

  const openNewCustomEditor = () => {
    setCustomText("");
    setCustomTitle("");
    setCustomMode("editor");
    setActiveId("custom");
  };

  // НОВАЯ ПРЯМАЯ ГЕНЕРАЦИЯ ЧЕРЕЗ OPENROUTER
  const handleGenerateAI = async () => {
    if (generating) return;
    if (!guestCode) return;
    setGenerating(false);

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      toast.error("API-ключ отсутствует", {
        description: "Пожалуйста, добавьте VITE_OPENROUTER_API_KEY в секреты репозитория GitHub.",
      });
      return;
    }

    setGenerating(true);
    const toastId = toast.loading("KI schreibt einen neuen Text…");
    const targetLevel = Math.random() < 0.5 ? "B2" : "C1";

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/censevenn/ctest-wizard",
          "X-Title": "C-Test Wizard",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash", // Быстрая и экономичная модель для генерации текстов
          messages: [
            {
              role: "system",
              content: `Du bist ein Experte für deutsche Sprache und erstellst C-Test-Texte für das Studienkolleg-Niveau. 
              Erstelle einen interessanten, zusammenhängenden Text auf Deutsch (Niveau ${targetLevel}).
              Der Text muss genau ein zusammenhängender Absatz sein (ca. 5-7 Sätze, insgesamt 80-120 Wörter).
              WICHTIG: Gib das Ergebnis AUSSCHLIESSLICH als valides JSON-Objekt zurück, ohne Markdown-Formatierung (keine \`\`\`json Blöcke).
              Struktur des JSON:
              {
                "title": "Ein knackiger Titel zum Thema",
                "topic": "Das Hauptthema (z.B. Umwelt, Technologie, Kultur, Medien)",
                "level": "${targetLevel}",
                "text": "Der vollständige, normale Text ohne Lücken. Der Text MUSS fehlerfrei sein."
              }`
            },
            {
              role: "user",
              content: "Generiere einen neuen Text."
            }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter Fehler: Status ${response.status}`);
      }

      const result = await response.json();
      const contentText = result.choices?.[0]?.message?.content;
      
      if (!contentText) {
        throw new Error("Keine Antwort von der KI erhalten");
      }

      // Парсим JSON из ответа модели
      const data = JSON.parse(contentText.trim());

      if (!data.text) {
        throw new Error("Der generierte KI-Text ist leer.");
      }

      const item = await saveLibraryItem(guestCode, {
        id: makeId("ai"),
        title: data.title || "KI-Text",
        topic: data.topic || "Allgemein",
        level: data.level === "C1" ? "C1" : "B2",
        text: data.text,
        source: "ai",
      });

      await refreshLibrary(guestCode);
      setActiveId(item.id);
      toast.success("Neuer C-Test erstellt", { id: toastId, description: item.title });
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Generierung fehlgeschlagen";
      toast.error("KI-Generierung fehlgeschlagen", { id: toastId, description: msg });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteLibrary = async (id: string) => {
    if (!guestCode) return;
    await removeLibraryItem(guestCode, id);
    if (activeId === id) setActiveId(sampleTexts[0].id);
    await refreshLibrary(guestCode);
  };

  const handleApplyCustom = async (title: string, text: string) => {
    if (!guestCode) return;
    setCustomTitle(title);
    setCustomText(text);
    setCustomMode("test");
    const item = await saveLibraryItem(guestCode, {
      id: makeId("custom"),
      title,
      topic: "Eigener Text",
      level: "Custom",
      text,
      source: "custom",
    });
    await refreshLibrary(guestCode);
    setActiveId(item.id);
  };

  if (!guestCode) {
    return <GuestLanding onLogin={handleGuestLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      <Sidebar
        texts={sampleTexts}
        library={library}
        activeId={activeId}
        customTitle={customTitle}
        onSelect={(id) => setActiveId(id)}
        onSelectLibrary={(id) => setActiveId(id)}
        onCustom={openCustomEditor}
        onDeleteLibrary={handleDeleteLibrary}
        guestCode={guestCode}
        guestProfile={guestCode ? (guestProfile ?? defaultGuestProfile()) : null}
        onGuestLogin={handleGuestLogin}
        onGuestLogout={handleGuestLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          onGenerateAI={handleGenerateAI}
          onCustomText={openNewCustomEditor}
          generating={generating}
        />

        <main className="flex-1 px-5 py-8 md:px-10 md:py-12 max-w-5xl mx-auto w-full">
          {!isCustom && activeLibrary && (
            <CTestView
              key={activeLibrary.id}
              exerciseId={activeLibrary.id}
              title={activeLibrary.title}
              level={activeLibrary.level}
              topic={activeLibrary.topic}
              text={activeLibrary.text}
              onNewText={openNewCustomEditor}
              onCheckComplete={handleCheckComplete}
            />
          )}

          {!isCustom && !activeLibrary && activeSample && (
            <CTestView
              key={activeSample.id}
              exerciseId={activeSample.id}
              title={activeSample.title}
              level={activeSample.level}
              topic={activeSample.topic}
              text={activeSample.text}
              onNewText={openNewCustomEditor}
              onCheckComplete={handleCheckComplete}
            />
          )}

          {isCustom && customMode === "editor" && (
            <CustomTextEditor
              initialTitle={customTitle}
              initialText={customText}
              onApply={handleApplyCustom}
            />
          )}

          {isCustom && customMode === "test" && (
            <div className="space-y-4">
              <button
                onClick={() => setCustomMode("editor")}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                ← Text bearbeiten
              </button>
              <CTestView
                key={`custom-${customTitle}-${customText.length}`}
                exerciseId={`custom-${customTitle}-${customText.length}`}
                title={customTitle || "Eigener Text"}
                level="Custom"
                topic="Eigener Text"
                text={customText}
                onNewText={openNewCustomEditor}
                onCheckComplete={handleCheckComplete}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
