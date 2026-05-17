import { useState, type ReactNode } from "react";
import { useApp, type AppPage } from "../AppContext";
import { useUnlimitedAccess } from "../lib/useUnlimitedAccess";
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
  { page: "chief-chat", icon: "💬", label: "Chief of Staff Chat" },
  {
    page: "projects",
    icon: "🗂️",
    label: "Campaign Workspaces",
    matchPages: ["project-detail"],
  },
  { page: "product-library", icon: "📦", label: "Product Library" },
  { page: "brand-voices", icon: "🗣️", label: "Brand Voices" },
  {
    page: "workflows",
    icon: "⚙️",
    label: "Workflows",
    matchPages: ["workflow-run"],
  },
  { page: "automations", icon: "⏱️", label: "Automations" },
  { page: "video-studio", icon: "🎬", label: "Video Studio" },
  { page: "saved-outputs", icon: "💾", label: "Saved Outputs" },
  { page: "templates", icon: "📚", label: "Templates" },
  { page: "pricing", icon: "💳", label: "Pricing" },
  { page: "settings", icon: "⚙️", label: "Settings" },
];

export function AppShell({
  children,
  title,
  subtitle,
  eyebrow,
  action,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  actions?: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#070812] text-white">
      <aside className="hidden w-[290px] shrink-0 border-r border-white/10 bg-white/[0.02] lg:block">
        <AppSidebar onNavigate={() => setMobileOpen(false)} />
      </aside>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="fixed bottom-0 left-0 top-0 z-50 w-[290px] border-r border-white/10 bg-[#0b0d18] lg:hidden">
            <AppSidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      ) : null}

      <section className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          subtitle={subtitle}
          eyebrow={eyebrow}
          action={actions ?? action}
          onMobileMenu={() => setMobileOpen(true)}
        />

        <main
          id="app-main-scroll"
          className="flex-1 overflow-y-auto px-4 py-5 md:px-6 lg:px-8 lg:py-7"
        >
          <div className="space-y-5">{children}</div>
        </main>
      </section>

      <Toaster />
    </div>
  );
}

function AppSidebar({ onNavigate }: { onNavigate: () => void }) {
  const { page, navigate, user, logout, mode } = useApp();
  const unlimitedAccess = useUnlimitedAccess(mode);

  const isUnlimited = unlimitedAccess.unlimited;

  const accessLabel =
    unlimitedAccess.role === "owner"
      ? "Owner access"
      : unlimitedAccess.role === "admin"
        ? "Admin access"
        : `${user.plan} plan`;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 font-black shadow-lg shadow-violet-500/20">
            CS
          </div>

          <div>
            <div className="font-semibold tracking-tight">
              Chief of Staff
            </div>
            <div className="text-xs text-white/45">
              Digital Marketing OS
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            navigate("new-task");
            onNavigate();
          }}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-violet-400 hover:to-fuchsia-400"
        >
          ✨ New Task
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
          Workspace
        </div>

        {navItems.map((item) => {
          const active =
            page === item.page || item.matchPages?.includes(page);

          return (
            <button
              type="button"
              key={item.page}
              onClick={() => {
                navigate(item.page);
                onNavigate();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] transition",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <span className="w-5 text-center">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-white/10 p-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Usage
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-black/20 p-2">
              <div className="text-white/45">Text</div>
              <div className="mt-1 font-semibold text-white">
                {isUnlimited
                  ? "Unlimited"
                  : `${user.credits}/${user.creditsMax}`}
              </div>
            </div>

            <div className="rounded-xl bg-black/20 p-2">
              <div className="text-white/45">Video</div>
              <div className="mt-1 font-semibold text-white">
                {isUnlimited
                  ? "Unlimited"
                  : `${user.videoCredits}/${user.videoCreditsMax}`}
              </div>
            </div>
          </div>

          <div className="mt-2 text-[11px] capitalize text-white/35">
            {isUnlimited
              ? `${accessLabel} · Unlimited`
              : `${accessLabel} · resets monthly`}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-semibold">
            {user.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-[11px] text-white/45">
              {user.email}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void logout();
              onNavigate();
            }}
            className="text-sm text-white/35 transition hover:text-rose-300"
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
  eyebrow,
  action,
  onMobileMenu,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  onMobileMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-[76px] items-center gap-4 border-b border-white/10 bg-[#070812]/90 px-4 backdrop-blur md:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMobileMenu}
        className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.03] transition hover:bg-white/[0.08] lg:hidden"
      >
        ☰
      </button>

      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/70">
            {eyebrow}
          </div>
        ) : null}

        <div className="text-lg font-semibold tracking-tight md:text-xl">
          {title}
        </div>

        {subtitle ? (
          <div className="mt-0.5 text-sm text-white/45">{subtitle}</div>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
