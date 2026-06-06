# Handoff — Arch Firm Cash Flow Simulator (continue the remaining work)

Paste this whole file into a new chat to continue. It contains full context, what's
already done, what's in progress, and exactly what's left with step-by-step instructions.

---

## 0. Project facts (environment)

- **Local repo path:** `D:\Program Files\Git\arch-firm-simulator`
- **GitHub repo:** `PirawitSukhaneskul/cash-flow-simulator` (PRIVATE), branch `main`
- **Live site:** https://pirawitsukhaneskul.github.io/cash-flow-simulator/ (GitHub Pages)
- **Local dev:** `npm run dev` → http://localhost:5180/ (port pinned in `vite.config.js` + `.claude/launch.json`)
- **Stack:** React + Vite + Recharts + Lucide. Backend = Google Apps Script + Google Sheets.
- **Deploy:** auto — every push to `main` triggers `.github/workflows/deploy.yml` (build + Pages). Pages already enabled.
- **`gh` CLI is NOT installed.** Use plain `git`. A GitHub token (scopes: repo, workflow) can be
  retrieved non-interactively for API calls (enabling Pages, polling runs) with:
  ```powershell
  $inf=Join-Path $env:TEMP "ghc_in.txt"; $outf=Join-Path $env:TEMP "ghc_out.txt"
  Set-Content $inf "protocol=https`nhost=github.com`n" -NoNewline -Encoding ascii
  Start-Process git -ArgumentList "credential fill" -RedirectStandardInput $inf -RedirectStandardOutput $outf -NoNewWindow -Wait
  $TK=(@(Get-Content $outf)|?{$_ -like 'password=*'}) -replace '^password=',''
  ```
- **Shell:** Windows PowerShell 5.1. No `&&`. Read files as UTF-8 when copying to clipboard
  (`Get-Content -Raw -Encoding UTF8`) or Thai/฿/emoji become mojibake.
- **Browser control:** Claude-in-Chrome MCP works (DOM + clicks). Google OAuth consent popups open in
  a SEPARATE window that the MCP cannot reach — the USER must click through those.
- **Vite base:** production base = `/cash-flow-simulator/`; logos use `import.meta.env.BASE_URL`; router
  has `basename`; `404.html` SPA fallback generated on build. Local dev base = `/`.

## 1. Email backend (current state — WORKING)

- Google Apps Script web app deployed under Google account **pirawit.win@gmail.com** (NOTE: GitHub
  login is a different identity, `PirawitSukhaneskul`).
- Source: `google-apps-script/Code.gs`. It auto-creates its own Google Sheet
  ("Arch Firm Simulator — Submissions") in My Drive root on first POST, logs the submission, and emails
  an HTML report via `MailApp`. Tested working (real email delivered; GET health check returns
  `{"status":"ok"}`).
- The exec URL is hardcoded as the default of `GAS_URL` in `src/components/Questionnaire.jsx`
  (public anyone-access endpoint, safe to ship; `VITE_GAS_URL` env can override). Current URL:
  `https://script.google.com/macros/s/AKfycbyK1xlRi3u0sJPlvcNTndEv7qXMyrQ19QEvWBvhGtE2ahHoY5aaxsiHNOwOHM8frvhAqA/exec`
- Email UX: NO email gate on the home page (simulator loads immediately). Email is collected as step 1
  of 4 in the export "Get Excel Report" questionnaire (`src/components/Questionnaire.jsx`).

## 2. Already DONE and deployed (do not redo)

- Fixed blank-screen crash (cash flow chart `ReferenceLine`s needed `yAxisId` in dual-Y-axis chart).
- Fixed Worst Case mode (global payment delay now stacks on per-project delay in `utils/calculations.js`).
- All baht INPUT fields show thousands separators via a `MoneyInput` (text + inputMode=numeric) in
  `src/components/InputPanel.jsx` (construction cost, capital, salaries, software prices, min-safe).
- Software selector grouped by category (`SOFTWARE_CATEGORY_ORDER` in `data/softwareCatalog.js`).
- Cash flow chart values show on hover only (no per-point labels; vertices kept).
- Software list: removed Dynamo + Speckle; added ChatGPT Plus + Gemini (emoji icons); D5 Render uses
  emoji (its PNG was wrong); kept Enscape. (`data/softwareCatalog.js`)
- Live email backend wired + tested (see section 1).

## 3. CURRENT REQUEST — 4 items (this is the work to finish)

### Item 1 — Move "Annual Net Profit" ABOVE the cash flow graph  ⚠️ IN PROGRESS (half done)
Desired output order in `src/components/OutputPanel.jsx`:
1. **Annual Net Profit hero** (top)
2. **Cash Flow Projection graph**
3. **Annual Revenue + Annual Expenses** row
4. **Reality Check** (4 boxes), then charts-grid, monthly table, banners.

