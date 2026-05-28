import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/common/AdminHeader";
import { requireAdminPageSession } from "@/lib/admin/pageAuth";

const AdminAmocrmPageClient = dynamic(
  () =>
    import("@/components/admin/amocrm/AdminAmocrmPageClient").then(
      (mod) => mod.AdminAmocrmPageClient,
    ),
  {
    loading: () => <div className="py-16 text-center text-sm text-zinc-400">Загрузка amoCRM...</div>,
  },
);

export default async function AdminAmocrmPage() {
  const auth = await requireAdminPageSession();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AdminHeader login={auth.user.login} />
      <AdminAmocrmPageClient />
    </div>
  );
}
