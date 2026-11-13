# Daymark v0.4 - Light/Dark Theme QA

This is an inspection checklist for browser testing. Syntax audit and palette contrast calculations do not substitute for visual inspection.

1. Today: hero, summary cards, 3/7/30-day stats, table, future Study card, mobile bottom navigation.
2. Sleep: hero including moon illustration, one-tap controls, manual-entry dialog and date/time fields, both charts, tooltips, history table, edit/delete, fluctuations.
3. Workout Live: summary cards, tabs, recommendation panel, active/pause controls, load/unit/reps inputs, superset second row, drop-set subform, set list, rest and edit/delete controls.
4. Workout History: session list, coloured muscle chips, session date correction, manual edit/add form, detail rows, old-record and new manual-record timing labels.
5. Workout Progress: line chart axes, grid, legend and tooltip, analysis notes, load-unit labels.
6. Workout Muscle map: SVG strokes and selected region, region list, recent 3-session list, available exercise list.
7. Exercise library: filter toolbar, categories, new/edit exercise form, muscle selection chips and controls.
8. Cardio: form labels, kcal result and interval history.
9. Nutrition: date selector, macro cards, food category filter, log editor, food creation and category chips, food lists, water controls, protein/water charts and tooltips.
10. Settings: goal fields, backup/export/restore, drop targets and themes; toast; PWA update notice.
11. Repeat in dark theme on **Android narrow width** and desktop; check zoom at 200%, keyboard focus and readable contrast.

## Data integrity checks after installation

- Existing sleep, workout and nutrition records stay visible on the same origin.
- Create a two-exercise superset with different weights/reps; confirm two individual records and shared superset label in History.
- Edit a historical set and add a missing set; confirm no measured timestamp or rest is displayed on either.
- Create an exercise with muscle-group and Push/Pull/Legs mapping, then filter for it.
- Create Bread with category Bread and Dairy; filter by each; log it; edit food categories; confirm past food log nutrition and categories stay unchanged.
- Export a fresh JSON backup, restore into a clean test profile, and verify new category and manual timing fields survive.

## Note

Older records without a `timestampSource` value are treated as automatically timestamped for backward compatibility. New superset rounds use `grouped`, and manual corrections use `manual`.
