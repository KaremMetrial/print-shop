# 04 — Task Backlog

الصيغة: `[ ] T-<phase>.<n>` BE=Backend FE=Frontend QA DB DO=DevOps. حجم: S(≤½ يوم) M(1–2) L(3–5).
نفّذ بالترتيب داخل كل Phase. كل Task تُقفل فقط عند تحقق "Definition of Done" (ملف 05).

## Phase 0 — Foundation
- [~] T-0.1 DO: Docker Compose (php-fpm, nginx, mysql 8.4, redis, minio, mailpit, reverb) — M  (تم: mysql, redis, mailpit, app, queue, vite. ناقص: MinIO, Reverb, nginx)
- [x] T-0.2 BE: `laravel new` + React/Inertia starter + TS strict — S
- [ ] T-0.3 DO: CI (Pint, Larastan, Pest, tsc, eslint, vitest, build) — M
- [x] T-0.4 FE: RTL + Tailwind tokens + خط عربي + `<html dir=rtl lang=ar>` — S
- [ ] T-0.5 FE: مكتبة UI (Button/Input/Select/Dialog/Toast/Table→Card/StatusBadge/Money/Date/Skeleton/EmptyState) — L
- [ ] T-0.6 FE: Layouts الست + Sidebar ديناميكي من permissions — M
- [ ] T-0.7 BE: `Money` VO + casts + helper EGP — S
- [ ] T-0.8 BE: AuditService + جدول append-only + trigger يمنع UPDATE/DELETE — M
- [ ] T-0.9 BE: Idempotency middleware + جدول المفاتيح — M
- [ ] T-0.10 BE: Outbox + worker + Horizon — M
- [ ] T-0.11 BE: Enums→TS generator + error codes catalog (§33.20) + lang/ar — M
- [ ] T-0.12 BE: HandleInertiaRequests (shared props) + صفحات الأخطاء — S
- [ ] T-0.13 SPIKE: PDF عربي (mPDF vs Browsershot) + اختيار — S
- [ ] T-0.14 DO: Staging deploy + env/secrets — M

## Phase 1 — Identity & Customers
- [ ] T-1.1 DB: users, roles, permissions, role_permissions, user_permission_overrides, customers, customer_credentials, password_recovery_requests
- [ ] T-1.2 BE: guards `staff`/`customer` + login/logout + throttle + session_version — M
- [ ] T-1.3 BE: Seeders (5 أدوار + permission keys §4.2 + مصفوفة افتراضية) + SuperAdmin seeder — M
- [ ] T-1.4 BE: Policies (Employee, Customer) + منع escalation — L
- [ ] T-1.5 BE: Employees CRUD/activate/deactivate (+ kill sessions) — M
- [ ] T-1.6 FE: S-001 Staff login, S-002 Top bar, S-003 Profile — M
- [ ] T-1.7 FE: S-065/066/067 Employees + Permissions editor (before/after) — L
- [ ] T-1.8 BE: Customers CRUD + phone normalizer + duplicate check — M
- [ ] T-1.9 BE: Platform Access (enable/disable/reset, عرض الباسورد مرة واحدة) — M
- [ ] T-1.10 FE: S-022/023/024/031/032 (Customers list/editor/profile/access/activity) — L
- [ ] T-1.11 BE: Customer login + S-079 + S-080 (recovery request، بدون enumeration) — M
- [ ] T-1.12 QA: TC-001..019 + escalation matrix test + BOLA tests — L
- [ ] T-1.13 QA: توليد اختبار آلي "كل route لها permission/policy" — M

## Phase 2 — Catalog & Pricing
- [ ] T-2.1 DB: categories, products, option_groups, option_values, pricing_tiers, tier_product_prices, designer_specialties(+memberships/availability)
- [ ] T-2.2 BE: Catalog services + قيود (no negative, MOQ, active values) — M
- [ ] T-2.3 BE: `PricingService` (+Quote endpoint) — L
- [ ] T-2.4 QA: Unit/property tests للتسعير TC-020..027 — M
- [ ] T-2.5 FE: S-033/034/035 Products + Option editor — L
- [ ] T-2.6 FE: S-036/037 Tiers + preview — M
- [x] T-2.7 DECISION: D1 سياسة التقريب → تنفيذ — S — حُسم (docs/09-decisions.md)
- [ ] T-2.8 BE/FE: Designer specialties + availability admin (S-040/074 جزئي) — M

## Phase 3 — Orders & Requests
- [ ] T-3.1 DB: orders, order_items, item_assignment_history, order_requests, order_request_items, order numbering sequence
- [ ] T-3.2 BE: Order state machine + `CreateOrderAction` (txn) — L
- [ ] T-3.3 BE: UpdateOrder (payment-sensitive rules stub) + item add/edit/soft-cancel — L
- [ ] T-3.4 FE: S-010 Orders list (filters, mobile cards, preserved query) — M
- [ ] T-3.5 FE: S-011 Wizard 5 steps + price preview (من /quote) + draft — L
- [ ] T-3.6 FE: S-012/013/014/015 Order details/items/item/edit + diff dialog — L
- [ ] T-3.7 BE: OrderRequestService: submit / start-review (atomic) / patch / accept (idempotent) / reject — L
- [ ] T-3.8 FE: S-019/020/021 + Customer S-081..085 (requests/orders) — L
- [ ] T-3.9 BE: Order Activity feed (audit view) — S
- [ ] T-3.10 QA: TC-030..039 + concurrency (start-review ×2, accept ×2) — M

