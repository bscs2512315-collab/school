import AppLoader from "@/components/AppLoader";

// Lab simulations occupy the entire screen, so their loading state should use
// the viewport centre rather than the shorter dashboard-content container.
export default function LabGameLoading() {
  return <AppLoader fullScreen />;
}
