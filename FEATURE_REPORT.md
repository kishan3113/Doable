# Doable — Feature and Screenshot Report

**Date:** 13 October 2026\
**Sources:** All 20 saved screenshots, current client code including the temporary demo adapter, all 29 backend routes, models, migration utilities, and inactive UI components.\
**Companion documents:** [Repository analysis](PROJECT_ANALYSIS.md), [screenshot gallery](ui-screenshots/2026-10-13/index.html), [screenshot coverage index](ui-screenshots/2026-10-13/README.md).

## 1. What the product does

Doable connects customers with local service workers. Its main journey is **register or log in → search by pincode and profession → select a worker → describe a job and choose a date → submit a request → track it**. Workers maintain their profile, block unavailable dates, manage requests, update status, and hide finished requests.

The active interface contains **five routed pages**, **six customer dashboard tabs**, and **four worker dashboard tabs**. Some tabs appear only after choosing a worker or booking. The 20 captures include both login roles, registration, dashboard tabs, edit forms, and initial/populated states. They were taken using local sample data, not authenticated hosted accounts.

The application also contains scheduling and administration capabilities that are not accessible through the current screens, plus older components that are not routed into the app. The feature inventories below include those separately so their presence in code is not mistaken for a working product feature.

## 2. Evidence and status definitions

- **Visible:** A screenshot shows the control or output. This does not establish that submitting it works against the hosted API.
- **Wired:** The active component has a handler and a matching backend implementation in this checkout. Hosted behavior remains unverified.
- **Demo:** Implemented in `demoApi.js`; uses browser storage and substitutes for Axios requests while a demo session is active.
- **API only:** Backend code exists, but the active UI does not expose the capability.
- **Inactive:** A component exists but is not imported into the current application route graph.
- **Partial:** A control, model field, or helper exists with a missing connection, unsupported demo operation, or inconsistent behavior.

All 20 images were individually inspected at their saved resolution. Code review supplements what they show: photos, location sharing, error states, terminal statuses, and slot scheduling are not all demonstrated by the sample screenshots. Previously completed local checks covered demo search, blocked-date rejection, booking creation, cross-role history, status updates, worker hiding, tracking, and adapter isolation. No additional account creation, password change, hosted booking, or location permission was performed for this report.

## 3. Screenshot-by-screenshot analysis

Each number links to the original full-page capture.

| Screenshot | Features visible | Interpretation and visual observations |
| --- | --- | --- |
| [01](ui-screenshots/2026-10-13/01-worker-login.jpg) | Worker/customer switch, demo buttons, worker name, password, Show, Login, registration link | Clear active-role styling and persistent field labels. No remember checkbox or password-recovery link appears. |
| [02](ui-screenshots/2026-10-13/02-customer-login.jpg) | Customer email/password login, role switch, Show, customer registration, demos | The same screen changes identity field by role. This is not a separate customer-auth subsystem. |
| [03](ui-screenshots/2026-10-13/03-customer-registration.jpg) | Username, Gmail-labelled email, password, ten-digit phone, address, Register, Login | Inputs are small browser-default controls compared with the styled login fields. Labels disappear when placeholders are replaced. Gmail wording is narrower than the code, which permits other email domains. |
| [04](ui-screenshots/2026-10-13/04-worker-registration.jpg) | Username, password, six-digit pincode, profession selector, phone, optional photo, Register, Login | Native file selector is present. Area/city are not collected here; code fills N/A. Fields are styled inconsistently with the profession selector and button. |
| [05](ui-screenshots/2026-10-13/05-customer-profile.jpg) | Customer ID, name, email, phone, address, Edit Profile, Logout; four initial tabs | Profile values are readable, but database ID is prominent. Book Worker and Booking Info are absent until their prerequisites are selected. |
| [06](ui-screenshots/2026-10-13/06-customer-edit-profile.jpg) | Editable profile fields, Save/Cancel, current/new/confirm password, Change Password/Clear | Password change is nested inside edit mode. Forms lack persistent field labels. Its presence does not mean the local demo supports password changes. |
| [07](ui-screenshots/2026-10-13/07-customer-search-empty.jpg) | Pincode, optional profession, Search, No workers found | Empty message appears before a search, conflating not-yet-searched with no matches. |
| [08](ui-screenshots/2026-10-13/08-customer-search-results.jpg) | Sample plumber result, name, profession, pincode, phone, Book Worker | Result has no photo, price, rating, verification badge, distance, or availability summary. The UI filters a directory; it does not rank providers. |
| [09](ui-screenshots/2026-10-13/09-customer-booking-form.jpg) | Worker information, job textarea, calendar, location button, address, phone, multi-photo selector, count, Confirm/Cancel | Day-level booking only: no time selector. Past calendar dates are visually disabled. Two columns are cramped at this captured width. |
| [10](ui-screenshots/2026-10-13/10-customer-booking-filled.jpg) | Job entered and a date selected | Shows form preparation, not successful booking submission. No photos or location were attached. |
| [11](ui-screenshots/2026-10-13/11-customer-tracking-empty.jpg) | Tracking ID field and Track action | Conditional Book Worker tab remains visible after selection. Tabs wrap across rows; their arrangement changes as tabs are added. |
| [12](ui-screenshots/2026-10-13/12-customer-tracking-result.jpg) | Pending badge, job, date, address | Manual tracking returns current status, not live location tracking. Address is supplied by the demo alias; the real API uses a different field. |
| [13](ui-screenshots/2026-10-13/13-customer-booking-history.jpg) | Worker details, phone, tracking code, job, date, View Details | No status badge, cancellation, delete, filter, or pagination control. My Bookings stretches across a second tab row. |
| [14](ui-screenshots/2026-10-13/14-customer-booking-details.jpg) | Worker name/profession/phone/pincode, tracking code, client phone, job/date/address, Back | Status is absent, even though the adjacent tracking screen displays it. Demo address output masks the real-response mismatch. |
| [15](ui-screenshots/2026-10-13/15-worker-profile.jpg) | Worker ID/name/profession/phone/pincode/area/city, photo placeholder, Edit, Logout | Worker profile has a separate photo panel. This sample has no photo; photo retrieval is not visually proven. |
| [16](ui-screenshots/2026-10-13/16-worker-edit-profile.jpg) | Editable identity/contact/service/location fields, optional new password, photo selector, Save/Cancel | New password needs no current password field. Photo upload and password replacement are not implemented by the demo adapter. |
| [17](ui-screenshots/2026-10-13/17-worker-booking-list.jpg) | Text search, status filter, date sort, initials avatar, client/phone/job/date/status, clickable card, count, Prev/Next | One item leaves pagination disabled. Horizontal overflow is directly visible: this capture is 927 pixels wide versus 690 for most screens, and a horizontal scrollbar appears. Toolbar sizing causes the problem. |
| [18](ui-screenshots/2026-10-13/18-worker-booking-details.jpg) | Client/phone/job/date/address, status selector, no-location message, empty photo gallery, Back | This pending booking has no Delete Request control; code shows that only for completed/cancelled requests. There is no rendered worker photo-add action. |
| [19](ui-screenshots/2026-10-13/19-worker-availability.jpg) | Calendar, Selected: None, Block/Unblock | Only full-day availability is exposed. There are no working-hour or slot-duration controls on this active tab. |
| [20](ui-screenshots/2026-10-13/20-worker-availability-selected.jpg) | Selected date highlighted and formatted, Block/Unblock | This demonstrates selection only. Neither blocking nor unblocking was submitted during capture. |

