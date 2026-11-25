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


### Final daily hand-off — 21 Nov 2026 (post-merge)

- **Iron Crown main:** PR #35 merged as `5dbdc74f21588d38fd927fbbdf224fe4f66e8e85`. The battlefield now has a visible Pause/Resume control and `P` shortcut. Pause cancels the frame loop, clears movement input, leaves retreat available, and immediately invokes the existing campaign save callback to persist the active checkpoint. Resume resets frame timing. No save-schema change was needed; save remains v9. Service-worker shell is v19.
- **Iron Crown checks:** PR head `a899e832b602259a537a58afa5fc88dbc2905dd3` passed JavaScript syntax and the full root Node suite in runs 44886060224 and 44886071234. Post-merge main syntax/regression run 44886158551 passed. The first attempt exposed stale v18 cache expectations in two tests; both were updated to v19 before merge.
- **Pages deployment:** Main run 44886158567 uploaded the `github-pages` artifact successfully, but `actions/deploy-pages@v4` reported that it found zero artifacts. A retry of the failed deploy job also failed at artifact lookup even though the Actions API lists uploaded artifacts for the run. Treat this as an unresolved GitHub Actions/Pages artifact-lookup issue, not a successful deployment. A fresh main push after this documentation hand-off will provide another deployment attempt; if it repeats, investigate Pages/Actions service state and workflow permissions rather than changing game code.
- **PR #2 reconciliation:** Closed as superseded. Its standalone prototype remains intact on `feature/playable-battlefield-prototype`; no branch or source files were deleted. The duplicate combat loop is not merged.
- **Lantern Run:** PR #36 merged into `sidegame/lantern-run` as `8f09a01e26037240b45d41dd4edb2ed0fdd05cef`. It adds a score based on remaining light, moves and hints used; hints remain free in light but cost 100 score points. Per-ruin best scores use a versioned validated local-storage record. Invalid/corrupt/blocked storage falls back to session-only records without blocking play. Run 44886182037 passed syntax, deterministic state tests, progress-store tests, UI contract tests and fake-DOM interaction tests. Two earlier test failures were corrected: hint-feedback expectation and retry resetting the hint penalty.
- **Repository status:** No open PRs. Issues #5 and #7 remain open with 21 Nov updates. Issue #5 tracks real map/mobile/offline validation and the future authoritative resource-stock/gathering contract. Issue #7 tracks non-battle loyalty event producers and campaign-owned replay persistence; Chronicle remains deferred.
- **Not tested:** No actual browser, Android device, browser save/load, pagehide/visibility lifecycle, offline service-worker launch, or real local-storage quota/security behavior was exercised. The fake-DOM tests are not browser tests.
- **Next Iron Crown priority:** Run a real browser smoke test of map → named recruitment → party assignment → hostile encounter → move/order/attack → pause/resume → retreat/result → camp recovery → save/reload. Then implement one non-battle loyalty event producer with campaign-owned event IDs and replay tests; design resource gathering only after the stock/inventory/time contract is explicit.
- **Next Lantern Run priority:** Real browser test of all three ruins, scoring, per-ruin best records, hint penalty, retry reset and blocked-storage fallback. Avoid adding mechanics until this runtime pass is completed.


### Pages retry result — 21 Nov 2026

The fresh main push created by the 21 Nov coordination hand-off succeeded: JavaScript checks run 44886328114 passed, and GitHub Pages deployment run 44886328203 completed successfully. The earlier run 44886158567 failed twice at artifact lookup even though the artifact upload was visible through the Actions API; no workflow or game-code change was required. Treat the earlier failure as transient and retain the standard Pages workflow unless it recurs.


### Daily development hand-off — 22 Nov 2026

