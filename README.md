# Smart Campus Room Availability Checker

A one-page React + TypeScript (Vite) app. A student selects one fictional room, enters the current time and a start/end time, and gets **Available / Unavailable** with a reason. The page never creates or saves a booking. No login, database, backend, secrets or external services.

## Setup
```bash
npm install          # uses the committed package-lock.json
```
No environment variables are needed, so there is no `.env` / `.env.example`.

## Commands
| Purpose | Command |
|---|---|
| Dev server | `npm run dev` |
| Unit tests (Vitest) | `npx vitest run` or `npm test` |
| Type check | `npm run typecheck` |
| Lint (ESLint) | `npm run lint` |
| Production build | `npm run build` |
| Runtime dependency audit | `npm audit --omit=dev` |

A change is accepted only when tests, type check, lint and build pass (see `AGENTS.md` → Review gates).

## Architecture
- `src/availability.ts` — pure rules: `checkAvailability` (AC1–AC4, AC5 no mutation) and `getInputHints` (form hints, missing current time).
- `src/timeUtils.ts` — HH:MM ↔ minutes, duration label, constants (120 min, 1440 min).
- `src/sampleData.ts` — fictional rooms and bookings (read-only fixtures).
- `src/App.tsx` — page state and wiring; `src/components/` — `RoomSelector`, `Timeline`, `ResultPanel` (presentation only).
- `src/availability.test.ts` — regression suite (T01 onwards).
- `src/explain/` — optional "Explain availability" feature: `contract.ts` (input/output validation), `prompt.ts` (system instruction + `<data>` prompt), `adapters.ts` (mock LLM adapter: normal / slow / error / invalid), `explainAvailability.ts` (timeout, validation, deterministic fallback). `src/components/ExplainPanel.tsx` shows it.

## Explain availability (LLM feature)
The deterministic checker decides availability; the LLM only explains that decision and can never change it. The app ships with a **mock adapter** only, so no API key is needed and none may be added to the browser. A real model adapter must run server-side. On timeout, error, rejected output or invalid input the panel shows a standard (non-AI) explanation, labelled as such.

## Acceptance criteria
AC1 start before end, inside the day, after the current time · AC2 at most 120 minutes · AC3 blocked room rejected · AC4 no overlap, touching endpoints allowed · AC5 booking data never mutated · AC6 clear feedback on desktop and mobile.

## Working with AI agents
Read `AGENTS.md` first. It lists the safe commands, forbidden actions (no publishing, no dependency changes without approval, no secrets) and the review gates.
