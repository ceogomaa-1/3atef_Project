# 3atef — AI Event & Hotel Intelligence Agent

An AI-powered SaaS tool that evaluates international expo events for financial viability by comparing vendor hotel pricing against live market prices.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + custom shadcn/ui components
- **AI**: OpenAI GPT-4o (policy analysis)
- **Scraping**: Playwright (Booking.com)
- **Excel**: SheetJS/xlsx
- **PDF**: @react-pdf/renderer
- **Hosting**: Vercel

## Setup

### 1. Supabase Schema

Run the SQL in `supabase/schema.sql` (or from the prompt) in your Supabase SQL editor.

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/dashboard`.

## MVP Flow

1. Go to `/dashboard/upload`
2. Fill in event details (name, city, country, type)
3. Upload your vendor hotel pricing Excel file
4. Click **Run Full Intelligence Pipeline**
5. Watch the system:
   - Parse vendor prices from Excel
   - Scrape live market prices from Booking.com
   - Compare market vs vendor
   - Analyze booking policies via GPT-4o
   - Run the approval engine (3 hotels ≥ $4 cheaper = APPROVED)
   - Generate a downloadable PDF report
6. View results on the event detail page

## Approval Rule

> If at least **3 hotels** have a live market price cheaper than the vendor price by **≥ $4.00**, the event is **AUTO-APPROVED**. Otherwise → **REJECTED**.

## Project Structure

```
app/
  api/          # All backend API routes (Next.js Route Handlers)
  dashboard/    # All frontend pages
lib/
  agents/       # Excel, Hotel scraper, Pricing, Policy, Reporting
  core/         # Pipeline orchestrator, Approval engine, Scoring engine
  supabase/     # Client + server Supabase clients
components/     # UI components (dark theme)
```

## Deploying to Vercel

```bash
vercel deploy
```

Add all `.env.local` vars to Vercel project settings. Playwright on Vercel uses the system Chromium — ensure `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` is NOT set in Vercel env, or install `playwright-chromium` as a production dependency.
