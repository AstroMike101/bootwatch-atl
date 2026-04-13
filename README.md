# BootWatch ATL

Crowdsourced boot & parking enforcement map for Atlanta.

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Add your API keys
Copy the example env file and fill in your real keys:
```bash
cp .env.local.example .env.local
```

Open `.env.local` and replace the placeholder values:
- **Supabase URL + Anon Key** → supabase.com > your project > Settings > API
- **Google Maps Key** → console.cloud.google.com > APIs & Services > Credentials
  - Enable: Maps JavaScript API, Places API, Geocoding API

### 3. Set up Supabase database
In your Supabase project, go to SQL Editor and run the queries in `supabase-setup.sql`

### 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000

---

## Deploy to Vercel (free)

1. Push this folder to a GitHub repo
2. Go to vercel.com, click "New Project", import your repo
3. Add your environment variables in Vercel's dashboard (same keys as .env.local)
4. Deploy — done. You get a live URL instantly.

---

## File structure

```
src/
  app/
    page.tsx          ← Main shell, tab routing
    layout.tsx        ← HTML head, fonts, viewport
    globals.css       ← Global styles
  components/
    MapView.tsx       ← Google Maps, pins, bottom sheet feed
    ReportView.tsx    ← 2-step report form
    CompaniesView.tsx ← Company directory
    ui/
      BottomNav.tsx   ← Bottom tab bar
  lib/
    supabase.ts       ← Database client
    data.ts           ← All data fetching functions
  types/
    index.ts          ← TypeScript types
```
