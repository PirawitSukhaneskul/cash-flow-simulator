/**
 * Arch Firm Cash Flow Simulator — Google Apps Script Backend
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file into the editor
 * 3. Replace SHEET_ID with your Google Sheets document ID
 * 4. Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL
 * 6. Set VITE_GAS_URL=<paste URL here> in your .env file
 * 7. Redeploy the React app to GitHub Pages
 *
 * GOOGLE SHEET SETUP:
 * Create a Google Sheet with two tabs:
 *   - "Submissions" (columns auto-created on first submission)
 *   - "Errors"      (optional — auto-created on first error)
 */

// ── CONFIG — change these ──────────────────────────────────
const CONFIG = {
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE',   // e.g. '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms'
  SUBMISSIONS_TAB: 'Submissions',
  ERRORS_TAB: 'Errors',
  APP_NAME: 'Arch Firm Cash Flow Simulator',
  REPLY_EMAIL: 'your.email@gmail.com',
}

// ── Entry point: POST ──────────────────────────────────────
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No POST body received')
    }
    const data = JSON.parse(e.postData.contents)

    // Validate required fields
    if (!data.email || !data.email.includes('@')) throw new Error('Invalid email: ' + data.email)

    saveToSheet(data)
    sendReportEmail(data)

    return jsonOut({ success: true, message: 'Report sent to ' + data.email })
  } catch (err) {
    logError(err, e)
    return jsonOut({ success: false, error: err.message })
  }
}

// ── Entry point: GET (health check) ───────────────────────
function doGet() {
  return jsonOut({ status: 'ok', app: CONFIG.APP_NAME })
}

// ── Save submission to Google Sheets ──────────────────────
function saveToSheet(data) {
  const ss    = SpreadsheetApp.openById(CONFIG.SHEET_ID)
  let   sheet = ss.getSheetByName(CONFIG.SUBMISSIONS_TAB)

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SUBMISSIONS_TAB)
    sheet.appendRow([
      'Timestamp', 'Email', 'Scenario Name',
      'Experience', 'Has Business', 'Rating', 'Reason',
      'Projects Count', 'Annual Revenue', 'Annual Expenses',
      'Annual Net Profit', 'Annual Tax',
      'Monthly Fixed Cost', 'Initial Capital', 'Tax Rate %',
      'Team Size', 'Payment Delay (mo)', 'Risky Months',
      'Break-even Month', 'Min Safe Balance',
    ])
    sheet.setFrozenRows(1)
    sheet.getRange(1, 1, 1, 20).setFontWeight('bold')
  }

  sheet.appendRow([
    new Date(),
    data.email,
    data.scenarioName || '',
    data.experience   || '',
    data.hasBusiness  || '',
    data.rating       || '',
    data.reason       || '',
    data.projectCount   || 0,
    data.annualRevenue  || 0,
    data.annualExpenses || 0,
    data.annualNetProfit || 0,
    data.annualTax      || 0,
    data.monthlyFixed   || 0,
    data.initialCapital || 0,
    data.taxRate        || 0,
    data.teamSize       || 0,
    data.paymentDelay   || 0,
    data.riskyCount     || 0,
    data.breakEvenMonth || '',
    data.minSafeBalance || 0,
  ])
}

