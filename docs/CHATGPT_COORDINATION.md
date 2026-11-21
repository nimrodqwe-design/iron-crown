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
- **Pull request:** #20.
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
- **Pull request:** Draft PR #6: https://github.com/nimrodqwe-design/iron-crown/pull/6 (open, not merged; review and Node tests pending).
- **Next action:** Issue #7 tracks the stable character-ID and campaign event ownership decisions. See `docs/CAMPAIGN_CHARACTER_CONTRACT.md` on the documentation branch for the proposed schema, event envelope, save migration and battle participant mapping. Do not wire shared files until owners agree.


### Campaign character integration boundary — Day 39

- **Status:** Verified current campaign constraints and documented a proposed integration contract on a documentation-only branch; waiting for workstream ownership decisions.
- **Session:** Gameplay / character systems.
- **Branch:** `docs/campaign-character-contract` (created from latest `main`).
- **Files changed:** `docs/CAMPAIGN_CHARACTER_CONTRACT.md`.
- **Goal:** Define stable campaign-scoped character IDs, event IDs, battle participation mapping, save migration and ownership boundaries before connecting the standalone recruitment/loyalty services to shared campaign files.
- **Verified baseline:** `state.troops` is an aggregate number; save version is 5; the event bus module exists but is not wired by `js/game.js`; settlement recruitment only increments the aggregate count; battle unit IDs are battle-local; no Chronicle module is present in the main file tree.
- **Implementation:** Documentation only. Proposed a persistent named-character roster, monotonic campaign-scoped ID sequences, no fabricated individual identities for existing generic troops, explicit event envelopes, named battle participant mapping, save version 5 migration strategy, and clear file ownership boundaries.
- **Coordination:** Opened Issue #7 to collect decisions from campaign/gameplay and battle owners. PR #6 remains a draft and is not merged.
- **Checks:** Read current `main` implementations of state, save, event bus, game, shell and battle simulation; inspected open PRs and branches. No gameplay code changed; no browser/device test applies to this documentation-only milestone.
- **Known limitations:** Proposed schema is not implemented. Stable IDs, save migration, event producers, battle participant mapping and Chronicle persistence remain future work.
- **Next action:** Obtain owner agreement on Issue #7, then implement the roster/ID layer in an isolated branch with tests before touching campaign save or UI integration.


### Campaign character roster foundation — lead integration

- **Status:** Ready for review; isolated foundation, not yet wired into live campaign state.
- **Branch:** `feature/campaign-character-roster`.
- **Goal:** Provide one stable identity layer for named companions/officers/specialists while preserving aggregate `troops`.
- **Files changed:** `js/characters/campaign-roster.js`; `tests/campaign-roster.test.js`.
- **Implementation:** Generates immutable campaign-scoped `char-N` IDs, never derives identity from names or array positions, snapshots `nextId` and characters, and restores without ID reuse. Existing saves are untouched because save version migration has not yet been integrated.
- **Checks performed:** Focused Node test file added but not executed in this session; no browser/device test.
- **Known limitations:** Not yet included by `index.html`, `js/core/state.js`, or `js/core/save.js`; recruitment and loyalty services are not yet wired to it.
- **Next action:** Execute the focused test, then add save v5→v6 migration and a single authoritative state entry point before connecting recruitment UI.


### Daily lead hand-off — 15 Nov 2026

- **Iron Crown:** PR #11 (stable campaign character roster foundation) was reviewed and merged after its focused Node test passed in an isolated execution environment. Merge commit: `aa75882e6a3db6a54c809d35a5ac0f2c389ada8c`.
- **Iron Crown integration status:** The roster is now available on `main`, but it is deliberately not yet wired into live campaign state or save data. Next critical slice is a backward-compatible save migration and one authoritative campaign-state entry point; recruitment must then use that entry point rather than duplicating character state.
- **Side game:** PR #10 was re-inspected as clean and mergeable and merged into `sidegame/lantern-run`. Merge commit: `d2f1b0835d228952eb82e3b5369fec85d4f99942`. The browser UI now delegates movement/outcomes to the deterministic state module.
- **Checks actually run:** `node tests/campaign-roster.test.js` passed in an isolated copy of the committed PR #11 source. No Iron Crown browser/mobile/save runtime test was run this session. Lantern Run's existing deterministic state checks had previously been run; no new browser runtime test was run today.
- **Blockers:** PR #4 world resources remains a separate conflict/reconciliation task and was not force-merged. Browser/device validation remains outstanding for both projects.


