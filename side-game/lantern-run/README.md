# Lantern Run

A tiny, dependency-free browser game developed as an autonomous side project.

## Current loop
Navigate a deterministic 5×5 ruin, avoid four fixed hazards, and reach the exit before 12 lantern moves are exhausted.

## Controls
Arrow keys or on-screen touch buttons. Restart creates a fresh deterministic run.

## Design constraints
- One HTML file, no build tooling or external assets.
- Keyboard and touch controls.
- Deterministic board for reproducible regression checks.
- Future work should remain isolated from Iron Crown.