## 4. Authentication, registration, and navigation features

Sources: [Login.js](client/src/Login.js), [WorkerRegister.js](client/src/WorkerRegister.js), [CustomerRegister.js](client/src/CustomerRegister.js), [App.js](client/src/App.js), [server.js](server/server.js).

| Feature | Current implementation and limits | Evidence/status |
| --- | --- | --- |
| Role selection | Switch between worker and customer; changes title, identifier field, endpoint, and registration destination. Clears password/error and focuses the relevant field. | 01–02; wired |
| Worker login | Name and password submitted to `/api/auth/login`; bcrypt comparison; profile result passed as router state. | 01; wired, hosted unverified |
| Customer login | Email and password submitted to `/api/customers/login`; bcrypt comparison; customer profile passed to dashboard. | 02; wired, hosted unverified |
| Login validation | Nonempty worker name or basic email pattern; password required; name/email trimmed. Loading disables inputs and shows Signing in; errors use a role=alert block. | Login handler; some states not captured |
| Password visibility | Show/Hide button toggles input type; accessible action label changes. | 01–02; visible/wired |
| Remembered identifier | Can read saved role/name/email and write them on login if remember is true. No rendered checkbox can enable it from a fresh UI. Does not save password or establish a session. | Partial code feature |
| One-click demo access | Customer and worker shortcuts require no credentials and are shown only in development. | 01–02; demo |
| Worker registration | Name/password/mobile/pincode required by API; UI also requires profession. Sends optional photo as multipart; supplies area/city=N/A. | 04; wired |
| Worker input checks | UI checks pincode length six, numeric phone length ten, password length six, profession selection. Server checks required fields, pincode length, and duplicate phone. Password is trimmed by UI, unlike login. | Wired; inconsistent validation |
| Customer registration | Collects name/email/password/phone/address; API trims name and lowercases/trims email. Enforces unique name/email. UI checks phone length and password length; email input adds browser validation. | 03; wired |
| Registration feedback | Alerts on success/failure and returns to login on success. There is no submission loading/duplicate-click protection on either active registration screen. | Code; partial UX |
| Role-specific routing | Five explicit routes plus wildcard redirect; dashboards use in-page tab state. BrowserRouter provides client-side navigation. | All screenshots; wired |
| Conditional detail tabs | Customer Book Worker appears after worker selection; Booking Info after booking selection. Worker Booking Details appears after selecting a request. | 05 versus 09/14; 15 versus 18 |
| Logout | Navigates to login; customer removes its stored profile keys. Demo login screen clears the demo session flag. Real logout does not invalidate credentials on a server session because none is issued. | 05/15; partial authentication |

**Important identity distinction:** Login checks passwords, but there is no token/cookie session, authenticated API middleware, route protection, email verification, phone OTP, or implemented password recovery. Worker names are nonunique while worker login searches by name, making duplicate-name accounts ambiguous.

## 5. Customer feature inventory

Source: [CustomerDashboard.js](client/src/CustomerDashboard.js); matching APIs in [server.js](server/server.js).