### Campaign roster and save v6 integration — lead gameplay (16 Nov 2026)

- **Status:** Merged into main through PR #13.
- **Branch:** feature/campaign-save-v6-roster (merged; branch retained).
- **Goal:** Make the named-character roster part of the single authoritative campaign state and persist it without changing aggregate troop counts.
- **Files changed:** js/characters/campaign-roster.js, js/core/state.js, js/core/save.js, js/game.js, index.html, sw.js, tests/campaign-roster.test.js, tests/campaign-save.test.js, .github/workflows/javascript-checks.yml, docs/CAMPAIGN_CHARACTER_CONTRACT.md.
- **Implementation:** Roster snapshots are v2 and carry a campaign token, monotonic campaign-scoped character IDs and monotonic event IDs. The roster manager is owned by the campaign state object. Save version 6 persists the roster; v5 migration preserves the aggregate troop count and creates an empty roster rather than inventing historical characters. Newer-version saves are not overwritten. The roster script is loaded before state and included in the service-worker shell cache v12.
- **Compatibility:** Existing generic soldier recruitment remains aggregate and unchanged. The new roster does not yet affect army headcount, settlement recruitment, loyalty, or battle results.
- **Checks:** GitHub Actions run 43843577129 passed JavaScript syntax and all six then-existing Node tests, including roster and save migration coverage. No browser, mobile, local-storage browser runtime or offline test has been performed.
- **Known limitations:** Named recruit UI/action, recruitment-service adapter, campaign event producers, persistent battle participant IDs and campaign battle result application remain future work.
- **Next action:** Verify the workflow results. If green, review and merge this foundation; then add one transactional named-companion recruitment action using the same roster and existing gold state.

### Repository status corrections — 16 Nov 2026

- PR #6 (recruitment, loyalty and campaign adapter services) is merged into main at 81e0a99e05d0ed59e77a3eec837cab638b703329; older entries above that call it a draft are historical.
- PR #11 (stable roster module) is merged into main at aa75882e6a3db6a54c809d35a5ac0f2c389ada8c.
- PR #12 (15 Nov hand-off) is merged into main at 8f8db9f30d4b5fc6a9d8e884de8a617e634526c4.
- PR #10 (Lantern Run UI/state connection) is merged into the isolated sidegame/lantern-run branch at d2f1b0835d228952eb82e3b5369fec85d4f99942; it is not an Iron Crown campaign change.
- PR #4 (world resource sites) is closed as superseded by PR #15. Its feature/demo-world-resources branch and all commits are preserved; the reconciled map layer is now on main.
- PR #2 remains an isolated battlefield presentation reference, not a campaign-integrated feature. Preserve it until a coordinated renderer integration review.
- PR #1's coordination-only proposal is closed as superseded by Issue #7 and the current lead directive; its branch and discussion history are preserved. Issue #7 remains open for named recruitment and loyalty integration.
- The feature/battle-core branch's battle simulation and test file are byte-identical to the corresponding files on main; its ahead/behind count reflects branch history and documentation, not an additional simulation patch to merge.


### Demo-world resource reconciliation — lead integration (16 Nov 2026)

- **Status:** Merged into main through PR #15.
- **Branch:** feature/demo-world-resource-reconciliation (merged; branch retained).
- **Source preserved:** PR #4 was closed as superseded after its useful changes were reapplied; feature/demo-world-resources remains intact for reference.
- **Changes:** 12 validated resource-site records; SVG markers; category filter and visible count; persistent inspection panel; keyboard activation and Escape close; focus return to the map; markers excluded from drag/free-roam input; non-interactive region landmarks.
- **Integration protection:** The current save v6 and campaign roster callbacks in js/game.js are retained. sw.js advances from shell v12 to v13 while preserving the campaign-roster.js cache entry. No gathering, production, inventory stock or save-state mutation was introduced.
- **Validation:** GitHub Actions run 43844525553 passed JavaScript syntax and all eight Node test files, including world-catalogue and map-UI contract tests. No browser, mobile, save/load runtime or offline-launch test has been performed.
- **Ownership update:** The current 16 Nov user directive supersedes older two-conversation ownership notes: this lead manages the entire Iron Crown repository. Existing map work remains preserved and is being integrated in place, not discarded or overwritten.
- **Next action:** Add a transactional named-companion recruitment action that writes to this roster and the existing campaign gold state without duplicating soldier counts.


