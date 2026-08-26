# Event Management Platform — Production Readiness TODOs

## Phase 1 — Foundation & Configuration
- [ ] Create `.env.example` files (root, server, client)
- [ ] Rewrite `docker-compose.yml` with full env surface + healthchecks
- [ ] Add root `package.json` orchestration scripts
- [ ] Add server `seed.ts` (admin/user seed + demo event/ticket/coupon data)
- [ ] Fix server `config/index.ts` (wallet, coupons, firebase, blockchain, SMS vars)

## Phase 2 — Backend Completeness
- [ ] Mount `wallet.ts` and `coupons.ts` routes in `app.ts`
- [ ] Add missing event endpoints (publish, cancel, feature)
- [ ] Wire event price to ticket pricing; compute registeredCount from real registrations
- [ ] Strengthen `payments/verify` — real signature validation, no fake fallbacks
- [ ] Analytics: tickets sold, attendance, active users, pending payments
- [ ] Reports: certificates/sponsors/volunteers export endpoints
- [ ] Checkout: server-side coupons application + wallet integration
- [ ] Replace `console.*` with logger in socket & AI modules

## Phase 3 — Frontend Real-Data Wiring
- [ ] `api.ts`: add `walletApi`, `couponsApi`, export helpers
- [ ] `App.tsx`: add Wallet/Coupons routes; role-based nav
- [ ] `DashboardHome`: real chart data from `stats.charts`
- [ ] `Calendar`: real events from API
- [ ] `Chat`: real Socket.IO (rooms, messages, typing, read receipts)
- [ ] `Payments`: real summary cards + working export + refund action
- [ ] `Profile`: real stats + save via API
- [ ] `Settings`: persist preferences to backend
- [ ] `Tickets`: event selector + CRUD modals
- [ ] `Venues`: add/update/delete modals wired to venuesApi
- [ ] `Certificates`: working download PDF + verify
- [ ] `EventDetail`: review submission + waitlist join
- [ ] `EventForm`: publish/duplicate actions + ticket builder
- [ ] `Checkout`: real Stripe/Razorpay SDK flows + coupon + wallet

## Phase 4 — Premium UI/UX Redesign
- [ ] Rewrite `index.css` theme (bright, premium, gradients, glassmorphism)
- [ ] Global page transitions, skeletons, empty states, success animations
- [ ] Sidebar/DashboardLayout redesign with notifications badge
- [ ] Responsive mobile layout (collapsible drawer + topbar)

## Phase 5 — Quality, Security, Testing, Documentation
- [ ] Server strict TS cleanup, validation, rate limiting per-route, XSS sanitization
- [ ] Client oxlint clean, strict TS, memoization, lazy loading
- [ ] Run `npm install`, `build`, `lint`, `typecheck` — fix all errors
- [ ] Unit tests (auth, payment verify)
- [ ] Update README.md, SETUP.md, add PRODUCTION_CHECKLIST.md
- [ ] Final verification pass across all routes/buttons/APIs

