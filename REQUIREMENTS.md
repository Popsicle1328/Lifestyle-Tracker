# Daymark Requirements Register — v0.2

## Confirmed / implemented

- Local-first React/Vite TypeScript PWA; GitHub Pages; IndexedDB/Dexie; user-controlled backup.
- Sleep bedtime/wake one-tap timestamps; manual logging; one assigned sleep date with support for after-midnight bedtime; editable sleep history.
- Sleep duration is actual time in bed, adjusted sleep estimate uses 45-minute configurable deduction. Two dynamic, scrollable 14-day graphs; 30-day missed-target snapshot; sample data for testing.
- Workout Sessions: start, pause, resume, finish; active duration excluding pauses; main dashboard workout days and duration.
- Exercise catalog initial 34 strength/bodyweight variants + 1 incline treadmill activity; provisional primary/secondary muscle mapping.
- Logging: reps, explicit resistance unit and value, completed-set timestamp; set editing, delete; effort marker; superset group; drop stages.
- Workout page: session, history, basic progress trends, muscle map, library, incline treadmill, calories estimate.
- Seeded demo records clearly distinguished from personal data, removable by user.
- Data exports: JSON schema v2 and CSV for both trackers. v1 JSON restore supported.

## Provisional implementation choices (must be reviewed)

- App stores **completion timestamps** and offers completion-to-completion approximate intervals, not precise rest.
- Workout calorie estimate: 3.5 MET gross kcal on resistance-session active minutes minus treadmill intervals; treadmill estimate uses ACSM walking relationship. No implicit user body mass.
- Training frequency counts distinct days with at least one primary-muscle working set. Secondary-only days shown separately. Warm-up sets excluded.
- Exercise progress comparisons group by exercise and load unit. Apparent decline is not classified without comparable-session rules.
- Muscle SVG is schematic, not an anatomical measurement or precise muscle-head activation model.

## Still needing user decisions

1. Dumbbell kg-each vs combined, barbell convention, machine identification and increment availability.
2. Repetition target ranges and load progression triggers per exercise/muscle.
3. Plateau and regression detection thresholds; exercise-order/fatigue notes and superset comparison logic.
4. Set start/done workflow for accurate rest; minimum taps during exercise.
5. Gross versus net calories and recovery interval treatment.
6. Final confirmation of uncertain exercise names, and fine head-level muscle emphasis.
7. Whether multiple workout sessions in one calendar day require grouping in dashboard.

## Data integrity

- All data stored on device; no automatic cross-device sync.
- Demo seeds on first open of v0.2, only for dates without a pre-existing sleep record or workout session; one-time appMeta marker prevents repeated insertion.
- All demo records carry `isDemo`. Removal deletes only records flagged as demo; user edits can clear `isDemo` on sleep records to retain them as personal data.
- V1 → V2 Dexie schema migration keeps the same IndexedDB database name. Backup v2 can restore all tables, and v1 backup restores sleep and resets workout tables after confirmation.
