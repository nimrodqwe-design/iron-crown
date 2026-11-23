# Lantern Run development log

## 23 November 2026 — Hint cost clarity

- **Branch:** `feature/lantern-hint-cost-clarity`, merged into `sidegame/lantern-run` as `729d7357b1bdf58781858b58f96cabfe22d77945`.
- **Problem:** The button said “Hint · free” even though using a hint reduces the final score by 100 points. The hint did not consume lantern light, but “free” concealed a real scoring cost.
- **Change:** The button now reads “Hint · −100 score”, exposes the cost in its accessible label, and the opening instructions explain the trade-off. README wording now distinguishes lantern cost from score cost.
- **Regression:** The existing fake-DOM interaction test now asserts that the cost is visible in the actual HTML before a hint is requested. Existing scoring assertions continue to verify the 100-point difference.
- **Validation:** PR workflow run `45148628150` and post-merge branch run `45148797050` passed syntax, deterministic state, progress storage, UI contract, storage fallback and fake-DOM interaction checks. No real browser or mobile-device test is claimed.
- **Next:** Keep the three deterministic layouts, storage fallback and scoring unchanged; prioritize actual browser smoke testing before adding mechanics.