- Starting main: 2412c7aacb7d177fd44f1378285e707a31b16fe4. Open PR queue was empty; Issues #5 and #7 were read with their comments. Current main save schema is v9, the service-worker shell is v19, and the previous main JavaScript/Pages workflows both passed.
- Branch: feature/nonbattle-discovery-loyalty.
- Goal: implement the first real non-battle campaign loyalty producer using campaign-owned event IDs and persistent replay protection.
- Implementation: new wilderness discoveries now emit troops:discovery only to the exact named IDs in the active party. The roster monotonic createEventId() sequence supplies identity; trust/morale results are written back to the authoritative roster. Save v10 persists the last 200 resolved campaign event IDs. v5-v9 migrations preserve existing campaign state and default the new ledger to empty. Generic troop groups remain aggregate; no Chronicle dependency is added.
- Files: js/characters/campaign-loyalty-runtime.js, js/core/state.js, js/core/save.js, js/game.js, index.html, sw.js, tests/campaign-loyalty-runtime.test.js, tests/campaign-save.test.js, tests/map-resource-ui.test.js, docs/CAMPAIGN_CHARACTER_CONTRACT.md, docs/DEVELOPMENT_FOUNDATION.md, README.md, and this coordination log.
- Validation plan: JavaScript syntax plus the complete root Node suite through the PR workflow; specifically event identity, active-party-only recipients, rejected/empty recipients, replay in-session, replay after roster/save restoration, and v9-to-v10 migration.
- Limitations: no real browser, Android, browser local-storage, pagehide, offline-launch or gameplay runtime test is performed by this change. Only discovery is wired as a non-battle event producer; payment, protection, promises, training and other event types remain future producers.
- Next Iron Crown priority: verify PR checks and merge only if green. Then perform real-browser vertical-loop testing; after that add further non-battle event producers or define the resource-stock/inventory/time contract for Issue #5.
- Track B — Lantern Run: found a resilience gap: if reading window.localStorage itself throws, the UI set its progress store to null, so it kept playing but lost the promised session-only best record. The next isolated side-game branch will fall back to an in-memory progress store and test the actual UI controller against a throwing storage getter.
- Branch reconciliation: no stale feature branch was merged. The loyalty-adapter branch and older battle/world branches remain historical divergent snapshots. The side game remains on its dedicated sidegame/lantern-run branch; no side-game files are added to Iron Crown main.


### Final post-merge hand-off — 22 Nov 2026

- Iron Crown PR #39: merged into main as 8b1ccb0dd4540166e79e71400104eef1c17fd4dc. Save schema is v10; service-worker shell is v20. A successful new wilderness discovery emits troops:discovery to the exact active named-party IDs, applies loyalty through the existing adapter, writes trust/morale to the authoritative roster and records the campaign event ID in the last-200 replay ledger. The roster's persisted event sequence prevents ID reuse after reload. Empty parties produce no event; generic troops remain aggregate.
- Iron Crown checks: PR workflow run 45002690509 passed JavaScript syntax and all 13 root Node test files. Main post-merge syntax/regression run 45002725788 passed. GitHub Pages deployment 45002725833 succeeded. The first PR run exposed one stale cache-version assertion in tests/battle-view.test.js (v19); it was updated to v20 and both final PR-head checks passed.
- Issue #7: updated with the merged discovery producer and replay/save details. It remains open for additional non-battle producers (payment, protection, promises, training, etc.); Chronicle remains deferred.
- Lantern Run PR #40: merged into sidegame/lantern-run as c2f34f11501502e124cd88d74cd1388030a72ea0. If reading window.localStorage itself throws, the UI now creates an in-memory progress store and retains session best-score feedback. Added write-failure coverage and a fake-DOM interaction test that completes a ruin under a throwing storage getter. PR workflow 45002595819 and post-merge branch workflow 45002696360 passed all side-game checks.
- Repository status: no open pull requests. Issues #5 and #7 remain open. Historical battle, loyalty, map and side-game branches were compared against their current targets; divergent snapshots were preserved rather than force-merged or deleted.
- Not tested: no real browser, Android device, actual local-storage quota/security environment, pagehide/visibility lifecycle, or offline-launch gameplay test was performed. The side-game UI test uses a simulated DOM.
- Next Iron Crown priority: real-browser validation of roam → discover → active-party loyalty → battle → pause/resume → retreat/result → camp recovery → save/reload. Then add the next campaign loyalty producers and define the authoritative resource-stock/inventory/time contract for Issue #5.
- Next Lantern Run priority: real-browser testing of all three ruins, scoring, retry, hints, personal records and blocked-storage fallback. Avoid adding new mechanics until that runtime pass is completed.


