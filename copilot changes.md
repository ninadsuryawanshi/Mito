# Copilot Changes

Date: 2026-10-20

## 0) Hotfix: next/font compile error for Syne
- Changed: Updated `src/app/layout.tsx` Syne config from `style: ['normal', 'italic']` to `style: ['normal']`.
- Why: Next.js `next/font` reports Syne does not support italic style.
- Impact: Restores successful compilation while keeping the new typography.

## 1) Fixed dashboard entry experience with seamless startup animation
- Changed: Added a 1-second startup overlay animation on dashboard load in `src/app/dashboard/page.tsx`.
- Why: The app had a brief visual gap before dashboard content settled. The overlay creates a smoother handoff so the first second feels intentional.
- Impact: Users now see a short branded mito intro before the dashboard appears.
- Tradeoff: Adds a deliberate ~1s entrance on each dashboard mount.

## 2) Prompt box glow behavior changed to per app-open session
- Changed: Added session-based glow logic for the quick-log prompt in `src/app/dashboard/page.tsx` and `src/app/globals.css`.
- Why: Requirement was to glow once when the app is opened, but not repeatedly while navigating between pages.
- How: Uses `sessionStorage` key `mito_prompt_glow_session`.
  - First dashboard visit in a browser/app session: glow plays.
  - Navigating dashboard/rules/settings within same session: no glow replay.
  - Closing app/tab and opening again: glow plays again.
- Impact: Better attention cue without becoming noisy.

## 3) Header settings navigation updated
- Changed: The golden circular identity control in dashboard header now links to `/settings` in `src/app/dashboard/page.tsx`.
- Why: Requested that settings should be accessed from the golden header icon.
- Impact: Settings access is now aligned with the requested IA.

## 4) Bottom navbar destination changed from Settings to Rules
- Changed: Updated the third nav item from `/settings` to `/rules` and adjusted icon/label in `src/components/ui/BottomNav.tsx`.
- Why: Requested that persistent bottom navigation should prioritize Rules over Settings.
- Impact: Faster access to rules from any app section.

## 5) Typography updated to feel less generic
- Changed: Replaced global font setup in `src/app/layout.tsx` with `Syne` (display) and `Manrope` (body), and updated font tokens in `src/app/globals.css`.
- Why: Requested typography to feel less AI/generic and more intentional.
- Impact: Headings and body text now have stronger character while preserving readability.

## 6) Rules page UI consistency review
- Reviewed: `src/app/rules/page.tsx`.
- Result: Rules page already uses the same design token system (`var(--surface)`, `var(--accent)`, shared UI components, same spacing and card language). It includes extra celebration visuals by design, but remains within the same visual system.
- Why no code changes there: No structural inconsistency found that required correction for this request.

## 7) Log page simplified to remove redundant actions and improve full-page flow
- Changed: Refactored `src/app/log/page.tsx` input step to remove duplicate action surfaces and keep one primary input zone.
- Removed redundancy:
  - Deleted "or choose a method" separator.
  - Deleted duplicate method cards for Photo, Voice, and Past Meals.
  - Kept camera and mic actions inside the main input box where they already existed.
- Improved flow:
  - Increased bottom spacing and switched to a full-height input flow (`min-h` + sticky CTA layout feel).
  - Added sticky bottom "Analyze Nutrition" action for constant visibility.
  - Shortened primary placeholder copy to keep the experience concise.
- Re-log cleanup:
  - Kept recent meal re-log as compact horizontal chips.
  - Added `See all / Show less` toggle for quick scanning without clutter.
- Metadata simplification:
  - Converted meal type/date/time into a compact summary card with tap-to-edit controls.
  - Preserved all existing date/time preset and custom picker capability.
- Why: User requested a less redundant, shorter, easier, and more beautiful logging experience that fits the page better.
- Impact: Faster first-action path, cleaner visual hierarchy, fewer competing controls.

## 8) Rules page visual refresh for readability and product-standard hierarchy
- Changed: Refined `src/app/rules/page.tsx` to improve contrast, scanability, and decision clarity.
- Hero contrast fix:
  - Updated streak diamond number and unit colors to high-contrast gold tones.
  - Added subtle text glow for legibility on dark diamond background.
- Added compact KPI strip under the hero:
  - Active rules
  - Breaches this month
  - Days to next milestone
  - Reason: dashboard-style summary metrics are a standard pattern for quick interpretation.
- Header hierarchy improvements:
  - Larger title + clearer supporting sentence for context.
- Rules card cleanup:
  - Stronger rule title typography.
  - Slightly clearer inactive-state opacity.
  - Toggle now uses explicit gold token for active state to ensure consistent affordance.
- Suggestions CTA cleanup:
  - Replaced accent-dependent styling with stable gold token styling for consistency.
- Why: User asked for visuals closer to industry standards and better usability.
- Impact: Better first-glance comprehension, better accessibility, and cleaner action flow.

## 9) Landing page refactor to mobile-first
- Changed: Updated `src/components/LandingPage.tsx` to use mobile-first defaults and progressively enhance at larger breakpoints.
- Mobile-first adjustments:
  - Reduced base spacing and typography scale for small screens.
  - Converted CTA row to full-width stacked buttons on mobile, row layout on larger screens.
  - Simplified header actions on mobile (primary CTA stays visible; secondary sign-in link appears at `sm+`).
  - Reduced hero visual footprint on small screens and hid floating ingredient callouts below desktop widths.
  - Switched bento pair section to single-column on mobile and two-column from `sm` upward.
  - Tightened container paddings and section spacing for better above-the-fold fit on phones.
- Why: User asked whether landing was mobile-first and requested conversion if not.
- Impact: Better readability, better tap targets, reduced crowding, and a smoother first-load experience on mobile devices.
