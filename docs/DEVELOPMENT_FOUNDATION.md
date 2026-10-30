# IRON CROWN — Development Foundation

## Current structure

The playable prototype is intentionally lightweight and offline-first:

- `index.html` — page structure and application entry point.
- `styles/main.css` — extracted interface and map styling.
- `js/game.js` — current game state, simulation and interface behaviour.
- `js/data/world.js` — settlement definitions and exploration discoveries, loaded before the game logic.
- `manifest.webmanifest` — install metadata.
- `sw.js` — service-worker cache and offline entry point.
- `icon.svg` — application icon.
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow.

The game currently runs without a framework or external runtime dependency. The first modularisation steps are complete: HTML, CSS, game logic and world data now live in separate files. Keep this baseline working while the codebase grows.

## Save-data contract

The browser save key is `ironCrownSave`.

Current format:

```js
{
  version: 2,
  savedAt: "ISO-8601 timestamp",
  state: {
    current: "greyhaven",
    freePosition: null,
    gold: 85,
    troops: 12,
    health: 100,
    day: 1,
    minutes: 480,
    camped: false,
    supplies: 5,
    discoveries: []
  }
}
```

Rules for future systems:

1. Increment `SAVE_VERSION` when the save structure changes.
2. Add a migration path from the previous format; do not silently discard player progress.
3. Validate loaded values and clamp numeric values to sensible bounds.
4. Give new fields safe defaults so older saves remain playable.
5. Preserve a damaged save as a recovery copy before starting a fresh state.
6. Save after meaningful state changes and when the page is hidden or closed.

## System boundaries to preserve

As features are added, keep these responsibilities distinct even before files are split:

- **State and saves:** authoritative player/world state, defaults, validation and migrations.
- **World data:** settlements, factions, terrain, discoveries and later noble houses.
- **Simulation:** time, travel, encounters, economy and faction activity.
- **Presentation:** map drawing, HUD, drawers, notifications and controls.
- **Input:** pointer, touch, keyboard and accessible button actions.

Avoid putting game rules directly inside drawing functions. Keep content data separate from the code that displays it.

## Compatibility and quality checks

Before each update:

- Fetch the latest `main` version before editing.
- Keep existing settlement IDs and save keys stable unless a migration is included.
- Check that every referenced UI element exists.
- Run a JavaScript syntax check on the inline script.
- Review the complete change for accidental deletion or duplicated event handlers.
- State clearly what has and has not been tested. A syntax check is not a browser or device test.

## Next modularisation steps

When the prototype becomes harder to maintain, extract code gradually rather than rewriting everything at once:

1. `js/core/state.js` and `js/core/save.js`
2. `js/world/map.js` and terrain definitions
3. `js/systems/travel.js`, `camping.js` and `exploration.js`
4. `js/systems/politics.js` and `reputation.js`
5. `js/ui/hud.js`, `drawer.js` and `notifications.js`

Only move a working system after its behaviour is understood and checked. Keep the single-file version usable until the modular version is confirmed.

## Current limitations

The campaign map is still a prototype. Travel is straight-line interpolation, several party markers are illustrative rather than simulated, and settlement services are placeholders. These should be replaced by real systems incrementally, not represented as completed features.
