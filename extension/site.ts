// The site the extension talks to. The local builds use the local server on port 3100,
// `npm run build` and the zips use production. The apex domain redirects, so use www.
export function siteFor(mode: string): string {
  return mode === "production" ? "https://www.readmystudent.com" : "http://localhost:3100";
}

// The same site for manifest match patterns. Firefox "doesn't support the inclusion of a port
// number", and Chrome reads `http://localhost/*` as any localhost port
// (https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns,
// https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns).
export function sitePatternFor(mode: string): string {
  return mode === "production" ? "https://www.readmystudent.com" : "http://localhost";
}
