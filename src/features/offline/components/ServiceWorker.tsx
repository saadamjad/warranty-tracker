"use client";

import { useEffect } from "react";

/** Registers the offline worker in production builds; dev keeps normal reloading. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => console.warn("Offline support unavailable", error));
  }, []);

  return null;
}
