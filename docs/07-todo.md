# 07 — To-Do بالترتيب (نمشي عليه من فوق لتحت)

> هذه خطة تنفيذ أولية. حالة المشروع الحالية والمهام المفتوحة موثقة في `docs/12-progress-handoff.md`؛ لا تعتمد مربعات الخطة وحدها لتحديد ما اكتمل.

القاعدة: **مهمة واحدة شغالة**، ما ننتقل للي بعدها قبل ما اختبارها يخضر. التواريخ من [PBMS-schedule.xlsx](PBMS-schedule.xlsx).
المراجع: التفاصيل في [04-tasks.md](04-tasks.md) · الفلو في [06-build-checklist.md](06-build-checklist.md) · القواعد في [project.md](project.md).

## حساب التجربة (Seeder ثابت)
| | |
|---|---|
| البريد | `superadmin@pbms.test` |
| كلمة المرور | `Pbms@12345` |
| الرابط | http://localhost:8000/login |
| التشغيل | `docker compose run --rm app php artisan db:seed` (آمن للتكرار، يتجاهل الإنتاج) |

الملف: `database/seeders/FixedUsersSeeder.php`. مُتحقَّق: الدخول → 302 → `/dashboard` 200. بعد Phase 1 نضيف باقي الأدوار (Admin, Data Entry, Designer, Accountant) بنفس الباسورد.

## قاعدة ثابتة لكل مهمة UI
مطابقة `pendev/untitled.pen` إلزامية (انظر [CLAUDE.md](../CLAUDE.md)): اقرأ الـframe ← استعمل المكوّن/الـtokens ← قارن لقطة قبل ما تقفل المهمة.

## ملاحظات المراجعة (docs + UI) — لازم تتعالج
- [ ] R1 الـSidebar فيه 12 رابطًا، وكلهم 404 ما عدا dashboard والإعدادات → يظهر الرابط فقط عند وجود الصفحة/الصلاحية.
- [ ] R2 جدول `users` ناقص: `role`, `status`, `phone`, `last_login_at`, `session_version` (§32.2).
- [ ] R3 صفحة Dashboard والإعدادات لسه من الـstarter (مش بتصميم الـpen).
- [x] R4 4 أخطاء TypeScript قديمة (login, reset-password, forgot-password, confirm) → إصلاح في T-0.
- [x] R5 ملف pen اتفتح ✅ ويتقرأ عبر أدوات pencil.
- [ ] R6 فلوس: `Money` موجود في JS فقط؛ ناقص PHP VO + casts.
- [ ] R7 أسماء Flows بعد 08 في الـpen غير مرقمة → نطابقها عند الوصول.
- [ ] R8 لا يوجد تسجيل ذاتي (تم حذفه) ✅ · الحسابات تُنشأ من الموظفين فقط.

---
## اليوم 1 — الأحد 18/10 — الأساس
- [x] 1.01 افتح الـpen وراجع: Sidebar/Topbar/Buttons/Fields/Badges/Table/Dialog/Alert
- [x] 1.02 طابق المكونات على التصميم: Button, Input, Select, Textarea, Checkbox, Switch, Tabs, Alert, Dialog, Badge, Table, KPI, Field, Upload, Sidebar, Topbar
- [x] 1.03 Layouts: Staff (4 أدوار بقوائم مختلفة) · Customer · Link · Auth (RTL)
- [x] 1.04 Page templates: قائمة · تفاصيل · نموذج · لوحة · عارض وثيقة (components/page/templates.tsx)
- [x] 1.05 حالات: Skeleton / Empty / Error / Forbidden / Stale (components/states.tsx)
- [x] 1.06 `Money` PHP VO + cast (BIGINT قروش) + اختبارات
- [x] 1.07 AuditService + جدول `audit_logs` + MySQL trigger يمنع UPDATE/DELETE + اختبار
- [x] 1.08 Idempotency middleware + جدول المفاتيح + اختبار
- [x] 1.09 Outbox + queue worker + اختبار تكرار الحدث
- [x] 1.10 Enums→TypeScript + أكواد الأخطاء (§33.20) + رسائلها بالعربي
- [x] 1.11 Pest + Larastan(level 6) + Pint + ESLint + tsc + GitHub Actions (MySQL)
- [x] 1.12 Reverb شغال + قناة تجريبية
- [x] 1.13 تخزين الملفات الخاص (disk local خاص + preview/download عبر controller)
- [x] 1.14 Spike PDF عربي → **mPDF** (انظر 09-decisions.md ADR-03)
- [ ] **Exit 1:** CI أخضر · الـshell مطابق للتصميم · لا أخطاء tsc

