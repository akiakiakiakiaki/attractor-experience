# Michael Ilg — Particle Wordmark Experience

An interactive website centered around a particle-based animation of a personal wordmark. The project uses the signal flow of modular analog synthesizers as its architectural concept: synth elements produce control signals, and a patch matrix routes those signals to the parameters that shape the visual simulation.

The current experience is visual only. Its signal engine is designed so the same sources and modulation concepts could later drive audio as well.

## How the experience works

- Oscillators, envelopes, noise, and signal processing provide reusable modulation signals.
- A stage-specific patch connects signals to named parameters through a modulation matrix.
- The attractor stage evaluates its patch and passes the resulting parameter frame to the particle simulation.
- The particle simulation updates grain movement and wordmark interaction; the canvas renderer draws the result.
- Pointer movement acts as an external modulation input. The wordmark mask shapes how grains gather around and move through the logo.

The site also includes English, German, and Spanish language switching, a light/dark theme toggle, and responsive layouts.

## Architecture

```text
src/
├── app/                         Next.js app, UI components, theme, and global styles
├── i18n/                        Localized website copy
└── experience/
    ├── signal-engine/           Reusable signal sources, processing, and modulation matrix
    └── stages/
        ├── StageHost.tsx        Selects the active visual stage
        └── attractor/           Attractor patch, configuration, simulation, and rendering
```

The signal engine is stage-agnostic. Each stage owns its patch and simulation; the app hosts the selected stage and its presentation. The attractor stage is the first visual stage.

## Development

Requirements: Node.js and npm.

```sh
npm ci
npm run dev
```

## Static builds

Both build commands create a static export in `out/`:

```sh
npm run build             # Production paths at the site root
npm run build:prototype   # Asset and route paths under /prototype
```

The commands load `.env.production` and `.env.prototype` respectively. Upload the contents of `out/` to the matching web-server directory.

## Checks and profiling

```sh
npm run lint
npm run typecheck
npm run test:run
npm run e2e
npm run profile:rendering
```

The Playwright suite includes axe-core accessibility checks for every supported locale, light and dark themes, and a mobile viewport. It also verifies keyboard access to the canvas and theme control. The browser suite requires Playwright's Chromium build; install it once with:

```sh
npx playwright install chromium
```

See [docs/testing-and-profiling.md](docs/testing-and-profiling.md) for details about the browser tests and rendering profile.

## Git hooks

The hooks in `.githooks/` are active for this repository. To activate them manually in another checkout, run:

```sh
npm run prepare
```

`npm install` and `npm ci` run this setup automatically. It sets the repository-local `core.hooksPath` to `.githooks`.

- **Pre-commit:** lint, TypeScript, unit tests, and whitespace checks.
- **Pre-push:** the production build and browser suite, followed by the `/prototype` static build.

Rendering profiling is intentionally kept manual because its timing measurements are machine-dependent.

## Typeface

Lato is bundled locally as subsetted WOFF2 files. The font is distributed under the SIL Open Font License; see [`public/fonts/OFL.txt`](public/fonts/OFL.txt).
