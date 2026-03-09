import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/common/AdminHeader";
import { requireAdminPageSession } from "@/lib/admin/pageAuth";

const AdminCatalogManager = dynamic(
  () => import("@/components/admin/catalog/AdminCatalogManager").then((mod) => mod.AdminCatalogManager),
  {
    loading: () => <div className="py-16 text-center text-sm text-zinc-400">Загрузка каталога...</div>,
  },
);

export default async function AdminCatalogPage() {
  const auth = await requireAdminPageSession();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AdminHeader login={auth.user.login} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <AdminCatalogManager />
      </div>
    </div>
  );
}
