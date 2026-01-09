import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MarketGrid } from './components/MarketGrid';
import { TrustBanner } from './components/TrustBanner';
import { LiveFeed } from './components/LiveFeed';
import { ProcessSteps } from './components/ProcessSteps';
import { LeadForm } from './components/LeadForm';
import { Footer } from './components/Footer';
import { AdminLayout } from './components/admin/AdminLayout';
import { Dashboard } from './components/admin/Dashboard';
import { AdminTab } from './types';
import { Lock } from 'lucide-react';

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash);
  const [adminTab, setAdminTab] = useState<AdminTab>(AdminTab.DASHBOARD);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Scroll to top whenever route changes to avoid "blank screen" error
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.login === 'Admin' && loginForm.password === 'Admin1243') {
        setIsAuthenticated(true);
        setError('');
    } else {
        setError('Неверный логин или пароль');
    }
  };

  // Simple Hash Routing
  if (route === '#admin') {
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-white/10 shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-electricBlue border border-white/5">
                            <Lock size={28} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-white mb-2">Вход в систему</h2>
                    <p className="text-zinc-500 text-center text-sm mb-8">Панель управления Highway Motors</p>
                    
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Логин</label>
                            <input 
                                type="text" 
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-electricBlue focus:outline-none focus:ring-1 focus:ring-electricBlue transition-all"
                                value={loginForm.login}
                                onChange={e => setLoginForm({...loginForm, login: e.target.value})}
                                placeholder="Введите логин"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Пароль</label>
                            <input 
                                type="password" 
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-electricBlue focus:outline-none focus:ring-1 focus:ring-electricBlue transition-all"
                                value={loginForm.password}
                                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                                placeholder="Введите пароль"
                            />
                        </div>
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}
                        <button className="w-full bg-white text-black font-bold py-3.5 rounded-lg hover:bg-zinc-200 transition-colors mt-2">
                            ВОЙТИ
                        </button>
                    </form>
                    <a href="#" onClick={(e) => { e.preventDefault(); window.history.pushState("", document.title, window.location.pathname); setRoute(''); }} className="block text-center text-zinc-500 text-sm mt-8 hover:text-white transition-colors cursor-pointer">
                        ← Вернуться на сайт
                    </a>
                </div>
            </div>
        )
    }

    return (
      <AdminLayout activeTab={adminTab} setActiveTab={setAdminTab}>
        <Dashboard activeTab={adminTab} />
      </AdminLayout>
    );
  }

  return (
    <div className="bg-zinc-950 text-zinc-50 selection:bg-electricBlue selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <MarketGrid />
        <TrustBanner />
        <LiveFeed />
        <ProcessSteps />
        <LeadForm />
      </main>
      <Footer />
    </div>
  );
};

export default App;