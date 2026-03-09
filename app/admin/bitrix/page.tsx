import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/common/AdminHeader";
import { requireAdminPageSession } from "@/lib/admin/pageAuth";

const AdminBitrixPageClient = dynamic(
  () => import("@/components/admin/bitrix/AdminBitrixPageClient").then((mod) => mod.AdminBitrixPageClient),
  {
    loading: () => <div className="py-16 text-center text-sm text-zinc-400">Загрузка CRM...</div>,
  },
);

export default async function AdminBitrixPage() {
  const auth = await requireAdminPageSession();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AdminHeader login={auth.user.login} />
      <AdminBitrixPageClient />
    </div>
  );
}
