import { Sparkles, PencilLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  onGenerateAI: () => void;
  onCustomText: () => void;
  generating: boolean;
}

export function AppHeader({ onGenerateAI, onCustomText, generating }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex flex-col gap-3 px-5 md:px-10 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Studienkolleg · C-Test Trainer
          </p>
          <h2 className="font-display text-lg font-semibold leading-tight truncate">
            Übe gezielt für die Aufnahmeprüfung
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onGenerateAI}
            disabled={generating}
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                KI generiert…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                KI-Text generieren
              </>
            )}
          </Button>
          <Button onClick={onCustomText} variant="outline" className="gap-2">
            <PencilLine className="h-4 w-4" />
            Eigenen Text einfügen
          </Button>
        </div>
      </div>
    </header>
  );
}
