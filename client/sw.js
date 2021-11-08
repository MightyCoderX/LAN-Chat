const CACHE_NAME = 'my-site-cache-v1';
const urlsToCache = [
  '/',
  '/css/join.css',
  '/css/style.css',
  '/js/app.js',
  '/js/chat.js',
  '/js/join.js',
  '/img/send-icon.svg'
];

self.addEventListener('install', e =>
{
    e.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache =>
        {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
    console.log('Installed service worker!');
});

self.addEventListener('fetch', e =>
{
    e.respondWith(
        caches.match(e.request)
        .then(response =>
        {
            // Cache hit - return response
            if(response)
            {
                return response;
            }
            
            return fetch(e.request);
        })
    );
});