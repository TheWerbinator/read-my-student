import { defineConfig } from "wxt";
import { sitePatternFor } from "./site";

// https://wxt.dev/guide/essentials/config/manifest.html
// Firefox builds as Manifest V2, the WXT default for Firefox
// (https://wxt.dev/guide/essentials/target-different-browsers.html).
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: ({ mode, browser }) => {
    const site = sitePatternFor(mode);
    return {
      name: "ReadMyStudent for Professors",
      description: "Your recommendation requests, sealed letters, and profile details, in the browser sidebar.",
      // No access to other sites: the extension only talks to ReadMyStudent, and its one
      // content script runs only on the ReadMyStudent connect page.
      permissions: browser === "firefox" ? ["storage"] : ["sidePanel", "storage"],
      host_permissions: [`${site}/*`],
      action: { default_title: "Open ReadMyStudent" },
      ...(browser === "firefox" && {
        browser_specific_settings: {
          gecko: {
            // Permanent after the first AMO upload. Mozilla does not assign one.
            id: "extension@readmystudent.com",
            // Required for new AMO submissions since 2025-11-03
            // (https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/).
            data_collection_permissions: { required: ["authenticationInfo", "personallyIdentifyingInfo"] },
          },
        },
      }),
    };
  },
});
