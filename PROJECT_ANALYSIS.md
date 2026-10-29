# Doable — Complete Repository Analysis

**Review date:** 13 October 2026\
**Commit reviewed:** `f563d60e586ae21a3a01ec7d8be4cc5fe390c139`\
**Scope:** All 118 tracked files plus the locally created `AGENTS.md`. Git internals are excluded. This report is a new review artifact, not part of the original inventory.

## 1. Assessment

Doable implements a worker-booking application using React, Express, and MongoDB. Customers can register, log in, search workers, submit bookings with photos and location, and track requests. Workers can manage profiles, block dates, update booking status, and hide completed or cancelled requests.

The current code provides substantial feature coverage, but has critical access-control gaps and significant booking/data-consistency defects. It should not be treated as ready to handle real customer data without addressing those issues. Password hashing and several input checks are useful foundations; however, login never establishes a server-verifiable session, and most routes operate solely on caller-supplied identifiers.

This is a **local source review**, not a deployed-service penetration test. All text/configuration files were inspected; lockfiles were parsed; every raster asset was checked for format, dimensions, integrity, size, and duplicates. Images were not visually classified, and their real-world subjects or database associations cannot be established from filenames.

## 2. Structure and architecture

```text
Doable/
├── .gitignore
├── AGENTS.md                 # Local contributor guide
├── client/
│   ├── .gitignore
│   ├── README.md
│   ├── package.json
│   ├── package-lock.json
│   ├── public/               # HTML, manifest, robots, 3 PNGs
│   └── src/                  # 35 source/style/test/asset files
└── server/
    ├── .gitignore
    ├── package.json
    ├── package-lock.json
    ├── server.js             # 1,488 lines; models + 29 API routes
    ├── migrate_bookings.js
    └── uploads/              # 67 committed raster images
```

There is no root package, workspace configuration, CI workflow, Docker configuration, deployment manifest, TypeScript setup, or separate backend controller/model/service directories in the tracked tree. The only existing README is the generic Create React App guide.

### Active execution path

`client/public/index.html` → `client/src/index.js` → `App.js` → five screens:

| URL | Screen | Responsibilities |
| --- | --- | --- |
| `/` | `Login.js` | Worker/customer role selection and login |
| `/register-worker` | `WorkerRegister.js` | Worker details and photo registration |
| `/register-customer` | `CustomerRegister.js` | Customer contact/address registration |
| `/worker-dashboard` | `WorkerDashboard.js` | Profile, booking list/details, date blocking |
| `/customer-dashboard` | `CustomerDashboard.js` | Profile, search, booking, tracking, history |
| Any other URL | Redirect | Returns to `/` |

Only these seven application source files are reachable through local imports from `index.js`. Tests and their setup are separately discovered by the test runner. The remaining components and local CSS files are outside the current application import graph. Active screens primarily use inline styles; dashboards inject date-picker CSS. The installed date-picker stylesheet is imported normally.

Frontend requests usually target the hardcoded `https://doable-ojum.onrender.com`. Starting the client and server locally does not connect them automatically. The unused `BookWorker.jsx` instead uses relative `/api` URLs, while `WorkerAvailability.jsx` accepts an API base prop.

### Data model

| Model | Main fields | Relationship/index behavior |
| --- | --- | --- |
| Worker | name, password hash, profession, phone, pincode, area/city, photo, blockedDates, workingHours | Unique phone; name is not unique, but login searches by name |
| Customer | name, email, password hash, phone, address, createdAt | Unique name and email; no immutable reference from bookings |
| Booking | workerId, clientName/phone/address, jobDetails, bookingDate, optional time, status, trackingId, location, photos, deletion flags | References Worker; unique tracking ID; partial unique worker/date/time index for string time values |

Bookings store customer names rather than customer IDs. Even the customer-ID history endpoint resolves the customer and then queries bookings by name. Renaming an account can therefore disconnect its history or expose it to a later account that takes the old name.

## 3. Complete text/source file inventory

Paths below are repository-relative. “Inactive” means unreachable from the current application entry point, not necessarily safe to delete without confirming intended future use.

