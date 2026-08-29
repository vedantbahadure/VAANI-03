import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, MessageCircle, BookOpen, FileText, History, Activity, Settings, Wifi, WifiOff } from "lucide-react";
import { Orb } from "../components/Orb";
import { ThemeToggle, LanguageSwitcher } from "../components/Controls";
import { useLang, useOrb, useOnline } from "../lib/contexts";
import { t } from "../lib/i18n";

const NAV = [
  { to: "/app", key: "nav_home", icon: Home, end: true },
  { to: "/app/chat", key: "nav_chat", icon: MessageCircle },
  { to: "/app/knowledge", key: "nav_knowledge", icon: BookOpen },
  { to: "/app/documents", key: "nav_documents", icon: FileText },
  { to: "/app/history", key: "nav_history", icon: History },
  { to: "/app/status", key: "nav_status", icon: Activity },
  { to: "/app/settings", key: "nav_settings", icon: Settings },
];

export default function AppShell() {
  const { lang } = useLang();
  const { orbState } = useOrb();
  const online = useOnline();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop side dock */}
      <aside className="hidden md:flex flex-col justify-between w-[248px] shrink-0 border-r border-border p-5">
        <div>
          <button onClick={() => navigate("/")} className="flex items-center gap-3 mb-10 group" data-testid="brand-home">
            <Orb state={orbState} size={40} />
            <div className="text-left">
              <div className="font-head text-lg font-medium tracking-tight leading-none">{t(lang, "app_name")}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{t(lang, "tagline")}</div>
            </div>
          </button>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                data-testid={`nav-${n.key}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors duration-300 ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`
                }
              >
                <n.icon className="w-[18px] h-[18px]" />
                {t(lang, n.key)}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-full border ${online ? "border-emerald-500/25 text-emerald-600 dark:text-emerald-400" : "border-stone-500/30 text-muted-foreground"}`} data-testid="online-status">
          {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {online ? t(lang, "online") : t(lang, "offline")}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-5 md:px-8 h-16 border-b border-border glass">
          <div className="flex items-center gap-3 md:hidden">
            <Orb state={orbState} size={30} />
            <span className="font-head font-medium tracking-tight">{t(lang, "app_name")}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-breathe" />
            <span className="uppercase tracking-[0.2em] font-mono">{orbState}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 min-w-0 pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom dock */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-2 py-2 rounded-full glass shadow-xl" data-testid="mobile-dock">
        {NAV.slice(0, 6).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `grid place-items-center w-11 h-11 rounded-full transition-colors duration-300 ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`
            }
          >
            <n.icon className="w-5 h-5" />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
