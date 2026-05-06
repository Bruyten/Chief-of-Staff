// Starter Template Library — Prompt #5
// 15 production-ready templates designed for digital product sellers,
// affiliate marketers, PLR/MRR sellers, course creators, and beginners.
// Each template is fully self-contained: name, prompt, output format,
// CTA library, and a real example. Drop directly into the platform.

export type Template = {
  id: string;
  number: string;
  name: string;
  category: "Short-form video" | "Social copy" | "Sales copy" | "Email" | "Strategy" | "Engagement";
  icon: string;
  whatItDoes: string;
  beginnerFriendlyNote: string;
  inputFields: { name: string; required: boolean; example: string; help?: string }[];
  aiPrompt: string;            // The skill prompt body (drops into /server/prompts/skills/<id>.md)
  outputFormat: string;        // What the AI returns (Markdown shape)
  ctaExamples: { label: string; cta: string }[];
  exampleOutput: string;       // A realistic on-brand example
};

// ----- 1. TikTok script -----
const T_TIKTOK: Template = {
  id: "tiktok_script",
  number: "01",
  name: "TikTok Script",
  category: "Short-form video",
  icon: "🎵",
  whatItDoes:
    "Writes a 25–45 second TikTok script designed to stop the scroll in the first 2 seconds and end with one clear action — built for beginners who don't yet have a 'creator voice'.",
  beginnerFriendlyNote:
    "You don't need to be on camera. Most of these scripts work as voiceover + screen recording or photo carousel.",
  inputFields: [
    { name: "product_name", required: true, example: "Glow Serum Bundle" },
    { name: "product_description", required: true, example: "A 3-step skincare routine for oily, breakout-prone skin." },
    { name: "target_audience", required: true, example: "Women 22-35 with adult acne", help: "Be specific. 'Women' isn't enough." },
    { name: "pain_point", required: true, example: "Cystic breakouts that don't respond to drugstore products" },
    { name: "offer_type", required: true, example: "digital_product", help: "course | digital_product | affiliate | service | coaching | physical" },
    { name: "cta", required: true, example: "Tap the link in my bio to grab the bundle." },
    { name: "brand_tone", required: false, example: "Calm, no exclamations, peer-to-peer" },
  ],
  aiPrompt: `Write a 25-45 second TikTok script. The script must:
- Open with a hook ≤ 12 words that creates curiosity, conflict, or contradiction.
- Speak to ONE person in second person, present tense.
- Stay on ONE idea — do not stack benefits.
- Use 1-2 sentence "shots" (each line = a camera cut or visual change).
- Replace adjectives with specifics (numbers, names, concrete outcomes).
- Total spoken word count: 75-130.
- End with the user's {{cta}} verbatim if provided.

Banned: greetings ("hey guys"), the brand name in line 1, more than one exclamation mark, hype words (game-changer, unleash, 10x).`,
  outputFormat: `**Hook (0–2s):** <one line, ≤ 12 words>

**Script:**
1. <line>
2. <line>
3. <line>
4. <line>
5. <line>

**On-screen text suggestions:**
- <text>
- <text>
- <text>

**CTA:** <one sentence>

**Hashtags:** #tag1 #tag2 #tag3 #tag4 #tag5`,
  ctaExamples: [
    { label: "Digital product", cta: "Tap the link in my bio to grab the bundle." },
    { label: "Affiliate", cta: "Comment 'LINK' and I'll send you the one I use." },
    { label: "Course", cta: "Doors close Friday — link in bio." },
    { label: "Lead magnet", cta: "Grab the free PDF in my bio." },
    { label: "DM-driven", cta: "DM me 'serum' for the exact one." },
  ],
  exampleOutput: `**Hook (0–2s):** I tried 11 skincare brands. Only one stopped my breakouts.

**Script:**
1. *Camera close on jawline.* For 8 months I had cystic acne every period week.
2. Then I swapped my $60 serum for this $24 one.
3. Three drops at night. That's it.
4. Two weeks in, my skin actually looked like skin again.
5. The link is in my bio if you want what I used.

**On-screen text suggestions:**
- "$60 serum vs $24 one"
- "Day 1 → Day 14"
- "Link in bio 🩷"

**CTA:** Tap the link in my bio to grab the bundle.

**Hashtags:** #skincaretok #cysticacne #honestreview #skincareroutine #foundit`,
};

// ----- 2. Facebook Reel script -----
const T_FB_REEL: Template = {
  id: "facebook_reel_script",
  number: "02",
  name: "Facebook Reel Script",
  category: "Short-form video",
  icon: "📘",
  whatItDoes:
    "Writes a 30–60 second Reel tuned for Facebook's older skew (28–55). Slower pacing, warmer hook, more credibility cues than TikTok.",
  beginnerFriendlyNote:
    "Facebook audiences want to feel safe before they buy. We lean on clarity and small proof points instead of edgy hooks.",
  inputFields: [
    { name: "product_name", required: true, example: "30-Day Christian Budgeting Course" },
    { name: "product_description", required: true, example: "A faith-based budgeting course for stay-at-home moms." },
    { name: "target_audience", required: true, example: "Christian moms 35-55 managing single-income households" },
    { name: "pain_point", required: true, example: "End of month with nothing left and rising grocery costs" },
    { name: "offer_type", required: true, example: "course" },
    { name: "cta", required: true, example: "Comment 'BUDGET' for the free starter PDF." },
  ],
  aiPrompt: `Write a 30-60 second Facebook Reel script.
- Hook is curiosity-driven but warm ("Here's what nobody tells you about…").
- Line 1 names the audience or pain point directly.
- Slightly slower pacing than TikTok (sentences can be a beat longer).
- Include ONE credibility beat (a number, duration, or small proof point).
- Reading level grade 6-8.
- Total word count: 90-150.
- End with the user's {{cta}} verbatim.`,
  outputFormat: `**Hook (0–3s):** <one line, ≤ 14 words>

**Script:**
1. <line>
2. <line>
3. <line>
4. <line>
5. <line>
6. <line>

**On-screen text suggestions:** (3 bullets)

**CTA:** <one sentence>

**Caption (for the Reel post, 2-4 short lines):**
<caption text>`,
  ctaExamples: [
    { label: "Comment-to-DM funnel", cta: "Comment 'BUDGET' for the free starter PDF." },
    { label: "Course launch", cta: "Doors open Monday — link in comments." },
    { label: "Free training", cta: "Tap the link to join the free 3-day class." },
    { label: "Group invite", cta: "Join the free group — link below." },
  ],
  exampleOutput: `**Hook (0–3s):** Here's what nobody tells stay-at-home moms about money.

**Script:**
1. You're not bad with money. You were never taught a system that fits ONE income.
2. I tracked my family's spending for 90 days and found something wild.
3. We were losing $312 a month to small subscriptions and impulse Targets.
4. So I built a 4-tab budget that takes 20 minutes a week.
5. Last month we paid off our last credit card.
6. If you want the free starter version, comment "BUDGET" and I'll send it.

**On-screen text suggestions:**
- "$312/month leak — found it"
- "20 mins a week. That's it."
- "Comment BUDGET 👇"

**CTA:** Comment "BUDGET" for the free starter PDF.

**Caption (for the Reel post):**
This took me from "where did the money go" to "we're actually saving."

The full system is free — just comment BUDGET and I'll send it to your inbox.

No upsells. Promise.`,
};