| Feature | Detailed behavior | Limits / evidence |
| --- | --- | --- |
| Profile display | Shows customer ID, name, email, phone, and address with missing-value fallbacks. Initial values come from router state or stored keys. | 05; no initial API refresh |
| Profile editing | Edit four fields; Save checks name/email, submits by customer ID, stores profile values, updates booking phone. Loading text and disabled Save are implemented. | 06; demo and wired |
| Cancel profile editing | Resets to initial login/storage values and closes edit mode. | Can discard previously saved in-session values; partial |
| Password change | Requires current/new/confirmation fields; checks equality and six-character minimum; API verifies current hash and stores a new hash. Clear empties fields. | 06; wired; unavailable in demo |
| Pincode filtering | Exact pincode query; blank field is allowed. | 07–08; demo/wired; no active search format validation |
| Profession filtering | Seven UI options: Plumber, Electrician, Carpenter, Painter, Mechanic, Cleaner, Gardener. Optional. Server matches a case-insensitive regex. | 07–08; demo/wired |
| Search feedback | Searching text, disabled submit, result cards, empty message, error alert. Result card shows name/profession/pincode/phone. | 07–08; no ranking or pagination |
| Worker selection | Prefills booking contact/address, resets job/date/location/photos, opens Book Worker. | 08–09; demo/wired |
| Job description | Free-text textarea; required by confirmation and backend. | 09–10 |
| Date selection | Inline month calendar; minimum date is today. Selected day is styled; payload uses local calendar date as YYYY-MM-DD. | 09–10 |
| Blocked-date protection | Fetches selected worker's blockedDates, marks them red, rejects selection, and refetches availability before submission. Failure at final verification stops booking. | Code; no blocked date shown in screenshots |
| Contact details per booking | Prefills editable address and phone; attaches clientPhone/address to request. Unusual phone prompts confirmation instead of strict rejection. | 09–10 |
| Address inclusion | useProfileAddress state controls editable address/phone visibility. Flags suggest address/location options, but their checkboxes are not rendered. Without a saved address, the manual address section is hidden. | Partial active UI |
| Location capture | Share My Location calls browser geolocation; stores one latitude/longitude snapshot, shows coordinates, sets useLiveLocation, and sends coordinates with request. API derives Google Maps URL. | 09; wired code, not tested/captured |
| Photo attachments | Multiple images; maximum six, six MiB each in UI; MIME prefix check; object-URL previews; removal button; attachment count; previews revoked during cleanup. | 09; preview/remove states code-only |
| Booking submission | Multipart job/date/contact/location/photos; progress percentage; disabled submit; tracking ID success alert; clears form and opens/refetches history. Backend default status pending. | Wired/demo; 10 was not submitted |
| Cancel booking form | Returns to Search Worker and clears selected worker. | This does not cancel an existing booking |
| Tracking | Enter ID, click Track; displays status badge, job, date, address if present, and linked photo gallery. Clears result on error. | 11–12; demo/wired; manually refreshed |
| Booking history | Fetches by customer ID, with name fallback in limited response cases; backend sorts newest date first and populates worker details. Displays worker/phone/photo if available, code/job/date, View Details. | 13; no history pagination, status badge, or customer actions |
| Booking detail view | Displays worker contact/photo, tracking ID, client phone, job/date, location/map link, address, and photos; Back returns to history. Can also fetch by booking ID through helper. | 14; status absent; real address mismatch |
| Photo galleries | Tracking/details convert relative upload paths to hosted URLs; thumbnails link to originals in a new tab. | Conditional code; sample has no photos |
| Storage fallback | Real profiles use localStorage; demo profiles use sessionStorage. Profile save writes keys, whereas ordinary login does not. | Partial session restoration |
| Tab restoration | Reads initial activeTab and follows changes in router state. | Code feature; not durable server state |

Customer controls for **cancelling an existing booking, deleting/hiding history, editing/rescheduling an existing request, assigning a different worker, or uploading additional photos after creation** are not implemented in the active interface.

## 6. Worker feature inventory

Source: [WorkerDashboard.js](client/src/WorkerDashboard.js); matching APIs in [server.js](server/server.js).

