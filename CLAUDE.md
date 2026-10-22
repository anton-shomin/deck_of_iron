# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

DECK OF IRON is a card-deck workout app: each suit is an exercise slot, each card's rank is the rep count. The current implementation is a React PWA (TypeScript, React 19, Vite, Tailwind v4, lucide-react, motion). UI language defaults to Russian, with English as the second locale.

**Direction:** the project is being reworked into a native Android app (Kotlin + Jetpack Compose) in `android/`; see "Android app" below. New features go into the Android app; the PWA stays in the repo as the reference and the source of the shared exercise data.

## Android app (`android/`)

Stack: AGP 9.1 with built-in Kotlin (KGP pinned to 2.4.21 via `buildscript` classpath because supabase-kt 3.8 is built with Kotlin 2.4), Compose BOM 2026.06, Room, DataStore, supabase-kt (auth + postgrest) over Ktor OkHttp. supabase-kt must stay ≥ 3.7: older versions send the new `sb_publishable_…` key as a Bearer token, and legacy anon keys are deprecated. compileSdk is 36: newer AndroidX releases (Compose 1.12, core 1.19, lifecycle 2.11) require compileSdk 37, so don't bump them without installing that platform.

```bash
cd android
./gradlew :app:assembleDebug
./gradlew :app:testDebugUnitTest                                         # JVM unit tests
./gradlew :app:testDebugUnitTest --tests "com.deckofiron.domain.DeckTest" # one class
./gradlew :app:installDebug                                              # needs a running emulator/device
```
Use JDK 17+ (`JAVA_HOME=$(/usr/libexec/java_home -v 21)` on this machine).

- `app/src/main/java/com/deckofiron/domain/`: pure Kotlin game rules (no Android imports); the TS engine rules above, ported. Tests in `app/src/test/.../domain/` port `engine.test.ts`.
- **Jokers differ from the PWA**: `JokerTask` (plank, wall sit, burpees, kettlebell thrusters, 15 reps of a suit) can be assigned to either colour in any mode via `JokerSettings`; the colour only picks the slot. Deck placement rules come from the task (`forbiddenPrecedingSuit`: plank not after ♣, wall sit not after ♥, suit reps not after that suit), not from the colour. "Random suit" is fixed when the deck is dealt (`JokerSettings.resolved`).
- `WorkoutSession` holds all live workout state and is persisted to DataStore (card changes + every 5 s), so a killed app resumes the workout. `ui/AppViewModel.kt` drives the flow and the rest/joker countdowns; persistence writes are chained on `AppContainer.appScope` so a late save can't resurrect a cleared session.
- History is offline-first (`data/history/`): `HistoryRepository.record` writes to Room as pending, `sync()` uploads pending rows, then pulls the cloud copy; `clear()` takes the sync lock and sets a persisted "remote clear pending" flag. `AppViewModel.finishWorkout` records the workout before clearing the saved session (same write chain) and reports a per-workout `SaveStatus` to the summary screen. Supabase is optional: without `SUPABASE_URL` / `SUPABASE_ANON_KEY` (publishable `sb_publishable_…` key or legacy anon key) in `android/local.properties` (→ `BuildConfig`), sync is `Disabled` and history stays local.
- Supabase schema: `supabase/migrations/` (table `workout_history`, RLS by `auth.uid()`). The app signs users in anonymously, so "Allow anonymous sign-ins" must be enabled in the project.
- `exercises.json` / `presets.json` are not copied into `android/`: the `syncWorkoutData` Gradle task packs `../src/data/*.json` into the APK assets, so edit them in `src/data/`.
- UI strings: `res/values/strings.xml` is Russian (default), `res/values-en/` English; the RU/EN switch uses AppCompat per-app locales. Exercise names come from the `*Ru`/`*En` fields via `ui/Labels.kt`.
- Display font falls back to the system `sans-serif-condensed`; Fira Sans is only available as woff2 in the web build.

## Commands (web PWA)

The lockfile is `bun.lock`, but the scripts are invoked through npm (see `AGENTS.md`).

```bash
npm run dev                          # Vite on port 3000, host 0.0.0.0 (PWA service worker enabled in dev)
npm run build                        # production build to dist/
npm run lint                         # tsc --noEmit (type check only, no ESLint)
npx tsx src/engine/engine.test.ts    # engine tests
```

There is no test framework. `engine.test.ts` is a plain script that runs every check in sequence and throws on the first failure, so running a single test means temporarily editing `runTests()`. The randomized checks (joker placement, safety rules) loop over 50 to 100 generated decks.

## Architecture

### Layers (per AGENTS.md)
- `src/engine/`: pure TS game rules with no DOM access. Game rules must never live in UI components.
- `src/platform/`: thin wrappers over browser APIs. This is the layer that needs native replacements in the port.
- `src/ui/screens`, `src/ui/components`: presentational React. `src/App.tsx` owns top-level state.
- `src/data/`: `exercises.json` (31 exercises), `presets.json`, `translations.ts` (UI strings in RU and EN; every new UI string goes here).
- `src/types/index.ts`: the shared domain model (`Card`, `Exercise`, `SessionConfig`, `JokerSettings`, `WorkoutHistoryEntry`).