// ----- 3. Instagram caption -----
const T_IG_CAPTION: Template = {
  id: "instagram_caption",
  number: "03",
  name: "Instagram Caption",
  category: "Social copy",
  icon: "📸",
  whatItDoes:
    "Writes a stop-the-scroll caption with a standalone first line, white-space formatting, and one clear CTA.",
  beginnerFriendlyNote:
    "Line 1 is everything. Most people only see the first 90 characters before 'more' truncates the rest.",
  inputFields: [
    { name: "product_name", required: true, example: "$27 Notion Money Tracker" },
    { name: "product_description", required: true, example: "A plug-and-play Notion template for tracking variable income." },
    { name: "target_audience", required: true, example: "Freelancers and creators with inconsistent monthly income" },
    { name: "pain_point", required: true, example: "Anxiety about whether to spend or save when income swings month to month" },
    { name: "offer_type", required: true, example: "digital_product" },
    { name: "cta", required: true, example: "Link in bio to grab the template." },
  ],
  aiPrompt: `Write a high-stop-rate Instagram caption.
- LINE 1 is a standalone hook (≤ 90 chars). Must work alone when truncated.
- White space between every 1-2 sentences. White space IS the format.
- Replace every adjective with a noun + number where possible.
- Mention the audience or their problem within the first 3 lines.
- ONE CTA only. Use {{cta}} verbatim.
- Caption length: 90-180 words. 0-2 emojis max. None in line 1.
- Hashtags: 8-12 mix of broad/niche/micro.`,
  outputFormat: `**Caption:**
<line 1 hook>

<paragraph>

<paragraph>

<paragraph>

**CTA:** <single line>

**Hashtags:** #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10`,
  ctaExamples: [
    { label: "Bio link", cta: "Link in bio to grab the template." },
    { label: "Comment funnel", cta: "Comment 'TEMPLATE' and I'll DM the link." },
    { label: "Save-and-share", cta: "Save this for the next time you panic about money." },
    { label: "Question prompt", cta: "Which month-end feeling hits hardest? 👇" },
  ],
  exampleOutput: `**Caption:**
You're not bad with money. You just earn money in a pattern budgets weren't built for.

Salaries get one budget shape. Variable income needs another.

When I made $4,200 in March and $1,800 in April, every "use this 50/30/20 rule" video felt like it was written for a different planet.

So I built the thing I actually needed: one Notion page that asks "what's your floor month look like?" and works backwards from there.

It costs $27 once. No subscription. No upsell.

**CTA:** Link in bio to grab the template.

**Hashtags:** #freelancerlife #variableincome #notiontemplate #moneymindset #freelancefinance #creatoreconomy #budgeting #moneytips #financialwellness #solopreneur`,
};

// ----- 4. YouTube Shorts script -----
const T_YT_SHORTS: Template = {
  id: "youtube_shorts_script",
  number: "04",
  name: "YouTube Shorts Script",
  category: "Short-form video",
  icon: "▶️",
  whatItDoes:
    "Writes a 30–50 second Shorts script optimized for the algorithm's 'watched to the end' signal, with a loop-back line that earns the rewatch.",
  beginnerFriendlyNote:
    "Shorts reward 'I learned something' — lead with the payoff, then deliver it.",
  inputFields: [
    { name: "product_name", required: true, example: "Affiliate Email Vault" },
    { name: "product_description", required: true, example: "A swipe file of 50 affiliate promo emails that converted." },
    { name: "target_audience", required: true, example: "New affiliate marketers who hate writing" },
    { name: "pain_point", required: true, example: "Staring at a blank page trying to write affiliate promo emails" },
    { name: "offer_type", required: true, example: "digital_product" },
    { name: "cta", required: true, example: "Grab the swipe file — first link in description." },
  ],
  aiPrompt: `Write a 30-50 second YouTube Shorts script.
- Structure: HOOK → PROMISE → DELIVERY → LOOP-BACK.
- The HOOK makes a promise the script must pay off. State the payoff up front.
- The LOOP-BACK is one final line that nudges the viewer to rewatch ("Watch the first 3 seconds again — you'll see it").
- Word count: 80-130.
- No "Hey guys" or "Welcome back". First frame = payoff promise.`,
  outputFormat: `**Hook (0–2s):** <line>

**Promise (2–4s):** <one line that tells the viewer what they'll learn>

**Script:**
1. <line>
2. <line>
3. <line>
4. <line>

**Loop-back line:** <one line that rewards a rewatch>

**Title (≤ 60 chars):** <title>

**Description (1-2 lines):** <text>`,
  ctaExamples: [
    { label: "Description link", cta: "Grab the swipe file — first link in description." },
    { label: "Pinned comment", cta: "Pinned comment has the link." },
    { label: "Subscribe + link", cta: "Subscribe + tap the description for the file." },
  ],
  exampleOutput: `**Hook (0–2s):** Here's the affiliate email that made me $1,840 last week.

**Promise (2–4s):** I'll show you the exact 4-line structure I copy every time.

**Script:**
1. Line 1 — name the problem your reader had at 8:47am today.
2. Line 2 — the small thing they tried that didn't work.
3. Line 3 — the thing you're now using and the result so far.
4. Line 4 — the link, framed as "if you want to try it too".

**Loop-back line:** Watch line 1 again — that's the part most affiliates skip.

**Title (≤ 60 chars):** The 4-line affiliate email that made me $1,840

**Description:** Full swipe file (50 emails) is in the first link. No upsell, no email needed — it's a one-time $19.`,
};

