@echo off
# PowerShell script for individual commits
# Each line adds a file and commits it with a descriptive message

# List of files to commit
$files = @(
    'package-lock.json',
    'package.json',
    'public/manifest.json',
    'src/app/dashboard/layout.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/globals.css',
    'src/app/layout.tsx',
    'src/app/log/page.tsx',
    'src/app/login/page.tsx',
    'src/app/onboarding/page.tsx',
    'src/app/rules/layout.tsx',
    'src/app/rules/page.tsx',
    'src/app/settings/layout.tsx',
    'src/app/signup/page.tsx',
    'src/components/LandingPage.tsx',
    'src/components/ui/BottomNav.tsx',
    'src/components/ui/PWAPrompt.tsx',
    'src/components/ui/index.tsx',
    'src/lib/services/mealService.ts',
    'src/lib/services/push.ts',
    'src/types/index.ts',
    'copilot changes.md',
    'public/food-empty-plate.png',
    'public/food-hero-bowl.png',
    'public/food-scatter.png',
    'src/components/ui/CalorieRing.tsx',
    'src/lib/crypto.ts'
)

foreach ($f in $files) {
    git add $f
    git commit -m "chore: update $f"
}