### Camp companion training — 23 Nov 2026 (feature branch)

- **Status:** Merged into `main` through PR #41 as `d8ef29fc2f2c06778dc5a04618468a60cc284b6f`.
- **Starting main:** `5040b2d1375fbb03280e08f8e3e596e1df29c959`. Open PR queue was empty; Issues #5/#7 and their comments, recent commits, current main, branch inventory and relevant historical branch comparisons were inspected.
- **Goal:** Add one real camp action that produces the already-supported `troops:training` loyalty event without introducing another save schema or treating generic soldiers as named characters.
- **Implementation:** The Company panel exposes Camp training. It is available only while camped, not travelling or in battle, with at least one valid active named character and 2 supplies. A successful action emits one campaign-owned training event to the exact active-party IDs, spends 2 supplies and advances campaign time by 60 minutes with day rollover. Rejected or duplicate loyalty results do not consume resources.
- **Files:** `js/characters/campaign-training.js`, `js/game.js`, `index.html`, `sw.js`, `tests/campaign-training.test.js`, `tests/campaign-training-ui.test.js`, `tests/campaign-loyalty-runtime.test.js`, cache assertions, README, development foundation and campaign character contract.
- **Compatibility:** Save remains v10; the existing roster event sequence and bounded `resolvedCampaignEventIds` ledger persist the event. Generic troops remain aggregate. Service-worker shell advances to v21.
- **Validation:** PR workflow run `45148516228` passed JavaScript syntax and all root Node test files. Main post-merge run `45148789032` passed; Pages deployment `45148789173` succeeded. The unit test covers camp/travel/battle/party/supply guards, exact participant IDs, loyalty failure, supply cost and midnight rollover; runtime regression covers motivation effects and replay after roster restoration.
- **Known limitations:** Training currently changes trust/morale only; it does not yet grant combat skills or equipment bonuses. No real browser, Android, local-save or offline-launch test is performed in this session.
- **Branch reconciliation:** `fix/camp-recovery-for-companions` is 7 commits ahead / 28 behind and touches battle/save-adjacent files; `feature/campaign-battle-outcomes` is 24 ahead / 29 behind across shared campaign contracts; `feature/battle-core` is 12 ahead / 41 behind and contains an earlier simulation snapshot. These divergent historical branches are preserved, not merged. On Lantern Run, `sidegame/lantern-run-storage-fallback` is an ancestor of the current side-game branch; `sidegame/lantern-run-hints` is 6 ahead / 18 behind and remains a divergent historical snapshot.
- **Next:** Run real-browser validation of the connected map → recruit → party → camp training/discovery → battle → recovery → save/reload loop when a browser runtime is available. Issue #5's resource stock/gathering contract remains deferred until the authoritative inventory/time ownership is defined.


### Final post-merge hand-off — 23 Nov 2026

