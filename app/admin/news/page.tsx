import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/common/AdminHeader";
import { requireAdminPageSession } from "@/lib/admin/pageAuth";

const AdminNewsManager = dynamic(
  () => import("@/components/admin/news/AdminNewsManager").then((mod) => mod.AdminNewsManager),
  {
    loading: () => <div className="py-16 text-center text-sm text-zinc-400">Загрузка новостей...</div>,
  },
);

export default async function AdminNewsPage() {
  const auth = await requireAdminPageSession();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AdminHeader login={auth.user.login} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <AdminNewsManager />
      </div>
    </div>
  );
}
