import { siteFor } from "../site";

const SITE = siteFor(import.meta.env.MODE);

export default defineBackground(() => {
  // Clicking the toolbar icon opens the side panel.
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

  // The connect page on the site sends the token here (src/app/(auth)/extension/connect).
  browser.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    const fromSite = !!sender.url && new URL(sender.url).origin === SITE;
    if (!fromSite || message?.type !== "connect" || typeof message.token !== "string") return;
    browser.storage.local
      .set({ token: message.token, expiresAt: message.expiresAt })
      .then(() => sendResponse({ ok: true }));
    return true; // keeps the channel open for the async answer
  });
});
