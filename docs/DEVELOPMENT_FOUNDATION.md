# IRON CROWN — Development Foundation

## Architecture

IRON CROWN uses a lightweight, browser-native engine layer. It is deliberately not tied to a large external game framework, keeping the current map prototype fast, installable and offline-capable.

```text
index.html
styles/
assets/
js/
  engine/       shared runtime and module infrastructure
  core/         campaign state and persistence
  data/         content definitions, separate from behaviour
  systems/      gameplay domains, added as working features
  ui/            reusable interface components
  game.js        campaign composition / module entry point
mods/            future community extensions
docs/
```

### Engine services

- **Module manager** — registers modules, checks dependencies, starts them in dependency order and stops them in reverse order. Duplicate IDs, missing dependencies and dependency cycles are rejected.
- **Event bus** — systems publish and subscribe to named events rather than importing each other's implementation. A handler can unsubscribe using the function returned by `on`.
- **Registry** — shared typed catalogues for content such as items, quests, NPC definitions and locations. Duplicate entries are rejected.
- **Core state and save** — campaign state remains authoritative and save data is validated and migrated independently of presentation.
- **Future services** — time, input, rendering, audio, pathfinding and UI are added when a real system needs them, not as empty placeholder files.

### Module contract

A gameplay module registers before engine startup:

```js
IronCrownEngine.registerModule({
  id: "economy",
  version: "1.0.0",
  dependencies: ["inventory"],
  start(services) {
    services.events.on("shop:purchase", data => {
      // Apply economy rules through the campaign state API.
    });
  },
  stop() {
    // Release listeners and other resources when applicable.
  }
});
```

Modules receive only shared services. They should expose intentional APIs and communicate through events or registries; avoid reaching into another module's private variables. Keep dependencies one-directional and small. Do not make every system depend on every other system.

The current campaign runs as the first registered module. This establishes the boot path without rewriting the working campaign simulation.

## Mods strategy

A mod directory is reserved, but external mod execution is **not enabled**. The first mod format should be declarative data (JSON) for items, locations, dialogue, quests and balancing. Later, a versioned extension API can allow reviewed JavaScript modules. Do not execute arbitrary downloaded scripts, use `eval`, or let mods directly overwrite save data. Mods need IDs, version compatibility, dependency declarations, validation and a clear load order. Multiplayer or competitive play would need stricter server-side validation.

## Current structure

- `index.html` — application shell and script order.
- `styles/main.css` — map and interface styling.
- `js/engine/` — module manager, event bus, registry and engine facade.
- `js/game.js` — current campaign module and existing prototype behaviour.
- `js/data/world.js` — settlement and discovery definitions.
- `js/core/state.js` — initial campaign state and save schema version.
- `js/core/save.js` — local save/load, validation and recovery copy.
- `sw.js` — service-worker cache and offline entry point.
- `manifest.webmanifest` — install metadata.
- `icon.svg` — application icon.

## Save-data contract

Browser save key: `ironCrownSave`. Current schema version: **3**.

The saved state includes current settlement/free-roam position, gold, troops, health, day/time, camp status, supplies, discoveries, noble-house standing and completed audiences. New fields must receive safe defaults when loading older saves. Increment the schema version and add an explicit migration when a change cannot be safely defaulted.

Rules:

1. Preserve the save key and existing settlement/discovery IDs.
2. Validate loaded values and clamp numeric values to sensible bounds.
3. Keep a damaged save as a recovery copy before starting a fresh state.
4. Save after meaningful campaign changes and when the page is hidden or closed.
5. Test old-save migration and save/load round trips whenever the schema changes.

## System boundaries

Gameplay domains should be independent where they own distinct rules:

- **World and settlements:** locations, travel, terrain, town visits and ownership.
- **Economy and inventory:** item definitions, stock, prices, buying, selling and equipment.
- **Characters:** NPCs, companions, dialogue and relationships.
- **Quests:** objectives, progression, rewards and quest events.
- **Politics:** factions, noble houses, reputation, diplomacy and wars.
- **Warfare:** parties, recruitment, battles, sieges and garrisons.
- **Progression:** skills, perks, titles and long-term legacy.
- **UI:** panels and views; it displays state but does not own gameplay rules.

These are target boundaries, not a demand to create empty files immediately. Implement each as a complete vertical slice, then extract it into its own module once its behaviour is stable.

## Compatibility and quality checks

Before each update:

- Fetch the latest default-branch source before editing.
- Preserve existing IDs and save compatibility.
- Check script load order and service-worker precache paths.
- Run JavaScript syntax checks and focused logic tests.
- Review the diff for accidental deletion and duplicate event handlers.
- State clearly what was tested. Syntax checks are not browser or device tests.

## Current limitations

Travel still uses straight-line interpolation; terrain speed is a coarse prototype heuristic; party markers are illustrative rather than fully simulated; settlement services are not implemented yet. The engine infrastructure is now in place, but the campaign's gameplay systems will be migrated into separate modules incrementally rather than through a risky full rewrite.


## Performance pass

- HUD values are only written to the DOM when their displayed text changes, avoiding redundant updates during travel.
- Travel animation stops scheduling frames while paused and restarts on resume.
- Map dragging coalesces pointer movement into at most one SVG view transform per animation frame.
- The service-worker shell cache is versioned to v7 so updated clients can refresh cached assets.

These are targeted reductions in unnecessary work, not a measured FPS claim. Browser profiling and real-device testing remain required before publishing performance figures.


## First settlement economy slice

The settlement visit action now opens an activity panel for the current location. The first playable services are buying five supplies for ten gold, selling five supplies for five gold, recruiting one soldier for ten gold at towns and castles, and paying five gold for a one-hour tavern rest that restores up to fifteen health. Gold, supplies, troops, health and campaign time use the existing campaign state and save system; troop counts are already included in save data. Prices are fixed prototype values, and the marketplace is not yet driven by settlement prosperity or stock.


## Blacksmith integration repair

The town interface now loads the item catalogue before the campaign module and includes the blacksmith purchase controls and inventory list expected by the campaign code. The catalogue uses the weapon, armour and offhand slots required by save schema v4. The service-worker shell cache is v10. Equipment bonuses are displayed, but remain informational until a battle-resolution system is implemented.

## Roaming parties and encounters
- The campaign map now shows distinct coloured roaming groups: red bandits, blue rival patrols, and green independent merchant caravans.
- Hostile groups resolve a non-graphic encounter when the player reaches their map vicinity. Outcomes use troop count and equipped bonuses, changing troop count, health, and gold.
- Neutral caravans never attack and provide a small supply bonus once encountered.
- Cleared hostile groups and met caravans are persisted in save schema v5; older saves migrate with empty encounter histories.
- Encounter checks currently occur at the end of a travel order, not continuously along the route. Party markers are fixed map encounters in this prototype, not autonomous moving AI.


## Demo-world resource layer

The world data now exposes `IronCrownWorld.resourceSites`, a declarative list of named resource locations. The map presentation renders each site as a keyboard-accessible marker with a type glyph, name label and inspectable description. Initial coverage includes grain, timber, fish, stone, salt, reeds, iron, ore, wool and trade goods. Resource markers are informational in this increment: gathering, production, stock changes and persistence remain future gameplay work and must be implemented by the gameplay/save owner through an agreed API.
