import Link from 'next/link';
import type { NavbarContent } from '@/types/site';

interface NavbarProps {
  content: NavbarContent;
}

export function Navbar({ content }: NavbarProps) {
  return (
    <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold tracking-tighter text-white">
              {content.brandPrimary}<span className="text-red-500">{content.brandAccent}</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {content.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <button className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors">
              {content.ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
