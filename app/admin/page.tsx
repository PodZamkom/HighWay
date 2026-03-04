import Link from "next/link";
import { AdminHeader } from "@/components/admin/common/AdminHeader";
import { requireAdminPageSession } from "@/lib/admin/pageAuth";

const SECTIONS = [
  {
    href: "/admin/home",
    title: "Главная и SEO",
    description: "Блоки главной, навигация, футер, глобальное SEO и подписи каталога.",
  },
  {
    href: "/admin/pages",
    title: "Контентные страницы",
    description: "Редактирование страниц: О компании, Услуги, Сервисы, Полезное, Контакты.",
  },
  {
    href: "/admin/catalog",
    title: "Каталог автомобилей",
    description: "Создание, редактирование, архив, изображения и массовый импорт.",
  },
  {
    href: "/admin/calculator",
    title: "Калькулятор",
    description: "Ставки, порты, расходы и AI-разбор документов.",
  },
  {
    href: "/admin/bitrix",
    title: "CRM",
    description: "Параметры webhook, шаблоны лида и доп. поля интеграции.",
  },
];

export default async function AdminIndexPage() {
  const auth = await requireAdminPageSession();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AdminHeader login={auth.user.login} />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <h1 className="text-3xl font-black tracking-tight">Админ-панель</h1>
          <p className="mt-2 text-sm text-zinc-400">Все изменения публикуются на сайт сразу после сохранения.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-white/10 bg-zinc-900 p-5 transition hover:border-orange-400/60 hover:bg-zinc-800"
            >
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
              <p className="mt-2 text-sm text-zinc-400">{section.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
