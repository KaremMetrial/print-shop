# 03 — Implementation Plan

كل Phase تنتهي بـ **Demo + اختبارات خضراء + تحديث الوثائق**. لا تبدأ Phase قبل Exit Criteria السابقة.

```
P0 Setup ─► P1 Identity/Customers ─► P2 Catalog/Pricing ─► P3 Orders/Requests
        ─► P4 Design ─► P5 Chat/Files/Links ─► P6 Fulfillment ─► P7 Finance
        ─► P8 Actions/Search/WhatsApp ─► P9 Reports/Settings/Audit ─► P10 UAT/Launch
```
(Finance نظريًا يعتمد على Orders+Pricing فقط، فيمكن تقديمه قبل P5/P6 لو فريقين.)

## Phase 0 — Foundation & Tooling
**الهدف:** مشروع يقلع، CI شغال، RTL يعمل.
- Laravel 12 + React starter kit (Inertia, TS)، PostgreSQL، Redis، Reverb، Horizon، MinIO عبر Docker Compose/Sail.
- Pint/Larastan/ESLint/tsc/Pest/Vitest/Playwright + GitHub Actions.
- Layouts (Auth/Staff/Designer/Accountant/Customer/Link) + RTL + خط Cairo/Tajawal + Design tokens + مكونات UI الأساسية (Button, Table→Cards, Dialog, StatusBadge, Money, FileUploader).
- Base: `Money` VO، `AuditService`، `Idempotency` middleware، `Outbox`، error pages، i18n، enum→TS generator.
- **Exit:** صفحة login فاضية RTL بتعمل deploy على staging، CI أخضر.

## Phase 1 — Identity, Employees, Customers
- Guards، Roles/Permissions seeders، Policies، EmployeePolicy (anti-escalation).
- Employees CRUD + Permissions editor (before/after confirm) + audit.
- Customers CRUD + phone normalization + Platform Access + credentials + password-recovery request model.
- Profile، Top bar، Sidebar لكل دور (مبني على permissions).
- **Exit:** TC-001..019 (ما عدا pricing tier) خضراء، اختبار escalation شامل.

## Phase 2 — Catalog & Pricing
- Categories/Products/Options/Specialties، Tiers + tier prices.
- `PricingService` (pure, unit-tested heavy) + `/pricing/quote`.
- شاشات المنتجات والأسعار.
- **Exit:** TC-020..029 (جزء الدفع بعدين)، property-based tests للتقريب.

## Phase 3 — Orders & Order Requests
- Orders/Items + snapshots + numbering + state machine.
- Create Order Wizard، Orders list/details/edit، item soft-cancel، cancel dialog (بدون المالي بعد).
- Registered customer: Create Request، My Requests؛ Staff: Review (claim/accept/reject).
- **Exit:** TC-030..039، اختبار تزامن Start Review وAccept مرتين.

## Phase 4 — Design Workflow
- AssignmentService، Designer dashboard/tasks، Versions + manifest revision، Approval/Reopen، Design Management، Availability.
- (الشات يكون stub read-only هنا ويكتمل P5 — أو ادمج P4+P5 لو الفريق صغير.)
- **Exit:** TC-040..050, 055..060 (الأجزاء غير الشات).

## Phase 5 — Chat, Files, Links
- Files module (prepare/complete/preview/download, scanning hook)، Conversations/Messages + Reverb channels + reassignment revalidation.
- Voice recorder، Revision-on-message rule، chat lock.
- Order links + public layout + Item review + payment-proof upload UI (يربط P7).
- **Exit:** TC-051..054, 069, 087..089، pen-test للملفات (IDOR).

## Phase 6 — Fulfillment
- Complete Printing، Pickup/Delivery، Out for delivery، `DeliveryAutoCompletionJob` (scheduler)، Job Ticket PDF، Delivery screen، customer status pages.
- **Exit:** TC-061..070 + اختبار concurrency للإتمام.

## Phase 7 — Finance
- Payments + allocations (FIFO/targeted) + locking + idempotency، Proofs، Corrections، Refunds، Ledger/Receivables، Invoices/Receipts.
- ربط Cancel Order بالـ Refund Due، وقيد الخصم/السعر بعد الدفع.
- **Exit:** TC-071..086 + invariants test (Σ allocations = payment، Σ payouts ≤ obligation) + concurrency test (40.21).

## Phase 8 — Notifications, Actions, Search, WhatsApp
- Notifications/Actions (+ dedupe, claim, complete rules)، Password-recovery action flow.
- Global search (Postgres FTS/trigram)، Image search service + indexing job + eval harness.
- WhatsApp manual (templates, copy/open wa.me, confirm-sent) + provider adapter اختياري.
- **Exit:** TC-090..096، تقرير تقييم الصور (Top-1/5/10) على عينة المطبعة.

## Phase 9 — Reports, Settings, Audit, Ops
- Reports بتعريفات §39 + export، Settings groups + secrets، Audit UI، health/metrics، backup/restore scripts.
- **Exit:** KPI reconciliation مع Ledger، backup restore ناجح.

## Phase 10 — Hardening, UAT, Launch
- Seed بيانات حقيقية، UAT سيناريو §43.2، performance pass، security review، تدريب، runbooks، go-live checklist (ملف 05).

## Risks
| الخطر | المعالجة |
|---|---|
| PDF عربي (shaping/RTL) | spike في P0 قبل أي فاتورة |
| دقة البحث بالصورة | عزله async + eval مبكر + fallback نصي |
| سباقات مالية | locking + unique constraints + tests تزامن من P7 يوم 1 |
| Inertia + realtime stale props | `only` reloads + version token + 409 handling |
| تضخم الصلاحيات | مصفوفة permission↔route تتولد وتُختبر آليًا |
| قفل Review لموظف غائب | يظهر للإدارة؛ قرار D4 |
