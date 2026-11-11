# UI Mockup Prompt Pack (TSX/JSX)

Gunakan prompt ini setelah PRD disetujui. Output yang diminta adalah **mockup implementasi frontend TSX/JSX**, bukan gambar statis.

## Master UI Prompt

```text
Act as a senior product designer and frontend engineer. Build a responsive UI prototype for the online donation platform described in PRD.md.

Read PRD.md and TRD.md first. Use:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons
- Indonesian copywriting
- Mobile-first responsive layouts

Brand identity is NOT finalized. Do not invent a permanent logo, organization name, or fixed color identity. Use a neutral, trustworthy temporary design token set and read brand data from a brand-config object so it can be replaced later.

Create page layouts for:
1. Home
2. Campaign detail
3. News detail
4. Checkout form
5. Select payment
6. Payment instruction/status
7. Payment success
8. Payment pending
9. Donor login
10. Donor dashboard and transaction list
11. Admin dashboard
12. Admin campaign/news/payment-method/transaction/donor/template/log/brand screens

Requirements:
- Use reusable components and typed mock data.
- Include loading, empty, validation, success, and error states.
- Use IDR formatting and Asia/Jakarta date display.
- Show clear progress and campaign status.
- Guest donations must not be blocked by login prompts.
- Do not fake a payment success state; payment pages must be wired to a status prop/API contract.
- Do not expose donor PII in public components.
- Use accessible form labels, keyboard focus, contrast, and semantic headings.
- Keep layouts realistic and buildable; avoid decorative UI that obscures the donate CTA.

Deliver code in small route/component groups. Do not build backend integrations in this task; use typed interfaces and explicit TODO markers for API connection.
```

## Per-Page Prompt Template

```text
Implement the [PAGE NAME] page from the PRD.

Before coding, list:
- User goal
- Required data
- Main CTA
- Empty/loading/error states
- Mobile layout behavior
- Components to reuse

Then implement the actual TSX page and supporting components. Use real type definitions, no `any`, no fake backend payment statuses, and no hardcoded brand identity. Run lint and typecheck after implementation.
```

## Review Prompt

```text
Review the UI implementation against PRD.md. Check mobile responsiveness, accessibility, form validation UX, public/private data separation, status clarity, and consistency with the payment flow. Return concrete issues with route and file references. Do not change backend business rules to make the UI easier.
```
