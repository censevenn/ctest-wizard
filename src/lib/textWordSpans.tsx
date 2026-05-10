import { useCallback, useRef, type ReactNode, type TouchEvent } from "react";

/** Word-like chunk for dictionary lookup (letters, combining marks, hyphen/apostrophe compounds). */
const WORD_CHUNK = /[\p{L}\p{M}]+(?:[-'][\p{L}\p{M}]+)*/gu;

export type LookupTrigger = "double" | "long";

export type LookupPosition = { x: number; y: number };

function SelectableWord({
  word,
  onLookup,
  longPressMs,
}: {
  word: string;
  onLookup: (w: string, trigger: LookupTrigger, pos: LookupPosition) => void;
  longPressMs: number;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<LookupPosition>({ x: 0, y: 0 });

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        onLookup(word, "long", touchStartRef.current);
      }, longPressMs);
    },
    [clearTimer, longPressMs, onLookup, word]
  );

  return (
    <span
      className="cursor-help rounded-sm hover:bg-muted/60 dark:hover:bg-muted/30"
      onDoubleClick={(e) => {
        e.preventDefault();
        clearTimer();
        onLookup(word, "double", { x: e.clientX, y: e.clientY });
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={clearTimer}
      onTouchCancel={clearTimer}
    >
      {word}
    </span>
  );
}

/**
 * Splits plain text into runs of word spans (double-click / long-press) and plain text.
 */
export function mapTextToWordSpans(
  value: string,
  keyPrefix: string,
  onLookup: (word: string, trigger: LookupTrigger, pos: LookupPosition) => void,
  opts?: { longPressMs?: number }
): ReactNode[] {
  const longPressMs = opts?.longPressMs ?? 550;
  const out: ReactNode[] = [];
  let last = 0;
  let localIdx = 0;
  const re = new RegExp(WORD_CHUNK.source, WORD_CHUNK.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    if (m.index > last) {
      out.push(<span key={`${keyPrefix}-g-${localIdx++}`}>{value.slice(last, m.index)}</span>);
    }
    const w = m[0];
    out.push(
      <SelectableWord
        key={`${keyPrefix}-w-${localIdx++}`}
        word={w}
        onLookup={onLookup}
        longPressMs={longPressMs}
      />
    );
    last = m.index + w.length;
  }
  if (last < value.length) {
    out.push(<span key={`${keyPrefix}-g-${localIdx++}`}>{value.slice(last)}</span>);
  }
  return out;
}
