import { BookOpen, GraduationCap, PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SampleText } from "@/data/sampleTexts";

interface SidebarProps {
  texts: SampleText[];
  activeId: string;
  customTitle?: string;
  onSelect: (id: string) => void;
  onCustom: () => void;
}

export function Sidebar({ texts, activeId, customTitle, onSelect, onCustom }: SidebarProps) {
  const grouped = {
    B2: texts.filter((t) => t.level === "B2"),
    C1: texts.filter((t) => t.level === "C1"),
  };

  return (
    <aside className="w-full md:w-72 md:min-h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg leading-none">C-Test Trainer</h2>
            <p className="text-xs text-sidebar-foreground/60 mt-1">Studienkolleg Vorbereitung</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {(["B2", "C1"] as const).map((lvl) => (
          <div key={lvl}>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Niveau {lvl}
            </div>
            <ul className="space-y-1">
              {grouped[lvl].map((t) => {
                const active = activeId === t.id;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => onSelect(t.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-md flex items-start gap-2.5 transition-colors group",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/60 text-sidebar-foreground/85"
                      )}
                    >
                      <BookOpen
                        className={cn(
                          "h-4 w-4 mt-0.5 shrink-0",
                          active ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                        )}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-xs text-sidebar-foreground/55 truncate">{t.topic}</div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Eigene Texte
          </div>
          <button
            onClick={onCustom}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-md flex items-start gap-2.5 transition-colors",
              activeId === "custom"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent/60 text-sidebar-foreground/85"
            )}
          >
            <PencilLine
              className={cn(
                "h-4 w-4 mt-0.5 shrink-0",
                activeId === "custom" ? "text-sidebar-primary" : "text-sidebar-foreground/50"
              )}
            />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {customTitle || "Text einfügen…"}
              </div>
              <div className="text-xs text-sidebar-foreground/55">Eigener C-Test</div>
            </div>
          </button>
        </div>
      </nav>

      <div className="px-6 py-4 border-t border-sidebar-border text-xs text-sidebar-foreground/55">
        Tipp: Mit <kbd className="px-1.5 py-0.5 rounded bg-sidebar-accent text-sidebar-accent-foreground text-[10px]">Tab</kbd> springst du zur nächsten Lücke.
      </div>
    </aside>
  );
}