**What's already changed:** `KPISection` was split into two components: `NetProfitHero` and `RevExpRow`
(both already exist in `OutputPanel.jsx`).

**What's LEFT (the only remaining edit for item 1):** update the main `OutputPanel` return so it renders
in the new order. It currently still references the OLD structure (graph first, then `<KPISection .../>`).
Replace the top of the returned JSX with:
```jsx
return (
  <div className="output-panel">
    {/* 1. Annual Net Profit hero on top */}
    <NetProfitHero results={results} inputs={inputs} />
    {/* 2. Cash Flow Projection graph */}
    <ComboCashChart
      data={results.monthlyData}
      months={inputs.months}
      minSafeBalance={results.minSafeBalance}
      initialCapital={inputs.initialCapital}
      paymentDelay={inputs.paymentDelay}
    />
    {/* 3. Annual Revenue + Annual Expenses */}
    <RevExpRow results={results} />
    {/* 4. Reality Check */}
    <RealityCheck results={results} inputs={inputs} />
    <div className="charts-grid">
    ... (keep ExpenseDonut, ScenarioSummary, MonthlyTable, banners as-is)
```
Note: `<KPISection .../>` no longer exists — make sure it's not referenced anywhere. Verify in preview
that order is NetProfitHero → graph → RevExpRow → RealityCheck.

### Item 2 — Send email FROM pirawit.su@gmail.com  (NOT STARTED — needs user + browser)
`MailApp` sends from whichever Google account EXECUTES the script. The current deployment runs as
pirawit.win@gmail.com, so emails come from pirawit.win. To send from **pirawit.su@gmail.com**, the
Apps Script must be deployed under that account. The user said "I already open on my laptop" (they have
pirawit.su open / logged in).

Steps (drive via Claude-in-Chrome MCP; user does the OAuth consent popup):
1. In Chrome, ensure the active Google account for script.google.com is **pirawit.su@gmail.com**
   (check the account avatar; may need account switcher). Verify with a screenshot first.
2. Go to https://script.google.com/home → New project (opens in same tab).
3. Put `google-apps-script/Code.gs` content on the OS clipboard with
   `Get-Content -Raw -Encoding UTF8 <path> | Set-Clipboard` (UTF-8 is critical for ฿/emoji), then in the
   editor: click code area → Ctrl+A → Ctrl+V → Ctrl+S. (Typing corrupts code via bracket auto-close —
   must paste.)
4. Deploy → New deployment → gear → Web app → Execute as: **Me (pirawit.su)**, Who has access:
   **Anyone** → Deploy → Authorize access. **The USER must complete the Google consent popup**
   (pick pirawit.su → Advanced → Go to project (unsafe) → Allow). The popup is a separate window the
   MCP cannot click.
