# Claude Code Project Instructions

## Project context

This repository implements a single-organization online donation platform. The product requirements, database model, technical architecture, and setup instructions are in:

- `PRD.md` (or `docs/PRD.md` after moving docs)
- `ERD.md`
- `TRD.md`
- `SETUP.md`

Read these before making architectural changes. If the docs conflict, flag the conflict and propose a consistent update before coding.

## Non-negotiable product rules

1. Guest checkout is supported; login is not required to donate.
2. Donation amount modes are `OPEN_AMOUNT` and `CLOSED_AMOUNT`.
3. Closed amount means a donor must select one active preset amount stored in the database.
4. A campaign can close when its target is reached, its end date passes, or an admin closes it manually.
5. Payments are one-time only. No recurring billing or saved payment instruments.
6. Midtrans and Xendit are separate server-side payment adapters.
7. A browser redirect/callback must never be treated as authoritative proof of payment.
8. Only a verified provider webhook or server-to-server provider status check can settle a donation.
9. Webhook processing, campaign raised amount updates, and notifications must be idempotent.
10. PostgreSQL is the source of truth. Redis is cache/rate-limit only.
11. Secrets never enter client bundles, Git, database public config, screenshots, or logs.
12. WhatsApp transactional messages are sent only when the donation's WhatsApp consent snapshot is true.
13. Donor transaction/receipt access requires ownership or explicit admin permission.
14. Do not use fake/sample campaign content as if it were a verified real appeal.

## Engineering rules

- Use TypeScript strict mode. Avoid `any`; use Zod schemas and explicit domain types.
- Keep business logic in `src/services` or domain modules, not page components.
- Keep provider-specific code in `src/lib/payments/providers`.
- Keep notifications behind email/WhatsApp provider interfaces.
- Validate all untrusted input server-side.
- Enforce RBAC on the server, not by hiding UI elements only.
- Use integer IDR values. Never use floating point for money.
- Use database transactions/conditional updates for settlement.
- Use migrations for schema changes; commit migration files.
- Do not add a dependency unless the existing stack cannot reasonably solve the task.
- Do not silently alter ERD or payment status semantics. Update docs when a design change is required.
- Prefer Server Components; add Client Components only for real interactivity.
- Do not use Edge Runtime for Node-only payment/SMTP/PDF SDK routes.
- Sanitize Markdown and never render unsanitized user/admin HTML.

## Delivery process

1. Inspect the repository and read relevant docs.
2. State a short implementation plan for multi-file changes.
3. Implement the smallest complete vertical slice.
4. Run lint, typecheck, unit tests, and build where available.
5. Review security and payment correctness before claiming a feature complete.
6. Report files changed, tests run, known gaps, and any required environment variables.

## Definition of done for payment code

- Amount and provider reference are read from server-side records.
- Provider credentials are server-side only.
- Webhook verification is implemented and tested.
- Duplicate webhook does not duplicate effects.
- A success state cannot regress to pending.
- Campaign total increments once only.
- Payment event is logged with sensitive fields removed.
- Notifications run asynchronously and cannot change payment status.

## UX and content

- Interface language: Indonesian.
- Mobile-first and accessible.
- Brand identity is not decided yet. Use a neutral placeholder design and load logo/colors/name from brand config.
- Do not hardcode brand name, logo, tagline, or colors across components.
- Currency formatting uses IDR and locale `id-ID`.
- Display dates in `Asia/Jakarta` while storing UTC.
