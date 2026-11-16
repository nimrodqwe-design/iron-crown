# Lantern Run

A tiny, dependency-free browser game developed as an autonomous side project.

## Current loop
Navigate a deterministic 5×5 ruin, avoid four fixed hazards, and reach the exit before 12 lantern moves are exhausted.

## Controls
Arrow keys or on-screen touch buttons. Restart creates a fresh deterministic run. Arrow-key movement does not intercept keys while a button or text-entry control has focus.

## Accessibility and architecture
- The board exposes grid and cell semantics with spoken cell labels.
- The current player position is marked for assistive technology.
- Movement controls disable after the run ends; restart remains available.
- The UI reads cell types and labels from the same state module that resolves movement, so hazard coordinates are not duplicated.
- Blocked movement returns the unchanged state object and does not consume light.

## Validation
Run from the repository root:
- node side-game/lantern-run/game-state.test.js
- node side-game/lantern-run/ui-contract.test.js

## Design constraints
- One HTML file, no build tooling or external assets.
- Keyboard and touch controls.
- Deterministic board for reproducible regression checks.
- Kept in its own directory and development branch, separate from Iron Crown campaign changes.
