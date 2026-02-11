"use client";

import { useState } from 'react';
import Link from 'next/link';
import type { NavbarContent } from '@/types/site';
import { Instagram, Send, Phone, ChevronDown, Menu, X } from 'lucide-react';
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
      <nav className="sticky top-0 z-50 shadow-md">
        {/* Top Row — Black */}
        <div className="bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
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
                      className="text-gray-300 hover:text-white text-sm font-semibold transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end">
                  <a href={content.phoneLink} className="flex items-center gap-1 text-white font-bold text-sm tracking-tight hover:text-orange-400 transition-colors">
                    {content.phone}
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </a>
                  <div className="flex items-center gap-3 mt-1">
                    <a href={content.instagram} target="_blank" className="text-gray-400 hover:text-orange-400 transition-colors">
                      <Instagram size={16} />
                    </a>
                    <a href={content.whatsapp} target="_blank" className="text-gray-400 hover:text-green-400 transition-colors">
                      <Send size={16} className="rotate-[-20deg]" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold text-xs hover:bg-orange-500 transition-all shadow-lg active:scale-95 uppercase tracking-wider"
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

        {/* Second Row — White, secondary navigation */}
        {secondaryMenus.length > 0 ? (
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="hidden lg:flex items-center gap-6 py-3">
                {secondaryMenus.map((menu) => (
                  <div key={menu.label} className="relative group">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-orange-600 transition-colors"
                      aria-haspopup="true"
                    >
                      {menu.label}
                      <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-orange-600 transition-colors" />
                    </button>
                    <div className="absolute left-0 mt-3 w-56 rounded-xl border border-gray-200 bg-white shadow-xl opacity-0 translate-y-2 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto z-50">
                      <div className="p-2">
                        {menu.items.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
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
                    className="rounded-full border border-orange-200 px-4 py-1.5 text-sm font-semibold text-orange-600 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-colors"
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
          <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              {content.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-gray-700 hover:text-orange-600 font-semibold text-sm py-2"
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
                    className="block text-gray-500 hover:text-orange-600 text-sm py-1 pl-4"
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
