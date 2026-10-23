# 06 — Checklist ترتيب التنفيذ + الفلو اللي هنمشي عليه

الأساس: تصميم [pendev/untitled.pen](../pendev/untitled.pen) (الـFlows) + [project.md](project.md) + الخطة ([03](03-implementation-plan.md)) والمهام ([04](04-tasks.md)).
الترتيب هنا = ترتيب البناء الفعلي حسب **الاعتماديات**، مش بالضرورة ترتيب أرقام الـFlows في الـdesign.
> أسماء الـFlows مأخوذة من frames الـpen. Flows اللي بعد 08 في الملف مش مرقمة بوضوح، فسمّيتها بمحتواها؛ طابقها مع الملف لما نوصل لها.

**قاعدة كل Flow:** Backend (migration → Action → Policy → test) ← بعدها Frontend (من الـframe) ← بعدها E2E ← بعدها ✅. لا ننتقل لـFlow قبل ما اختباراته خضراء.

## الفلو العام (الرحلة اللي النظام بيخدمها)
```
موظف يدخل → يسجل عميل → يعمل أوردر (أو يراجع طلب عميل مسجل)
→ توزيع تلقائي للمصمم → تصميم/نسخ/شات → العميل يعتمد كل بند
→ (كل البنود معتمدة) طباعة → جاهز → استلام/توصيل → Completed → الرابط يتقفل
↳ بالتوازي: دفعات/FIFO/إثباتات/إلغاء/استرداد + إشعارات وإجراءات + تقارير
```

---

## المرحلة 0 — الأساس  ✅/⏳
- [x] Laravel 12 + React + Inertia + TS + Tailwind 4
- [x] Docker: MySQL 8.4, Redis, Mailpit, queue, vite
- [x] RTL + عربي كامل + tokens من التصميم + خطوط
- [x] ترجمة Laravel للعربي (`lang/ar`)
- [x] Sidebar عربي (يمين) + StatusBadge + Money (JS)
- [ ] مطابقة المكونات الأساسية على frames الـpen: `Sidebar / V3`, `Topbar / V3`, Buttons, Fields V2, Badges, Table Orders V2, Dialog, Alert, Upload, Tabs, Breadcrumb
- [ ] Page templates (قائمة / تفاصيل / نموذج / لوحة / عارض وثيقة) كـ React layouts
- [ ] Loading skeleton + Empty + Error + Forbidden + Stale states
- [ ] `Money` PHP VO + casts (قروش)
- [ ] AuditService + trigger append-only (MySQL)
- [ ] Idempotency middleware
- [ ] Outbox + queue worker
- [ ] Enums → TypeScript + أكواد الأخطاء (§33.20) + رسائل عربي
- [ ] Pest + Larastan + Pint + ESLint + tsc (إصلاح أخطاء الـstarter الأربعة) + CI
- [ ] Reverb (realtime) + Horizon
- [ ] Spike: PDF عربي (mPDF vs Browsershot)
- [ ] تخزين الملفات الخاص (local ثم S3)

## المرحلة 1 — FLOW 01: دخول الموظف والمساحة اليومية  + إدارة الموظفين
**الفريم:** `FLOW 01 — Staff Entry & Daily Workspace` + `Employees (Create / Edit / Permissions / Dialogs / States)` + `V3 Canonical navigation`
- [ ] BE: جداول users/roles/permissions/overrides + seeders (5 أدوار + permission keys)
- [ ] BE: guard `staff` (Email+Password) + throttle + إنهاء الجلسة عند التعطيل
- [ ] BE: Policies + منع تصعيد Admin (BR-072/073) + اختبارات
- [ ] BE: Employees CRUD + تفعيل/تعطيل + إعادة تعيين بيانات الدخول
- [ ] FE: S-001 Staff Login · S-002 Top bar · S-003 Profile
- [ ] FE: Sidebar لكل دور (Admin/SA، Data Entry، Designer، Accountant) من الصلاحيات
- [ ] FE: Employees list + Create + Edit + Permissions editor (قبل/بعد) + Dialogs
- [ ] FE: Dashboards (هيكل فقط الآن): S-007 Admin · S-008 Data Entry · S-009 Accountant
- [ ] اختبارات: TC-001..010 + مصفوفة route↔permission آلية
- [ ] **Exit:** تسجيل دخول كل دور يفتح واجهته، والمحظور بيرجع 403

