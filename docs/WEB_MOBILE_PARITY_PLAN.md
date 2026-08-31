# Canoja Web — Mobile Feature Parity Checklist

## Audit summary

- Mobile contains 33 registered stack routes plus 4 operator tabs.
- After removing the navigation shell, duplicate tab destinations, and legacy/debug routes, the mobile product has approximately 30 active route-level screens.
- The mobile codebase also has three substantial embedded views: filters, sorting, and map results.
- Web currently exposes 13 meaningful routes: 6 admin pages, 1 operator dashboard, login/recovery, and a public claim form. `ShopFinder` exists but is not connected to a route.
- Admin functionality remains in scope and must not regress; mobile parity is an addition to the existing portal.

## Scope decisions

- [ ] Confirm the web supports three experiences in one app: guest/consumer, operator, and admin.
- [ ] Preserve all existing `/admin/*` routes and permissions.
- [ ] Treat the current mobile behavior and backend API as the functional source of truth.
- [ ] Use responsive web layouts rather than copying mobile dimensions literally.
- [ ] Exclude mobile-only implementation details: native permission screens, hardware back handling, safe-area wrappers, and app splash timing.
- [ ] Exclude legacy/debug screens unless product confirms otherwise: legacy detail, legacy pharmacy analytics, map debug, old location/access screens, and unregistered welcome/dashboard variants.
- [ ] Resolve the current product-rule conflict before Spotlight work: current QA requires Starter access, while older frontend documentation says all operators have access.

## Phase 0 — Architecture and parity foundation

- [x] Define route namespaces: public/consumer, `/operator/*`, and `/admin/*`.
- [x] Keep the existing login as the root entry and expose consumer discovery through `/explore`.
- [x] Add role-aware protected routes so consumers, operators, and admins cannot enter each other's private areas.
- [x] Expand auth state to store the full user profile, role, linked businesses, and active business ID.
- [x] Persist active business selection in local storage.
- [x] Add `X-Active-Business` to every operator API request, including multipart uploads.
- [ ] Include active business ID in React Query keys and invalidate business-scoped caches on switch.
- [ ] Match mobile token refresh, forced logout, deactivated-account, and 60-minute inactivity behavior.
- [x] Move the API base URL to environment configuration and verify production HTTPS/CORS behavior.
- [ ] Establish shared responsive shells, loading states, empty states, error states, dialogs, toasts, and form controls.
- [ ] Establish shared Canoja theme tokens and reuse the current mobile imagery where licensing and resolution allow.
- [ ] Add route-level code splitting for the consumer map/detail pages and admin modules.

## Phase 1 — Public consumer discovery

### Age and location entry

- [x] Build the legal-age confirmation gate.
- [x] Persist successful age verification for 30 days.
- [x] Log age-verification attempts through the existing API.
- [x] Request browser geolocation only after age verification and continue when it is denied/unavailable.
- [ ] Support manual location entry when browser geolocation is unavailable or declined.
- [ ] Preserve the last useful search location and refresh it using the mobile distance/time rules.

### Explore/list experience

- [x] Replace the legacy `ShopFinder` route with the responsive public `/explore` experience.
- [ ] Support search by coordinates, state/city, ZIP/postal code, and country where the API supports it.
- [ ] Implement paginated/infinite shop results using `compare-shops` and `compare-shops/more`.
- [x] Implement the responsive list/map Explore shell with shared result state.
- [x] Add result cards with image, business type, rating, distance, and open status.
- [x] Add a Spotlight carousel with five-item preview and See All affordance.
- [ ] Add the All Results page while preserving current location, filter, radius, session, and sort state.
- [ ] Add Spotlight See All with lazy loading and deduplication.
- [ ] Preserve search/filter/sort state in URL query parameters so result pages are shareable and back navigation is reliable.

### Filters and sorting

- [x] Implement filters for region, ZIP, city, state, radius, Open Now, Canoja Verified, Smoke Shop, Cannabis, Medical/Recreational/Both, Active Menu, and Spotlight.
- [x] Keep Smoke Shop and Cannabis mutually exclusive.
- [x] Apply the active filters to the shared Explore result state used by list, map, Spotlight, and All sections.
- [x] Add Top Rated and A–Z sorting, including reset behavior.
- [x] Show active filter/sort state and provide a Reset action.

