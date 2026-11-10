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
- **Commits:** `5a855bcd19439c0dd347bbedab2809de14d252d7` (simulation core); `585f4f9a02d7756eff788a45e431a18f5f7e3933` (contract tests); `9c09475083fedf8ec55bad853247a381e7db571b` (initial unit formations included in `battle:started`).
- **Files changed:** `js/battle/battle-simulation.js`; `tests/battle-simulation.test.js`.
- **Contract:** `battle:started`, `battle:player-input`, `battle:order-issued`, `battle:state-updated`, and `battle:ended`. `battle:started` includes both normalized rosters and initial `friendlyUnits` / `enemyUnits` with positions. Simulation is authoritative for movement, AI, damage, morale, casualties, and outcomes; the view renders snapshots and sends input/orders.
- **Initial field cap:** 12 friendly soldiers and 12 enemy soldiers, plus the player hero. This is not a cap on the campaign army; v1 fields the first eligible roster entries up to the cap.
- **Checks performed:** JavaScript source loaded in an isolated VM; contract test file executed with a lightweight Node API shim; 12-per-side cap, rejected invalid orders, accepted valid orders, active battle progression, and exactly-once battle-end event all passed.
- **Known limitations:** Not yet loaded by `index.html`; no campaign encounter entry/return integration, persistent casualty application, retreat input, terrain-specific movement, formations, or browser/device performance test yet. Roster overflow is currently held outside the battle but v1 result application still needs explicit reserve handling.
- **Pull request:** To be opened by Session A.
- **Next action for Session B:** Build the battle presentation module on a separate branch under `js/battle/` using the event names and payload shapes agreed in PR #1. Do not edit `js/battle/battle-simulation.js`, `js/game.js`, `js/core/state.js`, `js/core/save.js`, or `index.html` without coordination.


### Battle simulation upgrade — reserve-safe result accounting

- **Status:** Implemented on `feature/battle-core`; awaiting execution of the expanded test suite and review.
- **Session:** A.
- **Commits:** `c298b9fc219f55889ad0ba2e9304fdc4fb560c5f` (reserve-safe simulation results); `46317f58dc65b8449a097ce28f6c9e69022a67d5` (expanded tests); `006866e7b760f3b83f606ec744cfd26f10189944` (assertion correction).
- **Files changed:** `js/battle/battle-simulation.js`; `tests/battle-simulation.test.js`.
- **Upgrade:** The 12-per-side field cap now explicitly separates fielded soldiers from unfielded campaign reserves. Battle results report fielded survivors, untouched reserves, total survivors by troop type, and field casualties. The hero attack cooldown is now consumed only when a valid in-range, forward-facing attack is accepted.
- **Compatibility:** Existing event names and primary payload structure are retained; `battle:ended` gains `fieldedSurvivors` and `reserves` breakdowns. Campaign integration must apply casualties only to fielded troops and carry reserves through unchanged.
- **Checks:** Latest simulation source passed an isolated V8 execution check: 12-per-side cap, valid/invalid orders, reserve preservation (8 foot + 4 archer reserves), survivor/casualty totals, stale battle input rejection, victory outcome, and exactly-once end event. The committed Node test file has not been run under Node. No browser/device test has been run.
- **Next action for Session B:** Continue the renderer against the existing event contract. Use `battle:started.friendlyUnits` / `enemyUnits` for formation placement and `battle:state-updated` for live snapshots. Do not infer campaign losses from total party size; wait for the new `battle:ended` reserve/fielded breakdown.


### Recruitment, trust and motivations — Day 36

- **Status:** Core recruitment service and focused tests committed on a feature branch; integration with campaign UI/state is not yet done.
- **Session:** Gameplay / recruitment.
- **Branch:** `feature/recruitment-motivations`.
- **Goal:** Establish a testable recruitment rule set where individual trust, commander reputation, background, motivation and explicit requirements affect willingness and price.
- **Files changed:** `js/characters/recruitment.js`; `tests/recruitment.test.js`.
- **Implementation:** Candidate records have stable IDs, names, roles, backgrounds, motivations, base costs, trust and optional minimum-trust/reputation requirements. Quote/recruit operations distinguish unavailable candidates, insufficient requirements and insufficient funds. Trust and reputation lower prices; selected high-trust/high-reputation recruits can volunteer for free. Recruited IDs cannot be recruited twice. Candidate data is not capped at a tiny fixed roster size.
- **Checks:** Test cases were authored for poor-reputation/high-cost recruitment, volunteer recruitment, duplicate recruitment, requirements, insufficient funds without mutation, and a 150-candidate roster. Tests have not yet been executed in this session; no browser/device test has been run.
- **Known limitations:** This is an isolated service, not yet connected to the live settlement recruitment UI, campaign save/load, chronicle, companion/officer assignments or army roster. Reputation is currently an input to the service; the campaign still needs a principled reputation/history system. Motivation currently adjusts recruitment price and volunteer eligibility; richer personal dialogue and changing goals remain future work.
- **Next action:** Execute the test file in a Node-compatible environment; then coordinate an integration contract with the gameplay owner before touching shared campaign state, save code or `js/game.js`.