### Final daily hand-off — 16 Nov 2026

- **Current main:** c79ced134beefcb9153670223f16393333d3b0cd.
- **Iron Crown PR #13:** merged save v6 and authoritative roster foundation (dad34d81f9529e178a13361b857cfacf04165c8a).
- **Iron Crown PR #15:** merged reconciled demo-world resource map (c79ced134beefcb9153670223f16393333d3b0cd).
- **Old PR #4:** closed as superseded; feature/demo-world-resources branch retained.
- **Old PR #1:** closed as superseded; coordination branch retained.
- **PR #2:** remains an isolated draft reference and is not integrated into the campaign.
- **Side game PR #14:** merged into sidegame/lantern-run at f0e90fe8748d6cdd6c36375f7761f39e87eea90b.
- **Iron Crown checks:** run 43843577129 passed syntax and six Node tests; run 43844525553 passed syntax and eight Node tests.
- **Lantern Run checks:** PR run 43843855783 and post-merge push run 43844035863 passed deterministic state and UI-contract checks. An earlier test-only failure was corrected in commit 816156f; no browser runtime test has been performed.
- **Known untested areas:** browser play, mobile touch behaviour, save/load in a browser, offline launch and real device performance.
- **Next Iron Crown priority:** named-companion recruitment integrated with the roster, with transactional gold deduction and no aggregate troop double-counting.
- **Next Lantern Run priority:** add a DOM-level interaction harness or perform a real browser smoke test for keyboard/touch controls, panel rendering and restart.


### Named companion recruitment — lead integration (17 Nov 2026)

- **Status:** Implemented on `feature/named-companion-recruitment`; awaiting automated checks and PR review.
- **Goal:** Connect notable settlement recruits to the authoritative campaign roster and existing gold state without changing generic troop accounting.
- **Files changed:** `js/data/recruits.js`, `js/characters/campaign-recruitment.js`, `js/characters/campaign-roster.js`, `js/characters/recruitment.js`, `js/game.js`, `index.html`, `styles/main.css`, `sw.js`, `tests/campaign-recruitment.test.js`, `tests/campaign-save.test.js`, `tests/recruitment.test.js`, `docs/CAMPAIGN_CHARACTER_CONTRACT.md`.
- **Implementation:** Adds Mara Venn (Kingsbridge), Iven Rook (Highcourt) and Sella Quill (Silverkeep). The town panel shows only the candidates assigned to the visited settlement. Recruitment quotes use the existing pricing service, then add the named character to the campaign roster and deduct the quoted amount from authoritative `state.gold`. Persisted `candidateId` prevents a candidate being recruited twice after save/load. Specialist is an accepted role. The generic soldier action and aggregate `state.troops` are unchanged.
- **Compatibility:** `candidateId` is optional additive roster metadata; older version-6 records hydrate with `null`. No save-version bump. Service-worker shell cache advances from v13 to v14 and includes the new modules.
- **Design boundary:** No authoritative reputation field exists yet; the adapter uses a neutral reputation baseline of 50. No loyalty events or battle participation mapping are wired in this slice.
- **Checks:** Added campaign-recruitment tests and extended save/recruitment tests. Automated workflow not yet observed at hand-off; no browser, mobile, save/load browser runtime or offline test performed.
- **Next action:** Inspect the PR diff and GitHub Actions result. Merge only if all JavaScript syntax and regression tests pass; then proceed to persistent party membership and loyalty-event integration.


### Daily development hand-off — 17 Nov 2026