// ----- 5. Product description -----
const T_PROD_DESC: Template = {
  id: "product_description",
  number: "05",
  name: "Product Description",
  category: "Sales copy",
  icon: "🛍️",
  whatItDoes:
    "Writes a conversion-focused product description: outcome-led hero line, three benefit bullets that read as outcomes, and one objection handler.",
  beginnerFriendlyNote:
    "Most beginner descriptions read like an Amazon spec sheet. We invert it — outcomes first, features only when they earn the line.",
  inputFields: [
    { name: "product_name", required: true, example: "PLR Email Vault" },
    { name: "product_description", required: true, example: "300 done-for-you email templates with PLR rights for new sellers." },
    { name: "target_audience", required: true, example: "New PLR/MRR sellers who hate writing" },
    { name: "pain_point", required: true, example: "Don't know what to write to their email list" },
    { name: "benefits", required: true, example: "Time saved; sounds professional; can be resold" },
    { name: "price", required: true, example: "$37" },
    { name: "offer_type", required: true, example: "digital_product" },
    { name: "cta", required: true, example: "Get the vault for $37." },
  ],
  aiPrompt: `Write a product description that converts in under 60 seconds of reading.
- Lead with the OUTCOME, not the feature.
- 3 benefit bullets max. Each starts with a verb or a number.
- Each bullet is an outcome, not a feature.
- ONE objection-handler sentence ("If you've tried X and Y…").
- End with {{cta}} verbatim.`,
  outputFormat: `**Hero promise (1 line):**
<line>

**What you get:**
- <outcome bullet>
- <outcome bullet>
- <outcome bullet>

**Why it's different:**
<2-3 sentence paragraph addressing one objection>

**CTA:** <one sentence>`,
  ctaExamples: [
    { label: "Direct purchase", cta: "Get the vault for $37." },
    { label: "Limited time", cta: "Lock in the $37 price — going to $67 on the 15th." },
    { label: "Bundle upsell", cta: "Get the vault + bonus templates for $37." },
  ],
  exampleOutput: `**Hero promise:**
Send your first 12 emails this weekend without staring at a blank page once.

**What you get:**
- 300 ready-to-edit emails sorted by goal (welcome, promo, re-engage, sale, thank-you)
- Full PLR license — rebrand and resell as your own product
- A 1-page "which email when" cheat sheet so you never wonder what to send

**Why it's different:**
If you've tried other PLR email packs, you know they read like 2014 marketing. These were written this year by a working email copywriter and tested on real lists. Sound like a person, not a template.

**CTA:** Get the vault for $37.`,
};

// ----- 6. Sales page outline -----
const T_SALES_PAGE: Template = {
  id: "sales_page_outline",
  number: "06",
  name: "Sales Page Outline",
  category: "Sales copy",
  icon: "🌐",
  whatItDoes:
    "Generates a complete sales page outline (12 sections) with headlines and 1–3 sentences of copy per section. The user expands what works.",
  beginnerFriendlyNote:
    "Don't try to write the whole page in one sitting. Use this outline as a paint-by-numbers — fill the sections in order over a few sessions.",
  inputFields: [
    { name: "product_name", required: true, example: "Beginner Affiliate Bootcamp" },
    { name: "product_description", required: true, example: "A 14-day beginner course on affiliate marketing without an audience." },
    { name: "target_audience", required: true, example: "9-5 employees with 30 mins a day, no audience yet" },
    { name: "pain_point", required: true, example: "Bought 3 courses, never made a sale" },
    { name: "benefits", required: true, example: "First commission within 14 days, daily 30-min lessons" },
    { name: "price", required: true, example: "$67" },
    { name: "offer_type", required: true, example: "course" },
    { name: "cta", required: true, example: "Enroll now for $67." },
  ],
  aiPrompt: `Produce a complete sales page outline. Section order:
HOOK → PROBLEM → AGITATION → SOLUTION → INTRODUCTION → BENEFITS → SOCIAL PROOF SLOT → OFFER → BONUSES → GUARANTEE → CTA → FAQ.

Each section: HEADLINE (≤ 12 words) + 1-3 sentences.
- Headlines never use the brand name.
- OFFER section: outcomes, not deliverables.
- GUARANTEE: concrete (days, terms). If user didn't provide one, write a reasonable default and flag with "// assumption".
- FAQ: exactly 5 questions in the buyer's voice.`,
  outputFormat: `## Hook
**<headline>**
<1-3 sentences>

## Problem
**<headline>**
<1-3 sentences>

(continue through all 12 sections)`,
  ctaExamples: [
    { label: "Direct enroll", cta: "Enroll now for $67." },
    { label: "With urgency", cta: "Enroll before Friday — price goes to $97." },
    { label: "Risk reversal", cta: "Enroll for $67 — full refund through day 14." },
    { label: "Payment plan", cta: "Enroll today — 2 payments of $37." },
  ],
  exampleOutput: `## Hook
**Three courses, zero commissions. Here's what was missing.**
You bought the courses. You watched the videos. You opened a blank doc and… nothing. The piece nobody teaches is what to do BEFORE you have an audience.

## Problem
**You're stuck in research mode.**
You can recite affiliate strategy in your sleep but you've never made a real sale. The gap isn't knowledge. It's a daily action plan.

## Agitation
**Another month, same screenshot.**
You'll keep buying courses, watching tutorials, and hating Mondays — until you stop "learning" and start shipping.

## Solution
**14 days. 30 minutes a day. One specific action each day.**
Bootcamp gives you a daily 30-minute task and the exact script to use. Day 1 you pick a niche. Day 14 you've made or lost your first commission attempt — either way, you've left the "researcher" identity.

## Introduction
**Hi, I'm <name>.**
I made my first $14 commission 9 months in because I overthought everything. Bootcamp is the version I wish I'd bought instead.

## Benefits
**What you walk out with:**
- A live affiliate funnel posting daily by day 7
- 14 ready-to-use post templates that don't sound like a beginner
- A clear "what to do tomorrow" answer every morning of the program

## Social Proof Slot
**(Insert 2-3 short testimonials here when you have them.)**
// assumption: leave bracketed placeholder until real testimonials arrive.

## Offer
**Here's what's included:**
- 14 daily lessons (30 min each)
- The post template pack
- The "first commission" checklist
- Weekly office hours for 8 weeks

## Bonuses
**Two things I add free this week:**
- The 50-email PLR vault ($37 value)
- A 60-min audit recording on my own first sale

## Guarantee
**14-day "make a real attempt" refund.**
Complete the daily tasks for 14 days. If you didn't make at least one affiliate post that got engagement, full refund — no questions.

## CTA
**Enroll now for $67.**

## FAQ
**Do I need an audience already?** No. Day 1-3 is built for zero followers.
**How much time per day?** 30 minutes. The lessons are timed.
**What if I'm in a saturated niche?** The day-1 task picks a sub-angle for you.
**Is this a recurring charge?** No. One payment of $67.
**What if I fall behind?** You keep lifetime access. Pause, restart anytime.`,
};

