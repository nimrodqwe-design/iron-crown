# IRON CROWN — The Marches

A mobile-first browser medieval sandbox campaign-map prototype. No build step or external game framework is required.

## Run locally
Open `index.html` in a modern browser. No build step, package manager, framework CDN, or external game dependency is required.

## Controls
- Tap/click a settlement to inspect it.
- Choose **Travel here** to move your party.
- Drag to pan the map.
- Use + / − or the mouse wheel to zoom.
- Use Pause and speed controls while travelling.
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
- Save schema v8 with backward migration from v5/v6/v7, a persistent named-character roster, saved active-party assignments (up to four named characters) and an exactly-once battle-result ledger.
- Twelve informational resource sites with category filtering and an inspection panel.
- Hostile roaming encounters use the authoritative battle simulation; active named party members are carried by stable IDs, generic troop reserves are preserved, and battle casualties, rewards, hero health and participant loyalty are applied once to campaign state. Named-character casualties enter recovery; a two-hour camp rest restores them to the available roster so they can be reassigned.

## Roadmap
1. Loyalty events connected to actual campaign actions.
2. Interactive battlefield presentation and player-controlled battle orders; the current campaign integration uses automatic tactical resolution.
3. Faction diplomacy, territory ownership and kingdom progression.
4. Settlements, resource gathering/production and sieges.
5. Browser/mobile/offline regression testing, onboarding and release polish.

This remains an early playable prototype. Named recruitment and the listed current features are implemented; roadmap items are not yet implemented.
