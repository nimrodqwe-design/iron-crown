# Lantern Run development log

## 23 November 2026 — Hint cost clarity

- **Branch:** `feature/lantern-hint-cost-clarity`, merged into `sidegame/lantern-run` as `729d7357b1bdf58781858b58f96cabfe22d77945`.
- **Problem:** The button said “Hint · free” even though using a hint reduces the final score by 100 points. The hint did not consume lantern light, but “free” concealed a real scoring cost.
- **Change:** The button now reads “Hint · −100 score”, exposes the cost in its accessible label, and the opening instructions explain the trade-off. README wording now distinguishes lantern cost from score cost.
- **Regression:** The existing fake-DOM interaction test now asserts that the cost is visible in the actual HTML before a hint is requested. Existing scoring assertions continue to verify the 100-point difference.
- **Validation:** PR workflow run `45148628150` and post-merge branch run `45148797050` passed syntax, deterministic state, progress storage, UI contract, storage fallback and fake-DOM interaction checks. No real browser or mobile-device test is claimed.
- **Next:** Keep the three deterministic layouts, storage fallback and scoring unchanged; prioritize actual browser smoke testing before adding mechanics.


## 24 November 2026 — Real Chromium validation

- **Branch:** `sidegame/lantern-run-browser-validation`, targeting `sidegame/lantern-run`.
- **Problem:** The game had deterministic state and simulated-DOM interaction coverage, but no actual browser run. This left keyboard dispatch, real localStorage, reload persistence and narrow viewport layout unverified.
- **Change:** Added a dependency-free-at-runtime Playwright smoke script and a dedicated CI step that installs Playwright/Chromium only on the GitHub Actions runner. The script serves the game with Node's built-in HTTP server and exercises keyboard movement, blocked movement, hints, all three routes, trap retry, scores, localStorage persistence after reload, 320px layout and a throwing localStorage getter. The main panel now uses border-box sizing to avoid narrow-screen overflow.
- **Scope:** No gameplay rules or scoring changed. No production dependency or package manifest was added.
- **Validation:** The deterministic state, storage, UI-contract and fake-DOM checks passed, and real Chromium workflow runs `45355410493` (push) and `45355420320` (PR) passed. The browser run exercised keyboard and blocked movement, hints, all three escape routes, a trap-and-retry, score persistence across reload, the 320px layout, and the throwing-localStorage fallback. The first browser run exposed an incorrect test assumption about the second ruin's trap coordinate; the test was corrected to take two right moves. The game rules did not need changing.
- **Next:** Merge this isolated test-infrastructure PR after the final documentation update's checks pass. Keep further mechanics deferred until browser failures are fixed.


## 24 November 2026 — Touch-emulated browser coverage

- **Branch:** `test/lantern-run-touch-smoke`, based on the current isolated `sidegame/lantern-run` branch.
- **Change:** Extended the real Chromium smoke test with a mobile-emulated context (`isMobile`, `hasTouch`, 320×720 viewport). It verifies that the browser exposes touch input, movement/hint/restart controls respond to actual Playwright taps, the hint penalty remains visible, the narrow layout has no horizontal overflow, and no uncaught page errors occur.
- **Scope:** Test-only; no game rules, scoring, production runtime dependencies or Iron Crown campaign files changed.
- **Validation:** Post-merge side-game workflow `45358492276` passed all six deterministic/UI test stages, Playwright/Chromium installation, and the real-browser smoke script including the new mobile-emulated touch path. The run verified touch input availability, tap movement, tap hint, visible score penalty, 320×720 no-overflow layout, tap restart and no uncaught page errors. This is Chromium device emulation, not a physical Android-device test.
- **Next:** Keep mechanics frozen; use the CI result to validate the tap path, then arrange physical-device testing separately when a device is available.


## 25 November 2026 — keyboard-focusable board

- **Branch:** `sidegame/lantern-run-keyboard-focus-2026-11-25`, targeting `sidegame/lantern-run`.
- **Problem:** Arrow keys worked when the document body received key events, but the board itself was not keyboard-focusable. Keyboard users had no explicit focus target or visible board focus indicator.
- **Change:** The grid now has `tabindex="0"`, an explicit accessible label, `aria-keyshortcuts` for all four arrow directions, a live-status description and a visible `:focus-visible` outline. README controls now explain how to focus the board.
- **Validation added:** UI contract checks assert focusability, shortcut metadata and focus styling. Real Chromium smoke test focuses the board and verifies blocked and successful arrow-key movement while the board owns focus.
- **Scope:** No puzzle layout, move rules, light budget, hint scoring or personal-record format changed. No runtime dependency added.
- **Physical-device limit:** This remains browser validation; no physical Android device was available.