## المرحلة 2 — FLOW 02: إدارة العملاء
**الفريم:** `FLOW 02 — Customer Management` (Customer journey rows 01..04)
- [ ] BE: customers + تطبيع الهاتف + كشف التكرار + customer_credentials + password_recovery_requests
- [ ] BE: Platform Access (تفعيل/تعطيل/توليد باسورد يظهر مرة واحدة)
- [ ] FE: S-022 قائمة العملاء · S-023 إضافة/تعديل · S-024 Profile
- [ ] FE: تبويبات: الأوردرات · الملخص المالي (محدود لـData Entry) · الدفعات · الاستردادات · Platform Access (S-031) · النشاط (S-032)
- [ ] اختبارات: TC-011..019
- [ ] **Exit:** إنشاء عميل + تفعيل دخوله + منع التكرار

## المرحلة 3 — FLOW 03: المنتجات والتسعير
**الفريم:** `FLOW 03 — Products & Pricing` + `شرائح الأسعار والخصومات`
- [ ] BE: categories / products / option groups+values / tiers / tier prices / specialties
- [ ] BE: `PricingService` (Percentage + Fixed Base + MOQ + تقريب) + `/pricing/quote`
- [ ] FE: S-033 المنتجات · S-034 Product Editor (5 تبويبات) · S-035 Option groups
- [ ] FE: S-036 Tiers · S-037 Tier editor + معاينة · S-038 Order discount dialog
- [ ] اختبارات: TC-020..029 + property tests
- [x] **قرار D1** (التقريب) قبل البدء — حُسم (docs/09-decisions.md)
- [ ] **Exit:** نفس السعر من الـquote والـUI، وتعديل الكتالوج لا يمس القديم

## المرحلة 4 — FLOW 04-A + FLOW 04: إنشاء الأوردر وتفاصيله
**الفريم:** `FLOW 04-A — Create New Order` (+ حالات التسعير والتسليم) · `FLOW 04 — Order Details` (row 01/02، تفاصيل البند وتعديل الأوردر، الإلغاء والروابط وبطاقة التشغيل)
- [ ] BE: orders / order_items / numbering / state machine / CreateOrder (معاملة + snapshots)
- [ ] BE: تعديل الأوردر قبل الطباعة + إلغاء/تعديل البند (soft) + قواعد السعر بعد الدفع (stub مالي)
- [ ] FE: S-010 قائمة الأوردرات (فلاتر + موبايل cards)
- [ ] FE: S-011 Wizard 5 خطوات (عميل → بنود → تسعير → توصيل/ETA → مراجعة)
- [ ] FE: S-012 Overview · S-013 Items · S-014 Item details · S-015 Edit (diff dialog) · S-016 Cancel dialog
- [ ] FE: Activity log من الـAudit
- [ ] اختبارات: إنشاء، MOQ، بدون بنود، منتج غير نشط، Idempotency
- [ ] **Exit:** أوردر كامل يتسجل بسعر السيرفر ويظهر تفاصيله

## المرحلة 5 — FLOW 05: طلبات الأوردرات والمراجعة (الجانبين)
**الفريم:** `تعريف مراجعة طلبات الأوردرات` · `شاشات مراجعة الطلبات` · `تفرع قرار المراجعة` · `نتائج المراجعة البديلة` · `حالات قائمة الطلبات وبدء المراجعة` · `حالات قرار مراجعة الطلب` + **FLOW 07-A** (جزء الطلب)
- [ ] BE: guard `customer` (موبايل+باسورد) + S-079/S-080 (استرجاع كلمة المرور)
- [ ] BE: order_requests + Start Review (atomic claim) + Accept (مرة واحدة) + Reject (سبب)
- [ ] FE (عميل): Dashboard · إنشاء طلب S-082 · طلباتي S-083
- [ ] FE (موظف): S-019 القائمة · S-020 المراجعة · S-021 السجل
- [ ] اختبارات: TC-030..039 + تزامن (claim ×2 / accept ×2)
- [x] **قرار D4** (مراجعة محجوزة لموظف غائب) — حُسم (docs/09-decisions.md)
- [ ] **Exit:** طلب عميل → قبول → أوردر حقيقي بدون تكرار