## اليوم 2 — الإثنين 19/10 — الهوية والموظفون (Flow 01)
- [x] 2.01 migration: أعمدة users (R2) + roles + permissions + role_permissions + user_permission_overrides
- [x] 2.02 Seeders: 5 أدوار + permission keys (§4.2) + مصفوفة افتراضية
- [x] 2.03 توسيع FixedUsersSeeder: Admin / Data Entry / Designer / Accountant
- [x] 2.04 Guard `staff` + throttle + إنهاء الجلسة عند التعطيل (`session_version`)
- [x] 2.05 Policies + منع التصعيد (BR-072/073) + اختبارات TC-003/004/005
- [x] 2.06 اختبار آلي: كل route لها permission/policy
- [x] 2.07 Employees CRUD + تفعيل/تعطيل + reset credentials
- [~] 2.08 FE: S-001 Login · S-002 Topbar · S-003 Profile (بتصميم الـpen) (تم S-001 وS-002؛ ناقص S-003 Profile بتصميم الـpen)
- [x] 2.09 FE: Sidebar حسب الدور/الصلاحية (حل R1)
- [x] 2.10 FE: Employees list/create/edit + Permissions editor (قبل/بعد) + Dialogs
- [~] 2.11 FE: Dashboards (هيكل) S-007/008/009 (حل R3 جزئيًا) (لوحة Admin هيكل KPI فقط؛ ناقص لوحتي Data Entry والمحاسب وربط البيانات)
- [ ] **Exit 2:** TC-001..010 خضراء · كل دور يفتح واجهته · المحظور 403

## اليوم 3 — الثلاثاء 20/10 — العملاء (Flow 02)
- [x] 3.01 migrations: customers · customer_credentials · password_recovery_requests
- [x] 3.02 تطبيع الهاتف + كشف التكرار (لا دمج آلي)
- [x] 3.03 Platform Access: enable/disable + توليد باسورد يظهر مرة واحدة
- [x] 3.04 FE: S-022 قائمة (1.8%) · S-023 نموذج (1.2%) · S-024 Profile (2.9%)
- [~] 3.05 FE: S-031 دخول المنصة (2.8%) ✅ · S-032 النشاط (3.4%) ✅ — الأوردرات/الملخص المالي/المدفوعات/الاستردادات (S-025/026/027/029/030) تُبنى مع وحداتها (مرحلة 4 و9)
- [x] 3.06 اختبارات TC-011..019
- [ ] **Exit 3:** عميل جديد + تفعيل دخوله + منع التكرار

## اليوم 4 — الأربعاء 21/10 — المنتجات والتسعير (Flow 03)
- [x] 4.00 قرار D1 (التقريب النقدي) — **قبل البدء** — حُسم (docs/09-decisions.md)
- [ ] 4.01 migrations: categories/products/option groups+values/tiers/tier prices/specialties
- [ ] 4.02 PricingService (Percentage + Fixed Base + MOQ) + `/pricing/quote`
- [ ] 4.03 اختبارات TC-020..029 + property tests
- [ ] 4.04 FE: S-033/034/035 المنتجات والخيارات
- [ ] 4.05 FE: S-036/037 الشرائح + معاينة · S-038 خصم الأوردر
- [ ] **Exit 4:** quote = UI · تعديل الكتالوج لا يمس القديم

