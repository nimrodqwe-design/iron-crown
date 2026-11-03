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

## Battle simulation core — Session A

- **Status:** In progress; simulation contract v1 implemented on a feature branch.
- **Session:** A.
- **Branch:** `feature/battle-core`.
- **Goal:** Supply an authoritative, testable battle simulation that can power the separate battlefield presentation and later connect to campaign encounters.
- **Commits:** `5a855bcd19439c0dd347bbedab2809de14d252d7` (simulation core); `585f4f9a02d7756eff788a45e431a18f5f7e3933` (contract tests).
- **Files changed:** `js/battle/battle-simulation.js`; `tests/battle-simulation.test.js`.
- **Contract:** `battle:started`, `battle:player-input`, `battle:order-issued`, `battle:state-updated`, and `battle:ended`. Simulation is authoritative for movement, AI, damage, morale, casualties, and outcomes; the view renders snapshots and sends input/orders.
- **Initial field cap:** 12 friendly soldiers and 12 enemy soldiers, plus the player hero. This is not a cap on the campaign army; v1 fields the first eligible roster entries up to the cap.
- **Checks performed:** JavaScript source loaded in an isolated VM; contract test file executed with a lightweight Node API shim; 12-per-side cap, rejected invalid orders, accepted valid orders, active battle progression, and exactly-once battle-end event all passed.
- **Known limitations:** Not yet loaded by `index.html`; no campaign encounter entry/return integration, persistent casualty application, retreat input, terrain-specific movement, formations, or browser/device performance test yet. Roster overflow is currently held outside the battle but v1 result application still needs explicit reserve handling.
- **Pull request:** To be opened by Session A.
- **Next action for Session B:** Build the battle presentation module on a separate branch under `js/battle/` using the event names and payload shapes agreed in PR #1. Do not edit `js/battle/battle-simulation.js`, `js/game.js`, `js/core/state.js`, `js/core/save.js`, or `index.html` without coordination.
