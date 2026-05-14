import { useState, type ReactNode } from "react";
import { useApp, type AppPage } from "../AppContext";
import { cn } from "../../utils/cn";
import { Toaster } from "../ui/Toaster";

type NavItem = {
  page: AppPage;
  icon: string;
  label: string;
  matchPages?: AppPage[];
};

const navItems: NavItem[] = [
  { page: "dashboard", icon: "🏠", label: "Dashboard" },
  { page: "new-task", icon: "✨", label: "New Task" },
  { page: "chief-chat", icon: "🧠", label: "Chief of Staff Chat" },
  { page: "projects", icon: "🗂️", label: "Campaign Workspaces", matchPages: ["project-detail"] },
  { page: "brand-voices", icon: "🎙️", label: "Brand Voices" },
  { page: "workflows", icon: "🧩", label: "Workflows", matchPages: ["workflow-run"] },
  { page: "automations", icon: "⏱️", label: "Automations" },
  { page: "video-studio", icon: "🎥", label: "Video Studio" },
  { page: "saved-outputs", icon: "💾", label: "Saved Outputs" },
  { page: "templates", icon: "📚", label: "Templates" },
  { page: "pricing", icon: "💳", label: "Pricing" },
  { page: "settings", icon: "⚙️", label: "Settings" },
];

export function AppShell({
  children,
  title,
  subtitle,
  action,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070812] text-white flex">
      <aside className="hidden lg:block w-[290px] shrink-0 border-r border-white/10 bg-white/[0.02]">
        <AppSidebar onNavigate={() => setMobileOpen(false)} />
      </aside>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-[290px] z-50 border-r border-white/10 bg-[#0b0d18] lg:hidden">
            <AppSidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      <section className="min-w-0 flex-1 flex flex-col">
        <Topbar title={title} subtitle={subtitle} action={action} onMobileMenu={() => setMobileOpen(true)} />
        <main id="app-main-scroll" className="flex-1 overflow-y-auto px-4 py-5 md:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </section>

      <Toaster />
    </div>
  );
}

function AppSidebar({ onNavigate }: { onNavigate: () => void }) {
  const { page, navigate, user, logout } = useApp();

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center font-black shadow-lg shadow-violet-500/20">
            CS
          </div>
          <div>
            <div className="font-semibold tracking-tight">Chief of Staff</div>
            <div className="text-xs text-white/45">Digital Marketing OS</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            navigate("new-task");
            onNavigate();
          }}
          className="w-full mt-4 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[13px] font-semibold hover:from-violet-400 hover:to-fuchsia-400 transition shadow-lg shadow-violet-500/20"
        >
          ✨ New Task
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-[0.18em] text-white/35 font-semibold">
          Workspace
        </div>

        {navItems.map((item) => {
          const active = page === item.page || item.matchPages?.includes(page);

          return (
            <button
              type="button"
              key={item.page}
              onClick={() => {
                navigate(item.page);
                onNavigate();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-[13px] transition",
                active ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="w-5 text-center">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-white/10 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">Usage</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-black/20 p-2">
              <div className="text-white/45">Text</div>
              <div className="text-white font-semibold mt-1">{user.credits}/{user.creditsMax}</div>
            </div>
            <div className="rounded-xl bg-black/20 p-2">
              <div className="text-white/45">Video</div>
              <div className="text-white font-semibold mt-1">{user.videoCredits}/{user.videoCreditsMax}</div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-white/35 capitalize">{user.plan} plan · resets monthly</div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-white/10 grid place-items-center text-sm font-semibold">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-[11px] text-white/45">{user.email}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              void logout();
              onNavigate();
            }}
            className="text-white/35 hover:text-rose-300 text-sm transition"
            title="Sign out"
          >
            ↩
          </button>
        </div>
      </div>
    </div>
  );
}

function Topbar({
  title,
  subtitle,
  action,
  onMobileMenu,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  onMobileMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-[76px] items-center gap-4 border-b border-white/10 bg-[#070812]/90 px-4 backdrop-blur md:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMobileMenu}
        className="lg:hidden h-10 w-10 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition"
      >
        ☰
      </button>

      <div className="min-w-0 flex-1">
        <div className="text-lg md:text-xl font-semibold tracking-tight">{title}</div>
        {subtitle ? <div className="text-sm text-white/45 mt-0.5">{subtitle}</div> : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
