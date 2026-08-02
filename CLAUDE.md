# Frontend — Equipment Monitoring (Angular)

Angular 21 SPA. Talks to the Go API (repo `../equipment-monitoring-api`). **Work only inside this folder unless the task changes a shared data model** (then sync the Go struct too).

## Commands
- Dev: `ng serve` — needs the API running at `http://localhost:8080` (see backend repo).
- Build (prod): `ng build --configuration=production` (bakes the Render URL via `environment.prod.ts`).
- Deploy: build → `cp vercel.json dist/equipment-monitoring/browser/` → `npx vercel deploy dist/equipment-monitoring/browser --prod --yes` → alias to `browser-two-teal.vercel.app`.

## Layout (only what's non-obvious)
- `src/app/core/services/*` — one service per API area, all use `HttpClient`. `WebSocketService` holds the live socket; `MachineService` merges the initial GET with WS pushes into one stream.
- `src/app/core/models/*` — TS interfaces that MUST match the Go JSON (camelCase). Change one → change both.
- `src/environments/` — `environment.ts` (dev → localhost:8080), `environment.prod.ts` (prod → Render). Swapped by `fileReplacements` in `angular.json`.
- Features are standalone + lazy-loaded via `*.routes.ts`. Guards: `authGuard`, `roleGuard`.

## Conventions & gotchas
- **Zoned change detection is deliberate.** `zone.js` + `provideZoneChangeDetection` are wired in (`app.config.ts`, `angular.json` polyfills). The code updates the view via imperative `subscribe(x => this.field = x)` — it relies on zone CD. Do NOT switch to zoneless without refactoring every component to signals.
- **API dates are ISO strings, not `Date`.** Wrap `new Date(x)` before calling `.toLocaleTimeString()` / `.toLocaleDateString()`. The `date` pipe and `RelativeTimePipe` already handle strings.
- No mocks. `MockDataService` was removed in v2 — don't reintroduce it.
- Adding an API call → add a method to the matching `core/services/*` service, never call `HttpClient` from a component.