- **Current main before this documentation PR:** `05018d50ab94b6c3cf507b97ab783bc1451b7346`.
- **Iron Crown PR #17:** named settlement recruitment merged into main as `05018d50ab94b6c3cf507b97ab783bc1451b7346`. Adds Mara Venn at Kingsbridge, Iven Rook at Highcourt and Sella Quill at Silverkeep; uses the existing recruitment pricing service; persists optional `candidateId`; deducts authoritative campaign gold; preserves generic soldier recruitment and aggregate `state.troops`.
- **Iron Crown checks:** PR branch run 44051187245 passed JavaScript syntax checks and all nine Node test files. Post-merge main run 44051514383 passed the same suite. GitHub Pages deploy run 44051516028 completed successfully.
- **Iron Crown limitations:** no browser, Android viewport, browser local-storage save/load, offline-launch or real device performance test has been performed. Recruitment reputation currently uses a neutral baseline of 50 because no authoritative campaign reputation field exists.
- **Issue #7:** updated with PR #17 completion. Remaining work is active-party membership, loyalty-event producers/replay persistence, named battle participants and exactly-once campaign battle outcome application.
- **World Issue #5:** map/resource layer remains informational and merged through PR #15 (`c79ced134beefcb9153670223f16393333d3b0cd`). Issue remains open for browser/mobile/save/offline runtime validation.
- **Battle prototype PR #2:** remains an isolated draft reference. It is not connected to campaign state, battle simulation events, saves or persistent participants; do not merge it as finished campaign gameplay.
- **Branch reconciliation:** battle-core simulation and test files are byte-identical to main. Recruitment/loyalty feature branches contain historical versions of code already merged through PR #6; preserve these branches rather than re-merging stale diffs. World reconciliation branch source data is already represented on main; its older game.js differs due to later campaign integration and should not overwrite main.
- **Track B — Lantern Run:** PR #18 merged into `sidegame/lantern-run` only (not main), merge commit `dd6d59a6d58ff729506716fa96863ed615e1970a`. Added a fake-DOM harness that executes the actual UI controller and checks keyboard/buttons, blocked movement, focus guard, trap/escape endings and restart. Workflow run 44051414407 passed state, UI-contract and DOM-interaction checks; post-merge branch run 44051588845 passed all three. No real browser or Android device test performed. The side game remains isolated in `side-game/lantern-run/` and its dedicated branch.
- **Next Iron Crown priority:** design and persist active-party membership for named companions without changing aggregate troop counts; then connect loyalty actions and explicit named battle participants.
- **Next Lantern Run priority:** perform a real browser/mobile smoke test when a browser environment is available, then tune the small board's feedback and replayability based on observed behavior.


### Persistent party management — 18 November 2026

- **Status:** Merged into `main` through PR #20.
- **Branch:** `feature/persistent-party-management`.
- **Merge commit:** `4f0c1e0abafa9c60e53c9685747d1c590765928d`.
- **Goal:** Assign named roster characters to a saved active party without converting generic troops into individual records.
- **Files:** `js/characters/party.js`, `js/core/state.js`, `js/core/save.js`, `js/game.js`, `index.html`, `styles/main.css`, `sw.js`, `tests/party.test.js`, `tests/campaign-save.test.js`, `tests/map-resource-ui.test.js`, `docs/CAMPAIGN_CHARACTER_CONTRACT.md`, `README.md`.
- **Implementation:** Adds ordered `activePartyIds` with a four-character capacity. Assignments validate against the campaign roster, preserve assignment order, reject duplicates/unknown IDs and leave aggregate `troops` unchanged. The Company panel exposes assignment/removal. Save v7 migrates v5/v6 campaigns and filters stale/duplicate IDs during load.
- **Checks:** JavaScript syntax and all 10 Node test files passed in GitHub Actions run 44265206031 on the final PR head. No browser/mobile/offline runtime test was performed.
- **Known limitations:** Active-party membership is not yet passed into the battle simulation. Loyalty events are still not produced by campaign actions.
- **Next action:** Connect explicit active-party participant IDs to the battle encounter and result adapter while preserving reserve accounting and aggregate troop counts.

### Branch reconciliation — 18 November 2026

- Current `main` is `4f0c1e0abafa9c60e53c9685747d1c590765928d`.
- Only open PR is #2, the standalone battlefield reference prototype. It remains draft and is intentionally not merged as integrated gameplay.
- The roster/save, named-recruitment and world-resource changes are already represented on `main`. Their older branches are historical references; do not re-merge stale diffs. The old save-v6 branch is behind and must not overwrite save v7.
- `feature/battle-core` has battle simulation and test blobs byte-identical to `main`; no code re-merge is required. Campaign battle entry/exit, persistent participant mapping and result application remain incomplete.
- `feature/campaign-loyalty-adapter` has adapter and loyalty service files byte-identical to `main`. The service exists, but live campaign action producers and loyalty-state persistence are not connected.
- Side game PR #21 merged into `sidegame/lantern-run` only, merge commit `76020a9cfd5239930b1c88b2fdd965140a243c23`. Lantern Run now cycles through three deterministic ruin layouts; state, UI contract and fake-DOM interaction checks passed in workflow run 44264871440. No real browser or Android device test was performed.
- Side game remains isolated under `side-game/lantern-run/` on `sidegame/lantern-run`; its changes are not part of Iron Crown `main`.


