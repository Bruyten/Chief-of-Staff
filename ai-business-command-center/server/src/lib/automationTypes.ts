export type AutomationType =
  | "weekly_content_plan"
  | "monthly_campaign_ideas"
  | "weekly_task_recommendation";

export const AUTOMATION_TYPE_META: Record<
  AutomationType,
  {
    label: string;
    cadence: "weekly" | "monthly";
    creditsRequired: number;
    description: string;
  }
> = {
  weekly_content_plan: {
    label: "Weekly Content Plan Automation",
    cadence: "weekly",
    creditsRequired: 5,
    description: "Runs the Weekly Content Workflow on a recurring weekly schedule.",
  },
  monthly_campaign_ideas: {
    label: "Monthly Campaign Ideas Automation",
    cadence: "monthly",
    creditsRequired: 1,
    description: "Generates lightweight monthly campaign/promo ideas.",
  },
  weekly_task_recommendation: {
    label: "Weekly Marketing Task Recommendation Automation",
    cadence: "weekly",
    creditsRequired: 1,
    description: "Generates recommended next marketing tasks for a campaign workspace.",
  },
};
