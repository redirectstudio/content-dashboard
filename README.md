# Content Dashboard — Redirect Studio
**Real-time analytics across all 3 avatars and 5 platforms.**

---

## What This Is

A full web app that auto-syncs every 6 hours and shows you:
- **6 KPI cards** — Views, Reach, Engagement Rate, Followers, Shares, Saves (each with % change vs. prior period + sparkline)
- **Views & Reach area chart** — time series over your selected range
- **Engagement breakdown bar chart** — likes, comments, shares, saves by day
- **Top Posts table** — sortable by any metric, with thumbnails and platform badges
- **Filters** — by Platform (Instagram / Facebook / Threads / YouTube / TikTok), Avatar, and Time Range (7d / 14d / 30d / 90d)

**Platforms:** Instagram ✅ · Facebook ✅ · Threads ✅ · YouTube ✅ · TikTok ⚠️ (requires dev approval — instructions below)

---

## Setup Checklist

### STEP 1 — Install Dependencies

You need Node.js 18+ on your machine. If you don't have it: nodejs.org.

```bash
cd content-dashboard
npm install
```

---

### STEP 2 — Set Up Supabase (5 minutes)

1. Go to **supabase.com** → click "Start your project" → sign up
2. Click **"New Project"** → name it `content-dashboard` → save your database password
3. Wait ~30 seconds for it to spin up
4. In the left sidebar → click **"SQL Editor"**
5. Copy the entire contents of `supabase/schema.sql` → paste into the editor → click **Run**
6. In the left sidebar → click **"Project Settings"** → **"API"**
7. Copy:
   - **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret key** → this is your `SUPABASE_SERVICE_ROLE_KEY`

---

### STEP 3 — Get Instagram + Facebook + Threads Tokens (per avatar)

**You have an existing Meta Developer App — great. Here's what to do per avatar:**

