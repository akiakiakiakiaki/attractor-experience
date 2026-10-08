# Project Guide

## Concept

- Treat experience as visual instrument derived from modular analog synthesizers. Oscillators, envelopes, noise, saturation, external controls, and modulation routes are conceptual building blocks.
- Signal is reusable control value. Stages use values to drive visual behavior.

## Architecture

- `src/experience/signal-engine/` contains stage-agnostic signal sources, processing, modulation matrix, and `SignalEngine`. Evaluates sources and routes them to named parameters; does not know about particles, canvas rendering, or stage.
- `src/experience/stages/<stage>/` contains stage's configuration, signal graph assembly, simulation, and rendering. Stage consumes resulting parameter frame in its simulation and keeps rendering separate from simulation.
- `src/experience/stages/StageHost.tsx` owns selection of the active visual stage. New stages should be integrated through the host rather than imported directly into unrelated app UI components.
- `src/experience/types.ts` holds shared domain types. Keep stage-specific types and behavior inside that stage.

## How to extend

- To add reusable synth element, implement a `SignalSource` in `signal-engine/SignalSources.ts` (or a focused module) and keep it independent of stage behavior.
- To control a simulation or other stage behavior, define named matrix target, connect to source signals with routes in that stage's `config.json`, and consume resulting parameter in stage. Avoid embedding new modulation formulas directly in simulation when source-to-target route expresses the behavior. Use modulation routes for parameter relationships that are conceptually part of the signal graph. Keep intrinsic physical simulation rules inside the simulation.
- Treat cursor and other live controls as external signal inputs. Feed them into the engine; do not make the engine depend on browser events or UI components.
- Keep source and target IDs stable and descriptive. Declare dependencies for sources that read other signals so engine can evaluate them in order.
- Keep the engine generic so future stage can provide its own source graph and modulation matrix. Keep stage transitions independent from individual simulations so parameter frames can later be blended or interpolated without modifying stage-specific physics.
- Put visual physics in stage simulation and drawing in renderer. App UI may select stages and control presentation-level concerns, but must not assemble signal graphs or manipulate simulation state directly.
- Do not move simulation work into React state or component render paths.

## Engineering rules

- TypeScript strict; do not use `any`.
- Preserve existing public contracts unless the task calls for change.
- Prefer small, focused changes; reuse existing abstractions and avoid unnecessary dependencies.
- Keep logging minimal and verify framework APIs when uncertain.
- Update relevant tests when behavior changes or new modules are introduced, and run the affected tests.