### Recruit loyalty and motivation responses — Day 37

- **Status:** Standalone loyalty service and focused tests committed on `feature/recruit-loyalty`; not yet integrated into campaign interactions or recruitment UI.
- **Session:** Gameplay / character systems.
- **Branch:** `feature/recruit-loyalty` (based on `feature/recruitment-motivations`).
- **Goal:** Make a recruit's motivation matter after joining, so the player's treatment of troops shapes trust and morale over time.
- **Files changed:** `js/characters/loyalty.js`; `tests/loyalty.test.js`.
- **Implementation:** Adds stable-ID recruit records, trust and morale (0–100), motivation-specific responses to pay, neglect, protection, abandonment, victories, defeats, promises, training, discoveries, reckless orders, safe retreats and vengeance. Calculates a readable standing (loyal / steady / wavering / discontented) and an attention flag. Event IDs prevent the same campaign event from changing a recruit twice. Snapshot/restore retains trust, morale and recent event IDs; history is bounded to 200 IDs per recruit.
- **Checks:** Focused test cases were authored for motivation effects, duplicate-event protection, invalid actions/IDs, stable identity and snapshot/restore. They have not been run under Node or in a browser in this session. No device/performance test has been run.
- **Known limitations:** This service does not yet receive actual campaign events; it does not automatically make anyone leave, die, or change party. The campaign needs to decide which events are emitted and when. No dialogue, UI, save adapter, or chronicle integration yet. The service is deliberately advisory: poor standing flags a recruit for attention rather than silently removing them.
- **Next action:** Run both recruitment and loyalty tests together, agree an event contract with the campaign/gameplay owner, then integrate through a dedicated adapter rather than directly modifying shared state or save files.


### Campaign loyalty event adapter — Day 38

- **Status:** Adapter and focused test file committed on a feature branch; ready for isolated review, not live campaign integration.
- **Session:** Gameplay / character systems.
- **Branch:** `feature/campaign-loyalty-adapter` (branched from `feature/recruit-loyalty` to preserve Day 36–37 work; that branch was six commits ahead of `main` and zero behind at session start).
- **Goal:** Define a narrow, explicit bridge from gameplay-owned campaign events into the existing recruit loyalty service without editing shared campaign state, battle simulation, save code or the main UI.
- **Files changed:** `js/characters/campaign-loyalty-adapter.js`; `tests/campaign-loyalty-adapter.test.js`.
- **Implementation:** Maps explicit troop events (payment, protection, abandonment, promises, training, discovery, reckless orders, safe retreat and avenging) to loyalty actions. Provides a separate battle-result method for victory/defeat and requires the caller to supply stable participant recruit IDs. Requires unique event IDs, relies on the loyalty service's duplicate protection, returns per-recruit results, and emits a Chronicle-ready record only when a recruit's standing tier changes.
- **Checks:** Test cases authored for event mapping, unsupported events, missing IDs, duplicate event protection, battle outcome mapping and Chronicle transition records. After correcting the test expectations and formatting, 11 direct isolated V8 smoke checks passed, including exactly-once event handling and a standing-tier Chronicle transition. The committed Node test file has not been run under Node; no browser, campaign integration or device test has been run.
- **Known limitations:** This is an adapter contract, not automatic wiring. The repository's battle simulation currently reports battle outcomes and troop-group data but does not provide stable individual campaign recruit IDs for all participants. The gameplay owner must pass the actual participant IDs and call the adapter at the correct campaign event point. No existing campaign event bus or Chronicle API was assumed or modified.
- **Pull request:** Not opened; first review the isolated branch and run the committed test file in the project environment.
- **Next action:** Coordinate the participant-ID/event-call contract with the campaign/gameplay owner. Then integrate through that agreed boundary, add adapter loading and persistence only with explicit ownership approval, and test save/load plus real campaign event flows.
