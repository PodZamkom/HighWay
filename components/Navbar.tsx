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
      <nav className="sticky top-0 z-50 border-b border-[#242424] shadow-[0_10px_26px_-18px_rgba(0,0,0,0.85)]">
        {/* Top Row */}
        <div className="bg-[#111111]">
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
                      className="text-sm font-semibold text-[#e5e7eb] transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end">
                  <a href={content.phoneLink} className="flex items-center gap-1 text-sm font-black tracking-tight text-[#ff5a00] transition-colors hover:text-[#ff7a33]">
                    {content.phone}
                    <ChevronDown className="h-3 w-3 text-[#8d95a6]" />
                  </a>
                  <div className="flex items-center gap-3 mt-1">
                    <a href={content.instagram} target="_blank" rel="noreferrer" className="text-[#a4acbb] transition-colors hover:text-[#ff7a33]">
                      <Instagram size={16} />
                    </a>
                    <a href={content.whatsapp} target="_blank" rel="noreferrer" className="text-[#a4acbb] transition-colors hover:text-[#45d07f]">
                      <Send size={16} className="rotate-[-20deg]" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-xl bg-[#ff5a00] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#ff5a00]/30 transition-colors hover:bg-[#ff7429] active:scale-95"
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
          <div className="border-t border-[#252525] bg-[#0a0a0a]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="hidden lg:flex items-center gap-6 py-3">
                {secondaryMenus.map((menu) => (
                  <div key={menu.label} className="relative group">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-sm font-semibold text-[#e5e7eb] transition-colors hover:text-white"
                      aria-haspopup="true"
                    >
                      {menu.label}
                      <ChevronDown className="h-3 w-3 text-[#8d95a6] transition-colors group-hover:text-white" />
                    </button>
                    <div className="pointer-events-none absolute left-0 z-50 mt-3 w-56 translate-y-2 rounded-xl border border-[#303030] bg-[#141414] opacity-0 shadow-xl transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                      <div className="p-2">
                        {menu.items.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="block rounded-lg px-3 py-2 text-sm text-[#d6dae2] transition-colors hover:bg-white/5 hover:text-white"
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
                    className="rounded-full border border-[#ff5a00] px-4 py-1.5 text-sm font-semibold text-[#ff6f1d] transition-colors hover:bg-[#ff5a00] hover:text-white"
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
          <div className="border-b border-[#252525] bg-[#111111] shadow-lg lg:hidden">
            <div className="px-4 py-4 space-y-3">
              {content.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block py-2 text-sm font-semibold text-[#e5e7eb] transition-colors hover:text-white"
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
                    className="block py-1 pl-4 text-sm text-[#a4acbb] transition-colors hover:text-[#ff7a33]"
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
