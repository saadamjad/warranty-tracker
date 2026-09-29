import type { MetadataRoute } from "next";

/** Installable app (FR-25): opens full-screen from the home screen like a native app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Purchase Vault",
    short_name: "Vault",
    description: "Save it now. Find it later. Your receipts, invoices and warranties in one private place.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1d4ed8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
