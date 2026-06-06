// Live Google Apps Script web app — logs submissions to a Google Sheet, emails
// the report, and tracks page visits. Public anyone-access endpoint by design,
// so it's safe to ship in the client bundle. Override locally with VITE_GAS_URL.
export const GAS_URL =
  import.meta.env.VITE_GAS_URL ||
  'https://script.google.com/macros/s/AKfycbzosxMaG_JCbmOnm1dSdUQz5scoybBWJZL8ecSZz3tk0uT1WbyK-RgcHdWglRGVX2cu/exec'