// ----- 7. Email welcome sequence -----
const T_EMAIL_SEQ: Template = {
  id: "email_welcome_sequence",
  number: "07",
  name: "Email Welcome Sequence",
  category: "Email",
  icon: "📧",
  whatItDoes:
    "Writes a 5-email welcome sequence: deliver → story → value → soft pitch → direct ask. Designed for people who just opted in to a freebie or list.",
  beginnerFriendlyNote:
    "Don't pitch in email 1. Earn the open of email 2 first. Soft pitch lives in email 4.",
  inputFields: [
    { name: "business_name", required: true, example: "Sage & Save" },
    { name: "lead_magnet_name", required: true, example: "The 4-Tab Budget" },
    { name: "product_name", required: true, example: "Sage & Save Membership" },
    { name: "target_audience", required: true, example: "Christian moms managing one income" },
    { name: "pain_point", required: true, example: "Constant money anxiety despite tracking everything" },
    { name: "offer_type", required: true, example: "subscription" },
    { name: "price", required: true, example: "$19/mo" },
    { name: "cta", required: true, example: "Try the membership free for 14 days." },
  ],
  aiPrompt: `Write a 5-email welcome sequence: Deliver → Story → Value → Soft Pitch → Direct Ask.
- Each subject ≤ 50 chars. No clickbait, no all-caps, no emoji unless earned.
- Body 80-140 words. Reading level grade 5-7.
- Single CTA per email, same CTA across emails 4 and 5.
- Email 1: deliver the lead magnet, set expectation, no selling.
- Email 2: a short relatable story that frames the pain.
- Email 3: one piece of usable insight or proof. No selling.
- Email 4: soft pitch tied to the story.
- Email 5: clear deadline or scarcity, direct ask.
- Sign-off: user's name if available, otherwise "—".
- Banned: "Dear", "I hope this email finds you well", "Cheers!".`,
  outputFormat: `### Email 1 — Deliver
**Subject:** <line>
**Preview text:** <≤ 80 chars>
<body>
**CTA:** <one line>

---

### Email 2 — Story
(same shape)

### Email 3 — Value
### Email 4 — Soft Pitch
### Email 5 — Direct Ask`,
  ctaExamples: [
    { label: "Free trial", cta: "Try the membership free for 14 days." },
    { label: "Limited offer", cta: "Lock in $9/mo for life — ends Friday." },
    { label: "Book a call", cta: "Grab a free 15-min strategy call." },
    { label: "Direct purchase", cta: "Join for $19 — cancel anytime." },
  ],
  exampleOutput: `### Email 1 — Deliver
**Subject:** Your 4-Tab Budget is here
**Preview text:** Plus the 1 thing most moms skip on first use.

The template is here: [link].

Two things before you open it:

1. The "Floor Month" tab is the most important. Fill that one first.
2. You'll feel weird about how empty it looks for the first 5 minutes. That's the point — most budgets pretend you have a steady income. This one doesn't.

I'll send you a short story tomorrow about why I built this in the first place.

—

**CTA:** Open the template and fill in the Floor Month tab.

---

### Email 2 — Story
**Subject:** The night I cried over a Walmart receipt
**Preview text:** And what we changed the next morning.

December 2022. I was sitting in our minivan in the Walmart parking lot. We'd just spent $284 on groceries we didn't need because I "couldn't think straight" about money anymore.

I had three budgeting apps. I tracked everything. I still felt broke.

That night I sketched the 4-Tab Budget on a napkin. The change wasn't more tracking. It was admitting our income wasn't steady and budgeting backwards from the worst month.

Tomorrow I'll send you the one tab moms tell me changed their week.

—

---

### Email 3 — Value
**Subject:** The "no-spend Monday" trick
**Preview text:** Saved one mom $312 in 30 days.

Tab 3 of the budget has a single calendar question:

"What's the smallest expense day this week — and what would it take to repeat it?"

One mom in our group answered "Monday — because we were tired and ate leftovers." She made every Monday a no-spend Monday. Saved $312 in 30 days without feeling deprived.

Try it this week. Then come find me — I'd love to hear what you noticed.

—

---

### Email 4 — Soft Pitch
**Subject:** Doing this together is easier
**Preview text:** Quick thing about the membership.

If the budget felt useful, here's what comes next.

The Sage & Save Membership is the place I drop weekly money rhythms — small actions that turn the budget into a habit instead of a spreadsheet you forget about.

It's $19/mo and you can try it free for 14 days. If it's not the right fit, cancel before day 14 and you won't be charged.

**CTA:** Try the membership free for 14 days.

—

---

### Email 5 — Direct Ask
**Subject:** Free trial ends tomorrow
**Preview text:** Last note about this.

Just a heads up — the free 14-day trial offer for new subscribers ends tomorrow night.

If you've been thinking about it, this is the moment. After tomorrow it's still $19/mo, but you'll skip the trial.

**CTA:** Try the membership free for 14 days.

—`,
};

// ----- 8. DM auto-reply -----
const T_DM: Template = {
  id: "dm_auto_reply",
  number: "08",
  name: "DM Auto-Reply",
  category: "Engagement",
  icon: "💬",
  whatItDoes:
    "Generates a friendly DM template the user can paste when leads message them. Sounds human, asks one qualifying question, and includes a 48-hour follow-up.",
  beginnerFriendlyNote:
    "Never paste a sales pitch as your first DM. The first message should sound like a person, not a funnel.",
  inputFields: [
    { name: "product_name", required: true, example: "Glow Serum Bundle" },
    { name: "product_description", required: true, example: "3-step skincare routine for oily skin." },
    { name: "target_audience", required: true, example: "Women 22-35 with adult acne" },
    { name: "offer_type", required: true, example: "digital_product" },
    { name: "lead_message_topic", required: true, example: "asked about the serum" },
    { name: "cta", required: true, example: "Here's the link if you want to grab it: <url>" },
  ],
  aiPrompt: `Write a DM reply template.
- Open by acknowledging what the lead said (use {{lead_message_topic}}).
- Ask ONE qualifying question before pitching.
- If lead is clearly ready to buy, send link with one short sentence.
- 30-70 words.
- Provide TWO variants: short (1-2 sentences) + full (3-5).
- Include a 48-hour follow-up.
- Banned: "Hey love", "Hey hun", "Babe", pet names, "I hope this finds you well".`,
  outputFormat: `**Short reply:**
<text>

**Full reply:**
<text>

**Suggested follow-up if no response in 48h:**
<text>`,
  ctaExamples: [
    { label: "Send link", cta: "Here's the link if you want to grab it: <url>" },
    { label: "Comment-to-DM convert", cta: "Want me to send the exact one I use?" },
    { label: "Book a call", cta: "Want to hop on a free 15-min call to map it out?" },
  ],
  exampleOutput: `**Short reply:**
Thanks for the message about the serum! Quick question first — is your skin more oily/breakout-prone, or dry/sensitive? Want to make sure I send the right one.

**Full reply:**
Thanks for reaching out about the serum! Before I send the link, one quick thing — is your skin more oily and breakout-prone, or dry and sensitive? The bundle has two starter routines and I want you to grab the right one. Once I know, I'll send the direct link (no upsells, promise).

**Suggested follow-up if no response in 48h:**
Hey! No pressure on this — just wanted to make sure you didn't miss my reply. If now's not the right time, totally understand. If it is, just reply with "oily" or "dry" and I'll send the right link.`,
};

