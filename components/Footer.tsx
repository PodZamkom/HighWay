import React from 'react';
import { ShieldCheck, Instagram, Facebook, Youtube, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-matteBlack border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        
        <div className="flex items-center gap-2">
           <ShieldCheck className="w-6 h-6 text-zinc-600" />
           <span className="font-bold text-zinc-500">HIGHWAY MOTORS</span>
        </div>

        <div className="text-zinc-600 text-sm flex items-center gap-4">
            <span>© 2026 Highway Motors. Все права защищены. Минск, Беларусь.</span>
        </div>

        <div className="flex items-center gap-6">
            <div className="flex gap-4 border-r border-white/10 pr-6">
                <a href="#" className="text-zinc-600 hover:text-white transition-colors"><Instagram size={20} /></a>
                <a href="#" className="text-zinc-600 hover:text-white transition-colors"><Facebook size={20} /></a>
                <a href="#" className="text-zinc-600 hover:text-white transition-colors"><Youtube size={20} /></a>
            </div>
            {/* Admin Login Button */}
            <a href="#admin" className="text-zinc-700 hover:text-electricBlue transition-colors" title="Вход для администратора">
                <Lock size={16} />
            </a>
        </div>
      </div>
    </footer>
  );
};