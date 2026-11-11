import { siteFor } from "../site";

const SITE = siteFor(import.meta.env.MODE);

// Firefox has a sidebar instead of the side panel, and its own API to open it.
type Sidebar = { toggle: () => Promise<void> };

export default defineBackground(() => {
  if (browser.sidePanel) {
    // Chrome and Edge: clicking the toolbar icon opens the side panel.
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
  } else {
    // Firefox: toggle() must run inside the click handler (a user action).
    const ff = browser as unknown as { sidebarAction: Sidebar; browserAction?: typeof browser.action };
    (browser.action ?? ff.browserAction)?.onClicked.addListener(() => ff.sidebarAction.toggle());
  }

  // The connect content script sends the token here (entrypoints/connect.content.ts).
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const fromSite = sender.id === browser.runtime.id && !!sender.url && new URL(sender.url).origin === SITE;
    if (!fromSite || message?.type !== "connect" || typeof message.token !== "string") return;
    browser.storage.local
      .set({ token: message.token, expiresAt: message.expiresAt })
      .then(() => sendResponse({ ok: true }));
    return true; // keeps the channel open for the async answer
  });
});
