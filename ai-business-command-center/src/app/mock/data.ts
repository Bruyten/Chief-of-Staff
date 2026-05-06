// Mock data for the frontend app — replaces backend until Phase 2.
// Structure mirrors the Prisma schema from the Architecture spec
// so swapping to real fetch calls is a 1-file change later.

export type MockUser = {
  id: string;
  email: string;
  name: string;
  plan: "free" | "starter" | "pro" | "agency";
  credits: number;
  creditsMax: number;
};

export type MockProject = {
  id: string;
  name: string;
  niche: string;
  brandVoice?: string;
  productCount: number;
  outputCount: number;
  createdAt: string;
  emoji: string;
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
  productId?: string;
  type: OutputType;
  title: string;
  content: string;
  createdAt: string;
};

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
  | "trust_building_post";

export const mockUser: MockUser = {
  id: "u_demo",
  email: "you@chiefofstaff.app",
  name: "Demo User",
  plan: "free",
  credits: 18,
  creditsMax: 25,
};

export const mockProjects: MockProject[] = [
  {
    id: "p_skincare",
    name: "Glow Skincare",
    niche: "Beauty / DTC",
    brandVoice: "Calm, no exclamations, peer-to-peer.",
    productCount: 4,
    outputCount: 23,
    createdAt: "2026-02-01T10:00:00Z",
    emoji: "🧴",
  },
  {
    id: "p_budget",
    name: "Sage & Save",
    niche: "Faith-based finance",
    brandVoice: "Warm, scripture-friendly, never preachy.",
    productCount: 2,
    outputCount: 41,
    createdAt: "2026-01-12T10:00:00Z",
    emoji: "💚",
  },
  {
    id: "p_affiliate",
    name: "Affiliate Bootcamp",
    niche: "Make money online",
    brandVoice: "Direct, anti-hype, numbers-driven.",
    productCount: 3,
    outputCount: 17,
    createdAt: "2026-02-18T10:00:00Z",
    emoji: "🚀",
  },
];

