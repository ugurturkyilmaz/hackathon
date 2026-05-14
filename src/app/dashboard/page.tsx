"use client";

import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useActions } from "@/lib/hooks/useActions";
import { RoleGuard } from "@/components/RoleGuard";
import { Header } from "@/components/layout/Header";
import { ActionsTable } from "@/components/dashboard/ActionsTable";
import { AiAnalysisPanel } from "@/components/dashboard/AiAnalysisPanel";
import { Spinner } from "@/components/ui/Spinner";

function DashboardInner() {
  const { user } = useCurrentUser();
  const { actions, loading, error, updateStatus } = useActions();

  const canMarkDone = user?.role === "admin" || user?.role === "scrum_master";
  const canAnalyze =
    user?.role === "manager" || user?.role === "admin" || user?.role === "scrum_master";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-sm text-gray-500">
          Tüm retrolardan çıkan aksiyonlar — gerçek zamanlı, read-only görünüm.
        </p>
      </div>

      {canAnalyze && <AiAnalysisPanel />}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size={32} />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
      )}

      {!loading && !error && (
        <ActionsTable actions={actions} canMarkDone={canMarkDone} onMarkDone={updateStatus} />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RoleGuard allow={["admin", "manager", "scrum_master"]}>
      <Header />
      <DashboardInner />
    </RoleGuard>
  );
}
