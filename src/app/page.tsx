"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { ROLE_LABEL } from "@/lib/utils/constants";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { FullPageSpinner } from "@/components/ui/Spinner";
import type { Role } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: bootLoading, signIn } = useCurrentUser();
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bootLoading || !user) return;
    redirectByRole(user.role, router);
  }, [user, bootLoading, router]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("İsim boş olamaz");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("name", trimmed)
        .maybeSingle();

      let saved = existing;
      if (!saved) {
        const { data, error: insertError } = await supabase
          .from("users")
          .insert({ name: trimmed, role })
          .select()
          .single();
        if (insertError) throw insertError;
        saved = data;
      } else if (saved.role !== role) {
        const { data, error: updateError } = await supabase
          .from("users")
          .update({ role })
          .eq("id", saved.id)
          .select()
          .single();
        if (updateError) throw updateError;
        saved = data;
      }

      signIn({ id: saved.id, name: saved.name, role: saved.role as Role });
      redirectByRole(saved.role as Role, router);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  if (bootLoading) return <FullPageSpinner label="Oturum kontrol ediliyor..." />;
  if (user) return <FullPageSpinner label="Yönlendiriliyor..." />;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-5">
        <div className="text-center">
          <div className="text-5xl mb-2">🔄</div>
          <h1 className="text-3xl font-bold tracking-tight">Retroflow</h1>
          <p className="text-sm text-gray-500 mt-1">Takım retrospektifi, dijital olarak.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adın</label>
            <Input
              type="text"
              placeholder="Ör: Ali Veli"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !submitting) handleSubmit();
              }}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
            {submitting ? "Giriş yapılıyor..." : "Devam Et →"}
          </Button>
        </div>

        <p className="text-xs text-center text-gray-400">
          Hackathon MVP — gerçek auth yok, isim + rol seçimi.
        </p>
      </div>
    </main>
  );
}

function redirectByRole(role: Role, router: ReturnType<typeof useRouter>) {
  switch (role) {
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
