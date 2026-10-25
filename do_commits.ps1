# Stage and commit each change group individually

# 1. Design system & global styles
git add src/app/globals.css
git commit -m "design: revamp global CSS with Golden Light design system tokens, gradients, and animations"

# 2. Root layout - fonts
git add src/app/layout.tsx
git commit -m "design: switch fonts to Syne (display) and Manrope (body) for premium editorial feel"

# 3. Landing page - mobile-first revamp
git add src/components/LandingPage.tsx
git commit -m "feat: mobile-first landing page with food bowl hero, centered text, responsive breakpoints"

# 4. Login page
git add src/app/login/page.tsx
git commit -m "design: revamp login page with Golden Light theme and smooth spring animations"

# 5. Signup page
git add src/app/signup/page.tsx
git commit -m "design: revamp signup page with Golden Light theme"

# 6. Onboarding - scroll fix for small screens
git add src/app/onboarding/page.tsx
git commit -m "fix: add overflow scroll to onboarding step 2 for small-screen devices (iPhone SE)"

# 7. Dashboard - calorie ring, boot overlay, quick log
git add src/app/dashboard/page.tsx
git add src/app/dashboard/layout.tsx
git commit -m "feat: dashboard revamp with CalorieRing, 1s boot overlay, streak indicators, and quick-log prompt"

# 8. Log meal page
git add src/app/log/page.tsx
git commit -m "design: revamp log meal page - text input first, stacked method cards, sticky CTA"

# 9. Rules page
git add src/app/rules/page.tsx
git add src/app/rules/layout.tsx
git commit -m "design: rules page revamp with KPI strip, better contrast, and toggle affordances"

# 10. Settings layout
git add src/app/settings/layout.tsx
git commit -m "design: settings layout updated to match Golden Light theme"

# 11. UI components
git add src/components/ui/BottomNav.tsx
git commit -m "design: glassmorphic floating pill bottom nav with gold CTA center button"

git add src/components/ui/CalorieRing.tsx
git commit -m "feat: new CalorieRing component with animated SVG ring and gradient gold stroke"

git add src/components/ui/PWAPrompt.tsx
git commit -m "design: PWA install prompt styled to match Golden Light theme"

git add src/components/ui/index.tsx
git commit -m "chore: add CalorieRing to UI barrel exports"

# 12. Food illustrations (new public assets)
git add public/food-hero-bowl.png public/food-empty-plate.png public/food-scatter.png
git commit -m "assets: add editorial food illustrations for landing page and empty states"

# 13. PWA manifest
git add public/manifest.json
git commit -m "chore: update PWA manifest to match new app branding"

# 14. Services and types
git add src/lib/services/mealService.ts
git commit -m "refactor: mealService updates for new dashboard data shape"

git add src/lib/services/push.ts
git commit -m "chore: push notification service updates"

git add src/types/index.ts
git commit -m "chore: type definitions updated for new components"

git add src/lib/crypto.ts
git commit -m "chore: add crypto utilities"

# 15. Deps
git add package.json package-lock.json
git commit -m "chore: update dependencies (framer-motion, next-pwa)"

# 16. Copilot changes log
git add "copilot changes.md"
git commit -m "docs: add copilot UI changes log"

# 17. Cleanup temp scripts
git add commit_all.ps1 do_commits.ps1
git commit -m "chore: remove temporary commit helper scripts"