### Campaign battle outcomes — lead integration (19 Nov 2026)

- **Status:** Merged into `main` through PR #23 (`ce74ffa02e43bcfdcf1bdec572271fa931e03e22`).
- **Goal:** Connect active named-party membership to the existing battle simulation and apply outcomes once to authoritative campaign state.
- **Files:** `js/battle/battle-simulation.js`, `js/characters/campaign-battle.js`, `js/characters/campaign-roster.js`, `js/characters/party.js`, `js/core/state.js`, `js/core/save.js`, `js/game.js`, `index.html`, `sw.js`, focused battle/save/party/UI tests, README and campaign contract.
- **Implementation:** Hostile roaming encounters now run through the existing deterministic battle simulation rather than the previous power-comparison shortcut. Active named party members are sent as explicit stable character IDs and fielded before generic foot troops. The simulation returns participant IDs and named-character survival outcomes. Campaign application updates generic troop survivors from the `foot` group only, hero health, victory rewards, defeated-party state, and participant trust/morale through the existing loyalty adapter. Named characters who fall become `recovering`, are removed from the active party and cannot be reassigned while recovering.
- **Replay safety:** Save version 8 adds a bounded last-200 resolved battle ID ledger. Encounter event sequence is saved before simulation; result application checks the ledger before changing rewards, casualties or loyalty.
- **Important limitation:** Current campaign encounters use automatic tactical resolution. The separate battlefield prototype PR #2 remains an unmerged reference; player-controlled battlefield presentation, retreat UI and real browser/mobile playtesting are not included in this slice.
- **Checks:** Added focused Node tests for campaign battle mapping, participant outcomes, retreat, party recovery and v7→v8 migration. CI result pending at hand-off; no browser, mobile, local-storage runtime or offline launch test performed.
- **Next action:** Build the player-controlled battlefield renderer on top of the same simulation contract. Preserve PR #2 as a visual/reference source until its independent logic is reconciled; do not import its duplicate battle simulation.



### Final daily hand-off — 19 Nov 2026

- **Iron Crown main:** `ce74ffa02e43bcfdcf1bdec572271fa931e03e22` — campaign encounters now use the existing battle simulation through PR #23. Named active-party IDs are passed into battle and returned with survival outcomes; generic `foot` survivors and reserves remain separate; hero health, victory rewards, defeated-party state and participant loyalty are applied once. Save v8 stores the last 200 resolved battle IDs and migrates v5/v6/v7 saves.
- **Iron Crown checks:** GitHub Actions run 44487667971 passed JavaScript syntax and all 11 root Node tests. No browser, Android, browser save/load or offline runtime test was performed.
- **Iron Crown remaining:** current encounters auto-resolve tactically; player-controlled battlefield presentation, retreat UI, recovery actions and non-battle loyalty event producers remain future work. PR #2 remains an open draft reference and is not merged as integrated gameplay. Issue #5 remains open for map runtime validation; Issue #7 remains open for remaining loyalty and battle presentation work.
- **Lantern Run:** PR #24 merged into `sidegame/lantern-run` as `b504a0ae03b8fc52499903f505a1a8211c5340d4`. Free BFS hints avoid hazards, respect remaining light and do not mutate game state. Side-game workflow run 44487253224 passed state, UI-contract and fake-DOM interaction checks. No real browser/device test performed.
- **Next Iron Crown priority:** player-controlled battlefield renderer and encounter choice using the authoritative simulation; do not duplicate simulation logic from PR #2.
- **Next Lantern Run priority:** continue small deterministic gameplay improvements; preserve the 5×5 board, no-dependency architecture and testable state/UI boundary.


### Companion recovery follow-up — 19 Nov 2026

- **Status:** Merged into `main` through PR #27 (`7d2e7a26600eaffe993231f7259b313d24359b13`).
- **Reason:** Battle PR #23 introduced the `recovering` status and prevented reassignment, but the game did not yet provide a recovery action. That would leave fallen companions unavailable indefinitely.
- **Change:** A two-hour camp rest now returns recovering named characters to `available`, increases morale by 10 (clamped to 100), refreshes the Company panel and saves. Players must manually reassign recovered characters.
- **Checks:** PR workflow run 44488043913 passed JavaScript syntax and all 11 root Node test files. The main post-merge syntax/deployment workflows were still running at this hand-off. No browser/mobile runtime test performed.
- **Next action:** Continue toward player-controlled battlefield presentation; retain the recovery test and require camp rest before a recovering character can rejoin.


