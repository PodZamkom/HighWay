import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/common/AdminHeader";
import { requireAdminPageSession } from "@/lib/admin/pageAuth";

const AdminHomeEditor = dynamic(
  () => import("@/components/admin/home/AdminHomeEditor").then((mod) => mod.AdminHomeEditor),
  {
    loading: () => <div className="py-16 text-center text-sm text-zinc-400">Загрузка редактора...</div>,
  },
);

export default async function AdminHomePage() {
  const auth = await requireAdminPageSession();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AdminHeader login={auth.user.login} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <AdminHomeEditor />
      </div>
    </div>
  );
}
