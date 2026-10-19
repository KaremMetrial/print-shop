# PBMS — قواعد المشروع (إلزامية)

نظام إدارة مطبعة: Laravel 12 + Inertia + React + TypeScript + Tailwind 4 + MySQL 8.4. الواجهة **عربية RTL بالكامل**.
المرجع: `docs/project.md` (القواعد BR-001..090) · الخطة `docs/06-build-checklist.md` · المهام `docs/07-todo.md`.

## قاعدة UI الذهبية — مطابقة حرفية لتصميم pen (بدون استثناء أو تغيير)
**مصدر الحقيقة البصري هو `pendev/untitled.pen`.** المطلوب تطابق كامل: الأبعاد، الألوان، الخطوط، المسافات، ترتيب العناصر، النصوص العربية حرفيًا.

### سير العمل الإلزامي لكل شاشة
1. **حدّد الـframe** (مثل `S-022`) من `docs/10-screen-inventory.md` أو بقراءة الـpen (`get_app_state` ثم `execute`).
2. **صدّر المرجع** (PNG بمقياس 1 + HTML css) إلى `storage/ui-ref/<id>.png|html` بأداة `Export` في execute.
3. **استخرج المواصفة**: `node tools/ui-compare/spec.mjs storage/ui-ref/<id>.html [--from "اسم عقدة"]` (شجرة مضغوطة بالقيم الحرفية) و/أو `node tools/ui-compare/pen2tsx.mjs storage/ui-ref/<id>.html --name X --out resources/js/pen/gen/X.tsx` (JSX بـTailwind مطابق للقيم).
4. **ابنِ الصفحة الحقيقية** بالـprimitives في `resources/js/components/pen/` مع ربط البيانات؛ لا تخترع مكوّنًا ولا قيمة.
5. **قارن بالبكسل**: `node tools/ui-compare/compare.mjs --ref storage/ui-ref/<id>.png --path "<route>?fixture=pen" --as <email> --name <name>` — يطبع «اختلاف-المحتوى». **المقبول ≤ 4%** (خط الأساس: تصدير الـpen نفسه عن لقطة الـpen ≈ 2–5% بسبب anti-aliasing للنص). أعلى من ذلك = خطأ في التخطيط يجب إصلاحه (راجع `storage/ui-diff/<name>.diff.png` و`crop.mjs`).
6. بيانات المقارنة: في بيئة local فقط، `?fixture=pen` يحقن بيانات عينة الـpen (`app/Support/PenFixtures.php`). بيانات الإنتاج دائمًا حقيقية.

### قواعد التنفيذ
- **DOM literal (LTR)** كما في تصدير الـpen: جذر كل شاشة `dir="ltr"` بترتيب الأبناء نفسه + `text-align:right` للنص العربي. الحقول/الإدخالات تضبط `dir` حسب محاذاتها في التصميم.
- الألوان tokens فقط: `var(--ink)`, `var(--muted-foreground)` (= #64748B)، `var(--border)`، `var(--primary)`… ملاحظة: `--muted` في shadcn = #F1F5F9 وليس لون النص.
- الأيقونات: `<Icon name="lucide-name" />` من `@/pen/icon` بالاسم نفسه في الـpen. اللون عبر `color` (يُمرَّر style لا attribute).
- ما يُخفى لأسباب صلاحيات/منطق (قواعد المشروع BR-*) يُذكر صراحةً في ملخص المهمة؛ غير ذلك لا يُخفى ولا يُحذف عنصر مرسوم.
- الحالات الأخرى (Loading/Empty/Error…) من إطارات الحالات المجاورة في الـpen لنفس الشاشة.
- موبايل: إطارات `M-A*` و`M-B*` (390px) هي المرجع؛ لا ارتجال.

## لغة المشروع
- كل نص ظاهر للمستخدم بالعربي (واجهة، رسائل، إيميلات، PDF). الكود والتعليقات الإنجليزية مسموحة، لكن الأسماء المعروضة عربية.
- الأرقام المالية: `Money` (قروش، integer). ممنوع float. العملة EGP، التوقيت Africa/Cairo.

## قواعد تقنية لا تُكسر
- Backend هو المرجع: Policy + FormRequest + Action داخل معاملة. إخفاء زر في React ليس حماية.
- لا `update(['status'=>…])` خارج State Machine. الأحداث بعد الـcommit. العمليات الحرجة بـIdempotency.
- لا تعدّل `audit_logs` (append-only). لا secrets في logs أو props.
- لا ننتقل لمهمة جديدة قبل أن تنجح اختبارات السابقة. نمشي بترتيب `docs/07-todo.md`.

## تشغيل
```
docker compose up -d            # app :8000, mysql, redis, mailpit :8025
docker compose run --rm app php artisan migrate --seed
docker compose run --rm app php artisan test
npm run dev | npm run build | npx tsc --noEmit
```
حساب التجربة: `superadmin@pbms.test` / `Pbms@12345` (dev فقط).
