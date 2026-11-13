# Daymark consolidated requirements and decision register (0.3)

## Confirmed product philosophy

- No paid services, backend, subscriptions, or mandatory cloud database.
- Local-first IndexedDB. User owns JSON backup/restore and CSV exports.
- User chooses the formulas and meaning of records, especially where quantities are estimated.
- Android-first installable PWA, desktop support, offline once cached, update after GitHub deployment.

## Sleep

- One tap bedtime, one tap wake; manual editing and one *assigned night* date (with after-midnight option).
- Show time in bed; adjusted duration = time in bed minus user-chosen default of 45 minutes, not actual measured sleep.
- Ideal adjusted 8-9 h, dynamic red/yellow/green thresholds (existing configurable preferences).
- Two 14-day and scrollable historical graphs; hover must show both clock times.
- Compare bedtime/wake-up shifts >= user-chosen threshold (currently 90 minutes) against the *immediately previous consecutive night*.
- Otherwise compare adjusted duration with rolling prior-14-night median, requiring five records, to reduce sensitivity to one unusual night.
- 30-day count outside ideal range, missing/unrecorded distinct.

## Workout

- One exercise catalog with primary/secondary muscle classification, load units, timestamps, sets, reps, drop sets and superset groups.
- Session start/pause/resume/finish and approximate rest intervals.
- Filter exercise options by muscle region and Push/Pull/Legs in logging and progress.
- Suggestions rank time since last primary-muscle training plus PPL rotation; after a >=7-day gap recommend *one* manageable split, not a catch-up workout.
- The training recommendation is a user-adjustable heuristic, not a physiological readiness measurement.
- Trend context considers exercise order, supersets, drop sets and shorter rest. No automatic precise next-weight prescription until increments and rep goals are confirmed.
- Interactive front/back muscle region map. Clicking region shows last three completed sessions with exercises sorted and available exercise options.
- Workout history summary and detailed log show color-coded primary muscles.
- Incline treadmill logging only inside Workout; no second Cardio module.

## Nutrition and lifestyle

- Foods are defined by custom serving size, serving unit and kcal/protein/carbs/fat per serving.
- Portion-based logs preserve *at-time* nutritional facts separately from editable food library.
- Water entry: quick add, custom amount and editable goal.
- Today combined sleep, protein, water, workout minutes, approximate exercise calories, 3/7/30 day statistics.
- Current weight reference 60 kg, protein target 120 g/day (user supplied). Starting drinking-water target 2100 mL/day is an editable *35 mL/kg heuristic*, NOT a creatine-specific prescription.
- Calorie-intake goal left unset by request; exercise calorie-burn and workout frequency goal available but unset until user specifies values.
- Body Weight and separate Cardio removed from main navigation.
- Dark mode available.
- Study and 24-hour lifestyle time tracking reserved for later specification.

## Still to confirm

- Protein target duration/change history when weight changes; whether drinking water excludes or includes all beverages; hydration goal adaptation for workouts and climate.
- Bodyweight conventions for dumbbell pair and barbell, machine level increments, rep-range and progression thresholds, muscle-specific stimulus weighting, actual planned PPL split, and rest-timing precision.
- Exercise recommendation recovery periods and whether user wants recommendations based on RPE/RIR and muscle soreness.
- 24-hour tracking categories, time-boundary conventions, sleep categorisation and study-session time tracking.
- Detailed nutrition database portion duplication, user-defined food groups, meal names and editing historical logged nutrition values.

## Data safety

- Database name unchanged, migration v2 -> v3 adds food/water/preference tables, no destructive old-table changes.
- Demo records stay labelled and separately removable.
- GitHub hosts code only. Personal data is device-local and never automatically synced.

## Daymark v0.4 decisions and additions

- Match Sleep Tracker's card styling, typography, spacing and soft accents throughout the app, with Workout lavender/blue and Nutrition peach/blue.
- Preserve visible semantic colours (green success, peach/orange caution and coral failure) in both light and dark modes.
- A superset round logs **two sets**, each with independent load, units and reps, linked by an ID. Tapping Complete records both atomically. The shared tap is a grouped approximate time; rest is not measured.
- Users may edit a set in an active session or add/edit missed historical workout sets. Such manually changed entries do not display a set-completion timestamp or a rest interval and do not contribute rest-time comparisons.
- Exercise library creation/editing must include custom exercise name, category, equipment, Push/Pull/Legs/Core/Other classification (or auto classification), and primary/secondary muscle selection.
- Food library entries may have multiple user-defined categories; past nutrition logs retain a snapshot of categories and nutrient values from when the entry was logged.
- No IndexedDB schema upgrade is necessary for these optional unindexed fields. The database name remains `daymark-local-v1` and Dexie schema remains version 3.
- All features must undergo dark-mode visual QA on mobile and desktop as detailed in `THEME_QA.md`.
