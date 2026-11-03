# ChatGPT Development Coordination

This document is the shared hand-off point for ChatGPT sessions working on Iron Crown.

## Repository rules

- `main` is the stable, integration branch. Do not develop unfinished features directly on it.
- Before changing code, inspect the current repository state and read this document.
- Each session works on a dedicated feature branch created from the latest `main`.
- Use focused commits with descriptive messages.
- Open a pull request from the feature branch into `main` when the feature is ready.
- Review the diff and run relevant checks before merging.
- Never overwrite another session's branch or force-push shared work.
- If two features touch the same files or systems, coordinate in this document or a GitHub Issue before editing.

## Session start checklist

1. Read this file.
2. Check the latest `main` commit and available branches.
3. Check open pull requests and issues for overlapping work.
4. Confirm the assigned feature and branch name.
5. Inspect the existing implementation before making changes.

## Feature hand-off template

Copy this section for each new feature and fill it in.

### [Feature name]

- **Status:** Planned / In progress / Ready for review / Merged / Blocked
- **Session:** A / B
- **Branch:** `feature/...`
- **Goal:**
- **Files expected to change:**
- **Systems affected:**
- **Implementation notes:**
- **Checks performed:**
- **Known limitations or bugs:**
- **Pull request:**
- **Next action for the other session:**

## Update protocol

At the start of a work session, read the latest version of this document and inspect GitHub for newer commits, issues, and pull requests.

At the end of a work session, update the relevant feature hand-off with:
- what changed and the commit SHA;
- files changed;
- checks actually performed (do not claim tests that were not run);
- unresolved issues;
- the exact next action.

Use GitHub Issues for substantial tasks or questions that need a discussion thread. Use pull-request comments for review feedback. This document is the concise project-wide status and hand-off log.

## Current baseline

The current stable implementation is whatever is present on `main`. Do not rely on notes from an older chat as a substitute for checking the repository.


## Corrected functional ownership (2026-11-03)

The project owner confirmed that the earlier A/B assignment was reversed. Session labels are unreliable because the other chat currently calls itself "Session A". Use functional ownership names instead:

- **MAP / WORLD owner (this chat):** campaign map presentation/navigation; location and demo-world content; resource definitions, placement and map-side presentation; map UI and visual polish.
- **BATTLE / GAMEPLAY owner (other chat):** battle simulation and campaign integration; NPC interactions/dialogue; recruitment and party interactions; hero progression; faction/kingdom AI; diplomacy; encounters; campaign state/save integration; gameplay bugs.

Do not infer ownership from the A/B label used by either chat. The BATTLE / GAMEPLAY owner must not take over map/world content by default; the MAP / WORLD owner must not edit battle simulation, NPC logic, progression, faction AI or campaign result/save logic. Propose shared APIs and overlapping-file changes before implementation.

### Demo-world resource map layer

- **Status:** Implemented on `feature/demo-world-resources`; awaiting review.
- **Owner:** MAP / WORLD.
- **Commits:** `02f5982` resource-site data; `1f28610` map marker rendering/inspection; `afe64e9` SVG layer; `907b2a1` offline cache bump; `556c22d` documentation.
- **Files:** `js/data/world.js`, `js/game.js`, `index.html`, `sw.js`, `docs/DEVELOPMENT_FOUNDATION.md`.
- **Upgrade:** Added 12 named resource sites covering grain, timber, fish, stone, salt, reeds, iron, ore, wool and trade goods. Each marker is labelled, keyboard accessible and inspectable for type, availability, description and nearest settlement.
- **Boundary:** This is a presentation/data layer only. Gathering, production, inventory/stock changes and persistence are intentionally not implemented here; they require gameplay/save ownership and an agreed API.
- **Follow-up fix (2026-11-03):** Corrected `larkspur-wool.near` to `larkspur` and `silverkeep-market.near` to `silverkeep`; added explicit load-time assertions for both expected relationships. Commit: `fab1674c19d454a0e5a0d821f2c760426a4e53fb`.
- **Checks:** Reviewed the changed source and verified the two corrected values plus regression assertions are present. No automated test runner, browser, mobile device, or offline-launch test has been run in this session.
- **Next action for BATTLE / GAMEPLAY owner:** acknowledge the corrected functional split and continue battle/NPC/gameplay work on a separate branch. Do not edit the map/world files listed above without coordination.


### MAP / WORLD three-day sprint (completed in one accelerated session, 2026-11-03)

- **Owner/name:** Meridian — MAP / WORLD.
- **Branch:** `feature/demo-world-resources` (existing PR #4; no new branch or duplicate PR created).
- **Day 1 — Resource-map usability:** Added a labelled resource category selector, per-type marker filtering and a visible/total site count. Responsive styling supports narrow screens.
- **Day 2 — World-data integrity:** Expanded initialization validation for duplicate settlement/resource IDs, required names/descriptions, allowed resource types and availability values, valid settlement references and map bounds. Normalised all 12 nearest-settlement references to stable settlement IDs.
- **Day 3 — Delivery hygiene:** Bumped service-worker cache to v13 and documented implementation, validation and test limitations.
- **Files changed in this sprint:** `index.html`, `js/game.js`, `styles/main.css`, `js/data/world.js`, `sw.js`, `docs/DEVELOPMENT_FOUNDATION.md`, `docs/CHATGPT_COORDINATION.md`.
- **Commits:** `9958442` filter control; `781a9db` filter behaviour; `42778af` responsive styling; `c2c0e6b` stricter catalogue validation; `5bcefc3` settlement-reference normalisation; `736dd58` cache v13; `7c79aa9` foundation docs; `21dfb0a` coordination log.
- **Checks performed:** Reviewed the exact insertion/replacement anchors and source changes; confirmed the expected settlement IDs exist in the world catalogue and each resource-site reference was normalised in the same data file. No JS runtime, automated suite, browser, device, or offline test was run.
- **Known limitation:** Resource markers remain informational; no gathering, production, stock, inventory or persistence mechanics were added because those belong to BATTLE / GAMEPLAY.
- **Next action:** Run browser/mobile regression testing on PR #4, verify filtering and marker interaction alongside travel, pan/zoom, settlements, save/load and offline startup. Keep PR open until that review passes.
