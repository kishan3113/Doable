# Doable redesign visual review

Reference: [UnifiedUI Handyman Service landing page](https://dribbble.com/shots/25402398-Handyman-Service-Landing-Page). Scope follows `design-reference/unifiedui/DESIGN_PLAN.md`.

Reviewer owns browser QA and evidence only. All interactions use localhost and local demo sessions; no hosted account creation or writes, password changes, or deployment.

## Review rounds

### Round 00 — baseline

- Studied hero-reference.webp, full-page-reference.webp, and section-collage.webp.
- Current `/` displays Worker Login: white centered card on a blue gradient, no public landing page.
- Evidence: [login desktop](round-00-baseline/login-desktop.jpg).
- Direction sent to coder: centered bold search hero, photographic category row, full-width photo/mint panel, spacious dark website sections and shared browser-width shells.

## Coverage index

| Area | Desktop | Narrow | Notes |
| --- | --- | --- | --- |
| Landing + navigation | Reviewed | Reviewed | Baseline currently login |
| Public search + profile | Reviewed | Reviewed | If implemented |
| Login | Reviewed | Reviewed | Demo entry preserved |
| Customer registration | Reviewed | Reviewed | Inspect without submission |
| Worker registration | Reviewed | Reviewed | Inspect without submission |
| Customer profile | Reviewed | Reviewed | Include edit form |
| Customer worker search | Reviewed | Reviewed | Use local demo |
| Customer tracking | Reviewed | Reviewed | Populated state |
| Customer history | Reviewed | Reviewed | Populated state |
| Customer booking info | Reviewed | Reviewed | Populated state |
| Customer book worker | Reviewed | Reviewed | Full booking form |
| Worker profile | Reviewed | Reviewed | Include edit form |
| Worker bookings | Reviewed | Reviewed | Filters/sort/pagination/details |
| Worker availability | Reviewed | Reviewed | Calendar |
| Worker booking details | Reviewed | Reviewed | Full booking form |

## Open findings

No unresolved major visual or navigation regressions found. Reported P2/P3 issues were fixed and reviewed.

### Round 01 — public milestone

Captured desktop and 390 × 844 browser layouts for landing, login, customer registration, and worker registration in [round-01-public](round-01-public/).

- Landing matches the planned centered large search hero, photographic four-card row, full-width photo/mint split, dark bordered services, process/FAQ/footer sections. No app/device frame or blue gradient. Mint actions use dark readable ink.
- Landing measured no horizontal overflow at 390 px (`scrollWidth = innerWidth = 390`).
- Login is a spacious desktop photo/form split and a clean single-column narrow form. Persistent labels, role context, demo entries, focus ring, and contrast are readable.
- Registration forms share that visual language; no forms were submitted.
- P3: landing narrow `Explore all services` link is cramped beside heading; suggested shorter mobile wording or link below heading.
- Compile overlay appeared while coder rewrote dashboard (`CustomerDashboard.js` bookingMedia closing div). Reported immediately; QA paused until fixed.
- Narrow full-page registration capture clips content at original viewport boundary despite scrollHeight 993; bottom controls need a scrolled viewport evidence check, not a source assumption.

### Round 02 — dashboards and demo functionality

Inspected all six customer tab states (profile, search, booking form, tracking, history, booking details) and all four worker tab states (profile, bookings, availability, booking details), plus both profile edit forms, desktop and 390 px narrow browser widths. Evidence is in `round-02-dashboards/`.

Verified local demo booking creation, selected date, saved history, tracking, worker status update Pending → Confirmed, text search, sort, status filtering, availability block/unblock. Narrow forms/calendar/toolbar fit without horizontal overflow. Unsupported demo password/photo edits are explained and do not claim success. No location permission, real password changes, hosted writes, or registration submissions.

P2 found and fixed: native booking success alert made IAB unresponsive. Coder replaced native alerts/confirm prompts with inline dismissible notices and in-page confirmation. Retest succeeded with visible tracking ID and responsive history.

Local sample stock plumbing photo successfully attached and submitted as demo request `DEMOMV6LMM9S`. Customer details and worker list/details display the photo; DOM confirms image loaded with naturalWidth 422. Worker photo evidence uses viewport capture because full-page capture intermittently failed for that view.

P3: worker search did not initially match visible tracking IDs; coder is adding tracking ID search. Pagination controls observed correctly disabled for four local requests on one page; no large-data pagination fixture was created.

### Round 03 — public search/profile journey

Hero service + pincode search opens `/services?profession=Plumber&pincode=110001` and returns the local demo professional. Public profile → customer login → customer demo preserved selected professional and opened booking form. Profile at 390 px has no horizontal overflow. Results and profile evidence is in `round-03-public-results/`.

### Final user steering

The user briefly requested fluid full-width layout, then explicitly requested reverting that change. Final implementation restores the original centered 1200 px outer containers; unrelated fixes remain. Round 04 captures are superseded. Final desktop proof was captured in a 1920 × 1080 browser. Earlier 390 × 844 narrow evidence remains valid: narrow CSS was unchanged by the revert.

### Round 05 — final centered proof

Final source frozen and original centered layout restored. At 1920 px the home wordmark measures x=360, consistent with the restored 1200 px content region. Landing hero/full-page and representative customer/worker booking screenshots saved under `round-05-final-centered/`. Final tracking-ID search regression check returned DEMO00001 successfully. Mobile `All services` wording is fixed.

Final screenshot API produced 1905 × 1072 viewport images for some 1920 × 1080 browser captures (scrollbar/content frame excluded). Dimensions were checked; final proof filenames reflect desktop views. After browser reconnection, viewport override did not apply narrow resizing, so the mislabeled capture was removed; use the valid 390 px screenshots from rounds 01–03. Both registration bottom controls were checked via scrolling and are available.

No unresolved major visual/navigation regressions. All required customer/worker tab layouts, edit forms, public search/profile/login booking handoff, local booking/status/availability/photo flows inspected. Large-data pagination, hosted API behavior, registration submission, real password change, and geolocation permission were outside this local visual QA pass. Coder reports automated registration handoff coverage. Local landing tab is marked as deliverable; parent can show it in the app (subagent visibility capability is unavailable).

Final proof:
- [Landing hero](round-05-final-centered/landing-desktop-hero.jpg)
- [Full landing](round-05-final-centered/landing-desktop-full.jpg)
- [Customer bookings](round-05-final-centered/customer-bookings-desktop.jpg)
- [Worker bookings](round-05-final-centered/worker-bookings-desktop.jpg)
- [Tracking ID search](round-05-final-centered/worker-tracking-search.jpg)
