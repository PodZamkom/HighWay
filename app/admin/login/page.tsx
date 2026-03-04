import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/common/AdminLoginForm";
import { getAdminSessionFromServerContext } from "@/lib/admin/auth";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const auth = await getAdminSessionFromServerContext();
  if (auth) {
    redirect("/admin");
  }

  const { next } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") ? next : "/admin";

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-md">
        <AdminLoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}