| File | Purpose and observations |
| --- | --- |
| `.gitignore` | Ignores environment files and node_modules; does not ignore uploaded images. |
| `AGENTS.md` | Locally generated contributor guide covering commands, conventions, tests, and configuration. |
| `client/.gitignore` | CRA exclusions for dependencies, build, coverage, environment overrides, and logs. |
| `client/README.md` | Generic CRA documentation; lacks Doable-specific architecture and API setup. |
| `client/package.json` | React application dependencies; start/build/test/eject scripts; CRA ESLint configuration. No proxy, lint script, formatter, or Node engine declaration. |
| `client/package-lock.json` | npm lockfile v3; 1,357 package entries including root. Root dependencies agree with manifest. |
| `client/public/index.html` | HTML mount point, Doable title, PNG favicon. Description and comments retain CRA defaults. |
| `client/public/manifest.json` | Default React App identity and install metadata; references absent `favicon.ico`. |
| `client/public/robots.txt` | Allows crawler access; provides no access control. |
| `client/src/index.js` | React root, StrictMode, BrowserRouter. Does not import local CSS or call web-vitals helper. |
| `client/src/App.js` | Defines the five screen routes and fallback redirect; no authentication/role route guards. |
| `client/src/Login.js` | Active combined login screen, validation, role switching, password visibility, remembered identifier loading. Passes login result through router state; no session token. Remember state has no rendered control. |
| `client/src/WorkerRegister.js` | Active multipart worker registration, optional photo, six-character password and ten-digit phone checks. Stores area/city as N/A; trims password on submission. |
| `client/src/CustomerRegister.js` | Active name/email/password/phone/address registration. Client validates password length and phone format; mostly placeholder-based field identification. |
| `client/src/WorkerDashboard.js` | Active 1,183-line screen; profile/photo updates, booking filters/sorting and five-item pagination, status controls, soft-delete fallbacks, calendar blocking. Upload-to-booking function and several helpers remain unused. Identity originates in router state. |
| `client/src/CustomerDashboard.js` | Active 1,205-line screen; profile/password changes, worker search, multipart day-level booking, optional geolocation, up to six photos, tracking, booking history/detail. Uses router state and localStorage fallbacks; no time-slot selection. Contains a duplicate date helper. |
| `client/src/AddPerson.js` | Inactive legacy account/photo form; posts to absent `/persons`; navigates to absent `/list`. |
| `client/src/AllWorkersList.js` | Inactive worker list, WhatsApp links, deletion UI; calls absent all-workers API routes. |
| `client/src/BookWorker.jsx` | Inactive time-slot booking component; loads availability and slots. Sends `date`/customerId but omits required bookingDate/clientName/jobDetails. Uses utility CSS classes with no corresponding framework configured. |
| `client/src/BookingForm.js` | Inactive simple date/job booking form; expects a route `id`; navigates to absent `/list`. |
| `client/src/BookingStatusLine.js` | Inactive three-step visual progress component with explicit cancellation display; imports BookingStatus.css. |
| `client/src/CreateAccountForm.js` | Inactive customer registration variant; lacks required address despite collecting phone. Exported component name differs from filename. |
| `client/src/CreateCustomerAccountForm.js` | Inactive customer registration variant; omits required phone and address. |
| `client/src/CustomerAuthCard.js` | Inactive combined customer auth/dashboard; localStorage persistence, worker search, tracking. Registration omits address; saved JSON is parsed without error handling. |
| `client/src/CustomerLogin.js` | Inactive login variant; posts to server root rather than customer login endpoint; expects `_id` rather than customerId. |
| `client/src/PersonList.js` | Inactive worker browser/filter/delete UI. Enforces five-digit pincodes against backend six-digit requirement; calls absent list/delete routes and links to absent booking route. Uses remote placeholder icons. |
| `client/src/Register.js` | Inactive worker registration with only name/password; omits mobileNumber/pincode; links to absent `/login`. |
| `client/src/StatusLine.js` | Inactive alternate progress UI; treats cancelled as a later index and marks all three displayed steps completed. Imports CustomerDashboard.css. |
| `client/src/TrackRequest.js` | Inactive standalone tracking-ID form; displays booking status. Imported only by inactive CustomerAuthCard. |
| `client/src/WorkerAuthCard.js` | Inactive navigation card; links to absent `/login` and `/create-account`. |
| `client/src/WorkerAvailability.jsx` | Inactive 428-line calendar/hour editor and slot preview. Default `headers = {}` causes unstable memo/effect dependencies; likely repeated requests if mounted without a stable headers prop. |
| `client/src/WorkerDetails.js` | Inactive older dashboard with expandable booking list. Exports WorkerDashboard; calls missing GET profile and accept endpoints; delete omits required ownership header. |
| `client/src/WorkerInfo.js` | Inactive similar older dashboard with always-visible booking list; same missing APIs/ownership header. Also exports WorkerDashboard. |
| `client/src/WorkerLoginCard.js` | Inactive placeholder: logs name and plaintext password, shows an alert, makes no login request. |
| `client/src/WorkerProfile.js` | Inactive combined worker login/register; registration omits pincode and successful login navigates to absent `/list`. |
| `client/src/App.css` | 521-line legacy theme, cards, worker/list/form styling. Includes appended worker dashboard rules that overlap earlier selectors. Not imported by active app. |
| `client/src/index.css` | Default body/font smoothing and code font; not imported. |
| `client/src/BookingStatus.css` | Numbered status circles and progress labels; only imported by inactive BookingStatusLine. |
| `client/src/CustomerDashboard.css` | Alternate status-line/circle CSS; only imported by inactive StatusLine. Overlaps BookingStatus.css selectors. |
| `client/src/logo.svg` | Default React vector logo; not imported. |
| `client/src/App.test.js` | Sole test; renders routed App without a router and asserts deleted CRA starter text. Not aligned with current application. |
| `client/src/setupTests.js` | Loads jest-dom assertions through CRA test setup. |
| `client/src/reportWebVitals.js` | Default optional metric callback; unused by entry point. |
| `client/src/migrate_bookings.js` | Misplaced Node/Mongoose migration; client package lacks mongoose/dotenv. Nearly duplicates server utility; not bundled by active app. |
| `server/.gitignore` | Only `.env`; root ignore handles node_modules. Uploads remain tracked. |
| `server/package.json` | Express/Mongoose/Multer/bcrypt/CORS/dotenv package. Test script deliberately fails; no start script; main points to absent index.js. |
| `server/package-lock.json` | npm lockfile v3; 106 package entries including root. Root dependencies agree with manifest. |
| `server/server.js` | Entire API, models, helpers, upload storage, and startup. Reads MONGO_URI and PORT; serves uploads publicly; hashes passwords; has no session/auth middleware. |
| `server/migrate_bookings.js` | Cursor-based date normalization, optional time initialization, and UTC dateStr backfill. No dry run; catches migration errors but exits with code 0 in finally. |

