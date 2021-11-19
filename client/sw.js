const CACHE_NAME = 'my-site-cache-v2';
const urlsToCache = [
    '/',
    '/img/send-icon.svg',
    '/css/login.css',
    '/css/style.css',
    '/css/message.css',
    '/css/scrollbars.css',
    '/js/app.js',
    '/js/chat.js',
    '/js/components/Message.js',
    '/js/components/SystemMessage.js'
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