## المرحلة 6 — FLOW 06: المصممون والتصميم والاعتماد
**الفريم:** `A — إدارة المصممين` · `B — مساحة عمل المصمم` · `C — مراجعة التصميم من العميل` · `D — سجل الاعتماد وإعادة الفتح الإداري`
- [ ] BE: AssignmentService (تخصص ← توفر ← أقل شغل نشط ← كاسر تعادل) + إسناد يدوي + سجل
- [ ] BE: Designer tasks + Start Design + Versions (manifest revision) + Submit
- [ ] BE: Approval (stale check) + Reopen (Admin/SA، قبل الطباعة) + الانتقال لـIn Printing
- [ ] BE: Files (prepare/complete، MIME/signature، preview بدون تنزيل)
- [ ] BE: Chat (idempotent، قفل، Revision-by-message) + Reverb channels
- [ ] FE (إدارة): S-039 نظرة عامة · S-040 المصممون · S-041 تفاصيل · S-042 إسناد
- [ ] FE (مصمم): S-043 Dashboard · S-044 Task · S-045 Version editor
- [ ] FE (مشترك): S-046 Preview (zoom/PDF) · S-047 Chat (صوت/مرفقات/retry) · S-048 Approve · S-049 Reopen · S-050 History
- [ ] اختبارات: TC-040..060 + سباق (اعتماد مقابل استبدال ملف) + IDOR للملفات
- [x] **قرار D2** (حدود الملفات/الصوت) — حُسم (docs/09-decisions.md)
- [ ] **Exit:** بند ينتقل New → In Progress → Awaiting → Approved، وآخر بند يحوّل الأوردر للطباعة

## المرحلة 7 — FLOW 07-B: العميل عبر رابط الأوردر  (+ 07-A باقي بوابة العميل)
**الفريم:** `FLOW 07-B — Link-Based Customer` · `FLOW 07-A — Registered Customer`
- [ ] BE: order_links (token hash) + suspend/reactivate/regenerate/close + middleware (rate limit، noindex، no-referrer)
- [ ] FE: S-017 إدارة الرابط (موظف)
- [ ] FE: S-086 مرحلة التصميم · S-087 مراجعة البند · S-088 تأكيد الاعتماد · S-093 رابط مغلق
- [ ] FE (مسجل): My Orders S-084 · Order details S-085 · الإشعارات · Profile · الفاتورة S-094
- [ ] اختبارات: TC-069/070/087..089 + token tests
- [ ] **Exit:** عميل بدون حساب يراجع ويعتمد، ورابط قديم/مغلق لا يكشف شيء

## المرحلة 8 — التنفيذ: الطباعة والاستلام والتوصيل
**الفريم:** `قوائم التنفيذ RTL` · `حالات التسليم اللاحقة` · `حوارات انتقال الحالة` · `حالات التشغيل المجاورة` · `Shared operations controls`
- [ ] BE: Complete Printing · Pickup · Out for Delivery · Complete (idempotent) · Job `DeliveryAutoCompletion` (24h)
- [ ] BE: Job Ticket PDF (S-018)
- [ ] FE: S-059 Delivery (4 تبويبات) + حوارات الانتقال
- [ ] FE: صفحات العميل S-089..092 (طباعة / جاهز / خرج للتوصيل)
- [ ] اختبارات: TC-061..070 + تزامن manual vs auto
- [ ] **Exit:** دورة الأوردر كاملة حتى Completed وإغلاق الرابط (§43.2)

## المرحلة 9 — FLOW 08: الحسابات والمدفوعات
**الفريم:** `A/B — Desktop/Mobile/States/Alternative` · `01..06 اليومية/الإثباتات/المراجعة` · `Task 41 (Receipts & dialogs)` · `10 / التصحيحات المالية` · `11 / الوثائق المالية` · `12 / التقارير المالية`
- [ ] BE: payments + allocations (Targeted / FIFO + lock) + منع Overpayment + Idempotency
- [ ] BE: Payment proofs (confirm/reject) · Corrections (adjustments) · Cancel → Refund Due → Payouts
- [ ] BE: ربط قيود السعر/الخصم بعد الدفع (BR-055/056)
- [ ] BE: Invoices + Receipts (PDF عربي) + Ledger + Receivables
- [ ] FE: S-051 المدفوعات · S-052 مراجعة الإثبات · S-053 Ledger · S-054 Receivables
- [ ] FE: S-055 Refunds · S-056 Refund dialog · S-057 Invoice · S-058 Correction · Record Payment S-028 · Details S-029
- [ ] FE: عرض Data Entry المحدود (S-026/027)
- [ ] اختبارات: TC-071..086 + invariants + تزامن (دفعتان 40.21)
- [x] **قرار D7** (فواتير قانونية) — حُسم (docs/09-decisions.md)
- [ ] **Exit:** أرقام Ledger = مجموع التخصيصات، ولا تضاعف مع retry

