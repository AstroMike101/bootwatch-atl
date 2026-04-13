# ATL BootWatch

Crowdsourced boot and parking enforcement map for Atlanta. See where cars are being booted, check lots before you park, and report boots in real time.

**Live at:** [your-url-here]

---

## What it does

- **Map** — live boot reports across Atlanta, color-coded by type, with a heatmap density layer
- **Search** — type any address or lot name and get an instant risk score before you park
- **Reports** — scrollable feed of the last 72 hours of boot activity
- **Companies** — profiles on Atlanta's major enforcement companies with complaint history and your legal rights
- **Report** — submit a boot in under 30 seconds with location, photo, and company info

---

## Tech stack

- **Next.js 14** — app framework
- **Supabase** — Postgres database + file storage for photos
- **Google Maps** — map, pins, heatmap, address autocomplete
- **Vercel** — hosting

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Create `.env.local` and add:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key
```

Google Maps key needs these APIs enabled:
- Maps JavaScript API
- Places API
- Geocoding API

### 3. Database
Run these SQL files in order in the Supabase SQL Editor:
1. `supabase-setup.sql` — creates tables, indexes, and RLS policies
2. `lots-migration.sql` — adds lot profiles and risk score calculation
3. `spam-protection.sql` — rate limiting triggers
4. `photos-migration.sql` — adds photo storage support
5. `real-seed-data.sql` — seeds real Atlanta companies and known hotspot lots

### 4. Storage bucket
In Supabase Dashboard → Storage → New bucket:
- Name: `report-photos`
- Public: on

### 5. Run locally
```bash
npm run dev
```

> Note: geolocation requires HTTPS. The locate button won't work on a local IP — use localhost or deploy to Vercel to test on mobile.

---

## Deploy

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add the three environment variables in Vercel's dashboard
4. Deploy — you get an HTTPS URL instantly, geolocation works

---

## Data

- Reports expire from the map after **72 hours**
- Lot risk scores are calculated from boot volume + recency (0–100 scale)
- Company stats update automatically via Postgres triggers when new reports are submitted
- Spam protection limits 3 reports per IP per km per hour at the DB level, plus a 10-minute client-side cooldown

---

## Built by

**Michael Chen** — [michaelchen.live](https://michaelchen.live) · michaelchendevs@gmail.com

If BootWatch has saved you from a boot, consider [buying me a coffee](https://buymeacoffee.com/michaelchen).

---

## Legal context

Atlanta's booting ordinance (effective 2018) requires:
- Clear signage at every lot entrance before booting is legal
- Boot removal within 1 hour of payment (5am–10pm)
- Written identification for all booting company representatives
- Fee cap of $75 per boot

There are approximately 100,000 private boots placed in Georgia each year. Atlanta is one of only a handful of cities in the state that authorizes private booting on private property.