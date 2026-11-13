# Daymark v0.4 update

Read [CHANGELOG.md](CHANGELOG.md) and [THEME_QA.md](THEME_QA.md) for the new features and testing steps. **Export a JSON backup before updating.**

# Daymark - Fitness & Lifestyle PWA (v0.3)

A zero-cost, offline-first, personal React + TypeScript + Vite app backed by IndexedDB/Dexie. The app is a PWA hosted using GitHub Pages. It has no backend and no automatic cross-device sync.

## What's live

- Today: combined sleep, nutrition/water, workout sessions, and estimated exercise energy; 3-, 7-, 30-day rolling windows with logging coverage.
- Sleep: one-tap bedtime and wake-up, manual date/time correction, 14/30/60/90-day scrollable sleep graphs, robust median-vs-timing fluctuations, monthly snapshot.
- Workout: start, pause, resume and finish; working/warmup/drop sets; approximate inter-set intervals; linked supersets; incline treadmill estimates; muscle-group and Push/Pull/Legs filters; contextual progress; color-coded history; interactive front/back muscle map; three most recent sessions per selected muscle; suggested workout rotation.
- Nutrition and hydration: custom foods per user-defined serving, fractional portion logging, calorie/protein/carbs/fat totals, drinking-water tracker, log history and recent charts.
- Settings: body weight reference, protein target, water target, optional weekly workout and exercise-energy targets, dark theme, full JSON backup/restore and CSV exports.
- Planned: study and eventual 24-hour time tracking (not implemented).

## Important boundaries

- Your supplied reference weight is 60 kg and protein goal is 120 g/day. Starting drinking-water goal is **2,100 mL/day** (a 35 mL/kg heuristic), editable. It is not a proven creatine-specific requirement, nor a universal minimum or maximum. Heat, activity, fluids from food, and health conditions may change needs.
- Calorie-intake target and exercise-energy target remain unset. Resistance energy is approximated via session-level METs; treadmill via a steady walking estimate. Neither is an accurate per-set calorie measurement.
- Past food logs store copies of nutrient values so later changes to a food do not retrospectively alter saved intake.
- The workout focus algorithm uses training recency and a Push/Pull/Legs rotation. It is a suggestion, not a medical assessment of fatigue or readiness. It avoids suggesting all muscle groups simply because you have been away for a week.
- The muscles shown on the map represent a primary-muscle classification, not measured activation or exact muscle-head strength.
- Other than the supplied exercise catalog, four core exercises are provided as explicitly *suggested*, not as workouts the user has claimed to perform.
- Existing sample sleep and workout entries are labelled DEMO and can be removed without removing personal entries.
- Current full build and browser behaviour **must be verified on GitHub Actions and Android**. Syntax and pure-logic checks have been performed without npm dependencies.

## Install/develop

Requirements: Node 22 or later, npm.

```bash
npm install
npm run test
npm run build
npm run dev
```

No package-lock.json is shipped from this environment because npm registry access was unavailable. When developing on a machine with access, run `npm install`, commit the generated `package-lock.json`, then switch your GitHub Actions workflow from `npm install` to `npm ci` for reproducible builds.

## GitHub Pages

The user's repository is `Popsicle1328/Lifestyle-Tracker`. The Vite build uses a relative base path `./` and the PWA manifest uses a relative scope/start_url. Preserve `.github/workflows/deploy.yml` as currently configured. The workflow should use Node 22, `npm install --no-audit --no-fund`, `npm run test`, `npm run build`, and deploy the `dist` directory.

Public site after a successful deployment:

https://popsicle1328.github.io/Lifestyle-Tracker/

Install on Android: open that URL in Chrome, three-dot menu, choose Install app / Add to Home screen. The v0.3 service worker uses a user-controlled "Update now" prompt when a new GitHub deployment is available. It checks again when the installed app returns to the foreground. Save unsaved fields before updating.

## Updating an existing GitHub repository

Recommended for repeated updates: install GitHub Desktop, clone `Popsicle1328/Lifestyle-Tracker`, then paste **contents** of `UPLOAD_TO_REPOSITORY_ROOT/` from the v0.3 update ZIP into the cloned repository, replacing matching files and preserving the `.git/` and `.github/` directories. Commit and Push origin. GitHub Actions will build and deploy. 

If using the GitHub website instead, create/edit changed files at their exact paths. Make sure all files end up directly under repository root, e.g., `src/Nutrition.tsx`, **not** `UPLOAD_TO_REPOSITORY_ROOT/src/Nutrition.tsx`.

## Data and backups

IndexedDB database name: `daymark-local-v1`. Schema v1: sleep/preferences. Schema v2: exercises/workouts/cardio. Schema v3: foods/foodLogs/waterLogs/nutritionPrefs. These are non-destructive version upgrades; data already saved in v1/v2 remains in the same database.

Before upgrading, export **Settings > JSON backup** and keep a separate copy. A code update normally retains IndexedDB data in the same browser origin, but uninstalling the app, clearing site data or changing origin can remove local records. Restore replaces local records after validation and explicit confirmation. Android and desktop do not sync automatically.

## Tests

`npm run test` covers original sleep/workout logic plus new median, clock shifts, nutrition portions and workout focus classification. See `TESTING.md` for manual Android PWA acceptance testing.

## Files

- `src/models.ts` - data contracts
- `src/db.ts` - Dexie schema v3 and backups/CSV
- `src/logic.ts`, `src/sleepAnalysis.ts` - sleep calculations
- `src/workoutLogic.ts`, `src/workoutFocus.ts` - workout analytics and rotation
- `src/nutritionLogic.ts` - saved-food totals
- `src/AnatomyMap.tsx` - interactive vector muscle illustration
- `src/Nutrition.tsx`, `src/Workout.tsx`, `src/TodayDashboard.tsx` - module UIs
- `src/GoalsSettings.tsx`, `src/App.tsx` - application shell and goals
- `src/styles.css` - responsive light/dark themes
- `src/main.tsx`, `vite.config.ts` - PWA registration / deployment

## Source citations for heuristics

- National Academies total-water adequate intake: https://www.nationalacademies.org/news/report-sets-dietary-intake-levels-for-water-salt-and-potassium-to-maintain-health-and-reduce-chronic-disease-risk
- Creatine and dehydration review: https://pubmed.ncbi.nlm.nih.gov/19295968/
- Physical activity MET values: https://pacompendium.com/conditioning-exercise/