// ----- 9. 30-day content plan -----
const T_PLAN: Template = {
  id: "content_plan_30day",
  number: "09",
  name: "30-Day Content Plan",
  category: "Strategy",
  icon: "📅",
  whatItDoes:
    "Creates a full 30-day content plan: 4 pillars at the top, one post per day with format, hook, and notes. Pitch days are spaced so you don't burn the audience out.",
  beginnerFriendlyNote:
    "Don't try to post 30 days in one platform first. Pick one. Use this plan to batch a week at a time.",
  inputFields: [
    { name: "business_name", required: true, example: "Sage & Save" },
    { name: "product_name", required: true, example: "Sage & Save Membership" },
    { name: "target_audience", required: true, example: "Christian moms on one income" },
    { name: "pain_point", required: true, example: "Money anxiety despite tracking" },
    { name: "platform", required: true, example: "Instagram + Reels" },
    { name: "offer_type", required: true, example: "subscription" },
    { name: "cta", required: true, example: "Comment 'BUDGET' for the free starter PDF." },
  ],
  aiPrompt: `Produce a 30-day content plan.
- Define exactly 4 content pillars at the top, derived from audience + offer.
- Each day = one row: Day | Pillar | Format | Hook | Notes.
- Format options: Reel | Carousel | Story | Static post | Live | Email.
- No two consecutive days can be the same format.
- Hooks must be platform-ready (actual lines ≤ 14 words, not "post about X").
- Days 7, 14, 21, 28 are pitch days (only days you sell directly).
- Days 1, 8, 15, 22, 29 are story/personal days.`,
  outputFormat: `## Content Pillars
1. **<pillar>** — <one-liner>
2. **<pillar>** — <one-liner>
3. **<pillar>** — <one-liner>
4. **<pillar>** — <one-liner>

## 30-Day Plan

| Day | Pillar | Format | Hook | Notes |
|-----|--------|--------|------|-------|
| 1   | …      | …      | …    | …     |
…
| 30  | …      | …      | …    | …     |`,
  ctaExamples: [
    { label: "Lead magnet driver", cta: "Comment 'BUDGET' for the free starter PDF." },
    { label: "Membership push", cta: "Try the membership free for 14 days — link in bio." },
    { label: "Save-and-share", cta: "Save this for the next time you panic about money." },
  ],
  exampleOutput: `## Content Pillars
1. **Real Numbers** — show actual dollar amounts, not vague advice.
2. **Faith Over Fear** — short reflections on money + trust.
3. **One-Income Reality** — daily life on a single paycheck, no shame.
4. **System Snippets** — micro-tutorials from the 4-Tab Budget.

## 30-Day Plan

| Day | Pillar | Format | Hook | Notes |
|-----|--------|--------|------|-------|
| 1   | One-Income Reality | Story | The night I cried over a Walmart receipt. | Personal day. No CTA. |
| 2   | System Snippets    | Reel  | Most moms skip the most important budget tab. | Promote tab 1. |
| 3   | Real Numbers       | Carousel | Where $312 a month was hiding. | 7 slides. |
| 4   | Faith Over Fear    | Static post | "Give us this day" was never about the next 6 months. | Quote graphic. |
| 5   | System Snippets    | Reel  | A 20-min money habit that survived a newborn. | Mention free PDF. |
| 6   | One-Income Reality | Carousel | 5 things that disappeared when we cut $312/mo. | 6 slides. |
| 7   | Real Numbers       | Reel  | Comment BUDGET — I'll send the free starter PDF. | **PITCH DAY.** |
| 8   | One-Income Reality | Story | What our grocery list looks like in week 4. | Personal day. |
| 9   | System Snippets    | Carousel | The "Floor Month" question. | 5 slides, hook on slide 1. |
| 10  | Faith Over Fear    | Reel  | Money anxiety is loudest at 11pm. Here's why. | Emotional. |
| 11  | Real Numbers       | Static post | $284 grocery trip → $147. Same family. | Photo + caption. |
| 12  | System Snippets    | Reel  | The 1-tab budget your spouse will actually use. | Pre-pitch warm-up. |
| 13  | One-Income Reality | Story | Today I almost canceled the membership. | Authentic doubt day. |
| 14  | Real Numbers       | Carousel | Sage & Save Membership — 14-day free trial. | **PITCH DAY.** |
| 15  | One-Income Reality | Story | Sunday reset rituals on one income. | Personal day. |
| 16  | Faith Over Fear    | Reel  | Three verses I read when bills hit my inbox. | Save-worthy. |
| 17  | System Snippets    | Carousel | Tab 3 = no-spend Mondays. | 6 slides. |
| 18  | Real Numbers       | Reel  | We saved $312 in 30 days doing one boring thing. | Comment BUDGET. |
| 19  | One-Income Reality | Static post | A photo of our actual whiteboard budget. | Honesty post. |
| 20  | System Snippets    | Carousel | What to do the day BEFORE payday. | 5 slides. |
| 21  | Real Numbers       | Reel  | Last call to lock in the $9 trial month. | **PITCH DAY.** |
| 22  | One-Income Reality | Story | What I would tell 2022-me. | Personal day. |
| 23  | Faith Over Fear    | Reel  | Stop praying for more. Start praying for clarity. | Quote-driven. |
| 24  | System Snippets    | Carousel | The 4 questions that replace 12 budget categories. | 5 slides. |
| 25  | Real Numbers       | Reel  | I tracked every dollar for 90 days. Here's the leak. | Hook = leak. |
| 26  | One-Income Reality | Static post | Our family's "no-buy" list this month. | Photo. |
| 27  | System Snippets    | Carousel | A 20-minute Sunday money meeting agenda. | 4 slides. |
| 28  | Real Numbers       | Reel  | Sage & Save free trial closes Sunday. | **PITCH DAY.** |
| 29  | One-Income Reality | Story | What changed in our marriage when we did this. | Personal day. |
| 30  | Faith Over Fear    | Reel  | A 30-second prayer for the moms reading this. | Save + share. |`,
};