## Phase 4 — Design
- [ ] T-4.1 DB: design_versions, design_version_files, design_approvals (+ item.design_state)
- [ ] T-4.2 BE: AssignmentService (+ tie-breaker) + event listeners على OrderCreated — L
- [ ] T-4.3 BE: Manual assign/reassign + إلغاء وصول القديم — M
- [ ] T-4.4 BE: DesignerTaskService (start, states, workload query) — M
- [ ] T-4.5 BE: DesignVersionService (create/replace/submit, manifest_revision) — L
- [ ] T-4.6 BE: ApprovalService (approve/reopen) + all-items → IN_PRINTING + chat lock hook — L
- [ ] T-4.7 FE: S-043/044/045 Designer dashboard/task/version editor — L
- [ ] T-4.8 FE: S-046/048/049/050 Preview/approve/reopen/history — L
- [ ] T-4.9 FE: S-039/040/041/042 Design management + dialogs — L
- [ ] T-4.10 QA: TC-040..050, 056..060 + race test (approve vs file replace) — M

## Phase 5 — Chat, Files, Links
- [ ] T-5.1 DB: files, conversations, messages, message_attachments, order_links
- [ ] T-5.2 BE: Files (prepare/complete، signature check، thumbnails، PDF page previews، preview stream، download policy) — L
- [ ] T-5.3 BE: Chat (send idempotent، pagination، lock، revision rule، unread) — L
- [ ] T-5.4 BE: Reverb channels auth + revalidate على reassignment — M
- [ ] T-5.5 FE: S-047 Chat UI (voice recorder, optimistic, retry, reconnect) — L
- [ ] T-5.6 BE: OrderLinkService (generate/hash/suspend/reactivate/regenerate/close) + middleware — M
- [ ] T-5.7 FE: S-017 Links mgmt + S-086/087/088/093 Link customer pages — L
- [ ] T-5.8 FE: Design preview viewer (zoom/PDF nav) بلا تنزيل — M
- [x] T-5.9 DECISION: D2 حدود الملفات → Settings — S — حُسم (docs/09-decisions.md)
- [ ] T-5.10 QA: TC-051..054, 087..089 + IDOR/file tests + token tests — L

## Phase 6 — Fulfillment
- [ ] T-6.1 BE: CompletePrinting / OutForDelivery / Complete (idempotent) — M
- [ ] T-6.2 BE: DeliveryAutoCompletionJob + scheduler + completion_source — M
- [ ] T-6.3 BE: Job Ticket PDF — M
- [ ] T-6.4 FE: S-018, S-059 Delivery mgmt، S-089..092 customer pages — L
- [ ] T-6.5 QA: TC-061..070 + concurrency manual vs auto — M

## Phase 7 — Finance
- [ ] T-7.1 DB: payments, payment_allocations, payment_adjustments, payment_proofs, refund_obligations, refund_payouts, invoices, receipts (+ CHECK constraints)
- [ ] T-7.2 BE: PaymentService + AllocationService (lockForUpdate, FIFO, targeted) — L
- [ ] T-7.3 BE: Proof submit/confirm/reject — M
- [ ] T-7.4 BE: CorrectPayment (reversal+recalc) — L
- [ ] T-7.5 BE: Cancel Order → RefundObligation؛ RefundService payouts — L
- [ ] T-7.6 BE: price-after-payment & discount guards (BR-055/056) — M
- [ ] T-7.7 BE: Invoice/Receipt generation job + snapshots + PDF — L
- [ ] T-7.8 FE: S-009 dashboard، S-027/028/029/051/052/053/054/055/056/057/058 — L×3
- [ ] T-7.9 FE: Data Entry limited finance view (S-026/027 restricted) — M
- [ ] T-7.10 QA: TC-071..086 + invariants + concurrency 40.21/40.22 — L
- [x] T-7.11 DECISION: D7 فواتير قانونية — S — حُسم (docs/09-decisions.md)

## Phase 8 — Actions, Search, WhatsApp
- [ ] T-8.1 DB: notifications, actions (dedupe unique)
- [ ] T-8.2 BE: NotificationService + ActionService (claim/complete rules) + listeners لكل Event — L
- [ ] T-8.3 FE: S-004/005/006 + bell realtime — M
- [ ] T-8.4 BE/FE: Password recovery handling flow — M
- [ ] T-8.5 BE/FE: Global search S-062 (MySQL FULLTEXT + ngram للعربي / LIKE مفهرس على الهاتف) — M
- [ ] T-8.6 DO/BE: Image-embedding service (Python + FAISS/Qdrant) + IndexingJob + eval harness — L
- [ ] T-8.7 FE: S-063/064 camera/upload/results — M
- [ ] T-8.8 BE/FE: WhatsApp manual templates + provider adapter (flagged) + failure→Action — M
- [ ] T-8.9 QA: TC-090..096 + تقرير تقييم الصور — M

## Phase 9 — Reports, Settings, Audit, Ops
- [ ] T-9.1 BE: Report queries حسب §39 (+ تاريخ مرجعي صريح) — L
- [ ] T-9.2 FE: S-007/008 dashboards، S-060/061 reports + export — L
- [ ] T-9.3 BE/FE: Settings groups S-068..076 + secrets — L
- [ ] T-9.4 FE: S-077/078 Audit UI — M
- [ ] T-9.5 DO: Health checks, logging channels, metrics, alerts — M
- [ ] T-9.6 DO: Backups + restore drill + DR runbook — M
- [ ] T-9.7 QA: KPI reconciliation tests — M

## Phase 10 — Launch
- [ ] T-10.1 Seed حقيقي (منتجات/أسعار/موظفين/عملاء)
- [ ] T-10.2 UAT سيناريو §43.2 + لكل دور §43.9
- [ ] T-10.3 Performance pass (قوائم، بحث، شات)
- [ ] T-10.4 Security review (OWASP API, checklist §41.11)
- [ ] T-10.5 تدريب + أدلة + runbooks
- [ ] T-10.6 Go-live + مراقبة أسبوعين
