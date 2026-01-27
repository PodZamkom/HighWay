"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Phone, User, Truck, Car } from 'lucide-react';
import clsx from 'clsx';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [segment, setSegment] = useState<'b2c' | 'b2b'>('b2c');

    return (
        <header className="fixed w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
            {/* Top Bar for Segment Switch */}
            <div className="bg-zinc-900 text-white text-xs py-2 px-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setSegment('b2c')}
                            className={clsx("flex items-center gap-2 hover:text-white transition-colors", segment === 'b2c' ? "text-white font-bold" : "text-zinc-400")}
                        >
                            <Car size={14} /> Легковые (B2C)
                        </button>
                        <div className="w-px bg-zinc-700 h-4 self-center"></div>
                        <button
                            onClick={() => setSegment('b2b')}
                            className={clsx("flex items-center gap-2 hover:text-white transition-colors", segment === 'b2b' ? "text-white font-bold" : "text-zinc-400")}
                        >
                            <Truck size={14} /> Коммерческие (B2B)
                        </button>
                    </div>
                    <div className="flex gap-4">
                        <a href="tel:+375290000000" className="hover:text-blue-400">+375 (29) 000-00-00</a>
                        <span className="hidden sm:inline text-zinc-500">|</span>
                        <span className="hidden sm:inline text-zinc-400">Минск, ул. Тимирязева 114</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="text-2xl font-black tracking-tighter italic">
                            HIGHWAY<span className="text-blue-600">.</span>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex space-x-8">
                        {['Каталог', 'Калькулятор', 'Услуги', 'О компании', 'Блог'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium hover:text-blue-600 transition-colors">
                                {item}
                            </a>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/20">
                            <Phone size={16} />
                            Заказать звонок
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-zinc-700 dark:text-zinc-200 hover:text-blue-600"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {['Каталог', 'Калькулятор', 'Услуги', 'О компании', 'Блог'].map((item) => (
                            <a key={item} href="#" className="block px-3 py-2 text-base font-medium text-zinc-700 dark:text-zinc-200 hover:text-blue-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md">
                                {item}
                            </a>
                        ))}
                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold">
                                <Phone size={18} /> Заказать звонок
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