### Map

- [ ] Add a browser map with clustered/usable shop markers and selected-result highlighting.
- [ ] Keep map bounds, list results, filters, and selected business synchronized.
- [ ] Add locate-me, manual-location fallback, loading, denied, and zero-result states.
- [ ] Verify map API key restrictions and avoid exposing unrestricted credentials.

## Phase 2 — Consumer business details

- [x] Create a canonical card destination at `/business/:businessId`.
- [x] Show business name, verification, type, address, description, primary photo, and rating.
- [x] Show available public phone, website, and directions without exposing the operator login email.
- [x] Show all seven operating-hours rows, including Today, Closed, 24 hours, and legacy JSON strings.
- [x] Add View Menu using either the operator-uploaded menu or external menu link.
- [ ] Show an embedded map and external directions action.
- [ ] Show similar businesses and preserve the originating search context on back navigation.
- [ ] Record profile view, phone, directions, website, and menu analytics without delaying navigation.
- [x] Add responsive detail imagery with the same missing-image fallback as mobile.

## Phase 3 — Consumer account and favorites

- [ ] Build role-aware consumer/operator sign-in matching the mobile flow.
- [ ] Add consumer signup and validation.
- [ ] Complete forgot password, OTP verification, and reset-password screens as one coherent flow.
- [ ] Support forced password change and prevent current-password reuse.
- [ ] Add the consumer Favorites route with saved/unsaved controls and empty state.
- [ ] Ensure favorite cards open the same canonical business-detail page.
- [ ] Decide whether favorites are server-backed or local-only; match mobile behavior until a backend contract is confirmed.
- [ ] Add consumer settings/account actions and logout.

## Phase 4 — Claim and operator onboarding

- [ ] Reconcile the existing web claim form with the mobile claim/onboarding API and validation.
- [ ] Add searchable license/business lookup and nearby-business discovery.
- [ ] Preserve separate required first-name and last-name fields and send structured plus combined contact names.
- [ ] Support verification document uploads with type/size validation and progress/error recovery.
- [ ] Implement smoke-shop auto-verification and cannabis/manual-verification branches.
- [ ] Add claim success, manual claim requested, manual verification requested, verified, and appeal outcomes.
- [ ] Make claim URLs resumable where safe and prevent duplicate submissions.

## Phase 5 — Operator shell and multi-business support

- [ ] Replace the single operator route with an operator shell and nested routes.
- [ ] Add Dashboard, Explore, Billing, and Settings navigation with responsive desktop/mobile behavior.
- [ ] Fetch the current user profile after login and restore linked businesses.
- [ ] Auto-select a sole business and require selection when multiple businesses exist.
- [ ] Add a Business Switcher showing the active business and plan.
- [ ] Expose Switch Business from the dashboard and settings only when applicable.
- [ ] Clear all business-scoped state and queries on logout.
- [ ] Verify every operator mutation affects only the active business.

## Phase 6 — Operator management parity

### Dashboard

- [ ] Match business-health cards: verification, visibility, menu freshness, and engagement.
- [ ] Add confirmation before visibility changes.
- [ ] Add Manage actions for location, profile, menu, and Spotlight.
- [ ] Add Grow actions for campaigns placeholder/state and billing.
- [ ] Add Insights navigation to detailed analytics.
- [ ] Add explicit refresh/retry behavior without discarding existing data on failure.

### Profile and location

- [ ] Build a dedicated business profile route for name, phone, website, description, photo, and operating hours.
- [ ] Keep public scraped email separate from private login email.
- [ ] Add the seven-day hours editor with Closed, 24 hours, and cross-midnight support.
- [ ] Build a dedicated location route with address and map pin.
- [ ] Clarify whether location is read-only, editable, or admin-controlled before enabling mutations.

### Menu and Spotlight

- [ ] Build menu upload/view/replace behavior for JPEG, PNG, and PDF with the current size limit.
- [ ] Add active-business headers to menu/photo multipart requests.
- [ ] Build Spotlight status and toggle management.
- [ ] Enforce the agreed plan restriction in both UI and API error handling.
- [ ] Refresh dashboard and public Spotlight results after a successful toggle.

