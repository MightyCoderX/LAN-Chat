self.addEventListener('install', e =>
{
    console.log('Installed service worker!');
});

self.addEventListener('activate', e =>
{
    console.log('Activated service worker');    
});