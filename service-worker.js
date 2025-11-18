// Define a unique cache name to manage versions and avoid conflicts.
// Incrementing the version number will trigger the 'install' and 'activate' events for the new service worker.
const CACHE_NAME = 'unicorn-cache-v2';

// Define the essential assets that form the "app shell" to be cached immediately on installation.
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://cdn-icons-png.flaticon.com/512/3468/3468261.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// --- SERVICE WORKER LIFECYCLE EVENTS ---

// 1. Install Event: Triggered when the service worker is first registered or updated.
// We use this to pre-cache the essential app shell assets for offline use.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(err => {
        console.error("Service Worker: Failed to cache during install event:", err);
      })
  );
});

// 2. Activate Event: Triggered after the install event, when the new service worker takes control.
// We use this to clean up old, unused caches to free up storage space.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of uncontrolled clients (e.g., open tabs) immediately.
  return self.clients.claim();
});

// 3. Fetch Event: Triggered for every network request made by the page.
// This is where we intercept requests and apply our caching strategies.
self.addEventListener('fetch', event => {
  // We only handle GET requests, as other methods (POST, PUT, etc.) are not cacheable.
  if (event.request.method !== 'GET') {
    return;
  }

  // --- CACHING STRATEGIES ---

  // Strategy 1: Network, falling back to Cache for the main HTML document.
  // This ensures the user gets the latest version of the app if online, but can still load it offline.
  // We identify navigation requests for the HTML document.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // If the network request is successful, cache a clone of the response for future offline use.
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // If the network fails (offline), serve the cached HTML page from the app shell.
          return caches.match('/');
        })
    );
    return;
  }

  // Strategy 2: Cache, then Network Fallback for all other static assets (CSS, JS, fonts, images).
  // This provides the fastest possible response by serving from the local cache first.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If the asset is in the cache, return it immediately.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If the asset is not in the cache, fetch it from the network.
        return fetch(event.request).then(
          networkResponse => {
            // A valid response from the network.
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                // Store the new asset in the cache for next time.
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});