| Feature | Detailed behavior | Limits / evidence |
| --- | --- | --- |
| Profile display | Shows ID/name/profession/phone/pincode/area/city; photo panel displays fetched URL or No Photo. | 15; login state seeds profile |
| Profile editing | Edits service/contact/location fields; validates pincode length and phone digits; Save merges returned worker values; Cancel closes editor. | 16; demo/wired; Cancel does not reset edited form state |
| Optional new password | Sends password through profile update; backend hashes replacement. | 16; no current-password requirement; demo silently ignores it |
| Profile photo replacement | Select image; upload separately before profile fields are saved; backend returns updated worker/photo URL. | 16; wired, demo unavailable; no active size check |
| Photo retrieval | API lookup on worker-ID change; prefixes returned relative path with hosted base URL. | 15 has no image; wired |
| Booking list retrieval | Loads when My Bookings opens, excluding worker-hidden records. | 17; demo/wired |
| Booking text search | Case-insensitive matching on client name, job description, and full booking ID. | 17; client-side |
| Status filtering | All, pending, confirmed, completed, cancelled. | 17; client-side |
| Sorting | Date descending, date ascending, or alphabetical status. | 17; client-side |
| Pagination | Five bookings per page, visible item range, page count, Prev/Next; resets search/filter page and clamps page after data changes. | 17; entire list still downloaded |
| Booking card summary | Initials avatar, client name, shortened ID, clickable tel phone, job, date, status pill, up to four photo previews, +N overflow indicator. | 17; photo previews code-only |
| Open details | Clicking a card selects it and exposes Booking Details tab. | 17–18; no keyboard semantics on clickable div |
| Customer contact/details | Name, phone link, job/date, address across alternate field names, fallback to coordinates/maps, or missing-address message. | 18; demo/wired |
| Location/map view | Displays coordinates and opens stored map URL; alternative address/location rendering. | 18 shows No location shared; conditional code |
| Booking photo gallery | Links each image to original; shows empty message otherwise. | 18; wired display |
| Status management | Dropdown for four statuses; optimistic update then canonical server response, rollback and alert on failure, Updating state. | 18; demo/wired |
| Terminal status lock | completed/cancelled disables dropdown and displays locked message. | Conditional UI only; backend permits reopening |
| Hide finished booking | Delete Request appears only in terminal state; confirmation dialog; optimistic removal; x-worker-id header; tries three endpoint patterns; restores list on failure. | Conditional code, not visible for pending sample; demo/wired |
| Worker hiding semantics | Sets deletedByWorker; customer can still see booking. | Soft deletion, despite confirmation's permanent wording |
| Availability calendar | Loads blocked dates when Availability opens; highlights blocked and selected days; prevents past-date selection in picker. | 19–20 |
| Block one date | Checks selection and duplicate block; adds date through blocked-dates endpoint; Saving state and timed response message. | 19–20; demo/wired |
| Unblock one date | Checks selected date is blocked; asks confirmation; removes date and shows timed feedback. | 19–20; demo/wired |
| Profile-only logout | Logout button is rendered only on Profile tab. | 15–16; unavailable on other tabs until switching |
| Worker-added booking photo helper | Function prepares multipart upload, progress, and local booking updates. | Partial: no rendered control invokes it |
| Worker address helper | Can construct address from populated worker or profile fields. | Partial: associated display is commented out |

There is no active working-hours editor, time-slot preview, bulk blocking UI, worker notification feed, earnings view, customer messaging interface, or dedicated Accept button. Confirming a request uses the status dropdown instead.

## 7. Backend features beyond the visible interface

The full endpoint inventory appears in section 12. These capabilities are established by source inspection, not live API testing.

| Capability | Implementation | Exposure and limits |
| --- | --- | --- |
| Persistent data models | MongoDB/Mongoose Worker, Customer, Booking; booking timestamps; customer creation timestamp. | Database setup needs MONGO_URI |
| Password hashing/comparison | bcrypt salt cost 10 for registration and password updates; compare on login/current-password change. | Useful primitive; not authenticated sessions |
| Duplicate-account detection | Worker phone; customer name/email; indexes and prechecks. Responses explain duplicates. | Worker name intentionally nonunique |
| Working-hour configuration | Start/end HH:MM and slotDuration, defaults 09:00–18:00/30 minutes. Unified availability update or worker profile update. | API only in active product |
| Slot generation | Creates aligned time labels between start/end. Free-slot endpoint removes pending/confirmed/ongoing booking times for requested day. | API only; zero/negative durations can hang loop |
| Availability batch updates | Add/remove/replace arrays with set-based MongoDB operations; unified endpoint offers addBlocked/removeBlocked/replaceBlocked/setWorkingHours. | Active UI uses only one-date add/remove |
| Standard booking creation | Accepts JSON or multipart, optional time, flexible phone/address aliases, parses coordinates, validates worker/date/blocked day; generates tracking ID. | Active UI uses no time |
| Time-slot validation/conflict checks | Validates HH:MM and alignment to configured slots; checks active booking conflicts; partial unique worker/date/time index. | Slot release/index date semantics inconsistent |
| Transactional booking | `/api/bookings/safe` uses MongoDB session/transaction, conflict check, create/commit, and immediately confirmed status. | API only; requires replica set; no automatic fallback |
| Tracking ID generation | Random uppercase base36 candidate with collision lookup and longer fallback; unique database index. | Not an authenticated access token |
| Booking lookup by ObjectId | Full booking with selected worker fields. | Handler exists; no ownership authentication |
| History representations | Worker query excludes worker-hidden; customer query excludes customer-hidden; customer-ID query still matches name. | Renaming can break customer linkage |
| Status update | Accepts pending/confirmed/completed/cancelled. | No transition graph or authenticated worker check |
| Worker soft deletion | Three compatibility paths; terminal-state guard; compares supplied worker ID and confirms worker existence. | Caller-supplied identity can be impersonated |
| Customer soft-delete flag | deletedByCustomer field and filtering exist. | Partial: no route sets flag, no active customer control |
| Permanent deletion | Hard-delete endpoint removes booking document. | API only; no administrator protection or photo cleanup |
| Profile lookup/update | Customer lookup; worker/customer update; optional password replacement; duplicate contact checks. | No GET worker-profile route despite legacy references |
| Customer compatibility update | Intended `/api/customers/update` handler reads body ID. | Shadowed by preceding `/api/customers/:id` route |
| Worker photos | Disk upload on registration/replacement and GET photo URL. | No file-size/type restriction server-side |
| Booking photos | Up to ten on creation; later single-photo append endpoint. | Active worker append helper not connected; accumulated count unbounded |
| Static uploaded media | `/uploads` serves filesystem files; startup creates directory if absent; timestamps form filenames. | Public access, potential collisions/orphans |
| Configuration and request parsing | dotenv, PORT default 3001, required MONGO_URI; JSON and URL-encoded bodies; permissive CORS. | No security headers/rate limiting configured |
| Validation/error feedback | Various required-field, ObjectId, date-format, time-format, and duplicate checks; structured success/message responses. | Inconsistent checks; internal errors can be returned |
| Booking migration | Cursor traversal normalizes bookingDate, sets missing time=null, backfills UTC dateStr. | Manual utility; duplicate in client; failure can exit 0 |

