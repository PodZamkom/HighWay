"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BreadcrumbItem } from "@/lib/breadcrumbs";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  tone?: "light" | "dark";
  className?: string;
}

const toneClasses = {
  light: {
    wrapper: "border-slate-200 bg-white/70",
    link: "text-slate-500 hover:text-slate-900",
    current: "text-[#ff5a00]",
    separator: "text-slate-400",
  },
  dark: {
    wrapper: "border-white/10 bg-black/20",
    link: "text-[#b8bcc5] hover:text-white",
    current: "text-[#ff8f55]",
    separator: "text-[#7c8593]",
  },
} as const;

export function Breadcrumbs({ items, tone = "light", className = "" }: BreadcrumbsProps) {
  const prepared = items.map((item) => ({ label: item.label?.trim() || "", href: item.href })).filter((item) => item.label);
  if (!prepared.length) return null;

  const palette = toneClasses[tone];

  return (
    <nav
      aria-label="Breadcrumb"
      className={`rounded-xl border px-3 py-2 shadow-[0_10px_28px_-24px_rgba(0,0,0,0.85)] backdrop-blur-sm ${palette.wrapper} ${className}`.trim()}
    >
      <ol className="custom-scrollbar flex items-center gap-1 overflow-x-auto whitespace-nowrap text-xs font-semibold sm:text-sm">
        {prepared.map((item, index) => {
          const isLast = index === prepared.length - 1;
          const key = `${item.label}-${index}`;

          return (
            <li key={key} className="inline-flex items-center gap-1 sm:gap-1.5">
              {index > 0 ? <ChevronRight size={14} className={palette.separator} aria-hidden="true" /> : null}
              {isLast || !item.href ? (
                <span aria-current={isLast ? "page" : undefined} className={`max-w-[60vw] truncate ${palette.current}`}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className={`transition-colors ${palette.link}`}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
