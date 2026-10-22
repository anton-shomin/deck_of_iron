# AGENTS.md

## Project Overview
DECK OF IRON: card-deck workout PWA. Suit = exercise, rank = reps. Logic lives in `src/engine` (pure TS), UI in `src/ui`.

## Tech Stack
- TypeScript, React 19, Vite, Tailwind v4, lucide-react, motion
- Tests: `src/engine/engine.test.ts`

## Code Conventions
- Never put game rules in UI components; they belong in `src/engine`.
- UI strings go through `src/data/translations.ts` (RU and EN).
- Visual rules: `docs/design/DESIGN.md`.

## Build & Deploy
- Dev: `npm run dev`
- Check: `npm run lint` and `npm run build`
