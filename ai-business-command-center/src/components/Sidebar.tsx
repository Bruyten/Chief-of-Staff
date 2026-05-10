import { cn } from "../utils/cn";

export type View =
  | "blueprint"
  | "mvp"
  | "architecture"
  | "prompts"
  | "templates"
  | "backend"
  | "integrate"
  | "library"
  | "billing"
  | "integrations"
  | "agent"
  | "dashboard";

type SectionItem = { id: string; number: string; title: string; icon: string };

type Props = {
  view: View;
  onChange: (v: View) => void;
  activeBlueprintSection: string;
  onBlueprintSection: (id: string) => void;
  blueprintSections: SectionItem[];
  activeMvpSection: string;
  onMvpSection: (id: string) => void;
  mvpSections: SectionItem[];
  activeArchSection: string;
  onArchSection: (id: string) => void;
  archSections: SectionItem[];
  activePromptsSection: string;
  onPromptsSection: (id: string) => void;
  promptsSections: SectionItem[];
  activeTemplateId: string;
  onTemplateChange: (id: string) => void;
  templateItems: SectionItem[];
  activeBackendSection: string;
  onBackendSection: (id: string) => void;
  backendSections: SectionItem[];
  activeIntegrateSection: string;
  onIntegrateSection: (id: string) => void;
  integrateSections: SectionItem[];
  activeLibrarySection: string;
  onLibrarySection: (id: string) => void;
  librarySections: SectionItem[];
  activeBillingSection: string;
  onBillingSection: (id: string) => void;
  billingSections: SectionItem[];
  activeIntegrationsId: string;
  onIntegrationsChange: (id: string) => void;
  integrationsItems: SectionItem[];
  activeAgentSection: string;
  onAgentSection: (id: string) => void;
  agentSections: SectionItem[];
};

const tabs: { id: View; label: string }[] = [
  { id: "blueprint", label: "Plan" },
  { id: "mvp", label: "MVP" },
  { id: "architecture", label: "Arch" },
  { id: "prompts", label: "AI" },
  { id: "templates", label: "Tpl" },
  { id: "backend", label: "API" },
  { id: "integrate", label: "Wire" },
  { id: "library", label: "Lib" },
  { id: "billing", label: "Pay" },
  { id: "integrations", label: "Int" },
  { id: "agent", label: "Agent" },
  { id: "dashboard", label: "App" },
];