Raster files are individually inventoried in section 9.

## 4. API inventory — all 29 routes

All endpoints below lack server session authentication. The worker soft-delete routes compare a caller-supplied worker ID, which is not proof of identity. Password-change verifies the supplied current password, but other profile update routes bypass that requirement.

| Method | Path | Behavior |
| --- | --- | --- |
| POST | `/api/auth/register` | Worker registration and optional photo |
| POST | `/api/auth/login` | Worker name/password comparison; returns profile identifiers |
| GET | `/api/workers/search` | Pincode/profession search; excludes password hash |
| GET | `/api/workers/:workerId/availability` | Blocked dates and working hours |
| GET | `/api/workers/:workerId/availability/slots` | Free slots for requested date |
| POST | `/api/workers/:id/availability` | Unified blocked-date/hour update |
| POST | `/api/workers/:id/blocked-dates` | Add/remove/replace blocked dates |
| POST | `/api/bookings` | Standard pending booking; up to ten photos |
| POST | `/api/bookings/safe` | Transactional booking, immediately confirmed |
| GET | `/api/bookings/worker/:id` | Worker bookings excluding worker-hidden records |
| GET | `/api/bookings/track/:trackingId` | Full booking plus selected worker details |
| GET | `/api/bookings/:id` | Full booking by ObjectId |
| PUT | `/api/bookings/:id/status` | Sets one of four accepted statuses |
| GET | `/api/bookings/customer` | Customer bookings matched by query name |
| GET | `/api/bookings/customer/:customerId` | Looks up customer, then matches bookings by name |
| DELETE | `/api/bookings/:id` | Worker soft-delete for terminal bookings |
| DELETE | `/api/bookings/delete/:id` | Duplicate soft-delete compatibility route |
| DELETE | `/api/bookings/:id/delete` | Duplicate soft-delete compatibility route |
| DELETE | `/api/bookings/:id/hard-delete` | Permanent booking deletion; no admin check |
| POST | `/api/customers` | Customer registration |
| POST | `/api/customers/login` | Customer email/password comparison |
| GET | `/api/customers/:id` | Customer profile excluding password |
| POST | `/api/customers/:id/change-password` | Current password verification and replacement |
| PUT | `/api/auth/profile/:id` | Worker profile, password, hours, blocked-date update |
| PUT | `/api/customers/:id` | Customer profile/password update |
| PUT | `/api/customers/update` | Intended compatibility update; shadowed by preceding `:id` route |
| POST | `/api/workers/:id/photo` | Worker photo replacement |
| GET | `/api/workers/:id/photo` | Worker photo URL |
| POST | `/api/bookings/:id/photo` | Appends photo to any identified booking |

