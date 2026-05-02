# C-Test Trainer

Web app for **Studienkolleg** applicants to practice German **C-Tests** — the gap-fill format where every second word from the second sentence onward loses its second half.

## Features

- **AI text generation** — B2/C1 academic German texts via Supabase Edge Function (configurable chat API).
- **Custom text** — Paste any German text and practice.
- **Hints & checking** — Per-gap feedback, solution reveal, library in `localStorage`.

## GitHub Pages

`vite.config.ts` uses `base: '/ctest-wizard/'` for `https://<user>.github.io/ctest-wizard/`.  
Build: `npm run build`, deploy the `dist` folder.  
`BrowserRouter` uses `import.meta.env.BASE_URL` as `basename`.

## Tech stack

React 18, Vite 5, TypeScript, Tailwind CSS, Supabase, Sonner.

## Setup

```bash
npm install
npm run dev
npm run build
```

### Environment

Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.

Edge function: `AI_GATEWAY_API_KEY` (or legacy `LOVABLE_API_KEY`), optional `AI_GATEWAY_URL`.

## License

MIT