// ── Send HTML email report ─────────────────────────────────
function sendReportEmail(data) {
  const thb = (n) => '฿' + Math.round(n || 0).toLocaleString('en-US')
  const isProfit    = (data.annualNetProfit || 0) >= 0
  const profitColor = isProfit ? '#1a7f4b' : '#e02020'
  const scenName    = data.scenarioName ? ` — ${data.scenarioName}` : ''

  const monthRows = (data.monthlyData || []).slice(0, 12).map(m => {
    const bg  = m.isRisky ? 'background:#fff1f1;' : ''
    const balColor = m.isRisky ? 'color:#e02020;font-weight:bold;' : ''
    return `<tr style="${bg}">
      <td style="padding:5px 10px;border-bottom:1px solid #eee;">${m.monthLabel}</td>
      <td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;color:#1a56db;">${thb(m.revenue)}</td>
      <td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;color:#e02020;">${thb(m.expenses)}</td>
      <td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;color:${m.net >= 0 ? '#1a7f4b' : '#e02020'};">${thb(m.net)}</td>
      <td style="padding:5px 10px;border-bottom:1px solid #eee;text-align:right;${balColor}">${thb(m.balance)}${m.isRisky ? ' ⚠️' : ''}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f5f0;margin:0;padding:24px;">
<div style="max-width:600px;margin:0 auto;">

  <div style="background:#0f0f0f;border-radius:16px;padding:24px;margin-bottom:16px;">
    <div style="font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">${CONFIG.APP_NAME}</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:12px;">Annual Net Profit (Year 1 estimate)</div>
    <div style="font-size:36px;font-weight:800;color:${profitColor};">${thb(data.annualNetProfit)}</div>
    ${data.scenarioName ? `<div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:6px;">${data.scenarioName}</div>` : ''}
  </div>

  <div style="display:flex;gap:10px;margin-bottom:16px;">
    ${[
      { label:'Revenue',  value: thb(data.annualRevenue),   color:'#1a56db' },
      { label:'Expenses', value: thb(data.annualExpenses),  color:'#e02020' },
      { label:'Tax',      value: thb(data.annualTax||0),    color:'#c47c00' },
    ].map(k => `<div style="flex:1;background:white;border-radius:10px;padding:12px;border:1px solid #e0e0e0;">
      <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:4px;">${k.label}</div>
      <div style="font-size:16px;font-weight:700;color:${k.color};">${k.value}</div>
    </div>`).join('')}
  </div>

  <div style="background:white;border-radius:10px;padding:14px;border:1px solid #e0e0e0;margin-bottom:16px;">
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:10px;">Reality Check</div>
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <tr><td style="color:#555;padding:4px 0;">Break-even</td><td style="text-align:right;font-weight:600;">${data.breakEvenMonth ? 'Month ' + data.breakEvenMonth : 'Not reached'}</td></tr>
      <tr><td style="color:#555;padding:4px 0;">Risky Cash Months</td><td style="text-align:right;font-weight:600;color:${(data.riskyCount||0)>0?'#e02020':'#1a7f4b'};">${data.riskyCount||0} months</td></tr>
      <tr><td style="color:#555;padding:4px 0;">Min Safe Balance</td><td style="text-align:right;font-weight:600;">${thb(data.minSafeBalance)}</td></tr>
      ${(data.paymentDelay||0)>0 ? `<tr><td style="color:#555;padding:4px 0;">Payment Delay Mode</td><td style="text-align:right;font-weight:600;color:#c47c00;">+${data.paymentDelay} month(s)</td></tr>` : ''}
    </table>
  </div>

  ${monthRows ? `<div style="background:white;border-radius:10px;overflow:hidden;border:1px solid #e0e0e0;margin-bottom:16px;">
    <div style="padding:10px 14px;border-bottom:1px solid #eee;font-size:11px;font-weight:600;text-transform:uppercase;color:#888;">Monthly Cash Flow — Year 1</div>
    <table style="width:100%;font-size:12px;border-collapse:collapse;">
      <thead><tr style="background:#f7f5f0;">
        <th style="padding:7px 10px;text-align:left;color:#888;font-weight:600;">Month</th>
        <th style="padding:7px 10px;text-align:right;color:#888;font-weight:600;">Revenue</th>
        <th style="padding:7px 10px;text-align:right;color:#888;font-weight:600;">Expenses</th>
        <th style="padding:7px 10px;text-align:right;color:#888;font-weight:600;">Net</th>
        <th style="padding:7px 10px;text-align:right;color:#888;font-weight:600;">Balance</th>
      </tr></thead>
      <tbody>${monthRows}</tbody>
    </table>
  </div>` : ''}

  <div style="text-align:center;color:#aaa;font-size:11px;padding:12px 0;line-height:1.8;">
    Generated by ${CONFIG.APP_NAME}<br>
    Fee % based on ASA guideline — reference only. Verify before commercial use.
  </div>
</div></body></html>`

  MailApp.sendEmail({
    to:       data.email,
    subject:  `${CONFIG.APP_NAME} Report${scenName} — ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM yyyy')}`,
    htmlBody: html,
    replyTo:  CONFIG.REPLY_EMAIL,
    name:     CONFIG.APP_NAME,
  })
}

// ── Error logging ──────────────────────────────────────────
function logError(err, e) {
  try {
    const ss    = SpreadsheetApp.openById(CONFIG.SHEET_ID)
    let   sheet = ss.getSheetByName(CONFIG.ERRORS_TAB) || ss.insertSheet(CONFIG.ERRORS_TAB)
    sheet.appendRow([new Date(), err.message, err.stack, e && e.postData ? e.postData.contents.substring(0, 500) : ''])
  } catch (e2) {
    Logger.log('Error logging failed: ' + e2.message)
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