**Scheduling is partially integrated.** The main customer flow books dates, but the backend supports optional times. Null-time standard bookings are not checked against existing day-level capacity. Transactions alone do not resolve every race; exact timestamp index keys can differ for the same calendar day, and cancelled string-time records remain in the unique index.

## 8. Temporary local demo: complete feature boundaries

Source: [demoApi.js](client/src/demoApi.js).

| Demo capability | Actual behavior |
| --- | --- |
| Two sample identities | Demo Worker is a plumber in 110001; Demo Customer has sample contact/address. No hosted accounts or passwords are created. |
| Development restriction | Buttons and adapter installation use NODE_ENV=development. Production builds do not expose demo shortcuts. |
| Seeded example | One pending tap-repair booking for the following day with code DEMO00001; no photo/location. |
| Persistent sample data | Worker/customer/bookings stored in localStorage under doable-demo-data-v1. Data survive logout/relogin. No visible reset button. |
| Current demo session | Role flag in sessionStorage; Axios default adapter intercepts requests, including instances created from defaults. Opening Login stops demo mode. |
| Worker search | Exact pincode and case-insensitive profession match against one sample worker. |
| Profile editing | Updates supported contact/profile fields; keeps separate demo customer profile fallback in sessionStorage. |
| Date blocking | Reads availability and adds/removes/replaces local blocked dates. |
| Booking creation | Stores job/date/contact, tracking ID, optional coordinates, and optional photos as data URLs. Checks blocked day. |
| Shared booking lifecycle | Customer history/track, worker list/status/hiding all read same stored dataset. Hidden worker requests remain in customer history. |
| Demo address alias | Populated customer booking responses add address=clientAddress, so screenshot addresses display despite the real API mismatch. |
| Unsupported requests | Return explicit temporary-demo error; never fall through to hosted API while demo is active. |
| Password limitations | Customer password-change request is unsupported. Worker profile update returns success but ignores password field; no credential is changed. |
| Photo limitations | Booking creation stores attached images locally. Worker profile-photo and later booking-photo uploads are unsupported. Large base64 images can exceed browser storage quota. |
| Scheduling limitations | No free-slot endpoint, working-hour update, or transactional booking route emulated. Status changes do not implement full server validation. |
| External browser actions | Axios substitution does not prevent user-selected geolocation capture, map navigation, or normal image/link loads. The app is not universally offline. |

Demo success is useful for demonstrating workflows, but it is not evidence of hosted API availability, MongoDB persistence, authentication security, upload reliability, or scheduling concurrency.

## 9. Inactive and legacy features present in code

These features are outside the active route/import graph and have no screenshots. Their code presence should be preserved in an inventory, not advertised as current functionality.

| File(s) | Additional capability | Why it is not currently usable |
| --- | --- | --- |
| `BookWorker.jsx` | Pick available times, fetch free-slot endpoint, blocked-date filtering, success/error text, reset button, optional onBooked callback. | Not mounted; payload sends date/customerId but omits required bookingDate/clientName/jobDetails; relative API configuration differs. |
| `WorkerAvailability.jsx` | Working-hour/slot-duration editor, slot previews, multi-date local selection, bulk add, individual unblock, clear all dates, optional headers/apiBase/onSaved. | Not mounted; default headers object causes unstable Axios/effect dependencies if used unchanged. |
| `AllWorkersList.js` | All-worker cards with photos and mobile numbers; WhatsApp link; worker deletion with confirmation. | Not mounted; all-workers GET/DELETE APIs absent. |
| `PersonList.js` | Worker directory with pincode/profession filtering, alphabetical names, remote profession icons, WhatsApp, delete, booking links. | Not mounted; five-digit pincode rule conflicts with six-digit backend; APIs and booking route absent. |
| `CustomerAuthCard.js` | Combined login/register panel, local remembered customer, logout, option cards embedding search and tracking. | Not mounted; registration omits required address; storage JSON parse unguarded. |
| `TrackRequest.js` | Standalone tracking form with loading, error, and status-only result. | Only referenced by inactive customer auth card. |
| `BookingForm.js` | Simple workerId route-based booking with client name, job, date, tracking success alert. | Not routed; return destination `/list` absent. |
| `WorkerDetails.js` | Legacy profile/bookings, collapsible bookings, Accept/Delete actions. | Missing GET profile and PUT accept APIs; delete omits required header. |
| `WorkerInfo.js` | Similar legacy profile and always-visible booking list with Accept/Delete. | Same missing contracts; also exports misleading WorkerDashboard name. |
| `WorkerProfile.js` | Combined worker login/register mode switch and phone input. | Registration lacks pincode; redirects to missing `/list`. |
| `AddPerson.js` | AccountId-based worker form, profession/area/city/contact/photo submission. | `/persons` backend and `/list` route absent. |
| `Register.js` | Minimal worker name/password registration. | Required mobile/pincode omitted; `/login` route absent. |
| `CreateAccountForm.js` | Customer registration collecting name/email/password/phone. | Address omitted; unused alternate component. |
| `CreateCustomerAccountForm.js` | Customer name/email/password registration. | Phone/address omitted; unused alternate component. |
| `CustomerLogin.js` | Separate customer login with onLogin callback. | Posts to server root, expects wrong ID field, unused. |
| `WorkerAuthCard.js` | Worker portal Login/Create Account navigation card. | Links target missing routes. |
| `WorkerLoginCard.js` | Login-shaped placeholder UI. | No API request; logs plaintext password and shows implementation-pending alert. |
| `BookingStatusLine.js` | Numbered pending→confirmed→completed progress with cancellation text/red state. | Unused component and CSS. |
| `StatusLine.js` | Alternate status progress circles and labels. | Unused; cancellation incorrectly marks displayed steps completed. |
| `App.css`, `index.css`, status CSS files | Legacy themes, cards, icons/profession grids, body reset, status progress styling. | Not imported into active entry path; status CSS only used by inactive components. |
| `reportWebVitals.js` | Optional performance metric callback. | Entry point never invokes it; no active analytics UI or export. |