export const mockProducts: MockProduct[] = [
  {
    id: "pr_serum",
    projectId: "p_skincare",
    name: "Glow Serum Bundle",
    description: "A 3-step skincare routine for oily, breakout-prone skin.",
    audience: "Women 22-35 with adult acne",
    painPoint: "Cystic breakouts that don't respond to drugstore products",
    price: "$48",
    offerType: "digital_product",
    cta: "Tap the link in my bio to grab the bundle.",
  },
  {
    id: "pr_budget",
    projectId: "p_budget",
    name: "Sage & Save Membership",
    description: "Monthly faith-based budgeting membership for one-income families.",
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
    description: "14-day beginner affiliate course with no audience required.",
    audience: "9-5 employees with 30 mins a day",
    painPoint: "Bought 3 courses, never made a sale",
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
    projectName: "Glow Skincare",
    productId: "pr_serum",
    type: "tiktok_script",
    title: "Hook test — $24 vs $60 serum",
    content: `**Hook (0–2s):** I tried 11 skincare brands. Only one stopped my breakouts.

**Script:**
1. For 8 months I had cystic acne every period week.
2. Then I swapped my $60 serum for this $24 one.
3. Three drops at night. That's it.
4. Two weeks in, my skin actually looked like skin again.
5. The link is in my bio if you want what I used.

**CTA:** Tap the link in my bio to grab the bundle.

**Hashtags:** #skincaretok #cysticacne #honestreview #foundit #skincareroutine`,
    createdAt: "2026-03-04T14:22:00Z",
  },
  {
    id: "o_2",
    userId: "u_demo",
    projectId: "p_budget",
    projectName: "Sage & Save",
    type: "email_welcome_sequence",
    title: "Welcome sequence — 4-Tab Budget opt-in",
    content: `### Email 1 — Deliver
**Subject:** Your 4-Tab Budget is here

The template is here: [link].

Two things before you open it:
1. The "Floor Month" tab is the most important. Fill that one first.
2. You'll feel weird about how empty it looks for 5 minutes. That's the point.

I'll send a short story tomorrow about why I built this in the first place.

—`,
    createdAt: "2026-03-04T11:08:00Z",
  },
  {
    id: "o_3",
    userId: "u_demo",
    projectId: "p_affiliate",
    projectName: "Affiliate Bootcamp",
    type: "objection_handling_post",
    title: "'I don't have an audience' objection post",
    content: `**Hook:** "I don't have an audience yet — will this work?"

Real concern. The internet has trained you to think you need 10,000 followers before you can sell anything.

You don't. Day 1 is built for zero followers — the first task is choosing a niche where you can be useful in DMs and small comment sections, not viral feeds. Students who made commissions fastest had under 200 followers when they started.

**CTA:** If that helps, enrollment is open — link in bio.`,
    createdAt: "2026-03-03T20:45:00Z",
  },
  {
    id: "o_4",
    userId: "u_demo",
    projectId: "p_skincare",
    projectName: "Glow Skincare",
    type: "instagram_caption",
    title: "Caption — behind-the-scenes routine",
    content: `**Caption:**
You're not bad at skincare. You're using products built for someone else's skin.

Drugstore acne products are made for teenagers. Adult cystic acne needs a different ingredient deck and a slower routine.

Three drops at night. One product. Two weeks.

**CTA:** Link in bio for the bundle.

**Hashtags:** #skincaretok #cysticacne #adultacne #routinerefresh #honestreview #skincareroutine #glowserum #skincareover30`,
    createdAt: "2026-03-03T09:12:00Z",
  },
  {
    id: "o_5",
    userId: "u_demo",
    projectId: "p_budget",
    projectName: "Sage & Save",
    type: "trust_building_post",
    title: "Trust post — Walmart parking lot story",
    content: `**Hook:** December 2022. Walmart parking lot. $284 receipt. Crying.

We had three budgeting apps. I tracked every penny. I couldn't explain how the grocery bill kept ending in 84.

The change wasn't another app. It was a single question: "what does our worst month look like?" — and budgeting backwards from that.

**CTA:** If you've been there too, the free PDF is in my bio.`,
    createdAt: "2026-03-02T18:30:00Z",
  },
  {
    id: "o_6",
    userId: "u_demo",
    projectId: "p_affiliate",
    projectName: "Affiliate Bootcamp",
    type: "hook_generator",
    title: "10 hooks — '$7 PDF outsold $97 course'",
    content: `### Curiosity gap
1. My $7 PDF outsold my $97 course. Not a typo.

### Specific number
5. $7 product, $4,200 in 9 weeks. Here's how.
6. 612 sales of a $7 PDF vs 11 of a $97 course.

**Recommended pick:** #5 — Specific numbers + clean curiosity gap.`,
    createdAt: "2026-03-02T15:00:00Z",
  },
  {
    id: "o_7",
    userId: "u_demo",
    projectId: "p_budget",
    projectName: "Sage & Save",
    type: "content_plan_30day",
    title: "30-day content plan — March launch",
    content: `## Content Pillars
1. **Real Numbers** — actual dollar amounts, not vague advice.
2. **Faith Over Fear** — short reflections on money + trust.
3. **One-Income Reality** — daily life on a single paycheck.
4. **System Snippets** — micro-tutorials from the 4-Tab Budget.

(See full plan in the editor.)`,
    createdAt: "2026-03-01T09:00:00Z",
  },
];

// Friendly display labels for output types
export const outputTypeLabels: Record<OutputType, { label: string; icon: string }> = {
  tiktok_script: { label: "TikTok Script", icon: "🎵" },
  facebook_reel_script: { label: "Facebook Reel", icon: "📘" },
  instagram_caption: { label: "Instagram Caption", icon: "📸" },
  youtube_shorts_script: { label: "YouTube Shorts", icon: "▶️" },
  product_description: { label: "Product Description", icon: "🛍️" },
  sales_page_outline: { label: "Sales Page Outline", icon: "🌐" },
  email_welcome_sequence: { label: "Email Sequence", icon: "📧" },
  dm_auto_reply: { label: "DM Auto-Reply", icon: "💬" },
  content_plan_30day: { label: "30-Day Content Plan", icon: "📅" },
  offer_improvement_analysis: { label: "Offer Analysis", icon: "🔍" },
  lead_magnet_ideas: { label: "Lead Magnet Ideas", icon: "🧲" },
  launch_plan: { label: "Launch Plan", icon: "🚀" },
  hook_generator: { label: "Hook Generator", icon: "🪝" },
  objection_handling_post: { label: "Objection Post", icon: "🛡️" },
  trust_building_post: { label: "Trust-Building Post", icon: "🤝" },
};
