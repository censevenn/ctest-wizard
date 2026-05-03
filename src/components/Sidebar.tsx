import { useState } from "react";
import { BookOpen, GraduationCap, PencilLine, Sparkles, Trash2, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SampleText } from "@/data/sampleTexts";
import type { LibraryItem } from "@/lib/library";
import type { GuestProfile } from "@/lib/guestProfile";
import {
  averageAccuracyPercent,
  averageCompletionSeconds,
  isValidGuestCode,
  normalizeGuestCode,
} from "@/lib/guestProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SidebarProps {
  texts: SampleText[];
  library: LibraryItem[];
  activeId: string;
  customTitle?: string;
  onSelect: (id: string) => void;
  onSelectLibrary: (id: string) => void;
  onCustom: () => void;
  onDeleteLibrary: (id: string) => void;
  guestCode: string | null;
  guestProfile: GuestProfile | null;
  onGuestLogin: (code: string) => void;
  onGuestLogout: () => void;
}

export function Sidebar({
  texts,
  library,
  activeId,
  customTitle,
  onSelect,
  onSelectLibrary,
  onCustom,
  onDeleteLibrary,
  guestCode,
  guestProfile,
  onGuestLogin,
  onGuestLogout,
}: SidebarProps) {
  const [guestDraft, setGuestDraft] = useState("");

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
        {library.length > 0 && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Bibliothek
            </div>
            <ul className="space-y-1">
              {library.map((t) => {
                const active = activeId === t.id;
                return (
                  <li key={t.id} className="group/item relative">
                    <button
                      onClick={() => onSelectLibrary(t.id)}
                      className={cn(
                        "w-full text-left pl-3 pr-9 py-2.5 rounded-md flex items-start gap-2.5 transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/60 text-sidebar-foreground/85"
                      )}
                    >
                      {t.source === "ai" ? (
                        <Sparkles
                          className={cn(
                            "h-4 w-4 mt-0.5 shrink-0",
                            active ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                          )}
                        />
                      ) : (
                        <PencilLine
                          className={cn(
                            "h-4 w-4 mt-0.5 shrink-0",
                            active ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                          )}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-xs text-sidebar-foreground/55 truncate">
                          {t.level} · {t.topic}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLibrary(t.id);
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-sidebar-foreground/40 opacity-0 group-hover/item:opacity-100 hover:bg-sidebar-accent hover:text-destructive transition-opacity"
                      aria-label="Aus Bibliothek entfernen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

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
                        "w-full text-left px-3 py-2.5 rounded-md flex items-start gap-2.5 transition-colors",
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

      <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
        <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 inline-flex items-center gap-1.5">
          <User className="h-3 w-3" />
          Gast-Profil
        </div>
        {guestCode && guestProfile ? (
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-3 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sidebar-foreground/70">Code</span>
              <span className="font-mono font-semibold tracking-widest text-sidebar-primary-foreground bg-sidebar-primary px-2 py-0.5 rounded">
                {guestCode}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sidebar-foreground/85">
              <div>
                <div className="text-[10px] uppercase text-sidebar-foreground/50">Texte</div>
                <div className="font-medium tabular-nums">{guestProfile.textsCompleted}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-sidebar-foreground/50">Ø Genauigkeit</div>
                <div className="font-medium tabular-nums">
                  {averageAccuracyPercent(guestProfile) != null
                    ? `${Math.round(averageAccuracyPercent(guestProfile)!)}%`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-sidebar-foreground/50">Bestzeit</div>
                <div className="font-medium tabular-nums">
                  {guestProfile.bestTimeSeconds != null
                    ? `${guestProfile.bestTimeSeconds}s`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-sidebar-foreground/50">Ø Zeit</div>
                <div className="font-medium tabular-nums">
                  {averageCompletionSeconds(guestProfile) != null
                    ? `${Math.round(averageCompletionSeconds(guestProfile)!)}s`
                    : "—"}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={onGuestLogout}
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Gast abmelden
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-sidebar-border px-3 py-3 space-y-2">
            <p className="text-[11px] text-sidebar-foreground/65 leading-snug">
              6-stelliger Code zum Speichern deines Fortschritts (Timer und Genauigkeit).
            </p>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="z. B. 123456"
              value={guestDraft}
              onChange={(e) => setGuestDraft(normalizeGuestCode(e.target.value))}
              className="h-9 font-mono tracking-widest bg-sidebar-accent/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
            />
            <Button
              type="button"
              size="sm"
              className="w-full h-9 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              disabled={!isValidGuestCode(guestDraft)}
              onClick={() => {
                onGuestLogin(guestDraft);
                setGuestDraft("");
              }}
            >
              Gast-Zugang aktivieren
            </Button>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-sidebar-border text-xs text-sidebar-foreground/55">
        Tipp: Mit <kbd className="px-1.5 py-0.5 rounded bg-sidebar-accent text-sidebar-accent-foreground text-[10px]">Tab</kbd> springst du zur nächsten Lücke.
      </div>
    </aside>
  );
}