### Final daily hand-off — 19 Nov 2026 (post-recovery)

- **Iron Crown main:** `7d2e7a26600eaffe993231f7259b313d24359b13`. PR #23 connected hostile campaign encounters to the authoritative battle simulation and applied participant outcomes exactly once. PR #27 added a two-hour camp recovery action for named characters who fall in battle. Save schema remains v8; generic troops remain aggregate and unfielded troops remain reserves.
- **Iron Crown CI:** PR #23 workflow run 44487667971 passed JavaScript syntax and all 11 root Node tests. PR #27 workflow run 44488043913 also passed all 11 root Node tests. Main post-merge workflow 44488334340 and Pages deployment 44488334331 were pending at hand-off; do not claim their final result until rechecked.
- **Open work:** PR #2 remains the only open PR, a draft standalone battlefield presentation reference. It is not integrated campaign gameplay and must not replace the authoritative simulation. Issue #5 remains open for browser/mobile/offline map validation. Issue #7 remains open for general non-battle loyalty event producers, Chronicle deferral and battle presentation work.
- **Branch reconciliation:** PR #26 was closed as superseded by PR #27; its branch is preserved. No historical feature branch was deleted. Old battle-core and loyalty branches remain references because their relevant service code is already on main.
- **Lantern Run:** PR #24 merged into `sidegame/lantern-run` as `b504a0ae03b8fc52499903f505a1a8211c5340d4`. Free safe-route hints use BFS, avoid traps, respect remaining light and do not mutate state. Post-merge workflow run 44487636410 passed all three side-game test groups. No real browser/device test performed.
- **Next Iron Crown priority:** build a player-controlled renderer and encounter choice on the current battle event contract; then test browser/mobile and save/offline flows.
- **Next Lantern Run priority:** continue deterministic, low-dependency gameplay refinements; a real browser smoke test remains outstanding.


### Player-controlled campaign battlefield — 20 Nov 2026

- **Status:** Merged into `main` through PR #29 as `36ff25a58b06ce6c6c38d847e7837b2ef02bb1fd`.
- **Goal:** Replace automatic hostile encounter resolution with a player-controlled presentation while keeping `js/battle/battle-simulation.js` authoritative.
- **Files changed:** `js/battle/battle-view.js`, `js/characters/campaign-battle.js`, `js/game.js`, `index.html`, `styles/battle.css`, `sw.js`, `tests/battle-view.test.js`, `tests/campaign-battle.test.js`, `tests/map-resource-ui.test.js`.
- **Implementation:** Hostile map encounters now open a canvas battlefield. Keyboard and touch controls move the commander; Attack sends player input; Advance/Hold/Regroup issue simulation orders; Retreat resolves through the existing campaign result path. Campaign stepping applies the result exactly once, preserving the existing named-character, aggregate-troop, reserve, loyalty and save contracts. New assets are included in shell cache v17.
- **PR #2 reconciliation:** Its standalone prototype remains an open draft reference. Its duplicate combat loop was not imported; its useful presentation ideas were adapted to the current simulation contract. The PR branch remains 3 commits ahead and 16 behind main, so it is not safe to merge wholesale.
- **Checks:** GitHub Actions run 44705828926 passed JavaScript syntax and all root Node test files, including the new fake-canvas/fake-DOM battlefield interaction test and campaign-controller input/order/retreat tests. A first run exposed an outdated v16 cache assertion; the test was updated to v17 and the full suite passed. No real browser, Android-device, browser save/load, or offline-launch test was performed.
- **Known limitations:** The battlefield is a first integrated renderer, not a terrain/formation editor. In-progress battle state is not persisted mid-fight; encounter start and resolved outcomes are saved. Browser/device runtime validation remains outstanding.
- **Next action:** Perform real browser smoke testing and validate mobile pointer controls before extending battle mechanics.

### Lantern Run run-control correction — 20 Nov 2026

