import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorker } from "@/features/offline/components/ServiceWorker";
import { LocalPurge } from "@/features/purchases/components/LocalPurge";
import { ReminderNotifier } from "@/features/reminders/components/ReminderNotifier";
import { SyncRunner } from "@/features/sync/components/SyncRunner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Purchase Vault",
  description: "Save it now. Find it later.",
  appleWebApp: { capable: true, title: "Vault", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#1d4ed8" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ReminderNotifier />
        <ServiceWorker />
        <SyncRunner />
        <LocalPurge />
      </body>
    </html>
  );
}