Referenced but unimplemented APIs include `/persons`, GET `/api/auth/profile/:id`, GET/DELETE `/api/auth/all-workers...`, and PUT `/api/bookings/:id/accept`. They occur in inactive components.

There is no implementation that sets deletedByCustomer, despite that schema flag and history filtering. There is no implemented admin identity, payment flow, review system, notification delivery, or messaging backend; legacy WhatsApp buttons open external links.

## 5. Findings and priorities

### Critical: server access control

1. **Account takeover through profile update.** `server/server.js:1225` and `:1283` accept a replacement password based only on a URL ID. An unauthenticated caller who knows an account ID can change its password without the original password. The dedicated customer change-password checks at `:1173` do not protect these alternate paths.
2. **Unauthorized booking and personal-data operations.** Booking reads, status updates (`:840`), availability updates (`:375`, `:433`), uploads, and hard deletion (`:1058`) lack authenticated ownership/role checks. The x-worker-id comparison at `:928` trusts caller input. Profile and booking responses disclose names, phone numbers, addresses, locations, and photos.
3. **API availability can be exhausted by slot configuration.** `:408` accepts any numeric slotDuration, including zero and negative numbers; profile update allows even weaker validation. `generateSlots` (`:151`) repeatedly advances time without a positive-duration guard. A bounded local VM execution timed out for both zero and -30 minutes; 30 minutes returned 18 slots. Persisting a bad configuration and requesting slots can block the Node event loop.

### High: booking and identity correctness

4. **Customer-name linkage breaks history.** Bookings lack customerId; queries at `:881` and `:913` use clientName. Profile renames do not update existing bookings. The active client at `CustomerDashboard.js:389` also prioritizes the original router-state name over the edited profile name when creating bookings. Use an immutable customer reference and authenticated identity.
5. **Slot uniqueness and availability disagree.** The unique index at `server.js:115` includes exact bookingDate and every string-time booking regardless of status. A cancelled booking can disappear from available-slot conflict checks yet still prevent a new booking with the same exact timestamp/time. Different timestamps on the same calendar date produce different index keys, so the index does not fully enforce calendar-day uniqueness under concurrent requests. Normalize the date key and define how terminal bookings release capacity.
6. **Main UI bypasses slot conflict protection.** CustomerDashboard sends no time. Standard creation only checks existing bookings inside `if (timeSlot)` and its partial index excludes null times. Multiple bookings on a day are therefore allowed without capacity checks. Whether that is acceptable requires an explicit day-level versus time-slot product rule; the unused BookWorker component does not implement a compatible substitute.
7. **Unsafe upload handling.** Multer storage at `server.js:41` has no file-size limit or file-type filter. All uploads are served publicly; disk files are written before route validation and not removed on failed requests, replacement, or hard deletion. Timestamp-only filenames can collide. Client checks do not constrain direct API calls.
8. **Ambiguous worker login identity.** Worker name is not unique, but login at `:227` selects one record by name. Two workers sharing a name cannot reliably authenticate to their respective account through this flow. Use unique phone/account identity.

### Medium: API/UI integration and reliability

