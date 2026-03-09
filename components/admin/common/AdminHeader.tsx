"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/home", label: "Главная и CMS" },
  { href: "/admin/pages", label: "Страницы" },
  { href: "/admin/news", label: "Новости" },
  { href: "/admin/catalog", label: "Каталог" },
  { href: "/admin/calculator", label: "Калькулятор" },
  { href: "/admin/bitrix", label: "CRM" },
];

interface AdminHeaderProps {
  login: string;
}

export function AdminHeader({ login }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/auth/logout", {
      method: "POST",
    });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <span className="rounded-md bg-orange-500/20 px-2 py-1 text-xs font-bold uppercase text-orange-300">CMS</span>
          <span>{login}</span>
        </div>

        <div className="order-3 w-full overflow-x-auto md:order-2 md:w-auto">
          <nav className="flex min-w-max items-center gap-2 pb-1 md:pb-0">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-orange-500/20 text-orange-300"
                      : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={logout}
          className="order-2 inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-orange-400 hover:text-white md:order-3"
        >
          <LogOut size={14} />
          Выход
        </button>
      </div>
    </header>
  );
}
