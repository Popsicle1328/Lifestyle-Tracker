# Daymark Requirements and Decision Register — v0.2

## Confirmed

- Free, Android-first, installable PWA, usable in desktop browser; static GitHub Pages + local IndexedDB; offline capabilities; backup/restore.
- Modular architecture; Sleep module active; Nutrition, Cardio, Workout, Body Weight locked until specified.
- One-tap current-time bedtime / wake-up capture, plus manual backdating/editing.
- Track **time spent in bed**, not actual measured sleep.
- 14-day chart: time in bed and adjusted duration (subtract 45 min). Configurable colour gradient: 8–9h green, 7h15 yellow, below yellow becomes red; above 9h transitions to yellow, above 10h red.
- Second chart bedtime and wake-up, shade interval, view historical trends / horizontal scroll.
- Mark notable fluctuations and above-/below-ideal nights; count outside-ideal completed nights in past 30 days.
- Assign night to intended **bedtime day** even when bedtime occurs after midnight; allow date override to avoid duplicate logical nights.
- Data should be structured, preserved and extractable for later analysis.

## Provisional implementation choices to confirm

- 06:00 local clock time is the default cutoff to automatically assign after-midnight bedtime to previous sleep date. User can change cutoff and override assigned sleep date.
- Single overnight interval per assigned date (database unique constraint). Multiple separate naps/segments aren't supported yet.
- 45 min adjustment is clamped to zero for very short durations.
- Colour interpolation points are red at 6h30, yellow at 7h15, green at 8h; green at 9h, yellow at 9h30, red at 10h. The red-at-6h30 boundary is a provisional threshold due to underspecified below-7h15 progression. All thresholds configurable.
- Fluctuation means absolute change >= 90 minutes in adjusted duration between consecutive *recorded* nights. Configurable.
- Missed target means completed records with adjusted duration outside [8h, 9h]. Missing and incomplete nights are tracked separately and not called missed.
- Retrospective stats use currently selected settings; raw timestamp records are never modified by a settings change.
- An unclosed bedtime record remains active until the user logs wake-up or edits it manually.

## Unresolved

- What exact short-sleep duration becomes fully red (below 7h15)?
- Should the 45 minutes be a uniform deduction or separate fall-asleep / wakeup durations?
- How should multiple periods within a sleep date be handled, if desired?
- Should graph abnormalities use time-shift, duration, weekday/weekend baselines, or all three?
- Should target preferences be versioned per day for historical analysis?
- Dark theme specifics; ability to reorder dashboard widgets.

## Data design

One sleep row: UUID `id`, date `sleepDate`, ISO `bedtime`, ISO nullable `wakeup`, created/updated timestamps, entry source for bedtime and wake-up, optional notes. Unique index on sleepDate. Settings stored independently. Calculated durations/colours/statistics are recomputed, not saved to record rows. Versioned JSON backup schema 1; CSV export for standalone analysis. 
