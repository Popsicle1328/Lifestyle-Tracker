# Changes

## v0.2 — Sleep samples + Workout Tracker

- IndexedDB schema migration to v2 while retaining v1 sleep history.
- 30 sample nights with deliberate ideal, short, long, after-midnight and missing-day scenarios.
- 12 sample workouts, 144 timestamped sets, 4 treadmill intervals, including drop sets and supersets.
- All samples individually flagged and removable without deleting personal records.
- Workout session controls, logging, editing, history, contextual progress views and muscle frequency visualization.
- Distinct load units: no implicit conversion between dumbbell per-hand, total, machine level or stack.
- Sleep manual entry: one assigned night date, bedtime and wake clock times; edit existing nights from journal.
- Full JSON v2 backup/restore and workout/cardio CSV export.
- Existing PWA and GitHub Pages workflow retained; removed problematic npm cache option from included workflow.

### Pending user-defined rules

- Repetition targets, progression triggers, allowable weight/machine increments, plateau thresholds.
- Confirm exercise names / muscle mapping in provisional seed list.
- Whether set-start times are required for accurate rest intervals.
- Personal weight defaults, gross vs net kcal, exercise-level workload method.
- Additional exercise mapping editor and finer interactive anatomy vector.
