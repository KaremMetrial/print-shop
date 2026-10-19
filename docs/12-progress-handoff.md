# 12 — حالة التنفيذ وخطة المتابعة (handoff)

آخر تحديث: 2026-10-20. القاعدة: **مطابقة حرفية لـ pendev/untitled.pen** + قواعد `docs/project.md`. التفاصيل الإلزامية في `CLAUDE.md`.

## كيف نعمل (مجرَّب ومضبوط)
1. تصدير شاشة المرجع من الـpen: `mcp__pencil__execute` ← `Export([id],"png",D,{scale:1}); Export([id],"html-css",D+"/<id>.html",{includeLayerNames:true})` حيث `D=<root>/storage/ui-ref`.
2. `node tools/ui-compare/spec.mjs storage/ui-ref/<id>.html --from "Page content" --depth 12` ← شجرة مضغوطة بالقيم الحرفية (الرموز في رأس الملف).
3. بناء الصفحة بالـprimitives (`resources/js/components/pen/*`): `PenButton/Pen44/PenRowAction/PenBadge/PenStatus/PenKpi/PenCard/PenTable/PenFilterMenu/PenPagination/PenBreadcrumb/PenPageHeader` و`form.tsx` (`PenInput/PenSelect/PenTextarea/PenSection/PenSwitch`) و`customer-shell.tsx` كمثال لغلاف تبويبات.
4. بيانات المقارنة: `php artisan db:seed --class=PenFixturesSeeder` (عملاء/شرائح/سجل نشاط) أو `?fixture=pen` للقوائم (`app/Support/PenFixtures.php`). **local فقط.**
5. `node tools/ui-compare/compare.mjs --ref storage/ui-ref/<id>.png --path "<route>" --as superadmin@pbms.test --name <n>` ← اختلاف-المحتوى (**≤ 4% مقبول**، خط الأساس للتصدير نفسه 2–5%). `crop.mjs` لتكبير منطقة، `storage/ui-diff/<n>.diff.png` للفروق.
6. تحديث `tools/ui-compare/status.json` ثم `node tools/ui-compare/inventory.mjs` ← `docs/10-screen-inventory.md`.
7. كل فرق مقصود يُسجَّل في `docs/11-ui-deviations.md`.

## فخاخ تعلمناها
- `leading-normal` في Tailwind = 1.5! المطلوب CSS `normal` ⇒ `leading-[normal]`.
- `var(--muted)` = #F1F5F9 (shadcn). لون النص الرمادي في التصميم = `var(--muted-foreground)`.
- ألوان الأيقونات عبر `style.color` لا attribute (var() لا يعمل في attribute).
- الـDOM literal LTR كما في التصدير (root `dir="ltr"`, ترتيب الأبناء كما في الـpen، `text-right` للعربي).
- نص التصميم قد يحوي أخطاء نسخ (مثل «اسم العميل» في حقل بريد) → نستعمل اسم الطبقة ونسجّل الفرق.
- Pest: `RefreshDatabase` يطغى على override `afterRefreshingDatabase` ⇒ البذر في `TestCase::setUp`.
- MySQL trigger يحتاج `log_bin_trust_function_creators=1` (في compose وCI).
- Inertia testing: `config/inertia.php` page_paths = `resources/js/pages` (حرف صغير).

## ما اكتمل (backend + UI مطابق)
- الأساس: Money/Audit(append-only trigger)/Idempotency/Outbox/ErrorCode→TS/Files خاص/Reverb/CI(Pint+Larastan 6+tsc+eslint+Pest على MySQL).
- الهوية: 5 أدوار/64 صلاحية، منع التصعيد، جلسات (session_version)، دخول S-001 ✅.
- الموظفون: S-065/066/067 ✅ (+ مصممون: تخصصات/توفر).
- العملاء: S-022/023/024/031/032 ✅ (+ هاتف مطبَّع، منع تكرار، دخول المنصة بكلمة مؤقتة).
- لوحة التحكم S-007 ✅ (بيانات حقيقية = أصفار حتى ربط الوحدات).
- الاختبارات: 127 ناجحًا. PHPStan/Pint/tsc/eslint نظيفة.

