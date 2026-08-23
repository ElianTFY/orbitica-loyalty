self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "Tu tarjeta de fidelidad se actualizó." };
  }

  const title = data.title || "Orbítica Loyalty";
  const options = {
    body: data.body || "Tu tarjeta de fidelidad se actualizó.",
    tag: data.tag || "orbitica-loyalty",
    renotify: true,
    data: { url: data.url || "/" },
    badge: "/icon.svg",
    icon: "/icon.svg",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (client.url === target && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(target);
      return undefined;
    })
  );
});
