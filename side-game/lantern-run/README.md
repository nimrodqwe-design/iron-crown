# Lantern Run

A tiny, dependency-free browser game developed as an autonomous side project.

## Current loop
Navigate three deterministic 5×5 ruins with distinct hazard layouts. Reach each exit before the 12-move lantern budget is exhausted; the Next ruin button advances to the next layout.

## Controls
Arrow keys or on-screen touch buttons. Next ruin starts the next deterministic layout and cycles back to the first after the third. Arrow-key movement does not intercept keys while a button or text-entry control has focus.

## Accessibility and architecture
- The board exposes grid and cell semantics with spoken cell labels.
- The current player position is marked for assistive technology.
- Movement controls disable after the run ends; restart remains available.
- The UI reads the current layout's cell types and labels from the same state module that resolves movement, so hazard coordinates are not duplicated. All three routes have state-level regression coverage.
- Blocked movement returns the unchanged state object and does not consume light.

## Validation
Run from the repository root:
- node side-game/lantern-run/game-state.test.js
- node side-game/lantern-run/ui-contract.test.js
- node side-game/lantern-run/ui-interaction.test.js

The interaction harness runs the actual inline UI controller against a small fake DOM and checks keyboard input, touch-button clicks, blocked movement, traps, escape and restart.

## Design constraints
- One HTML file, no build tooling or external assets.
- Keyboard and touch controls.
- Deterministic board for reproducible regression checks.
- Kept in its own directory and development branch, separate from Iron Crown campaign changes.