## المرحلة 10 — الإشعارات والإجراءات والبحث
**الفريم:** `Search (Desktop/mobile/overlays, states, handoff)` · `B — Search by Image` · مركز الإجراءات (S-004..006)
- [ ] BE: notifications + actions (dedupe، claim، complete بفعل حقيقي) + listeners لكل Event
- [ ] BE: استرجاع كلمة مرور العميل كـAction
- [ ] BE: Global Search (رقم أوردر/بند/اسم/هاتف) بصلاحيات
- [ ] BE: خدمة الصور (Python + FAISS/Qdrant) + Indexing job + تقييم Top-1/5/10
- [ ] BE: WhatsApp يدوي (قوالب + تأكيد الإرسال) + مزود اختياري
- [ ] FE: S-004 الإشعارات · S-005 مركز الإجراءات · S-006 السجل
- [ ] FE: S-062 بحث عام · S-063 بحث بالصورة · S-064 تفاصيل النتيجة
- [ ] اختبارات: TC-090..096
- [x] **قرارات D3, D6** — حُسم (docs/09-decisions.md)
- [ ] **Exit:** Action لا تقفل بالقراءة، وفشل الصور/واتساب لا يعطل التشغيل

## المرحلة 11 — لوحات المتابعة والتقارير
**الفريم:** `Dashboard and contextual details` · `Report content variants` · `Known snapshot examples` · `Contextual table templates` · `Operational reporting states` · `Searchable filter and export scope states`
- [ ] BE: KPIs بتعريفات §39 (تاريخ مرجعي صريح)
- [ ] FE: ربط S-007/008/009 بالبيانات الحقيقية (KPI → قائمة مفلترة)
- [ ] FE: S-060 تقارير تشغيلية · S-061 مالية + تصدير PDF/CSV
- [ ] اختبارات: مطابقة الأرقام مع Ledger/الأوردرات
- [ ] **Exit:** كل KPI له تعريف واضح وبيطابق القوائم

## المرحلة 12 — الإعدادات والتدقيق والتشغيل
**الفريم:** `Settings workspace / screens rows 1-3 / dialogs & responsive` · `Audit logs`
- [ ] BE/FE: S-068..076 (عام، أوردرات، واتساب، دفع، ملفات، مصممون، فواتير، أمان) + أسرار مخفية
- [ ] FE: S-077/078 Audit
- [ ] DevOps: health، logs، alerts، backup يومي + **تجربة restore**
- [x] **قرار D5** (احتفاظ/نسخ) — حُسم (docs/09-decisions.md)
- [ ] **Exit:** تغيير إعداد لا يعيد تسعير تاريخي، وكله متسجل في Audit

## المرحلة 13 — UAT والإطلاق
- [ ] بيانات حقيقية (منتجات/أسعار/موظفين/تخصصات)
- [ ] UAT §43.2 + لكل دور §43.9 (مراجع في [05-checklists.md](05-checklists.md))
- [ ] أداء + أمان (§41.11) + طباعة فعلية للفاتورة/الإيصال/التذكرة
- [ ] تدريب + runbooks + rollback
- [ ] Go-live + مراقبة أسبوعين

---
## جدول سريع: الاعتماديات
| لا تبدأ | قبل ما يخلص |
|---|---|
| Customers | Auth + Employees |
| Orders | Customers + Pricing |
| Order Requests | Orders + Customer guard |
| Design | Orders (OrderCreated event) |
| Link Customer | Design + Files + Chat |
| Fulfillment | Approval (All-approved) |
| Finance (كامل) | Orders + Pricing (Cancel يحتاج Fulfillment) |
| Search by Image | Files + Design versions |
| Reports | Finance + Fulfillment |