## 25 November 2026 — keyboard-focus improvement merged

- **PR #54** merged into `sidegame/lantern-run` with squash commit `fd30962fd242c1c22ec612f0b56af5d0b3ed0049`.
- The real Chromium smoke test now focuses the board itself before checking blocked and successful arrow-key movement.
- UI contract, state, progress, storage-fallback and interaction checks passed. PR/push workflows `45575598204` and `45575611730` passed the updated Chromium suite.
- No puzzle rules, level layouts, score formula or persistence schema changed. Physical Android-device testing remains outstanding.


## 26 November 2026 — fourth deterministic ruin

- **Branch:** `sidegame/lantern-run-fourth-ruin-2026-11-26`, based on `sidegame/lantern-run` at `eb3400f4c365d76786571431f531ebcc7a55af0d`.
- **Change:** Added Gilded Observatory as a fourth 5×5 ruin with a fixed hazard layout and an eight-move safe route. Existing movement, hint search, scoring and retry rules are unchanged.
- **Compatibility:** The progress store remains schema v1 and accepts older three-entry score arrays, extending them with an empty fourth slot rather than discarding existing records. Four independent best scores are persisted.
- **Validation added:** State tests cover the new layout and route; progress tests cover three-to-four record expansion; fake-DOM and Chromium smoke tests complete all four ruins and verify wraparound.
- **Not yet verified:** Physical Android hardware and offline service-worker behaviour.
- **Next:** Keep mechanics stable; use the expanded browser suite to catch route, score and persistence regressions before adding further content.


## 27 November 2026 — visible ruin identity

- **Branch:** `sidegame/lantern-run-level-names-2026-11-27`, based on the current isolated `sidegame/lantern-run` branch.
- **Problem:** The fourth ruin was playable, but the interface identified progress only as “Ruin 1–4”; its distinct name and the other ruin identities were not visible during play. The README also retained one stale reference to three routes.
- **Change:** Added a visible current-ruin heading sourced from `LanternRunState.levelName`. It changes only when progression changes the selected level, so normal movement does not repeatedly update the heading. Updated the README to describe all four named ruins and four-route coverage.
- **Regression:** UI contract, fake-DOM interaction and real Chromium progression tests assert the correct heading at start, after each successful escape, on retry, and after the fourth-to-first wraparound.
- **Scope:** No map layouts, movement rules, hint costs, scoring, progress schema or runtime dependencies changed.
- **Validation:** Pending this branch's CI workflow; no physical Android-device test is claimed.
- **Next:** Keep the four layouts stable and address only defects demonstrated by the automated browser suite or later physical-device testing.


## 28 November 2026 — direct adjacent-tile movement

- **Branch:** `sidegame/lantern-run-tap-to-move-2026-11-28`, based on the isolated `sidegame/lantern-run` branch.
- **Problem:** Mobile players could move only through the directional buttons. The board itself was not a direct touch target even though its 5×5 cells are the primary play surface.
- **Change:** Each rendered cell now exposes stable coordinates and accepts a tap only when it is orthogonally adjacent to the player. A valid tap delegates to the existing `move` function and deterministic state module. A non-adjacent tap announces the rule without spending a move or lantern light. Cell hit targets use manipulation touch handling.
- **Regression:** Fake-DOM interaction tests cover rejected non-adjacent taps, one-cell movement, light consumption and restart. Real Chromium touch emulation taps both an invalid distant cell and a valid adjacent cell, then verifies the existing directional-button path still works.
- **Scope:** No level layouts, hazards, movement rules, hint cost, scoring, progress schema or runtime dependencies changed.
- **Validation:** PR #63's final PR-head workflow `46124831434` passed JavaScript syntax, deterministic state, progress, UI contract, storage fallback, fake-DOM interaction and real Chromium touch-emulation tests. Push workflow `46124828859` passed the same suite on the final feature head. Post-merge validation is tracked separately on `sidegame/lantern-run`. This is touch-emulated Chromium, not a physical Android-device test.
- **Merge:** PR #63 merged into `sidegame/lantern-run` as `39872aa0956438c47ee8302d800dbd3e960fe602`.
- **Next:** Keep all four layouts stable and use physical-device testing when hardware is available; fix only observed usability defects.
