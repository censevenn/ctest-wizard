# German C-Test Trainer

A focused web app for **Studienkolleg applicants** to practice German **C-Tests** — the gap-fill format used in many entrance exams where every second word from the second sentence onward is missing its second half.

> Built with React, Vite, Tailwind CSS, and Lovable Cloud (Supabase + AI Gateway).

## ✨ Features

- **AI text generation** — One-click generation of fresh B2/C1 academic German texts on rotating topics (science, history, environment, university life in Germany, …). Powered by Lovable AI (Google Gemini / OpenAI GPT) via a serverless edge function.
- **Custom text input** — Paste any German text and instantly turn it into a C-Test.
- **Faithful C-Test rules** — First sentence stays full; from the second sentence on, every second word is truncated. Words with even length keep `n/2` letters; odd-length words keep `floor(n/2)` (so more than half is hidden).
- **Peek hint** — Press and hold the *"Tipp halten"* button to reveal the answer for the focused gap as a tooltip — without overwriting what you've already typed.
- **No surprise jumps** — Inputs use `maxLength` only; focus does not auto-advance, so you stay in control. Tab / click to navigate.
- **Stable layout** — Inputs have a fixed `ch`-based width matching the answer length; tooltips animate in without shifting the text.
- **Personal library** — AI-generated and custom texts are saved to your browser (`localStorage`) so you can revisit and continue practicing later.
- **Live progress + checking** — Real-time fill progress, per-gap correct/incorrect feedback, full-solution reveal, one-click reset.
- **Academic UI** — Inter + Fraunces typography, warm-paper palette, dark sidebar — no AI-generic gradient look.

## 🧱 Tech stack

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui, lucide-react, sonner
- **Backend**: Lovable Cloud (Supabase) edge function `generate-ctest`
- **AI**: Lovable AI Gateway (`google/gemini-3-flash-preview` by default), structured output via tool calling

## 🚀 Getting started

```bash
# install
npm install

# run dev server
npm run dev

# build
npm run build
```

The `.env` file with backend credentials is auto-managed when running on Lovable.
For self-hosted setups you need:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

…and a `LOVABLE_API_KEY` secret on the backend that the `generate-ctest`
edge function uses to reach the AI gateway.

## 🗂 Project structure

```
src/
  components/
    AppHeader.tsx         # Top bar with AI / custom-text actions
    CTestView.tsx         # Interactive C-Test renderer + hint system
    CustomTextEditor.tsx  # Paste-your-own-text view
    Sidebar.tsx           # Sample texts, library, custom-text entry
  data/
    sampleTexts.ts        # Pre-loaded B2/C1 sample texts
  lib/
    ctest.ts              # Tokenizer + truncation logic
    library.ts            # localStorage-backed user library
  pages/
    Index.tsx             # App shell

supabase/functions/
  generate-ctest/         # Edge function calling Lovable AI
```

## 🧪 C-Test rules (recap)

- First sentence: untouched (orientation).
- From the second sentence onward, every **2nd word** is truncated.
- For a word of length `n`, keep `floor(n/2)` letters; the rest is the gap.
- Examples: `Hase` (4) → `Ha` + `se`, `Apfel` (5) → `Ap` + `fel`,
  `Deutschland` (11) → `Deuts` + `chland`, `ist` (3) → `i` + `st`.
- Single-letter words and punctuation are never truncated.

## 🤝 Contributing

Issues and PRs welcome. Suggested areas:
- More curated B2/C1 sample texts
- Timed practice mode
- Statistics / streaks
- Export practice sessions

## 📄 License

MIT