export default function Sidebar(props: Props) {
  const {
    view,
    onChange,
    activeBlueprintSection,
    onBlueprintSection,
    blueprintSections,
    activeMvpSection,
    onMvpSection,
    mvpSections,
    activeArchSection,
    onArchSection,
    archSections,
    activePromptsSection,
    onPromptsSection,
    promptsSections,
    activeTemplateId,
    onTemplateChange,
    templateItems,
    activeBackendSection,
    onBackendSection,
    backendSections,
    activeIntegrateSection,
    onIntegrateSection,
    integrateSections,
    activeLibrarySection,
    onLibrarySection,
    librarySections,
    activeBillingSection,
    onBillingSection,
    billingSections,
    activeIntegrationsId,
    onIntegrationsChange,
    integrationsItems,
    activeAgentSection,
    onAgentSection,
    agentSections,
  } = props;

  return (
    <aside className="hidden">
      <div className="px-5 pt-6 pb-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 grid place-items-center text-white font-bold shadow-lg shadow-violet-500/20">
            CS
          </div>
          <div>
            <div className="text-white font-semibold text-[15px] leading-tight">Chief of Staff</div>
            <div className="text-[11px] text-white/40 tracking-wide uppercase">AI Command Center</div>
          </div>
        </div>
      </div>

      <div className="px-3 pt-4">
        <div className="grid grid-cols-6 gap-1 p-1 bg-white/5 rounded-lg">
          {false && tabs.slice(0, 6).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "text-[11px] font-medium py-2 rounded-md transition",
                view === tab.id ? "bg-white text-black" : "text-white/60 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-1 p-1 bg-white/5 rounded-lg mt-1">
          {tabs.slice(6).filter((tab) => tab.id === "dashboard").map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "text-[10px] font-medium py-2 rounded-md transition",
                view === tab.id ? "bg-white text-black" : "text-white/60 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {view === "blueprint" && (
        <SectionNav label="Master Plan · Prompt #1" sections={blueprintSections} active={activeBlueprintSection} onSelect={onBlueprintSection} accent="violet" />
      )}
      {view === "mvp" && (
        <SectionNav label="MVP Spec · Prompt #2" sections={mvpSections} active={activeMvpSection} onSelect={onMvpSection} accent="emerald" />
      )}
      {view === "architecture" && (
        <SectionNav label="Tech Blueprint · Prompt #3" sections={archSections} active={activeArchSection} onSelect={onArchSection} accent="sky" />
      )}
      {view === "prompts" && (
        <SectionNav label="AI Prompts · Prompt #4" sections={promptsSections} active={activePromptsSection} onSelect={onPromptsSection} accent="pink" />
      )}
      {view === "templates" && (
        <SectionNav label="Templates · Prompt #5" sections={templateItems} active={activeTemplateId} onSelect={onTemplateChange} accent="orange" />
      )}
      {view === "backend" && (
        <SectionNav label="Backend Build · Prompt #7" sections={backendSections} active={activeBackendSection} onSelect={onBackendSection} accent="green" />
      )}
      {view === "integrate" && (
        <SectionNav label="AI Integration · Prompt #8" sections={integrateSections} active={activeIntegrateSection} onSelect={onIntegrateSection} accent="yellow" />
      )}
      {view === "library" && (
        <SectionNav label="Library System · Prompt #9" sections={librarySections} active={activeLibrarySection} onSelect={onLibrarySection} accent="fuchsia" />
      )}
      {view === "billing" && (
        <SectionNav label="Stripe Billing · Prompt #10" sections={billingSections} active={activeBillingSection} onSelect={onBillingSection} accent="indigo" />
      )}
      {view === "integrations" && (
        <SectionNav label="Integrations · Prompt #11" sections={integrationsItems} active={activeIntegrationsId} onSelect={onIntegrationsChange} accent="teal" />
      )}
      {view === "agent" && (
        <SectionNav label="Agent System · Prompt #12" sections={agentSections} active={activeAgentSection} onSelect={onAgentSection} accent="fuchsia" />
      )}

      {view === "dashboard" && (
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="px-1 pb-2 text-[10px] uppercase tracking-widest text-white/30 font-semibold">
            Live App
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-3 mb-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-300 font-semibold mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Working app
            </div>
            <div className="text-white text-[12.5px] leading-relaxed">
              Full multi-page app with mock + live API modes, real Stripe (FAKE_STRIPE), and library CRUD.
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-white/5 p-3">
        <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-white/5 p-3">
          <div className="text-[11px] text-white/50 mb-1">Build progress</div>
          <div className="text-sm text-white font-semibold mb-2">Phase 1+ · 12/12 prompts ✓</div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-indigo-400 via-emerald-400 via-pink-400 via-yellow-400 via-fuchsia-400 via-teal-400 to-purple-400" />
          </div>
          <div className="text-[10px] text-white/40 mt-2">Agent system designed ✓</div>
        </div>
      </div>
    </aside>
  );
}

function SectionNav({
  label,
  sections,
  active,
  onSelect,
  accent,
}: {
  label: string;
  sections: SectionItem[];
  active: string;
  onSelect: (id: string) => void;
  accent: "violet" | "emerald" | "sky" | "pink" | "orange" | "green" | "yellow" | "fuchsia" | "indigo" | "teal";
}) {
  const accents = {
    violet:  { active: "from-indigo-500/20 to-violet-500/10",  num: "text-violet-300" },
    emerald: { active: "from-emerald-500/20 to-teal-500/10",   num: "text-emerald-300" },
    sky:     { active: "from-sky-500/20 to-cyan-500/10",       num: "text-sky-300" },
    pink:    { active: "from-pink-500/20 to-rose-500/10",      num: "text-pink-300" },
    orange:  { active: "from-orange-500/20 to-amber-500/10",   num: "text-orange-300" },
    green:   { active: "from-green-500/20 to-emerald-500/10",  num: "text-green-300" },
    yellow:  { active: "from-yellow-500/20 to-amber-500/10",   num: "text-yellow-300" },
    fuchsia: { active: "from-fuchsia-500/20 to-pink-500/10",   num: "text-fuchsia-300" },
    indigo:  { active: "from-indigo-500/20 to-blue-500/10",    num: "text-indigo-300" },
    teal:    { active: "from-teal-500/20 to-cyan-500/10",      num: "text-teal-300" },
  };
  const a = accents[accent];

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
      <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-white/30 font-semibold">
        {label}
      </div>
      {sections.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition",
              isActive ? `bg-gradient-to-r ${a.active} text-white` : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <span className={cn("text-[10px] font-mono w-5", isActive ? a.num : "text-white/30")}>
              {s.number}
            </span>
            <span className="text-base">{s.icon}</span>
            <span className="text-[13px] font-medium truncate">{s.title.replace(/^\d+\.\s*/, "")}</span>
          </button>
        );
      })}
    </nav>
  );
}
