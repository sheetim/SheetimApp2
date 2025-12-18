import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  Wallet,
  Target,
  CreditCard,
  PieChart,
  Activity,
  Calculator,
  Menu,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  Sparkles,
  DollarSign,
  FileText,
  Settings as SettingsIcon,
  TrendingUp,
  Wrench,
  ChevronDown,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeProvider, useTheme } from "./components/ThemeProvider";
import NotificationCenter from "./components/notifications/NotificationCenter";
import HelpButton from "./components/common/HelpButton";
import { Toaster } from "./components/ui/toaster";
import PWAInstallPrompt from "./components/pwa/PWAInstallPrompt";
import OfflineIndicator from "./components/pwa/OfflineIndicator";
import UpdatePrompt from "./components/pwa/UpdatePrompt";
import TermsAcceptanceModal from "./components/legal/TermsAcceptanceModal";
import WelcomeOnboarding from "./components/onboarding/WelcomeOnboarding";
import { useToast } from "./components/ui/use-toast";
import ProBadge from "./components/common/ProBadge";
import QuickAddFAB from "./components/quickadd/QuickAddFAB";
import DesktopQuickActions from "./components/dashboard/DesktopQuickActions";

// Navigation structure grouped by categories - Reorganized for clarity
const navigationSections = [
  {
    title: null, // Core pages - no header
    items: [
      { title: "דשבורד", url: createPageUrl("Dashboard"), icon: LayoutDashboard, color: "text-blue-600" },
      { title: "תזרים ועסקאות", url: createPageUrl("Transactions"), icon: Wallet, color: "text-green-600" },
      { title: "תקציב חודשי", url: createPageUrl("Budgets"), icon: PieChart, color: "text-purple-600" },
      { title: "תיק השקעות", url: createPageUrl("Investments"), icon: TrendingUp, color: "text-indigo-600" },
      { title: "שווי נקי", url: createPageUrl("NetWorth"), icon: DollarSign, color: "text-teal-600" },
    ]
  },
  {
    title: "חיסכון וחובות",
    items: [
      { title: "יעדי חיסכון", url: createPageUrl("Savings"), icon: Target, color: "text-orange-600" },
      { title: "ניהול חובות", url: createPageUrl("Debts"), icon: CreditCard, color: "text-red-600" },
      { title: "מנויים קבועים", url: createPageUrl("Subscriptions"), icon: Activity, color: "text-pink-600" },
    ]
  },
  {
    title: "תכנון עתידי",
    items: [
      { title: "תחזית תזרים", url: createPageUrl("Forecast"), icon: RefreshCw, color: "text-cyan-600" },
      { title: "מחשבון פרישה", url: createPageUrl("Retirement"), icon: Calculator, color: "text-amber-600" },
      { title: "דיבידנדים", url: createPageUrl("Dividends"), icon: TrendingUp, color: "text-green-600" },
    ]
  },
  {
    title: "AI וכלים חכמים",
    items: [
      { title: "יועץ AI", url: createPageUrl("AIInsights"), icon: Sparkles, color: "text-purple-600", pro: true },
      { title: "דוחות", url: createPageUrl("Reports"), icon: FileText, color: "text-slate-600" },
      { title: "אינפלציה אישית", url: createPageUrl("Inflation"), icon: Wrench, color: "text-pink-600" },
    ]
  },
  {
    title: "הגדרות",
    items: [
      { title: "הגדרות ומנוי", url: createPageUrl("UserSettings"), icon: SettingsIcon, color: "text-gray-600" },
    ]
  }
];

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState(['חיסכון וחובות', 'תכנון עתידי', 'AI וכלים חכמים', 'הגדרות']);
  const [termsAccepted, setTermsAccepted] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isPublicPage = location.pathname === '/Landing' || location.pathname === '/' || location.pathname === '';

  React.useEffect(() => {
    if (isPublicPage) {
      setIsAuthenticated(true);
      return;
    }
    
    const checkAuth = async () => {
      const auth = await base44.auth.isAuthenticated();
      setIsAuthenticated(auth);
      if (!auth) {
        // Redirect to Landing page for unauthenticated users
        window.location.href = createPageUrl("Landing");
      } else {
        // בדיקה אם המשתמש אישר את התנאים
        try {
          const user = await base44.auth.me();
          if (!user.terms_accepted) {
            setTermsAccepted(false);
          }
        } catch (error) {
          console.error('Error checking terms acceptance:', error);
        }
      }
    };
    checkAuth();
  }, [isPublicPage]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-slate-900 dark:to-purple-950">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }
  
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Terms acceptance modal - מוצג פעם אחת בלבד
  if (!termsAccepted) {
    return (
      <>
        <TermsAcceptanceModal 
          onAccept={async () => {
            try {
              await base44.auth.updateMe({ terms_accepted: true });
              setTermsAccepted(true);
              toast({
                title: "✅ תודה!",
                description: "ברוך הבא ל-Sheetim"
              });
            } catch (error) {
              console.error('Error accepting terms:', error);
              setTermsAccepted(true);
            }
          }}
        />
      </>
    );
  }

  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const getCurrentPageTitle = () => {
    for (const section of navigationSections) {
      const item = section.items.find(item => item.url === location.pathname);
      if (item) return item.title;
    }
    return "דשבורד";
  };

  return (
    <div className="min-h-screen flex w-full relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-slate-900 dark:to-purple-950 transition-colors duration-500" />
      <div className="absolute inset-0 gradient-mesh opacity-30 dark:opacity-10" />
      
      <div className="relative w-full flex">
        <style>{`
          .page-transition {
            animation: pageFadeIn 0.3s ease-out;
          }
          
          @keyframes pageFadeIn {
            from { 
              opacity: 0;
              transform: translateY(8px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }

          .nav-section-enter {
            animation: sectionSlide 0.2s ease-out;
          }

          @keyframes sectionSlide {
            from {
              opacity: 0;
              max-height: 0;
            }
            to {
              opacity: 1;
              max-height: 500px;
            }
          }

          .sidebar-transition {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          button, a { transition: all 0.2s ease; }
        `}</style>

        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`
            fixed md:static inset-y-0 right-0 z-50
            bg-white dark:bg-gray-800 border-l border-gray-200/50 dark:border-gray-700/50 shadow-xl
            sidebar-transition
            ${collapsed ? 'w-20' : 'w-72 md:w-72'}
            ${mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          `}
        >
          {/* Logo */}
          <div className="border-b border-gray-100 dark:border-gray-700 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691aee03ec54fd77e85b0439/85c5d7980_2025-05-31170104.png" 
                    alt="Sheetim Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                {!collapsed && (
                  <div>
                    <h2 className="font-bold text-xl text-gray-900 dark:text-white">Sheetim</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ניהול פיננסי חכם</p>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex h-8 w-8"
              >
                {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 overflow-y-auto h-[calc(100vh-80px)]">
            {navigationSections.map((section, sectionIdx) => (
                <div key={section.title || `section-${sectionIdx}`} className="mb-2">
                  {!collapsed && section.title && (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {section.title}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedSections.includes(section.title) ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  {(collapsed || !section.title || expandedSections.includes(section.title)) && (
                    <div className="space-y-1 nav-section-enter">
                      {section.items.map((item) => {
                        const isActive = location.pathname === item.url;
                        return (
                          <Link
                            key={item.title}
                            to={item.url}
                            onClick={() => setMobileOpen(false)}
                            className={`
                              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                              ${isActive 
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 font-semibold shadow-sm' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                              }
                            `}
                          >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? item.color : 'text-gray-500 dark:text-gray-400'}`} />
                            {!collapsed && (
                              <>
                                <span className="text-sm flex-1 truncate">{item.title}</span>
                                {item.pro && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 font-medium">Pro</span>
                                )}
                              </>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Header */}
          <header className="bg-white/95 dark:bg-gray-800/95 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
            <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden h-10 w-10"
                >
                  <Menu className="w-6 h-6" />
                </Button>
                <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                  {getCurrentPageTitle()}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                    <DesktopQuickActions />
                    <NotificationCenter />
                    <HelpButton />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="h-10 w-10"
                    >
                      {theme === 'dark' ? (
                        <Sun className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Moon className="w-5 h-5 text-gray-600" />
                      )}
                    </Button>
                  </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-auto pb-20 md:pb-0">
            <div className="page-transition">
              {children}
            </div>

            {/* Mobile Menu Button - hidden when sidebar open */}
            {!mobileOpen && (
              <Button
                variant="default"
                size="icon"
                onClick={() => setMobileOpen(true)}
                className="fixed bottom-20 right-4 z-30 h-12 w-12 rounded-full shadow-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 md:hidden"
              >
                <Menu className="w-5 h-5 text-white" />
              </Button>
            )}
          </div>
        </main>
      </div>
      
      <WelcomeOnboarding />
      <QuickAddFAB />
      <Toaster />
      <PWAInstallPrompt />
      <OfflineIndicator />
      <UpdatePrompt />
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <LayoutContent currentPageName={currentPageName}>{children}</LayoutContent>
    </ThemeProvider>
  );
}