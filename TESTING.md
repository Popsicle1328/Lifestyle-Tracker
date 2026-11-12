# Daymark v0.3 acceptance checklist

## Before uploading

1. Export a JSON backup in the currently installed app (Settings & backup).
2. Keep a separate copy on a location other than the phone.
3. Take note of a personal sleep record and saved workout for migration verification.

## After GitHub Actions finishes

- Confirm Actions > newest workflow: tests and build green, Pages deployment green.
- Open the GitHub Pages URL in Chrome, verify the app is on v0.3.
- Test light/dark toggle, reload and persistent theme choice.
- Today shows Sleep, Nutrition, Water, Workout and estimated calorie burn; 3/7/30 windows report logging coverage.
- Sleep: tap bedtime, tap wake, manual edit, timing tooltip on both graphs, after-midnight assigned date, 30-day counts, robust anomalies.
- Workout > Live session: filter Push/Pull/Legs and e.g. Shoulder; start, pause, resume, stop session; save a set with time.
- Workout > Progress: use same filters; observe abbreviations like Nov 8 on date axes.
- Workout > Muscle map: tap chest/back/shoulders/abs, see sessions and available exercise suggestions.
- Workout > History: date cards and detailed log have colored muscle labels.
- Workout > Cardio: record an incline treadmill interval in an active session, inspect estimated kcal.
- Nutrition: add a food e.g. bread per slice, log 1.5 portions, verify protein math, edit food definition and verify old log remains unchanged.
- Nutrition: quick water entry + custom amount; verify logged entries, totals and recent graphs.
- Settings: set body weight, protein and water targets; leave calorie intake goal unset.
- Back up v0.3 JSON; restore a copy after carefully checking the replace-all confirmation.
- Turn on airplane mode and confirm an already-loaded PWA still displays local records and allows new entries; reconnect and check sync is not implied.
- Change a visible UI string, commit on GitHub and confirm the installed PWA offers Update now; save unsaved entries before accepting.

## No full local build available

The code release has passed TypeScript syntax parsing, source-level type checks with local temporary declarations and independent runtime logic checks. Dependency installation is unavailable in this environment, so `npm run test`, `npm run build`, service-worker behavior, Android installation, and visual layout require real verification after GitHub deployment. Treat them as unverified until passing.
