"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useRetroSession } from "@/lib/hooks/useRetroSession";
import { RoleGuard } from "@/components/RoleGuard";
import { Header } from "@/components/layout/Header";
import { PhaseControl } from "@/components/retro/PhaseControl";
import { RetroBoard } from "@/components/retro/RetroBoard";
import { Spinner } from "@/components/ui/Spinner";
import { Empty } from "@/components/ui/Empty";
import { Button } from "@/components/ui/Button";

function SessionInner() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const { user } = useCurrentUser();
  const { session, loading, error, updateStatus } = useRetroSession(sessionId);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Empty
          icon="❓"
          title="Oturum bulunamadı"
          description={error ?? "Bu retro oturumuna erişemiyoruz."}
          action={
            <Link href="/retro">
              <Button variant="secondary">← Listeye dön</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/retro" className="text-sm text-gray-500 hover:text-gray-900">
          ← Tüm retrolar
        </Link>
      </div>

      <PhaseControl session={session} userRole={user.role} onUpdate={updateStatus} />

      <RetroBoard session={session} currentUser={{ id: user.id, role: user.role }} />
    </div>
  );
}

export default function SessionPage() {
  return (
    <RoleGuard allow={["scrum_master", "member", "admin", "manager"]}>
      <Header />
      <SessionInner />
    </RoleGuard>
  );
}
