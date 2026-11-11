# Campaign Character and Event Integration Contract

**Status:** Proposed interface for review — not yet implemented in the live campaign.  
**Related work:** PR #6 (recruitment and loyalty services), Issue #7 (ownership and integration decisions).

## 1. Verified current baseline

The current `main` branch has these constraints:

- `js/core/state.js` stores `troops` as one aggregate number (initially 12). There is no persistent individual recruit roster.
- `js/core/save.js` writes save version 5 and does not persist recruit records or loyalty data.
- `js/engine/event-bus.js` provides a reusable event bus, but `js/game.js` does not currently instantiate and wire it into campaign actions.
- The settlement recruitment action in `js/game.js` spends 10 gold and increments `state.troops`; it does not create a named character.
- `js/battle/battle-simulation.js` emits battle lifecycle events and generates field-unit IDs from troop-group IDs and array positions. Those IDs are battle-local, not persistent campaign character identities.
- No Chronicle module/API appears in the current `main` file tree.

Therefore, the loyalty adapter cannot yet be connected safely to real campaign characters. The existing troop count must not be converted into invented named people.

## 2. Character identity rules

1. Every persistent named recruit gets one immutable campaign-scoped ID.
2. Never derive identity from a name, list position, settlement, party formation slot, or battle-unit index.
3. A character keeps the same ID when changing party, equipment, location, role assignment, or battle formation.
4. Generic soldiers remain aggregate troop groups until an actual individual-roster feature is agreed. No fabricated identities for the current `state.troops` value.
5. A battle-local unit ID may refer to a persistent character ID, but must never replace it.

### Proposed roster shape

```js
characterRoster: {
  version: 1,
  campaignId: "persistent-campaign-token",
  nextCharacterSequence: 1,
  nextEventSequence: 1,
  characters: [
    {
      id: "ic:<campaignId>:character:1",
      name: "Mira",
      role: "companion", // companion | officer | soldier
      background: "Former caravan guard",
      motivation: "loyalty",
      trust: 50,
      morale: 60,
      status: "available", // available | travelling | assigned | captured | recovering
      skills: {},
      equipment: {}
    }
  ],
  activePartyIds: []
}
```

This is a proposed schema, not an existing state object. Skills/equipment can be expanded by their owning systems; this contract only requires stable identity and loyalty fields.

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

- The current save version is 5. The future roster integration should introduce a versioned migration (proposed version 6).
- Version 5 saves migrate to an empty `characterRoster` with a newly persisted campaign token and sequences starting at 1; existing gold, troops, location, inventory and discoveries remain unchanged.
- New saves persist the entire roster, active-party IDs, campaign token and both next-sequence counters.
- On load, validate IDs, roles, motivation, numeric ranges and party references. Invalid character entries should be reported/recovered safely rather than corrupting the whole campaign.
- The loyalty service's event history is currently bounded to the most recent 200 IDs per character. This is a bounded replay guard, not a permanent audit ledger; if stronger replay guarantees are needed, design a compact campaign event ledger before production.
- Save the event sequence with the action's state update so reload cannot reuse an event ID.

## 6. Chronicle boundary

No Chronicle module/API was found in the current main tree. The adapter's `onChronicle` callback is only a proposed integration hook. Do not claim entries are persisted until a Chronicle owner and storage contract exist.

Recommended Chronicle entries are major standing-tier changes, not every small trust/morale adjustment. Each entry should carry the event ID, character ID, old/new standing, day, and a concise reason.

## 7. Ownership and file boundaries

| Area | Likely files | Required agreement |
|---|---|---|
| Campaign state and roster hydration | `js/core/state.js` | Campaign/gameplay owner |
| Save migration and persistence | `js/core/save.js` | Campaign/gameplay owner |
| Event-bus creation and action producers | `js/game.js`, `js/engine/event-bus.js` | Campaign/gameplay owner |
| Script loading / application shell | `index.html` | Shell owner |
| Recruit and loyalty rules | `js/characters/*` | Character-systems owner |
| Persistent battle participant mapping | `js/battle/battle-simulation.js` | Battle owner |
| Chronicle storage/UI | Not present yet | Must be assigned before implementation |

Do not modify shared campaign, save, shell, or battle files until Issue #7 confirms owners and the exact integration boundary. This document does not authorize merging PR #6 or changing another workstream's files.

## 8. Acceptance criteria for live integration

- [ ] Issue #7 confirms owners and shared-file boundaries.
- [ ] Stable campaign token and character/event ID generators are implemented and tested.
- [ ] Recruitment creates a persistent named record without double-counting soldiers.
- [ ] Battle entry/exit preserves named participant IDs and applies the result once.
- [ ] Save version 5 migration preserves existing campaigns without fabricating NPCs.
- [ ] Save/load tests prove IDs, trust, morale, roster membership and event replay protection survive reload.
- [ ] Campaign event producers emit only after successful actions.
- [ ] Chronicle storage is implemented and tested before claiming Chronicle persistence.
- [ ] Browser and Android-sized viewport smoke tests pass.

