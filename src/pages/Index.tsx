import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CTestView } from "@/components/CTestView";
import { CustomTextEditor } from "@/components/CustomTextEditor";
import { AppHeader } from "@/components/AppHeader";
import { sampleTexts } from "@/data/sampleTexts";
import { getLibrary, saveLibraryItem, removeLibraryItem, makeId, type LibraryItem } from "@/lib/library";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const [library, setLibrary] = useState<LibraryItem[]>(() => getLibrary());
  const [activeId, setActiveId] = useState<string>(sampleTexts[0].id);
  const [customText, setCustomText] = useState<string>("");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [customMode, setCustomMode] = useState<"editor" | "test">("editor");
  const [generating, setGenerating] = useState(false);

  const refreshLibrary = () => setLibrary(getLibrary());

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

  const handleGenerateAI = async () => {
    if (generating) return;
    setGenerating(true);
    const toastId = toast.loading("KI schreibt einen neuen Text…");
    try {
      const { data, error } = await supabase.functions.invoke("generate-ctest", {
        body: { level: Math.random() < 0.5 ? "B2" : "C1" },
      });
      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error || "Unbekannter Fehler");
      if (!data.text || typeof data.text !== "string") throw new Error("Leerer KI-Text");

      const item = saveLibraryItem({
        id: makeId("ai"),
        title: data.title || "KI-Text",
        topic: data.topic || "Allgemein",
        level: data.level === "C1" ? "C1" : "B2",
        text: data.text,
        source: "ai",
      });
      refreshLibrary();
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

  const handleDeleteLibrary = (id: string) => {
    removeLibraryItem(id);
    if (activeId === id) setActiveId(sampleTexts[0].id);
    refreshLibrary();
  };

  const handleApplyCustom = (title: string, text: string) => {
    setCustomTitle(title);
    setCustomText(text);
    setCustomMode("test");
    // Persist to library too
    const item = saveLibraryItem({
      id: makeId("custom"),
      title,
      topic: "Eigener Text",
      level: "Custom",
      text,
      source: "custom",
    });
    refreshLibrary();
    setActiveId(item.id);
  };

  // Re-sync library if storage changes in another tab
  useEffect(() => {
    const onStorage = () => refreshLibrary();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar
        texts={sampleTexts}
        library={library}
        activeId={activeId}
        customTitle={customTitle}
        onSelect={(id) => setActiveId(id)}
        onSelectLibrary={(id) => setActiveId(id)}
        onCustom={openCustomEditor}
        onDeleteLibrary={handleDeleteLibrary}
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
              title={activeLibrary.title}
              level={activeLibrary.level}
              topic={activeLibrary.topic}
              text={activeLibrary.text}
              onNewText={openNewCustomEditor}
            />
          )}

          {!isCustom && !activeLibrary && activeSample && (
            <CTestView
              key={activeSample.id}
              title={activeSample.title}
              level={activeSample.level}
              topic={activeSample.topic}
              text={activeSample.text}
              onNewText={openNewCustomEditor}
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
                title={customTitle || "Eigener Text"}
                level="Custom"
                topic="Eigener Text"
                text={customText}
                onNewText={openNewCustomEditor}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
