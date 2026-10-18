# 01 — Stack & Architecture Decisions (Laravel + Inertia + React)

المرجع: [project.md](project.md). أي تعارض → project.md هو الأعلى (BR-001..090).

## 1. Stack

| الطبقة | القرار | ملاحظة |
|---|---|---|
| Backend | Laravel 12 (PHP 8.3+) | Modular Monolith |
| Frontend | React 19 + TypeScript + **Inertia.js** | بدون API منفصل للشاشات الداخلية |
| UI | Tailwind + shadcn/ui (Radix) | RTL عبر `dir="rtl"` + logical properties |
| DB | PostgreSQL 16 | معاملات مالية + `pgvector` للبحث بالصورة |
| Queue/Cache | Redis + Laravel Horizon | Outbox + jobs |
| Realtime | Laravel Reverb + Echo | شات + إشعارات + Actions |
| Storage | S3-compatible خاص (MinIO محليًا) | لا public URLs |
| Auth | Sanctum-less: session guards | `staff` و `customer` guards منفصلين |
| RBAC | spatie/laravel-permission + Policies | + user overrides مسجلة |
| PDF | mPDF أو Browsershot | لازم يدعم Arabic shaping + RTL (اختبره مبكرًا) |
| Money | Integer minor units (قرش) + `brick/money` | ممنوع float |
| Tests | Pest + Playwright (E2E) + Vitest | |
| Image search | خدمة Python صغيرة (CLIP embeddings) + pgvector | Async عبر queue |
| Quality | Pint, Larastan (lvl 8), ESLint, Prettier, tsc strict | CI gate |

## 2. قرارات خاصة بـ Inertia (مهمة)

1. **Inertia للشاشات الداخلية والبوابات** (Staff, Designer, Accountant, Registered Customer, Link Customer). لا نبني REST منفصل لها.
2. **JSON endpoints** فقط لـ: رفع الملفات (prepare/complete)، الشات (إرسال/pagination)، `pricing/quote`، البحث بالصورة، polling خفيف. تحت `/api/v1` أو داخل web routes مع `wantsJson`.
3. **Partial reloads + `Inertia::defer`** للـ Dashboard KPIs والتبويبات الثقيلة.
4. **Realtime**: حدث Reverb → المتصفح يعمل `router.reload({ only: [...] })`. الحدث لا يثبت العملية (وثيقة §30.14).
5. **Shared props** (`HandleInertiaRequests`): user، permissions، flash، unread counts. **لا** تمرير بيانات حساسة غير لازمة.
6. **صلاحيات الحقول**: Resources/DTOs لكل دور (Designer لا يستلم أسعار أصلًا). الإخفاء في React مجرد UX.
7. **أخطاء**: 403/404/409/419/422/429/500 → صفحات Inertia عربية + toast للـ 409 (تعارض).
8. **Double submit**: `form.processing` + `Idempotency-Key` header على العمليات الحرجة (middleware).
9. **Link Customer**: routes عامة `/o/{token}` بـ middleware `ValidOrderLink` (hash lookup + rate limit + `noindex` + `Referrer-Policy: no-referrer`)، وطبقة layout مستقلة.
10. **الملفات**: ممر واحد `FileController@preview|download` يتحقق من الكيان الأب. Preview التصميم للعميل = stream عبر صور مُعالجة (watermark/resize) بدون زر تنزيل.

## 3. هيكل الباك إند (Modules)

```
app/
  Domain/
    Identity/  Employees/  Customers/  Catalog/  Pricing/
    Orders/  OrderRequests/  Design/  Chat/  Files/
    Fulfillment/ (Printing & Delivery)  Finance/ (Payments, Ledger, Refunds, Invoices)
    Notifications/ (Notifications & Actions)  Search/  ImageSearch/
    Reports/  Settings/  Audit/
  Http/Controllers/...   # رفيعة
  Http/Requests/...      # Form Requests
  Policies/...
```
داخل كل Module: `Models/ Actions/ (use-cases) Services/ Enums/ Events/ Listeners/ DTOs/ StateMachines/`.

**قواعد:**
- Controller → FormRequest → Policy → **Action class** (معاملة DB) → Event بعد الـ commit.
- State transitions في State Machine صريح (Enum + `canTransitionTo`) — لا `update(['status'=>...])` في أي مكان آخر.
- `DB::transaction` + `lockForUpdate` للدفعات/الاعتماد/Start Review.
- Outbox table لأحداث حرجة + Worker.
- `row_version` للتحكم في التزامن (409 عند التعارض).

## 4. Auth & Guards

- `staff` guard (جدول `users`): Email+Password، rate limit، إنهاء الجلسة عند التعطيل (`session_version`).
- `customer` guard (جدول `customer_credentials`): Phone+Password يولّده موظف، لا تغيير ذاتي، لا تسجيل ذاتي.
- Link Customer: بدون guard، token hash.
- Super Admin / Admin hierarchy مفروضة في Policy واحدة `EmployeePolicy` + اختبارات escalation.

## 5. Conventions
- أسماء الجداول/الأعمدة كما في §32 من project.md.
- UUID v7 أو bigint (القرار: **bigint داخليًا + ulid عام للروابط**؛ التوكن العام منفصل).
- Enums لكل الحالات (PHP backed enums ↔ TS union types مولّدة بـ `spatie/laravel-typescript-transformer`).
- كل نص واجهة في `lang/ar` (+ `resources/js/i18n`)، رسائل أخطاء بالأكواد من §33.20.
- Audit: `AuditService::record()` من داخل الـ Action، append-only (DB trigger يمنع UPDATE/DELETE).
