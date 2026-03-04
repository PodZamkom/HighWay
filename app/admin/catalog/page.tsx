import { AdminHeader } from "@/components/admin/common/AdminHeader";
import { AdminCatalogManager } from "@/components/admin/catalog/AdminCatalogManager";
import { requireAdminPageSession } from "@/lib/admin/pageAuth";

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
