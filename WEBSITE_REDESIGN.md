# Doable website redesign

Implemented 13 October 2026 from the approved UnifiedUI reference study in `design-reference/unifiedui/DESIGN_PLAN.md`.

## Website and routes

- `/`: original public website with charcoal/mint typography, local photographic service cards, professional invitation, all seven professions, booking explanation, FAQ and footer.
- `/services`: pincode/service directory. URL changes synchronize the form and results, invalid/empty searches clear old results, stale responses cannot overwrite later searches, and the same search can be retried. Selecting a professional opens a useful public profile and carries the professional into customer login and booking.
- `/login`: shared customer/professional sign-in, password visibility, remembered identifier, and development-only local demo shortcuts.
- `/register-customer` and `/register-worker`: shared registration layout with persistent labels, inline API errors and existing API payloads.
- Existing dashboard routes use a shared website header, desktop sidebar and responsive content layouts. The outer content uses the original centered 1200px maximum width with responsive gutters, as restored at the user’s request. The photo/mint invitation remains full width and retains its original wide-screen content offsets. Inner search, authentication forms and prose keep readable lengths. Narrow widths wrap navigation and forms without a device frame.

## Preserved and connected features

Customer profile editing/password change, seven-service search, worker information/photo/contact, date/availability checks, job description, address/phone, optional location, up to six photos, booking submission, tracking, history and booking details remain connected to their original endpoints. Customer history/details now display status and consume the API's `clientAddress` field. Data and blob photo URLs are preserved rather than prefixed with the API host.

Professional profile editing/photo/password, search/filter/sort/pagination, job details/photos/contact/location, status transitions, terminal request hiding and date blocking/unblocking remain connected. Job-photo uploading is now exposed for normal professionals through the existing endpoint. Existing photo previews remain in request lists and detail galleries.

Dashboard feedback uses inline dismissible notices. Potentially consequential confirmations use an in-page keyboard-accessible dialog with Escape, focus containment and focus restoration, so native alerts no longer block the browser during booking success.

Development demos retain the existing `demoApi.js` adapter and browser-only storage. Unsupported demo passwords and professional photo uploads are explained without presenting a false success. Entering a demo from a real professional profile clears the unsupported selection and explains how to use the sample professional. Normal login and registration stop demo interception and continue to use the existing hosted backend.

## Main implementation files

- `client/src/website.css`: shared design tokens, public layout, auth, workspaces, forms, calendar and responsive styles.
- `client/src/SiteUI.js`: shared logo/header/footer, fields, status, avatars, workspace shell and booking summary.
- `client/src/Landing.js`, `PublicServices.js`: public website and directory.
- `client/src/AuthLayout.js`, `Registration.js`, `Login.js`: account pages.
- `client/src/CustomerDashboard.js`, `WorkerDashboard.js`: preserved feature handlers with redesigned views.
- `client/src/Feedback.js`: inline feedback and confirmation dialog.

Licensed photos live in `client/public/images/stock/`; `sources.json` records primary source pages, photographers and license. Reference artwork is research-only and is not shipped in the website.

## Validation

`npm run build --prefix client` succeeds. `CI=true npm test --prefix client -- --watchAll=false --runInBand` passes ten integration tests covering public navigation/search synchronization and clearing, selected-worker login and registration handoffs, customer status/address/photos, demo password limitations, workspace login redirect, booking submission feedback, and worker status/hiding. Tests mock API calls; they do not mutate hosted data. Jest entry mappings accommodate the existing React Router 7 package with CRA's Jest 27 resolver; no runtime dependency changed.

The independent screenshot review and coverage are recorded in `design-review/REVIEW.md`. The development server is served at `http://127.0.0.1:3000`.

## Limits

No backend code, hosted account/data, deployment or Git commit was changed. Existing authentication/session/ownership limitations documented in `FEATURE_REPORT.md` remain backend work. Prices, payments, ratings and verification are not invented. Photos are illustrative service imagery, not claims about actual registered professionals. External Google Fonts use system sans-serif fallbacks if unavailable. Production intentionally omits local demo shortcuts.
