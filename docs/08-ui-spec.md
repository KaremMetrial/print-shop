# 08 — مواصفات UI المستخرجة من pendev/untitled.pen
(مقروءة بأدوات pencil يوم 18/10/2026. أي تعديل في الـpen يُحدَّث هنا.)

## Tokens (variables)
primary #2563EB · primary-hover #1D4ED8 · primary-soft #EFF6FF · ink #0F172A · text-secondary #475569 · muted #64748B · border #E2E8F0 · control-border #CBD5E1 · background #F8FAFC · surface #FFFFFF · surface-subtle #F1F5F9 · success #16A34A/soft #F0FDF4/text #166534 · warning #D97706/#FFFBEB/#92400E · danger #DC2626/#FEF2F2/#991B1B
خطوط: Cairo (عربي) · IBM Plex Sans (لاتيني) · Goldman (أرقام KPI) · Azeret Mono
radius: control 10 · card 14 · badge 8 · table/KPI 12 · أحجام: control-height 46 · nav-height 44 · topbar 66 · sidebar 272 / collapsed 76

## Sidebar / V3 (272px، يمين، أبيض، border #E2E8F0، padding 20×12، gap 16)
- Brand: اسم المطبعة 14/700 ink + سطر فرعي 12 muted (`PBMS · إدارة أعمال الطباعة`)
- NavItem: ارتفاع 44، radius 10، padding 0×12، gap 10؛ label 14/500 text-secondary؛ أيقونة 20 muted؛ **نشط:** خلفية primary-soft + label 600 primary + أيقونة primary
- عناوين المجموعات: 12 muted
- المجموعات والعناصر والأيقونات (lucide):
  - الرئيسية: لوحة التحكم `layout-dashboard` · مركز الإجراءات `list-checks`
  - إدارة الأوردرات: الأوردرات `clipboard-list` · طلبات الأوردرات `inbox` · العملاء `users`
  - المنتجات والتسعير: المنتجات `package` · التسعير `tags`
  - التشغيل: إدارة التصميمات `pen-tool` · الطباعة والتسليم `truck`
  - الماليات: الحسابات `wallet`
  - المتابعة: التقارير `chart-no-axes-combined` · البحث `search`
  - الإدارة والنظام: الموظفون `contact` · سجل النشاط والتدقيق `history` · الإعدادات `settings`
- Footer: بطاقة حساب (خلفية #F8FAFC، radius 10، padding 12): اسم 14 ink + الدور 12 muted + أيقونات

## Topbar / V3 (ارتفاع 66، أبيض، border، padding 0×24، gap 16)
ترتيب بصري RTL (من اليمين): Breadcrumb "مساحة العمل" 13 text-secondary ← خانة بحث (h46، #F8FAFC، stroke control-border، radius 10، placeholder "ابحث عن أوردر أو عميل...") ← (يسار) إشعارات + قائمة الحساب.
Account menu: عرض 240، radius 10، padding 8، عناصر h44: «الملف الشخصي» · «تسجيل الخروج».

## Button
ارتفاع 46، radius 10، padding 0×16، نص 14/600. Primary: خلفية primary + نص أبيض. Secondary: أبيض + border control-border + نص ink. حالات: ضغط/تحويم/غير متاح/تركيز/جارٍ الحفظ…/Danger (حذف).

## Field (V2 Text Input)
Label 13/600 text-secondary · Control: h46، fill #F8FAFC، stroke control-border، radius 10، padding 0×14، نص 14 · Helper/Error 12 (error = danger) · gap 6.

## Badge (الحالات)
radius 8، padding 4×10، gap 8، نقطة 6px + نص 12/600. (طلب جديد / قيد التصميم / قيد الطباعة / جاهز للتسليم / متأخر / ملغي / غير مدفوع / مدفوع جزئيًا / مدفوع) — خلفية soft + نص داكن + نقطة بلون الحالة.

## Table
حاوية stroke border + radius 12 · رأس h44 خلفية #F8FAFC نص 13/600 muted · صفوف h56 أبيض border سفلي نص 14 ink · padding 0×12.

## KPI card
stroke border، radius 12، padding 24، gap 8 · عنوان 12 muted · القيمة Goldman 36 ink · سطر ثانوي 13 (نجاح = #15803D).
> ⚠️ عينة الـpen تعرض "ر.س" — المشروع بالجنيه (EGP) حسب project.md. لا نتبع العملة المرسومة.

## Dialog
radius 14، padding 24، gap 16 · عنوان 22/700 · وصف 14 muted · تنبيه destructive (خلفية danger-soft، نص #B91C1C 13) · أزرار تأكيد/إلغاء في الأسفل (نهاية).

## Alert
radius 10، padding 16، gap 12 · عنوان 15/700 + نص 13 بنفس اللون · أيقونة 20 (نجاح: خلفية #F0FDF4، نص #15803D، `circle-check`).

## Tabs
تبويب: padding 12×8، نص 14/600؛ نشط = نص + حد سفلي primary؛ غير نشط muted.
