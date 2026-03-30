# RoamCeylon Admin Dashboard

The internal admin dashboard for the **RoamCeylon** platform. Built with Next.js 16 (App Router), it provides real-time observability into AI planner metrics, user engagement signals, system health, and ML-driven personalized recommendations.

---

## Tech Stack

| Layer      | Technology              | Version  |
| ---------- | ----------------------- | -------- |
| Framework  | Next.js (App Router)    | 16.1.6   |
| UI Library | React                   | 19.2.3   |
| Charts     | Recharts                | ^3.7.0   |
| Icons      | Lucide React            | ^0.575.0 |
| Styling    | Tailwind CSS            | ^4       |
| Language   | TypeScript              | ^5       |
| Font       | Geist (via `next/font`) | —        |

---

## Project Structure

```
apps/admin/
├── app/
│   ├── layout.tsx                    # Root layout — Geist font, dark mode support
│   ├── globals.css                   # Global CSS resets and Tailwind base
│   ├── page.tsx                      # Login page → redirects to /admin/analytics
│   └── admin/
│       └── analytics/
│           └── page.tsx              # Main analytics dashboard (server component)
│
├── components/
│   ├── DashboardRefresh.tsx          # Auto-refresh button (client component)
│   ├── SystemHealthMonitor.tsx       # Real-time health badge (client component)
│   ├── charts/
│   │   ├── LineChart.tsx             # Recharts line chart wrapper
│   │   ├── BarChart.tsx              # Recharts bar chart wrapper
│   │   └── Sparkline.tsx             # Mini inline sparkline for metric cards
│   ├── ui/
│   │   └── MetricCard.tsx            # Reusable stat card with icon, trend, sparkline
│   └── recommendations/
│       └── PersonalizedRecommendations.tsx  # ML recommendation display (skeleton-ready)
│
├── hooks/
│   └── useAnalyticsTracker.ts        # Non-blocking engagement event tracking hook
│
└── lib/
    └── api.ts                        # All backend API fetch functions and TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- The RoamCeylon backend running on `http://127.0.0.1:3001` (or set `NEXT_PUBLIC_API_URL`)

### Environment Variables

Create a `.env.local` file in this directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
```

### Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — this shows the login page, which navigates to the analytics dashboard.

### Other Commands

```bash
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
npx tsc --noEmit  # TypeScript type-check only
```

---

## Pages

### `/` — Login Page

`app/page.tsx`

Branded sign-in page for the admin portal. Submits to `/admin/analytics`. Dark/light mode aware with glassmorphism background blobs.

### `/admin/analytics` — Analytics Dashboard

`app/admin/analytics/page.tsx`

The core admin view. A **pure Next.js server component** with `revalidate = 60` (ISR — refreshes every 60 seconds). All four backend fetches run in `Promise.all()` for maximum throughput. Each fetch fails independently and gracefully degrades to `null` — the page never crashes due to a backend outage.

**Sections rendered:**

| Section                      | Data Source                            | Fallback              |
| ---------------------------- | -------------------------------------- | --------------------- |
| Warning Banners              | Computed from thresholds               | Hidden if all clear   |
| Core Metric Cards (4)        | Planner daily, feedback, system errors | `"Unavailable"` / `0` |
| Engagement Events (5 cards)  | `GET /analytics/events/summary`        | `—` per card          |
| Planner Usage Line Chart     | `GET /analytics/planner/daily`         | Error state UI        |
| Feedback Breakdown Bar Chart | `GET /analytics/feedback/rate`         | Renders empty         |
| Personalized Recommendations | ML pipeline (coming soon)              | "Coming soon" state   |

**Warning thresholds (server-side):**

| Condition         | Threshold | Severity        |
| ----------------- | --------- | --------------- |
| System error rate | > 5%      | Critical (rose) |
| Avg response time | > 2000ms  | Warning (amber) |
| Positive feedback | < 80%     | Warning (amber) |

---

## Components

### `MetricCard`

`components/ui/MetricCard.tsx`

General-purpose stat display card. Supports optional trend indicator and sparkline chart.

```tsx
<MetricCard
  title="Trips Clicked"
  value="1,284"
  icon={<MousePointerClick className="w-5 h-5" />}
  colorVariant="blue" // blue | purple | emerald | rose | orange | yellow
  trend={{ value: 12, label: "vs yesterday" }}
  sparklineData={[10, 20, 15, 30]} // optional mini chart
/>
```

### `LineChart` / `BarChart`

`components/charts/LineChart.tsx` | `components/charts/BarChart.tsx`

Thin wrappers around [Recharts](https://recharts.org/), styled for dark/light mode. All chart components are `'use client'`.

```tsx
<LineChart
  data={[{ date: "Mar 1", usage: 42 }]}
  index="date"
  categories={["usage"]}
  colors={["#3b82f6"]}
