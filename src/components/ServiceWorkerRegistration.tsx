"use client";

import { useEffect } from "react";

// No longer registers a service worker — it was caching pages (including,
// once, an error response) and became a source of stale-state bugs for a
// benefit that isn't load-bearing: offline resilience for logged sets is
// handled separately by the localStorage queue (src/lib/offlineQueue.ts),
// and "Add to Home Screen" installability doesn't require a service worker.
// This actively unregisters any previously-installed one and clears its
// caches, so devices that already installed the old SW get cleaned up too.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) registration.unregister();
    });

    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  }, []);

  return null;
}
