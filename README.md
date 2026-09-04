<div align="center">

<h1>Mito</h1>

<p><strong>AI-Powered Nutrition Intelligence for the Indian Palate</strong></p>

<p>
  <a href="https://mitohealth.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20App-mitohealth.vercel.app-4CAF50?style=for-the-badge&logo=vercel&logoColor=white" alt="Live App" />
  </a>
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Live%20with%20Real%20Users-brightgreen?style=for-the-badge" alt="Status: Live" />
  &nbsp;
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 14" />
  &nbsp;
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

<p>
  <img src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  &nbsp;
  <img src="https://img.shields.io/badge/AI-Gemini%203.6%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  &nbsp;
  <img src="https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
</p>

<br />

> Production deployment actively serving real users.
> **[https://mitohealth.vercel.app](https://mitohealth.vercel.app)**

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [AI Pipeline](#ai-pipeline)
6. [Getting Started](#getting-started)
7. [Environment Configuration](#environment-configuration)
8. [Project Structure](#project-structure)
9. [API Reference](#api-reference)
10. [Security & Data Privacy](#security--data-privacy)
11. [Deployment](#deployment)
12. [Contributing](#contributing)

---

## Overview

**Mito** is a production-grade, AI-first nutrition tracking platform built specifically for the Indian dietary context. Unlike generic calorie counters, Mito understands Indian cuisine — from katori sizes and roti weights to regional cooking patterns and restaurant preparation multipliers.

Users can log meals by **taking a photo**, **describing in natural language**, or **scanning a barcode**. The multimodal AI pipeline (Gemini Vision with Groq fallback) parses the meal, computes full macronutrient breakdowns, and delivers real-time insights within seconds.

The application is deployed on Vercel and is actively used by real users in production.

---

## Features

### Multimodal AI Meal Logging
- **Photo Analysis** — Gemini Vision identifies dishes, estimates portions, and returns full macros from a single photo
- **Natural Language Logging** — Describe a meal in plain text (*"2 rotis, 1 katori dal, a glass of lassi"*) and receive an instant nutritional breakdown
- **Barcode Scanner** — ZXing-powered scanning for packaged food with FSSAI nutritional values
- **Context-Aware Parsing** — When a photo and text are submitted together, the text acts as ground-truth food identity; vision is used only to refine portion size

### Dashboard
- Daily tracking for calories, protein, carbs, fat, fiber, sugar, and sodium
- One-line AI-generated daily insight — purely observational, no coaching
- WHO/Mifflin-St Jeor TDEE computation based on user profile (weight, height, age, activity level)
- Meal history with per-entry drill-down

### Dietary Rules Engine
- Users define personal rules such as *"no chocolate after 6pm"* or *"avoid fried food on weekdays"*
- Gemini expands each rule into 8–12 related keywords, including brand names and regional variants
- Every meal log is evaluated against active rules in real time

### Push Notifications (Web Push / PWA)
- VAPID-secured Web Push subscription management
- Vercel Cron–triggered meal reminders across breakfast, lunch, snack, and dinner windows (IST-aware)
- Skip logic: users who have already logged a given meal type are not notified again

### User Profile & Onboarding
- Guided onboarding tour for new users
- Profile inputs (age, weight, height, sex, activity level) feed auto-computed calorie and protein targets
- Account management: data export, and permanent multi-step account deletion

### Progressive Web App (PWA)
- Installable on iOS and Android
- Offline-capable shell
- Full mobile optimization with bottom navigation

### Authentication
- Email/password auth via Supabase Auth with password reset
- Sessions managed server-side via `@supabase/ssr` — no raw JWTs on the client
- Row-Level Security (RLS) at the database layer — users can only access their own data

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client (Browser / PWA)                   │
│   Next.js 14 App Router  ·  React 18  ·  Tailwind CSS           │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼──────────────────────────────────┐
│                     Vercel Edge / Serverless                     │
│                                                                  │
│  ┌──────────────────┐   ┌──────────────────┐   ┌─────────────┐  │
│  │   API Routes     │   │   Middleware      │   │  Cron Jobs  │  │
│  │  /api/meals      │   │  Auth Guard       │   │  Push notif │  │
│  │  /api/insights   │   │  Session refresh  │   │  reminders  │  │
│  │  /api/rules      │   │                  │   │  (IST-aware)│  │
│  │  /api/export     │   └──────────────────┘   └─────────────┘  │
│  │  /api/account    │                                            │
│  └────────┬─────────┘                                           │
└───────────┼──────────────────────────────────────────────────────┘
            │
     ┌──────┴───────────────────────────┐
     │                                  │
     ▼                                  ▼
┌─────────────────┐          ┌──────────────────────────────────┐
│  Supabase       │          │  AI Layer                        │
│  ─────────────  │          │  ─────────────────────────────── │
│  Postgres DB    │          │  Primary:  Gemini 3.6 Flash      │
│  Auth (JWT)     │          │           (text + vision)        │
│  Row-Level Sec. │          │                                  │
│  Realtime       │          │  Fallback: Groq / GPT-OSS-120B   │
│  Storage        │          │           (text + vision)        │
└─────────────────┘          └──────────────────────────────────┘
```

### Data Flow — Meal Log (Photo)

```
User takes photo
    → Client compresses image (browser-image-compression)
    → POST /api/meals/analyze  { base64, mimeType, context? }
        → Gemini Vision API (primary)
            → Structured JSON: items[], macros, eating_context
        → [fallback] Groq Vision if Gemini 4xx/5xx
    → Server validates + recomputes totals from items[]
    → Writes to Supabase meal_logs table (RLS enforced)
    → Dashboard updates via SWR revalidation
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | SSR, API routes, middleware |
| **Language** | TypeScript 5 | Type safety across the stack |
| **Styling** | Tailwind CSS 3 | Utility-first UI styling |
| **Database** | Supabase (PostgreSQL) | Persistent storage, RLS |
| **Auth** | Supabase Auth + `@supabase/ssr` | Session management |
| **AI — Primary** | Google Gemini 3.6 Flash | Text + vision meal analysis |
| **AI — Fallback** | Groq (GPT-OSS 120B) | Reliability fallback |
| **Rate Limiting** | Upstash Redis + `@upstash/ratelimit` | API abuse prevention |
| **Push Notifications** | Web Push API + VAPID | PWA push delivery |
| **Barcode Scanning** | ZXing Browser | Packaged food scanning |
| **Error Monitoring** | Sentry (`@sentry/nextjs`) | Production error tracking |
| **Data Fetching** | SWR | Client-side caching & revalidation |
| **Validation** | Zod | Runtime schema validation |
| **Deployment** | Vercel | Global edge deployment |

---

## AI Pipeline

The AI pipeline is designed around reliability, accuracy, and cost efficiency.

### Dual-Model Architecture

```
Request
  │
  ├─► Gemini 3.6 Flash (primary)
  │       • Pinned to stable version (avoid 'latest' alias)
  │       • JSON response mode enforced
  │       • 4096 max output tokens (prevents mid-JSON truncation)
  │
  └─► Groq / GPT-OSS-120B (automatic fallback)
          • Activated on Gemini 4xx / 5xx / timeout
          • Same prompt, same output contract
```

### Indian Nutrition Accuracy

The AI prompt enforces a set of domain-specific rules:

- **Density anchors**: 1 katori = 180ml, 1 roti = 35g (~90 kcal)
- **Restaurant multiplier**: Fat and sodium × 1.35x for street/restaurant context
- **Dry weight rule**: Packaged noodles and mixes are treated as dry weight unless stated otherwise
- **Brand priority**: FSSAI/official nutritional values are used when a brand is mentioned
- **Non-food gate**: Returns `{"not_food": true}` for irrelevant inputs — the model never hallucinates meals

### Reliability Measures

- Server-side total recomputation — the server never trusts AI-computed totals
- Automatic retry on first parse failure
- Balanced JSON brace extraction handles markdown fences and prose contamination in model output

---

## Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | >= 18.x |
| npm | >= 9.x |
| Supabase account | — |
| Google AI Studio API key | — |

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/mito.git
cd mito
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials. See [Environment Configuration](#environment-configuration) for the full reference.

### 4. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from **Settings → API**
3. Enable Row-Level Security on all tables

### 5. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Copy the public and private keys into `.env.local`.

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Configuration

Copy `.env.local.example` to `.env.local` and fill in all values. See `.env.local.example` for inline documentation on each variable.

### Security Classification

| Variable | Exposure | Reason |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client-safe | Public endpoint; access controlled by RLS |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-safe | Public key; scoped by RLS policies |
| `NEXT_PUBLIC_APP_URL` | Client-safe | Public URL |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Client-safe | Required by the browser to create a push subscription |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Bypasses RLS — never expose to the browser |
| `GEMINI_API_KEY` | **Server only** | Secret API key |
| `GROQ_API_KEY` | **Server only** | Secret API key |
| `VAPID_PRIVATE_KEY` | **Server only** | Signs push payloads — exposure allows notification spoofing |

---

## Project Structure

```
mito/
├── public/                    # Static assets, PWA manifest, icons
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # Serverless API routes
│   │   │   ├── account/       # Account management (delete, export)
│   │   │   ├── meals/         # Meal logging & analysis
│   │   │   ├── insights/      # AI-generated daily insights
│   │   │   ├── rules/         # Dietary rules CRUD
│   │   │   ├── notifications/ # Web Push & cron reminders
│   │   │   ├── mood/          # Mood tracking endpoints
│   │   │   ├── profile/       # User profile management
│   │   │   ├── transcribe/    # Voice transcription endpoint
│   │   │   └── weekly-digest/ # Weekly summary generation
│   │   ├── auth/              # Auth callback handlers
│   │   ├── dashboard/         # Main dashboard page
│   │   ├── log/               # Meal logging interface
│   │   ├── onboarding/        # New user onboarding flow
│   │   ├── rules/             # Dietary rules management
│   │   ├── settings/          # User settings & account
│   │   ├── login/             # Authentication pages
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── privacy/           # Privacy policy
│   │   ├── terms/             # Terms of service
│   │   └── viewer/            # Shared meal viewer
│   ├── components/
│   │   ├── LandingPage.tsx    # Marketing landing page
│   │   ├── auth/              # Auth form components
│   │   ├── dashboard/         # Dashboard widgets & cards
│   │   ├── meal/              # Meal logging UI components
│   │   └── ui/                # Shared UI primitives
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── gemini.ts      # Primary AI integration (Gemini + Groq fallback)
│   │   │   └── gemini-raw.ts  # Raw Gemini client
│   │   ├── db/                # Supabase client factories (server/client)
│   │   ├── services/
│   │   │   ├── mealService.ts # Meal data access layer
│   │   │   └── push.ts        # Web Push notification service
│   │   └── crypto.ts          # Cryptography utilities
│   ├── middleware.ts           # Auth middleware (route protection)
│   └── types/                 # Shared TypeScript type definitions
├── .env.local.example         # Environment variable template (safe to commit)
├── .gitignore
├── next.config.mjs
├── tailwind.config.js
└── tsconfig.json
```

---

## API Reference

All routes are under `/api/` and require authentication unless otherwise noted.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/meals/analyze` | Required | Analyze a meal from a text description |
| `POST` | `/api/meals/analyze-photo` | Required | Analyze a meal from a photo (base64) |
| `GET` | `/api/meals` | Required | Fetch meal logs for the authenticated user |
| `POST` | `/api/meals` | Required | Save a parsed meal log |
| `DELETE` | `/api/meals/:id` | Required | Delete a specific meal log |
| `GET` | `/api/insights` | Required | Get the AI-generated daily insight |
| `GET` | `/api/rules` | Required | List the user's dietary rules |
| `POST` | `/api/rules` | Required | Create a new dietary rule |
| `DELETE` | `/api/rules/:id` | Required | Delete a dietary rule |
| `GET` | `/api/profile` | Required | Get user profile and nutrition targets |
| `PUT` | `/api/profile` | Required | Update user profile |
| `GET` | `/api/notifications/subscribe` | Required | Get push subscription status |
| `POST` | `/api/notifications/subscribe` | Required | Register a push subscription |
| `GET` | `/api/notifications/cron` | Cron only | Trigger meal reminder push notifications |
| `POST` | `/api/export` | Required | Export user data |
| `DELETE` | `/api/account/delete` | Required | Permanently delete the user account |

---

## Security & Data Privacy

### Authentication & Authorization
- All protected routes are guarded by Next.js middleware using Supabase session validation
- Sessions are managed server-side via `@supabase/ssr` — no raw JWTs on the client
- Row-Level Security (RLS) is enforced at the Postgres level; even with the anon key, users can only read and write their own rows

### API Security
- Rate limiting on AI analysis endpoints via Upstash Redis
- VAPID-signed push notifications prevent payload spoofing

### Secret Management
- All secret keys (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `VAPID_PRIVATE_KEY`) are server-only environment variables and are never shipped to the browser bundle
- `.env*.local` files are excluded from git via `.gitignore`

### Error Monitoring
- Sentry captures production errors with source maps; no PII is sent

### Account Deletion
- Permanent deletion is a multi-step verified flow
- All associated data (meal logs, rules, push subscriptions, profile) is hard-deleted from the database

---

## Deployment

Mito is deployed on Vercel.

### Deploy to Production

```bash
npm i -g vercel
vercel --prod
```

### Environment Variables

Set all variables from `.env.local.example` in **Vercel Dashboard → Project → Settings → Environment Variables**. Do not use a `.env.local` file on Vercel.

### Cron Jobs

Meal reminder push notifications are triggered by Vercel Cron. The schedules are defined in `vercel.json` (times in UTC):

```json
{
  "crons": [
    { "path": "/api/notifications/cron?type=breakfast", "schedule": "30 1 * * *" },
    { "path": "/api/notifications/cron?type=lunch",     "schedule": "30 6 * * *" },
    { "path": "/api/notifications/cron?type=snack",     "schedule": "30 9 * * *" },
    { "path": "/api/notifications/cron?type=dinner",    "schedule": "30 13 * * *" }
  ]
}
```

### Pre-Launch Checklist

- [ ] All environment variables configured in Vercel dashboard
- [ ] `NEXT_PUBLIC_APP_URL` set to the production domain
- [ ] `VAPID_SUBJECT` set to a valid `mailto:` address
- [ ] Supabase RLS policies verified on all tables
- [ ] Sentry DSN configured
- [ ] Cron schedules active in `vercel.json`

---

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following the existing code style
4. Test locally: `npm run dev`
5. Lint: `npm run lint`
6. Open a Pull Request with a clear description of the change

### Code Style

- TypeScript strict mode — avoid `any`
- Functional components with hooks only
- Server components preferred for data-fetching pages
- API routes must validate inputs with Zod schemas
- Never commit real credentials; use sandbox Supabase projects and AI keys for PRs

---

## Legal

- [Privacy Policy](https://mitohealth.vercel.app/privacy)
- [Terms of Service](https://mitohealth.vercel.app/terms)

---

<div align="center">

[Live App](https://mitohealth.vercel.app) · [Report a Bug](https://github.com/your-org/mito/issues) · [Request a Feature](https://github.com/your-org/mito/issues)

</div>