// ----- 10. Offer improvement analysis -----
const T_OFFER_ANALYSIS: Template = {
  id: "offer_improvement_analysis",
  number: "10",
  name: "Offer Improvement Analysis",
  category: "Strategy",
  icon: "🔍",
  whatItDoes:
    "Scores the user's offer on 5 dimensions and recommends ONE highest-leverage change. Includes 3 alternative angles to test.",
  beginnerFriendlyNote:
    "If your scores are honest and one is below 5, fix THAT first. Don't optimize a 9 when there's a 4 sitting next to it.",
  inputFields: [
    { name: "product_name", required: true, example: "Beginner Affiliate Bootcamp" },
    { name: "product_description", required: true, example: "14-day beginner course on affiliate marketing." },
    { name: "target_audience", required: true, example: "9-5 employees with 30 mins a day" },
    { name: "pain_point", required: true, example: "Bought 3 courses, never made a sale" },
    { name: "benefits", required: true, example: "First commission within 14 days" },
    { name: "price", required: true, example: "$67" },
    { name: "offer_type", required: true, example: "course" },
    { name: "cta", required: true, example: "Enroll now for $67." },
  ],
  aiPrompt: `Score the user's offer 1-10 on 5 dimensions. Don't inflate.
Dimensions: Clarity | Specificity of Outcome | Pricing Logic | Risk Reversal | Urgency.
Each: one-sentence rationale grounded in user inputs.
Then ONE "Top fix" — concrete, with exact wording when relevant.
Then 3 alternative angles to test (≤ 20 words each).`,
  outputFormat: `## Offer Scorecard

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Clarity | x/10 | … |
| Specificity of Outcome | x/10 | … |
| Pricing Logic | x/10 | … |
| Risk Reversal | x/10 | … |
| Urgency | x/10 | … |

**Top fix:** <one sentence>

**3 angles to test:**
1. <angle>
2. <angle>
3. <angle>`,
  ctaExamples: [
    { label: "Apply fix", cta: "Update your sales page with the top fix this week." },
    { label: "Run experiments", cta: "A/B test angle 1 vs your current hook for 7 days." },
  ],
  exampleOutput: `## Offer Scorecard

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Clarity | 7/10 | "Beginner course on affiliate marketing" is clear, but doesn't say what makes this one different. |
| Specificity of Outcome | 5/10 | "First commission within 14 days" is good — but you don't say what size, in what niche, with what effort. |
| Pricing Logic | 8/10 | $67 is in the impulse-buy zone for the audience. Aligned. |
| Risk Reversal | 4/10 | No guarantee mentioned. For a $67 course aimed at burned buyers, this is the biggest leak. |
| Urgency | 3/10 | Nothing time-bound. "Enroll now" without a deadline is a coupon waiting to expire. |

**Top fix:** Add a 14-day "make-an-attempt" guarantee directly to the headline area: "Make a real affiliate post in 14 days or full refund." This addresses the audience's #1 fear (another wasted purchase) and lifts every other metric.

**3 angles to test:**
1. The "$0 to first $1" angle — make the small win the entire promise.
2. The "you're not a beginner, you're stuck" repositioning.
3. The "quit-watching-courses" anti-positioning hook.`,
};

// ----- 11. Lead magnet idea generator -----
const T_LEAD_MAGNET: Template = {
  id: "lead_magnet_ideas",
  number: "11",
  name: "Lead Magnet Idea Generator",
  category: "Strategy",
  icon: "🧲",
  whatItDoes:
    "Generates 5 lead magnet ideas matched to the user's audience and offer, ranked by build difficulty and conversion potential.",
  beginnerFriendlyNote:
    "Pick the one with the LOWEST build cost first. A free PDF that converts beats a free course that takes 3 weeks to build.",
  inputFields: [
    { name: "product_name", required: true, example: "PLR Email Vault" },
    { name: "target_audience", required: true, example: "New PLR sellers" },
    { name: "pain_point", required: true, example: "Don't know what to email their list" },
    { name: "offer_type", required: true, example: "digital_product" },
    { name: "platform", required: false, example: "Instagram" },
  ],
  aiPrompt: `Generate 5 lead magnet ideas tailored to the user's audience and offer.
For each: name, format, the specific outcome the lead gets, build difficulty (1-5), conversion potential (1-5), and the hook line you'd use.
Rank ideas by (conversion potential − build difficulty), descending.
End with a "Start with this one" recommendation.`,
  outputFormat: `## 5 Lead Magnet Ideas

### 1. <Name>
- **Format:** PDF | Mini-course | Template | Checklist | Audio | Cheat sheet | Quiz
- **What the lead gets:** <one sentence>
- **Build difficulty:** x/5
- **Conversion potential:** x/5
- **Hook line:** "<≤ 14 words>"

(repeat for 2-5)

**Start with this one:** #<n> — <one-line reasoning>`,
  ctaExamples: [
    { label: "Comment-to-DM", cta: "Comment 'PDF' and I'll DM you the link." },
    { label: "Bio link", cta: "Free download — link in bio." },
    { label: "Story-to-DM", cta: "Tap the sticker for the free template." },
  ],
  exampleOutput: `## 5 Lead Magnet Ideas

### 1. The "First 7 Emails" Cheat Sheet
- **Format:** 1-page PDF
- **What the lead gets:** Subject lines + 2-line bodies for the 7 emails every new seller should send week one.
- **Build difficulty:** 1/5
- **Conversion potential:** 5/5
- **Hook line:** "What to email your first 7 days, written out."

### 2. The "Reseller Rights Decoder" PDF
- **Format:** 2-page PDF
- **What the lead gets:** Plain-English breakdown of PLR vs MRR vs RR rights and what each lets you legally do.
- **Build difficulty:** 2/5
- **Conversion potential:** 4/5
- **Hook line:** "PLR vs MRR vs RR — without the legal headache."

### 3. The "Email Subject Line Swap" Template
- **Format:** Notion template
- **What the lead gets:** 30 boring subject lines paired with 30 better rewrites + the rule used.
- **Build difficulty:** 2/5
- **Conversion potential:** 4/5
- **Hook line:** "30 subject lines you're allowed to steal."

### 4. The "Will They Open?" 60-Second Quiz
- **Format:** Tally / Typeform quiz
- **What the lead gets:** 8 questions → personalized feedback on their next email subject line.
- **Build difficulty:** 4/5
- **Conversion potential:** 3/5
- **Hook line:** "60 seconds to find out if your email gets opened."

### 5. "First Sale in 7 Days" Mini-Course
- **Format:** 5-day email course
- **What the lead gets:** One short lesson per day on getting the first PLR sale.
- **Build difficulty:** 5/5
- **Conversion potential:** 5/5
- **Hook line:** "5 days to your first PLR sale (free)."

**Start with this one:** #1 — Lowest build cost (under 2 hours), highest conversion, and naturally bridges to the Email Vault offer.`,
};

