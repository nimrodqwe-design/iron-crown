# Campaign Character and Event Integration Contract

**Status:** Roster and save-version-6 foundation merged into main through PR #13. Live named recruitment, loyalty-event producers and persistent battle-participant mapping remain incomplete.  
**Related work:** PR #6 (recruitment and loyalty services), Issue #7 (ownership and integration decisions).

## 1. Verified current baseline

The current `main` branch has these constraints:

- `js/core/state.js` stores aggregate `troops` and owns the authoritative named-character roster manager. Generic soldiers remain aggregate.
- `js/core/save.js` writes save version 6 and persists a version-2 roster snapshot with the campaign token and both monotonic sequences.
- `js/engine/event-bus.js` provides a reusable event bus, but `js/game.js` does not currently instantiate and wire it into campaign actions.
- The settlement recruitment action in `js/game.js` spends 10 gold and increments `state.troops`; it does not create a named character.
- `js/battle/battle-simulation.js` emits battle lifecycle events and generates field-unit IDs from troop-group IDs and array positions. Those IDs are battle-local, not persistent campaign character identities.
- No Chronicle module/API appears in the current `main` file tree.

The roster foundation is now persistent, but the recruitment and loyalty services are not yet wired to it. The existing troop count must not be converted into invented named people.

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
- The future roster/party owner must define reserve, active-party and garrison accounting before battle integration.

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

The campaign encounter owner must explicitly pass persistent IDs for named characters who actually joined the battle. The battle presentation/simulation may use temporary field-unit IDs, but the campaign must retain the mapping:

```js
{
  battleId: "campaign-battle-token",
  participantIds: ["ic:<campaignId>:character:1"]
}
```

After the battle, call the adapter once with the stable `battleId`, outcome (`victory` or `defeat`), and the recorded participant IDs. Do not apply participant loyalty to absent companions, reserves, prisoners, or generic soldiers unless a later system explicitly defines their exposure to the event.

The current battle simulation does not yet accept or return this persistent participant mapping. That is a separate coordinated change owned by the battle workstream.

## 5. Save migration and replay safety

- The current save version is 6.
- Version 5 saves migrate to an empty `characterRoster` with a newly persisted campaign token and sequences starting at 1; existing gold, troops, location, inventory, discoveries and encounter histories remain unchanged.
- New saves persist the roster snapshot, campaign token, character sequence and event sequence. Active-party IDs are not yet part of this module.
- On load, validate IDs, roles, motivation, numeric ranges and party references. Invalid character entries should be reported/recovered safely rather than corrupting the whole campaign.
- The loyalty service's event history is currently bounded to the most recent 200 IDs per character. This is a bounded replay guard, not a permanent audit ledger; if stronger replay guarantees are needed, design a compact campaign event ledger before production.
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
- [ ] Recruitment creates a persistent named record without double-counting soldiers.
- [ ] Battle entry/exit preserves named participant IDs and applies the result once.
- [x] Save version 5 migration preserves existing campaigns without fabricating NPCs.
- [x] Save/load tests prove character IDs, trust, morale, roster membership and event-sequence continuity survive reload; loyalty-event replay integration remains untested.
- [ ] Campaign event producers emit only after successful actions.
- [ ] Chronicle storage is implemented and tested before claiming Chronicle persistence.
- [ ] Browser and Android-sized viewport smoke tests pass.



## Implementation status — campaign save v6 (16 Nov 2026)

- **Merged:** PR #13, merge commit dad34d81f9529e178a13361b857cfacf04165c8a.
- The roster uses version-2 snapshots with a persisted campaign token, monotonic campaign-scoped character IDs and monotonic event IDs.
- The roster manager is owned by the authoritative campaign state. Generic troop counts remain aggregate.
- Save version 6 migrates v5 saves by preserving existing campaign data and creating an empty roster; it does not invent individual recruits. Saves from a newer version are left untouched.
- The roster module is loaded before state and included in service-worker shell v13.
- GitHub Actions run 43843577129 passed JavaScript syntax checks and all six then-existing Node test files, including v5 migration and roster round-trip tests.
- The later world-resource integration run 43844525553 also passed syntax checks and the expanded eight-file regression suite.
- **Still incomplete:** named recruit UI/action, recruitment-service adapter, live loyalty-event producers/replay guard, party membership, persistent battle participant mapping and exactly-once campaign battle result application.
- **Not tested:** browser runtime, Android-sized viewport, browser local-storage runtime, offline service-worker launch.