9. **Compatibility route is unreachable.** PUT `/api/customers/:id` is registered before PUT `/api/customers/update`; the former captures `update` as id and returns 400. Put static routes before parameter routes or remove the alias.
10. **Terminal status lock exists only in the UI.** WorkerDashboard disables edits after completed/cancelled; the backend status route accepts transitions back to pending or confirmed. Define and enforce allowed transitions on the server. Availability queries also mention ongoing although the status API rejects it.
11. **Saved address does not render in customer booking details.** The API stores clientAddress; CustomerDashboard checks `trackingResult.address` and `selectedBooking.address` at lines 925 and 1080. Worker details correctly fall back to clientAddress.
12. **Sessions and logout are only presentation state.** Dashboards can be opened directly with missing identity. WorkerDashboard relies on router state and never refetches the full profile; customer localStorage is written on profile save, not normal login. Logout does not invalidate a server session because none exists. Back navigation can restore router-state identity.
13. **Email and password normalization differs between paths.** Customer registration lowercases/trims email, login and update do not consistently normalize it. Worker registration trims password after validating its original length, while login sends the untrimmed password. Inputs with leading/trailing spaces can behave unexpectedly.
14. **Unstable effects in inactive availability component.** Default headers object changes each render, which rebuilds its memoized Axios instance and retriggers effects that update state. Stabilize defaults before mounting this component. It is not an active-screen defect today.
15. **Operational configuration is incomplete.** Hardcoded deployment URLs, no environment example, no API start script, absent server index.js entry target, no root instructions, and no deployment persistence strategy. Transaction endpoint requires a replica set; its comment mentions fallback, but implementation returns an error instead of creating a standard booking.
16. **Validation and observability gaps.** Server phone/email/password/pincode checks are weaker than frontend checks; several update calls omit runValidators. Past booking dates are accepted through direct API calls. Coordinate truthiness checks discard latitude/longitude zero. Customer profile update logs the full request body, including password if supplied. Error responses expose database/internal messages.
17. **Unbounded listings and frontend-only pagination.** Worker search and booking queries return complete result sets. Worker pagination still downloads every booking; customer history has no pagination. Profession search constructs a regular expression directly from input. No rate limiting, request cancellation, or bounded query strategy is configured.

### Lower priority: maintainability and presentation

- The two active dashboards and server contain 3,876 lines combined and duplicate helpers, request logic, styling, and compatibility code.
- Inactive components contain broken contracts, obsolete route links, a five-digit pincode rule, and a plaintext-password console log. Confirm ownership before removal; avoid activating them unchanged.
- Main screens do not import the local theme/reset CSS. Poppins is named but not loaded. Fixed-width calendars, worker search controls, and side-by-side profile layouts need mobile verification; this is a source-based concern, not a browser-tested conclusion.
- Many form inputs rely on placeholders; clickable booking cards lack keyboard/button semantics. Several inputs remove focus outlines without replacements. Conduct keyboard and screen-reader checks.
- Customer booking info omits status, though the separate tracking view shows it. Worker booking-photo upload code has no rendered control.
- Default manifest branding and missing favicon.ico reference remain. StatusLine presents cancelled requests as completed progress.
- Migration errors return success exit code; backfill dateStr is not part of the main booking schema/query design. Keep one server-side migration with dry-run/reporting and meaningful failure status.

## 6. Dependencies, scripts, and verification

### Locked direct dependencies

| Package | Client version |
| --- | --- |
| react / react-dom | 19.1.1 / 19.1.1 |
| react-router-dom | 7.8.2 |
| react-scripts | 5.0.1 |
| axios | 1.11.0 |
| date-fns | 4.1.0 |
| react-datepicker | 8.7.0 |
| web-vitals | 2.1.4 |
| @testing-library/dom | 10.4.1 |
| @testing-library/jest-dom | 6.8.0 |
| @testing-library/react | 16.3.0 |
| @testing-library/user-event | 13.5.0 |

| Package | Server version |
| --- | --- |
| express | 5.1.0 |
| mongoose | 8.18.0 |
| multer | 2.0.2 |
| bcryptjs | 3.0.2 |
| cors | 2.8.5 |
| dotenv | 17.2.1 |

These versions are read from the lockfiles. No live advisory lookup or dependency audit was performed; this report makes no claim that dependency versions are vulnerability-free.

### Available commands

```bash
npm ci --prefix client
npm ci --prefix server
npm start --prefix client
npm run build --prefix client
CI=true npm test --prefix client -- --watchAll=false
# Separate terminal; first configure server/.env with development MONGO_URI
cd server
node server.js
```

The client also exposes eject, an irreversible toolchain configuration change. The server's only npm script is a deliberately failing test placeholder. No backend build is needed for its plain JavaScript entry point.

### Checks actually completed

- Parsed both package manifests and lockfiles; matching direct dependency declarations.
- Derived complete local-import reachability from the client entry point.
- `node --check` passed for server.js and both migration scripts using Node 22.23.2.
- Isolated slot-generation execution with a 50 ms VM limit reproduced the zero/negative-duration failure without starting the API or writing a database.
- PIL integrity verification passed for every one of the 70 PNG/JPEG raster files.
- SHA-256 comparison identified exact upload duplicates.

