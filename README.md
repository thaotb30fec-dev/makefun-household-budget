# HomeBudget — Household Budget Tracker

[![make.fun](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/thaotb30fec-dev/makefun-household-budget/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/thaotb30fec-dev/makefun-household-budget/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)


An original, working household budget site that runs entirely offline in a
web browser, on a desktop and on a phone, from its own static files. No
network requests, no libraries, no build step.

## What it does

- **Dashboard** — November 2026 at a glance: income, expenses, balance left,
  savings rate, a spending-by-category donut chart, budgets to watch, recent
  transactions, a quick-add form and savings-goal snapshots.
- **Transactions** — the full list (30 entries) with working filters by type,
  category and search text, plus add, edit and delete. Every change updates
  the totals everywhere.
- **Budgets** — a monthly cap per category with a progress bar, amount spent,
  amount left, and over-budget warnings. Each cap is editable.
- **Goals** — savings goals with progress bars; add funds in any amount and
  create new goals.
- **Reports** — a six-month income-vs-expenses bar chart, the November
  spending mix, and plain-language insights (biggest category, biggest single
  expense, daily average, savings rate, trend).

All data is the Alvarez household's own demo data for November 2026, saved in
the browser's localStorage so edits persist. A "Reset demo data" link in the
footer restores the original figures.

## Run it locally

```sh
node serve.ts            # serves app/ on http://localhost:8080
```

Open http://localhost:8080 in a browser. To hand the entry in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` into `out/` and writes
`out/dossier.json` with the vendored make.fun library.

## Files

- `app/index.html`, `app/style.css`, `app/main.js` — the site shell, styles
  and the hash router with all five sections.
- `app/data.js` — categories, demo transactions, budgets, goals, monthly
  history and the localStorage store.
- `app/charts.js` — canvas donut and bar charts drawn in code.
- `main.ts` — the grader entrypoint (Node 22).
- `serve.ts` — tiny static server for local testing only.
- `shots.json` — the four screenshots and the views they show.
- `screenshots/` — real renders of the running site.
- `vendor/makefun-frontend.ts` — make.fun's dossier library, copied from the
  kit unchanged.
- `LICENSE` — MIT.

## Submission (for the parent)

1. Create a public GitHub repo (e.g. `makefun-household-budget`) and push
   these files to `main` via the browser-upload route. Upload
   `.makefun/owner.json` as a file — never create it in GitHub's web editor,
   which appends a newline and makes it 58 bytes instead of 57.
2. Build the transcript bundle with the kit CLI (bundle is REQUIRED for this
   bounty) and re-run the kit check with the bundle.
3. Submit on https://make.fun/bounty/best-household-budget-site-20261126-1457
   with the pushed commit SHA + the bundle. The submit needs the wallet
   signature — same blocker as the other entries.
4. Deadline: 2026-11-29 21:57 +07 (2026-11-29T14:57:00Z). Prize: $50 across
   10 places ($5 each).
