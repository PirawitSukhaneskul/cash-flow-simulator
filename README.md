# Arch Firm Cash Flow Simulator

An interactive, iOS-17-style cash flow simulator for architecture / interior / BIM firms.
Plan projects, staff, software and overhead, then see a month-by-month cash flow
projection with risk alerts, scenario comparison, and an emailed Excel report.

> **Fee note:** Design-fee percentages are based on an **ASA-style** architectural
> professional-fee guideline and are provided **for reference only**. Verify before
> commercial use — actual fees depend on scope, complexity, and agreement between parties.

## Features

- **Email-gated public simulator** with a privacy notice before any data is collected.
- **Project-based revenue** — add projects one by one (size preset, ASA building type,
  construction cost, editable design-fee % vs guideline, payment milestones, start month,
  per-project payment delay). `Design Fee Revenue = Construction Cost × Design Fee %`.
- **Software logo selector** grouped by category, with editable price/users and preset
  packs (Architecture / Interior / BIM). `Annual Cost = Price/User/Month × Users × 12`.
- **Worst Case mode** — Normal / +1 / +2 / +3 month payment delay that shifts income
  (not expenses) and live-updates the chart, risky months, and safe-cash alerts.
- **Dashboard** — KPI cards, expense donut, and a combo cash-flow chart (revenue + expense
  bars, balance line, quarter dividers, red dashed minimum-safe-cash line; values on hover).
- **Save & compare** up to 4 scenarios with a best-scenario recommendation and risk warnings.
- **Excel report by email** + **/admin** dashboard (passcode-gated) with CSV export,
  powered by Google Apps Script + Google Sheets.

## Tech

React + Vite · Recharts · Lucide icons · Google Apps Script + Google Sheets (backend).

## Local development

```bash
npm install
npm run dev      # http://localhost:5180/
```

## Backend (email + Google Sheets logging)

The report flow posts to a Google Apps Script web app. Without it the app runs in
**simulated (dev) mode** — the UI works and shows success, but no email is sent.

1. Create a Google Sheet and bind the script in [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
2. Deploy it as a **Web app** (execute as you, access: anyone) and copy the URL.
3. Set the URL as a build-time env var:
   - Local: copy `.env.example` to `.env` and set `VITE_GAS_URL=...`
   - GitHub Pages: add a repo secret named `VITE_GAS_URL` (the deploy workflow reads it).

## Deploy (GitHub Pages)

This repo ships a GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
that builds and publishes to GitHub Pages on every push to `main`.

**One-time setup:** in the repo, go to **Settings → Pages → Build and deployment →
Source: GitHub Actions**. After the next push, the site is live at:

```
https://pirawitsukhaneskul.github.io/cash-flow-simulator/
```

The Vite `base` is set to `/cash-flow-simulator/` for production builds, and a
`404.html` fallback is generated so client-side routes (`/admin`, `/compare`) survive
a hard refresh.

## Admin

Visit `/admin` and enter the passcode. For a real launch, replace the hard-coded
passcode with proper authentication.
