import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CTestView } from "@/components/CTestView";
import { CustomTextEditor } from "@/components/CustomTextEditor";
import { sampleTexts } from "@/data/sampleTexts";

const Index = () => {
  const [activeId, setActiveId] = useState<string>(sampleTexts[0].id);
  const [customText, setCustomText] = useState<string>("");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [customMode, setCustomMode] = useState<"editor" | "test">("editor");

  const isCustom = activeId === "custom";

  const active = useMemo(
    () => sampleTexts.find((t) => t.id === activeId),
    [activeId]
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar
        texts={sampleTexts}
        activeId={activeId}
        customTitle={customTitle}
        onSelect={(id) => setActiveId(id)}
        onCustom={() => {
          setActiveId("custom");
          setCustomMode(customText ? "test" : "editor");
        }}
      />

      <main className="flex-1 px-5 py-8 md:px-10 md:py-12 max-w-5xl mx-auto w-full">
        {!isCustom && active && (
          <CTestView
            key={active.id}
            title={active.title}
            level={active.level}
            topic={active.topic}
            text={active.text}
            onNewText={() => {
              setCustomText("");
              setCustomTitle("");
              setCustomMode("editor");
              setActiveId("custom");
            }}
          />
        )}

        {isCustom && customMode === "editor" && (
          <CustomTextEditor
            initialTitle={customTitle}
            initialText={customText}
            onApply={(title, text) => {
              setCustomTitle(title);
              setCustomText(text);
              setCustomMode("test");
            }}
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
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
