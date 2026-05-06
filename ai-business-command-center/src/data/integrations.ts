// Integrations Roadmap — Prompt #11
// 11 integrations ranked by (value − effort), with MVP + advanced versions
// for each. Lays the path from "AI content generator" to "AI business
// command center."

export type IntegrationId =
  | "stripe" | "gmail" | "gdrive" | "gcal"
  | "instagram" | "facebook" | "tiktok"
  | "canva" | "zapier" | "make" | "n8n";

export type Integration = {
  id: IntegrationId;
  name: string;
  category: "Payments" | "Productivity" | "Social" | "Design" | "Automation";
  icon: string;
  // Scoring (1-5)
  valueScore: number;       // 1 = nice to have, 5 = transforms the product
  effortScore: number;      // 1 = days, 5 = months
  trustScore: number;       // 1 = brittle / TOS risk, 5 = stable, official
  // Plain-text docs
  oneLiner: string;
  value: string;
  difficulty: string;
  apiAccess: string;
  oauth: string;
  risks: string;
  mvpVersion: string;
  advancedVersion: string;
  // Tagging for the roadmap
  phase: 2 | 3 | 4 | 5;
  recommendedOrder: number; // 1 = build first
};

export const INTEGRATIONS: Integration[] = [
  // -------- 1. Stripe --------
  {
    id: "stripe",
    name: "Stripe",
    category: "Payments",
    icon: "💳",
    valueScore: 5,
    effortScore: 2,
    trustScore: 5,
    oneLiner: "Take payments. Without it, you have a hobby, not a business.",
    value:
      "The single integration that turns the app into a real SaaS. Without it you can't validate willingness to pay or build any moat. Already shipped in Prompt #10 — listed here for context and future expansions (one-off purchases, usage-based billing, affiliate payouts).",
    difficulty:
      "Genuinely easy. Best dev docs in the industry, free test mode, official Node SDK. The hardest part is webhook signature verification and the 'mount raw body before express.json()' gotcha — both already solved in this repo.",
    apiAccess: "Free Stripe account. Activate live payments by entering business details (~5 min).",
    oauth:
      "Not OAuth — uses a single secret API key per environment. Customer Portal handles end-user account management, no portal UI to build.",
    risks:
      "Webhook signature must be verified or attackers can fake subscription upgrades. Refund logic, proration, and tax handling are easy to get subtly wrong — Stripe Tax + Stripe Billing solve this if you grow. PCI: never store card numbers; Checkout/Elements handle it.",
    mvpVersion:
      "✅ Already shipped: 4 plans (Free / Starter / Pro / Agency), Checkout, customer portal, webhook for subscription lifecycle, plan-aware credits.",
    advancedVersion:
      "Usage-based billing (per AI generation), affiliate payouts via Stripe Connect, annual plans with proration, Stripe Tax for international, dunning emails, lifetime deals via one-off Checkout.",
    phase: 2,
    recommendedOrder: 1,
  },

  // -------- 2. Zapier --------
  {
    id: "zapier",
    name: "Zapier",
    category: "Automation",
    icon: "⚡",
    valueScore: 5,
    effortScore: 2,
    trustScore: 5,
    oneLiner: "Plug into 6,000+ apps with zero per-integration code.",
    value:
      "Fastest way to connect to every app in the world. One Zapier integration replaces hand-building dozens. Lets users wire 'When I generate a TikTok script, append it to a Google Doc + post to Slack' without you touching their accounts. Massive distribution — Zapier's directory drives sign-ups.",
    difficulty:
      "Easy if your API is already clean (yours is). You build a 'Zapier app' (one set of triggers + actions on the Zapier developer platform), then submit for public review. ~3-7 days of work, then ~2-3 weeks of Zapier review.",
    apiAccess: "Zapier Developer Platform account (free). You expose triggers + actions backed by your existing /api routes.",
    oauth:
      "You implement OAuth 2.0 server-side so Zapier can authorize on behalf of users. ~1 day of work using express-oauth-server or by hand. The user clicks 'Connect Chief of Staff' inside Zapier and gets your standard auth flow.",
    risks:
      "Free tier of Zapier limits you to 100 tasks/month — power users will hit it fast and complain at YOU not Zapier. Public review requires polished triggers/actions and example Zaps.",
    mvpVersion:
      "Triggers: 'New Output Saved', 'New Project Created'. Actions: 'Generate TikTok Script', 'Save Output', 'Create Project'. Submit for public listing.",
    advancedVersion:
      "Search actions ('Find Output by Title'), dynamic dropdowns (Zapier fetches user's projects in real time), instant triggers via webhooks (no polling), bulk actions, sample data for testing.",
    phase: 2,
    recommendedOrder: 2,
  },

  // -------- 3. Gmail --------
  {
    id: "gmail",
    name: "Gmail",
    category: "Productivity",
    icon: "📧",
    valueScore: 4,
    effortScore: 3,
    trustScore: 4,
    oneLiner: "Send the email sequences you generated — without leaving the app.",
    value:
      "The Email Sequence generator is one of your best templates. Without Gmail, users still have to copy/paste each email into their mail tool. With Gmail send, the loop closes inside Chief of Staff: generate → schedule → send → track opens.",
    difficulty:
      "Medium. Google's OAuth flow is well-documented but fiddly (consent screen verification, scope justification, security review for sensitive scopes). Sending is the easy part; the verification process is what burns weeks.",
    apiAccess: "Google Cloud project, Gmail API enabled, OAuth 2.0 client. Free tier covers thousands of sends/day.",
    oauth:
      "OAuth 2.0 with offline access (refresh tokens). Scopes needed: gmail.send (sensitive — requires verification once you exit testing mode and have > 100 users). Plan ~2 weeks for Google verification once you submit.",
    risks:
      "The gmail.send scope is 'sensitive' — Google requires a security assessment + privacy policy + recorded demo video before you can serve > 100 users. Domain verification needed. Tokens expire and refresh logic must be bulletproof or users get silent send failures.",
    mvpVersion:
      "Connect Gmail account (OAuth). 'Send this email' button on any saved email-sequence output. Send-now only, plain text or HTML.",
    advancedVersion:
      "Schedule sends, sequence drip (E1 today, E2 in 2 days, E3 in 5), open/click tracking, reply detection (auto-pause when they reply), templates pre-filled with merge tags, multiple connected accounts.",
    phase: 3,
    recommendedOrder: 3,
  },

  // -------- 4. Google Drive --------
  {
    id: "gdrive",
    name: "Google Drive",
    category: "Productivity",
    icon: "📁",
    valueScore: 4,
    effortScore: 2,
    trustScore: 5,
    oneLiner: "Save every output to the user's Drive. Zero lock-in story.",
    value:
      "Killer 'no lock-in' selling point. Every saved output also appears as a Google Doc in a 'Chief of Staff' folder in their Drive. Users feel safer (their content is in their Google account too) and they can collaborate with VAs, editors, clients without inviting anyone to your app.",
    difficulty:
      "Easier than Gmail. The drive.file scope is non-sensitive (you only touch files YOUR app created), so Google verification is much faster — no security assessment needed.",
    apiAccess: "Google Cloud project, Drive API enabled, OAuth 2.0 client.",
    oauth:
      "OAuth 2.0 with drive.file scope. Non-sensitive scope = faster verification. ~3-5 days of dev including the Drive folder creation + doc-write logic.",
    risks:
      "Rate limits are generous but exist (1,000 requests / 100 sec / user). Markdown→Docs conversion needs care (Google Docs API uses a structural format, not Markdown directly). Quota is per-project across all users — monitor it.",
    mvpVersion:
      "Connect Drive. On Save, also create a Google Doc in a 'Chief of Staff' folder with the same content. One-way sync (app → Drive).",
    advancedVersion:
      "Two-way sync (edits in Doc reflect back in app), folder-per-project organization, share links auto-generated, version history surfaced in app, bulk export of entire library to Drive zip.",
    phase: 3,
    recommendedOrder: 4,
  },

  // -------- 5. n8n --------
  {
    id: "n8n",
    name: "n8n",
    category: "Automation",
    icon: "🔗",
    valueScore: 4,
    effortScore: 1,
    trustScore: 4,
    oneLiner: "Self-hosted Zapier alternative. The dev-savvy power users love it.",
    value:
      "A growing slice of solo founders run n8n self-hosted to avoid Zapier's per-task costs. Adding native nodes for Chief of Staff puts you in their automation ecosystem with almost zero work, since n8n nodes are open-source community contributions and your existing REST API is already enough.",
    difficulty:
      "Trivial — actually nothing to build on your end. n8n already has a generic 'HTTP Request' node that works with your API today. The 'work' is just publishing a community node package on n8n's GitHub-based registry for nicer UX.",
    apiAccess: "Your existing /api/* endpoints. No n8n-side account or registration needed.",
    oauth:
      "n8n stores credentials per workflow — your standard email/password or API-key auth works. If you add API keys (Phase 2.5), n8n integration becomes one-click.",
    risks:
      "Self-hosted users sometimes hit you with weird traffic patterns (no rate limit on their side). Add per-API-key rate limits when you add API keys. Community node maintenance can fall to you if it breaks.",
    mvpVersion:
      "Document 'How to use Chief of Staff with n8n' (3-paragraph blog post + screenshots of an HTTP Request node). Done in an afternoon.",
    advancedVersion:
      "Publish official @chiefofstaff/n8n-nodes-chiefofstaff package: typed nodes for every action (Generate, Save Output, List Projects), credential type with API key, example workflows.",
    phase: 2,
    recommendedOrder: 5,
  },

  // -------- 6. Make (Integromat) --------
  {
    id: "make",
    name: "Make (Integromat)",
    category: "Automation",
    icon: "🧩",
    valueScore: 3,
    effortScore: 2,
    trustScore: 4,
    oneLiner: "Visual automation tool with a loyal European user base.",
    value:
      "Make has ~10% the user base of Zapier but pricing that punishes Zapier-heavy users (way cheaper for high-volume). Building a Make app expands distribution into automation power-users without much extra work if you already did Zapier.",
    difficulty:
      "Medium. Make's developer platform is more involved than Zapier's — you write 'modules' as JSON config plus IML (Integromat's mini-language). Steeper learning curve, but only ~1 week of work if your API is solid.",
    apiAccess: "Make Developer Hub account (free). Same /api endpoints you exposed to Zapier.",
    oauth: "Same OAuth 2.0 server you built for Zapier — Make consumes it identically.",
    risks:
      "Smaller community = smaller pool of pre-made templates. Make's docs are denser than Zapier's. Listing review can take 4+ weeks.",
    mvpVersion:
      "Same triggers + actions as Zapier (New Output Saved, Generate, Save Output). List as private app first, submit for public review later.",
    advancedVersion:
      "Iterators (loop through projects), aggregators (combine outputs), webhooks for instant triggers, advanced field mapping with IML.",
    phase: 3,
    recommendedOrder: 6,
  },

  // -------- 7. Google Calendar --------
  {
    id: "gcal",
    name: "Google Calendar",
    category: "Productivity",
    icon: "📅",
    valueScore: 3,
    effortScore: 3,
    trustScore: 5,
    oneLiner: "Schedule generated content. Calendar becomes the launch plan.",
    value:
      "Pairs naturally with the 30-Day Content Plan template — drop the plan onto the user's calendar with one click. Each row becomes a calendar event with the script in the description. Turns a static plan into a thing they actually see when they wake up.",
    difficulty:
      "Medium. Google Calendar API is well-built but timezone bugs are eternal — every dev underestimates them. Recurring events add complexity. Verification process same as Drive (non-sensitive scope = fast).",
    apiAccess: "Google Cloud project, Calendar API enabled.",
    oauth:
      "OAuth 2.0 with calendar.events scope (non-sensitive). Reuses the same Google OAuth setup as Gmail/Drive — connect once, opt into individual products.",
    risks:
      "Timezone handling. Always store UTC in your DB, display in user's IANA tz. Daylight Saving will bite you. Calendar conflicts (don't double-book the same hour) need their own logic.",
    mvpVersion:
      "Connect Calendar. On a 30-Day Content Plan output, click 'Add to Calendar' → creates 30 events at 9am user-local-time, each with the hook + body in the description.",
    advancedVersion:
      "Drag-to-reschedule inside the app (calendar view), 'best time to post' suggestions per platform, two-way sync (calendar edits reflect in plan), team calendars, time-block 'writing days'.",
    phase: 3,
    recommendedOrder: 7,
  },

  // -------- 8. Canva --------
  {
    id: "canva",
    name: "Canva",
    category: "Design",
    icon: "🎨",
    valueScore: 3,
    effortScore: 3,
    trustScore: 3,
    oneLiner: "Turn caption + script into actual visuals. Closes the design gap.",
    value:
      "Most beginner content fails because the words are great but the design is amateur. Canva integration lets you generate a TikTok script + auto-create a matching slide carousel or thumbnail in the user's Canva, branded with their colors. Big differentiator vs other AI writers.",
    difficulty:
      "Medium-hard. Canva's Connect API is newer (2024) and its design-creation endpoints are limited compared to what you can do in their editor. Brand asset access requires Canva Pro on the user's side.",
    apiAccess:
      "Canva Connect API — apply through their developer portal. Approval takes a few weeks; review is fairly strict about the use case.",
    oauth: "OAuth 2.0 standard. User connects their Canva account, you can read/write designs in their workspace.",
    risks:
      "API surface is smaller than the editor — you can't do everything visually possible inside Canva. Some endpoints require Canva Pro on the end user's account. API pricing model is still evolving — could change pricing under you.",
    mvpVersion:
      "Connect Canva. 'Open in Canva' button on any output → opens a pre-filled template with the user's caption + brand colors auto-populated.",
    advancedVersion:
      "Auto-generate full carousel sets (1 slide per script line), brand kit auto-applied, batch export as PNG → save back into Chief of Staff library, AI image generation passed to Canva for refinement.",
    phase: 4,
    recommendedOrder: 8,
  },

  // -------- 9. Instagram --------
  {
    id: "instagram",
    name: "Instagram",
    category: "Social",
    icon: "📸",
    valueScore: 4,
    effortScore: 4,
    trustScore: 2,
    oneLiner: "Publish captions + Reels directly. The dream — and the headache.",
    value:
      "Most-requested integration by a mile. Solves the 'I generate but never post' problem. Direct publishing closes the entire content loop. Big retention lever — users come back daily because the post button lives in your app.",
    difficulty:
      "Hard. Instagram Graph API requires the user to have an Instagram BUSINESS account linked to a Facebook Page (personal accounts are excluded). App must go through Meta App Review, which is famously slow + opaque. Even after approval, publishing limits are tight (~25 posts/day per account).",
    apiAccess:
      "Meta Developer account, Facebook App created, Instagram Graph API + Pages permissions, App Review with detailed use-case justification + screencast demo. Plan 4-8 weeks for approval, expect rejections.",
    oauth:
      "Facebook Login → Instagram Business Account discovery. Long-lived tokens (60 days) need refresh logic. Re-auth flow has to be smooth — tokens DO expire and silent failures kill trust.",
    risks:
      "App Review can reject for vague reasons. Meta deprecates APIs without warning (the older Instagram Basic Display API was killed in 2024). Personal Instagram accounts are walled off — you'll explain this constantly to users. Publishing rate limits are non-public and change.",
    mvpVersion:
      "Connect Instagram Business account. 'Post to Instagram' button on caption outputs → posts a single image + caption immediately. Reel publishing only (no carousels, no Stories) in v1.",
    advancedVersion:
      "Scheduled posting, carousel posts (multi-image), Stories, Reels with auto-uploaded video, comment management, DM auto-reply integration, post-performance read-back into the app for analytics.",
    phase: 4,
    recommendedOrder: 9,
  },

  // -------- 10. Facebook --------
  {
    id: "facebook",
    name: "Facebook",
    category: "Social",
    icon: "📘",
    valueScore: 3,
    effortScore: 3,
    trustScore: 2,
    oneLiner: "Easier sibling to Instagram — same Meta plumbing, lower priority.",
    value:
      "Once Instagram is approved, Facebook Pages publishing is almost free (same Meta infrastructure). Older audience demographics make it valuable for some niches (faith-based, finance, parenting) but lower hype than IG/TikTok.",
    difficulty:
      "Medium IF you've already done Instagram (most of the work is shared). Standalone, similar to IG but slightly less restrictive. Same Meta App Review process applies for the pages_manage_posts permission.",
    apiAccess: "Same Facebook App as Instagram. pages_manage_posts permission requires App Review.",
    oauth: "Same Facebook Login flow as Instagram. Page access tokens (long-lived, 60 days, refreshable).",
    risks:
      "Engagement on regular Facebook posts is in long decline — many users will connect it and rarely use it. Reels do better but compete with IG Reels. Meta's review process applies the same way it does for IG.",
    mvpVersion:
      "Connect Facebook Page. 'Post to Facebook' button on captions → posts text + optional image to the connected Page.",
    advancedVersion:
      "Scheduled posts, multi-Page support, post to Groups (much harder permission set), Reels publishing, audience insights pulled into the app for content suggestions.",
    phase: 4,
    recommendedOrder: 10,
  },

  // -------- 11. TikTok --------
  {
    id: "tiktok",
    name: "TikTok",
    category: "Social",
    icon: "🎵",
    valueScore: 5,
    effortScore: 5,
    trustScore: 2,
    oneLiner: "Highest user demand. Hardest API. Build last but plan early.",
    value:
      "Your TikTok Script template is one of your most-used. Direct posting would be transformational — closes the highest-volume content loop. But TikTok's developer ecosystem is the most restrictive of any major platform; build it last when you have leverage to negotiate access.",
    difficulty:
      "Very hard. TikTok for Developers API is gated, slow to approve, and the 'Content Posting API' is restricted to vetted partners with proven user bases. Most apps get auto-rejected. Even when approved, scope of what you can do is limited.",
    apiAccess:
      "TikTok for Developers account, app created, multiple permission tiers each requiring separate review. Content Posting API requires a real partnership conversation, not just a form. Be prepared for 'no' or for direct uploads being limited to 'drafts in the user's TikTok app'.",
    oauth:
      "OAuth 2.0 with content.publish.video scope. Token lifecycle is short (1 day access, 1 year refresh). Scope review is brutal — most first-time submissions reject.",
    risks:
      "TikTok deprecated APIs aggressively in 2023-24. Geopolitics affecting access. Many 'integrated' apps actually only push videos to the user's draft folder (still requires manual publish in the TikTok app). Banned-account risk if your app is associated with violations.",
    mvpVersion:
      "Connect TikTok account → 'Send to TikTok drafts' button on script outputs → posts a placeholder video + caption to the user's TikTok drafts folder for them to record over and publish manually.",
    advancedVersion:
      "Direct video upload + publish (requires partner-tier access), Spark Ads integration, comment management, hashtag performance read-back, TikTok Shop product tagging.",
    phase: 5,
    recommendedOrder: 11,
  },
];

