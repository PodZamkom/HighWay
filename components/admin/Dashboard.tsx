import React from 'react';
import { AdminTab } from '../../types';
import { BarChart, Users, Eye, TrendingUp } from 'lucide-react';

interface DashboardProps {
  activeTab: AdminTab;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case AdminTab.DASHBOARD:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Обзор системы</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard icon={<Users />} label="Активные заявки" value="124" trend="+12%" />
              <StatCard icon={<Eye />} label="Посетители (24ч)" value="1,893" trend="+5%" />
              <StatCard icon={<BarChart />} label="Конверсия" value="3.2%" trend="-0.4%" />
              <StatCard icon={<TrendingUp />} label="Авто в пути" value="42" trend="+2" />
            </div>

            {/* Recent Activity Mockup */}
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 mt-8">
              <h3 className="text-lg font-bold text-white mb-4">Журнал событий</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div>
                        <p className="text-sm text-white">Новая заявка: "Zeekr 001"</p>
                        <p className="text-xs text-zinc-500">2 минуты назад</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">ID: #8839{i}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case AdminTab.CONTENT:
        return (
          <div className="text-center py-20 bg-zinc-900/50 border border-white/5 rounded-2xl border-dashed">
             <h2 className="text-2xl font-bold text-zinc-400">Редактор контента</h2>
             <p className="text-zinc-600 mt-2">Управление бегущими строками, текстами и описаниями.</p>
          </div>
        );

      case AdminTab.MEDIA:
        return (
             <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">Медиа менеджер</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="aspect-square bg-zinc-800 rounded-lg flex items-center justify-center border border-white/5 relative group cursor-pointer">
                             <img src={`https://picsum.photos/seed/admin${i}/300/300`} className="w-full h-full object-cover rounded-lg opacity-60 group-hover:opacity-100 transition-opacity" alt="upload" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                                <span className="text-xs font-bold text-white">РЕДАКТИРОВАТЬ</span>
                             </div>
                        </div>
                    ))}
                    <div className="aspect-square border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center hover:border-electricBlue transition-colors cursor-pointer">
                        <span className="text-zinc-500 text-sm">Загрузить</span>
                    </div>
                </div>
             </div>
        );
      
      default:
        return (
          <div className="text-center py-20">
             <h2 className="text-2xl font-bold text-zinc-500">Раздел в разработке</h2>
          </div>
        );
    }
  };

  return <div className="animate-fade-in">{renderContent()}</div>;
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, trend: string }> = ({ icon, label, value, trend }) => (
  <div className="bg-zinc-900 border border-white/5 p-6 rounded-xl">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-white/5 rounded-lg text-electricBlue">{icon}</div>
      <span className={`text-xs font-bold px-2 py-1 rounded ${trend.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        {trend}
      </span>
    </div>
    <div className="text-2xl font-bold text-white">{value}</div>
    <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{label}</div>
  </div>
);