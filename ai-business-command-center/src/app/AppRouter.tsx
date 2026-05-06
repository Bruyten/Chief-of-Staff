// Tiny client-side router for the App tab. Renders the right page based on
// the current `page` value in AppContext. No external router needed for MVP.

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

function Pages() {
  const { isAuthed, page } = useApp();

  if (!isAuthed) return <LoginPage />;

  switch (page) {
    case "dashboard":      return <DashboardPage />;
    case "new-task":       return <NewTaskPage />;
    case "projects":       return <ProjectsPage />;
    case "project-detail": return <ProjectDetailPage />;
    case "saved-outputs":  return <SavedOutputsPage />;
    case "templates":      return <TemplatesGalleryPage />;
    case "settings":       return <SettingsPage />;
    case "pricing":        return <PricingPage />;
    case "login":          return <LoginPage />;
    default:               return <DashboardPage />;
  }
}

export function AppRouter() {
  return (
    <AppProvider>
      <Pages />
    </AppProvider>
  );
}