// Roadmap phases for the summary view
export const ROADMAP_PHASES = [
  {
    phase: 2 as const,
    label: "Phase 2 · Monetize & Distribute",
    timeline: "Months 1-3 after MVP launch",
    icon: "💰",
    color: "violet",
    integrations: ["stripe", "zapier", "n8n"] as IntegrationId[],
    goal: "Take money. Plug into existing user automations. Get listed in Zapier's directory.",
  },
  {
    phase: 3 as const,
    label: "Phase 3 · Productivity Suite",
    timeline: "Months 3-6",
    icon: "🧠",
    color: "sky",
    integrations: ["gmail", "gdrive", "make", "gcal"] as IntegrationId[],
    goal: "Close the loops: send the emails you generate, save to user's Drive, schedule to their calendar.",
  },
  {
    phase: 4 as const,
    label: "Phase 4 · Publishing",
    timeline: "Months 6-12",
    icon: "📢",
    color: "pink",
    integrations: ["canva", "instagram", "facebook"] as IntegrationId[],
    goal: "Generate → design → publish, all inside Chief of Staff. The 'command center' identity emerges.",
  },
  {
    phase: 5 as const,
    label: "Phase 5 · The TikTok Boss Fight",
    timeline: "Year 2",
    icon: "🎵",
    color: "orange",
    integrations: ["tiktok"] as IntegrationId[],
    goal: "Tackle the hardest API last, with real user numbers to justify partner access.",
  },
];

// Used for the priority matrix view
export function priorityScore(i: Integration): number {
  // Higher = better. Value × trust − effort. Simple, opinionated.
  return i.valueScore * 2 + i.trustScore - i.effortScore;
}

export const RANKED = [...INTEGRATIONS].sort((a, b) => priorityScore(b) - priorityScore(a));