### Analytics

- [ ] Add 7/30/90-day period selection.
- [ ] Show profile views, phone taps, direction requests, and website taps.
- [ ] Show percentage change versus the previous period and no-data states.
- [ ] Add a most-recent-first daily breakdown table.
- [ ] Scope analytics cache and requests to the active business.

### Billing and settings

- [ ] Add Free and Starter plan cards and normalize legacy `pro` values to Starter.
- [ ] Show the active business's current plan and upgrade/downgrade actions.
- [ ] Confirm whether plan changes are direct API updates or require a payment provider before implementation.
- [ ] Add account settings with Change Password, Change Email, Switch Business, and Logout.
- [ ] Build new-email request plus six-digit OTP confirmation and refresh the stored user afterward.

## Phase 7 — Admin coexistence and shared behavior

- [ ] Keep all existing admin verification, retailer, request, history, and user workflows operational.
- [ ] Add an admin-only route guard instead of authentication-only protection.
- [ ] Prevent operator and consumer navigation from displaying admin actions.
- [ ] Reuse shared auth/recovery components where behavior is identical without coupling role-specific layouts.
- [ ] Verify public business edits made by operators appear correctly in admin and consumer views.

## Phase 8 — Responsive, accessibility, SEO, and hardening

- [ ] Support phone, tablet, laptop, and wide desktop breakpoints for every new page.
- [ ] Make dialogs, drawers, filters, menus, galleries, and map controls keyboard accessible.
- [ ] Add visible focus states, semantic labels, sufficient contrast, and screen-reader status messages.
- [ ] Add page titles, descriptions, canonical business URLs, and social preview metadata.
- [ ] Add not-found, unauthorized, offline, server-error, and expired-session pages.
- [ ] Sanitize external URLs and validate uploaded content client-side and server-side.
- [ ] Remove sensitive logs and verify no login email/token is rendered or logged publicly.
- [ ] Confirm browser support and test geolocation behavior on HTTPS.

## Phase 9 — Verification and release

- [ ] Add unit tests for filter mapping, working-hours parsing, auth roles, plan normalization, and active-business headers.
- [ ] Add integration tests for login/refresh/logout, search pagination, claim submission, profile updates, menu upload, Spotlight, and email OTP.
- [ ] Add end-to-end journeys for guest discovery, consumer favorites, operator single-business, operator multi-business, and admin review.
- [ ] Run parity QA against the mobile test matrix for password, claims, subscriptions, Spotlight, refresh, settings, and operating hours.
- [ ] Test empty, loading, slow network, API failure, expired token, denied location, no image, and no results states.
- [ ] Test Chrome, Safari, Firefox, and mobile browsers.
- [ ] Run accessibility and performance audits; set acceptable budgets for initial load and map/detail pages.
- [ ] Deploy behind a staging URL and complete role-based acceptance testing before changing the production root route.
- [ ] Roll out with analytics/error monitoring and a rollback path that preserves the existing admin portal.

## Suggested delivery slices

- [ ] Slice 1: foundation, role guards, public age/location entry, and consumer list discovery.
- [ ] Slice 2: filters, sorting, map, Spotlight, result pages, and canonical business details.
- [ ] Slice 3: consumer auth, password recovery, favorites, and settings.
- [ ] Slice 4: claim/onboarding parity and all outcome screens.
- [ ] Slice 5: operator shell, multi-business selection, dashboard, profile, location, hours, and menu.
- [ ] Slice 6: operator analytics, Spotlight, billing, email change, and settings.
- [ ] Slice 7: full parity QA, accessibility/performance hardening, staging, and production rollout.

## Definition of done for each checklist item

- [ ] Desktop and mobile-browser layouts are implemented.
- [ ] Loading, empty, success, validation, and API-error states are handled.
- [ ] Role and active-business authorization are verified.
- [ ] React Query invalidation/cache behavior is verified.
- [ ] Keyboard and screen-reader behavior is checked.
- [ ] Relevant automated tests pass.
- [ ] Behavior is compared with the current mobile screen and accepted before marking complete.
