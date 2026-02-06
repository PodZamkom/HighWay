"use client";

import { useState } from 'react';
import Link from 'next/link';
import type { NavbarContent } from '@/types/site';
import { Instagram, Send, Phone, ChevronDown } from 'lucide-react';
import { LeadFormModal } from './LeadFormModal';

interface NavbarProps {
  content: NavbarContent;
}

export function Navbar({ content }: NavbarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const secondaryMenus = content.secondaryMenus ?? [];

  return (
    <>
      <nav className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-50">
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
                    className="text-zinc-400 hover:text-white text-sm font-semibold transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side: Phone, Socials, Button */}
            <div className="flex items-center gap-8">
              <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center gap-1 text-white font-bold text-sm tracking-tight group cursor-pointer">
                  {content.phone}
                  <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <a href={content.instagram} target="_blank" className="text-zinc-500 hover:text-red-500 transition-colors">
                    <Instagram size={16} />
                  </a>
                  <a href={content.whatsapp} target="_blank" className="text-zinc-500 hover:text-green-500 transition-colors">
                    <Send size={16} className="rotate-[-20deg]" />
                  </a>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-black px-6 py-2.5 rounded-xl font-black text-xs hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
              >
                {content.ctaLabel}
              </button>
            </div>
          </div>
        </div>

        {secondaryMenus.length > 0 ? (
          <div className="border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="hidden lg:flex items-center gap-6 py-3">
                {secondaryMenus.map((menu) => (
                  <div key={menu.label} className="relative group">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] font-semibold text-zinc-500 hover:text-white transition-colors"
                      aria-haspopup="true"
                    >
                      {menu.label}
                      <ChevronDown className="w-3 h-3 text-zinc-600 group-hover:text-white transition-colors" />
                    </button>
                    <div className="absolute left-0 mt-3 w-56 rounded-2xl border border-white/10 bg-black/95 backdrop-blur-md shadow-2xl opacity-0 translate-y-2 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto">
                      <div className="p-2">
                        {menu.items.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="block rounded-xl px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
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
