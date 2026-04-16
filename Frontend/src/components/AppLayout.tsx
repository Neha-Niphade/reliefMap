import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SOSButton } from '@/components/SOSButton';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmergencyAlerts } from '@/components/EmergencyAlerts';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { OfflineBanner } from '@/components/OfflineBanner';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Initialize from local storage, default to light (false)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme-preference');
      return storedTheme === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme-preference', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme-preference', 'light');
    }
  }, [isDark]);

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    navigate('/');
  };

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center">
              <SidebarTrigger />
              <span className="ml-3 text-sm text-muted-foreground font-medium hidden sm:inline-block">Hyper-Local Aid Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button 
                onClick={() => setIsDark(!isDark)} 
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
                title={isDark ? t('nav.switch_light', 'Switch to Light Mode') : t('nav.switch_dark', 'Switch to Dark Mode')}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                title={t('nav.logout', 'Logout')}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline-block">{t('nav.logout', 'Logout')}</span>
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto flex flex-col min-h-0">
            {children}
          </main>
        </div>
        <SOSButton />
        <EmergencyAlerts />
        <OfflineBanner />
      </div>
    </SidebarProvider>
  );
}
