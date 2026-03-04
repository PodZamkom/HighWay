import { redirect } from "next/navigation";
import { getAdminSessionFromServerContext } from "@/lib/admin/auth";

export async function requireAdminPageSession() {
  const auth = await getAdminSessionFromServerContext();
  if (!auth) {
    redirect("/admin/login");
  }
  return auth;
}