## اليوم 5 — الخميس 22/10 — إنشاء الأوردر (Flow 04-A)
- [x] 5.01 migrations: orders · order_items · item_assignment_history + ترقيم
- [x] 5.02 State machine للأوردر (Enum + canTransitionTo)
- [x] 5.03 CreateOrderAction (معاملة + snapshots + Idempotency + Audit)
- [x] 5.04 FE: S-010 قائمة الأوردرات (فلاتر + موبايل cards)
- [x] 5.05 FE: S-011 Wizard 5 خطوات + معاينة السعر
- [x] 5.06 اختبارات: MOQ · بدون بنود · منتج غير نشط · ضغطتين
- [x] **Exit 5:** أوردر يُنشأ بسعر السيرفر

## اليوم 6 — الأحد 25/10 — تفاصيل الأوردر + طلبات الأوردرات (Flow 04 + 05)
- [~] 6.01 FE: S-012 Overview ✅ · S-013 Items ✅ · S-014 Item details (يعتمد على وحدة التصميم)
- [~] 6.02 UpdateOrder ✅ + S-015 ✅ + Audit ✅ · soft-cancel للبند + حوار الفروق (متبقٍ)
- [~] 6.03 S-016 الإلغاء ✅ (CancelOrder + حوار) · قفل الروابط عند بناء order_links
- [x] 6.04 قرار D4 (مراجعة محجوزة) قبل البدء بالطلبات — حُسم (docs/09-decisions.md)
- [ ] 6.05 order_requests + Start Review (atomic) + Accept (مرة واحدة) + Reject (سبب)
- [ ] 6.06 FE: S-019/020/021 مراجعة الطلب
- [ ] 6.07 اختبارات TC-030..039 + تزامن (claim×2, accept×2)
- [ ] **Exit 6:** قبول طلب = أوردر واحد

## اليوم 7 — الإثنين 26/10 — بوابة العميل + إسناد المصممين (Flow 05/06/07-A)
- [ ] 7.01 Guard `customer` + S-079/080 (استرجاع كلمة المرور بدون enumeration)
- [ ] 7.02 FE عميل: Dashboard · S-082 إنشاء طلب · S-083 طلباتي
- [ ] 7.03 AssignmentService (تخصص ← توفر ← أقل شغل نشط ← كاسر تعادل) على حدث OrderCreated
- [ ] 7.04 إسناد/إعادة إسناد يدوي + فقدان وصول القديم
- [ ] 7.05 Designer tasks + Start Design + workload query
- [ ] 7.06 FE: S-043/044 Designer · S-039..042 إدارة المصممين
- [ ] 7.07 اختبارات TC-040..045
- [ ] **Exit 7:** أوردر جديد → مصمم مناسب تلقائيًا (أو Action لو مفيش)

## اليوم 8 — الثلاثاء 27/10 — التصميم والاعتماد (Flow 06)
- [x] 8.00 قرار D2 (حدود الملفات/الصوت) — حُسم (docs/09-decisions.md)
- [ ] 8.01 Files: prepare/complete + MIME/signature/size + preview بلا تنزيل
- [ ] 8.02 design_versions + files + manifest revision + Submit
- [ ] 8.03 ApprovalService (stale check) + Reopen (Admin/SA قبل الطباعة)
- [ ] 8.04 انتقال In Printing عند اعتماد الكل (معاملة واحدة)
- [ ] 8.05 FE: S-045 Version editor · S-046 Preview · S-048 Approve · S-049 Reopen · S-050 History
- [ ] 8.06 اختبارات TC-046..060 + سباق (اعتماد vs استبدال ملف) + IDOR
- [ ] **Exit 8:** New→Approved، وآخر بند يفتح الطباعة

## اليوم 9 — الأربعاء 28/10 — الشات + رابط العميل (Flow 06/07-B)
- [ ] 9.01 Chat: send idempotent (client_message_id) + قفل + Revision-by-message
- [ ] 9.02 Reverb channels + إعادة التحقق عند reassign
- [ ] 9.03 FE: S-047 Chat (صوت/مرفقات/retry/reconnect)
- [ ] 9.04 order_links (token hash) + suspend/reactivate/regenerate/close + middleware
- [ ] 9.05 FE: S-017 + S-086/087/088/093
- [ ] 9.06 FE مسجل: S-084 My Orders · S-085 Order details
- [ ] 9.07 اختبارات TC-051..054, 069, 087..089
- [ ] **Exit 9:** عميل بلا حساب يراجع ويعتمد · رابط مغلق لا يكشف شيء

