import { useState } from "react";
import Sidebar, { type View } from "./components/Sidebar";
import BlueprintView from "./components/BlueprintView";
import MvpView from "./components/MvpView";
import ArchitectureView from "./components/ArchitectureView";
import PromptsView from "./components/PromptsView";
import TemplatesView from "./components/TemplatesView";
import BackendView from "./components/BackendView";
import IntegrateView from "./components/IntegrateView";
import LibraryView from "./components/LibraryView";
import BillingView from "./components/BillingView";
import IntegrationsView from "./components/IntegrationsView";
import AgentView from "./components/AgentView";
import { AppRouter } from "./app/AppRouter";
import { blueprint } from "./data/blueprint";
import { mvpSpec } from "./data/mvpSpec";
import { architecture } from "./data/architecture";
import { promptArchitecture } from "./data/prompts";
import { templates } from "./data/templates";
import { backendSpec } from "./data/backend";
import { integrateSpec } from "./data/integrate";
import { librarySpec } from "./data/library";
import { billingSpec } from "./data/billing";
import { INTEGRATIONS, RANKED, type IntegrationId } from "./data/integrations";
import { agentSpec } from "./data/agent";

export default function App() {
  const [view, setView] = useState<View>("agent");
  const [activeBlueprintSection, setActiveBlueprintSection] = useState<string>("mvp");
  const [activeMvpSection, setActiveMvpSection] = useState<string>("smallest");
  const [activeArchSection, setActiveArchSection] = useState<string>("stack");
  const [activePromptsSection, setActivePromptsSection] = useState<string>("system");
  const [activeTemplateId, setActiveTemplateId] = useState<string>(templates[0].id);
  const [activeBackendSection, setActiveBackendSection] = useState<string>("approach");
  const [activeIntegrateSection, setActiveIntegrateSection] = useState<string>("overview");
  const [activeLibrarySection, setActiveLibrarySection] = useState<string>("overview");
  const [activeBillingSection, setActiveBillingSection] = useState<string>("overview");
  const [activeIntegrationsId, setActiveIntegrationsId] = useState<IntegrationId | "overview">(RANKED[0].id);
  const [activeAgentSection, setActiveAgentSection] = useState<string>("vision");

  return (
    <div className="min-h-screen bg-[#06070a] text-white antialiased flex">
      <Sidebar
        view={view}
        onChange={setView}
        activeBlueprintSection={activeBlueprintSection}
        onBlueprintSection={setActiveBlueprintSection}
        blueprintSections={blueprint.map((s) => ({ id: s.id, number: s.number, title: s.title, icon: s.icon }))}
        activeMvpSection={activeMvpSection}
        onMvpSection={setActiveMvpSection}
        mvpSections={mvpSpec.map((s) => ({ id: s.id, number: s.number, title: s.title, icon: s.icon }))}
        activeArchSection={activeArchSection}
        onArchSection={setActiveArchSection}
        archSections={architecture.map((s) => ({ id: s.id, number: s.number, title: s.title, icon: s.icon }))}
        activePromptsSection={activePromptsSection}
        onPromptsSection={setActivePromptsSection}
        promptsSections={promptArchitecture.map((s) => ({ id: s.id, number: s.number, title: s.title, icon: s.icon }))}
        activeTemplateId={activeTemplateId}
        onTemplateChange={setActiveTemplateId}
        templateItems={templates.map((t) => ({ id: t.id, number: t.number, title: t.name, icon: t.icon }))}
        activeBackendSection={activeBackendSection}
        onBackendSection={setActiveBackendSection}
        backendSections={backendSpec.map((s) => ({ id: s.id, number: s.number, title: s.title, icon: s.icon }))}
        activeIntegrateSection={activeIntegrateSection}
        onIntegrateSection={setActiveIntegrateSection}
        integrateSections={integrateSpec.map((s) => ({ id: s.id, number: s.number, title: s.title, icon: s.icon }))}
        activeLibrarySection={activeLibrarySection}
        onLibrarySection={setActiveLibrarySection}
        librarySections={librarySpec.map((s) => ({ id: s.id, number: s.number, title: s.title, icon: s.icon }))}
        activeBillingSection={activeBillingSection}
        onBillingSection={setActiveBillingSection}
        billingSections={billingSpec.map((s) => ({ id: s.id, number: s.number, title: s.title, icon: s.icon }))}
        activeIntegrationsId={activeIntegrationsId}
        onIntegrationsChange={(id) => setActiveIntegrationsId(id as IntegrationId | "overview")}
        integrationsItems={INTEGRATIONS.map((i, idx) => ({
          id: i.id,
          number: String(idx + 1).padStart(2, "0"),
          title: i.name,
          icon: i.icon,
        }))}
        activeAgentSection={activeAgentSection}
        onAgentSection={setActiveAgentSection}
        agentSections={agentSpec.map((s) => ({ id: s.id, number: s.number, title: s.title, icon: s.icon }))}
      />
      {view === "blueprint" && <BlueprintView activeSection={activeBlueprintSection} onVisibleChange={setActiveBlueprintSection} />}
      {view === "mvp" && <MvpView activeSection={activeMvpSection} onVisibleChange={setActiveMvpSection} />}
      {view === "architecture" && <ArchitectureView activeSection={activeArchSection} onVisibleChange={setActiveArchSection} />}
      {view === "prompts" && <PromptsView activeSection={activePromptsSection} onVisibleChange={setActivePromptsSection} />}
      {view === "templates" && <TemplatesView activeTemplateId={activeTemplateId} onTemplateChange={setActiveTemplateId} />}
      {view === "backend" && <BackendView activeSection={activeBackendSection} onVisibleChange={setActiveBackendSection} />}
      {view === "integrate" && <IntegrateView activeSection={activeIntegrateSection} onVisibleChange={setActiveIntegrateSection} />}
      {view === "library" && <LibraryView activeSection={activeLibrarySection} onVisibleChange={setActiveLibrarySection} />}
      {view === "billing" && <BillingView activeSection={activeBillingSection} onVisibleChange={setActiveBillingSection} />}
      {view === "integrations" && <IntegrationsView activeId={activeIntegrationsId} onChange={(id) => setActiveIntegrationsId(id)} />}
      {view === "agent" && <AgentView activeSection={activeAgentSection} onVisibleChange={setActiveAgentSection} />}
      {view === "dashboard" && <AppRouter />}
    </div>
  );
}
