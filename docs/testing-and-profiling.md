# Tests and rendering profiles

The project separates deterministic logic checks from browser behavior:

- Vitest covers signal math, particle distribution, mask generation, and particle/wordmark interaction.
- Playwright covers rendered behavior, navigation controls, hydration, responsive layout, keyboard access, and automated accessibility rules.

## Browser and accessibility tests

Install the project dependencies and the Playwright Chromium build once:

```sh
npm ci
npx playwright install chromium
```

Run the browser suite:

```sh
npm run e2e
```

The Playwright web server creates the production static export and serves it locally. Axe scans each supported locale against WCAG 2.0, 2.1, and 2.2 A/AA rules plus best-practice rules. The scans cover dark and light themes and a narrow mobile viewport. A keyboard check verifies focus access to the canvas and theme control.

## Test scope

- Unit tests exercise algorithms and simulation behavior rather than fixed JSON values.
- Integration tests verify that the particle simulation responds to the wordmark influence mask.
- Browser tests cover behavior that depends on the rendered app and browser environment.
- The attractor config validates its own ranges and enum values when loaded. Tests that only repeat those static config assertions do not add useful coverage.

## CPU and rendering profile

Run the fixed desktop profile:

```sh
npm run profile:rendering
```

The script builds the production export, serves it locally, then records idle animation and cursor movement at 1440 × 900 CSS pixels and DPR 1. It writes untraced `requestAnimationFrame` interval summaries to `artifacts/profiling/summary.json` and Chromium performance traces to `artifacts/profiling/idle.trace.json` and `artifacts/profiling/cursor.trace.json`.

Open either `.trace.json` file in Chrome DevTools **Performance** using **Load profile** to inspect JavaScript, compositor, GPU, and raster tracks. Treat frame intervals as comparable measurements on the same machine and browser version; do not use them as cross-device pass/fail thresholds. Profiling is manual because its timing measurements are machine-dependent.

## Git hooks

`npm install` and `npm ci` set `core.hooksPath` to `.githooks/` for the current repository.

- `pre-commit` runs lint, TypeScript, unit tests, and staged whitespace checks. It does not build the site.
- `pre-push` runs the Playwright browser suite, which builds the production export, then builds the `/prototype` export. Build-dependent checks stay out of the commit hook.