## 10. Important feature gaps and behavior mismatches

| Finding | Consequence for the feature | Recommended correction |
| --- | --- | --- |
| No authenticated ownership | Profile/password edits, status updates, booking reads, uploads, and hard deletion can operate on supplied IDs. | Establish sessions and enforce identity/role/ownership on server. |
| Unprotected password update alternatives | Dedicated current-password check is bypassable through profile PUT. | Remove alternate password paths or require verified credentials/session. |
| Name-based customer relationship | Rename breaks history; another account taking old name may inherit name-matched records. Active booking prefers original router name after edit. | Store immutable customerId in bookings; migrate existing data. |
| Real address field mismatch | Screens 12/14 show demo addresses, but real responses use clientAddress while customer UI reads address. | Standardize response schema or consume clientAddress. |
| Slot/day design incomplete | Active date-only requests allow repeated bookings without day capacity; API-only slots are inconsistent with unique index/status release. | Decide booking granularity, integrate picker, normalize day and active slot reservation. |
| Invalid duration accepted | Zero/negative duration can hang the server's slot loop. | Validate positive bounded integer and guard generator. |
| Terminal lock is UI-only | API can reopen completed/cancelled requests despite screen lock. | Enforce allowed transitions server-side. |
| Customer cancel/delete unsupported | Form Cancel can be mistaken for request cancellation; deletedByCustomer flag is unused. | Clarify wording or implement authorized booking actions. |
| Worker photo append disconnected | Backend plus handler exist but user cannot invoke them from active UI. | Add a control or remove unused implementation. |
| Email/password normalization differs | Registration and subsequent login/update can disagree for case/spacing. | Apply one normalization rule; do not silently trim passwords. |
| Partial session restoration | Router state is not authentication; stored fallbacks differ by role and login/save event. | Load profiles from authenticated server session. |
| Hidden/misleading demo operations | Worker password save succeeds without changing anything; photo/customer-password operations fail. | Disable unsupported fields in demo or visibly explain boundaries. |

## 11. Visual and usability assessment

The screens use a consistent broad language of gradients, white rounded panels, colored action buttons, and a blue active tab. Customers have a green background; worker/auth screens use blue. Worker statuses have readable text in addition to colors. Login includes visible field labels, password visibility, and an alert role for errors. Sample data makes search and history easy to demonstrate.

The main visual issues are supported by the screenshots and source:

1. **Horizontal overflow:** Screenshot 17 visibly scrolls horizontally. Fixed search width 420, select minimum widths, and a nonwrapping toolbar exceed the available panel width. Booking columns in 09/10 are similarly tight. Use a wrapping or stacked layout at narrower widths.
2. **Inconsistent form controls:** Registration text fields in 03/04 are native small controls while dropdowns, dashboard inputs, and login fields are larger. Shared active input styles would improve consistency; the legacy CSS is not imported.
3. **Shifting tab layout:** Customer tabs wrap and redistribute as conditional tabs appear. Screens 11–14 show two rows, with My Bookings sometimes occupying an entire row. A deliberate responsive navigation layout would be more predictable.
4. **Missing persistent labels:** Registration and profile edit rely on placeholders or entered values. Users lose field context; accessible labels are missing in several forms. Keep labels visible above inputs.
5. **Status visibility gap:** History/details in 13/14 omit booking status, requiring a separate tracking lookup. Show status alongside the tracking code.
6. **Ambiguous empty/loading feedback:** Search says No workers found before any query; tracking can show no-match wording while a result is not yet present. Worker request failures are often console-only and indistinguishable from an empty list.
7. **Feedback consistency:** Many operations use blocking alert/confirm dialogs; some errors are inline and others are console-only. Use visible contextual messages and clear loading states.
8. **Accessibility:** Worker cards are clickable divs; several inputs remove outline without a replacement. Conditional status/helper CSS is not a complete accessibility system. Keyboard and screen-reader behavior needs explicit verification.
9. **Excess scrolling and spacing:** Several simple screens have large empty gradient areas. Default body margin remains because index.css is not imported; minHeight plus padding adds scroll. Booking-detail rows are widely spaced. These are layout observations at the captured viewport, not a full responsive/device audit.
10. **Wording and provenance:** Gmail label suggests a restriction that does not exist. Delete wording implies permanence although worker deletion only hides the record. Temporary demo labels correctly identify sample data, but unsupported actions need similar explanation.

