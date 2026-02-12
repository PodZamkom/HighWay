"use client";

import { useState } from 'react';
import Link from 'next/link';
import type { NavbarContent } from '@/types/site';
import { Instagram, Send, ChevronDown, Menu, X } from 'lucide-react';
import { LeadFormModal } from './LeadFormModal';

interface NavbarProps {
  content: NavbarContent;
}

export function Navbar({ content }: NavbarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const secondaryMenus = content.secondaryMenus ?? [];
  const secondaryLinks = content.secondaryLinks ?? [];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/10 shadow-[0_12px_34px_-24px_rgba(0,0,0,0.85)]">
        {/* Top Row */}
        <div className="bg-gradient-to-r from-[#121722] via-[#151b29] to-[#11151f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-[72px] items-center justify-between py-3">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center gap-2">
                  <img src="/images/logo.png" alt="Highway Motors" className="h-9 w-auto object-contain" />
                </Link>
              </div>

              {/* Nav Links */}
              <div className="hidden lg:block ml-10">
                <div className="flex items-center space-x-6">
                  {content.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-sm font-semibold text-zinc-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end">
                  <a href={content.phoneLink} className="flex items-center gap-1 text-sm font-black tracking-tight text-orange-500 transition-colors hover:text-orange-400">
                    {content.phone}
                    <ChevronDown className="h-3 w-3 text-zinc-500" />
                  </a>
                  <div className="flex items-center gap-3 mt-1">
                    <a href={content.instagram} target="_blank" rel="noreferrer" className="text-zinc-400 transition-colors hover:text-orange-400">
                      <Instagram size={16} />
                    </a>
                    <a href={content.whatsapp} target="_blank" rel="noreferrer" className="text-zinc-400 transition-colors hover:text-green-400">
                      <Send size={16} className="rotate-[-20deg]" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-600/30 transition-all hover:from-orange-400 hover:to-orange-500 active:scale-95"
                >
                  {content.ctaLabel}
                </button>

                {/* Mobile menu button */}
                <button
                  className="lg:hidden text-white"
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row */}
        {secondaryMenus.length > 0 ? (
          <div className="border-t border-white/5 bg-[#0f141e]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="hidden lg:flex items-center gap-6 py-3">
                {secondaryMenus.map((menu) => (
                  <div key={menu.label} className="relative group">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-sm font-semibold text-zinc-200 transition-colors hover:text-white"
                      aria-haspopup="true"
                    >
                      {menu.label}
                      <ChevronDown className="h-3 w-3 text-zinc-500 transition-colors group-hover:text-white" />
                    </button>
                    <div className="pointer-events-none absolute left-0 z-50 mt-3 w-56 translate-y-2 rounded-xl border border-white/10 bg-[#131b28] opacity-0 shadow-xl transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                      <div className="p-2">
                        {menu.items.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
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
                    className="rounded-full border border-orange-500/40 px-4 py-1.5 text-sm font-semibold text-orange-400 transition-colors hover:border-orange-400 hover:bg-orange-500/20 hover:text-orange-300"
                  >
                    {link.label}
                  </Link>
                ))}

              </div>
            </div>
          </div>
        ) : null}

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="border-b border-white/10 bg-[#101725] shadow-lg lg:hidden">
            <div className="px-4 py-4 space-y-3">
              {content.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block py-2 text-sm font-semibold text-zinc-200 transition-colors hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {secondaryMenus.map((menu) =>
                menu.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block py-1 pl-4 text-sm text-zinc-400 transition-colors hover:text-orange-300"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </nav>

      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="ОБРАТНЫЙ ЗВОНОК"
      />
    </>
  );
}