- المنتجات والتسعير (Flow 03): S-033/034(×5)/035/036 ✅ (+ S-065/067/031 مفتوحة strict — انظر 11-ui-deviations).
- الأوردرات: migrations+State machine+CreateOrder (idempotent) ✅ · S-011-01..05 (معالج الإنشاء) ✅ · S-012 (6 تبويبات) + S-013 ✅ · S-010 (بدون frame في الـpen) · الاختبارات: 148 ناجحًا.
- ملاحظة: `PenFixturesSeeder` أصبح idempotent (upsert، لا حذف من audit_logs)؛ أوردر ORD-0152 (id 152) للمقارنة.
- تذكير: الـpen يرسم S-011-01 بشريط جانبي مسطح و248px للخطوات 2–5 (انظر deviations).

## تحديث (دورة الإغلاق) — 245 اختبار Pest + 5 Vitest
- أُضيف: شات البند (polling كل 4ث + قناة Reverb جاهزة، idempotent، قفل BR-027/035، قراءة فقط للإدخال BR-070، رسالة العميل أثناء الاعتماد = طلب تعديل BR-024).
- إضافة بند / إلغاء بند Soft (قبل الطباعة فقط، سبب إلزامي، إعادة تسعير، بدء الطباعة تلقائيًا إن اكتملت الموافقات).
- S-014 تفاصيل البند للموظف (5 تبويبات + تغيير المصمم) · S-018 بطاقة التشغيل + PDF عربي (mPDF).
- S-029 تفاصيل الدفعة + إيصال + PDF · S-052 إثباتات الدفع (رفع من الرابط/البوابة، طابور ومراجعة، الاعتماد يسجّل Payment فعليًا).
- Vitest (money، ChatPanel: إعادة المحاولة بنفس client_id وقفل المحادثة) + خطوة CI.
- انحرافات جديدة عن الـpen: زر «إلغاء البند» في بطاقة البند (غير مرسوم)، مراجعة الإثبات S-052-02 كنافذة داخل الطابور بدل صفحة، تبويبات S-014 الملفات = فارغة حتى ربط ملفات العميل بالبند.
- المتبقي: دفتر العميل S-025..030، فواتير S-056/057/094 (قرار D7)، لوحة المحاسب S-009، بحث الصور S-063/064، إطارات الموبايل M-A*/M-B*، حوار الخصم S-038، النسخ الاحتياطي/Horizon، UAT.

## الخطوة التالية بالترتيب
0. (الآن) الأوردرات: S-014 تفاصيل البند، S-015 تعديل الأوردر (حوار الفروق)، S-016 الإلغاء، S-017 رابط الأوردر، S-018 بطاقة التشغيل، S-038 حوار الخصم.
1. المنتجات والتسعير (Flow 03): S-033، S-034 (5 تبويبات)، S-035، S-036، S-037-A/B، S-038 — frames: hxHrw, PuR7a/UZ6XL/Fn6Qe/WCn4U/uJOy3, xE9uj, d50eC, qj4Bx, rYnLi. جداول: categories/products/option groups+values/tier prices/product specialty. `PricingService` + `/pricing/quote`.
2. الأوردرات (Flow 04-A/04): S-010، S-011-01..05، S-012 (6 تبويبات)، S-013، S-014-01..05، S-015، S-016، S-017، S-018.
3. طلبات الأوردرات (Flow 05) + بوابة العميل (07-A) + التصميم (06) + رابط العميل (07-B) + التنفيذ + المالية + الإشعارات/البحث + التقارير + الإعدادات.
4. شاشات الموظف المتبقية من Flow 01: S-003 الملف الشخصي، S-004 الإشعارات، S-005 مركز الإجراءات، S-006 سجل الإجراءات (تُبنى مع Phase 8).
5. جرد الشاشات والحالات في `docs/10-screen-inventory.md` (163 مُصدَّرة؛ شاشات الإعدادات S-068..076 وS-010/016/038/058 تُصدَّر عند الوصول).

## أوامر
```
docker compose up -d            # app :8000, mysql, redis, reverb, mailpit
docker compose run --rm app php artisan migrate --seed
docker compose run --rm app php artisan db:seed --class=PenFixturesSeeder
docker compose run --rm app sh -c "vendor/bin/pint && vendor/bin/phpstan analyse --memory-limit=1G && php artisan test"
npx tsc --noEmit && npm run lint && npm run build
```
حسابات التجربة (dev): superadmin/admin/dataentry/designer/accountant @pbms.test — كلمة المرور `Pbms@12345`.
