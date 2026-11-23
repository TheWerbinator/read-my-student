# Public release checklist

This guide describes how to make ReadMyStudent for Professors publicly available.
Work on the `extension` branch and submit changes for review before merging or deploying.
Local Chrome testing does not mean that the extension is ready for every browser.

## 1. Confirm the release scope

| Browser | Current repository support | Remaining release work |
| --- | --- | --- |
| Chrome | Manifest V3 side panel; local connection, requests, sealed letters, and PDF download tested | Production verification and Chrome Web Store submission |
| Firefox | Manifest V2 sidebar and build scripts | Manual testing, validation, and Mozilla submission |
| Brave | No dedicated implementation or recorded compatibility test | Test the Chromium build and its side panel before offering the Chrome Web Store listing |
| Opera | No dedicated implementation or recorded compatibility test | Check panel API compatibility, adapt the UI if needed, and prepare distribution |
| Safari | No implementation or packaging workflow | Implement a compatible UI, package, test, and submit through Apple's distribution workflow |

Release Chrome first if the other browsers are not ready. Do not advertise an
untested browser as supported.

## 2. Finish repository checks

- [ ] Use Node.js 22 or later (`.nvmrc` contains `22`).
- [ ] Review the seed, email helper, environment documentation, and lockfile changes.
- [ ] Resolve or explicitly record outstanding lint errors and dependency findings.
- [ ] Run the checks below from the repository root:

```sh
npm ci
npm run lint
npm test -- --runInBand --testPathIgnorePatterns=src/__tests__/integration
npm run build
```

- [ ] From `extension/`, install dependencies and check extension types:

```sh
npm ci
npm run typecheck
```

- [ ] Run the relevant integration tests against local Supabase using the repository's test setup.
- [ ] Review the final diff and approve the release commit. Never commit `.env.local`, tokens, or credentials.

## 3. Prepare the production backend

The public extension requires the production website and its extension API.
Complete this section with deployment approval; these steps affect the hosted service.

- [ ] Confirm the Supabase CLI is linked to the intended production project.
- [ ] Review pending remote migrations before applying anything:

```sh
npx supabase db push --remote --dry-run
```

- [ ] Confirm that `20261117000000_extension_tokens.sql` is included if it has not
  already been applied. If unexpected migrations appear, review them before proceeding.
- [ ] After approval, apply the reviewed migrations:

```sh
npx supabase db push --remote
```

- [ ] Deploy the reviewed website code containing `/extension/connect`,
  `/api/extension/*`, and `src/lib/extension-auth.ts`.
- [ ] Verify production environment variables and the real email configuration.
  Leave `EMAIL_TRANSPORT` unset in production so the email helper uses Resend.
- [ ] Confirm the production site is accessible over HTTPS at
  `https://www.readmystudent.com`.
- [ ] Confirm the public privacy policy accurately describes extension authentication,
  profile data, requests, letters, and local token storage.

Never run `seed:local` against production or publish the local test credentials.

## 4. Prepare store assets and reviewer information

- [ ] Confirm the public extension name, description, and version in `extension/package.json`
  and `extension/wxt.config.ts`.
- [ ] Approve the extension icon; the current repository icon is a placeholder.
  Follow `extension/README.md` to regenerate its PNG sizes after changing the SVG.
- [ ] Capture screenshots showing the professor panel with non-sensitive example data.
- [ ] Prepare a support contact and the privacy policy URL:
  `https://www.readmystudent.com/privacy`.
- [ ] Explain the single purpose: helping professors access their own recommendation
  requests, sealed letters, and profile details while completing school forms.
- [ ] Explain each requested permission and declare the data actually handled.
  `TODO.md`, under "Browser extension", contains suggested permission descriptions.
- [ ] Prepare reviewer instructions for connecting a professor account and exercising
  the panel. Supply any required review access privately through the store dashboard.

## 5. Build and verify the production Chrome package

From `extension/`:

```sh
npm run zip
```

The release ZIP is generated under `extension/.output/`. Do not upload
`.output/chrome-mv3-dev`: that development build targets localhost.

- [ ] Inspect the release manifest and bundled configuration: the website permissions
  and connect flow must target production, not localhost.
