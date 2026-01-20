import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminCatalog from './components/AdminCatalog';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MarketGrid } from './components/MarketGrid';
import CarCatalog from './components/CarCatalog';
import { TrustBanner } from './components/TrustBanner';
import { LiveFeed } from './components/LiveFeed';
import { ProcessSteps } from './components/ProcessSteps';
import { LeadForm } from './components/LeadForm';
import { Footer } from './components/Footer';
import { AdminLayout } from './components/admin/AdminLayout';
import { Dashboard } from './components/admin/Dashboard';
import { AdminTab } from './types';
import { Lock } from 'lucide-react';

// ScrollToTop component to handle scroll position on route changes
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const MainSite: React.FC = () => (
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

const CarsPage: React.FC = () => (
  <div className="bg-zinc-950 text-zinc-50 selection:bg-electricBlue selection:text-white min-h-screen">
    <Navbar />
    <main className="pt-20">
      <AdminCatalog />
      <LeadForm />
    </main>
    <Footer />
  </div>
);

const AdminRoute: React.FC<{
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
}> = ({ isAuthenticated, setIsAuthenticated, adminTab, setAdminTab }) => {
  const [loginForm, setLoginForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.login === 'Admin' && loginForm.password === 'Admin1243') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Неверный логин или пароль');
    }
  };

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
                onChange={e => setLoginForm({ ...loginForm, login: e.target.value })}
                placeholder="Введите логин"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Пароль</label>
              <input
                type="password"
                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-electricBlue focus:outline-none focus:ring-1 focus:ring-electricBlue transition-all"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
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
          <a href="/" className="block text-center text-zinc-500 text-sm mt-8 hover:text-white transition-colors cursor-pointer">
            ← Вернуться на сайт
          </a>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab={adminTab} setActiveTab={setAdminTab}>
      <Dashboard activeTab={adminTab} />
    </AdminLayout>
  );
};

const App: React.FC = () => {
  const [adminTab, setAdminTab] = useState<AdminTab>(AdminTab.DASHBOARD);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Programmatically add Oryntix Live Chat script
    const script = document.createElement('script');
    script.src = "https://staging.oryntix.ru/api/live-chat/widget.js?key=lc_Wl1pyrA0kaltZih3JyJSPVJE";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Optional: Cleanup script if component unmounts (though usually not needed for global widgets)
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/cars" element={<CarsPage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute
              isAuthenticated={isAuthenticated}
              setIsAuthenticated={setIsAuthenticated}
              adminTab={adminTab}
              setAdminTab={setAdminTab}
            />
          }
        />
        {/* Fallback for old hash routes or 404s */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;