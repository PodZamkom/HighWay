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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.login === 'Admin' && loginForm.password === 'Admin1243') {
        setIsAuthenticated(true);
        setError('');
    } else {
        setError('Неверный логин или пароль');
    }
  };

  // Simple Hash Routing for the demonstration
  if (route === '#admin') {
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-white/10">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-electricBlue">
                            <Lock size={24} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-white mb-6">Вход в систему</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold">Логин</label>
                            <input 
                                type="text" 
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-electricBlue focus:outline-none mt-1"
                                value={loginForm.login}
                                onChange={e => setLoginForm({...loginForm, login: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold">Пароль</label>
                            <input 
                                type="password" 
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-electricBlue focus:outline-none mt-1"
                                value={loginForm.password}
                                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors">
                            ВОЙТИ
                        </button>
                    </form>
                    <a href="/" className="block text-center text-zinc-500 text-sm mt-6 hover:text-white">← Вернуться на сайт</a>
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