## اليوم 10 — الخميس 29/10 — الطباعة والتسليم
- [ ] 10.01 Complete Printing / Pickup / Out for Delivery / Complete (idempotent)
- [ ] 10.02 Job الإتمام التلقائي بعد 24h + completion_source
- [ ] 10.03 Job Ticket PDF (S-018)
- [ ] 10.04 FE: S-059 Delivery + حوارات الانتقال + صفحات العميل S-089..092
- [ ] 10.05 اختبارات TC-061..070 + تزامن manual vs auto
- [ ] **Exit 10:** دورة كاملة حتى Completed وإغلاق الرابط (§43.2)

## اليوم 11 — الأحد 1/11 — المالية (Backend)
- [x] 11.00 قرار D7: فاتورة داخلية غير ضريبية (حُسم 2026-10-23)
- [ ] 11.01 migrations: payments · allocations · adjustments · proofs · refund_obligations · payouts · invoices · receipts (+CHECK)
- [ ] 11.02 PaymentService + Allocation (Targeted/FIFO + lockForUpdate) + منع Overpayment
- [ ] 11.03 Payment proofs (confirm/reject)
- [ ] 11.04 Corrections (adjustments + إعادة تخصيص)
- [ ] 11.05 Cancel → Refund Due → Payouts جزئية
- [ ] 11.06 قيود السعر/الخصم بعد أول دفعة (BR-055/056)
- [ ] 11.07 اختبارات TC-071..086 + invariants + تزامن 40.21/40.22
- [ ] **Exit 11:** Σallocations = payment · Σpayouts ≤ obligation

## اليوم 12 — الإثنين 2/11 — المالية (واجهات) + الإشعارات والبحث
- [ ] 12.01 FE: S-051..058 + S-028/029 + Ledger/Receivables/Refunds
- [ ] 12.02 FE: عرض Data Entry المحدود (S-026/027)
- [ ] 12.03 Receipts PDF عربي — فواتير S-056/057/094 لها واجهات وPDF داخلي غير ضريبي
- [ ] 12.04 notifications + actions (dedupe, claim, complete) + listeners
- [ ] 12.05 FE: S-004/005/006 · Bell realtime
- [ ] 12.06 Global Search S-062 (MySQL FULLTEXT ngram + فهارس)
- [ ] **Exit 12:** دفعة→تخصيص→إيصال · Action لا تُقفل بالقراءة

## اليوم 13 — الثلاثاء 3/11 — لوحات + إعدادات + تحصين + نشر
- [ ] 13.01 ربط Dashboards بـKPI (§39) + تقارير أساسية
- [ ] 13.02 إعدادات أساسية (عام/أوردرات/دفع/ملفات) + Audit UI S-077/078
- [ ] 13.03 اختبارات أمان §41.11 + E2E الرحلة الكاملة §43.2
- [ ] 13.04 Seed بيانات واقعية + نشر staging + backup
- [ ] 13.05 UAT سريع لكل دور
- [ ] **Exit 13:** MVP جاهز للتجربة الداخلية

---
## بعد الـMVP (أسبوع رابع)
- [ ] S.1 البحث بالصورة (Python + FAISS/Qdrant + تقييم Top-1/5/10) — قرار D6 وعينة المطبعة
- [ ] S.2 WhatsApp: قوالب يدوية ثم مزود تلقائي (D3)
- [ ] S.3 تقارير متقدمة + تصدير + Horizon/metrics
- [ ] S.4 تجربة Restore + سياسة الاحتفاظ (D5) + تحسين الأداء
- [ ] S.5 UAT ببيانات حقيقية + تدريب + Go-live
