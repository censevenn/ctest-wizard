import { useEffect, useMemo, useRef, useState } from "react";
import { buildCTest, type Token } from "@/lib/ctest";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Eye, RotateCcw, Sparkles, FilePlus2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "correct" | "incorrect" | "revealed";

interface CTestViewProps {
  title: string;
  level: string;
  topic: string;
  text: string;
  onNewText?: () => void;
}

export function CTestView({ title, level, topic, text, onNewText }: CTestViewProps) {
  const tokens = useMemo<Token[]>(() => buildCTest(text), [text]);
  const gaps = useMemo(() => tokens.filter((t) => t.type === "gap") as Extract<Token, { type: "gap" }>[], [tokens]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hintActive, setHintActive] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Reset when text changes
  useEffect(() => {
    setAnswers({});
    setStatuses({});
    setFocusedId(null);
    setHintActive(false);
  }, [text]);

  // Release hint on global mouse/touch up or key up
  useEffect(() => {
    if (!hintActive) return;
    const release = () => setHintActive(false);
    window.addEventListener("mouseup", release);
    window.addEventListener("touchend", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("mouseup", release);
      window.removeEventListener("touchend", release);
      window.removeEventListener("blur", release);
    };
  }, [hintActive]);

  const filledCount = gaps.filter((g) => (answers[g.id] ?? "").length === g.answer.length).length;
  const progress = gaps.length === 0 ? 0 : Math.round((filledCount / gaps.length) * 100);

  const correctCount = gaps.filter((g) => statuses[g.id] === "correct").length;
  const checked = Object.values(statuses).some((s) => s === "correct" || s === "incorrect");

  const handleChange = (id: string, value: string, max: number) => {
    const sliced = value.slice(0, max);
    setAnswers((a) => ({ ...a, [id]: sliced }));
    setStatuses((s) => (s[id] ? { ...s, [id]: "idle" } : s));
    // No auto-advance: user navigates manually with Tab/Click.
  };

  const checkAnswers = () => {
    const next: Record<string, Status> = {};
    gaps.forEach((g) => {
      const v = (answers[g.id] ?? "").trim();
      if (v.length === 0) {
        next[g.id] = "idle";
      } else {
        next[g.id] = v.toLowerCase() === g.answer.toLowerCase() ? "correct" : "incorrect";
      }
    });
    setStatuses(next);
  };

  const showSolution = () => {
    const nextAns: Record<string, string> = {};
    const nextStat: Record<string, Status> = {};
    gaps.forEach((g) => {
      nextAns[g.id] = g.answer;
      nextStat[g.id] = "revealed";
    });
    setAnswers(nextAns);
    setStatuses(nextStat);
  };

  const reset = () => {
    setAnswers({});
    setStatuses({});
    const first = gaps[0];
    if (first) inputRefs.current[first.id]?.focus();
  };

  const focusedGap = focusedId ? gaps.find((g) => g.id === focusedId) : undefined;

  // Press-and-hold hint handlers
  const startHint = (e: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
    e.preventDefault();
    setHintActive(true);
  };
  const stopHint = () => setHintActive(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="font-medium">{level}</Badge>
            <Badge variant="outline" className="font-medium">{topic}</Badge>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Fülle die fehlenden Buchstaben jedes zweiten Wortes ein.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={checkAnswers} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Antworten prüfen
          </Button>
          <Button
            variant="secondary"
            onMouseDown={startHint}
            onMouseUp={stopHint}
            onMouseLeave={stopHint}
            onTouchStart={startHint}
            onTouchEnd={stopHint}
            onKeyDown={(e) => {
              if ((e.key === " " || e.key === "Enter") && !hintActive) {
                e.preventDefault();
                setHintActive(true);
              }
            }}
            onKeyUp={(e) => {
              if (e.key === " " || e.key === "Enter") setHintActive(false);
            }}
            disabled={!focusedGap}
            className={cn("gap-2 select-none", hintActive && "ring-2 ring-accent")}
            title={focusedGap ? "Halten, um den Tipp zu sehen" : "Erst eine Lücke anklicken"}
          >
            <Lightbulb className="h-4 w-4" />
            Tipp halten
          </Button>
          <Button variant="outline" onClick={showSolution} className="gap-2">
            <Eye className="h-4 w-4" />
            Lösung zeigen
          </Button>
          <Button variant="ghost" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Zurücksetzen
          </Button>
          {onNewText && (
            <Button variant="ghost" onClick={onNewText} className="gap-2">
              <FilePlus2 className="h-4 w-4" />
              Neuer Text
            </Button>
          )}
        </div>
      </header>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Fortschritt
          </span>
          <span className="font-medium tabular-nums">
            {filledCount} / {gaps.length} ausgefüllt
            {checked && (
              <span className="ml-3 text-success">
                · {correctCount} richtig
              </span>
            )}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <article
        className="rounded-xl border border-border bg-card p-6 md:p-10 shadow-sm leading-[2.4] text-lg font-display text-card-foreground"
        style={{ hyphens: "manual" }}
      >
        {tokens.map((tok, i) => {
          if (tok.type === "text") return <span key={i}>{tok.value}</span>;
          const status = statuses[tok.id] ?? "idle";
          const value = answers[tok.id] ?? "";
          // Fixed width based on answer length so layout doesn't jump.
          const widthCh = tok.answer.length + 1.2;
          const showHint = hintActive && focusedId === tok.id;
          return (
            <span
              key={tok.id}
              className="relative inline-flex items-baseline whitespace-nowrap"
            >
              <span className="font-display">{tok.prefix}</span>
              <span
                className="relative inline-block"
                style={{ width: `${widthCh}ch` }}
              >
                <input
                  ref={(el) => (inputRefs.current[tok.id] = el)}
                  type="text"
                  value={value}
                  maxLength={tok.answer.length}
                  onChange={(e) => handleChange(tok.id, e.target.value, tok.answer.length)}
                  onFocus={() => setFocusedId(tok.id)}
                  onBlur={() => setFocusedId((cur) => (cur === tok.id ? null : cur))}
                  aria-label={`Fehlende Buchstaben für ${tok.prefix}…`}
                  className={cn("ctest-input font-sans text-base w-full", status)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                {showHint && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-9 z-20 rounded-md border border-accent/40 bg-popover px-2 py-1 text-xs font-sans font-medium tracking-wide text-accent-foreground shadow-md animate-in fade-in-0 zoom-in-95 duration-150"
                  >
                    {tok.answer}
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 h-2 w-2 rotate-45 border-r border-b border-accent/40 bg-popover" />
                  </span>
                )}
              </span>
            </span>
          );
        })}
      </article>
    </div>
  );
}