- **Iron Crown main:** PR #41 merged as `d8ef29fc2f2c06778dc5a04618468a60cc284b6f`. The Company panel now offers camp training for the exact active named party. It requires camp, no travel or active battle, at least one valid active character and 2 supplies; a successful action emits `troops:training`, spends 2 supplies and advances campaign time by 60 minutes with day rollover. The existing loyalty runtime updates trust/morale and the save-v10 campaign event ledger prevents replay. No save-version change; service-worker shell is v21.
- **Iron Crown validation:** PR checks run `45148516228` passed JavaScript syntax and all root Node test files, including the new training service and UI-contract tests plus loyalty training/replay coverage. Main post-merge run `45148789032` passed. GitHub Pages deployment `45148789173` completed successfully. The PR's earlier per-commit push runs also completed; one early run failed while the partial branch was still being assembled, but the final PR run and main run both passed.
- **Lantern Run:** PR #42 merged into `sidegame/lantern-run` as `729d7357b1bdf58781858b58f96cabfe22d77945`. The misleading “Hint · free” label now says “Hint · −100 score”; the accessible label and opening copy disclose the 100-point penalty while clarifying that no lantern light is consumed. The interaction test asserts that cost is visible before the hint is used. PR run `45148628150` and post-merge run `45148797050` passed all six side-game check stages.
- **Repository status:** No open pull requests. Issue #7 remains open for payment, protection, promise and other non-battle producers; Issue #5 remains open for real map/mobile/offline validation and an authoritative resource-stock/inventory/time contract. No actionable gathering or stock mutation was added.
- **Historical branches:** The camp-recovery, battle-outcome and battle-core branches remain divergent historical snapshots and were not force-merged. The older Lantern Run hints branch is also divergent; the storage-fallback branch is an ancestor of the current side-game branch. All were preserved.
- **Not tested:** No real browser, Android device, actual browser local-storage, page lifecycle or offline-launch gameplay test was performed. The new training unit and UI tests run under Node; Lantern Run UI interaction remains fake-DOM.
- **Next Iron Crown priority:** Real-browser smoke test of map → recruit → party → camp training/discovery → battle → recovery → save/reload. Then add one further non-battle loyalty producer (payment or protection) only when an actual successful campaign action exists to emit it. Keep Issue #5's resource contract separate until inventory/time ownership is defined.
- **Next Lantern Run priority:** Real browser test of all three ruins, scoring, hints, retry and personal records. No further mechanics until that runtime pass is performed.


### 24 Nov 2026 — companion pay, travel controls and browser validation

#### Track A — Iron Crown

- **Main:** `84d32665d2eb89b1d772734d1299636c48773a1e`.
- **PR #43 merged:** Daily companion pay; merge commit `62b972e7122889f5dda4914e623beaac0257f21e`.
- **PR #45 merged:** Refresh Camp/Rest/Training/Payment controls immediately after settlement or off-road travel begins; merge commit `c369d6257a3877aef32d73194b6419f02b84e4b5`.
- **PR #46 merged:** Restore those controls after travel arrival and cancellation, with encounter processing before refresh so an active battle still keeps actions disabled; merge commit `75129c232e24be8c895597a8c03d6313c65cdbca`.
- **PR #48 merged:** Added a real Chromium smoke test and CI-only Playwright installation; merge commit `84d32665d2eb89b1d772734d1299636c48773a1e`.
- **Campaign state:** Save v11 persists `lastCompanionPayDay`. Daily wages cost 5 gold per active named companion, once per campaign day, and emit the existing `troops:paid` event. Generic troops remain aggregate. No new loyalty ledger or Chronicle dependency.
- **Travel controls:** Shared camp actions refresh on travel start, arrival and cancellation. The payment/training services remain authoritative guards.
- **Real-browser validation:** Chromium workflow `45357066858` passed on the PR branch and main workflow `45357252463` passed after merge. The test loads a v11 save at Kingsbridge, recruits Mara Venn through the settlement UI, assigns her to the active party, pays daily wages, establishes camp, trains her, and verifies loyalty, gold, supplies, campaign time, party membership and the paid-day guard after a real browser reload. No uncaught page errors were reported.
- **Test-harness correction:** The first browser run re-seeded the original save on every reload because the init script ran on navigation. A sessionStorage one-time guard fixed the harness; the game save/load path then passed.
- **Deployment:** Main JavaScript + Chromium checks passed. GitHub Pages deployment for main commit `84d3266` succeeded after retry (`45357252446`); the first attempt hit a transient artifact-metadata lookup failure. The successful retry deployed the merged main state.
- **Issue #7:** Updated to record live producers (discovery, training, daily pay, battle victory/defeat) and remaining event types. Protection, abandonment, promises, unpaid wages, reckless orders, safe retreat and avenged events remain deferred until real gameplay actions exist.
- **Issue #5:** Still open. Resource-site data remains informational; authoritative resource stock, gathering, inventory quantities and campaign-time contract are not yet integrated.
- **Not tested:** No physical Android device or offline-launch test. The first Iron Crown browser smoke does not yet cover travel, hostile encounters, battle orders, retreat, casualties or camp recovery.