### Domain rules
- Suits: `S` = push/upper body, `H` = squat/legs, `D` = hinge/posterior chain, `C` = core. `SessionConfig.loads[suit]` maps each suit to an `exerciseId`, a kg weight and a kettlebell count (1 or 2).
- Reps: 2–9 count at face value, 10/J/Q/K count as 10, Ace is 1 or 11 (`aceValue`). A clean deck with Ace = 11 totals 380 reps.
- Modes are `BODY`, `KETTLEBELL` and `CUSTOM`. Tonnage (`kg × reps × count`) only counts in `KETTLEBELL` mode.
- `createDeck` (in `deck.ts`) shuffles the deck, then inserts 0, 1 or 2 jokers. Jokers only go at indices 26–41. With two jokers there is one RED and one BLACK, with at least 7 cards between them.
- `balanceDeckSafety` (in `safety.ts`) is a randomized swap search (up to 5000 iterations) that minimizes a weighted violation score. The scored rules are:
  - never 3 of the same suit in a row
  - no 2 same-suit cards in a row when either card has ≥10 reps
  - a RED joker (plank) never directly after `C`
  - a BLACK joker (wall sit) never directly after `H`
  - in kettlebell mode, at least one card with ≤6 reps between heavy `S`/`H`/`D` cards (≥10 reps)

  `createDeck` balances with kettlebell mode off. `App.handleStartWorkout` then runs `applyHeavyLoadGap` to apply the kettlebell rule. `applyHeavyLoadGap` has a special path for arrays of 4 cards or fewer, which exists only for the test fixtures.
- Jokers (`jokers.ts`):
  - RED is a timed forearm plank. In Beast Mode it can be 1, 2 or 5 min; otherwise it is 1 min.
  - BLACK resolves through `getBlackJokerTask` to `THRUSTERS`, `BURPEES`, `WALL_SIT` (timed) or `SUIT_15`. Without Beast Mode and without a configured choice, it falls back to 15 reps of a random suit's exercise.
  - Reps and tonnage from jokers are added to the stats by the joker modal.
- `rng` is injectable in `deck.ts` and `safety.ts`, but `getBlackJokerTask` calls `Math.random` directly.

### Screen flow and state
- There is no router. `App.tsx` switches `currentScreen` between `TABLE` (setup), `WORKOUT` (`WorkoutHUD`) and `SUMMARY`. `HistoryModal` and `OfflineIndicator` are global overlays.
- `WorkoutHUD` owns the live session. It tracks the current card, an elapsed-seconds timer and accumulated stats, updating them incrementally in `advanceCard`; it does not use `calculateProgressStats`.
- After every change, `WorkoutHUD` writes an `ActiveSessionBackup` to localStorage. On mount, `App` restores that backup and jumps straight into `WORKOUT`, which is how a session resumes after a reload.
- When the user taps Done:
  - on a joker card, the Red or Black joker modal opens;
  - if `restSeconds` is greater than 0, `RestOverlay` runs a countdown;
  - if `restSeconds` is `null` or 0 (manual mode), the HUD advances immediately.
- `SummaryScreen` saves a `WorkoutHistoryEntry` when it mounts.

### Platform layer (web APIs to replace in the native app)
- `storage.ts`:
  - localStorage keys `deck_of_iron_*_v1` hold the language, sound setting, active session and custom presets.
  - IndexedDB `DeckOfIronDB` / `workout_history` holds history, indexed by `timestamp`.
  - If IndexedDB fails, history falls back to a 50-entry list in localStorage.
- `audio.ts`: every sound (countdown beeps, card flip, gong, completion) is synthesized with the Web Audio API. There are no audio asset files.
- `haptics.ts`: `navigator.vibrate` patterns. Card = `[35,40,20]`, countdown = `25`, gong = `[100,50,150]`.
- `wakeLock.ts`: the Screen Wake Lock is held during a workout and re-acquired on `visibilitychange`.
- `usePWAInstall.ts`: the install prompt. It has no native counterpart.

### Localization
Bilingual text lives in three places, and all three need porting:
- `translations.ts`
- the `*Ru` / `*En` fields in the JSON data
- hardcoded RU/EN strings inside the engine helpers that take a `lang` argument (`jokers.ts`, `safety.ts`, `deck.ts`)

### Design
- Design tokens (colors and the Fira Sans / Fira Sans Extra Condensed fonts) are defined in the `@theme` block of `src/index.css`.
- Many components also hardcode the same hex values in Tailwind arbitrary classes, such as `bg-[#181614]`.
- `AGENTS.md` points to `docs/design/DESIGN.md`, but that file does not exist in the repo.

## Known quirks (don't port blindly)
- `WorkoutHUD` uses `getSideRuleNote` from `deck.ts`. That function checks for `'EACH_SIDE'`, which is not a `SideRule` value, so `PER_SIDE` exercises show no note. `getSideRuleBreakdown` in `safety.ts` handles `PER_SIDE` and the Navy SEAL burpee case correctly, but only the tests use it.
- `calculateDeckTotalReps` ignores its `jokersCount` argument, and `getRedJokerDurations` ignores `mode`.
- `loadCustomPresets` and `saveCustomPresets` are never called.
- AI Studio scaffold leftovers that `src/` never uses: the package name `react-example`, the `@google/genai`, `express` and `dotenv` dependencies, `GEMINI_API_KEY` in `.env.example`, and `metadata.json`. `vite.config.ts` disables HMR when `DISABLE_HMR=true`.
- `dev-dist/` is generated by vite-plugin-pwa dev mode but is tracked in git.
