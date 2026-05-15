// Mock data for the frontend app.
// Structure mirrors the backend API closely enough that mock mode
// can stay useful while live mode talks to Render.

export type OutputType =
  | "tiktok_script"
  | "facebook_reel_script"
  | "instagram_caption"
  | "youtube_shorts_script"
  | "product_description"
  | "sales_page_outline"
  | "email_welcome_sequence"
  | "dm_auto_reply"
  | "content_plan_30day"
  | "offer_improvement_analysis"
  | "lead_magnet_ideas"
  | "launch_plan"
  | "hook_generator"
  | "objection_handling_post"
  | "trust_building_post"
  | "workflow_weekly_marketing_focus"
  | "workflow_publishing_sequence"
  | "automation_monthly_campaign_ideas"
  | "automation_weekly_task_recommendation";

export type MockUser = {
  id: string;
  email: string;
  name: string;
  plan: "free" | "starter" | "pro" | "agency";
  credits: number;
  creditsMax: number;
  videoCredits: number;
  videoCreditsMax: number;
};

export type MockBrandVoiceSummary = {
  id: string;
  brandName: string;
};

export type MockBrandVoiceProfile = {
  id: string;
  userId: string;
  brandName: string;
  businessType: string | null;
  targetAudience: string | null;
  primaryOffer: string | null;
  toneOfVoice: string | null;
  valueProposition: string | null;
  preferredCtas: string | null;
  bannedPhrases: string | null;
  differentiators: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MockProject = {
  id: string;
  name: string;
  niche: string;
  brandVoice?: string;
  emoji: string;
  productCount: number;
  outputCount: number;
  workflowRunCount: number;
  chatCount: number;
  automationCount: number;
  campaignGoal?: string;
  targetAudience?: string;
  offer?: string;
  campaignStatus: "planning" | "active" | "paused" | "completed";
  launchDate: string | null;
  brandVoiceProfileId: string | null;
  brandVoiceProfile: MockBrandVoiceSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type MockProduct = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  audience: string;
  painPoint: string;
  price: string;
  offerType: string;
  cta: string;
};

export type MockOutput = {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  projectEmoji: string | null;
  productId?: string;
  type: OutputType;
  title: string;
  content: string;
  createdAt: string;
};

export const mockUser: MockUser = {
  id: "u_demo",
  email: "you@chiefofstaff.app",
  name: "Demo User",
  plan: "free",
  credits: 18,
  creditsMax: 25,
  videoCredits: 0,
  videoCreditsMax: 0,
};

export const mockBrandVoiceProfiles: MockBrandVoiceProfile[] = [
  {
    id: "bv_glow",
    userId: "u_demo",
    brandName: "Glow Skincare",
    businessType: "Beauty / DTC",
    targetAudience:
      "Women 22–35 with adult acne, inconsistent routines, and product fatigue.",
    primaryOffer:
      "Glow Serum Bundle with a simple three-step nighttime routine.",
    toneOfVoice:
      "Calm, confident, reassuring, peer-to-peer, and never overhyped.",
    valueProposition:
      "A simplified routine for people who are tired of overcomplicated skincare.",
    preferredCtas:
      "Explore the bundle, see the routine, tap the link in bio.",
    bannedPhrases:
      "Miracle cure, guaranteed results, flawless overnight.",
    differentiators:
      "Routine simplicity, clearer positioning, lower decision fatigue.",
    notes:
      "Keep copy emotionally reassuring and focused on consistency over perfection.",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-05-12T10:00:00Z",
  },
  {
    id: "bv_sage",
    userId: "u_demo",
    brandName: "Sage & Save",
    businessType: "Faith-based personal finance",
    targetAudience:
      "Christian moms managing tight one-income households.",
    primaryOffer:
      "Monthly budgeting membership with templates, coaching prompts, and routines.",
    toneOfVoice:
      "Warm, reassuring, practical, scripture-friendly without sounding preachy.",
    valueProposition:
      "A calmer way to build household budgeting habits without shame or overwhelm.",
    preferredCtas:
      "Download the free guide, try the membership, start your next budget reset.",
    bannedPhrases:
      "Get rich quick, passive income overnight, effortless wealth.",
    differentiators:
      "Faith-aware messaging, family-budget specificity, practical next steps.",
    notes:
      "Avoid guilt-based selling. Lead with relief, clarity, and stewardship.",
    createdAt: "2026-01-12T10:00:00Z",
    updatedAt: "2026-05-10T10:00:00Z",
  },
];

export const mockProjects: MockProject[] = [
  {
    id: "p_skincare",
    name: "Glow Skincare Spring Offer",
    niche: "Beauty / DTC",
    brandVoice: "Calm, confident, peer-to-peer. Avoid hype.",
    emoji: "✨",
    productCount: 4,
    outputCount: 23,
    workflowRunCount: 2,
    chatCount: 4,
    automationCount: 1,
    campaignGoal:
      "Increase serum bundle interest before the spring promotion.",
    targetAudience:
      "Women 22–35 with adult acne or inconsistent routines.",
    offer:
      "Glow Serum Bundle with a simple three-step nighttime routine.",
    campaignStatus: "active",
    launchDate: "2026-05-20T00:00:00.000Z",
    brandVoiceProfileId: "bv_glow",
    brandVoiceProfile: {
      id: "bv_glow",
      brandName: "Glow Skincare",
    },
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-05-12T10:00:00Z",
  },
  {
    id: "p_budget",
    name: "Sage & Save Membership Push",
    niche: "Faith-based finance",
    brandVoice:
      "Warm, reassuring, scripture-friendly without sounding preachy.",
    emoji: "🌿",
    productCount: 2,
    outputCount: 41,
    workflowRunCount: 1,
    chatCount: 3,
    automationCount: 1,
    campaignGoal:
      "Drive free PDF opt-ins and convert qualified readers to the membership.",
    targetAudience:
      "Christian moms managing tight one-income households.",
    offer:
      "Monthly budgeting membership with templates, coaching prompts, and routines.",
    campaignStatus: "active",
    launchDate: "2026-05-27T00:00:00.000Z",
    brandVoiceProfileId: "bv_sage",
    brandVoiceProfile: {
      id: "bv_sage",
      brandName: "Sage & Save",
    },
    createdAt: "2026-01-12T10:00:00Z",
    updatedAt: "2026-05-10T10:00:00Z",
  },
  {
    id: "p_affiliate",
    name: "Affiliate Bootcamp Q2 Launch",
    niche: "Creator education",
    brandVoice: "Direct, anti-hype, numbers-driven.",
    emoji: "🚀",
    productCount: 3,
    outputCount: 17,
    workflowRunCount: 1,
    chatCount: 1,
    automationCount: 0,
    campaignGoal:
      "Prepare launch assets and improve objection handling.",
    targetAudience:
      "9–5 employees who want a realistic beginner affiliate path.",
    offer:
      "14-day beginner affiliate bootcamp with practical daily actions.",
    campaignStatus: "planning",
    launchDate: "2026-06-04T00:00:00.000Z",
    brandVoiceProfileId: null,
    brandVoiceProfile: null,
    createdAt: "2026-02-18T10:00:00Z",
    updatedAt: "2026-04-28T10:00:00Z",
  },
];

export const mockProducts: MockProduct[] = [
  {
    id: "pr_serum",
    projectId: "p_skincare",
    name: "Glow Serum Bundle",
    description:
      "A 3-step skincare routine for oily, breakout-prone skin.",
    audience: "Women 22-35 with adult acne",
    painPoint:
      "Cystic breakouts that do not respond to drugstore products",
    price: "$48",
    offerType: "digital_product",
    cta: "Tap the link in my bio to explore the bundle.",
  },
  {
    id: "pr_budget",
    projectId: "p_budget",
    name: "Sage & Save Membership",
    description:
      "Monthly faith-based budgeting membership for one-income families.",
    audience: "Christian moms 30-50 on one income",
    painPoint: "Money anxiety despite tracking everything",
    price: "$19/mo",
    offerType: "subscription",
    cta: "Try the membership free for 14 days.",
  },
  {
    id: "pr_bootcamp",
    projectId: "p_affiliate",
    name: "Beginner Affiliate Bootcamp",
    description:
      "14-day beginner affiliate course with no audience required.",
    audience: "9-5 employees with 30 mins a day",
    painPoint: "Bought multiple courses but never made a sale",
    price: "$67",
    offerType: "course",
    cta: "Enroll now for $67 — link in bio.",
  },
];

export const mockOutputs: MockOutput[] = [
  {
    id: "o_1",
    userId: "u_demo",
    projectId: "p_skincare",
    projectName: "Glow Skincare Spring Offer",
    projectEmoji: "✨",
    productId: "pr_serum",
    type: "tiktok_script",
    title: "Hook test — $24 vs $60 serum",
    content:
      "**Hook (0–2s):** I tried 11 skincare brands. Only one simplified my routine.\n\n**Script:**\n1. I kept bouncing between expensive products.\n2. Then I tried a simpler serum routine.\n3. Three drops at night. That's it.\n4. It made the routine feel easier to follow.\n5. The link is in my bio if you want to see the bundle.\n\n**CTA:** Tap the link in my bio to explore the bundle.",
    createdAt: "2026-05-10T14:22:00Z",
  },
  {
    id: "o_2",
    userId: "u_demo",
    projectId: "p_budget",
    projectName: "Sage & Save Membership Push",
    projectEmoji: "🌿",
    type: "email_welcome_sequence",
    title: "Welcome sequence — 4-Tab Budget opt-in",
    content:
      "### Email 1 — Deliver\n**Subject:** Your 4-Tab Budget is here\n\nThe template is here: [link]. Start with the floor-month tab first. I'll send a quick follow-up tomorrow on why that tab matters.",
    createdAt: "2026-05-08T11:08:00Z",
  },
  {
    id: "o_3",
    userId: "u_demo",
    projectId: "p_affiliate",
    projectName: "Affiliate Bootcamp Q2 Launch",
    projectEmoji: "🚀",
    type: "objection_handling_post",
    title: "'I don't have an audience' objection post",
    content:
      '**Hook:** "I don\'t have an audience yet — will this work?"\n\nThat concern makes sense. The first step is not chasing virality. It is choosing a niche where you can be useful in DMs, comment sections, and small conversations.',
    createdAt: "2026-05-07T20:45:00Z",
  },
];

export const outputTypeLabels: Record<
  OutputType,
  { label: string; icon: string }
> = {
  tiktok_script: {
    label: "TikTok Script",
    icon: "🎬",
  },
  facebook_reel_script: {
    label: "Facebook Reel",
    icon: "📹",
  },
  instagram_caption: {
    label: "Instagram Caption",
    icon: "📸",
  },
  youtube_shorts_script: {
    label: "YouTube Shorts",
    icon: "▶️",
  },
  product_description: {
    label: "Product Description",
    icon: "🛍️",
  },
  sales_page_outline: {
    label: "Sales Page Outline",
    icon: "🧱",
  },
  email_welcome_sequence: {
    label: "Email Sequence",
    icon: "✉️",
  },
  dm_auto_reply: {
    label: "DM Auto-Reply",
    icon: "💬",
  },
  content_plan_30day: {
    label: "30-Day Content Plan",
    icon: "🗓️",
  },
  offer_improvement_analysis: {
    label: "Offer Analysis",
    icon: "📈",
  },
  lead_magnet_ideas: {
    label: "Lead Magnet Ideas",
    icon: "🧲",
  },
  launch_plan: {
    label: "Launch Plan",
    icon: "🚀",
  },
  hook_generator: {
    label: "Hook Generator",
    icon: "⚡",
  },
  objection_handling_post: {
    label: "Objection Post",
    icon: "🛡️",
  },
  trust_building_post: {
    label: "Trust-Building Post",
    icon: "🤝",
  },
  workflow_weekly_marketing_focus: {
    label: "Weekly Focus",
    icon: "🎯",
  },
  workflow_publishing_sequence: {
    label: "Publishing Sequence",
    icon: "🗂️",
  },
  automation_monthly_campaign_ideas: {
    label: "Monthly Campaign Ideas",
    icon: "💡",
  },
  automation_weekly_task_recommendation: {
    label: "Weekly Task Recommendations",
    icon: "✅",
  },
};
