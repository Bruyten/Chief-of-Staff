// The shell that wraps every authenticated page in the App tab.
// Provides: app sidebar (with mobile drawer), topbar, main scroll area, toaster.

import { useState, type ReactNode } from "react";
import { useApp, type AppPage } from "../AppContext";
import { cn } from "../../utils/cn";
import { Toaster } from "../ui/Toaster";

type NavItem = {
  page: AppPage;
  icon: string;
  label: string;
  soon?: boolean;
};

const navItems: NavItem[] = [
  { page: "dashboard", icon: "🏠", label: "Dashboard" },
  { page: "new-task", icon: "✨", label: "New Task" },
  { page: "projects", icon: "📁", label: "Projects" },
  { page: "saved-outputs", icon: "📚", label: "Saved Outputs" },
  { page: "templates", icon: "🧰", label: "Templates" },
  { page: "pricing", icon: "💎", label: "Pricing" },
  { page: "settings", icon: "⚙️", label: "Settings" },
];

export function AppShell({ children, title, subtitle, action }: { children: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex-1 flex h-screen min-w-0 overflow-hidden bg-[#06070a]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">
        <AppSidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative">
            <AppSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} subtitle={subtitle} action={action} onMobileMenu={() => setMobileOpen(true)} />
        <div id="app-main-scroll" className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">{children}</div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

function AppSidebar({ onNavigate }: { onNavigate: () => void }) {
  const { page, navigate, user, logout } = useApp();
  return (
    <aside className="w-64 h-full border-r border-white/5 bg-[#0b0d12] flex flex-col">
      <div className="px-5 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 grid place-items-center text-white font-bold shadow-lg shadow-violet-500/20">
            CS
          </div>
          <div className="min-w-0">
            <div className="text-white font-semibold text-[14px] leading-tight truncate">Chief of Staff</div>
            <div className="text-[10px] text-white/40 tracking-wide uppercase">AI Marketing Asst.</div>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          navigate("new-task");
          onNavigate();
        }}
        className="mx-3 mt-3 mb-1 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[13px] font-semibold hover:from-violet-400 hover:to-fuchsia-400 transition shadow-lg shadow-violet-500/20"
      >
        ✨ New Task
      </button>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <div className="px-3 pb-1.5 pt-1 text-[10px] uppercase tracking-widest text-white/30 font-semibold">
          Workspace
        </div>
        {navItems.map((item) => {
          const active = page === item.page || (item.page === "projects" && useAppPageMatches("project-detail"));
          return (
            <button
              key={item.page}
              onClick={() => {
                navigate(item.page);
                onNavigate();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[13px] transition",
                active ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium flex-1">{item.label}</span>
              {item.soon && (
                <span className="text-[9px] uppercase tracking-wider text-violet-300/80 bg-violet-500/10 px-1.5 py-0.5 rounded">
                  soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Credits widget */}
      <div className="border-t border-white/5 p-3">
        <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-white/5 p-3 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[11px] text-white/50 uppercase tracking-wider">AI Credits</div>
            <div className="text-[11px] text-white/70 font-mono">
              {user.credits}/{user.creditsMax}
            </div>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all"
              style={{ width: `${(user.credits / user.creditsMax) * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-white/40 mt-2">Free plan · resets monthly</div>
        </div>

        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-[11px] font-semibold text-white shrink-0">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-white font-medium truncate">{user.name}</div>
            <div className="text-[10px] text-white/40 truncate">{user.email}</div>
          </div>
          <button
            onClick={() => {
              logout();
              onNavigate();
            }}
            className="text-white/30 hover:text-rose-300 text-[11px] transition"
            title="Sign out"
          >
            ↩
          </button>
        </div>
      </div>
    </aside>
  );
}

// Helper used in the active-state check
function useAppPageMatches(other: AppPage) {
  return useApp().page === other;
}

function Topbar({ title, subtitle, action, onMobileMenu }: { title: string; subtitle?: string; action?: ReactNode; onMobileMenu: () => void }) {
  return (
    <header className="border-b border-white/5 bg-[#0b0d12]/60 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-3.5 flex items-center gap-3">
        <button
          className="md:hidden w-9 h-9 rounded-lg border border-white/10 grid place-items-center text-white/70 hover:text-white hover:bg-white/5"
          onClick={onMobileMenu}
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white text-[17px] md:text-[19px] font-bold leading-tight truncate">{title}</h1>
          {subtitle && <div className="text-white/50 text-[12.5px] mt-0.5 truncate">{subtitle}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
