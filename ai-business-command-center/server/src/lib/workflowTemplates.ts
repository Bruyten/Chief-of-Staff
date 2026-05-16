export type WorkflowTemplateStep = {
  key: string;
  label: string;
  skill: string;
  outputTitle: string;
};

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  requiredInputs: string[];
  steps: WorkflowTemplateStep[];
};

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "daily_trend_research",
    name: "Daily Trend & Opportunity Research",
    description:
      "Research daily Google trend/search signals and Reddit discussion signals, then turn them into revenue-relevant content and campaign recommendations.",
    requiredInputs: [
      "productName",
      "targetAudience",
      "researchKeywords",
    ],
    steps: [
      {
        key: "trend_digest",
        label: "Trend signal digest",
        skill: "daily_trend_research_digest",
        outputTitle: "Daily Trend Signal Digest",
      },
      {
        key: "monetization_angles",
        label: "Revenue and offer opportunities",
        skill: "daily_trend_research_monetization_angles",
        outputTitle: "Daily Trend Monetization Angles",
      },
      {
        key: "daily_action_plan",
        label: "Today’s content and campaign actions",
        skill: "daily_trend_research_action_plan",
        outputTitle: "Daily Trend Action Plan",
      },
    ],
  },

  {
    id: "campaign_launch",
    name: "Campaign Launch Workflow",
    description:
      "Shape the offer, create hooks, draft short-form content, assemble email messaging, and define a rollout sequence.",
    requiredInputs: ["productName", "targetAudience", "cta"],
    steps: [
      {
        key: "campaign_angle",
        label: "Offer and campaign angle",
        skill: "offer_improvement_analysis",
        outputTitle: "Campaign Angle",
      },
      {
        key: "hook_ideas",
        label: "Hook ideas",
        skill: "hook_generator",
        outputTitle: "Campaign Hooks",
      },
      {
        key: "short_form_scripts",
        label: "Short-form content draft",
        skill: "tiktok_script",
        outputTitle: "Short-form Script Ideas",
      },
      {
        key: "email_message",
        label: "Email messaging asset",
        skill: "email_welcome_sequence",
        outputTitle: "Email Messaging Asset",
      },
      {
        key: "launch_plan",
        label: "Publishing rollout sequence",
        skill: "workflow_publishing_sequence",
        outputTitle: "Launch Publishing Plan",
      },
    ],
  },

  {
    id: "weekly_content",
    name: "Weekly Content Workflow",
    description:
      "Plan the weekly focus, build supporting content ideas, draft short-form assets, and sequence the publishing order.",
    requiredInputs: ["productName", "targetAudience", "cta"],
    steps: [
      {
        key: "weekly_focus",
        label: "Weekly marketing focus",
        skill: "workflow_weekly_marketing_focus",
        outputTitle: "Weekly Marketing Focus",
      },
      {
        key: "content_plan",
        label: "Content planning ideas",
        skill: "content_plan_30day",
        outputTitle: "Weekly Content Planning Ideas",
      },
      {
        key: "short_form_ideas",
        label: "Short-form script asset",
        skill: "tiktok_script",
        outputTitle: "Short-form Content Draft",
      },
      {
        key: "caption_asset",
        label: "Social caption asset",
        skill: "instagram_caption",
        outputTitle: "Social Caption Asset",
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
    description:
      "Create a lead magnet concept, shape the funnel message, draft the welcome sequence, and produce promotional hooks.",
    requiredInputs: ["productName", "targetAudience"],
    steps: [
      {
        key: "lead_magnet_idea",
        label: "Lead magnet concept",
        skill: "lead_magnet_ideas",
        outputTitle: "Lead Magnet Concept",
      },
      {
        key: "funnel_message",
        label: "Landing or sales page angle",
        skill: "sales_page_outline",
        outputTitle: "Funnel Message Outline",
      },
      {
        key: "welcome_sequence",
        label: "Welcome email sequence",
        skill: "email_welcome_sequence",
        outputTitle: "Welcome Email Sequence",
      },
      {
        key: "promo_hooks",
        label: "Promotional hooks",
        skill: "hook_generator",
        outputTitle: "Promo Hooks",
      },
    ],
  },
];

export function findWorkflowTemplate(templateId: string) {
  return (
    WORKFLOW_TEMPLATES.find((template) => template.id === templateId) ??
    null
  );
}
