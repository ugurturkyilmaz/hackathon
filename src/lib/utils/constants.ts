import type { Category, Role, SessionStatus } from "@/types";

export const CATEGORY_META: Record<
  Category,
  { label: string; placeholder: string; bg: string; border: string; text: string; chip: string }
> = {
  mad: {
    label: "Mad 😡",
    placeholder: "Beni rahatsız eden bir şey...",
    bg: "bg-mad-50",
    border: "border-mad-200",
    text: "text-mad-700",
    chip: "bg-mad-500 text-white",
  },
  glad: {
    label: "Glad 🎉",
    placeholder: "Beni mutlu eden bir şey...",
    bg: "bg-glad-50",
    border: "border-glad-200",
    text: "text-glad-700",
    chip: "bg-glad-500 text-white",
  },
  sad: {
    label: "Sad 😔",
    placeholder: "Üzücü/kötü giden bir şey...",
    bg: "bg-sad-50",
    border: "border-sad-200",
    text: "text-sad-700",
    chip: "bg-sad-500 text-white",
  },
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  scrum_master: "Scrum Master",
  member: "Ekip Üyesi",
  manager: "Yönetici",
};

export const STATUS_LABEL: Record<SessionStatus, string> = {
  writing: "Yazma",
  voting: "Oylama",
  finished: "Tamamlandı",
};

export const STATUS_BADGE: Record<SessionStatus, string> = {
  writing: "bg-blue-100 text-blue-700",
  voting: "bg-amber-100 text-amber-700",
  finished: "bg-gray-200 text-gray-700",
};
