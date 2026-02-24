import Link from "next/link";

export default function AdminIndexPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h1 className="text-3xl font-bold">Админка</h1>
        <p className="mt-2 text-zinc-400">Выберите раздел для редактирования сайта.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/admin/home" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-orange-500 transition-colors">
            <h2 className="text-lg font-semibold">Главная страница</h2>
            <p className="mt-1 text-sm text-zinc-400">Все блоки и тексты, включая новые баннеры.</p>
          </Link>
          <Link href="/admin/calculator" className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-orange-500 transition-colors">
            <h2 className="text-lg font-semibold">Калькулятор курсов</h2>
            <p className="mt-1 text-sm text-zinc-400">Настройки коэффициентов и комиссий.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
