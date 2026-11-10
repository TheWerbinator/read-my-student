// The site the extension talks to. `npm run dev` uses the local server on port 3100,
// `npm run build` and `npm run zip` use production. The apex domain redirects, so use www.
export function siteFor(mode: string): string {
  return mode === "production" ? "https://www.readmystudent.com" : "http://localhost:3100";
}