// ----- 12. Launch plan -----
const T_LAUNCH: Template = {
  id: "launch_plan",
  number: "12",
  name: "7-Day Launch Plan",
  category: "Strategy",
  icon: "🚀",
  whatItDoes:
    "Builds a 7-day launch sprint: pre-launch warm-up, day-of, and post-launch follow-up. Each day has one main task and one main asset.",
  beginnerFriendlyNote:
    "Don't try to launch on every platform. Pick one. The plan assumes one channel — repeat it for each new launch.",
  inputFields: [
    { name: "product_name", required: true, example: "Sage & Save Membership" },
    { name: "product_description", required: true, example: "Monthly faith-based budgeting membership for one-income families." },
    { name: "target_audience", required: true, example: "Christian moms on one income" },
    { name: "offer_type", required: true, example: "subscription" },
    { name: "price", required: true, example: "$19/mo (first 14 days free)" },
    { name: "platform", required: true, example: "Instagram + email list" },
    { name: "cta", required: true, example: "Try the membership free for 14 days." },
  ],
  aiPrompt: `Build a 7-day launch plan for one offer on one primary platform.
- Days 1-3: warm-up (no selling, build curiosity).
- Day 4: official open.
- Days 5-6: social proof + objection handling.
- Day 7: deadline / close.
- Each day: ONE main task + ONE main asset (a post or email) with the actual hook + draft body (50-100 words).`,
  outputFormat: `## Day 1 — <theme>
- **Task:** <one line>
- **Asset (post / email / reel):**
  - **Hook:** <line>
  - **Body:** <50-100 words>
  - **CTA:** <line>

(repeat for Days 2-7)`,
  ctaExamples: [
    { label: "Free trial", cta: "Try the membership free for 14 days." },
    { label: "Cohort enrollment", cta: "Doors close Sunday at midnight." },
    { label: "Founder pricing", cta: "Lock in $9/mo founder pricing today only." },
  ],
  exampleOutput: `## Day 1 — Tease the why
- **Task:** Post a personal story about why you built this.
- **Asset (Reel):**
  - **Hook:** I'm building something I wish existed when I was crying in the Walmart parking lot.
  - **Body:** I was a Christian mom on one income, three apps deep, still broke. Tomorrow I'll share what I built — a small thing for moms who are tired of money anxiety. No selling today. Just want you to know it's coming.
  - **CTA:** Comment "TELL ME" so I remember to send you the details.

## Day 2 — Show the asset
- **Task:** Post a behind-the-scenes look at the product.
- **Asset (Carousel):**
  - **Hook:** Here's what's inside the thing I'm launching tomorrow.
  - **Body:** 6 slides showing the actual app/template, the weekly rhythms, what a day-1 user sees. Mention the price softly on slide 5. End on "doors open tomorrow."
  - **CTA:** Save this if you want a reminder.

## Day 3 — Address the fear
- **Task:** Email the list with the #1 hesitation.
- **Asset (Email):**
  - **Subject:** "Will this work if I'm not great with money?"
  - **Body:** Last week a mom asked me this. Here's what I told her: this isn't built for people who are great with money. It's built for the moms who feel anxious despite tracking everything. If that's you, you're the exact person I had in mind. Doors open tomorrow at 9am. Reply if you have a question first.
  - **CTA:** Reply with your money question.

## Day 4 — Doors open
- **Task:** Open enrollment. Post + email + story.
- **Asset (Post + Email):**
  - **Hook:** It's open. Free for 14 days, $19/mo after.
  - **Body:** Sage & Save Membership is live. The first 14 days are free so you can see if it actually fits your family. Cancel before day 14 and you won't be charged. After: $19/mo. That's the whole pitch.
  - **CTA:** Try the membership free for 14 days.

## Day 5 — Social proof
- **Task:** Share the first member's experience (with permission) or your own week-1 walkthrough.
- **Asset (Reel):**
  - **Hook:** First 24 hours. Here's what one mom did with the membership.
  - **Body:** 60-second walkthrough of the most-used feature so far + a screenshot quote from a real member. Frame as "if you've been on the fence, this is what your week 1 could look like."
  - **CTA:** Try the membership free for 14 days.

## Day 6 — Objection day
- **Task:** Email the most-asked question from comments.
- **Asset (Email):**
  - **Subject:** "What if I forget to cancel?"
  - **Body:** Real concern, asked 14 times this week. Here's what we do: I'll personally email you on day 12 to remind you. If membership isn't a fit, just reply "cancel" and we'll handle it. No hoops, no upsells.
  - **CTA:** Try the membership free for 14 days.

## Day 7 — Close
- **Task:** Final post + final email. Make the deadline real.
- **Asset (Story sequence + Email):**
  - **Hook:** Free trial offer ends tonight at midnight.
  - **Body:** After tonight the membership stays $19/mo, but the 14-day free trial goes away for new sign-ups. If you've been waiting, this is the moment.
  - **CTA:** Try the membership free for 14 days.`,
};

// ----- 13. Hook generator -----
const T_HOOK: Template = {
  id: "hook_generator",
  number: "13",
  name: "Hook Generator",
  category: "Short-form video",
  icon: "🪝",
  whatItDoes:
    "Generates 10 hook variations for a single piece of content, sorted by pattern. Use them as A/B tests, on-screen text, or first lines.",
  beginnerFriendlyNote:
    "The same content with a different hook can do 10× the views. Always generate 5-10 hooks before posting.",
  inputFields: [
    { name: "topic", required: true, example: "Why my $7 PDF outsold my $97 course" },
    { name: "target_audience", required: true, example: "Beginner digital product sellers" },
    { name: "platform", required: true, example: "TikTok", help: "TikTok | Reel | Shorts | IG caption | Email subject" },
  ],
  aiPrompt: `Generate exactly 10 hooks for the topic, distributed across 6 patterns:
1. Curiosity gap
2. Contrarian
3. Specific number
4. Mistake callout
5. Question-then-answer
6. Direct address ("If you sell X, watch this.")

Constraints by platform:
- TikTok / Shorts: ≤ 12 words
- Reel: ≤ 14 words
- IG caption line 1: ≤ 90 characters
- Email subject: ≤ 50 characters

Banned: "Hey guys", brand names in the hook, more than one exclamation mark.`,
  outputFormat: `## 10 Hooks for: <topic>

### Curiosity gap
1. <hook>
2. <hook>

### Contrarian
3. <hook>
4. <hook>

### Specific number
5. <hook>
6. <hook>

### Mistake callout
7. <hook>

### Question-then-answer
8. <hook>

### Direct address
9. <hook>
10. <hook>

**Recommended pick:** #<n> — <one-line reasoning>`,
  ctaExamples: [
    { label: "A/B test", cta: "Pick 3 hooks and post the same content with each over 3 days." },
    { label: "Carousel slide 1", cta: "Use the recommended hook as your carousel cover slide." },
  ],
  exampleOutput: `## 10 Hooks for: Why my $7 PDF outsold my $97 course

### Curiosity gap
1. My $7 PDF outsold my $97 course. Not a typo.
2. The cheaper product made more. Here's the boring reason.

### Contrarian
3. Stop pricing your first product like a course.
4. The "low-ticket bad" advice is killing beginner sales.

### Specific number
5. $7 product, $4,200 in 9 weeks. Here's how.
6. 612 sales of a $7 PDF vs 11 of a $97 course.

### Mistake callout
7. If your first product is over $50, you priced wrong.

### Question-then-answer
8. Why do cheap products sell more? Friction, not price.

### Direct address
9. If you sell digital products under $100, watch this.
10. Beginner sellers — your price isn't the problem.

**Recommended pick:** #5 — Specific numbers + a clean curiosity gap. Travels well as both a TikTok hook AND a carousel cover.`,
};

