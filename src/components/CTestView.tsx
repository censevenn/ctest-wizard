import { useEffect, useMemo, useRef, useState } from "react";
import { buildCTest, type Token } from "@/lib/ctest";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Eye, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "correct" | "incorrect" | "revealed";

interface CTestViewProps {
  title: string;
  level: string;
  topic: string;
  text: string;
}

export function CTestView({ title, level, topic, text }: CTestViewProps) {
  const tokens = useMemo<Token[]>(() => buildCTest(text), [text]);
  const gaps = useMemo(() => tokens.filter((t) => t.type === "gap") as Extract<Token, { type: "gap" }>[], [tokens]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Reset when text changes
  useEffect(() => {
    setAnswers({});
    setStatuses({});
  }, [text]);

  const filledCount = gaps.filter((g) => (answers[g.id] ?? "").length === g.answer.length).length;
  const progress = gaps.length === 0 ? 0 : Math.round((filledCount / gaps.length) * 100);

  const correctCount = gaps.filter((g) => statuses[g.id] === "correct").length;
  const checked = Object.values(statuses).some((s) => s === "correct" || s === "incorrect");

  const handleChange = (id: string, value: string, max: number) => {
    const sliced = value.slice(0, max);
    setAnswers((a) => ({ ...a, [id]: sliced }));
    // clear status while typing
    setStatuses((s) => (s[id] ? { ...s, [id]: "idle" } : s));

    // auto-advance to next gap when filled
    if (sliced.length === max) {
      const idx = gaps.findIndex((g) => g.id === id);
      const next = gaps[idx + 1];
      if (next) inputRefs.current[next.id]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Backspace" && (answers[id] ?? "").length === 0) {
      const idx = gaps.findIndex((g) => g.id === id);
      const prev = gaps[idx - 1];
      if (prev) inputRefs.current[prev.id]?.focus();
    }
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
          <Button variant="outline" onClick={showSolution} className="gap-2">
            <Eye className="h-4 w-4" />
            Lösung zeigen
          </Button>
          <Button variant="ghost" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Zurücksetzen
          </Button>
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
          const widthCh = Math.max(tok.answer.length, 2) + 0.5;
          return (
            <span key={tok.id} className="inline-flex items-baseline whitespace-nowrap">
              <span className="font-display">{tok.prefix}</span>
              <input
                ref={(el) => (inputRefs.current[tok.id] = el)}
                type="text"
                value={value}
                maxLength={tok.answer.length}
                onChange={(e) => handleChange(tok.id, e.target.value, tok.answer.length)}
                onKeyDown={(e) => handleKeyDown(e, tok.id)}
                aria-label={`Fehlende Buchstaben für ${tok.prefix}…`}
                className={cn("ctest-input font-sans text-base", status)}
                style={{ width: `${widthCh}ch` }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </span>
          );
        })}
      </article>
    </div>
  );
}
