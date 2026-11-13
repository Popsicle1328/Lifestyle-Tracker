# Daymark changes

## v0.4.0 - Unified aesthetics, full superset logging, editable history and categories

- One visual system based on the Sleep Tracker: lavender/peach/blue accents, coordinated cards and typography. Workout no longer uses a strong green theme; Nutrition uses peach/blue accents.
- Added `src/styles.polish.css`, imported after the existing stylesheet. Light and dark palettes cover cards, inputs, tabs, modals, chart tooltips, history, forms, new category controls and small-screen breakpoints.
- Superset now requires independent load, unit and reps for the second exercise and writes **two linked sets** in a Dexie transaction. Each superset round receives a unique group ID. Both completion times are marked as *grouped*, never a precise rest interval.
- Added History editing: add forgotten sets to an existing session, correct existing loads, reps, exercise and dropset, delete individual sets, and correct assigned session date. Edited and retrospectively logged sets are marked `timestampSource: 'manual'`. Their displayed times are hidden, and they do not contribute to rest comparisons.
- Exercise library now supports creating/editing exercise names, category, equipment, Push/Pull/Legs/core/other override, and primary/secondary muscle-group mappings. Stable IDs preserve the relationship to historical workout data.
- Nutrition foods now support user-defined multiple categories (e.g. Non-veg, Bread, Dairy) and category filtering. Food logs retain the categories at time of logging as part of the nutrient snapshot.
- Backup/restore validators accept the new optional fields while continuing to accept v0.1-v0.3 backups. Database name and Dexie indexed schema version remain unchanged because new fields are stored without new indexes.
- Added independent superset/timing unit tests; retained previous tests.

**Limitations:** Local full build/browser render unavailable in the assistant environment (npm registry DNS error). GitHub Actions is the build gate, followed by phone QA in light/dark. Always back up before major updates.