// ----- 14. Objection handling post -----
const T_OBJECTION: Template = {
  id: "objection_handling_post",
  number: "14",
  name: "Objection Handling Post",
  category: "Sales copy",
  icon: "🛡️",
  whatItDoes:
    "Writes a single post that addresses ONE specific buyer objection without sounding defensive. Works as a Reel, carousel, or email.",
  beginnerFriendlyNote:
    "Objection posts are some of the highest-converting content you can post. Listen to your DMs — every repeated question is a post idea.",
  inputFields: [
    { name: "product_name", required: true, example: "Beginner Affiliate Bootcamp" },
    { name: "objection", required: true, example: "I don't have an audience yet — will this work?" },
    { name: "target_audience", required: true, example: "9-5 employees, no audience" },
    { name: "offer_type", required: true, example: "course" },
    { name: "cta", required: true, example: "Enroll now — link in bio." },
  ],
  aiPrompt: `Write a post that handles ONE buyer objection. Format works as a Reel script, a carousel, or an email.
- Acknowledge the objection in line 1 — using the buyer's actual words.
- Validate it (don't dismiss). One sentence.
- Reframe with a concrete fact, story, or number that flips the concern.
- Show what the next 7 days look like for the buyer despite the objection.
- ONE soft CTA. Use {{cta}} verbatim.
- Total: 100-150 words. No hype, no exclamation marks.`,
  outputFormat: `**Hook:** <objection in buyer's voice>

**Body:**
<paragraph that validates>

<paragraph that reframes>

<paragraph that shows the next 7 days>

**CTA:** <one line>`,
  ctaExamples: [
    { label: "Soft", cta: "If that helps, enrollment is open — link in bio." },
    { label: "Direct", cta: "Enroll now — link in bio." },
    { label: "Q&A invite", cta: "Reply with your version of this objection — I'll address it." },
  ],
  exampleOutput: `**Hook:** "I don't have an audience yet — will this work?"

**Body:**
Real concern. The internet has trained you to think you need 10,000 followers before you can sell anything.

You don't. Day 1 of Bootcamp is built for zero followers — the first task is choosing a niche where you can be useful in DMs and small comment sections, not viral feeds. The students who made commissions fastest had under 200 followers when they started.

Here's what your next 7 days look like inside: pick a sub-niche, write a 200-word "what I'm trying" post, send 5 thoughtful DMs to creators in your space, and post one helpful answer per day in a Facebook group. That's the program. No audience required.

**CTA:** If that helps, enrollment is open — link in bio.`,
};

// ----- 15. Trust-building post -----
const T_TRUST: Template = {
  id: "trust_building_post",
  number: "15",
  name: "Trust-Building Post",
  category: "Sales copy",
  icon: "🤝",
  whatItDoes:
    "Writes a personal-but-strategic post that builds trust through honesty, not hype. Shares a real moment, a real number, or a real mistake.",
  beginnerFriendlyNote:
    "Trust posts are not 'lifestyle posts'. They have a clear purpose: prove you're a real person who's been where the reader is.",
  inputFields: [
    { name: "business_name", required: true, example: "Sage & Save" },
    { name: "target_audience", required: true, example: "Christian moms on one income" },
    { name: "personal_moment_or_number", required: true, example: "The night I cried over a $284 Walmart receipt", help: "A real moment, real number, or real mistake from your story." },
    { name: "offer_type", required: true, example: "subscription" },
    { name: "cta", required: false, example: "If you've been there too, the free PDF is in my bio." },
  ],
  aiPrompt: `Write a trust-building post.
- Lead with the specific moment/number/mistake provided. No abstraction.
- Show what was happening in the room (sensory: where you were, what you saw, what you said).
- Show the small thing you tried that didn't work.
- Show the boring change you made.
- End with a soft, optional invitation. CTA is provided OR omit it entirely.
- Total: 120-200 words. Conversational, no hype.`,
  outputFormat: `**Hook (line 1):** <≤ 90 chars>

**Body:**
<scene-setting paragraph>

<what didn't work paragraph>

<the boring change paragraph>

**CTA (optional):** <one soft line, or omit>`,
  ctaExamples: [
    { label: "Soft invitation", cta: "If you've been there too, the free PDF is in my bio." },
    { label: "Save-and-share", cta: "Save this for the next mom who needs it." },
    { label: "No CTA", cta: "(no CTA — let the story breathe)" },
    { label: "DM trigger", cta: "If this lands, just send a 🩷 — I'll know you're out there." },
  ],
  exampleOutput: `**Hook (line 1):** December 2022. Walmart parking lot. $284 receipt. Crying.

**Body:**
We had three budgeting apps on my phone. I tracked every penny. I couldn't explain how the grocery bill kept ending in 84. My husband was at the wheel pretending to scroll so I could cry without an audience.

I tried color-coded categories, the envelope method, the apps that nudge you. None of them worked because they all assumed our income was steady. It wasn't. We were one variable-income family pretending to be a salary one.

The change wasn't another app. It was a single question: "what does our worst month look like?" — and budgeting backwards from that. Took 90 minutes on a Saturday. Took the panic out of every Sunday since.

**CTA (optional):** If you've been there too, the free PDF is in my bio.`,
};

// ----------- Export -----------
export const templates: Template[] = [
  T_TIKTOK,
  T_FB_REEL,
  T_IG_CAPTION,
  T_YT_SHORTS,
  T_PROD_DESC,
  T_SALES_PAGE,
  T_EMAIL_SEQ,
  T_DM,
  T_PLAN,
  T_OFFER_ANALYSIS,
  T_LEAD_MAGNET,
  T_LAUNCH,
  T_HOOK,
  T_OBJECTION,
  T_TRUST,
];

export const templateCategories = [
  "Short-form video",
  "Social copy",
  "Sales copy",
  "Email",
  "Strategy",
  "Engagement",
] as const;
