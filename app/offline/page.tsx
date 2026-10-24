import type { Metadata } from "next";
import OfflineState from "@/components/OfflineState";

export const metadata: Metadata = {
  title: "Offline — ExBoard AI",
  description: "You are currently offline. Connect to the internet to access live features.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <OfflineState
        title="YOU ARE OFFLINE"
        description="You are offline. Please check your internet connection and try again."
        variant="card"
      />
    </main>
  );
}
