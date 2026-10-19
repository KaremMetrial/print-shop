# 05 — Checklists

## 1. Definition of Done — Task/Feature
- [ ] **مطابقة UI:** الشاشة/المكوّن مطابق لـframe الـpen المحدد (لقطة مقارنة) + tokens فقط + لا مكوّن مخترع (القاعدة في CLAUDE.md)
- [ ] Business rule مطبّقة وتطابق BR/REQ المرتبطين
- [ ] Migration + constraints (FK, CHECK, UNIQUE) وليس منطق PHP فقط
- [ ] FormRequest validation + Policy + اختبار 403
- [ ] Action في Transaction؛ locking/idempotency لو مالي أو حالة
- [ ] Audit event (من/متى/قديم/جديد/سبب) للعمليات الحساسة
- [ ] Events بعد commit؛ listeners idempotent
- [ ] Inertia page: Loading/Empty/Error/Success/Forbidden/Stale
- [ ] Desktop + Mobile + RTL + Keyboard/Focus
- [ ] رسائل خطأ عربية بكود ثابت
- [ ] Pest tests (unit + feature) + Vitest/Playwright للتدفق المهم
- [ ] Pint + Larastan + tsc + eslint أخضر
- [ ] الوثائق/OpenAPI/ملاحظات محدثة

## 2. Screen Handoff (Appendix C) — لكل شاشة
- [ ] Screen ID/Name/Persona/Goal/Entry points
- [ ] Visible/Required/Optional fields + defaults
- [ ] Primary/Secondary/Conditional actions
- [ ] Permission rules (ظهور + تعطيل بسبب الحالة)
- [ ] Validation + Confirmation dialogs
- [ ] 6 states + Mobile/Desktop
- [ ] Props contract (Inertia) + endpoints الجانبية
- [ ] State-transition effects + audit + acceptance criteria

## 3. Endpoint/Action Checklist (Appendix D)
- [ ] Route + method + guard + permission
- [ ] Object-level rule (ملكية/تعيين/نطاق)
- [ ] Request/Response (Resource per role)
- [ ] Preconditions + state change + transaction
- [ ] Idempotency + concurrency behavior
- [ ] Audit + events + jobs
- [ ] Error codes
- [ ] Unit + integration tests

## 4. Non-Negotiable Invariants (اختبارات آلية دائمة)
- [ ] لا طباعة قبل اعتماد كل البنود النشطة (BR-030)
- [ ] Version معتمدة immutable (BR-021/088)
- [ ] Σ allocations(payment) = payment.amount؛ لا over-allocation
- [ ] Σ refund payouts ≤ obligation
- [ ] Paid ≤ Grand Total دائمًا (BR-056)
- [ ] Grand Total يُحسب بالسيرفر فقط
- [ ] أوردر Completed/Cancelled: لا تعديل تشغيلي + الرابط مغلق
- [ ] Admin لا ينشئ/يعدّل Admin أو نفسه (BR-072)
- [ ] Designer لا يرى أسعار ولا بنود غيره (BR-071)
- [ ] Data Entry لا يرسل في شات التصميم ولا يعدّل دفعة (BR-053/070)
- [ ] Audit لا يقبل UPDATE/DELETE
- [ ] فشل WhatsApp/Image-index/PDF لا يُفشل الأوردر (BR-089)
- [ ] قراءة Notification لا تُغلق Action (BR-066)

## 5. Security Checklist (§41.11)
- [ ] BOLA: اختبار كل resource عبر دور/مستخدم آخر
- [ ] Escalation في payload (role/permissions مُتجاهلة)
- [ ] File IDOR + لا public keys + signed/streamed فقط
- [ ] MIME + signature + size + count backend
- [ ] Link token: hash، rate limit، noindex، no-referrer، revoke على regenerate/close
- [ ] Rate limits: staff login، customer login، link access، recovery
- [ ] Sessions: HttpOnly/Secure/SameSite + CSRF (Inertia) + rotation
- [ ] لا secrets/passwords/tokens في logs أو props أو audit
- [ ] Reverb channels auth + إعادة تحقق عند reassign
- [ ] Idempotency على: create order, accept, approve, payment, refund, complete
- [ ] Dependency audit (composer/npm)

## 6. Per-Phase Exit Checklist
- [ ] كل Tasks المرحلة مغلقة
- [ ] TC المحددة خضراء (ملف 03)
- [ ] CI أخضر + تغطية للمنطق الحرج (pricing/finance/state) ≥ 90%
- [ ] Demo للمالك + ملاحظات مسجلة
- [ ] Deploy على staging + smoke
- [ ] وثائق محدثة + القرارات المفتوحة المتعلقة محسومة

## 7. Pre-Launch (Phase 10)
- [ ] قرارات Appendix E (18 بندًا) محسومة ومسجلة
- [ ] Backup يومي شغال + **restore تم تجربته**
- [ ] Queue workers/Horizon/Scheduler/Reverb تحت supervisor
- [ ] Monitoring + alerts (errors, queue backlog, failed jobs)
- [ ] طباعة فعلية: فاتورة، إيصال، Job Ticket (A4/حراري إن لزم)
- [ ] UAT موقّع من كل دور (Admin, Data Entry, Designer, Accountant, Customer)
- [ ] بيانات حقيقية: منتجات/أسعار/فئات/موظفين/تخصصات
- [ ] تقييم البحث بالصورة مقبول
- [ ] تدريب + دليل مستخدم + runbook تشغيل/استرجاع
- [ ] Rollback plan + نسخة قبل أول migration إنتاج
- [ ] مراجعة التقارير المالية مقابل Ledger يدويًا لعينة

## 8. UAT Scenarios
- [ ] §43.2 End-to-end (عميل → أوردر → تصميم → اعتماد → طباعة → استلام → إغلاق الرابط)
- [ ] Order Request كامل (قبول + رفض + تزامن)
- [ ] تصميم: تعديل، نسخة جديدة، reassign، reopen
- [ ] دفعة targeted + general + overpayment مرفوضة + تصحيح
- [ ] إلغاء بعد دفعة + refund جزئي ثم كامل
- [ ] Delivery تلقائي بعد 24h
- [ ] بحث بصورة من الموبايل
- [ ] انقطاع نت أثناء الشات + retry
- [ ] موظف معطّل أثناء جلسة
