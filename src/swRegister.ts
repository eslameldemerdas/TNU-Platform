// Service Worker Cleanup to prevent cache blockage in preview iframe
export function registerServiceWorker(): void {
  try {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        try {
          navigator.serviceWorker
            .getRegistrations()
            .then((registrations) => {
              for (const registration of registrations) {
                registration.unregister().catch(() => {});
              }
            })
            .catch(() => {});
        } catch {
          // ignore
        }
      });
    }
  } catch {
    // Ignore ServiceWorker access error in restricted iframe
  }
}