- **Status:** Merged into `sidegame/lantern-run` through PR #30 as `f907181dcc3a21ea73e6c839eb32fcec34eb4c94`; isolated from Iron Crown main.
- **Change:** An active run now offers `Restart ruin`; a failed run offers `Try again` and retries the same layout; only a successful escape offers `Next ruin`. Completing the third layout wraps to the first. This prevents a failed puzzle from being skipped by pressing restart.
- **Files changed:** Side-game `index.html`, UI contract test, fake-DOM interaction test and README.
- **Checks:** Lantern Run workflow runs 44705629585 and 44705587920 passed deterministic state, UI contract and fake-DOM interaction tests. No real browser or Android-device test was performed.
- **Next action:** Prioritize a real browser smoke test rather than adding more mechanics.


### Active battle checkpoint and resume — 20 Nov 2026

- **Status:** Merged into `main` through PR #32 as `6cdbe9ff328173f2e9b3677a4d6d394275a19730`; latest feature-branch GitHub Actions run 44708570322 passed.
- **Goal:** Preserve an in-progress player-controlled campaign battle across reloads without applying a result twice or changing campaign casualties/rewards.
- **Implementation:** Battle simulation exposes a version-1 active-state serializer and guarded restore path. The campaign battle adapter serializes the pending enemy/participant mapping with the simulation state and restores only when the enemy is not already defeated and the exact active-party IDs still match. Save schema advances from v8 to v9; v5-v8 migration preserves existing campaign values. The campaign checkpoints on initial battle save, every five seconds while active, page hide and visibility change. Invalid checkpoints are discarded without applying a result. If animation-frame support is absent, the valid checkpoint is retained.
- **Presentation detail:** Named battle units now carry their recruit names into the simulation snapshot and the battlefield draws those labels above the named units.
- **Files:** `js/battle/battle-simulation.js`, `js/battle/battle-view.js`, `js/characters/campaign-battle.js`, `js/core/state.js`, `js/core/save.js`, `js/game.js`, `sw.js`, save/battle/view tests, README, and `docs/CAMPAIGN_CHARACTER_CONTRACT.md`.
- **Tests added:** Simulation snapshot/restore and deterministic continuation; campaign checkpoint restore and participant mismatch rejection; v8→v9 migration; active-battle save/load round trip; named companion label rendering.
- **Checks:** First Actions run `44707925914` passed syntax but failed in the Node suite because save tests still expected v8. Those expectations were updated and an explicit v8→v9 migration test was added. The latest run is `44708463072` and was in progress at this hand-off; do not claim it passed until rechecked. No browser, Android, browser local-storage, pagehide or offline runtime test has been performed.
- **Known limitations:** Checkpoints are best-effort every five seconds and on page lifecycle events; abrupt process termination between checkpoints can lose the last few seconds. Mid-battle checkpoints are versioned and rejected if participant order or enemy state no longer matches.
- **PR:** #32 merged into `main` as `6cdbe9ff328173f2e9b3677a4d6d394275a19730`. Preserve PR #2 as an isolated prototype reference; its duplicate combat loop remains unsuitable for merge.


### Lantern Run HUD — 20 Nov 2026

- **Status:** Merged into `sidegame/lantern-run` through PR #31 as `fde63bb0f3c0771d8311b5a2e861dffba75507fe`.
- **Change:** Added a visible lantern-light progress meter, accessible remaining-light text and a move counter. Legal movement updates both; hints and blocked moves leave them unchanged; retry resets them.
- **Files:** `side-game/lantern-run/index.html`, UI contract test, fake-DOM interaction test and README.
- **Checks:** Latest side-game workflow run `44708374153` passed; earlier incremental run `44708359933` failed before the updated interaction/contract tests landed. No real browser or Android-device test performed.
- **Next action:** Perform real browser validation when an actual browser environment is available; keep the side-game branch isolated from Iron Crown main.


### Final daily hand-off — 20 Nov 2026 (post-merge)

