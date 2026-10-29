# Doable Website Redesign — UnifiedUI Reference Plan

## Authority and scope
The user selected [UnifiedUI's Handyman Service landing-page concept](https://dribbble.com/shots/25402398-Handyman-Service-Landing-Page) and requested a coder/reviewer pair. The user explicitly wants **a website**, not an app, tablet presentation, or device mockup. Implement in the existing React repository at `/home/aayush/Desktop/kishu/Doable`, served on localhost:3000. Preserve the actual customer/worker capabilities and development demo shortcuts. No publishing or hosted-data mutations are requested.

## Saved reference evidence
- `hero-reference.webp`: full-resolution hero/category artwork, 3200 × 2400.
- `full-page-reference.webp`: complete landing-page artwork as served to the browser, 658 × 2412.
- `section-collage.webp`: additional section composition, 658 × 494.
- `dribbble-page.jpg`: full screenshot of the public source page.
- `source-manifest.json`: browser asset provenance; media are WebP despite original .jpg URL names.
- `tokens.json`: proposed Doable implementation values, inferred from artwork rather than extracted source CSS.

Downloaded reference art belongs to its original author and stays in this research directory. Do not ship it, its photos, its HandyHub logo, browser frame, testimonials, or statistics as Doable assets. Build original components and use suitable licensed/original imagery. Existing uploaded personal photos are not reusable marketing stock.

## Reference analysis

### Identity and palette
The site artwork is almost-black charcoal, with white headings and restrained muted gray text. Mint/emerald green is the dominant action color. Most sections remain dark; a full-width split section places a warm human photograph beside a solid green panel with black typography. Borders are thin and low contrast, and green accents are concentrated at action/search controls, highlighted headline words, selected cards, and small badges. Avoid the previous app's large blue/green gradient backgrounds.

Target tokens: background #101112; surfaces #151719/#1b1e20; border #2b3033; main text #f4f5f4; muted text #a0a8ae; accent #20c997. These are design choices based on visual inspection, not claims about the exact original palette. A subtle green glow can accent the lower CTA region; do not use gradients as the overall page background.

### Typography
The reference uses a contemporary sans-serif with rounded proportions, bold prominent centered headings, and compact navigation. The exact font is not verifiable from a raster image; use Inter or a comparable system sans-serif. Desktop hero approximately 56–64 px, tight 1.08–1.15 line height, weight 650–750, two or three purposeful lines. Section headings approximately 36–44 px; readable 16 px body text. Green emphasis should highlight a meaningful word, not entire blocks.

### Desktop composition and spacing
A centered content area sits inside a generous desktop canvas. Navigation is horizontal: logo left, short links center, sign-in/primary action right. Hero follows substantial top breathing space, a small rounded eyebrow, large centered headline, short explanation, and a **real service + pincode search form**. Search uses a dark rounded rectangular field group with an internal divider and a separate square green search button. Small popular-service links sit beneath.

The next section is a four-column row of photographic service cards: roughly square/wide images, rounded corners, labels beneath, compact arrow actions. The page proceeds through visually distinct sections rather than one tall dashboard card. Use max width about 1200 px, desktop gutters 32–48 px, section padding 80–112 px, card radii 16–24 px. Responsive website layouts must wrap intentionally and avoid horizontal overflow. The user withdrew the temporary full-width request; the centered layout is the final direction. Verify it on wide desktop and narrow browser widths.

### Full-page section sequence in the reference
1. Horizontal header and centered search hero.
2. Four photographic service cards.
3. Full-width photo + green panel introducing professionals/people.
4. Centered services heading and a 3 × 2 bordered feature grid, one green highlighted card.
5. Service proposition, compact proof/stat cards, large media panel.
6. Community callout surrounded by small decorative photos.
7. Testimonials grid with avatars and star treatments.
8. Multi-column footer.

The mockup includes unverifiable example ratings, counts, affiliations, download badges, and app-related copy. Their **layout** can inform hierarchy; their claims must not appear as Doable facts.

## Doable adaptation and acceptance criteria

### Public website
- `/` becomes a full landing website with the above dark/green character. Move login to a clear `/login` route and update logout/registration navigation accordingly.
- Header: original Doable wordmark/icon; Services, How it works, For professionals; Log in; primary Find a professional action.
- Hero: original message about local everyday services; service/profession and six-digit pincode form connected to results, not a decorative field.
- Seven supported professions: Plumber, Electrician, Carpenter, Painter, Mechanic, Cleaner, Gardener. Photographic category cards and a complete service grid can use complementary layouts without duplicating meaningless content.
- Sections: categories, a photo/green professional invitation, three-step booking explanation or service feature grid, honest benefits, featured demo professionals if clearly labelled, FAQ, worker recruitment CTA, complete footer.
- Do not invent customers, reviews, certifications, insurance, fixed prices, or completed-job counts. Do not use dead video/play, social, download, or booking controls. Hide unsupported content or provide meaningful behavior.
- Add a browsable service/results route and useful worker profile view when practical; public entry must lead into the existing booking journey. Preserve login/demo navigation and registration routes.

### Application pages remain website pages
- Login and both registrations: shared dark visual system, persistent labels, clear role context, restrained green CTA, demo shortcuts on development builds.
- Customer dashboard: proper website shell/navigation, profile, search/results, booking details/date/address/phone/photos/location, tracking, history, booking info. Make booking status visible, preserve actual handlers, and fix response-field display as needed for UI consistency.
- Worker dashboard: desktop workspace shell; profile/edit/photo, searchable/filterable/sortable/paginated bookings, detail/status/hiding, availability calendar. Keep toolbar responsive and preserve all current operations.
- Forms, cards, controls, typography, colors, loading/error/success feedback, and date-picker styling must be consistent throughout. No fake tablet/browser frame wrapping our website.
- Existing demo adapter must continue to isolate demo Axios requests from the hosted backend. Preserve local sample data; do not create hosted accounts or test hosted writes.
- Make unsupported demo actions visibly unavailable or explain their limitations; never show a false success for changing demo passwords.

## Reviewer workflow
The reviewer is visual QA, not a second coder. It owns browser screenshot checks and writes findings/evidence, sending concrete messages directly to the coder. Compare original reference artwork with current localhost screenshots at substantive milestones; inspect all active pages and dashboard subviews, desktop and narrow browser widths. Do not edit application source. Identify location, mismatch, desired correction, and severity. Save numbered rounds under `design-review/` with an index and a final report. Review responsive behavior, accessible field labeling/contrast/focus, functional navigation, and preservation of demos in addition to visual fidelity.

## Coder workflow
The coder owns application edits. Read this plan, the reference images, repository AGENTS.md, and feature inventory. Coordinate directly with the reviewer; send milestones and routes ready for review. Keep the development server available, run a production build and appropriate behavioral checks, fix visual feedback, and report unsupported features or deliberate adaptations honestly. Do not spawn more agents or publish the website. Completion means the redesign is implemented and the reviewer has inspected the final version with no unresolved major visual/functionality regressions.
