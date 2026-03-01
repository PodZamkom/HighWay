import { AdminPagesEditor } from "@/components/admin/pages/AdminPagesEditor";

export default function AdminPagesRoute() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <AdminPagesEditor />
      </div>
    </div>
  );
}