5. Deploy → Manage deployments → copy the new Web app `/exec` URL (extract exact href via
   `javascript_tool`, don't transcribe from screenshot).
6. Update `GAS_URL` default in `src/components/Questionnaire.jsx` to the new URL. Build, commit, push.
7. Test: `Invoke-RestMethod` GET (health) + POST a sample payload → confirm a real email arrives from
   pirawit.su@gmail.com.
Reference: a working sample POST payload is in section 5.

### Item 3 — Add an "Edit" button to each project after it's added  (NOT STARTED — frontend)
In `src/components/InputPanel.jsx`, the Projects tab lists added projects but each row only has a delete
(Trash) action. Add an **Edit** (pencil) button per project that re-opens the project modal
(`AddProjectModal`) pre-filled with that project's values, and on save UPDATES that project in place
instead of adding a new one.
- The modal component (`AddProjectModal`) currently only supports add. Add an optional `editProject`
  (or `initialProject` + `editIndex`) prop. When editing, initialize all modal state (type, cost,
  feePercent, guideline, startMonth, duration, paymentDelay, milestonePreset, milestones, name) from it,
  and the save handler should call an `onUpdate(index, project)` instead of `onAdd`.
- Wire `onUpdate` in the ProjectsTab to replace `projects[index]` via the existing `update({ projects })`.
- Keep the same milestone 100% validation. Verify in preview: add a project, click Edit, change cost,
  save → the same project updates (count doesn't increase) and dashboard recalculates.

### Item 4 — Visitor count at the bottom of the site  (NOT STARTED)
Show a small "👁 N visits" (page-view count) pinned at the very bottom of the app.
Recommended implementation using the existing GAS backend (do this together with item 2's redeploy so
it's in the same script/version):
- In `Code.gs`, handle a visit action in `doGet(e)`: if `e.parameter.action === 'visit'`, increment a
  counter in `PropertiesService.getScriptProperties()` (key `VISITS`) and return `{count: N}`. Keep the
  existing health check for no-action GET. (No new OAuth scopes needed — PropertiesService + ContentService.)
- Frontend: on app mount (e.g. in `App.jsx` or a small `<VisitorCounter/>`), `fetch(GAS_URL + '?action=visit')`,
  read `{count}`, display at the bottom. IMPORTANT: GAS GET is usually CORS-readable (ACAO:*), but the
  POST path in Questionnaire uses a no-cors fallback. TEST the GET fetch from the browser first
  (`fetch(url+'?action=visit').then(r=>r.json())`). If CORS blocks reading, fall back to a CORS-enabled
  free counter (e.g. counterapi.dev) or gracefully hide the number. De-dupe per session with
  sessionStorage so a reload doesn't double-count if desired.
- Style: tiny muted text, centered, fixed/at the end of the page; don't overlap the mobile sticky action bar.

## 4. DEFERRED earlier (user said "not now" — only if they ask)

Both need ONE Google re-authorization (new Drive + external_request scopes) and a GAS redeploy:
1. **Drive folder organization.** Approved Drive folder id `1jQMshy5KuNhNF7M_1xMD9nmAxgdeGLjt`. Structure:
   `/Arch_Firm_Cash_Flow_App/{01_Database, 02_Email_Reports, 03_Exports, 04_Test_Files}`. Names: DB sheet
   `ARCH_CASHFLOW_USER_SUBMISSIONS`; report `cashflow_report_[email]_[date]_[scenario]`; admin export
   `admin_export_[date].csv`. Move the current submissions sheet (in My Drive root) into 01_Database.
   Rule: the Claude agent keeps its own files in the LOCAL project folder only (never the user's Drive);
   the GAS backend uses the approved Drive folder.
2. **Richer report → PDF with charts** (user's choice over xlsx): cash flow chart + all inputs (projects,
   software, team, costs, worst-case, min safe cash) + KPIs + scenario comparison + compare-page warnings,
   projection length matching `inputs.months`, attached to the email and saved to 02_Email_Reports. This
   also requires expanding the frontend payload (full inputs + full monthlyData + savedScenarios passed
   into `Questionnaire`).

## 5. Reference — sample GAS test payload (PowerShell)

```powershell
$url = "<GAS exec URL>"
Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 30 -UseBasicParsing   # health
$payload = @{ email='pirawit.su@gmail.com'; experience='3–7 ปี'; hasBusiness='owner'; rating=5;
  reason='test'; scenarioName='Test'; projectCount=3; annualRevenue=4275000; annualExpenses=3200000;
  annualNetProfit=860000; annualTax=215000; monthlyFixed=266667; initialCapital=1500000; taxRate=20;
  teamSize=3; paymentDelay=0; riskyCount=2; breakEvenMonth=8; minSafeBalance=900000;
  monthlyData=@(@{monthLabel='Jan';revenue=270000;expenses=266667;net=3333;balance=1503333;isRisky=$false}) } | ConvertTo-Json -Depth 6
Invoke-RestMethod -Uri $url -Method Post -Body $payload -ContentType 'application/json' -TimeoutSec 60 -UseBasicParsing
```

## 6. Key files

- `src/App.jsx` — routes, scenario state (save/compare/edit/duplicate/rename), BrowserRouter basename.
- `src/pages/SimulatorPage.jsx` — simulator page (email gate removed; loads simulator directly).
- `src/components/InputPanel.jsx` — Team/Projects/Software/Costs tabs, `MoneyInput`, `AddProjectModal`
  (ITEM 3 here), Worst Case mode, software selector grouped by category.
- `src/components/OutputPanel.jsx` — dashboard: `NetProfitHero`, `RevExpRow`, `ComboCashChart`,
  `RealityCheck` (4 boxes), `ExpenseDonut`, `ScenarioSummary`, `MonthlyTable` (ITEM 1 main-order edit here).
- `src/components/Questionnaire.jsx` — 4-step export flow; `GAS_URL` lives here (ITEMS 2 & 4 wiring).
- `src/data/softwareCatalog.js` — software list + packs + category order.
- `src/data/defaults.js` — default inputs, team packs, milestone presets, office defaults.
- `src/data/asa.js` — ASA fee matrix + project types + size presets.
- `src/utils/calculations.js` — cash flow engine + `fmt`/`fmtFull` (comma formatters).
- `google-apps-script/Code.gs` — backend (ITEMS 2 & 4 backend).
- `.github/workflows/deploy.yml` — Pages deploy.

## 7. Definition of done for this round

- [ ] Item 1: dashboard order = NetProfitHero → graph → RevExpRow → RealityCheck (verified in preview).
- [ ] Item 2: emails arrive FROM pirawit.su@gmail.com (new GAS deploy under that account; GAS_URL updated; tested).
- [ ] Item 3: each added project has an Edit button that updates it in place (verified).
- [ ] Item 4: live visitor count shows at the bottom (GET fetch tested for CORS; graceful fallback).
- [ ] Build passes (`npm run build`), committed, pushed; deploy run succeeds; live site verified.
- [ ] Update memory file `project-arch-cashflow-simulator.md` with new state.