#### Track B — Lantern Run

- **Isolated branch:** `sidegame/lantern-run`, current commit `544987bbd64166f85e18c581589d3136ea95849c`.
- **PR #44 merged into the side-game branch only:** Playwright/Chromium smoke coverage, narrow-viewport box sizing and browser-storage fallback checks.
- **Real browser validation passed:** Merged-branch push workflow `45355757587` passed; final PR branch runs `45355575021` and `45355584445` also passed.
- **Verified in Chromium:** Keyboard movement, blocked movement, hints, all three ruin routes, trap retry, score calculation, browser localStorage persistence across reload, 320px viewport without horizontal overflow, and session-only fallback when the localStorage getter throws.
- **Limitations:** No physical Android device test. Playwright is installed only in CI; game runtime remains dependency-free.

#### Repository reconciliation and next priorities

- PRs #43–#48 are merged (PR #44 into the isolated side-game branch); historical feature branches remain preserved.
- No historical divergent battle, roster, recovery or map branch was force-merged or deleted.
- **Iron Crown next:** Extend the real-browser suite to travel start/arrival/cancellation, hostile encounter, battle pause/orders/retreat, outcome application and camp recovery. Then define Issue #5's resource-stock/inventory/time contract.
- **Lantern Run next:** Keep mechanics stable; validate on a physical mobile device when available and fix only observed defects.


### 24 Nov 2026 — expanded campaign browser smoke and Lantern Run touch emulation

#### Track A — Iron Crown

