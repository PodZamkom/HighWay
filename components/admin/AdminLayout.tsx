import React, { useState } from 'react';
import { AdminTab } from '../../types';
import { LayoutDashboard, FileText, Image as ImageIcon, Search, Phone, LogOut } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen bg-zinc-950 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-white/5 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold text-white tracking-tight">HIGHWAY<span className="text-electricBlue">_SYS</span></h1>
          <p className="text-xs text-zinc-500">v.4.2.0 • Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={18} />} 
            label="Обзор (Dashboard)" 
            active={activeTab === AdminTab.DASHBOARD} 
            onClick={() => setActiveTab(AdminTab.DASHBOARD)}
          />
          <SidebarItem 
            icon={<FileText size={18} />} 
            label="Редактор контента" 
            active={activeTab === AdminTab.CONTENT} 
            onClick={() => setActiveTab(AdminTab.CONTENT)}
          />
          <SidebarItem 
            icon={<ImageIcon size={18} />} 
            label="Медиа менеджер" 
            active={activeTab === AdminTab.MEDIA} 
            onClick={() => setActiveTab(AdminTab.MEDIA)}
          />
          <SidebarItem 
            icon={<Search size={18} />} 
            label="SEO настройки" 
            active={activeTab === AdminTab.SEO} 
            onClick={() => setActiveTab(AdminTab.SEO)}
          />
           <SidebarItem 
            icon={<Phone size={18} />} 
            label="Контакты" 
            active={activeTab === AdminTab.CONTACTS} 
            onClick={() => setActiveTab(AdminTab.CONTACTS)}
          />
        </nav>

        <div className="p-4 border-t border-white/5">
          <a href="/" className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/5 rounded-lg transition-colors text-sm font-medium">
            <LogOut size={18} />
            Выйти
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
      active 
      ? 'bg-electricBlue text-white shadow-lg shadow-blue-900/20' 
      : 'text-zinc-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {icon}
    {label}
  </button>
);