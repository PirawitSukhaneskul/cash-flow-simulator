// Live Google Apps Script web app — logs submissions to a Google Sheet, emails
// the report, and tracks page visits. Public anyone-access endpoint by design,
// so it's safe to ship in the client bundle. Override locally with VITE_GAS_URL.
export const GAS_URL =
  import.meta.env.VITE_GAS_URL ||
  'https://script.google.com/macros/s/AKfycbyK1xlRi3u0sJPlvcNTndEv7qXMyrQ19QEvWBvhGtE2ahHoY5aaxsiHNOwOHM8frvhAqA/exec'
