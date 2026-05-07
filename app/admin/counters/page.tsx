import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/common/AdminHeader";
import { requireAdminPageSession } from "@/lib/admin/pageAuth";

const AdminCountersManager = dynamic(
  () => import("@/components/admin/counters/AdminCountersManager").then((mod) => mod.AdminCountersManager),
  {
    loading: () => <div className="py-16 text-center text-sm text-zinc-400">Загрузка счётчиков...</div>,
  },
);

export default async function AdminCountersPage() {
  const auth = await requireAdminPageSession();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AdminHeader login={auth.user.login} />
      <AdminCountersManager />
    </div>
  );
}
