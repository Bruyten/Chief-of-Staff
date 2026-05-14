import { AppProvider, useApp } from "./AppContext";

import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NewTaskPage } from "./pages/NewTaskPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { SavedOutputsPage } from "./pages/SavedOutputsPage";
import { TemplatesGalleryPage } from "./pages/TemplatesGalleryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PricingPage } from "./pages/PricingPage";
import { BrandVoicesPage } from "./pages/BrandVoicePage";
import { ChiefOfStaffChatPage } from "./pages/ChiefOfStaffChatPage";
import { WorkflowsPage } from "./pages/WorkflowsPage";
import { WorkflowRunPage } from "./pages/WorkflowRunPage";
import { AutomationsPage } from "./pages/AutomationsPage";
import { VideoStudioPage } from "./pages/VideoStudioPage";

function Pages() {
  const { isAuthed, page } = useApp();

  if (!isAuthed) return <LoginPage />;

  switch (page) {
    case "dashboard":
      return <DashboardPage />;

    case "new-task":
      return <NewTaskPage />;

    case "projects":
      return <ProjectsPage />;

    case "project-detail":
      return <ProjectDetailPage />;

    case "saved-outputs":
      return <SavedOutputsPage />;

    case "templates":
      return <TemplatesGalleryPage />;

    case "settings":
      return <SettingsPage />;

    case "pricing":
      return <PricingPage />;

    case "brand-voices":
      return <BrandVoicesPage />;

    case "chief-chat":
      return <ChiefOfStaffChatPage />;

    case "workflows":
      return <WorkflowsPage />;

    case "workflow-run":
      return <WorkflowRunPage />;

    case "automations":
      return <AutomationsPage />;

    case "video-studio":
      return <VideoStudioPage />;

    case "login":
      return <LoginPage />;

    default:
      return <DashboardPage />;
  }
}

export function AppRouter() {
  return (
    <AppProvider>
      <Pages />
    </AppProvider>
  );
}
