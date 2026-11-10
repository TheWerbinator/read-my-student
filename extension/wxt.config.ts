import { defineConfig } from "wxt";
import { siteFor } from "./site";

// https://wxt.dev/guide/essentials/config/manifest.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: ({ mode }) => {
    const site = siteFor(mode);
    return {
      name: "ReadMyStudent for Professors",
      description: "Your recommendation requests, sealed letters, and profile details, in the browser side panel.",
      // No content scripts and no access to other sites: the extension only talks to ReadMyStudent.
      permissions: ["sidePanel", "storage"],
      host_permissions: [`${site}/*`],
      // Lets the connect page on the site hand over the sign-in token.
      externally_connectable: { matches: [`${site}/*`] },
      action: { default_title: "Open ReadMyStudent" },
    };
  },
});
