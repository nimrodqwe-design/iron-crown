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
- **Validation:** The new Playwright path is awaiting its branch/PR CI run. No passing result is claimed before that workflow completes. Browser emulation is not a physical Android-device test.
- **Next:** Keep mechanics frozen; use the CI result to validate the tap path, then arrange physical-device testing separately when a device is available.