- [ ] Test the production build before submission, using an approved professor test account.
- [ ] Verify Connect, profile copying, requests, Write letter, sealed letters,
  PDF download, Refresh, Disconnect, and reconnection.
- [ ] Verify that the extension continues to work after restarting the browser.
- [ ] Confirm unauthorized accounts cannot access another professor's letters.
- [ ] Keep the tested ZIP and its source commit together as release records.

## 6. Submit Chrome to the store

- [ ] Register a Chrome Web Store developer account and complete the current account
  requirements, including the one-time registration fee.
- [ ] Create the extension listing and upload the tested production ZIP.
- [ ] Complete the listing, privacy disclosures, permission explanations,
  reviewer instructions, and distribution settings.
- [ ] Choose the intended visibility and publication timing.
- [ ] Submit for review and address any reviewer feedback.
- [ ] After approval and publication, install from the store and repeat the connection
  and PDF-download checks.
- [ ] Add the approved store link to the website and user instructions.

See Google's [developer registration](https://developer.chrome.com/docs/webstore/register/)
and [publication guide](https://developer.chrome.com/docs/webstore/publish).
Store approval timing is controlled by Google; submitting a ZIP does not guarantee publication.

## 7. Release Firefox

- [ ] Test the sidebar locally using the Firefox instructions in `extension/README.md`.
- [ ] Verify the manifest version, permissions, and data declarations against Mozilla's
  requirements at submission time. The repository currently generates Manifest V2.
- [ ] Confirm the add-on ID `extension@readmystudent.com` before the first submission;
  retain the published identity for subsequent updates.
- [ ] From `extension/`, generate the packages:

```sh
npm run zip:firefox
```

- [ ] Test the production Firefox build against the deployed website.
- [ ] Submit through Mozilla Add-ons, including the source archive and reproducible
  build instructions for the bundled code.
- [ ] Resolve validation or review feedback, then verify the signed public installation.

See Mozilla's [submission guide](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)
and [source submission requirements](https://extensionworkshop.com/documentation/publish/source-code-submission/).

## 8. Validate Brave and Opera

Brave supports installing extensions from the Chrome Web Store, but this extension's
side panel still requires an actual Brave compatibility test before claiming support.
See [Brave's extension guidance](https://brave.com/learn/using-chrome-extensions-in-brave/).

- [ ] Test the production Chromium build in each browser separately.
- [ ] Check panel opening, authentication, requests, profile copying, PDF download,
  Disconnect, and browser restart behavior.
- [ ] If a browser does not support the panel API used here, implement and test an
  appropriate alternative before distributing it there.
- [ ] For Brave, verify installation from the published Chrome Web Store listing.
- [ ] For Opera, select and verify the distribution route. If submitting to Opera
  Add-ons, follow its [publishing guidelines](https://help.opera.com/en/extensions/publishing-guidelines/).

There are no dedicated Brave or Opera release commands in this repository yet.

## 9. Implement and release Safari

Safari is a separate implementation and release task, not an existing ZIP target.

- [ ] Choose the supported Apple platforms and minimum OS versions.
- [ ] Audit the panel, background, storage, and connection APIs for Safari compatibility.
- [ ] Implement an appropriate interface where Chrome side panel behavior is unavailable.
- [ ] Choose an Apple-supported packaging workflow and add reproducible build instructions.
- [ ] Enroll in the Apple Developer Program and configure the required app identity,
  signing, privacy information, and App Store listing.
- [ ] Test connection, token persistence, requests, letters, downloads, and disconnection
  on every advertised platform.
- [ ] Submit the package through the selected Apple distribution workflow and test
  the approved public installation.

See Apple's [Safari distribution documentation](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension)
and [App Store Connect packaging workflow](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect).

## 10. Maintain public releases

- [ ] Increase the extension version for subsequent store updates.
- [ ] Rebuild and test each supported browser package from the reviewed source commit.
- [ ] Keep browser listings, screenshots, privacy disclosures, and support links accurate.
- [ ] Keep the deployed backend compatible with extension versions still in use.
- [ ] Monitor connection and download failures without logging authentication tokens
  or private letter contents.
- [ ] Record release versions, store links, supported browsers, and known limitations.
