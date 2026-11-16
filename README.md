# Intranet concept for Farmers Union Agency

A static page: a clickable concept of the SharePoint intranet (home, Carrier Resource Center, directory, calendar) and the checks behind it. No build step and no server code. Nothing the visitor does leaves the browser.

Deploy on Vercel as a static site. `vercel.json` sets `framework: null`, no build command, output `.`, and an `X-Robots-Tag: noindex, nofollow` header. The page also carries a robots meta tag.

## What the page does

- **Concept.** It mimics a SharePoint communication site: the hub header, the mega menu, and six standard web parts. "View as" switches between State Office staff, Agent and Leadership; audience targeting decides what each sees. "Show the SharePoint parts" labels every block with the web part behind it.
- **Content move check.** This checks file and folder names and paths against SharePoint's restrictions. It runs on a generated 6,793-file sample drive or on a folder the visitor picks; only names and sizes are read. It produces a rename plan as a CSV.
- **Brand theme.** The visitor enters one color and gets a SharePoint palette from Fluent UI's ThemeGenerator. Six text and background pairs get WCAG contrast checks, and there's a `.ps1` download for `Add-SPOTheme`. The concept recolors live.
- **Who sees what.** An access matrix shows each role against each site. A guest-agent scenario compares sharing with "Everyone except external users" against sharing with Entra groups.
- **Site template.** The page offers a PnP provisioning template (`downloads/fua-intranet.xml`) generated from the same plan as the concept.

## Measured

Numbers come from `data/results.json`, written by `tools/run-all.mjs` in the kit:

- 44 of 44 engine tests pass. They cover the content check, audiences and access, theme contrast, the template and the carrier filters.
- 25 of 25 planted bugs were caught by those tests (mutation check).
- The template validates against the PnP Provisioning Schema 2022/09 with xmllint. A test proves the check bites: a misspelled web part type fails validation.
- Sample drive: 6,793 files in 145 folders. The check found 8 must-fix and 5 review items, and the longest path is 407 characters.
- Placeholder theme (#2f6b3a): all 6 contrast pairs pass 4.5:1. Raw generated neutrals would put secondary text at 2.55:1, so Fluent's default neutrals are kept.
- Browser QA: 51 of 51 checks pass. These cover the personas, the mega menu, filters, both content-check modes, the theme, access, downloads, axe with no violations on every view, and no horizontal scroll at 390 px.

## Not measured

- Nothing ran in a real Microsoft 365 tenant. The template is validated against the schema, not applied.
- Real brand colors, fonts, logo, content and people. Carriers, people and news are invented samples. Office towns come from public listings.
- The client's real shared drive or current SharePoint.
- Whether agents sign in as members or guests.
- Search, the SharePoint mobile app and Teams.

## Third-party files

- `fonts/`: Public Sans and Barlow Semi Condensed, SIL Open Font License (licenses included).
- `vendor/fluent-theme.mjs`: a bundle of `ThemeGenerator`, `themeRulesStandardCreator`, `BaseSlots`, `getColorFromString`, `isDark` and `DefaultPalette` from `@fluentui/react` 8.125.10, MIT (license included).
- `engine/`: identical copies of the kit's tested engine (`npm test` checks they match).
