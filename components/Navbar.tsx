import React, { useState, useEffect } from 'react';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS } from '../constants';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getLinkHref = (href: string) => {
    if (href.startsWith('#')) {
      return `/${href}`;
    }
    return href;
  };

  const isInternal = (href: string) => href.startsWith('#');

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || pathname !== '/' ? 'py-4 bg-matteBlack/80 backdrop-blur-xl border-b border-white/5' : 'py-6 bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 z-50 group">
          <ShieldCheck className="w-8 h-8 text-electricBlue transition-transform group-hover:scale-110" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-xl tracking-tighter text-white">HIGHWAY</span>
            <span className="text-xs text-zinc-400 tracking-widest uppercase">Motors</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            link.href.startsWith('/') ? (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-electricBlue transition-all group-hover:w-full" />
              </Link>
            ) : (
              <a
                key={link.label}
                href={getLinkHref(link.href)}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-electricBlue transition-all group-hover:w-full" />
              </a>
            )
          ))}
          <a
            href="/#contact"
            className="px-4 py-2 text-xs font-bold border border-white/10 rounded-full hover:bg-white/5 transition-all text-zinc-500 hover:text-white"
          >
            СВЯЗАТЬСЯ
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden z-50 text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 w-full h-screen bg-black flex flex-col items-center justify-center gap-8 md:hidden"
          >
            {NAV_LINKS.map((link) => (
              link.href.startsWith('/') ? (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-bold text-white"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={getLinkHref(link.href)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-bold text-white"
                >
                  {link.label}
                </a>
              )
            ))}
            <a
              href="/#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg text-electricBlue font-bold mt-8"
            >
              Связаться с нами
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};