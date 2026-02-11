"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"}
      className={[
        "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
        "border-zinc-300/80 bg-white/80 text-zinc-700 hover:bg-white",
        "dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10",
        className,
      ].join(" ")}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
