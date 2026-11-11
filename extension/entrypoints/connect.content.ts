import { sitePatternFor } from "../site";

// Runs only on the site's connect page. It passes the sign-in token from the page
// to the background script. Firefox has no externally_connectable for web pages, so
// a content script with window.postMessage is the method that works in every browser
// (https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts).
const CHANNEL = "readmystudent-extension";

export default defineContentScript({
  matches: [`${sitePatternFor(import.meta.env.MODE)}/extension/connect*`],
  main() {
    const reply = (message: object) => window.postMessage({ channel: CHANNEL, ...message }, location.origin);
    window.addEventListener("message", async (event) => {
      if (event.source !== window || event.origin !== location.origin || event.data?.channel !== CHANNEL) return;
      if (event.data.type === "ping") reply({ type: "pong" });
      if (event.data.type === "connect" && typeof event.data.token === "string") {
        const answer = await browser.runtime
          .sendMessage({ type: "connect", token: event.data.token, expiresAt: event.data.expiresAt })
          .catch(() => null);
        reply({ type: "connected", ok: !!answer?.ok });
      }
    });
  },
});
