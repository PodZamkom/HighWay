import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/admin/common/AdminHeader";
import { requireAdminPageSession } from "@/lib/admin/pageAuth";

const AdminCalculatorPageClient = dynamic(
  () => import("@/components/admin/calculator/AdminCalculatorPageClient").then((mod) => mod.AdminCalculatorPageClient),
  {
    loading: () => <div className="py-16 text-center text-sm text-zinc-400">Загрузка калькулятора...</div>,
  },
);

export default async function AdminCalculatorPage() {
  const auth = await requireAdminPageSession();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AdminHeader login={auth.user.login} />
      <AdminCalculatorPageClient />
    </div>
  );
}
