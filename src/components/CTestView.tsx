import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
} from "react";
import { buildCTest, type Token } from "@/lib/ctest";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Eye,
  RotateCcw,
  Sparkles,
  FilePlus2,
  Lightbulb,
  Pause,
  Play,
  Loader2,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useExerciseTimer, formatMs } from "@/hooks/useExerciseTimer";
import { mapTextToWordSpans } from "@/lib/textWordSpans";
import {
  fetchGermanDictionary,
  type DictionaryResult,
  dudenSearchUrl,
  leoSearchUrl,
  verbformenSearchUrl,
} from "@/lib/dictionary";

type Status = "idle" | "correct" | "incorrect" | "revealed";

type DisplayMode = "correct" | "user";

export type CheckCompleteStats = {
  correct: number;
  total: number;
  accuracyPercent: number;
  allGapsFilled: boolean;
  durationSeconds: number | null;
};

interface CTestViewProps {
  exerciseId: string;
  title: string;
  level: string;
  topic: string;
  text: string;
  onNewText?: () => void;
  onCheckComplete?: (stats: CheckCompleteStats) => void;
}

export function CTestView({
  exerciseId,
  title,
  level,
  topic,
  text,
  onNewText,
  onCheckComplete,
}: CTestViewProps) {
  const tokens = useMemo<Token[]>(() => buildCTest(text), [text]);
  const gaps = useMemo(
    () => tokens.filter((t) => t.type === "gap") as Extract<Token, { type: "gap" }>[],
    [tokens]
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hintActive, setHintActive] = useState(false);
  const [resultsChecked, setResultsChecked] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("correct");
  const [answersAtCheck, setAnswersAtCheck] = useState<Record<string, string> | null>(null);
  const [stepByStep, setStepByStep] = useState(false);
  const [altHint, setAltHint] = useState(false);
  const [explainOpen, setExplainOpen] = useState<string | null>(null);
  const [explainText, setExplainText] = useState<Record<string, string>>({});
  const [explainLoading, setExplainLoading] = useState<string | null>(null);

  const [exercisePaused, setExercisePaused] = useState(false);
  const timer = useExerciseTimer({ paused: exercisePaused });

  const [dictAnchor, setDictAnchor] = useState<{ word: string; x: number; y: number } | null>(null);
  const [dictResult, setDictResult] = useState<DictionaryResult | null>(null);
  const [dictLoading, setDictLoading] = useState(false);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setAnswers({});
    setStatuses({});
    setFocusedId(null);
    setHintActive(false);
    setResultsChecked(false);
    setDisplayMode("correct");
    setAnswersAtCheck(null);
    setExercisePaused(false);
    timer.reset();
    setDictAnchor(null);
    setDictResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when exercise changes
  }, [text, exerciseId]);

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

  // Alt key reveals first letter "Tipp" for the focused gap
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") setAltHint(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setAltHint(false);
    };
    const onBlur = () => setAltHint(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    if (!dictAnchor) {
      setDictResult(null);
      return;
    }
    let cancelled = false;
    setDictLoading(true);
    setDictResult(null);
    void fetchGermanDictionary(dictAnchor.word).then((r) => {
      if (!cancelled) {
        setDictResult(r);
        setDictLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dictAnchor?.word]);

  useEffect(() => {
    if (!dictAnchor) return;
    const close = (e: globalThis.MouseEvent) => {
      const t = e.target as Node;
      const el = document.getElementById("ctest-dict-popover");
      if (el?.contains(t)) return;
      setDictAnchor(null);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [dictAnchor]);

  const openDictionary = useCallback((word: string, clientX: number, clientY: number) => {
    const w = word.trim();
    if (!w) return;
    setDictAnchor({ word: w, x: clientX, y: clientY });
  }, []);

  const filledCount = gaps.filter((g) => (answers[g.id] ?? "").trim().length > 0).length;
  const progress = gaps.length === 0 ? 0 : Math.round((filledCount / gaps.length) * 100);

  const correctCount = gaps.filter((g) => statuses[g.id] === "correct").length;
  const hasEvaluated = Object.values(statuses).some((s) => s === "correct" || s === "incorrect");

  const avgMsPerGap =
    filledCount > 0 && timer.active ? Math.round(timer.elapsedMs / filledCount) : null;

  const handleChange = (id: string, value: string) => {
    if (resultsChecked) return;
    if (!timer.active) timer.start();
    setAnswers((a) => ({ ...a, [id]: value }));
    const gap = gaps.find((g) => g.id === id);
    if (stepByStep && gap) {
      if (value.length === gap.answer.length) {
        if (value === gap.answer) {
          setStatuses((s) => ({ ...s, [id]: "correct" }));
          // Advance to next gap
          const idx = gaps.findIndex((g) => g.id === id);
          const next = gaps.slice(idx + 1).find((g) => statuses[g.id] !== "correct");
          if (next) setTimeout(() => inputRefs.current[next.id]?.focus(), 50);
        } else {
          setStatuses((s) => ({ ...s, [id]: "incorrect" }));
        }
      } else {
        setStatuses((s) => (s[id] ? { ...s, [id]: "idle" } : s));
      }
    } else {
      setStatuses((s) => (s[id] ? { ...s, [id]: "idle" } : s));
    }
  };

  const checkAnswers = () => {
    const next: Record<string, Status> = {};
    gaps.forEach((g) => {
      const v = answers[g.id] ?? "";
      if (v.length === 0) {
        next[g.id] = "idle";
      } else {
        next[g.id] = v === g.answer ? "correct" : "incorrect";
      }
    });
    setStatuses(next);
    setAnswersAtCheck({ ...answers });
    setResultsChecked(true);
    setDisplayMode("correct");

    const total = gaps.length;
    const correct = gaps.filter((g) => next[g.id] === "correct").length;
    const answered = gaps.filter((g) => (answers[g.id] ?? "").trim().length > 0).length;
    const allGapsFilled = answered === total && total > 0;
    const accuracyPercent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const durationSeconds =
      timer.active && allGapsFilled ? Math.max(1, Math.round(timer.elapsedMs / 1000)) : null;

    onCheckComplete?.({
      correct,
      total,
      accuracyPercent,
      allGapsFilled,
      durationSeconds: allGapsFilled ? durationSeconds : null,
    });
  };

  const toggleResultView = () => {
    if (!resultsChecked) return;
    setDisplayMode((m) => (m === "correct" ? "user" : "correct"));
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
    setResultsChecked(false);
    setAnswersAtCheck(null);
    setDisplayMode("correct");
  };

  const reset = () => {
    setAnswers({});
    setStatuses({});
    setResultsChecked(false);
    setAnswersAtCheck(null);
    setDisplayMode("correct");
    setExercisePaused(false);
    timer.reset();
    const first = gaps[0];
    if (first) inputRefs.current[first.id]?.focus();
  };

  const focusedGap = focusedId ? gaps.find((g) => g.id === focusedId) : undefined;

  const startHint = (e: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
    e.preventDefault();
    setHintActive(true);
  };
  const stopHint = () => setHintActive(false);

  const inputValueForGap = (tok: Extract<Token, { type: "gap" }>): string => {
    if (!resultsChecked) return answers[tok.id] ?? "";
    if (displayMode === "correct") return tok.answer;
    return answersAtCheck?.[tok.id] ?? answers[tok.id] ?? "";
  };

  const inputClassForGap = (tok: Extract<Token, { type: "gap" }>): string => {
    const status = statuses[tok.id] ?? "idle";
    if (!resultsChecked) {
      if (status === "idle") return "";
      return status;
    }

    if (displayMode === "correct") {
      if (status === "revealed") return "revealed";
      if (status === "idle") return "";
      return status === "correct" ? "correct" : "incorrect";
    }

    if (status === "correct") return "user-mirror-ok";
    if (status === "incorrect") return "user-mirror-wrong";
    if (status === "revealed") return "revealed";
    return "";
  };

  const readOnlyInputs = resultsChecked;

  const popLeft = dictAnchor
    ? Math.min(window.innerWidth - 320, Math.max(8, dictAnchor.x - 160))
    : 0;
  const popTop = dictAnchor ? Math.min(window.innerHeight - 240, dictAnchor.y + 12) : 0;

  return (
    <div className="space-y-6 relative">
      <div
        className={cn(
          "fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 rounded-xl border border-border bg-card/95 dark:bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm",
          timer.overRecommended && "border-amber-500/60 shadow-amber-500/20"
        )}
      >
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setExercisePaused((p) => !p)}
            title={exercisePaused ? "Weiter" : "Pause (Text unscharf)"}
          >
            {exercisePaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {exercisePaused ? "Weiter" : "Pause"}
          </Button>
          <div
            className={cn(
              "font-mono text-sm tabular-nums font-medium",
              timer.overRecommended ? "text-amber-600 dark:text-amber-400" : "text-foreground"
            )}
          >
            {formatMs(timer.elapsedMs)}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground text-right max-w-[200px] leading-snug">
          {timer.active ? (
            <>
              Ø pro Lücke:{" "}
              {avgMsPerGap != null ? `${(avgMsPerGap / 1000).toFixed(1)}s` : "—"}
              <br />
              Ziel: {formatMs(timer.recommendedMs)}
            </>
          ) : (
            <>Startet beim ersten Tippen in eine Lücke.</>
          )}
        </div>
      </div>

      {dictAnchor && (
        <div
          id="ctest-dict-popover"
          className="fixed z-50 w-[min(100vw-2rem,20rem)] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-xl"
          style={{ left: popLeft, top: popTop }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-accent shrink-0" />
            <span className="font-semibold text-sm truncate">{dictAnchor.word}</span>
          </div>
          {dictLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Wörterbuch…
            </div>
          )}
          {!dictLoading && dictResult?.ok && (
            <ul className="text-xs space-y-1.5 max-h-40 overflow-y-auto">
              {dictResult.meanings.map((m, i) => (
                <li key={i} className="leading-snug">
                  {m}
                </li>
              ))}
            </ul>
          )}
          {!dictLoading && dictResult && dictResult.ok === false && (
            <p className="text-xs text-muted-foreground mb-2">{dictResult.message}</p>
          )}
          {!dictLoading && dictResult && (() => {
            const word = dictResult.ok ? dictResult.word : dictResult.word;
            return (
              <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-border">
                <a
                  href={dudenSearchUrl(word)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent underline-offset-4 hover:underline"
                >
                  Duden <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={leoSearchUrl(word)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent underline-offset-4 hover:underline"
                >
                  LEO <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={verbformenSearchUrl(word)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent underline-offset-4 hover:underline"
                >
                  Verbformen (RU) <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            );
          })()}
        </div>
      )}

      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="font-medium">
              {level}
            </Badge>
            <Badge variant="outline" className="font-medium">
              {topic}
            </Badge>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Fülle die fehlenden Buchstaben jedes zweiten Wortes ein. Doppelklick oder langes Drücken
            auf ein Wort öffnet das Wörterbuch. <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">Alt</kbd> halten zeigt den ersten Buchstaben.
          </p>
          <label className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer">
            <input
              type="checkbox"
              checked={stepByStep}
              onChange={(e) => setStepByStep(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Schritt-für-Schritt-Modus (sofortiges Feedback)
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {!resultsChecked ? (
            <Button type="button" onClick={checkAnswers} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Antworten prüfen
            </Button>
          ) : (
            <Button type="button" onClick={toggleResultView} variant="secondary" className="gap-2">
              {displayMode === "correct" ? "Meine Eingaben" : "Korrekt anzeigen"}
            </Button>
          )}
          <Button
            type="button"
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
            disabled={!focusedGap || resultsChecked}
            className={cn("gap-2 select-none", hintActive && "ring-2 ring-accent")}
            title={focusedGap ? "Halten, um den Tipp zu sehen" : "Erst eine Lücke anklicken"}
          >
            <Lightbulb className="h-4 w-4" />
            Tipp halten
          </Button>
          <Button type="button" variant="outline" onClick={showSolution} className="gap-2">
            <Eye className="h-4 w-4" />
            Lösung zeigen
          </Button>
          <Button type="button" variant="ghost" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Zurücksetzen
          </Button>
          {onNewText && (
            <Button type="button" variant="ghost" onClick={onNewText} className="gap-2">
              <FilePlus2 className="h-4 w-4" />
              Neuer Text
            </Button>
          )}
        </div>
      </header>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm dark:bg-card">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Fortschritt
          </span>
          <span className="font-medium tabular-nums">
            {filledCount} / {gaps.length} ausgefüllt
            {hasEvaluated && (
              <span className="ml-3 text-success">
                · {correctCount} richtig
              </span>
            )}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <article
        className={cn(
          "relative rounded-xl border border-border bg-card p-6 md:p-10 shadow-sm leading-[2.4] text-lg font-display text-card-foreground transition-[filter]",
          exercisePaused && "select-none blur-md pointer-events-none"
        )}
        style={{ hyphens: "manual" }}
      >
        {exercisePaused && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/40 dark:bg-background/50 pointer-events-auto">
            <p className="text-sm font-medium text-muted-foreground bg-card/90 px-4 py-2 rounded-lg border border-border shadow-sm pointer-events-none">
              Pausiert — Text verborgen
            </p>
          </div>
        )}
        {tokens.map((tok, i) => {
          if (tok.type === "text") {
            return (
              <span key={`t-${i}`}>
                {mapTextToWordSpans(tok.value, `tx-${i}`, (word, _tr, pos) => {
                  openDictionary(word, pos.x, pos.y);
                })}
              </span>
            );
          }
          const value = inputValueForGap(tok);
          const widthCh = Math.max(tok.answer.length, value.length) + 1.25;
          const showHint = hintActive && focusedId === tok.id && !resultsChecked;
          const showAltHint = altHint && focusedId === tok.id && !resultsChecked && !hintActive;
          const status = statuses[tok.id];
          const showExplain = resultsChecked && status === "incorrect";
          const gapLookup = (e: MouseEvent | TouchEvent) => {
            const cx = "clientX" in e ? e.clientX : 0;
            const cy = "clientY" in e ? e.clientY : 0;
            openDictionary(tok.original, cx, cy);
          };
          return (
            <GapCluster
              gapKey={tok.id}
              onLookup={(clientX, clientY) => openDictionary(tok.original, clientX, clientY)}
              prefixEl={<span className="font-display">{tok.prefix}</span>}
              inputEl={
                <span
                  className="relative inline-block align-baseline"
                  style={{ minWidth: `${tok.answer.length + 1.25}ch`, width: `${widthCh}ch` }}
                >
                  <input
                    ref={(el) => (inputRefs.current[tok.id] = el)}
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(tok.id, e.target.value)}
                    onFocus={() => setFocusedId(tok.id)}
                    onBlur={() => setFocusedId((cur) => (cur === tok.id ? null : cur))}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      gapLookup(e);
                    }}
                    readOnly={readOnlyInputs}
                    aria-label={`Fehlende Buchstaben für ${tok.prefix}… (${tok.original})`}
                    className={cn(
                      "ctest-input font-sans text-base w-full max-w-none box-border",
                      inputClassForGap(tok)
                    )}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                  {showHint && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-9 z-20 rounded-md border border-accent/40 bg-popover px-2 py-1 text-xs font-sans font-medium tracking-wide text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 duration-150"
                    >
                      {tok.answer}
                      <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 h-2 w-2 rotate-45 border-r border-b border-accent/40 bg-popover" />
                    </span>
                  )}
                  {showAltHint && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-9 z-20 rounded-md border border-primary/40 bg-popover px-2 py-1 text-xs font-sans font-medium tracking-wide text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 duration-150"
                    >
                      Tipp: {tok.answer.charAt(0)}…
                      <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 h-2 w-2 rotate-45 border-r border-b border-primary/40 bg-popover" />
                    </span>
                  )}
                  {showExplain && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void requestExplanation(tok.id, tok.original, answersAtCheck?.[tok.id] ?? "");
                      }}
                      title="Erklärung anzeigen"
                      className="absolute -top-2 -right-2 z-20 inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow"
                    >
                      i
                    </button>
                  )}
                  {showExplain && explainOpen === tok.id && (
                    <span
                      role="tooltip"
                      className="absolute left-1/2 -translate-x-1/2 top-7 z-30 w-64 max-w-[16rem] rounded-md border border-border bg-popover px-3 py-2 text-xs font-sans text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-150 whitespace-normal"
                    >
                      {explainLoading === tok.id ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" /> Erklärung lädt…
                        </span>
                      ) : (
                        explainText[tok.id] ?? "Keine Erklärung verfügbar."
                      )}
                      <button
                        type="button"
                        onClick={() => setExplainOpen(null)}
                        className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-card border border-border text-[10px] leading-none"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </span>
              }
            />
          );
        })}
      </article>
    </div>
  );
}

function GapCluster({
  gapKey,
  onLookup,
  prefixEl,
  inputEl,
}: {
  gapKey: string;
  onLookup: (clientX: number, clientY: number) => void;
  prefixEl: ReactNode;
  inputEl: ReactNode;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchRef = useRef({ x: 0, y: 0 });

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => clear, [gapKey]);

  return (
    <span
      className="relative inline-flex items-baseline whitespace-nowrap"
      onDoubleClick={(e) => {
        onLookup(e.clientX, e.clientY);
      }}
    >
      <span
        className="cursor-help rounded-sm underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 hover:bg-muted/60 dark:hover:bg-muted/30"
        onDoubleClick={(e) => {
          e.stopPropagation();
          onLookup(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) touchRef.current = { x: t.clientX, y: t.clientY };
          clear();
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            onLookup(touchRef.current.x, touchRef.current.y);
          }, 550);
        }}
        onTouchEnd={clear}
        onTouchCancel={clear}
      >
        {prefixEl}
      </span>
      {inputEl}
    </span>
  );
}
