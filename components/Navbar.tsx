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
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a] shadow-[0_10px_26px_-18px_rgba(0,0,0,0.85)]">
        {/* Top Row */}
        <div className="bg-black/70 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-[70px] items-center justify-between">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center gap-2">
                  <img src="/images/logo2.png" alt="Highway Motors" className="h-9 w-auto object-contain sm:h-10" />
                </Link>
              </div>

              {/* Nav Links */}
              <div className="ml-10 hidden lg:block">
                <div className="flex items-center space-x-7">
                  {content.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-[15px] font-semibold text-[#e5e7eb] transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-5">
                <div className="hidden flex-col items-end md:flex">
                  <a href={content.phoneLink} className="flex items-center gap-1 text-[1.08rem] font-black tracking-tight text-[#ff6f1d] transition-colors hover:text-[#ff8b46]">
                    {content.phone}
                    <ChevronDown className="h-3 w-3 text-[#8f8f8f]" />
                  </a>
                  <div className="mt-1 flex items-center gap-3">
                    <a href={content.instagram} target="_blank" rel="noreferrer" className="text-[#a9a9a9] transition-colors hover:text-[#ff7a33]">
                      <Instagram size={16} />
                    </a>
                    <a href={content.whatsapp} target="_blank" rel="noreferrer" className="text-[#a9a9a9] transition-colors hover:text-[#45d07f]">
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
          <div className="border-t border-white/5 bg-black/50 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="hidden items-center gap-7 py-2.5 lg:flex">
                {secondaryMenus.map((menu) => (
                  <div key={menu.label} className="relative group">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[0.95rem] font-semibold text-[#e5e7eb] transition-colors hover:text-white"
                      aria-haspopup="true"
                    >
                      {menu.label}
                      <ChevronDown className="h-3 w-3 text-[#8f8f8f] transition-colors group-hover:text-white" />
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
                    className="text-[0.95rem] font-semibold text-[#d8d8d8] transition-colors hover:text-white"
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
          <div className="border-b border-white/10 bg-black/90 backdrop-blur-xl shadow-lg lg:hidden">
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
              {secondaryLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block py-2 text-sm font-semibold text-[#e5e7eb] transition-colors hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
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