No rating, payment, notification, security, or performance behavior can be established from the visual treatment alone.

## 12. Complete API-to-feature mapping

Every backend route is accounted for here. API routes are not protected by server-verifiable authenticated sessions; current-password verification and caller-supplied worker-ID comparisons are specific checks, not a session system.

| Method/path | Feature | Active integration / demo | Source |
| --- | --- | --- | --- |
| `POST /api/auth/register` | Worker account creation and optional photo | Active registration; demo account creation not emulated | [server.js:176](/home/aayush/Desktop/kishu/Doable/server/server.js:176) |
| `POST /api/auth/login` | Worker password verification | Active normal login; demos use shortcut | [server.js:221](/home/aayush/Desktop/kishu/Doable/server/server.js:221) |
| `GET /api/workers/search` | Pincode/profession directory search | Active customer search; demo implemented | [server.js:256](/home/aayush/Desktop/kishu/Doable/server/server.js:256) |
| `GET /api/workers/:workerId/availability` | Blocked dates and working hours | Active date checks and worker calendar; demo implemented | [server.js:280](/home/aayush/Desktop/kishu/Doable/server/server.js:280) |
| `GET /api/workers/:workerId/availability/slots` | Available time slots | API only; inactive slot components | [server.js:309](/home/aayush/Desktop/kishu/Doable/server/server.js:309) |
| `POST /api/workers/:id/availability` | Unified batch blocking and working-hour editing | API only in active app; demo unsupported | [server.js:375](/home/aayush/Desktop/kishu/Doable/server/server.js:375) |
| `POST /api/workers/:id/blocked-dates` | Add/remove/replace date blocks | Active single-date actions; demo implemented | [server.js:433](/home/aayush/Desktop/kishu/Doable/server/server.js:433) |
| `POST /api/bookings` | Standard pending booking creation | Active customer form; demo implemented | [server.js:498](/home/aayush/Desktop/kishu/Doable/server/server.js:498) |
| `POST /api/bookings/safe` | Transaction-backed confirmed booking | API only; replica set required; demo unsupported | [server.js:638](/home/aayush/Desktop/kishu/Doable/server/server.js:638) |
| `GET /api/bookings/worker/:id` | Worker request list | Active; worker-hidden records omitted; demo implemented | [server.js:797](/home/aayush/Desktop/kishu/Doable/server/server.js:797) |
| `GET /api/bookings/track/:trackingId` | Full request tracking lookup | Active tracking; demo implemented | [server.js:810](/home/aayush/Desktop/kishu/Doable/server/server.js:810) |
| `GET /api/bookings/:id` | Booking detail lookup by ObjectId | Active helper supports it; usual list flow passes object; demo unsupported | [server.js:824](/home/aayush/Desktop/kishu/Doable/server/server.js:824) |
| `PUT /api/bookings/:id/status` | Set booking status | Active worker control; demo implemented | [server.js:840](/home/aayush/Desktop/kishu/Doable/server/server.js:840) |
| `GET /api/bookings/customer` | Name-matched customer history | Active fallback; demo implemented | [server.js:871](/home/aayush/Desktop/kishu/Doable/server/server.js:871) |
| `GET /api/bookings/customer/:customerId` | Customer history with worker population | Active main history query; demo implemented | [server.js:900](/home/aayush/Desktop/kishu/Doable/server/server.js:900) |
| `DELETE /api/bookings/:id` | Worker hide of terminal booking | Active primary action; demo implemented | [server.js:955](/home/aayush/Desktop/kishu/Doable/server/server.js:955) |
| `DELETE /api/bookings/delete/:id` | Worker hide compatibility alias | Active fallback; demo alias unsupported | [server.js:991](/home/aayush/Desktop/kishu/Doable/server/server.js:991) |
| `DELETE /api/bookings/:id/delete` | Worker hide compatibility alias | Active fallback; demo alias unsupported | [server.js:1024](/home/aayush/Desktop/kishu/Doable/server/server.js:1024) |
| `DELETE /api/bookings/:id/hard-delete` | Permanent document deletion | API only; no admin check; demo unsupported | [server.js:1058](/home/aayush/Desktop/kishu/Doable/server/server.js:1058) |
| `POST /api/customers` | Customer account creation | Active registration; demo account creation not emulated | [server.js:1083](/home/aayush/Desktop/kishu/Doable/server/server.js:1083) |
| `POST /api/customers/login` | Customer password verification | Active normal login; demos use shortcut | [server.js:1127](/home/aayush/Desktop/kishu/Doable/server/server.js:1127) |
| `GET /api/customers/:id` | Customer profile lookup | API exists; active dashboard seeds from state/storage, not GET; demo unsupported | [server.js:1155](/home/aayush/Desktop/kishu/Doable/server/server.js:1155) |
| `POST /api/customers/:id/change-password` | Verified customer password change | Active form; demo unsupported | [server.js:1173](/home/aayush/Desktop/kishu/Doable/server/server.js:1173) |
| `PUT /api/auth/profile/:id` | Worker profile/password/hour updates | Active profile fields; demo emulates contact fields only | [server.js:1225](/home/aayush/Desktop/kishu/Doable/server/server.js:1225) |
| `PUT /api/customers/:id` | Customer profile/password updates | Active contact edits; demo emulates contact fields only | [server.js:1283](/home/aayush/Desktop/kishu/Doable/server/server.js:1283) |
| `PUT /api/customers/update` | Body-ID profile compatibility update | Shadowed by dynamic route; demo unsupported | [server.js:1335](/home/aayush/Desktop/kishu/Doable/server/server.js:1335) |
| `POST /api/workers/:id/photo` | Replace worker photo | Active profile upload; demo unsupported | [server.js:1390](/home/aayush/Desktop/kishu/Doable/server/server.js:1390) |
| `GET /api/workers/:id/photo` | Read worker photo URL | Active photo lookup; demo returns null seed photo | [server.js:1427](/home/aayush/Desktop/kishu/Doable/server/server.js:1427) |
| `POST /api/bookings/:id/photo` | Append one booking photo | Backend + unused worker helper; demo unsupported | [server.js:1461](/home/aayush/Desktop/kishu/Doable/server/server.js:1461) |