- **Stable main baseline:** `911bfbcb8fe0497d8504c3427e9aca726d0387f0` (PR #49 merged the 24 Nov browser-validation hand-off).
- **PR #51:** `test/iron-crown-battle-browser-smoke`, latest test commit `987e9250fdf6ca6f6ed43d1100a6183d6438f8a8`. Test-only; no campaign runtime, save schema, battle simulation or production dependency changed.
- **Real Chromium coverage added:** settlement travel start/cancel/arrival and camp-control refresh; off-road travel into Redvale Raiders; actual campaign battle opening; pause/checkpoint; reload and restoration of the same encounter; Hold order; retreat; exactly-once resolved-battle ledger; enemy remains undefeated on the map; and two-hour camp recovery/reassignment in a separate context seeded with a valid `recovering` companion.
- **Validation:** PR workflow `45359416889` passed JavaScript syntax, all 17 root Node regression files, Playwright/Chromium installation and the expanded real-Chromium smoke test. The first attempt failed because Playwright clicked the centre of the SVG group bounding box (an unpainted gap); the test now clicks the visible marker circle. The corrected run passed.
- **Recovery-test boundary:** The browser recovery case seeds a character already in `recovering` status. It validates the real camp-rest recovery action and reassignment, but does not yet produce a casualty through a live battle. The battle path currently tests pause/resume, order and retreat, not a full victory/casualty outcome.
- **Not tested:** Physical Android device, offline service-worker launch, live battle casualty creation/recovery, or the resource-site inspection panel in a real browser.
- **PR #51:** Merged into `main` as `dda893b1eb1c53739e866ad900fd501325512165` after final PR workflow `45359599731` passed. Main post-merge workflow `45359885595` passed JavaScript syntax, all 17 root Node test files and the expanded Chromium smoke test; Pages deployment `45359885603` succeeded.
- **Next:** After merging this test coverage, extend the browser path to a deterministic live battle outcome/casualty where feasible, then test the resource-site panel. Keep Issue #5's stock/inventory/time contract separate; resource sites remain informational.

#### Track B — Lantern Run

- **PR #50 merged into the isolated `sidegame/lantern-run` branch** as `7146cea812fe5a4b8d14429feb3feaf83e3dbea5`; the source branch `test/lantern-run-touch-smoke` is preserved.
- **Touch-emulated browser coverage:** Playwright Chromium uses a 320×720 mobile-emulated context with touch input. It verifies `navigator.maxTouchPoints`, tap movement, tap hint, visible 100-point penalty, tap restart, no horizontal overflow and no uncaught page errors.
- **Validation:** PR/post-merge workflow `45358492276` passed all deterministic/UI checks and real Chromium touch emulation. The follow-up development-log commit `de099ae4f73a50f26563c194d8d44850fa25d1d9` also passed workflow `45358724404`.
- **Not tested:** Physical Android device. Emulation is not a device test.
- **Next:** Keep mechanics frozen; arrange physical-device validation when available and fix only observed issues.

#### Repository reconciliation

- PR #49 merged to `main`; PR #50 merged only to `sidegame/lantern-run`; PR #51 is the only currently open PR.
- Historical battle, recovery, travel and browser-test branches remain preserved. The older travel-control and browser-validation snapshots are not force-merged over current main/side-game contracts.
- Issues #5 and #7 remain open. Issue #7 now has real Chromium coverage for the campaign subset above; remaining loyalty producers still require real gameplay actions. Issue #5 still owns the future map-side resource presentation work, while authoritative stock/gathering/inventory/time rules remain unimplemented.


### 25 Nov 2026 — finite resource gathering vertical slice

#### Track A — Iron Crown

- **Baseline:** `main` at `28014286064b0cff86f8b5df265ddc6103749bd2`; GitHub's open-PR endpoint returned no open pull requests at session start. Issues #5 and #7 remain open.
- **Branch:** `feature/campaign-resource-gathering-2026-11-25`.
- **Goal:** Turn the existing 12-site map catalogue into an actionable gathering loop without replacing the map, equipment inventory, supplies or troop accounting.
- **Implementation:** Added `campaign-time.js` and `campaign-resources.js`. Gathering is limited to 3 units, one campaign hour, 45 map units and 99 carried units per material. The trade yard is non-gatherable. The resource panel offers travel-to-site and gather controls; travel uses existing off-road movement and encounter processing.
- **Save:** v12 persists per-site stock and raw materials; v11 and older saves initialise stock from immutable availability and empty carried materials. Existing save key and character/battle/payment fields remain intact. Service-worker shell cache v23 precaches both modules.
- **Files:** new core time/resource modules, state/save/training integration, game UI, shell cache, migration/service/browser tests and `docs/CAMPAIGN_RESOURCE_CONTRACT.md`.
- **Validation:** Focused time/resource/save tests and real Chromium travel → gather → reload persistence are included in PR checks; results are recorded after CI. No physical Android or offline-launch claim.
- **Known limits:** No stock regeneration, trade, crafting, production chains, carrying weight or resource-driven quests. `feature/demo-world-resources` remains divergent (31 ahead / 71 behind at inspection) and overlaps shared map files; its panel work is represented on main, so no force-merge. The separate reconciliation branch is also divergent (9 ahead / 65 behind) and preserved.
- **Next:** Verify the live Chromium gather/save path, then test physical Android/offline behaviour when available.

#### Track B — Lantern Run

- **Baseline:** `sidegame/lantern-run` at `de099ae4f73a50f26563c194d8d44850fa25d1d9`; three deterministic ruins, scoring, personal records, desktop Chromium and touch-emulated Chromium checks are present.
- **Planned branch:** `sidegame/lantern-run-keyboard-focus-2026-11-25`.
- **Goal:** Make the board itself keyboard-focusable so arrow-key movement is discoverable and usable without relying on the page body receiving key events.
- **Change:** Add a focusable grid with explicit arrow-key shortcut metadata and visible focus indication; extend real Chromium tests to focus the board and move from it. No puzzle rules or scoring changes.
- **Limit:** Physical Android testing remains outstanding; touch emulation is not a physical-device test.
