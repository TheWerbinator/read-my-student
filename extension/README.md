# ReadMyStudent for Professors (browser extension)

A side panel for Chrome and Edge, and a sidebar for Firefox. It shows a professor's open requests, sealed letters, and profile details for copying into school portals. It talks only to ReadMyStudent. Its one content script runs only on the ReadMyStudent connect page.

Built with WXT (https://wxt.dev) and React. This folder has its own `package.json`. The site's build, lint, and tests ignore it. Chrome and Edge get Manifest V3. Firefox gets Manifest V2, which is the WXT default for Firefox (https://wxt.dev/guide/essentials/target-different-browsers.html).

## How sign-in works

1. The professor clicks Connect in the panel. The extension opens `/extension/connect` on the site.
2. The site page checks that the visitor is logged in as a professor.
3. The professor clicks "Connect the extension". The page asks the extension's content script (`entrypoints/connect.content.ts`) whether it is there. If it answers, the site issues a 30-day token (stored hashed in `public.extension_tokens`), and the page passes it to the content script with `window.postMessage`. The content script hands it to the background script, which stores it. Firefox does not let web pages message an extension directly ("In Firefox, neither API is supported", https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/externally_connectable), so every browser uses this method.
4. The panel calls `/api/extension/summary` and `/api/extension/letters/<id>/pdf` with the token as a Bearer header. Disconnect calls `DELETE /api/extension/token`.

## Test it on your computer

Use Node.js 22 or later. The repository includes `.nvmrc` for nvm users.
Run `nvm install` and `nvm use` from the repository root if you use nvm.

Before starting, install the root dependencies with `npm ci`.
Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with the local Publishable key.
- `SUPABASE_SECRET_KEY` with the local Secret key.
- `NEXT_PUBLIC_SITE_URL=http://localhost:3100`
- `PDF_SIGNING_SECRET` with a random string of at least 32 characters.

Get the local Supabase keys after starting the stack with `npx supabase status`.
Never commit `.env.local`.

The seed creates test accounts and catalog entries; it does not create requests
or letters.

For local request and delivery emails, add `EMAIL_TRANSPORT=local` to `.env.local`.
Start Supabase with the SMTP port configured in `supabase/config.toml`, then
restart the website after changing the environment variable.

View captured emails at http://127.0.0.1:54324. Local emails are not sent to real
recipients. Other email flows may still use Resend directly.

Without `EMAIL_TRANSPORT=local`, request and delivery emails use Resend and
require a valid `RESEND_API_KEY`. Do not enable local email mode in production.

The test build talks to the site on `http://localhost:3100`, with the local Supabase stack.

1. In the repo root, run `npx supabase start`, then `npx supabase migration up` (local by default), then `npm run seed:local` if the stack is new.
2. In the repo root, run `npm run build`, then `npm run start -- -p 3100`.
3. In this folder, run `npm install` once.
4. Build and load the extension for each browser:
   - Chrome or Edge: run `npm run build:local`. Open `chrome://extensions` (Edge: `edge://extensions`), turn on Developer mode, click "Load unpacked", and pick the folder `.output/chrome-mv3-dev`.
   - Firefox: run `npm run build:local:firefox`. Open `about:debugging`, click "This Firefox", click "Load Temporary Add-on", and pick `.output/firefox-mv2-dev/manifest.json`. Firefox removes it when Firefox restarts (https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).
5. Log in on `http://localhost:3100` as a professor (seeded account: `faculty@test.local`, password `TestPassword1!`).
6. Click the extension's toolbar icon. If Chrome hides it, click the puzzle-piece icon and pin it. Click Connect, then "Connect the extension" on the page that opens.

After a code change, run the build again and click the reload icon on the extension's card (Chrome) or "Reload" (Firefox).

`npm run dev` starts WXT's own browser with hot reload. [INFERRED] It might not load the extension into normal Google Chrome, because Chrome 137 removed "the ability to load extensions via the `--load-extension` command-line flag in official Chrome branded builds" (https://groups.google.com/a/chromium.org/g/chromium-extensions/c/1-g8EFx2BBY/m/S0ET5wPjCAAJ). Use "Load unpacked" instead.

## Release

1. Raise `version` in `package.json`.
2. Run `npm run zip` for Chrome and Edge, and `npm run zip:firefox` for Firefox. The zips go to `.output/` and talk to `https://www.readmystudent.com`.
3. Upload the same Chrome zip to the Chrome Web Store and to Microsoft Edge Add-ons. WXT says "No need to create a specific ZIP for Edge" (https://wxt.dev/guide/essentials/publishing.html).
4. Upload the Firefox zip and the sources zip to addons.mozilla.org. WXT says "When running `wxt zip -b firefox`, WXT will zip both your extension and sources" (same page).

## Icon

`icon.svg` is a placeholder. After a change, regenerate the PNGs from the repo root:

```sh
node -e "const s=require('sharp');Promise.all([16,32,48,128].map(n=>s('extension/icon.svg',{density:300}).resize(n,n).png().toFile('extension/public/icon/'+n+'.png')))"
```