/>
```

### `Sparkline`

`components/charts/Sparkline.tsx`

Minimal inline area chart used inside `MetricCard` for showing recent response time trends.

### `DashboardRefresh`

`components/DashboardRefresh.tsx` `'use client'`

Auto-refreshes the analytics page by calling `router.refresh()` on a configurable interval (default: 60s). Also renders a manual "Refresh Data" button with a spinner while pending.

```tsx
<DashboardRefresh intervalMs={60000} />
```

### `SystemHealthMonitor`

`components/SystemHealthMonitor.tsx` `'use client'`

Polls `GET /analytics/system/health` every 30 seconds. Renders a pulsing **"System under high load"** badge inline with the page title when thresholds are exceeded (latency > 5000ms or error rate > 5%). Returns `null` when the system is healthy.

### `PersonalizedRecommendations`

`components/recommendations/PersonalizedRecommendations.tsx`

ML-powered recommendations display panel — **structure only, ML connection deferred**. Has three states:

| State           | Trigger                    | Display                                |
| --------------- | -------------------------- | -------------------------------------- |
| **Coming soon** | `items` is empty (default) | Animated pulsing brain icon + message  |
| **Loading**     | `isLoading={true}`         | 3 animated skeleton cards              |
| **Populated**   | `items={[...]}`            | Confidence-scored recommendation cards |

```tsx
// Current usage (coming soon state)
<PersonalizedRecommendations />

// Once ML is ready
<PersonalizedRecommendations items={mlResults} />

// While fetching ML results
<PersonalizedRecommendations isLoading />
```

**`RecommendationItem` type:**

```ts
interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  score?: number; // ML confidence 0–1, renders as progress bar
  tag?: string; // e.g. "Trending", "Personalized"
  destinationId?: string;
}
```

---

## Hooks

### `useAnalyticsTracker`

`hooks/useAnalyticsTracker.ts` `'use client'`

A non-blocking event tracking hook for capturing ML training signals from user interactions. Designed with strict performance guardrails so tracking **never** degrades UI responsiveness.

**Supported events:**

| Event Name           | When to fire                   |
| -------------------- | ------------------------------ |
| `trip_clicked`       | User opens a trip card         |
| `destination_viewed` | User views destination detail  |
| `planner_edit`       | User edits a planner itinerary |
| `trip_accepted`      | Trip plan is accepted          |
| `trip_rejected`      | Trip plan is rejected          |

**Performance design:**

- Events are **batched** with a 1-second debounce before flushing
- Flush is scheduled via `requestIdleCallback` (graceful fallback to `setTimeout`) — runs only when the browser is idle
- `keepalive: true` on the fetch ensures the POST survives page navigations
- All network errors are silently swallowed — tracking is completely non-fatal

**Usage:**

```tsx
"use client";
import { useAnalyticsTracker } from "../../hooks/useAnalyticsTracker";

export function TripCard({ trip }) {
  const { track } = useAnalyticsTracker();

  return (
    <button onClick={() => track("trip_clicked", { tripId: trip.id })}>
      {trip.name}
    </button>
  );
}
```

---

## API Layer

`lib/api.ts`

All data-fetching functions live here. Every function:

- Uses Next.js `{ next: { revalidate: 60 } }` for ISR caching
- Returns `null` on any error (never throws)

### Functions

| Function                                | Endpoint                        | Returns                             |
| --------------------------------------- | ------------------------------- | ----------------------------------- |
| `getPlannerDailyStats()`                | `GET /analytics/planner/daily`  | `PlannerDailyStatsResponse \| null` |
| `getFeedbackRate()`                     | `GET /analytics/feedback/rate`  | `FeedbackRateMetric \| null`        |
| `getSystemErrors()`                     | `GET /analytics/system/errors`  | `SystemErrorMetric \| null`         |
| `getEngagementStats()`                  | `GET /analytics/events/summary` | `EngagementStatsResponse \| null`   |
| `trackEngagementEvent(event, payload?)` | `POST /analytics/events`        | `void` (fire-and-forget)            |

### Key Types

```ts
type EngagementEventType =
  | "trip_clicked"
  | "destination_viewed"
  | "planner_edit"
  | "trip_accepted"
  | "trip_rejected";

interface EngagementStatsResponse {
  totalEvents: number;
  breakdown: { eventType: EngagementEventType; count: number }[];
}

interface PlannerDailyStatsResponse {
  date: string;
  totalEvents: number;
  avgResponseTimeMs: number;
  recentResponseTimes: number[];
  last7Days: { date: string; count: number }[];
  breakdown: { eventType: string; count: number }[];
}
```

---

## Backend API Requirements

The dashboard expects the following backend endpoints to be running at `NEXT_PUBLIC_API_URL`:

| Method | Path                        | Used by                                      |
| ------ | --------------------------- | -------------------------------------------- |
| `GET`  | `/analytics/planner/daily`  | Core metric cards, line chart                |
| `GET`  | `/analytics/feedback/rate`  | Feedback metric card, bar chart              |
| `GET`  | `/analytics/system/errors`  | System errors card, warning banner           |
| `GET`  | `/analytics/system/health`  | `SystemHealthMonitor` (polled every 30s)     |
| `GET`  | `/analytics/events/summary` | Engagement event ML signal cards             |
| `POST` | `/analytics/events`         | `useAnalyticsTracker` hook (fire-and-forget) |

All `GET` endpoints should return `{ data: ... }` as the response wrapper. Any endpoint returning a non-2xx status results in the respective section rendering a graceful fallback — the page itself never errors.
