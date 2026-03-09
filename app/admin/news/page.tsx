import { AdminHeader } from "@/components/admin/common/AdminHeader";
import { AdminNewsManager } from "@/components/admin/news/AdminNewsManager";
import { requireAdminPageSession } from "@/lib/admin/pageAuth";

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
