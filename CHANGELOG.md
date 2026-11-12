# Changelog

## 0.3.0 - Cross-module dashboard, nutrition and workout insights

- Rebuilt Today as a cross-module landing page with recent sleep, protein, water, workouts and gross exercise-energy estimate.
- Added 3/7/30-day comparison windows with recorded-day coverage. Unrecorded nutrition is not assumed zero.
- Sleep chart hover details now show recorded bedtime, wake-up and both duration metrics.
- Sleep anomalies: compare consecutive clock shifts with the prior night if either shift crosses threshold; otherwise compare adjusted duration with the median of up to 14 previous complete nights, requiring at least five.
- Maintained one-date manual sleep entry and Edit/Delete in sleep history.
- Added workout group and Push/Pull/Legs filters to live set logging, progress, and exercise library.
- Added workout recommendation panel with recency ranking, optional core suggestions and a PPL restart approach after a long break.
- Redesigned interactive muscle map as vector paths with front/back views, keyboard controls, session details, and suggested exercises.
- Added color-coded muscle groups to workout timeline and detailed logs.
- Added conservative context explanations (superset, drop set, exercise order and shorter rest) and neutral plateau warnings.
- Added Nutrition & Hydration: user-defined foods, per-portion nutrition, immutable saved-log nutrient snapshots, history and water logging.
- Added editable bodyweight (60 kg reference), protein (120 g), provisional water (2.1 L), optional exercise-burn and workout-day targets.
- Removed redundant Cardio and Body Weight tabs; treadmill remains inside Workout. Study is reserved as a future module.
- Added dark mode and user-confirmed PWA update prompt.
- Extended IndexedDB schema to v3; backups/export include nutrition and water.
- No new external APIs, backend or recurring charges.

## 0.2.x - Earlier release

- Sleep and Workout logging, demo data and GitHub Pages workflow.
- v0.2 build fixes for Dexie transactions and nullable pause interval.
