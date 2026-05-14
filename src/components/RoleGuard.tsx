"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { FullPageSpinner } from "@/components/ui/Spinner";
import type { Role } from "@/types";

interface Props {
  allow: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ allow, children }: Props) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (!allow.includes(user.role)) {
      switch (user.role) {
        case "admin":
          router.replace("/admin");
          break;
        case "manager":
          router.replace("/dashboard");
          break;
        default:
          router.replace("/retro");
      }
    }
  }, [user, loading, allow, router]);

  if (loading) return <FullPageSpinner />;
  if (!user || !allow.includes(user.role)) return null;
  return <>{children}</>;
}