**Not run:** dependency installation, client production build, Jest suite, live API requests, MongoDB integration, visual browser checks, or migrations. Neither package has node_modules in this checkout, and no development database configuration was supplied. Conclusions about stale tests and API contracts are from code inspection, not reported test runs. The existing App test is expected to fail because it lacks router context and its expected text is absent; backend npm test intentionally exits 1.

## 7. Recommended implementation order

1. Add server-verifiable authentication, role checks, resource ownership, protected password changes, and an admin restriction on hard delete. Stop exposing private bookings through arbitrary identifiers.
2. Validate working hours and positive integer slot durations server-side; guard the slot loop independently. Add upload limits/type verification and orphan cleanup.
3. Introduce customerId references; migrate name-linked bookings carefully. Normalize day/slot keys and reconcile active-status uniqueness, cancellation, and day-level capacity rules.
4. Fix static route ordering, address field consumption, normalization, and server-enforced status transitions. Establish one shared client API configuration and deliberate session restoration/logout behavior.
5. Replace the starter test; add API ownership, password-change, scheduling/concurrency, rename-history, and upload rejection tests. Confirm production build and create CI.
6. Split models/routes/services and dashboard features; consolidate compatibility paths and retire confirmed-unused files. Document development setup and deployment/storage requirements.
7. Address responsive layout, field labeling, keyboard navigation, metadata, and asset cleanup.

No source fixes, dependency upgrades, migrations, or asset deletions were made as part of this analysis.

## 8. Repository history and storage

The seven visible commits use broad imperative messages, including Update Login.js, Update WorkerDetails.js, and Initial commit: add client and server. There is no visible conventional-commit pattern, CI configuration, or PR template.

The working tree contains approximately 36 MiB excluding Git internals. Uploads alone occupy **34,722,555 bytes (33.11 MiB)**. There are **18 distinct upload contents among 67 files**, so **49 files duplicate another upload**, consuming **25,989,271 bytes (24.79 MiB)** beyond one copy of each content. Database references must be checked before any deduplication; hashes establish identical bytes, not safe deletion.

## 9. Complete raster asset inventory

Every raster is listed below with its actual decoded format and dimensions. Group IDs identify byte-identical contents within each asset category; they do not identify a person, job, or database record. All listed images passed integrity verification. `client/src/logo.svg` is covered separately in the source inventory.

### Public icons

| File | Format | Dimensions | Bytes | Content group |
| --- | --- | --- | ---: | --- |
| `client/public/favicon.png` | PNG | 1024 × 1024 | 1,006,857 | P01 |
| `client/public/logo192.png` | PNG | 192 × 192 | 5,347 | P02 |
| `client/public/logo512.png` | PNG | 512 × 512 | 9,664 | P03 |

### Server uploads

