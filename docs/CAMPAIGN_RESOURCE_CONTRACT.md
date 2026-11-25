# Campaign Resource and Time Contract

**Status:** Implemented on the 25 Nov 2026 feature branch; pending PR validation.  
**Save schema:** v12.  
**Owner:** Campaign lead developer. World/map catalogue remains static content; campaign state owns all mutable quantities.

## Static catalogue and state

`js/data/world.js` remains the source of immutable site identity, coordinates, resource type, nearest settlement, availability label and description. The 12 existing IDs and coordinates are unchanged. Silverkeep Trade Yard is a trade location, not a harvest node.

Campaign state owns:
- `resourceStock`: site ID → remaining integer units.
- `rawMaterials`: material type → carried integer units.

Initial stock derives from availability: Abundant 24, Steady 18, Seasonal 12, Valuable 15, Limited 6, Busy/trade 0. Gatherable keys are grain, timber, fish, stone, salt, reeds, iron, ore and wool. Each has a separate capacity of 99. Equipment inventory, supplies and aggregate troops remain separate.

## Gathering rules

`js/core/campaign-resources.js` is the only writer for stock and raw-material quantities. A successful gather requires a known non-trade site, distance ≤45 map units, no travel or active battle, positive stock and free capacity. It takes up to 3 units, advances campaign time by 60 minutes, consumes site stock and adds the same quantity to the matching material key. A final partial batch is allowed. Rejected actions mutate nothing. Stock does not regenerate in this slice.

No market sale, crafting, production chain, weight system or resource-driven quest reward is included.

## Shared time

`js/core/campaign-time.js` is the shared day/minute advancement API. Travel ticks, tavern rest, two-hour camp rest, camp training and gathering use the same rollover logic. Fractional travel minutes are preserved.

## UI

The existing resource panel displays availability, nearest settlement, site stock, carried material and current map distance. It offers travel-to-site when the site can still be harvested and gather only when all preconditions pass. Travel uses the existing off-road movement and encounter path; the player inspects the site again after arrival.

## Save v12

Save v12 persists `resourceStock` and `rawMaterials`. Version 11 and older saves receive initial site stock and an empty raw-material inventory; existing gold, troops, roster, party, battle checkpoint, payment day and replay ledgers are preserved. Load sanitises unknown keys, clamps stock to catalogue maxima and material quantities to 0–99. Newer saves remain untouched. The service-worker shell cache is v23 and precaches both new modules.

## Validation

Tests cover time rollover, stock defaults, trade-yard exclusion, range boundary, travel/battle blocking, depletion, full capacity, partial batches, time cost, sanitisation, v5–v11 migration, v12 round trips and newer-save protection. The Chromium smoke test covers travel-to-site, gather, reload and persistence. Physical Android and offline-launch tests remain separate release checks.
