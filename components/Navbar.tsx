"use client";

import { useState } from 'react';
import Link from 'next/link';
import type { NavbarContent } from '@/types/site';
import { Instagram, Send, ChevronDown } from 'lucide-react';
import { LeadFormModal } from './LeadFormModal';
import { ThemeToggle } from './theme/ThemeToggle';

interface NavbarProps {
  content: NavbarContent;
}

export function Navbar({ content }: NavbarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const secondaryMenus = content.secondaryMenus ?? [];
  const secondaryLinks = content.secondaryLinks ?? [];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-black/10 bg-white/85 backdrop-blur-md dark:border-white/10 dark:bg-black/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <img src="/images/logo.png" alt="Highway Motors" className="h-10 w-auto object-contain" />
              </Link>
            </div>

            {/* Nav Links */}
            <div className="hidden lg:block ml-10">
              <div className="flex items-center space-x-6">
                {content.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side: Phone, Socials, Button */}
            <div className="flex items-center gap-4 md:gap-8">
              <div className="hidden md:flex flex-col items-end">
                <div className="group flex cursor-pointer items-center gap-1 text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
                  {content.phone}
                  <ChevronDown className="h-3 w-3 text-zinc-500 transition-colors group-hover:text-zinc-900 dark:group-hover:text-white" />
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <a href={content.instagram} target="_blank" className="text-zinc-500 transition-colors hover:text-red-500">
                    <Instagram size={16} />
                  </a>
                  <a href={content.whatsapp} target="_blank" className="text-zinc-500 transition-colors hover:text-green-500">
                    <Send size={16} className="rotate-[-20deg]" />
                  </a>
                </div>
              </div>

              <ThemeToggle />

              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl bg-zinc-900 px-6 py-2.5 text-xs font-black text-white shadow-lg transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {content.ctaLabel}
              </button>
            </div>
          </div>
        </div>

        {secondaryMenus.length > 0 ? (
          <div className="border-t border-black/5 dark:border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="hidden lg:flex items-center gap-6 py-3">
                {secondaryMenus.map((menu) => (
                  <div key={menu.label} className="relative group">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] font-semibold text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
                      aria-haspopup="true"
                    >
                      {menu.label}
                      <ChevronDown className="h-3 w-3 text-zinc-600 transition-colors group-hover:text-zinc-900 dark:group-hover:text-white" />
                    </button>
                    <div className="pointer-events-none absolute left-0 mt-3 w-56 translate-y-2 rounded-2xl border border-black/10 bg-white/95 opacity-0 shadow-2xl backdrop-blur-md transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 dark:border-white/10 dark:bg-black/95">
                      <div className="p-2">
                        {menu.items.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="block rounded-xl px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="rounded-full border border-black/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600 transition-colors hover:border-black/30 hover:bg-black/5 hover:text-zinc-900 dark:border-white/15 dark:text-white/70 dark:hover:border-white/40 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </nav>

      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="ОБРАТНЫЙ ЗВОНОК"
      />
    </>
  );
}
