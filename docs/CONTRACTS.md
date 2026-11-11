# Kontrak antar modul

Setiap modul bisa dikerjakan/diuji terpisah selama kontrak ini dipenuhi.

## Pembayaran — `src/lib/payments/types.ts`
- `PaymentGatewayAdapter { isConfigured(); createCheckout(CreateCheckoutInput): NormalizedCheckout; verifyAndNormalizeWebhook(rawBody, headers): NormalizedPaymentEvent; getPaymentStatus(reference, providerPaymentId?) }`
- `verifyAndNormalizeWebhook` **harus** melempar `WebhookVerificationError` bila signature/token salah, dan hanya mengembalikan event setelah verifikasi.
- `NormalizedPaymentEvent.status ∈ PENDING|SUCCEEDED|FAILED|EXPIRED|CANCELLED|REFUNDED` (status internal, bukan status mentah provider). `externalEventId` stabil untuk dedupe.
- Penambahan provider: implement adapter, daftarkan di `registry.ts`, tambah mapper di `status-mapper.ts` + test, route `/api/webhooks/<provider>` memanggil `handleWebhook`.

## Settlement — `src/services/payments.service.ts`
- `applyPaymentEvent(event): {outcome: APPLIED|DUPLICATE|IGNORED, reason?}` — satu-satunya jalan mengubah status pembayaran/donasi. Idempotent, transaksional. Dipanggil oleh webhook, `reconcilePayment`, dan job `expirePayments`.
- Efek pasca-commit (cache invalidate, publish notifikasi) tidak boleh mengubah hasil.

## Donasi — `src/services/donations.service.ts`
- `createDonation(DonationInput, {idempotencyKey?})` → donation PENDING (nominal & status campaign divalidasi ulang dari DB).
- `createPaymentForDonation(code, {provider, channelCode})` → `PaymentView`; satu attempt aktif per donasi; nominal dari DB.
- `getDonationStatus(code)` → view publik tanpa PII.

## Campaign — `src/services/campaigns.service.ts`
- Fungsi murni: `getDonationBlockReason`, `resolveDonationAmount`, `canCampaignTransition`.
- `runCampaignLifecycle()` dipakai job dan `npm run jobs:run`.

## Notifikasi — `src/services/notifications.service.ts`
- `queueNotifications(tx, donation, eventKey)` (outbox, di dalam transaksi; unik `(donation, channel, event)`) → id; `publishNotificationJobs(ids)` pasca-commit.
- `dispatchNotification(logId, deps?)`; provider lewat interface `EmailProvider` / `WhatsappProvider` (bisa di-inject untuk test).

## Auth & RBAC — `src/lib/auth`
- `Permission` & `ROLE_PERMISSIONS` di `permissions.ts`. Halaman: `requirePermission(p)`; server action/route: `assertPermission(p)`.
- Role hanya dari tabel `user_roles`; bootstrap Super Admin lewat `ADMIN_EMAIL_ALLOWLIST` setelah email Google terverifikasi (`afterVerifiedLogin`).

## HTTP API (ringkas)
| Method | Path | Auth |
|---|---|---|
| POST | `/api/donations` (header `Idempotency-Key`) | guest, rate limit |
| POST | `/api/donations/{code}/payments` | guest, rate limit |
| GET | `/api/donations/{code}/status[?verify=1]` | guest, rate limit |
| POST | `/api/webhooks/midtrans`, `/api/webhooks/xendit` | signature/token provider |
| GET | `/api/receipts/{code}` | pemilik / admin `transaction:read` |
| GET | `/api/public/campaigns[/slug]`, `/api/public/news[/slug]` | publik |
| POST | `/api/internal/jobs/{notifications,expire-payments,campaign-lifecycle}` | signature QStash |