## 13. Supporting technical and operational capabilities

| Capability | Present implementation | Practical limits |
| --- | --- | --- |
| Client development | CRA start server, hot reload, JSX compilation, ESLint diagnostics. | Current dev build has pre-existing unused-code warnings. |
| Production packaging | react-scripts build creates optimized JS/CSS/assets in client/build. | Build succeeded during demo implementation; not deployment validation. |
| Client testing | CRA Jest/React Testing Library and jest-dom setup. | Only starter App test exists; wrong content assertion and missing router context. |
| Server execution | Plain Node Express application; port from environment and direct node server.js entry. | No start npm script; package main targets absent index.js; no backend test suite. |
| Dependency reproducibility | Separate npm manifests and v3 lockfiles. | No root workspace, CI, pinned Node engine, or current security-advisory audit. |
| Browser routing/static shell | BrowserRouter, HTML root, title Doable, favicon, manifest, robots file. | Server-side SPA fallback depends on deployment; manifest still names React App and references absent favicon.ico. |
| Browser persistence | localStorage for demo dataset and selected real customer profile/remembered identifier; sessionStorage for demo flag/profile. | No encrypted account session, multi-user browser separation, or visible demo reset. |
| Media and external links | Uploaded image URLs, Google Maps links, tel links; WhatsApp and placeholder icons only in inactive components. | No in-app calling/chat infrastructure. |
| Documentation artifacts | Contributor guide, repository report, 20 full-page screenshots, HTML gallery, overview, manifest, ZIP, and this feature report. | Developer/review material, not user-facing product features. |

## 14. Features not implemented

The following common marketplace capabilities are absent from the reviewed code, not simply omitted from these screenshots:

- Payments, quotes/pricing, invoices, refunds, commissions, wallets, or worker earnings.
- Ratings/reviews, provider verification, credentials, portfolios, ranking, or recommendations.
- In-app chat, email/SMS/push notifications, reminders, WebSocket updates, or background job processing.
- Nearby search by GPS/radius, distance calculation, geocoding, interactive map results, or continuous worker location tracking. Existing geolocation is one customer location snapshot.
- Customer cancellation, rescheduling/editing booked jobs, customer history deletion, or worker reassignment.
- Administrator dashboard, protected admin identity, moderation, user-management workflow, or audit trail. An unprotected hard-delete API is not a complete admin feature.
- Forgot-password flow, OTP/social login, verified contact channels, session expiration, or authenticated route/resource access.
- Multi-language support, account settings/preferences, favorites, downloadable user reports, or exports.
- Production CI/deployment automation, health/readiness endpoint, structured monitoring, backups, or managed upload lifecycle.

Time slots, working hours, WhatsApp links, and status-progress components are **present but not actively integrated**, so they should not be grouped with the entirely absent capabilities above.

## 15. Recommended feature work order

1. **Make existing features trustworthy:** authentication/ownership, protected credential changes and deletion, immutable customer linkage, server validation, upload limits, and consistent status rules.
2. **Align UI, API, and demo:** fix address naming, unsupported demo actions, account restoration, profile cancel behavior, and ambiguous cancellation/hiding wording.
3. **Complete scheduling:** decide date-level capacity versus slots, normalize reservation keys, release cancelled capacity correctly, integrate working-hours/time selection, and guard duration generation.
4. **Improve the current screens:** responsive toolbar/forms, stable tab navigation, explicit labels/focus states, visible status in customer history/details, and contextual feedback.
5. **Connect only intended dormant capabilities:** choose whether to expose worker booking photos, hours/bulk availability, and external contact shortcuts; retire duplicate/broken legacy forms.
6. **Then add new marketplace features:** pricing/payment, verified providers/reviews, customer rescheduling/cancellation, notifications, and administration as product priorities require.

## 16. Review completion and limits

Coverage is complete for the current artifact set: **20 of 20 screenshots individually inspected; all five routes, six customer tabs, four worker tabs, active feature handlers, all 29 backend routes, demo branches, and every inactive UI component accounted for.** Conditional code features are identified even when no screenshot demonstrates their result.

This report does not assert that the hosted backend matches this checkout or that every submitted action works remotely. Screenshot evidence is from local demo mode; code evidence is from the current working tree after demo shortcuts were added. No application code was modified during this review. For per-file organization, storage details, and the earlier security findings, see PROJECT_ANALYSIS.md.