| File | Format | Dimensions | Bytes | Content group |
| --- | --- | --- | ---: | --- |
| `server/uploads/1756064697975.jpg` | JPEG | 505 × 720 | 78,276 | U01 |
| `server/uploads/1756065552717.png` | PNG | 644 × 555 | 657,455 | U02 |
| `server/uploads/1756066121189.png` | PNG | 1919 × 1079 | 1,398,694 | U03 |
| `server/uploads/1756066151698.png` | PNG | 644 × 555 | 657,455 | U02 |
| `server/uploads/1756070090762.png` | PNG | 644 × 555 | 657,455 | U02 |
| `server/uploads/1756070120267.png` | PNG | 644 × 555 | 657,455 | U02 |
| `server/uploads/1756133814871.png` | PNG | 1794 × 836 | 1,381,649 | U04 |
| `server/uploads/1756133818270.png` | PNG | 1794 × 836 | 1,381,649 | U04 |
| `server/uploads/1756133819205.png` | PNG | 1794 × 836 | 1,381,649 | U04 |
| `server/uploads/1756133819337.png` | PNG | 1794 × 836 | 1,381,649 | U04 |
| `server/uploads/1756133819473.png` | PNG | 1794 × 836 | 1,381,649 | U04 |
| `server/uploads/1756133819595.png` | PNG | 1794 × 836 | 1,381,649 | U04 |
| `server/uploads/1756205007724.png` | PNG | 1411 × 229 | 116,979 | U05 |
| `server/uploads/1756206209365.png` | PNG | 1597 × 501 | 29,455 | U06 |
| `server/uploads/1756206220450.png` | PNG | 1597 × 501 | 29,455 | U06 |
| `server/uploads/1756206290197.jpg` | JPEG | 414 × 414 | 55,187 | U07 |
| `server/uploads/1756206300161.jpg` | JPEG | 414 × 414 | 55,187 | U07 |
| `server/uploads/1756206409214.jpg` | JPEG | 414 × 414 | 55,187 | U07 |
| `server/uploads/1756206411425.jpg` | JPEG | 414 × 414 | 55,187 | U07 |
| `server/uploads/1756207378409.jpeg` | JPEG | 300 × 300 | 53,364 | U08 |
| `server/uploads/1756210103600.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756236055672.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756238579927.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756238597058.jpg` | JPEG | 6010 × 4012 | 4,174,739 | U10 |
| `server/uploads/1756238608847.jpg` | JPEG | 6010 × 4012 | 4,174,739 | U10 |
| `server/uploads/1756239019467.png` | PNG | 911 × 930 | 87,857 | U11 |
| `server/uploads/1756241006780.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756241019672.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756241302327.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756241810458.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756241888415.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756241916750.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756242214832.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756242282749.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756242310418.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756242620578.jpg` | JPEG | 6010 × 4012 | 4,174,739 | U10 |
| `server/uploads/1756288122141.jpg` | JPEG | 6010 × 4012 | 4,174,739 | U10 |
| `server/uploads/1756289004399.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756289008145.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756289008799.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756289274583.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756290017848.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756317853284.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1756378910631.jpg` | JPEG | 2560 × 1600 | 176,152 | U09 |
| `server/uploads/1757059427674.jpg` | JPEG | 1024 × 1536 | 114,823 | U12 |
| `server/uploads/1757059896811.png` | PNG | 911 × 930 | 87,857 | U11 |
| `server/uploads/1757060009543.jpg` | JPEG | 1332 × 850 | 147,228 | U13 |
| `server/uploads/1757075061275.jpg` | JPEG | 1156 × 652 | 43,888 | U14 |
| `server/uploads/1757075061283.jpg` | JPEG | 1024 × 1536 | 114,823 | U12 |
| `server/uploads/1757078263894.jpg` | JPEG | 1156 × 652 | 43,888 | U14 |
| `server/uploads/1757078497236.png` | PNG | 911 × 930 | 87,857 | U11 |
| `server/uploads/1757078512291.jpg` | JPEG | 1332 × 850 | 147,228 | U13 |
| `server/uploads/1757078894553.jpg` | JPEG | 720 × 1280 | 61,268 | U15 |
| `server/uploads/1757088663775.jpg` | JPEG | 720 × 1280 | 61,268 | U15 |
| `server/uploads/1757090800822.png` | PNG | 368 × 278 | 34,880 | U16 |
| `server/uploads/1757133375378.jpg` | JPEG | 1599 × 1200 | 83,725 | U17 |
| `server/uploads/1757135356483.jpeg` | JPEG | 300 × 300 | 37,665 | U18 |
| `server/uploads/1757135362409.jpeg` | JPEG | 300 × 300 | 37,665 | U18 |
| `server/uploads/1757135370513.jpeg` | JPEG | 300 × 300 | 37,665 | U18 |
| `server/uploads/1757135374323.jpeg` | JPEG | 300 × 300 | 37,665 | U18 |
| `server/uploads/1757222699257.png` | PNG | 911 × 930 | 87,857 | U11 |
| `server/uploads/1757225319588.png` | PNG | 368 × 278 | 34,880 | U16 |
| `server/uploads/1757238238346.jpg` | JPEG | 1024 × 1536 | 114,823 | U12 |
| `server/uploads/1757238644417.jpg` | JPEG | 720 × 1280 | 61,268 | U15 |
| `server/uploads/1757241365480.png` | PNG | 911 × 930 | 87,857 | U11 |
| `server/uploads/1757241641247.jpg` | JPEG | 1024 × 1536 | 114,823 | U12 |
| `server/uploads/1757251054817.jpg` | JPEG | 720 × 1280 | 61,268 | U15 |

### Inventory coverage

All 118 tracked paths and local AGENTS.md appear individually in this report: 49 text/vector/configuration/documentation files and 70 raster files. PROJECT_ANALYSIS.md is the newly generated report. Git metadata and generated dependencies/build outputs are outside the reviewed application inventory.
