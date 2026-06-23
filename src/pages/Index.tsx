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

  // --- ОБРАБОТЧИК КЛАВИШИ ALT ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        event.preventDefault();
        // Здесь можно вызвать вашу функцию показа решения
        // Например, можно создать событие, на которое отреагирует CTestView
        window.dispatchEvent(new CustomEvent("trigger-solution"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
  const activeSample = useMemo(() => sampleTexts.find((t) => t.id === activeId), [activeId]);
  const activeLibrary = useMemo(() => library.find((t) => t.id === activeId), [library, activeId]);

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
    if (generating || !guestCode) return;
    setGenerating(true);
    const toastId = toast.loading("KI schreibt einen neuen Text…");

    try {
      const response = await fetch("https://vartaodfddjkmpkgsuyx.supabase.co/functions/v1/generate-ctest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ level: Math.random() < 0.5 ? "B2" : "C1" }),
      });

      if (!response.ok) throw new Error(`Server Fehler: ${response.status}`);
      const data = await response.json();
      if (!data.text) throw new Error("Der generierte KI-Text ist leer.");

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
      toast.error("KI-Generierung fehlgeschlagen", { id: toastId, description: "Generierung fehlgeschlagen" });
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

  if (!guestCode) return <GuestLanding onLogin={handleGuestLogin} />;

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
        <AppHeader onGenerateAI={handleGenerateAI} onCustomText={openNewCustomEditor} generating={generating} />
        <main className="flex-1 px-5 py-8 md:px-10 md:py-12 max-w-5xl mx-auto w-full">
          {/* Рендер вашего теста CTestView */}
          {!isCustom && activeLibrary && (
             <CTestView key={activeLibrary.id} exerciseId={activeLibrary.id} title={activeLibrary.title} level={activeLibrary.level} topic={activeLibrary.topic} text={activeLibrary.text} onNewText={openNewCustomEditor} onCheckComplete={handleCheckComplete} />
          )}
          {/* ...остальной ваш JSX (оставлен без изменений)... */}
        </main>
      </div>
    </div>
  );
};

export default Index;
