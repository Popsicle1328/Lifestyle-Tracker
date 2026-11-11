# Daymark — Personal Fitness & Lifestyle PWA (v0.2)

A local-first, mobile-friendly React + Vite + TypeScript PWA. Current testable trackers: **Sleep** and **Workouts**. Other modules remain locked.

## What's new in v0.2

- Demonstration data automatically loads **once per browser/device** the first time this version opens: 30 sample sleep nights, 12 sample workouts, 144 sample sets, 4 incline-treadmill intervals, and a 35-item exercise catalog (34 strength/bodyweight variants + one cardio).
- Sample records are tagged `DEMO` / `isDemo:true`; they are not presented as actual history and **never replace an existing sleep night**.
- Settings > Sample data controls lets you **remove demo records only**, or reload missing sample dates. Personal records remain untouched.
- Sleep journal > History > **Edit** to modify a night. Manual entry now has **one assigned sleep date** plus bedtime/wake-up clock times (with an explicit after-midnight checkbox).
- Workout Tracker unlocked: start/pause/resume/finish session, optionally enter body weight, log sets with automatically saved completion timestamps, edit sets preserving timestamps, set types (working / warm-up / drop set), effort tags, superset groups and machine-level / per-dumbbell / total-load / bodyweight units.
- Workout history, initial progress trends, interactive *schematic* muscle frequency map, exercises library, incline treadmill logging and activity-level calorie estimates.
- Daily overview: last 14 days training markers and active workout minutes (excludes paused time).
- Export full JSON v2 or sleep / workout / cardio CSV. Restore older v1 sleep-only JSON backups or v2 backups.

## Important constraints

- **Not real data:** Demo dates, loads, body mass (70 kg in sample workouts), and exercise performance are illustrative. Remove samples before using the app as your authoritative journal.
- **No arbitrary progression prescription:** Your rep ranges, increments, minimum comparable session counts and plateau rules have not been finalised. The initial progress page deliberately shows neutral context notes rather than pretending to know when you should raise the load.
- **Calories are estimates:** Resistance time uses illustrative 3.5-MET gross expenditure. Treadmill uses ACSM steady-state walking calculation. Mass must be entered for real sessions; no default personal body weight is assumed. Treadmill minutes are removed from general resistance-session time to avoid double counting.
- **Rest is approximate:** v0.2 timestamps taps when a set is completed. Time between two completion taps is **not** precisely the rest interval. A future start/done-set workflow could improve this.
- **Load conventions:** Every real set requires an explicit choice between kg per dumbbell, total kg, machine level, stack kg or bodyweight. Demo load conventions are clearly tagged and not necessarily yours.
- **Data does not sync:** IndexedDB is isolated by browser/device. Back up before clearing site data or changing domains.
- Progress and muscle map infer anatomical *emphasis* rather than measuring muscle-head strength.

## How to update your existing GitHub Pages installation

Repository currently used in this project: `https://github.com/Popsicle1328/Lifestyle-Tracker`.

**Before uploading code:** open the *existing* PWA on your device, go to **Settings & data > Export complete JSON backup**, and save the downloaded file outside browser storage. Existing IndexedDB is preserved by this version's Dexie v1→v2 migration, but always keep a backup.

### Browser-only method

1. Extract `daymark-v0.2-github-update.zip` on your PC.
2. Open the extracted `UPLOAD_TO_REPOSITORY_ROOT` folder. **Select its contents, not the enclosing folder.**
3. On your GitHub `Lifestyle-Tracker` repository's **Code** tab, choose **Add file > Upload files**.
4. Drag the selected `src` folder and root-level files. The existing matching paths should appear as changed; confirm `src/App.tsx`, `src/db.ts`, etc. are in the *root* `src` folder, **not** under `UPLOAD_TO_REPOSITORY_ROOT/src` or `aurora-fitness/src`.
5. Commit with message `Add workout tracker and removable demo data` on `main`.
6. Open **Actions > newest Deploy PWA to GitHub Pages run** and check that both `npm run test` and `npm run build` succeed.
7. Open `https://popsicle1328.github.io/Lifestyle-Tracker/`, reload to fetch the new service worker, and test both trackers. On Android, reopening/reloading an installed PWA may be necessary to activate updated cached assets.

**Do not upload the `.zip` file itself to GitHub.** GitHub Pages does not unpack source ZIP uploads for you. Do not delete your repository or clear browser data to update the code.

If your web upload refuses to replace a file, edit that file through GitHub's pencil editor or use GitHub Desktop to commit the extracted files. The source folder structure must be preserved.

### Full source project

`daymark-fitness-pwa-v0.2-full.zip` contains the full React project including the hidden `.github/workflows/deploy.yml`, and can be used for a fresh repository. The update ZIP deliberately omits `.github` because your existing deployment workflow is already configured.

## Development locally

Install Node 22+ and use:

```bash
npm install
npm run test
npm run build
npm run dev
```

`npm install` creates `package-lock.json`. Commit this lockfile if you develop locally; the included workflow has `cache: npm` removed and works without a lockfile by running `npm install`.

## Database / backup design

Dexie `daymark-local-v1`: version 1 had `sleep` and `preferences`. Version 2 adds `exercises`, `workoutSessions`, `workoutSets`, `cardioIntervals`, and `appMeta`. The DB name stays unchanged so data survives the upgrade on the **same origin**.

- `sleep`: actual timestamps, assigned sleep night, source and `isDemo`.
- `exercises`: library of 35 initial activities (muscles, equipment, aliases, review flags).
- `workoutSessions`: session start/finish, pause intervals, body mass, status and date.
- `workoutSets`: one set per record, unit, weight, reps, completion timestamp, kind, stages for drop sets, superset group and effort.
- `cardioIntervals`: treadmill intervals per session with speed, incline and duration.
- `appMeta`: demo insertion marker to prevent re-creating demo records each load.

Backup v2 captures all these tables (except internal app metadata), validates record shapes and cross-references before a transaction that replaces local records. **Restore replaces data, not merges.** Old v1 backups remain supported and restore sleep-only history.

## QA status

Source TS/TSX was syntactically transpile-checked. A local source verification script passed sample integrity (30+12+144+4) and arithmetic invariants. A full dependency installation/build was **not possible inside this environment** because access to npm's registry was unavailable. GitHub Actions must be used for the first complete typecheck, Vitest suite, Vite build and live PWA check; do not assume deployment passed until the workflow is green.