- **Iron Crown main:** `6cdbe9ff328173f2e9b3677a4d6d394275a19730`. PR #32 adds versioned active-battle serialization/restore, save v9 migration from v5-v8, five-second and page-lifecycle checkpoints, guarded campaign resume, and named companion labels on the battlefield.
- **Iron Crown checks:** Feature run 44708570322 passed syntax and all 11 root Node tests. Main post-merge run 44708845308 passed syntax and all 11 root Node tests. GitHub Pages deployment run 44708845148 succeeded. No actual browser, Android, browser local-storage, pagehide or offline-launch test was performed.
- **Save limitations:** Active battle checkpoints are best-effort every five seconds and on page hide/visibility change. A sudden process termination between checkpoints can lose the most recent few seconds. A checkpoint is rejected if its enemy identity or exact active-party participant order no longer matches.
- **Open work:** PR #2 remains the only open PR, a draft standalone battlefield prototype. It has no review comments and remains 3 commits ahead / 16 behind; preserve it as reference rather than importing its duplicate combat loop. Issue #5 remains open for map/world runtime validation and actionable resource integration. Issue #7 remains open for non-battle loyalty event producers; Chronicle remains deferred.
- **Lantern Run:** PR #30 merged retry/progression behavior into `sidegame/lantern-run` as `f907181dcc3a21ea73e6c839eb32fcec34eb4c94`; PR #31 then added the accessible lantern meter and move counter as `fde63bb0f3c0771d8311b5a2e861dffba75507fe`. Post-merge side-game workflow run 44708669972 passed state, UI-contract and fake-DOM interaction tests. No real browser or Android-device test performed.
- **Next Iron Crown priority:** perform a real browser smoke test of map → recruit → assign party → hostile encounter → move/order/attack/retreat → recovery → save/reload, then verify mobile pointer controls and offline launch. Do not add more combat complexity until this vertical slice is exercised in a real browser.
- **Next Lantern Run priority:** perform a real browser smoke test of movement, hints, HUD updates, retry and three-ruin progression; then address only issues observed.


### Repository reconciliation correction — 20 Nov 2026

- PR #29 (player-controlled campaign battlefield) is merged into `main` as `36ff25a58b06ce6c6c38d847e7837b2ef02bb1fd`.
- PR #30 (Lantern Run retry/progression correction) is merged into `sidegame/lantern-run` as `f907181dcc3a21ea73e6c839eb32fcec34eb4c94`.
- PR #31 (Lantern Run progress HUD) is merged into `sidegame/lantern-run` as `fde63bb0f3c0771d8311b5a2e861dffba75507fe`.
- PR #32 (resumable campaign battles/save v9) and PR #33 (post-merge hand-off) are merged into `main`.
- The only remaining open PR is #2, a draft standalone battlefield prototype. Preserve it; do not merge its duplicate simulation/presentation loop.


### Daily development hand-off — 21 Nov 2026

- **Starting main:** `47b81bfba09817c864443dedb9396d1ce6c59fb3`. Before changes, current main, all branch names, the coordination contract, PR #2, its comments/reviews, Issues #5/#7 and recent Actions runs were inspected.
- **PR #2 reconciliation:** Closed as superseded by the simulation-driven battlefield now integrated on main. The standalone HTML prototype remains on `feature/playable-battlefield-prototype` with its full history; no source files or branch history were deleted. Its duplicate combat loop is not imported.
- **Iron Crown PR #35:** `feature/battle-pause-resume` adds an explicit battlefield pause/resume control and `P` shortcut. Pause stops the animation loop, clears movement input, keeps retreat available, and calls the existing campaign save callback to persist the active battle checkpoint immediately. Resume resets the frame clock. The control exposes `aria-pressed` and disables after resolution. Service-worker shell is v19.
- **Iron Crown validation:** A first run failed because `tests/map-resource-ui.test.js` still expected shell v18; it was updated to v19. Latest Actions runs 44886060224 and 44886071234 passed JavaScript syntax and the complete root Node test suite. No real browser, Android, save/load-in-browser, page-lifecycle or offline-launch test has been performed.
- **Lantern Run PR #36:** Isolated branch `feature/lantern-run-records`, targeting `sidegame/lantern-run`. Adds scoring (remaining light, moves and hints used), a 100-point hint penalty, per-ruin best records with a versioned local-storage schema, graceful session-only fallback when storage is blocked/corrupt, and state/storage/UI/fake-DOM tests. The side-game Actions run was still running at this hand-off; do not claim it passed until rechecked.
- **Next Iron Crown priority:** Real browser smoke test of map → recruit → assign party → battle → pause/resume → retreat/result → recovery → save/reload. After that, address the still-open non-battle loyalty-event producer contract (Issue #7) and actionable resource-gathering contract (Issue #5).
- **Next Lantern Run priority:** Confirm PR #36 CI, then real browser test of score display, local records, hint penalty, all three ruins and blocked-storage fallback. Keep it isolated from main.