#### 3a. Get your Instagram Business Account ID
1. Go to **developers.facebook.com/tools/explorer/**
2. Select your Meta app
3. Click **"Get Token"** → **"Get User Access Token"**
4. Check all these permissions:
   - `instagram_basic`
   - `instagram_manage_insights`
   - `pages_show_list`
   - `pages_read_engagement`
   - `read_insights`
   - `threads_basic` (for Threads)
   - `threads_manage_insights` (for Threads)
5. Click **"Generate Access Token"** → authorize

#### 3b. Find your Instagram Account ID
In the Graph API Explorer, run:
```
GET /me/accounts
```
This returns your connected Facebook Pages. For each page, run:
```
GET /{page-id}?fields=instagram_business_account
```
The `instagram_business_account.id` is your `INSTAGRAM_ACCOUNT_ID`.

Your `FACEBOOK_PAGE_ID` is the page ID from `/me/accounts`.

For `THREADS_ACCOUNT_ID`, run:
```
GET https://graph.threads.net/v1.0/me?access_token=YOUR_TOKEN
```

#### 3c. Convert to a Long-Lived Token
Short-lived tokens expire in 1 hour. Convert each one:
```
GET https://graph.facebook.com/v19.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={your-app-id}
  &client_secret={your-app-secret}
  &fb_exchange_token={short-lived-token}
```
This gives you a token valid for 60 days. Put it in `META_LONG_LIVED_TOKEN_1` (and 2, 3 for each avatar).

---

### STEP 4 — Get YouTube API Key (10 minutes)

1. Go to **console.cloud.google.com** → sign in with the Google account that owns your YouTube channels
2. Click the project dropdown at the top → **"New Project"** → name it `content-dashboard`
3. In the left sidebar → **"APIs & Services"** → **"Library"**
4. Search for **"YouTube Data API v3"** → click it → **"Enable"**
5. Go to **"APIs & Services"** → **"Credentials"** → **"Create Credentials"** → **"API key"**
6. Copy the key — this is your `YOUTUBE_API_KEY`

**Finding your Channel IDs:**
- Go to youtube.com → click your avatar's channel → look at the URL
- It's either `youtube.com/channel/{CHANNEL_ID}` or you can find it in YouTube Studio → Settings → Channel → Advanced

---

### STEP 5 — TikTok (requires approval — do this when ready)

1. Go to **developers.tiktok.com** → create a developer account
2. Create a new app → select **"Content Posting API"** and **"Research API"**
3. Submit for review (1–5 business days)
4. Once approved → go through OAuth to get your access tokens
5. Fill in `TIKTOK_ACCESS_TOKEN_1/2/3` and `TIKTOK_OPEN_ID_1/2/3`

The dashboard will work perfectly without TikTok — it just skips those accounts when credentials are missing.

---

### STEP 6 — Create Your .env File

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in all the values you've collected above. The `.env.local` file is gitignored — it never gets pushed.

For the `CRON_SECRET`, generate a random string:
```bash
openssl rand -hex 32
```

For `NEXT_PUBLIC_AVATAR_1_NAME` etc — put your actual avatar names (whatever you call them internally).

---

### STEP 7 — Test Locally

```bash
npm run dev
```

Open **http://localhost:3000** — you should see the dashboard.

Trigger a manual sync by clicking **"Sync Now"** in the dashboard, or by running:
```bash
curl -X POST http://localhost:3000/api/sync
```

If you see data flowing in — you're good. If not, check the terminal for error messages.

---

### STEP 8 — Deploy to Vercel

1. **Push to GitHub:**
   - Create a new repo at github.com
   - In your terminal: `git init && git add . && git commit -m "initial build" && git remote add origin {your-repo-url} && git push`

2. **Connect Vercel:**
   - Go to **vercel.com** → sign in with GitHub
   - Click **"Add New Project"** → select your `content-dashboard` repo
   - Vercel auto-detects Next.js. Click **"Deploy"**

3. **Add environment variables in Vercel:**
   - In your Vercel project → **Settings** → **Environment Variables**
   - Add every variable from your `.env.local` file
   - **Important:** also add `CRON_SECRET` here

4. **Redeploy** (Vercel only picks up env vars on next deploy):
   - In Vercel → **Deployments** → click the three dots on your latest deploy → **"Redeploy"**

5. **Verify:** Open your Vercel URL. The cron job in `vercel.json` will auto-trigger every 6 hours.

---

## Architecture

```
content-dashboard/
├── app/
│   ├── page.jsx              ← Main dashboard (React client)
│   ├── layout.jsx
│   ├── globals.css
│   └── api/
│       ├── sync/route.js     ← Triggered by Vercel cron + "Sync Now" button
│       └── analytics/route.js← Serves data to the frontend
├── components/
│   ├── KPICard.jsx           ← Each KPI card with sparkline
│   ├── SparklineChart.jsx
│   ├── Charts.jsx            ← Views/Reach + Engagement charts
│   ├── PostsGrid.jsx         ← Top posts table
│   ├── FilterBar.jsx         ← Platform / Avatar / Period filters
│   └── PlatformBadge.jsx
├── lib/
│   ├── supabase.js           ← Supabase client (anon + admin)
│   ├── analytics.js          ← All data queries (KPIs, time series, posts)
│   └── sync/
│       ├── index.js          ← Orchestrator — runs all platforms in parallel
│       ├── instagram.js      ← Instagram Graph API
│       ├── facebook.js       ← Facebook Graph API
│       ├── threads.js        ← Threads API
│       ├── youtube.js        ← YouTube Data API v3
│       └── tiktok.js         ← TikTok Business API (pending approval)
├── supabase/
│   └── schema.sql            ← Run once in Supabase SQL Editor
├── vercel.json               ← Cron: runs /api/sync every 6 hours
└── .env.example              ← Copy to .env.local and fill in
```

---

## Credentials You Need

| Credential | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `META_APP_ID` | developers.facebook.com → your app |
| `META_APP_SECRET` | developers.facebook.com → your app → Settings → Basic |
| `META_LONG_LIVED_TOKEN_1/2/3` | Graph API Explorer → exchange for long-lived |
| `INSTAGRAM_ACCOUNT_ID_1/2/3` | Graph API: `/me/accounts` → `instagram_business_account.id` |
| `FACEBOOK_PAGE_ID_1/2/3` | Graph API: `/me/accounts` → page ID |
| `THREADS_ACCOUNT_ID_1/2/3` | `graph.threads.net/v1.0/me` |
| `YOUTUBE_API_KEY` | Google Cloud Console → Credentials |
| `YOUTUBE_CHANNEL_ID_1/2/3` | YouTube Studio → Settings → Channel → Advanced |
| `TIKTOK_ACCESS_TOKEN_1/2/3` | TikTok Developer Portal (requires approval) |
| `TIKTOK_OPEN_ID_1/2/3` | TikTok Developer Portal (requires approval) |
| `CRON_SECRET` | Generate: `openssl rand -hex 32` |

---

## Troubleshooting

**"No data showing"** → Click "Sync Now" to trigger the first sync manually. Check browser console and Vercel logs for API errors.

**Instagram API errors** → Make sure your Instagram account is a **Business** or **Creator** account (not personal), and is connected to a Facebook Page.

**Token expiring** → Long-lived tokens last 60 days. Refresh them before they expire via the Graph API or build a token refresh endpoint. Add a calendar reminder.

**TikTok shows 0 posts** → Expected until you get TikTok developer approval. Everything else will work fine.

**Rate limits** → Instagram allows ~200 calls/hour per token. With 3 avatars syncing every 6h, you're well within limits.
