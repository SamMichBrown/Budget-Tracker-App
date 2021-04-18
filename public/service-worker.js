const CACHE_NAME = 'my-site-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

const FILES_TO_CACHE = [
    "./index.html",
    "./css/styles.css",
    "./js/idb.js",
    "./js/index.js",
    "./js/manifest.json",
    "./icons/icon-72x72.png",
    "./icons/icon-96x96.png",
    "./icons/icon-128x128.png",
    "./icons/icon-144x144.png",
    "./icons/icon-152x152.png",
    "./icons/icon-192x192.png",
    "./icons/icon-384x384.png",
    "./icons/icon-512x512.png"
]


self.addEventListener('install', function (evt) {
  evt.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
          console.log('Your files were pre-cached successfully');
          return cache.addAll(FILES_TO_CACHE);
      }).catch((error) => console.log(error))
  );

  self.skipWaiting();
})

self.addEventListener('fetch', function (e) {
    console.log('fetch request : ' + e.request.url)
    if (e.request.url.includes('/api/')) {
        e.respondWith(
          caches.open(DATA_CACHE_NAME).then(cache => {
            return fetch(e.request)
              .then(response => {
                // If the response was good, clone it and store it in the cache.
                if (response.status === 200) {
                  cache.put(e.request.url, response.clone());
                }
                return response;
              })
              .catch(err => {
                // Network request failed, try to get it from the cache.
                return cache.match(e.request);
              });
          }).catch(err => console.log(err))
        );
        return;
      }

    e.respondWith(
        caches.match(e.request).then(function (request) {
            if (request) {
                console.log('responding with cache : ' + e.request.url)
                return request
            } else {
                console.log('file is not cached, fetching : ' + e.request.url)
                return fetch(e.request)
            }
        }).catch((error) => console.log(error))
    )
})

self.addEventListener('activate', function (evt) {
  evt.waitUntil(
      caches.keys().then(keyList => {
        // let cacheKeeplist = keyList.filter(function (key) {
        //     return key.indexOf(APP_PREFIX);
        //   })
        //   // add current cache name to white list
        //   cacheKeeplist.push(CACHE_NAME);
          return Promise.all(
              keyList.map(key => {
                  if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                      console.log('Removing old cache data', key);
                      return caches.delete(key);
                  }
              })
          );
      }).catch((error) => console.log(error))
  );

  self.clients.claim();
});



