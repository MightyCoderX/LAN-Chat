if ('serviceWorker' in navigator)
{
    navigator.serviceWorker.register('/sw.js')
    .then(reg =>
    {
        console.log('Registration successful, scope is:', reg.scope);
    })
    .catch(err =>
    {
        console.error('Service worker registration failed, error:', err);
    });
}