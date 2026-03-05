"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminLoginFormProps {
  nextPath: string;
}

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = useMemo(() => {
    return loading || !login.trim() || !password;
  }, [loading, login, password]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: login.trim(),
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Не удалось выполнить вход");
      }

      router.replace(nextPath || "/admin/home");
      router.refresh();
    } catch (cause: any) {
      setError(cause?.message || "Ошибка входа");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-black/50 backdrop-blur md:p-8">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400">
        <LockKeyhole size={20} />
      </div>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Вход в админку</h1>
        <p className="mt-2 text-sm text-zinc-400">Авторизация нужна для управления контентом, SEO, баннерами и каталогом.</p>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-zinc-300">Логин</span>
        <input
          autoFocus
          type="text"
          value={login}
          onChange={(event) => setLogin(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-500"
          placeholder="admin"
          autoComplete="username"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-zinc-300">Пароль</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-500"
          placeholder="Введите пароль"
          autoComplete="current-password"
        />
      </label>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isDisabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {loading ? "Входим..." : "Войти"}
      </button>
    </form>
  );
}
