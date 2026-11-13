Daymark v0.4 update for Popsicle1328/Lifestyle-Tracker

1. BACK UP from Settings -> Export JSON before upgrading. Keep the backup offline.
2. Copy the CONTENTS of this folder into your local GitHub repository root, preserving src/ and other paths. Replace matching files. Do not delete .github/workflows/deploy.yml.
3. Commit: "Daymark v0.4 workout and theme improvements"; push main.
4. Check GitHub Actions: tests and npm run build must be green before testing the installed phone app.
5. Reopen your installed PWA and use Update now if offered. Do not uninstall or clear site data.
6. Test Superset (2 independent loads), History (manual edits, no measured time), Exercises (custom categories), Nutrition (food categories) and dark mode as described in THEME_QA.md.

No database reset is necessary. Existing Daymark IndexedDB database and indexed schema version are unchanged.

If GitHub Actions fails, share the newest exact error lines.
