const CACHE_NAME = "iron-crown-shell-v17";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles/main.css",
  "./styles/battle.css",
  "./js/data/world.js",
  "./js/data/items.js",
  "./js/data/recruits.js",
  "./js/characters/campaign-roster.js",
  "./js/characters/party.js",
  "./js/characters/recruitment.js",
  "./js/characters/campaign-recruitment.js",
  "./js/characters/loyalty.js",
  "./js/characters/campaign-loyalty-adapter.js",
  "./js/characters/campaign-battle.js",
  "./js/battle/battle-simulation.js",
  "./js/battle/battle-view.js",
  "./js/core/state.js",
  "./js/core/save.js",
  "./js/engine/event-bus.js",
  "./js/engine/registry.js",
  "./js/engine/module-manager.js",
  "./js/engine/engine.js",
  "./js/game.js",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith("iron-crown-shell-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          }
          return response;
        })
        .catch(async () => (await caches.match("./index.html")) || (await caches.match("./")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});