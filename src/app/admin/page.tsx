"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { RoleGuard } from "@/components/RoleGuard";
import { Header } from "@/components/layout/Header";
import { Spinner } from "@/components/ui/Spinner";
import { Empty } from "@/components/ui/Empty";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROLE_LABEL } from "@/lib/utils/constants";
import type { Role, User } from "@/types";

function AdminInner() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await api.get<User[]>("/api/users");
      setUsers(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id: string, role: Role) => {
    setUpdatingId(id);
    try {
      const updated = await api.patch<User>(`/api/users/${id}`, { role });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (e) {
      alert(`Hata: ${e instanceof Error ? e.message : "bilinmeyen"}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin · Kullanıcılar</h1>
          <p className="text-sm text-gray-500">Kullanıcılara rol ata.</p>
        </div>
        <Link href="/admin/teams">
          <Button variant="secondary">→ Ekipler</Button>
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size={32} />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
      )}

      {!loading && !error && users.length === 0 && (
        <Empty
          icon="👥"
          title="Henüz kullanıcı yok"
          description="Login olan ilk kullanıcı burada görünecek."
        />
      )}

      {!loading && users.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">İsim</th>
                <th className="px-4 py-3 text-left">Mevcut Rol</th>
                <th className="px-4 py-3 text-left">Yeni Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value as Role)}
                      disabled={updatingId === u.id}
                      className="max-w-xs"
                    >
                      {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <Header />
      <AdminInner />
    </RoleGuard>
  );
}
