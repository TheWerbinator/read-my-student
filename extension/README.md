# ReadMyStudent for Professors (browser extension)

A side panel for Chrome and Edge. It shows a professor's open requests, sealed letters, and profile details for copying into school portals. It talks only to ReadMyStudent. It has no content scripts and no access to other sites.

Built with WXT (https://wxt.dev) and React. This folder has its own `package.json`. The site's build, lint, and tests ignore it.

## How sign-in works

1. The professor clicks Connect in the panel. The extension opens `/extension/connect?id=<extension id>` on the site.
2. The site page checks that the id is in `EXTENSION_IDS` and that the visitor is logged in as a professor.
3. The professor clicks "Connect the extension". The site issues a 30-day token (stored hashed in `public.extension_tokens`) and sends it to the extension with `chrome.runtime.sendMessage`. The manifest key `externally_connectable` allows this for the site's own pages only.
4. The panel calls `/api/extension/summary` and `/api/extension/letters/<id>/pdf` with the token as a Bearer header. Disconnect calls `DELETE /api/extension/token`.

## Local development

1. Run `npm install` in this folder.
2. Run `npx wxt build --mode development`. The build goes to `.output/chrome-mv3-dev` and talks to `http://localhost:3100`.
3. In Chrome, open `chrome://extensions`, turn on Developer mode, click "Load unpacked", and pick `.output/chrome-mv3-dev`.
4. Copy the extension id from that page into `EXTENSION_IDS` in the site's `.env.local`.
5. Build and start the site on port 3100 (`npm run build`, then `npm run start -- -p 3100` in the repo root).
6. Log in as a professor, click the toolbar icon, and click Connect.

`npm run dev` starts WXT's own dev browser with hot reload. It also uses `http://localhost:3100`.

## Release

1. Raise `version` in `package.json`.
2. Run `npm run zip`. The zip for the stores goes to `.output/`. It talks to `https://www.readmystudent.com`.
3. Upload the same zip to the Chrome Web Store and to Microsoft Edge Add-ons. WXT says "No need to create a specific ZIP for Edge" (https://wxt.dev/guide/essentials/publishing.html).
4. After the first upload, each store shows the extension id. Add both ids to `EXTENSION_IDS` in Vercel, comma-separated, and redeploy.

## Icon

`icon.svg` is a placeholder. After a change, regenerate the PNGs from the repo root:

```sh
node -e "const s=require('sharp');Promise.all([16,32,48,128].map(n=>s('extension/icon.svg',{density:300}).resize(n,n).png().toFile('extension/public/icon/'+n+'.png')))"
```
