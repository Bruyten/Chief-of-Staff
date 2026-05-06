# Deploy Guide — For Non-Developers

> Goal: Get Chief of Staff live on the internet in **under 30 minutes**, even if you've never deployed an app before. No coding required.

This guide assumes you've never used Render. We'll go step-by-step, with screenshots in mind. Every action lives in your browser — no terminal commands.

---

## Before you start

You need:

- ✅ A **GitHub** account ([sign up free](https://github.com/signup))
- ✅ A **Render** account ([sign up free](https://dashboard.render.com/register))
- ⏳ ~30 minutes
- ❌ **No** OpenAI key needed yet (we'll use FAKE_AI mode first)
- ❌ **No** Stripe account needed yet (we'll use FAKE_STRIPE mode first)
- ❌ **No** credit card needed (Render's free tier covers everything below)

---

## Part 1 — Get the code into your GitHub (5 min)

1. Open the Chief of Staff repo on GitHub.
2. Click **Fork** (top-right corner).
3. Confirm the fork. Now there's a copy under your username: `github.com/YOUR_USERNAME/chief-of-staff`.

That's it for Part 1. The code is now in your account. Render will read from this fork.

---

## Part 2 — Connect Render to GitHub (3 min)

1. Go to <https://dashboard.render.com>.
2. In the left sidebar, click **Settings → GitHub**.
3. Click **Configure** under "GitHub apps".
4. Choose your account.
5. Either select **All repositories** or specifically **chief-of-staff**.
6. Click **Save**.

Render can now see your fork.

---

## Part 3 — Deploy with one click (Blueprint) (5 min)

This is the magic step. Render reads `render.yaml` from your repo and provisions everything automatically.

1. Render dashboard → **New +** (top right) → **Blueprint**.
2. Find **chief-of-staff** in the list. Click it.
3. Render will scan the repo and find `render.yaml`. It'll show you 3 things it's about to create:
   - 🟢 **chief-of-staff-db** — PostgreSQL database (free tier)
   - 🟢 **chief-of-staff-api** — Web Service (the backend)
   - 🟢 **chief-of-staff-web** — Static Site (the frontend)
4. Give the blueprint a name (anything works, e.g. "Chief of Staff").
5. Click **Apply**.

Render now creates all three services. **This takes 5-10 minutes for the first deploy** — go grab a coffee.

While it's building, you can move on to Part 4.

---

## Part 4 — Set the one required secret (2 min)

There's exactly **one** thing you must set manually: a JWT secret. Render can generate it for you.

1. While the blueprint is deploying, click on the **chief-of-staff-api** service.
2. Click **Environment** in the left sidebar.
3. Find `JWT_SECRET` in the list — it'll show "🔒 Sync: false".
4. Click **Edit** → click **Generate** → click **Save changes**.

> **Don't have a Generate button?** Open a new browser tab → <https://generate-secret.vercel.app/64> → copy the string → paste it as the value.

Render will redeploy the API automatically. ~1 minute.

That's the only required setting. Everything else has safe defaults.

---

## Part 5 — Verify your live app (3 min)

1. Go back to the Render dashboard.
2. Click the **chief-of-staff-web** service.
3. At the top, you'll see a URL like `https://chief-of-staff-web.onrender.com`. **Click it.**
4. The Chief of Staff spec site loads.
5. Click the **App** tab (rightmost).
6. Click the toggle to **🟢 Live API**.
7. Sign up with any email + password.

🎉 **You're live.** You can now create projects, generate marketing copy (returns canned demo content because FAKE_AI is on), save outputs, edit them, delete them.

---

## Part 6 (optional) — Going live with real AI (5 min)

When you're ready to use real OpenAI instead of canned fake responses:

1. Get an OpenAI API key from <https://platform.openai.com/api-keys>. Click **Create new secret key**. Copy the `sk-...` string. **You will not see it again** — paste it somewhere safe immediately.
2. Render dashboard → **chief-of-staff-api** → **Environment**.
3. Find `OPENAI_API_KEY` → Edit → paste your key → Save.
4. Find `FAKE_AI` → change value to `false` → Save.
5. Render redeploys automatically (~1 minute).

Now every generation in your app calls real GPT-4o-mini. Cost: roughly **$0.0002 per generation** (you'd need 5,000 generations to spend $1).

> **Tip:** Start with a $5 prepaid limit on your OpenAI account. Settings → Limits → Set monthly limit. Prevents any runaway costs.

---

## Part 7 (optional) — Going live with Stripe (15 min)

Until you do this, the Pricing page in the app simulates upgrades. To take real money:

### 7a. Set up products in Stripe (10 min)

1. Sign up free at <https://dashboard.stripe.com/register>.
2. **Stay in test mode** at first (toggle top-right of Stripe dashboard).
3. **Products** → **Add product**:
   - **Name:** "Starter"
   - **Pricing:** Recurring, $19.00 USD, monthly
   - Save. **Copy the Price ID** that starts with `price_…`. Save it somewhere.
4. Repeat for **Pro** ($49) and **Agency** ($99). You should now have 3 Price IDs.
5. **Developers → API keys** → copy your **Secret key** (`sk_test_…`). Save it.

### 7b. Configure the webhook in Stripe (3 min)

1. **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://YOUR-API-URL.onrender.com/api/webhooks/stripe`
   (replace YOUR-API-URL with your actual Render API URL).
3. **Events to send:** select these 4:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Save. Then click your new endpoint → reveal the **Signing secret** (`whsec_…`). Save it.

### 7c. Add the keys to Render (2 min)

Render dashboard → **chief-of-staff-api** → **Environment**. Set these all to your values:

| Variable | Value |
|---|---|
| `FAKE_STRIPE` | `false` |
| `STRIPE_SECRET_KEY` | `sk_test_…` (from 7a step 5) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (from 7b step 4) |
| `STRIPE_PRICE_STARTER` | `price_…` for $19 plan |
| `STRIPE_PRICE_PRO` | `price_…` for $49 plan |
| `STRIPE_PRICE_AGENCY` | `price_…` for $99 plan |

Save. Render redeploys.

### 7d. Test with the test card

Open your live app → Pricing → choose Pro. You'll be redirected to real Stripe Checkout.

Test card: `4242 4242 4242 4242` — any future expiry, any 3-digit CVC, any ZIP.

After payment, you're redirected back. Within seconds, your plan upgrades, your credits jump to 500, and the webhook log in Stripe shows ✅.

### 7e. Going to live mode (real money)

Only after everything works in test mode:

1. In the Stripe dashboard, toggle from **Test mode** to **Live mode** (top right).
2. Re-create your 3 products in live mode. **Copy the new Price IDs** — they're different from test.
3. Get your **live Secret key** (`sk_live_…`).
4. Set up a **new** webhook endpoint in live mode pointing to the same URL.
5. Update the same env vars in Render with the **live** values.

Now real customers can pay you real money. 🎉

---

## Troubleshooting

### "Service won't start — fails on boot"

Render → API service → **Logs**. Look for `❌ Invalid environment variables`. The log will tell you exactly which env var is missing or malformed. Most common: forgot to set `JWT_SECRET`.

### "I get CORS errors in the browser console"

The frontend is calling the wrong API URL. In Render → **chief-of-staff-web** → **Environment**, make sure `VITE_API_URL` matches your actual API service URL (e.g. `https://chief-of-staff-api.onrender.com` — no trailing slash).

After fixing, **trigger a new deploy** of the frontend (Render only re-bakes the URL into the static bundle on rebuild). Manual Deploy → **Clear build cache & deploy**.

### "Sign-in works but the dashboard is empty / 401 errors"

The cookie isn't being sent. Two common causes:
1. `CLIENT_ORIGIN` on the API service doesn't match the frontend URL exactly. Fix and redeploy API.
2. You're hitting the API over `http://` instead of `https://`. Make sure both URLs are HTTPS.

### "Render shows my service spinning down"

Free-tier Web Services on Render sleep after 15 min of inactivity. First request after sleep takes ~30 seconds to wake up. Either:
- Live with it (fine for early users / personal use)
- Upgrade the API service to **Starter** ($7/mo) — keeps it warm 24/7
- Set up a free uptime monitor (e.g. UptimeRobot) to ping `/health` every 5 min

### "Stripe webhook returns 'Bad signature'"

Either `STRIPE_WEBHOOK_SECRET` is wrong, OR you're hitting the test endpoint with live keys (or vice versa). Stripe → Developers → Webhooks → click your endpoint → **Signing secret** → make sure it matches what's in Render. Test mode and live mode have **different** webhook secrets.

### "I want to delete everything and start over"

Render dashboard → each service → **Settings → Delete service**. Delete the database last. Your code on GitHub is untouched.

---

## What you have now

- ✅ A live, public URL anyone can sign up at
- ✅ Auto-deploy on every `git push` to your fork's main branch
- ✅ Free tier covers everything until you have real users
- ✅ One env var change away from real AI
- ✅ One env var change away from real billing

**Total monthly cost so far:** $0.

When you outgrow free tier:

| When | What | Cost |
|---|---|---|
| Service spins down too often | Upgrade API to Starter | +$7/mo |
| Need >100 db connections | Upgrade Postgres to Starter | +$7/mo |
| Real OpenAI usage | Pay per generation | ~$0.0002 each |
| Real Stripe payments | Stripe takes 2.9% + 30¢ | (you make money first) |

---

## What's next

1. **Get 10 users** (friends, communities, your own audience). Free plan = 5 generations.
2. **Read what they make.** The 15 generators are built on opinionated prompts — improvements come from real usage, not guessing.
3. **Watch the credits hit.** When users hit the 5/month cap and ask for more → add Stripe (Part 7) → first revenue.
4. **Then think about integrations.** The roadmap (Int tab in the spec site) ranks 11 of them by value vs effort.

You're not building "the next big SaaS." You're building a tool that solves a real problem for solo founders. The architecture is ready for the long road. The hardest part is done.

Good luck. 🚀
