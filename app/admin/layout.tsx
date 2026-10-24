"use client";

import AdminGuard from "@/components/AdminGuard";
import DashboardShell from "@/components/layout/DashboardShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell defaultTitle="Admin Portal">
      <AdminGuard>{children}</AdminGuard>
    </DashboardShell>
  );
}
