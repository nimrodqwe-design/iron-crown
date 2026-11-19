# Campaign Character and Event Integration Contract

**Status:** Roster/save v8, named recruitment (PR #17), and active-party membership (PR #20) are merged. Campaign battle participant mapping and exactly-once result application are implemented on PR #23 and await CI/review. General non-battle loyalty event producers and interactive battlefield presentation remain incomplete.  
**Related work:** PR #6 (recruitment and loyalty services), Issue #7 (ownership and integration decisions).

## 1. Verified current baseline

The current `main` branch has these constraints:

- `js/core/state.js` stores aggregate `troops` and owns the authoritative named-character roster manager. Generic soldiers remain aggregate.
- `js/core/save.js` writes save version 8 and persists a version-2 roster snapshot with the campaign token and both monotonic sequences.
- `js/engine/event-bus.js` provides a reusable event bus, but `js/game.js` does not currently instantiate and wire it into campaign actions.
- The generic soldier action in `js/game.js` spends 10 gold and increments `state.troops`; the separate named-recruit action writes to the persistent roster and deducts its negotiated cost.
- `js/battle/battle-simulation.js` emits battle lifecycle events and generates battle-local field-unit IDs. Named field units also carry their persistent `characterId` metadata; campaign code retains the explicit participant-ID mapping.
- No Chronicle module/API appears in the current `main` file tree.

The roster, named recruitment and active-party assignment are persistent. Battle participants now use the same stable character IDs, and battle outcomes update those characters. The existing troop count must not be converted into invented named people.

## 2. Character identity rules

1. Every persistent named recruit gets one immutable campaign-scoped ID.
2. Never derive identity from a name, list position, settlement, party formation slot, or battle-unit index.
3. A character keeps the same ID when changing party, equipment, location, role assignment, or battle formation.
4. Generic soldiers remain aggregate troop groups until an actual individual-roster feature is agreed. No fabricated identities for the current `state.troops` value.
5. A battle-local unit ID may refer to a persistent character ID, but must never replace it.

### Implemented roster snapshot v2

```js
characterRoster: {
  version: 2,
  campaignId: "persistent-campaign-token",
  nextCharacterSequence: 1,
  nextEventSequence: 1,
  characters: [
    {
      id: "ic:<campaignId>:character:1",
      name: "Mira",
      role: "companion", // companion | officer | specialist | soldier
      background: "Former caravan guard",
      motivation: "loyalty",
      status: "available",
      recruited: true,
      trust: 50,
      morale: 60
    }
  ]
}
```

This is the persisted snapshot shape on main. Runtime campaign state owns the roster manager; save data stores its snapshot. Active-party membership, skills and character equipment are not part of this roster module yet.

### ID generation

- Create a campaign token once, when a new campaign roster is initialized, and persist it.
- Generate a character ID as `ic:<campaignId>:character:<nextCharacterSequence>`.
- Increment and save the sequence in the same campaign mutation that adds the character.
- Generate event IDs as `ic:<campaignId>:event:<nextEventSequence>`; increment and persist the sequence with the action.
- Use a UUID/random token for the campaign token, with a compatibility fallback for browsers lacking `crypto.randomUUID`. Once saved, never regenerate it on reload.
- Reject duplicate IDs during roster hydration. Do not silently overwrite an existing character.

## 3. Troop-count compatibility

The existing `state.troops` is an aggregate army headcount. It remains authoritative during migration.

- Existing saves migrate with their troop count unchanged and an empty named-character roster.
- Do not create one fake character per existing troop.
- When a named recruit with role `soldier` joins, count that soldier exactly once in the army headcount and roster; derive generic headcount as total soldiers minus named soldiers.
- Companions and officers are tracked as named party characters but must not accidentally increment the generic soldier count.
- Campaign battle integration fields up to four named party characters before the aggregate `foot` group. The simulation's 12-unit field cap preserves unfielded generic troops as reserves; garrison accounting remains deferred.

## 3A. Active-party membership — implemented in save v7; battle-connected in save v8

- `state.activePartyIds` is the authoritative ordered list of named character IDs assigned to the active party.
- The current party capacity is four named characters. This is a named-character assignment limit, not a limit on `state.troops`.
- The party manager validates every assignment against the persistent roster, rejects duplicates and unknown IDs, and removes stale IDs during hydration.
- Generic soldiers remain represented by the aggregate troop count; assigning a named companion/officer/specialist does not change `state.troops`.
- Save version 8 persists active-party IDs and the last 200 resolved battle IDs. Version 5, 6 and 7 saves migrate to version 8; existing roster records, active-party assignments and aggregate troops are preserved.
- The company panel supports assigning/removing named recruits and saves every successful change.
- Active party IDs are passed into the battle simulation as explicit persistent participant IDs. Results return per-character survival outcomes; characters who fall are marked `recovering`, removed from the active party and blocked from reassignment. A two-hour camp rest restores recovering characters to `available` and increases their morale by 10; the player must reassign them.

## 4. Campaign event contract

Campaign code emits an event only after the underlying action succeeds (for example, after gold is deducted and wages are paid, not when the player merely opens a menu).

Each event envelope must include:

```js
{
  eventId: "ic:<campaignId>:event:<sequence>",
  campaignId: "<campaignId>",
  type: "troops:paid",
  recruitIds: ["ic:<campaignId>:character:1"],
  day: 4,
  metadata: {}
}
```

Initial supported event names, matching the adapter:

- `troops:paid`, `troops:unpaid`
- `troops:protected`, `troops:abandoned`
- `troops:promise-kept`, `troops:promise-broken`
- `troops:training`, `troops:discovery`
- `troops:reckless-order`, `troops:safe-retreat`, `troops:avenged`

The producer supplies the exact affected character IDs. The adapter must not guess who was present or affected. Invalid/unknown IDs are reported and do not create new people.

### Battle participation

The campaign battle adapter explicitly passes persistent IDs for named characters in the active party. The simulation may use temporary field-unit IDs, but the campaign retains the mapping and returns it in the result:

```js
{
  battleId: "campaign-battle-token",
  participantIds: ["ic:<campaignId>:character:1"]
}
```

After the battle, call the adapter once with the stable `battleId`, outcome (`victory` or `defeat`), and the recorded participant IDs. Do not apply participant loyalty to absent companions, reserves, prisoners, or generic soldiers unless a later system explicitly defines their exposure to the event.

Implemented on PR #23: `battle:started` and `battle:ended` carry the participant IDs, and the result includes a per-character survival outcome. The campaign adapter applies the matching loyalty result and records the battle ID before saving.

## 5. Save migration and replay safety

- The current save version is 8.
- Version 5 saves migrate to an empty `characterRoster` with a newly persisted campaign token and sequences starting at 1; existing gold, troops, location, inventory, discoveries and encounter histories remain unchanged. Versions 6 and 7 preserve their existing roster and active-party data while adding the battle-result ledger.
- New saves persist the roster snapshot, campaign token, character sequence, event sequence, active-party IDs and the last 200 resolved battle IDs.
- On load, validate IDs, roles, motivation, numeric ranges and party references. Invalid character entries should be reported/recovered safely rather than corrupting the whole campaign.
- Battle result idempotency is enforced by the save-v8 campaign ledger (last 200 resolved battle IDs); trust/morale are copied back into the character roster. The standalone loyalty service's own event list is not separately persisted, so future non-battle event producers must either persist their event history or use the campaign event ledger.
- Save the event sequence with the action's state update so reload cannot reuse an event ID.

## 6. Chronicle boundary

No Chronicle module/API was found in the current main tree. The adapter's `onChronicle` callback is only a proposed integration hook. Do not claim entries are persisted until a Chronicle owner and storage contract exist.

Recommended Chronicle entries are major standing-tier changes, not every small trust/morale adjustment. Each entry should carry the event ID, character ID, old/new standing, day, and a concise reason.

## 7. Ownership and file boundaries

| Area | Likely files | Required agreement |
|---|---|---|
| Area | Current files | Current ownership |
|---|---|---|
| Campaign state and roster hydration | `js/core/state.js`, `js/characters/campaign-roster.js` | Lead developer |
| Save migration and persistence | `js/core/save.js` | Lead developer |
| Campaign actions and event producers | `js/game.js`, `js/engine/event-bus.js` | Lead developer |
| Script loading / application shell | `index.html`, `sw.js` | Lead developer |
| Recruitment and loyalty rules | `js/characters/*` | Lead developer |
| Persistent battle participant mapping | `js/battle/battle-simulation.js` | Lead developer; not yet integrated with campaign roster |
| Chronicle storage/UI | Not present yet | Deferred until a real storage contract is required |

Issue #7 records the initial identity and ownership decisions. The current 16 Nov user directive consolidates responsibility for the entire repository under this lead; shared-file changes still use focused branches, regression checks and documented compatibility boundaries.

## 8. Acceptance criteria for live integration

- [x] Issue #7 records the initial identity and ownership decisions.
- [x] Stable campaign token and character/event ID generators are implemented and tested.
- [x] Recruitment creates a persistent named record without double-counting soldiers (PR #17).
- [ ] Battle entry/exit preserves named participant IDs and applies the result once (implemented on PR #23; awaiting merge).
- [x] Save version 5/6/7 migration preserves existing campaigns without fabricating NPCs and adds the v8 battle-result ledger.
- [x] Save/load tests prove character IDs, candidate source identity, trust, morale, roster membership and event-sequence continuity survive reload; loyalty-event replay integration remains untested.
- [ ] Campaign event producers emit only after successful actions.
- [ ] Chronicle storage is implemented and tested before claiming Chronicle persistence.
- [ ] Browser and Android-sized viewport smoke tests pass.



## Implementation status — campaign save v6 and named recruitment (17 Nov 2026)

- **Merged:** PR #13, merge commit dad34d81f9529e178a13361b857cfacf04165c8a.
- The roster uses version-2 snapshots with a persisted campaign token, monotonic campaign-scoped character IDs and monotonic event IDs.
- The roster manager is owned by the authoritative campaign state. Generic troop counts remain aggregate.
- Save version 8 migrates v5 saves by preserving existing campaign data and creating an empty roster; it does not invent individual recruits. Saves from a newer version are left untouched.
- The roster module is loaded before state and included in service-worker shell v16 with the named-recruitment and campaign-battle modules.
- GitHub Actions run 43843577129 passed JavaScript syntax checks and all six then-existing Node test files, including v5 migration and roster round-trip tests.
- The later world-resource integration run 43844525553 also passed syntax checks and the expanded eight-file regression suite.
- **Still incomplete:** active-party membership, live loyalty-event producers/replay guard, persistent battle participant mapping and exactly-once campaign battle result application.
- **Not tested:** browser runtime, Android-sized viewport, browser local-storage runtime, offline service-worker launch.


## 9. Named companion recruitment v1

The merged main branch includes a small settlement-based named-recruitment slice:

- Candidate definitions live in `js/data/recruits.js`; current candidates are Mara Venn at Kingsbridge, Iven Rook at Highcourt and Sella Quill at Silverkeep.
- `js/characters/recruitment.js` remains the pricing/eligibility rule service. The campaign adapter uses its quote/recruit result but treats `state.gold` and the campaign roster as authoritative.
- `js/characters/campaign-recruitment.js` accepts a candidate only at their assigned settlement, rejects duplicate recruitment by persisted `candidateId`, adds the person to the existing roster, and deducts the service's quoted gold from campaign state.
- The roster now persists optional `candidateId` metadata. Existing roster records without it hydrate as `null`; save version remains 6 because this is an additive optional field.
- Specialist is now a supported named-recruit role. No current candidate is a generic soldier, so the existing aggregate `state.troops` and generic soldier recruitment action remain unchanged.
- Campaign reputation does not yet exist as an authoritative state field; recruitment uses a documented neutral baseline of 50 until the faction/reputation system is designed.
- The town panel shows named candidates only at their assigned settlement and retains a joined status after save/load.

**Validation performed:** GitHub Actions run 44051187245 passed JavaScript syntax checks and all nine Node test files; post-merge main run 44051514383 passed the same suite. Browser/mobile interaction, browser save/load and offline-launch testing remain outstanding.


## 3B. Campaign battle integration — save v8

- `js/characters/campaign-battle.js` owns the campaign-facing battle transaction. It receives the authoritative roster, active-party manager, state accessor and battle simulation.
- The adapter creates a monotonic campaign event ID for each encounter, saves the consumed sequence before resolution, and passes active named character IDs explicitly to the simulation.
- Named party characters are fielded before the aggregate `foot` troop group so the four-person named party is not displaced by a large generic army. The simulation's 12-unit field cap still applies; unfielded generic troops are retained as reserves.
- The battle simulation returns `participantIds` and per-character survival outcomes. Temporary field-unit IDs never replace campaign character IDs.
- Campaign result application updates generic troop totals from the `foot` survivor total only, updates hero health, awards victory gold, marks a roaming party defeated only on victory, and moves named characters who fell in battle to `recovering` status. Recovering characters are removed from active-party assignments and cannot be reassigned until their status is changed by a future recovery system.
- The battle loyalty adapter applies victory/defeat effects to the exact participant IDs. Trust and morale are copied back to the authoritative character roster.
- `state.resolvedBattleIds` and the save-v8 ledger retain the last 200 resolved battle IDs. A repeated result for a recorded battle is rejected as a duplicate before rewards, casualties or loyalty can be applied again.
- Current encounter resolution is automatic tactical simulation; the campaign does not yet expose the standalone battlefield prototype as a player-controlled renderer. Interactive battle presentation and retreat choice are future work, although the simulation API now supports retreat.
- Save v5/v6/v7 migration preserves campaign data and adds an empty resolved-battle ledger. Newer-version saves remain untouched.

