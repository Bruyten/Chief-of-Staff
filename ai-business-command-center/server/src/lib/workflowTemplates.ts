export type WorkflowTemplateStep = {
      {
        key: "promo_email",
        label: "Promotional email asset",
        skill: "email_promo",
        outputTitle: "Promotional Email",
      },
      {
        key: "launch_plan",
        label: "Launch plan / schedule",
        skill: "workflow_publishing_sequence",
        outputTitle: "Launch Publishing Plan",
      },
    ],
  },
  {
    id: "weekly_content",
    name: "Weekly Content Workflow",
    description: "Plan the weekly focus, social ideas, short-form content, email touchpoint, and publishing order.",
    requiredInputs: ["productName", "targetAudience", "cta"],
    steps: [
      {
        key: "weekly_focus",
        label: "Weekly marketing focus",
        skill: "workflow_weekly_marketing_focus",
        outputTitle: "Weekly Marketing Focus",
      },
      {
        key: "social_ideas",
        label: "Social post ideas",
        skill: "social_post_ideas",
        outputTitle: "Social Post Ideas",
      },
      {
        key: "short_form_ideas",
        label: "Short-form content ideas",
        skill: "tiktok_script",
        outputTitle: "Short-form Content Ideas",
      },
      {
        key: "email_touchpoint",
        label: "Email or promo touchpoint",
        skill: "email_promo",
        outputTitle: "Weekly Email Touchpoint",
      },
      {
        key: "publishing_sequence",
        label: "Recommended publishing sequence",
        skill: "workflow_publishing_sequence",
        outputTitle: "Publishing Sequence",
      },
    ],
  },
  {
    id: "lead_magnet_funnel",
    name: "Lead Magnet Funnel Workflow",
    description: "Create a lead magnet concept, landing page angle, email welcome flow, and promo hooks.",
    requiredInputs: ["productName", "targetAudience"],
    steps: [
      {
        key: "lead_magnet_idea",
        label: "Lead magnet idea",
        skill: "lead_magnet_idea",
        outputTitle: "Lead Magnet Idea",
      },
      {
        key: "landing_page_angle",
        label: "Landing page / offer angle",
        skill: "landing_page_copy",
        outputTitle: "Landing Page Angle",
      },
      {
        key: "welcome_sequence",
        label: "Email welcome sequence",
        skill: "email_sequence",
        outputTitle: "Welcome Email Sequence",
      },
      {
        key: "promo_hooks",
        label: "Promo posts and hooks",
        skill: "hook_generator",
        outputTitle: "Promo Hooks",
      },
    ],
  },
];

export function findWorkflowTemplate(templateId: string) {
  return WORKFLOW_TEMPLATES.find((template) => template.id === templateId) ?? null;
}
