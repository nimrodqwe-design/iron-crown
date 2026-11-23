# IRON CROWN — The Marches

A mobile-first browser medieval sandbox campaign-map prototype. No build step or external game framework is required.

## Run locally
Open `index.html` in a modern browser. No build step, package manager, framework CDN, or external game dependency is required.

## Controls
- Tap/click a settlement to inspect it.
- Choose **Travel here** to move your party.
- Drag to pan the map.
- Use + / − or the mouse wheel to zoom.
- Use Pause and speed controls while travelling; pause active battles from the battlefield overlay.
- Progress is saved in browser local storage.

## Current prototype
- 3 rival factions and 15 named settlements.
- Stylised terrain, river, roads, hills, forests and mountains.
- Circular player-party marker.
- Selectable settlements and travel animation.
- Caravan and bandit markers.
- Basic HUD and local save data.
- Responsive touch and mouse controls.
- Settlement activities: market, blacksmith, tavern, generic soldier recruitment and named companions/officers/specialists at selected towns.
- Save schema v10 with backward migration from v5/v6/v7/v8/v9, a persistent named-character roster, saved active-party assignments (up to four named characters), and bounded exactly-once battle and non-battle campaign-event ledgers. Wilderness discoveries and camp training improve trust/morale for the exact active named companions; generic troops remain unaffected.
- Camp training is available only while camped, outside travel and battle, with at least one active named companion and 2 supplies. It advances campaign time by one hour and persists its loyalty event through the existing v10 replay ledger.
- Twelve informational resource sites with category filtering and an inspection panel.
- Hostile roaming encounters use the player-controlled battlefield view backed by the authoritative battle simulation; active named party members are carried by stable IDs, generic troop reserves are preserved, and battle casualties, rewards, hero health and participant loyalty are applied once to campaign state. Named-character casualties enter recovery; a two-hour camp rest restores them to the available roster so they can be reassigned. Active battles checkpoint every five seconds, on page hide/visibility change and immediately when paused so valid encounters can resume after reload. The battlefield can be paused and resumed with its control or the P key.

## Roadmap
1. Add payment, protection and promise loyalty producers (wilderness discovery and camp training are integrated).
2. Battle terrain/formation controls, encounter choices and outcome feedback; the first player-controlled battlefield renderer and orders are integrated.
3. Faction diplomacy, territory ownership and kingdom progression.
4. Settlements, resource gathering/production and sieges.
5. Browser/mobile/offline regression testing, onboarding and release polish.

This remains an early playable prototype. Named recruitment and the listed current features are implemented; roadmap items are not yet implemented.
