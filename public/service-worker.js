self.addEventListener('push', function(event) {
    console.log('Received a push message', event);
    const data = event.data.json();
    const title = data.title;
    const options = {
        body: data.body,
        icon: 'icon-192.png',
        data: {
            url: data.url
        }
    };
    console.log('showing notification', title, options);
    event.waitUntil(self.registration.showNotification(title, options));
    console.log('Notification shown');
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
