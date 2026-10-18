══════════════════════════════════════════════════════════════════
                  PRINTING BUSINESS MANAGEMENT SYSTEM
                          PBMS — VERSION 1.0

              الكتاب المرجعي الشامل لتحليل وتصميم النظام

                 BUSINESS REQUIREMENTS DOCUMENT
                FUNCTIONAL REQUIREMENTS SPECIFICATION
                   UI/UX & SCREEN SPECIFICATIONS
                 FRONTEND & BACKEND SPECIFICATIONS
                    DATA MODEL & API CONTRACTS
                  SECURITY & QUALITY REQUIREMENTS

                  نظام إدارة أعمال المطبعة المتكامل
══════════════════════════════════════════════════════════════════

إصدار الوثيقة: 1.0
حالة الوثيقة: مواصفات تأسيسية شاملة للتنفيذ والمراجعة
لغة النظام: العربية
اتجاه الواجهة: RTL
نطاق النظام: مطبعة واحدة — Single Organization
نوع المنتج: Internal Web Application + Customer Portal
العملة الأساسية: الجنيه المصري (EGP)

المصدر المرجعي:
1. القرارات التشغيلية المعتمدة خلال مناقشات المشروع.
2. وثيقة المتطلبات الوظيفية الأصلية V0.3.
3. الاختيارات التصميمية والتنفيذية اللازمة لاستكمال المواصفات.

قاعدة المرجعية:
إذا تعارضت مسودة V0.3 مع قرار لاحق صريح لصاحب المشروع،
يُطبّق القرار اللاحق.

══════════════════════════════════════════════════════════════════
دليل قراءة الوثيقة
══════════════════════════════════════════════════════════════════

[معتمد]:
قرار اتُخذ صراحة أثناء تحليل طريقة عمل المطبعة.

[تصميم تنفيذي]:
اختيار هندسي أو تصميمي متوافق مع القرارات المعتمدة، وليس
تغييرًا في Business Rules. يمكن تحسين تنفيذه دون تغيير السلوك.

[خارج النطاق]:
وظيفة لن تُنفذ ضمن V1.

[قيد التحقق التقني]:
وظيفة معتمدة، لكن جودة تنفيذها أو حدودها التشغيلية تحتاج
اختبارات أو إعدادات فعلية، مثل دقة البحث بالصورة.

مصطلحات الوثيقة:
- Order: الأوردر الفعلي.
- Order Request: طلب مبدئي يرسله عميل لديه حساب.
- Order Item: بند واحد داخل الأوردر.
- Designer Task: مهمة التصميم الخاصة بالبند.
- Design Version: نسخة كاملة من ملفات التصميم.
- Approved Version: النسخة التي اعتمدها العميل.
- Customer Ledger: الحساب المالي الموحد للعميل.
- Payment Allocation: الجزء المخصص من دفعة لأوردر معين.
- Refund Due: مبلغ مستحق الرد للعميل.
- Refund Paid: مبلغ تم رده بالفعل.
- Action: إجراء مطلوب من موظف، لا ينتهي بمجرد قراءة الإشعار.
- Audit Log: سجل تدقيق غير قابل للتعديل من واجهة النظام.
- Platform Access: صلاحية العميل في تسجيل الدخول.
- View Only: معاينة دون توفير وسيلة تنزيل معتمدة.

══════════════════════════════════════════════════════════════════
الفهرس
══════════════════════════════════════════════════════════════════

القسم الأول: Business & Product Definition
01. تعريف المشروع وأهدافه
02. نطاق العمل والحدود
03. Personas والأدوار ومسؤوليات المستخدمين
04. مصفوفة الصلاحيات وقواعد الوصول
05. رحلات المستخدمين End-to-End

القسم الثاني: Business Logic
06. هيكل الأوردر والبنود
07. دورة Order Request
08. دورة الأوردر الكاملة
09. نظام المصممين وتوزيع الشغل
10. التصميمات والنسخ والشات والاعتماد
11. الطباعة والتسليم والتوصيل
12. الكتالوج والتسعير والخصومات
13. حسابات العملاء والمدفوعات والاستردادات
14. الإشعارات ومركز الإجراءات
15. البحث العادي والبحث بالصورة

القسم الثالث: UI/UX
16. خريطة المعلومات والتنقل حسب الدور
17. نظام التصميم Design System
18. الشاشات المشتركة
19. شاشات الإدارة
20. شاشات الطلبات
21. شاشات العملاء
22. شاشات المنتجات والتسعير
23. شاشات المصممين والتصميمات
24. شاشات الحسابات
25. شاشات التوصيل والتقارير والبحث
26. شاشات الموظفين والإعدادات والتدقيق
27. شاشات العملاء الخارجيين
28. التفاعلات ورسائل النظام والحالات الاستثنائية

القسم الرابع: Technical Architecture
29. المعمارية العامة
30. مواصفات Frontend
31. مواصفات Backend
32. نموذج البيانات والعلاقات
33. تصميم واجهات API
34. Events / Queues / Background Jobs
35. Security / Files / Realtime / Integrations
36. Search by Image Architecture
37. إعدادات النظام التفصيلية
38. Logging / Monitoring / Backup

القسم الخامس: Quality & Delivery
39. تعريف المؤشرات والتقارير
40. السيناريوهات الاستثنائية
41. خطة الاختبار ومعايير القبول
42. خطة التنفيذ وتوزيع المسؤوليات
43. تعريف اكتمال المشروع
44. ملحق القواعد غير القابلة للكسر


══════════════════════════════════════════════════════════════════
القسم الأول: BUSINESS & PRODUCT DEFINITION
══════════════════════════════════════════════════════════════════

الفصل 01 — تعريف المشروع وأهدافه
──────────────────────────────────────────────────────────────────

1.1 وصف المشروع

PBMS نظام داخلي لإدارة شغل مطبعة واحدة.

يجمع النظام دورة الشغل كاملة، بداية من بيانات العميل والمنتجات
والمواصفات، مرورًا بتوزيع التصميمات ومراجعة العميل، ووصولًا إلى
الطباعة والتسليم والتحصيل.

لا يُطلب من المطبعة العمل على أنظمة منفصلة لإدارة العملاء
والتصميمات والأوردرات والمدفوعات.

كل عملية تكون مرتبطة بسجل معلوم، وصاحب مسؤولية معلوم،
وحالة تشغيلية واضحة.

1.2 المشاكل التي يحلها

- ضياع مواصفات الأوردر بين مكالمات واتساب والملاحظات.
- صعوبة معرفة التصميم الذي وافق عليه العميل فعلًا.
- تكرار إرسال ملفات التصميم وصعوبة تحديد أحدث نسخة.
- عدم وضوح ضغط العمل على كل مصمم.
- عدم معرفة البنود المنتظرة للعميل والبنود التي تحتاج تعديلًا.
- عدم معرفة الأوردرات الجاهزة للطباعة أو التسليم.
- تسجيل المدفوعات بطرق غير موحدة.
- صعوبة معرفة مديونية العميل عبر أكثر من أوردر.
- صعوبة تتبع سبب تعديل السعر أو إلغاء الأوردر.
- صعوبة الوصول إلى أوردر شغل مطبوع بدون معرفة رقمه.
- غياب صلاحيات دقيقة تفصل بين الإدارة والتشغيل والتصميم والمحاسبة.

1.3 أهداف النجاح

الهدف الأول:
أي موظف مخول يستطيع العثور على الأوردر ومواصفاته وحالته بسهولة.

الهدف الثاني:
أي تصميم معتمد يمكن إثبات رقم نسخته وملفاته ووقت اعتماده.

الهدف الثالث:
أي دفعة يمكن تتبع مصدرها وتوزيعها وأثرها على مديونية العميل.

الهدف الرابع:
أي إجراء مطلوب يظهر للشخص الصحيح ويظل معلقًا حتى تنفيذه.

الهدف الخامس:
لا يستطيع موظف تجاوز صلاحياته عبر الواجهة أو عبر API.

الهدف السادس:
كل أوردر يصل إلى الطباعة فقط بعد اعتماد جميع بنوده النشطة.

الهدف السابع:
العميل العادي لا يحتاج إلى حساب، بينما العميل الدائم يمكنه
امتلاك حساب يشاهد منه أوردراته ويقدم طلبات جديدة.

1.4 حدود المنتج

[معتمد]
النظام خاص بمطبعة واحدة، وليس SaaS متعدد المستأجرين.

لا يحتاج النظام إلى:
- إنشاء شركات متعددة.
- إدارة اشتراكات.
- فوترة اشتراكات العملاء التجاريين.
- حسابات فروع متعددة.
- فصل بيانات Tenants مختلفة.

يمكن تصميم قاعدة البيانات بشكل منظم وقابل للتوسع، لكن دون بناء
تعقيد غير مطلوب الآن.

1.5 متطلبات غير وظيفية رئيسية

- واجهة عربية RTL.
- دعم الكمبيوتر والموبايل.
- سرعة البحث في آلاف الأوردرات.
- محادثات لحظية.
- صلاحيات على مستوى API والملفات.
- سجل تدقيق دائم للأحداث المهمة.
- نسخ احتياطي دوري.
- منع تضاعف المدفوعات.
- تحمل انقطاع الاتصال وإعادة المحاولة.
- الحفاظ على الأوردرات المكتملة والملغية.
- تمييز البيانات المعتمدة من البيانات القابلة للتعديل.

──────────────────────────────────────────────────────────────────
الفصل 02 — نطاق العمل والحدود
──────────────────────────────────────────────────────────────────

2.1 وحدات النسخة الأولى V1

[معتمد]

01. Authentication & Access Control
02. Employee Management
03. Customer Management
04. Customer Platform Access
05. Products Catalog
06. Product Options & Specifications
07. Pricing Tiers
08. Order Discounts
09. Orders Management
10. Order Requests Review
11. Designer Assignment
12. Designer Tasks
13. Design Versions
14. Customer Approval
15. Per-Item Realtime Chat
16. Order-Wide Printing
17. Pickup & Delivery Tracking
18. Customer Ledger
19. Payments & Allocations
20. Payment Proof Review
21. Cancellation Refunds
22. Invoices & Receipts
23. Notifications
24. Requires Action Center
25. Audit Logs
26. Reports
27. Global Search
28. Search by Image
29. WhatsApp Manual & Optional Automatic Notifications
30. Settings

2.2 خارج نطاق V1

[معتمد]

- إدارة المخزون التفصيلية.
- إدارة تكلفة الورق والخامات.
- حساب صافي الأرباح.
- حساب المرتبات والحضور والانصراف.
- إدارة ماكينات الطباعة.
- شاشة مسؤول طباعة مستقلة.
- تطبيق موبايل Native.
- تتبع GPS للمندوب.
- حساب مندوب وتشغيل توصيل متقدم.
- تكامل API مع شركات الشحن.
- بوابة دفع إلكتروني.
- نظام ضريبي حكومي متكامل دون متطلبات مستقلة.
- CRM للتسويق والحملات.
- متجر إلكتروني مفتوح للعملاء الجدد دون حساب.
- نظام متعدد المطابع.

2.3 حدود WhatsApp

[معتمد]

يُستخدم واتساب للتواصل اليدوي مع العملاء العاديين وإرسال رابطهم.

تنبيهات التصميم الجاهز للمراجعة تدعم:
- System Default.
- Automatic.
- Manual.

الإرسال التلقائي يحتاج تكاملًا خارجيًا مهيأ بالفعل.

إشعار جاهزية الأوردر للاستلام أو التوصيل لا يتم إرساله
تلقائيًا عبر واتساب.

الموظفون يحصلون على إشعارات داخل النظام فقط.

──────────────────────────────────────────────────────────────────
الفصل 03 — Personas والأدوار ومسؤوليات المستخدمين
──────────────────────────────────────────────────────────────────

3.1 Persona: Super Admin

الهدف:
التحكم النهائي في النظام وحماية الهيكل الإداري والصلاحيات.

طريقة الدخول:
Email + Password.

ما يحتاج رؤيته:
- لوحة إدارة شاملة.
- الأوردرات والعملاء.
- المنتجات والأسعار.
- المصممون والمهام.
- الحسابات والتقارير.
- الموظفون والـAdmins.
- الصلاحيات والإعدادات.
- Audit Logs.
- الإشعارات والإجراءات المطلوبة.

ما يمكنه فعله:
- كل إجراءات الإدارة التشغيلية.
- إنشاء Admin جديد.
- ترقية موظف إلى Admin.
- تعديل صلاحيات Admin.
- إنشاء وإيقاف الموظفين.
- إعداد مجموعات الصلاحيات.
- إدارة إعدادات الأمان والنظام.
- إلغاء أوردر مع تسجيل السبب.
- إعادة فتح تصميم معتمد قبل الطباعة.
- متابعة التصحيحات المالية وسجلاتها.

لا يتم حذف Audit Logs من الواجهة حتى بواسطة Super Admin.

رحلته المعتادة:
Login → Dashboard → متابعة مؤشرات الأداء → حل الاستثناءات
→ مراجعة الحسابات والصلاحيات → Reports / Audit Logs.

3.2 Persona: Admin

الهدف:
إدارة التشغيل اليومي وضمان انتقال الأوردرات بين المراحل.

طريقة الدخول:
Email + Password.

شاشاته:
- Dashboard.
- Orders.
- Order Requests.
- Customers.
- Products.
- Pricing.
- Design Management.
- Accounting.
- Delivery.
- Reports.
- Employees.
- Notifications.
- Actions.
- Audit Logs.
- Settings وفق الصلاحية.

يمكنه:
- إنشاء وتعديل الأوردرات قبل الطباعة.
- إضافة وحذف بنود قبل الطباعة.
- تعديل أسعار الأوردرات ضمن الضوابط.
- تطبيق الخصومات.
- إدارة العملاء وحساباتهم.
- قبول ورفض طلبات العملاء.
- تغيير المصمم.
- إكمال الطباعة.
- إكمال الاستلام والتوصيل.
- الإلغاء الإداري.
- إعادة فتح تصميم معتمد قبل الطباعة.
- تسجيل المدفوعات والاستردادات.
- إنشاء وتعديل حسابات الموظفين العاديين.

لا يمكنه:
- إنشاء Admin.
- ترقية موظف إلى Admin.
- تعديل دوره أو صلاحياته هو.
- تعديل حساب Admin آخر.
- التحكم في Super Admin.

رحلته المعتادة:
Login → Dashboard → Requires Action → مراجعة طلبات
→ متابعة التصميمات غير المسندة → Printing / Delivery
→ مراجعة الاستثناءات المالية.

3.3 Persona: Data Entry

الهدف:
استقبال العملاء وتحويل طلباتهم إلى أوردرات منظمة ومتابعة التنفيذ.

طريقة الدخول:
Email + Password.

شاشاته:
- Dashboard تشغيلية فقط.
- Orders.
- New Order.
- Order Requests.
- Customers.
- Customer Profile المقيد.
- Order Details.
- Design Overview للمتابعة.
- Delivery.
- Notifications.
- Requires Action.
- Search / Search by Image.
- بعض الإعدادات أو الوظائف الإضافية لو منحها Admin.

يمكنه:
- البحث عن عميل أو تسجيل عميل جديد.
- إنشاء أوردر.
- إدخال المنتجات والكميات والمواصفات.
- رفع مرفقات العميل.
- متابعة حالات التصميم.
- مشاهدة محادثات العميل والمصمم للمتابعة فقط.
- متابعة تسليم الأوردر.
- تسجيل دفعة جديدة.
- رؤية المبلغ المتبقي على الأوردر أو العميل.
- إكمال الاستلام من المطبعة.
- معالجة بعض طلبات استرجاع كلمة المرور لو مخولًا.
- تطبيق خصم لو لديه صلاحية خاصة.

لا يمكنه:
- إلغاء أوردر بنفسه.
- إعادة فتح تصميم معتمد.
- إرسال رسائل داخل شات التصميم.
- تعديل دفعة محفوظة.
- مشاهدة Financial Dashboard الكاملة.
- مشاهدة كشف الحساب التفصيلي المحجوب.
- تعديل سعر أوردر بعد أول دفعة.
- إدارة Admin Accounts.
- تجاوز أي صلاحية مالية خاصة.

رحلته المعتادة:
Login → Requires Action → البحث عن العميل → Create Order
→ إرسال رابط واتساب → متابعة التصميمات → تسجيل التحصيل
→ Complete Printing / Pickup / Delivery وفق الصلاحية.

3.4 Persona: Designer

الهدف:
تنفيذ التصميمات المسندة إليه ومراجعتها مع العميل حتى الاعتماد.

طريقة الدخول:
Email + Password.

شاشاته الأساسية:
- Designer Dashboard.
- New Tasks.
- In Progress.
- Revision Requested.
- Awaiting Approval.
- Completed.
- Task Details.
- Chat.
- Design Versions.
- Notifications.
- Profile.

يمكنه:
- فتح مهامه فقط.
- الضغط على Start Design.
- قراءة المواصفات ومرفقات العميل.
- إرسال نصوص ورسائل صوتية وصور وPDF في الشات.
- رفع نسخة تصميم كاملة.
- تعديل ملفات النسخة غير المعتمدة.
- الاطلاع على ملاحظات العميل.
- إنشاء نسخة جديدة بعد طلب تعديل.
- رؤية سجل النسخ الخاص بمهمته.

لا يمكنه:
- فتح مهام مصممين آخرين.
- مشاهدة أسعار الأوردر.
- مشاهدة الحسابات.
- تغيير اعتماد العميل.
- تعديل تصميم معتمد.
- بدء طباعة الأوردر.
- إلغاء أوردر.
- إدارة صلاحيات المستخدمين.

حالة Availability الخاصة بالمصمم مستقلة عن حالة تسجيل دخوله.

رحلته المعتادة:
Login → New Tasks → Start Design → رفع Version
→ Submit for Approval → Waiting → Revision / Approved.

3.5 Persona: Accountant

الهدف:
حماية دقة التحصيلات والمديونيات والاستردادات.

طريقة الدخول:
Email + Password.

شاشاته:
- Accounting Dashboard.
- Payments.
- Payment Proof Reviews.
- Customer Ledger.
- Outstanding Balances.
- Refunds.
- Invoices & Receipts.
- Financial Reports.
- Financial Audit Entries.
- Customer Lookup.

يمكنه:
- مشاهدة التفاصيل المالية.
- تسجيل دفعات.
- مراجعة إثباتات الدفع.
- تعديل أو تصحيح عملية دفع موثقة.
- تسجيل رد الأموال الفعلي.
- إصدار إيصال دفع أو استرداد.
- مراجعة حساب العميل الموحد.
- استخراج تقارير التحصيل.

لا يمكنه لمجرد كونه Accountant:
- تغيير تصميمات.
- إعادة فتح موافقات.
- إلغاء أوردر.
- إدارة المصممين.
- إنشاء Admin.
- تعديل إعدادات المنتجات التشغيلية.

رحلته المعتادة:
Login → Accounting Dashboard → Pending Payment Proofs
→ Collections → Customer Ledger → Refunds → Reports.

3.6 Persona: Registered Customer

الهدف:
تقديم طلباته بنفسه، ومتابعة شغله الحالي والسابق.

طريقة الدخول:
Phone Number + Staff-Generated Password.

شاشاته:
- Customer Login.
- Customer Dashboard.
- My Orders.
- Create Order Request.
- Request Details.
- Order Details.
- Item Design Review.
- Item Chat.
- My Notifications.
- My Profile.
- Forgot Password Request.

يمكنه:
- إنشاء Order Request.
- مشاهدة الأسعار المتاحة لفئته.
- مشاهدة طلباته الحالية والسابقة.
- مراجعة التصميمات.
- إرسال رسائل صوتية ونصية ومرفقات.
- اعتماد التصميمات.
- الاطلاع على الفاتورة وتنزيلها PDF.
- رفع إثبات دفع إن أتيح في الطلب.

لا يمكنه:
- قبول طلبه بنفسه.
- تعديل الأوردر الفعلي مباشرة بعد القبول.
- تعديل اعتماد التصميم بعد تثبيته.
- تحميل Design Preview الرسمي.
- إنشاء سعر خاص أو خصم من تلقاء نفسه.
- تعديل كلمة مروره بنفسه.
- مشاهدة أوردرات عميل آخر.

رحلته المعتادة:
Login → Create Order Request → Pending Review
→ Accepted → My Orders → Design Review → Approve
→ Printing → Delivery / Pickup → Completed.

3.7 Persona: Link-Based Customer

الهدف:
مراجعة أوردر واحد دون إنشاء حساب.

طريقة الوصول:
Private Order Link يُرسل عبر واتساب.

شاشاته:
- Order Link Design Stage.
- Item Chat & Preview.
- Approval Confirmation.
- Printing Status.
- Ready for Pickup / Delivery.
- Out for Delivery.
- Link Closed.

يمكنه:
- مشاهدة الأوردر المرتبط بالرابط فقط.
- فتح بنوده أثناء مرحلة التصميم.
- إرسال رسائل ومرفقات داخل شات كل بند مفتوح.
- مشاهدة Design Preview.
- اعتماد كل بند.
- الاطلاع على قيمة الأوردر والمبالغ المستحقة في حدود
  صفحة العميل.
- رفع إثبات دفع.
- تنزيل فاتورة الأوردر خلال صلاحية الرابط.

لا يمكنه:
- مشاهدة أوردرات أخرى.
- تحميل المعاينة الرسمية للتصميم.
- تعديل الأوردر بنفسه.
- إرسال رسائل بعد قفل شات البند.
- فتح الرابط بعد Completed أو Cancelled.

3.8 مالك كل إجراء

Create Order:
Admin أو Data Entry المخول.

Accept / Reject Order Request:
Admin أو Data Entry المخول بعد Start Review.

Start Design:
Designer المعيّن.

Submit Design Version:
Designer المعيّن.

Approve Design:
Customer المعني؛ واستثناءات الموافقة نيابة عن العميل
لا تُفترض تلقائيًا من صلاحية الإدارة.

Reopen Approved Design:
Admin / Super Admin قبل الطباعة فقط.

Complete Printing:
الموظف الإداري أو التشغيلي المخول.

Mark Ready / Out for Delivery:
Admin أو Data Entry المخول.

Complete Pickup:
Admin أو Data Entry.

Cancel Order:
Admin / Super Admin فقط.

Record Payment:
Admin / Accountant / Data Entry.

Edit Payment:
Admin / Accountant فقط.

Record Refund Paid:
Admin / Accountant فقط.

Create / Modify Admin:
Super Admin فقط.

Reset Customer Password:
Admin أو Data Entry مفوض صراحةً.

──────────────────────────────────────────────────────────────────
الفصل 04 — مصفوفة الصلاحيات وقواعد الوصول
──────────────────────────────────────────────────────────────────

4.1 نموذج الصلاحيات

[تصميم تنفيذي]
استخدام RBAC مع Permissions تفصيلية.

RBAC = Role-Based Access Control.

كل User له Role أساسي.
يمكن للإدارة منح صلاحيات إضافية محددة للموظفين العاديين.
بعض القيود ثابتة ولا يمكن تجاوزها بإعطاء Permission إضافية.

4.2 قائمة Permission Keys المقترحة

dashboard.operational.view
dashboard.financial.view

customers.view
customers.create
customers.update
customers.view_balance
customers.view_ledger
customers.platform_access.manage
customers.password_reset.handle

orders.view
orders.create
orders.update
orders.items.manage
orders.pricing.edit
orders.discount.apply
orders.printing.complete
orders.delivery.update
orders.complete
orders.cancel
orders.links.manage
orders.files.view

order_requests.view
order_requests.review
order_requests.accept
order_requests.reject

products.view
products.manage
pricing.tiers.manage
pricing.options.manage

designers.view
designers.assignment.manage
designers.availability.manage
design.tasks.view_own
design.tasks.start
design.versions.submit
design.versions.edit_unapproved
design.approval.reopen
design.chat.read
design.chat.send_as_designer
design.chat.admin_participate

payments.create
payments.view_summary
payments.view_all
payments.proofs.review
payments.correct
refunds.view
refunds.record
invoices.view
invoices.issue

reports.operational.view
reports.financial.view

employees.view
employees.manage_staff
employees.manage_admins
permissions.manage_staff
permissions.manage_admins

settings.general.manage
settings.orders.manage
settings.payments.manage
settings.whatsapp.manage
settings.security.manage
settings.files.manage

audit.view
search.image.use

4.3 قيود ثابتة

[معتمد]
- الـAdmin لا يعدل نفسه أو Admin آخر.
- الـAdmin لا ينشئ Admin.
- Super Admin وحده يدير مستويات Admin.
- Data Entry لا يشارك في Designer Chat.
- Designer يرى البنود المسندة له فقط.
- Data Entry لا يعدل دفعة محفوظة.
- إلغاء الأوردر للإدارة فقط.
- إعادة فتح التصميم المعتمد للإدارة فقط وقبل الطباعة.

4.4 الصلاحية على مستوى السجل

وجود Permission لا يكفي وحده.

مثلًا Designer معه design.tasks.view_own:
يجب التأكد أن order_item.assigned_designer_id == current_user.id.

وعند الوصول إلى File:
يجب التحقق من صلاحية المستخدم على الكيان الأب للملف.

وعند عرض Customer Ledger:
يجب التحقق من صلاحية مالية مستقلة.

4.5 منع التصعيد الإداري

أي Endpoint لإنشاء User أو تعديل Roles يجب أن يمنع:
- Admin → Admin creation.
- Admin → Admin promotion.
- Admin → editing another Admin.
- Admin → editing own privileges.
- Staff → modifying privileged fields in payload.

لا يتم الاعتماد على قيم Role قادمة من المتصفح.

4.6 التفويضات الاستثنائية

يمكن للـAdmin منح Data Entry:
- Can Apply Order Discount.
- Can Manage Customer Platform Access.
- Can Handle Password Reset Requests.

يُسجل:
- من منح التفويض.
- من استلمه.
- وقت التغيير.
- الصلاحيات قبل وبعد.

──────────────────────────────────────────────────────────────────
الفصل 05 — رحلات المستخدمين End-to-End
──────────────────────────────────────────────────────────────────

5.1 رحلة أوردر جديد لعميل عادي

1. يتواصل العميل مع المطبعة.
2. يبحث Data Entry عن العميل برقم الهاتف.
3. يختار ملفًا موجودًا أو ينشئ عميلًا جديدًا.
4. يضغط New Order.
5. يضيف بندًا أو أكثر.
6. يختار المواصفات والكمية والملفات.
7. النظام يحسب السعر وفق فئة العميل.
8. يختار Pickup أو Delivery.
9. يضيف رسوم توصيل إن وجدت.
10. يراجع ملخص الأوردر.
11. يضغط Create Order.
12. ينشئ النظام أوردرًا وبنوده.
13. يبدأ التوزيع التلقائي للمصممين.
14. ينسخ الموظف الرابط الخاص بالأوردر.
15. يرسله للعميل عبر واتساب.
16. يبدأ المصمم تنفيذ الشغل.
17. يرفع Version للمراجعة.
18. العميل يفتح الرابط ويشاهد التصميم.
19. يرسل ملاحظات أو يعتمد التصميم.
20. تستمر دورة التعديل حتى الموافقة.
21. عند اعتماد آخر بند، يبدأ In Printing.
22. ينفذ العاملون بالطباعة شغل الأوردر خارج النظام.
23. يضغط الموظف Complete Printing عند اكتماله.
24. يتحول إلى Ready for Pickup أو Ready for Delivery.
25. يتم تسليمه أو خروجه للتوصيل.
26. يتحول إلى Completed.
27. يتقفل الرابط.
28. تظل أي مديونية قائمة في Customer Ledger.

5.2 رحلة Order Request لعميل مسجل

1. العميل يسجل الدخول.
2. يفتح Create Order Request.
3. يختار المنتجات والمواصفات والكميات.
4. يرفق الملفات والملاحظات.
5. يشاهد الأسعار وفق فئته.
6. يضغط Submit Request.
7. النظام يحفظ Pending Review.
8. ينشئ Action للإدارة أو Data Entry المخول.
9. الموظف يفتح Request Details.
10. يضغط Start Review لحجز المراجعة.
11. يراجع التفاصيل وقد يتفق مع العميل يدويًا.
12. يعدل بيانات الطلب عند الحاجة.
13. يضغط Accept أو Reject.
14. إن رفض: سبب إلزامي وإشعار للعميل.
15. إن قبل: ينشأ Order ويبدأ توزيع التصميم.
16. تظهر الحالة في My Orders.
17. يكمل العميل مراجعة التصميمات والاعتماد.
18. تصل العملية للطباعة ثم التسليم.
19. يظل الأوردر المكتمل ظاهرًا في My Orders.

5.3 رحلة Designer

1. المصمم يدخل النظام.
2. يشاهد New Tasks.
3. يختار مهمة.
4. يراجع المواصفات والملفات.
5. يضغط Start Design.
6. يحضر التصميم.
7. يرفع الصور أو PDF.
8. يتأكد أن الـVersion تحتوي على كل الصفحات المطلوبة.
9. يضغط Submit for Approval.
10. تنتقل المهمة إلى Awaiting Approval.
11. في حالة ملاحظات العميل، تظهر Revision Requested.
12. يقرأ الرسائل وينفذ التعديل.
13. ينشئ Version جديدة كاملة.
14. يكرر العملية حتى Approved.
15. بعد الاعتماد يصبح الشات مقفولًا.
16. تظهر المهمة في Completed.

5.4 رحلة Accountant

1. يفتح Accounting Dashboard.
2. يراجع Pending Payment Proofs.
3. يتحقق من إثبات التحويل.
4. يؤكد الدفع أو يرفض الإثبات مع سبب.
5. يسجل التحصيلات اليدوية الواردة.
6. يراجع حسابات العملاء.
7. يصحح الأخطاء المالية بصلاحية.
8. يراجع Refund Due للأوردرات الملغية.
9. يسجل Refund Paid بعد رد الفلوس فعليًا.
10. يصدر الإيصالات والتقارير.

5.5 رحلة Admin التشغيلية اليومية

1. فتح Dashboard.
2. مراجعة Action Center بالأقدم أولًا.
3. حل Unassigned Items.
4. مراجعة طلبات العملاء الجديدة.
5. متابعة أعمال التصميم المنتظرة.
6. متابعة الأوردرات تحت الطباعة.
7. متابعة الجاهز للاستلام والتوصيل.
8. مراجعة استثناءات الأسعار والإلغاءات.
9. مراجعة التقارير وسجل النشاط.

5.6 رحلة البحث بالصورة

1. الموظف يفتح Search by Image.
2. يصور الشغل المطبوع أو يرفع صورة.
3. يشاهد Preview.
4. يضغط Search.
5. يحدد Active Orders أو Include Archived.
6. يستلم أقرب 5 إلى 10 نتائج.
7. يقارن الصور والمعلومات.
8. يضغط على النتيجة الصحيحة.
9. يفتح الأوردر حسب صلاحياته.
10. لو لم توجد مطابقة مناسبة، يستخدم البحث النصي.

══════════════════════════════════════════════════════════════════
القسم الثاني: BUSINESS LOGIC
══════════════════════════════════════════════════════════════════

الفصل 06 — هيكل الأوردر والبنود
──────────────────────────────────────────────────────────────────

6.1 الفرق بين Order وOrder Item

Order يمثل العملية التجارية كاملة.
Order Item يمثل شغل منتج محدد داخل الأوردر.

Order:
- عميل واحد.
- بند أو أكثر.
- سعر إجمالي واحد.
- خصم على مستوى الأوردر.
- رسوم توصيل على مستوى الأوردر.
- طريقة تسليم واحدة.
- حالة طباعة واحدة.
- تسوية مالية مرتبطة بحساب العميل.

Order Item:
- منتج واحد بمواصفاته.
- كمية.
- سعر بند.
- مصمم مسؤول.
- محادثة مستقلة.
- سجل نسخ تصميم.
- اعتماد مستقل.

6.2 أمثلة

Order #2026-0100:
Customer: شركة النور

Item 1:
كروت شخصية — 1000 نسخة
Designer: أحمد
State: Approved

Item 2:
بانر — 2 قطعة
Designer: علي
State: Revision Requested

Item 3:
استيكر — 500 قطعة
Designer: أحمد
State: Awaiting Approval

Global Order State:
Design Stage

ممنوع يبدأ طباعة Item 1 رغم اعتماده؛ لأن Item 2 وItem 3
لم يُعتمدا بعد.

6.3 نموذج بيانات الأوردر

Order ID: يولد تلقائيًا.
Order Number: رقم قابل للقراءة.
Customer ID: إجباري.
Source: STAFF_CREATED أو ACCEPTED_REQUEST.
Order Status: حالة تشغيلية.
Delivery Method: PICKUP أو DELIVERY.
Delivery Address Snapshot: مطلوب عند Delivery.
Printing ETA Days: عدد الأيام عند التخصيص.
Subtotal: إجمالي البنود بعد فئات الأسعار.
Order Discount Type: NONE / FIXED / PERCENT.
Order Discount Value: قيمة الخصم.
Delivery Fee: رسوم التوصيل.
Grand Total: الإجمالي النهائي.
Total Paid: قيمة مشتقة من تخصيصات الدفعات المؤكدة.
Amount Due: المبلغ المتبقي.
Created By: الموظف أو مصدر القبول.
Created At / Updated At.
Cancelled At / Cancelled By / Reason.
Completed At / Completed Source.

6.4 نموذج بيانات البند

Order Item ID.
Order ID.
Product ID.
Product Snapshot.
Selected Options Snapshot.
Quantity.
Unit Price Snapshot.
Item Total.
Designer ID nullable.
Design State.
Approved Version ID nullable.
Approved At nullable.
Notes.
Files / Chat / Versions relations.

6.5 اتساق حالة الأوردر

[معتمد]
بمجرد اعتماد آخر بند نشط، تتحول الحالة إلى In Printing.

[تصميم تنفيذي]
لا يتم تخزين حالة تشغيلية على الأوردر تتعارض مع حالة البنود.
تُحسب أهلية الدخول للطباعة من جميع البنود النشطة، ويتم الانتقال
داخل Transaction واحدة.

6.6 حالة إلغاء بند

[تصميم تنفيذي]
يمكن للإدارة حذف بند قبل الطباعة دون مسح تاريخه فعليًا.
إذا كان له تصميمات أو موافقات، يكون الإلغاء منطقيًا Soft Cancel.
يُسجل السبب والوقت والمسؤول.

لا يدخل البند الملغي ضمن شرط اعتماد جميع البنود.
ولا يُحسب ضمن قيمة الأوردر الحالية.

لو إلغاء البند يغيّر السعر بعد تسجيل دفعة، تطبق صلاحيات الإدارة
والقيد الذي يمنع نزول إجمالي الأوردر عن المدفوع.

──────────────────────────────────────────────────────────────────
الفصل 07 — دورة Order Request
──────────────────────────────────────────────────────────────────

7.1 الحالات

PENDING_REVIEW
IN_REVIEW
ACCEPTED
REJECTED

7.2 من يرسل الطلب؟

Registered Customer فقط.

العميل العادي لا يقدم Order Request من رابط الأوردر.
الأوردر الخاص به ينشئه الموظف.

7.3 من يراجعه؟

Admin أو Data Entry مخول.

7.4 Start Review Lock

فتح شاشة التفاصيل للقراءة لا يحجز الطلب.

الضغط على Start Review:
- يتحقق أن الطلب ما زال Pending Review.
- يضبط Reviewed By.
- يسجل Reviewed At.
- يغير الحالة إلى In Review.
- يمنع الآخرين من تعديله أو قبوله أو رفضه.

الزملاء الآخرون يستطيعون مشاهدة التفاصيل Read Only.

7.5 تعديلات المراجع

المراجع يستطيع تعديل جميع تفاصيل الطلب ضمن الصلاحيات:
- البنود.
- المنتجات.
- الكميات.
- المقاسات.
- الخيارات.
- الملاحظات.
- طريقة التسليم.
- السعر والخصم وفق صلاحياته.

الاتفاق على أي تغييرات تجارية مع العميل يتم يدويًا.
لا نضيف دورة موافقة مالية جديدة داخل Order Request.

7.6 القبول

Accept:
- حفظ Snapshot النهائي.
- إنشاء Order حقيقي.
- تحويل البنود إلى Order Items.
- تطبيق توزيع المصممين.
- إخطار العميل.
- حفظ العلاقة بين Request وOrder.
- إغلاق Action المراجعة.

يجب منع تكرار القبول حتى لو ضغط المستخدم مرتين.

7.7 الرفض

Reject يتطلب:
- Reason ID من قائمة الإدارة، أو
- Custom Reason عند اختيار Other.

يُحفظ سبب الرفض نصيًا وقت القرار.
لا تتغير مبررات طلب مرفوض بعد تعديل القائمة العامة.

العميل يستطيع إرسال Order Request جديد بدل تعديل المرفوض.

7.8 مشاكل التزامن

إذا فتح موظفان الطلب قبل Start Review:
أول عملية Start Review مؤكدة تنجح.
الثانية تستلم رسالة تفيد أن الطلب قيد مراجعة موظف آخر.

لا يوجد Auto Timeout أو Force Unlock Workflow منفصل ضمن
القرارات الحالية.

تُظهر الإدارة الطلبات المحجوزة واسم المراجع لتتبع التعطيل.

──────────────────────────────────────────────────────────────────
الفصل 08 — دورة الأوردر الكاملة
──────────────────────────────────────────────────────────────────

8.1 المراحل

DESIGN_STAGE
→ IN_PRINTING
→ READY_FOR_PICKUP أو READY_FOR_DELIVERY
→ OUT_FOR_DELIVERY إذا كانت Delivery
→ COMPLETED

CANCELLED مسار استثنائي للإدارة.

8.2 Design Stage

الأوردر يحتوي على بنود في مراحل:
- Unassigned
- New Task
- In Progress
- Revision Requested
- Awaiting Approval
- Approved

يظل الأوردر في مرحلة التصميم طالما يوجد بند نشط غير معتمد.

8.3 شرط In Printing

All active items approved == true.

لا يوجد زر لطباعة بند مستقل قبل اكتمال الموافقات.

8.4 مدة الطباعة

الافتراضي:
1–2 أيام.

يمكن لـData Entry تحديد مدة مخصصة كعدد أيام صحيح للأوردر كله.
لا توجد مدة منفصلة لطباعة كل Item.

يظهر للعميل تقدير الطباعة، وليس ضمانًا آليًا بموعد التسليم.

8.5 Complete Printing

إجراء واحد على Order.

Preconditions:
Order Status == IN_PRINTING.
User has permission.
Order not Cancelled / Completed.

Postconditions:
PICKUP → READY_FOR_PICKUP.
DELIVERY → READY_FOR_DELIVERY.

Audit:
Who / When / Old State / New State.

8.6 Pickup

READY_FOR_PICKUP → COMPLETED.

منفذ الإجراء:
Admin أو Data Entry.

لا يُشترط سداد المديونية قبل Completed.

8.7 Delivery

READY_FOR_DELIVERY → OUT_FOR_DELIVERY.

عند Out for Delivery:
يسجل dispatched_at.

يمكن:
- Complete يدويًا.
- Complete آليًا بعد 24 ساعة.

[تصميم تنفيذي]
تسجل completion_source:
MANUAL_DELIVERY أو AUTO_DELIVERY_24H.

لا يُعتبر Auto Completion إثباتًا مستقلًا للتسليم الفعلي.

8.8 Cancel

Admin / Super Admin فقط.

يتطلب سببًا.

القاعدة:
الإلغاء الطبيعي قبل بدء الطباعة.
الإلغاء الإداري الاستثنائي متاح بعد بداية الطباعة إذا لم يصل
الأوردر إلى Completed.

عند الإلغاء:
- قفل الوصول الخارجي.
- قفل الشات.
- وقف المهام التشغيلية.
- تحديث المركز المالي.
- إنشاء Refund Due للمدفوع المخصص للأوردر.
- تسجيل الحدث.

8.9 Completed

الأوردر لا يُعاد فتحه تشغيليًا.

يمكن فقط تصحيحات مالية موثقة وفق الصلاحيات.

لا تتغير التصميمات أو المواصفات أو تاريخ التسليم بعد الإغلاق.

──────────────────────────────────────────────────────────────────
الفصل 09 — نظام المصممين وتوزيع الشغل
──────────────────────────────────────────────────────────────────

9.1 التخصصات

كل Designer لديه Specialties متعددة.
كل Product / Product Variant يمكنه تحديد Specialty مطلوبة.

9.2 القاعدة المعتمدة للتوزيع

1. البحث عن المؤهلين للتخصص.
2. استبعاد غير المتاحين.
3. حساب المهام النشطة.
4. اختيار أقل مصمم مشغول.
5. عند التساوي استخدام معيار ترتيب ثابت لمنع العشوائية.

[تصميم تنفيذي]
يمكن استخدام آخر وقت إسناد كعامل كسر التعادل.

9.3 حساب عبء العمل

Active Work:
- In Progress.
- Revision Requested النشطة التي تحتاج تنفيذًا.

لا تُحتسب:
- New Tasks التي لم يبدأ تنفيذها.
- Awaiting Approval.
- Approved / Completed.
- Cancelled.

المقصود قياس الشغل الجاري فعليًا، وليس كل ما ظهر للمصمم.

9.4 الحالات الخمس في Designer Dashboard

NEW_TASKS
IN_PROGRESS
REVISION_REQUESTED
AWAITING_APPROVAL
COMPLETED

Unassigned لا يظهر عند أي Designer حتى الإسناد.

9.5 الإسناد اليدوي

يمكن لـAdmin وData Entry المخول إسناد مهمة لمصمم مناسب.

عند التغيير:
- يفقد السابق صلاحية الوصول.
- الجديد يشاهد كامل تاريخ البند.
- يتغير assigned_designer_id.
- تُسجل العملية.
- يصل إشعار داخلي للمصمم الجديد.

9.6 التوفر والإجازة

الحالة الوظيفية:
ACTIVE / INACTIVE.

حالة استقبال المهام:
AVAILABLE / UNAVAILABLE / ON_LEAVE.

تسجيل الدخول لا يعتمد على AVAILABLE.
يمكن للمصمم Active الدخول وهو ON_LEAVE.

9.7 مؤشرات المصمم

- عدد المهام الجديدة.
- عدد المهام النشطة.
- المنتظرة للعميل.
- التعديلات.
- المكتملة.
- المهام المتأخرة، إذا كانت لها مواعيد تصميم محددة.

لا يتم استنتاج أداء الموظف من عدد التعديلات وحده.

──────────────────────────────────────────────────────────────────
الفصل 10 — التصميمات والنسخ والشات والاعتماد
──────────────────────────────────────────────────────────────────

10.1 مبدأ كل بند

لكل Item:
- Designer واحد حالي.
- Chat مستقل.
- Versions متعددة.
- Approval مستقل.

10.2 الملفات الرسمية للتصميم

الرفع الرسمي للمراجعة يقبل صورًا وPDF.
لا يشترط رفع الملف الأصلي القابل للتعديل.

10.3 Version كاملة

Version الجديدة يجب أن تشمل جميع الأوجه والصفحات المقصودة.

مثال:
الكارت له Front وBack.
Version 2 يجب أن تحتوي Front وBack حتى لو التعديل على Back فقط.

10.4 تعديل Version غير معتمدة

قبل اعتمادها:
- إضافة ملف.
- حذف ملف.
- استبدال ملف.

داخل نفس Version Number.
مع Audit Log.
دون إرسال إشعار مراجعة جديد بسبب استبدال الملف وحده.

10.5 منع السباق وقت الاعتماد

[تصميم تنفيذي]
يُحفظ file_manifest_revision لكل Version.
عند Approve، يؤكد النظام أن Revision التي شاهدها العميل
ما زالت الحالية.

إذا اختلفت، يعرض المعاينة الجديدة ويطلب التأكيد مجددًا.

10.6 الشات

يدعم:
- Text.
- Voice notes.
- Images.
- PDFs.
- Attachments متعددة.
- Real-time updates.
- Download لمرفقات الشات المسموح بها.

Design Preview الرسمي يظل View Only.

10.7 طلب التعديل

لا يوجد Request Revision Button.

إذا كان البند Awaiting Approval وأرسل العميل رسالة:
- تحفظ الرسالة.
- تصبح المهمة Revision Requested.
- يصل تنبيه داخلي للمصمم.

المصمم يراجع الرسالة ويحدد التعديل المطلوب داخل سياق المحادثة.

10.8 الاعتماد

نص التأكيد المعتمد:

هل أنت متأكد من اعتماد التصميم؟
بعد الاعتماد، لن تتمكن من طلب تعديلات إضافية على هذا التصميم.

[رجوع]    [تأكيد الاعتماد]

عند التأكيد:
- تثبيت Version.
- Approved At.
- Customer Approval Audit.
- تغيير الحالة إلى Approved.
- قفل Chat البند.
- قفل Version المعتمدة.
- إشعار المصمم والإدارة.

10.9 إعادة فتح الاعتماد

Admin / Super Admin فقط.
قبل In Printing فقط.
Reason مطلوب.

يظل الاعتماد السابق محفوظًا كتاريخ.
يفتح Chat ومراجعة البند مجددًا.
يلزم اعتماد عميل جديد بعد التعديل.

10.10 الموافقة على آخر بند

إذا أصبحت جميع البنود النشطة Approved:
- Order → In Printing.
- قفل جميع محادثات التصميم.
- تحويل واجهة العميل إلى Printing Status.
- حفظ حدث انتقال الأوردر.

──────────────────────────────────────────────────────────────────
الفصل 11 — الطباعة والتسليم والتوصيل
──────────────────────────────────────────────────────────────────

11.1 الطباعة ليست لكل بند

[معتمد]
يبدأ الأوردر كله بعد اعتماد جميع البنود.

11.2 بطاقة التشغيل

[تصميم تنفيذي]
Print Job Ticket بصيغة PDF للطباعة الداخلية.

تحتوي:
- Order Number.
- Customer.
- Items.
- Quantities.
- Materials / Sizes / Options.
- Notes.
- Approved Version IDs.
- Printing ETA.
- Pickup / Delivery.
- رقم هاتف للتواصل الداخلي عند الحاجة.

لا تعتبر فاتورة ولا تُستخدم لتحصيل مبالغ.

11.3 Ready for Pickup

بعد Complete Printing للأوردر الذي اختير له Pickup:
READY_FOR_PICKUP.

عند التسليم الفعلي:
Complete Order → COMPLETED.

11.4 Ready for Delivery

بعد Complete Printing للأوردر Delivery:
READY_FOR_DELIVERY.

عند خروج الأوردر:
OUT_FOR_DELIVERY.

بمجرد التأكيد اليدوي أو بعد 24 ساعة:
COMPLETED.

11.5 عنوان التوصيل

عنوان Delivery إجباري وقت حفظ الأوردر.

[تصميم تنفيذي]
يُحفظ Snapshot لعنوان الأوردر نفسه، حتى لو تغيّر العنوان
الأساسي للعميل لاحقًا.

11.6 رسوم التوصيل

موظف Data Entry يحدد رسوم التوصيل عند إنشاء الأوردر.
تظهر بندًا منفصلًا في الملخص والفاتورة.

11.7 عدم اشتراط دفع كامل

التحصيل مستقل عن Completed.
يمكن تسليم الأوردر مع بقاء مديونية.

11.8 الإشعار بالجاهزية

التحديث يظهر في رابط العميل أو حسابه.
الواتساب اليدوي متاح.
لا توجد رسالة واتساب تلقائية عند الجاهزية.

──────────────────────────────────────────────────────────────────
الفصل 12 — الكتالوج والتسعير والخصومات
──────────────────────────────────────────────────────────────────

12.1 بيانات المنتج

Product:
- ID.
- Name.
- Category.
- Description.
- Base Unit Price.
- Active / Inactive.
- Minimum Quantity optional.
- Supported Options.
- Required Designer Specialty.

12.2 مواصفات المنتج

يمكن تهيئة:
- Size.
- Color Mode.
- Paper Type.
- Material.
- Print Sides.
- Finish.
- Additional Options.

كل Product يحدد أي Options تظهر له.
لا تظهر خيارات غير مرتبطة بالمنتج.

12.3 معادلة التسعير

Base Unit Price + Sum(Unit Option Additions)
= Standard Unit Price.

بعدها تطبيق فئة العميل.

Tiered Unit Price × Quantity = Item Total.

Sum(Item Totals)
- Order Discount
+ Delivery Fee
= Grand Total.

12.4 Percentage Tier

خصم على السعر الأساسي والإضافات معًا.

مثال:
Base = 10
Additions = 2
Tier Discount = 20%

Unit = (10 + 2) × 0.8 = 9.6

12.5 Fixed Base Tier

يستبدل السعر الأساسي فقط.
الإضافات لا تُخصم.

مثال:
Standard Base = 10
Tier Base = 7
Additions = 2

Unit = 7 + 2 = 9

12.6 Order Discount

يكون:
PERCENT أو FIXED.

المصرح:
Admin أو Data Entry معه Can Apply Order Discount.

الخصم لا يؤدي إلى قيمة سالبة.
لا يسمح للخصم بتخفيض الإجمالي دون المدفوع.

[تصميم تنفيذي]
خصم الأوردر يطبق على Subtotal قبل إضافة رسوم التوصيل.

12.7 تعديلات الأسعار القديمة

أي تعديل في:
- Product Base Price.
- Option Price.
- Pricing Tier.

لا يؤثر على Orders القديمة.

يجب حفظ Price Snapshot داخل كل Order Item.

12.8 السعر بعد دفع عربون

[معتمد]
إذا كان هناك Payment مؤكد، تعديل سعر الأوردر للـAdmin /
Super Admin فقط.

لا يُسمح بسعر نهائي أقل من المدفوع.

──────────────────────────────────────────────────────────────────
الفصل 13 — حسابات العملاء والمدفوعات والاستردادات
──────────────────────────────────────────────────────────────────

13.1 Customer Ledger

لكل عميل حساب مالي موحد يعرض:
- Orders.
- Charges.
- Payments.
- Payment Allocations.
- Outstanding Balances.
- Refund Due.
- Refund Paid.

13.2 تسجيل دفعة Targeted

اختيار Order معين:
المبلغ يخصم من المتبقي لهذا الأوردر وحده.

13.3 تسجيل دفعة General

تتوزع على الأقدم مستحقًا أولًا FIFO.

مثال:
Order A Due = 400
Order B Due = 300

Customer General Payment = 500

Allocation A = 400
Allocation B = 100

Order A Due = 0
Order B Due = 200

Payment سجل واحد بقيمة 500، لا سجلان مستقلان.

13.4 رفض Overpayment

لا يسمح باستلام دفعة عامة أكبر من مجموع المستحقات.
ولا دفعة Targeted أكبر من المستحق على أوردرها.

13.5 Payment Proof

العميل يرفع:
- Amount.
- Payment Method.
- Proof Image.
- Notes optional.

تُنشأ مراجعة PENDING.
لا تُحسب ضمن التحصيل المؤكد.

الموظف المخول يختار:
CONFIRM → تسجيل Payment فعلية.
REJECT → سبب الرفض مطلوب.

13.6 تصحيح Payment

Admin / Accountant فقط.

[تصميم تنفيذي]
التصحيح يُنشئ Financial Audit Adjustment بدل محو الأثر القديم.

يعيد النظام حساب Allocations المتأثرة.
لا يسمح بكسر قاعدة الرصيد أو تكرار الدفعات.

13.7 Cancellation Refund

Order Total = 1000.
Paid = 300.
Due = 700.

عند Cancel:
Order Due = 0.
Refund Due = 300.

لا يتم تلقائيًا ترحيل الـ300 إلى أوردر جديد.

13.8 Refund Paid

Admin / Accountant يسجل رد الفلوس الفعلي:
- Amount.
- Date.
- Method.
- Reason / Reference.
- Employee.

Refund Due ينخفض بالقيمة المدفوعة.
يمكن تنفيذ الاسترداد على دفعة واحدة أو أكثر طالما المجموع
لا يتجاوز المبلغ المستحق رده.

13.9 المستندات المالية

- Order Invoice.
- Payment Receipt.
- Refund Receipt.

تصدر كوثائق قابلة للطباعة وPDF.

13.10 تقارير الأموال

- Total Order Value.
- Gross Collections.
- Refunds Paid.
- Net Collections.
- Outstanding Receivables.
- Refund Due.

هذه أرقام مختلفة ولا يجوز دمجها في KPI واحد.

──────────────────────────────────────────────────────────────────
الفصل 14 — الإشعارات ومركز الإجراءات
──────────────────────────────────────────────────────────────────

14.1 Notification

حدث للمعلومية.
يمكن قراءته دون تغيير الكيان.

14.2 Action

مهمة تتطلب تنفيذًا.
تبقى مفتوحة حتى تنفيذ الإجراء الفعلي.

14.3 التبويبات

ALL_ACTIONS
ORDER_REQUESTS
PASSWORD_RECOVERY
CUSTOMER_NOTIFICATIONS
OTHER_ACTIONS

14.4 ترتيب العرض

All Actions بالأقدم أولًا.

14.5 Action Lifecycle

OPEN
→ CLAIMED / IN_PROGRESS عند الحاجة
→ COMPLETED

يمكن استخدام FAILED / CANCELLED لسجلات النظام عند الحاجة الفنية.

14.6 أنواع Action

- Review Order Request.
- Handle Password Reset.
- Notify Customer via WhatsApp.
- Assign Unassigned Designer Task.
- معالجة استثناء تشغيلي يحتاج إجراءً.

14.7 إتمام Action

Opening أو Read لا يكفيان لإتمام Action.

مثال:
Password Recovery يكتمل بعد إجراء إعادة التعيين وتوثيق
معالجة الطلب.

Customer Notification اليدوية لا تُعلّم Completed إلا بعد
تأكيد الموظف أنه أرسل الرسالة فعليًا.

14.8 الإشعارات الداخلية

كل الموظفين يستقبلون إشعارات داخلية فقط.
لا تُفقد الإشعارات إذا كان الموظف Offline.

14.9 تصميم إشعار المستخدم

Notification:
- ID.
- Recipient.
- Event Type.
- Title.
- Body.
- Related Entity.
- Created At.
- Read At.
- Action ID optional.

14.10 منع التكرار

[تصميم تنفيذي]
الحدث الواحد لا يجب أن ينشئ Action مكررًا كل مرة
تعاد محاولة Background Job.

──────────────────────────────────────────────────────────────────
الفصل 15 — البحث العادي والبحث بالصورة
──────────────────────────────────────────────────────────────────

15.1 Global Search

يدعم:
- Order Number.
- Item Number.
- Customer Name.
- Phone.
- Designer عند صلاحية الإدارة.

15.2 Advanced Filters

- Date Range.
- Order Status.
- Payment Status.
- Delivery Method.
- Customer.
- Designer.
- Active / Archived.

15.3 Search by Image

[معتمد]
ضمن V1.

إدخال صورة عبر Camera أو Upload.
مقارنة مع صور التصميمات والمراجع.
عرض أقرب 5–10 بنود.
الموظف يختار النتيجة الصحيحة.

15.4 Index Sources

- Approved Design Images.
- Historical Design Version Images.
- Customer Reference Images.
- Printed Work Photos إن وجدت.
- PDF Page Preview Images إن أنشئت.

15.5 Search Results

لكل نتيجة:
- Thumbnail.
- Order Number.
- Item Number.
- Customer Name حسب الصلاحية.
- Order Status.
- Similarity Rank / Approximate Score.
- Open Item / Order.

15.6 الخصوصية

لا تُحفظ صورة الاستعلام بعد انتهاء البحث دون حاجة تشغيلية.
تُطبق الصلاحيات على النتائج.
لا يُستخدم البحث لتجاوز الوصول إلى أوردرات الآخرين.

15.7 مقياس الجودة

[قيد التحقق التقني]
يتم اختبار عينات حقيقية من المطبعة:
- صور مائلة.
- إضاءة مختلفة.
- مطبوعات مقصوصة.
- تصميمات شبه متطابقة.
- صور من ملفات رقمية وأخرى من الورق.

يعرض النظام نتائج مرشحة ولا يعلن تطابقًا قطعيًا.

══════════════════════════════════════════════════════════════════
══════════════════════════════════════════════════════════════════
القسم الثالث: UI/UX & DETAILED SCREEN SPECIFICATIONS
══════════════════════════════════════════════════════════════════

الفصل 16 — خريطة المعلومات والتنقل حسب الدور
──────────────────────────────────────────────────────────────────

16.1 الهدف

الـUI/UX Designer لا يبدأ برسم صفحات منفصلة.
يجب أولًا فهم Navigation Structure وUser Journeys والعلاقات بين
الأوردر والعميل والبند والدفعة والمصمم.

16.2 Admin / Super Admin Sidebar

01. Dashboard
02. Orders
03. Order Requests
04. Customers
05. Products
06. Pricing
07. Design Management
08. Accounting
09. Delivery
10. Reports
11. Search
12. Employees
13. Action Center
14. Activity & Audit Logs
15. Settings

القائمة لا تحتاج إلى تكرار Notification Center داخل Sidebar
إذا كان الوصول إليه واضحًا من Top Bar، لكن Action Center
يظل قسمًا مستقلًا مهمًا.

16.3 Data Entry Sidebar

01. Dashboard
02. Orders
03. Order Requests
04. Customers
05. Design Overview
06. Delivery
07. Search
08. Action Center

أقسام أخرى تظهر فقط عند التفويض.

لا يظهر Accounting الكامل أو إعدادات الموظفين الإدارية.

16.4 Designer Sidebar

01. My Tasks
02. Notifications
03. My Profile

داخل My Tasks:
- New Tasks.
- In Progress.
- Revision Requested.
- Awaiting Approval.
- Completed.

16.5 Accountant Sidebar

01. Accounting Dashboard
02. Collections
03. Payment Proofs
04. Customer Ledgers
05. Receivables
06. Refunds
07. Invoices & Receipts
08. Financial Reports
09. Financial Audit

16.6 Registered Customer Navigation

01. Dashboard
02. My Orders
03. Create Order Request
04. My Requests
05. Notifications
06. Profile

16.7 Link-Based Customer Navigation

لا يوجد Dashboard عام أو Sidebar كامل.

الواجهة مرتبطة بأوردر واحد:
- Order Overview.
- Order Items أثناء التصميم.
- Design Preview.
- Item Chat.
- Approval.
- Payment Information.
- Status Screen بعد الطباعة.

16.8 قواعد الـNavigation

- يظهر Breadcrumb عند وجود عدة مستويات.
- يجب الاحتفاظ بسياق البحث والفلاتر عند الرجوع للقائمة.
- الضغط على Order Number يفتح Order Details.
- الضغط على Item يفتح Item Details.
- الضغط على Customer يفتح Customer Profile عند وجود صلاحية.
- الضغط على مصمم يفتح Designer Details للإدارة.
- الضغط على Notification يفتح الكيان المرتبط.
- لا تُعرض روابط تنتهي بشاشات لا يملك المستخدم الوصول إليها.

──────────────────────────────────────────────────────────────────
الفصل 17 — Design System والتصميم البصري
──────────────────────────────────────────────────────────────────

17.1 المبادئ

النظام أداة عمل يومية.
الأولوية:
- الوضوح.
- تقليل عدد النقرات.
- عرض الحالة والمسؤول.
- تجنب الأزرار غير المناسبة للحالة.
- سهولة الاستخدام على الموبايل.
- سرعة العثور على الأوردر.
- منع الأخطاء المالية والتشغيلية.

17.2 اللغة

النص الأساسي عربي.
الاتجاه RTL.

تُستخدم مصطلحات إنجليزية مألوفة عند الحاجة مثل:
Order / Item / Version / Dashboard.

لكن ينبغي وضع ترجمة واضحة في واجهات العملاء.

17.3 Typography

[تصميم تنفيذي]
استخدام خط عربي مناسب للواجهات مثل Cairo أو Tajawal أو
Noto Sans Arabic حسب الاختبارات البصرية والترخيص.

Hierarchy:
- Page Title.
- Section Heading.
- Card Title.
- Table Header.
- Body Text.
- Helper Text.
- Error Text.

17.4 Color Semantics

الألوان تعكس المعنى لا الزينة:
- لون أساسي للعمليات العامة.
- لون نجاح للاعتماد والإتمام.
- لون تحذير للتأخير والحاجة إلى مراجعة.
- لون خطأ للإلغاء أو الرفض أو فشل العملية.
- ألوان حيادية للحالات المقفولة والأرشيف.

يجب كتابة اسم الحالة بجانب اللون.
لا نعتمد على اللون وحده.

17.5 Buttons

Primary:
الإجراء الرئيسي في الشاشة.

Secondary:
إجراء داعم.

Danger:
إلغاء أو عملية مؤثرة غير قابلة للتراجع بسهولة.

Ghost / Text:
إجراءات منخفضة الأهمية.

Disabled:
عند عدم اكتمال البيانات.

[تصميم تنفيذي]
للمستخدم الذي لا يملك صلاحية أصلًا، يُفضّل إخفاء الإجراء.
أما إذا كان يملك الصلاحية لكن الحالة الحالية تمنعه، فيمكن
عرض الزر Disabled مع سبب واضح إذا كانت رؤيته مفيدة.

17.6 Tables

كل جدول إداري يدعم حسب الحاجة:
- Search.
- Filters.
- Sort.
- Pagination.
- Loading.
- Empty State.
- Error State.
- Row Actions.
- Responsive Layout.

لا تُنقل عشرات الأعمدة كما هي إلى شاشة موبايل صغيرة.
تتحول الصفوف إلى بطاقات تعرض أهم المعلومات والإجراء الرئيسي.

17.7 Form Fields

كل حقل يحتاج:
- Label.
- Required indicator إن كان إجباريًا.
- Placeholder عند الحاجة.
- Helper Text.
- Validation.
- Disabled State.
- Error Message.

الأرقام المالية تُعرض بوحدتها.
لا يُسمح بإدخال قيم مالية غير صالحة أو سالبة.

17.8 Confirmation Dialogs

تُستخدم عند:
- Approve Design.
- Reject Request.
- Cancel Order.
- Reopen Design.
- Record Refund Paid.
- Change Permissions.
- Disable Account.
- عمليات التصحيح المالي المهمة.

يجب أن يوضح Dialog:
- ما الذي سيحدث.
- ما الذي لا يمكن التراجع عنه.
- ما الذي يحتاج سببًا.
- زر إلغاء آمن.
- زر تأكيد واضح.

17.9 Notification UX

الإشعارات العادية يمكن قراءتها وإغلاق قائمة عرضها.

Actions:
لا تختفي بسبب فتحها أو تعليم الإشعار كمقروء.

17.10 Accessibility

[تصميم تنفيذي]
- تباين ألوان مناسب.
- أزرار قابلة للاستخدام بلوحة المفاتيح.
- تسميات واضحة للحقول.
- رسائل أخطاء مرتبطة بالحقول.
- Focus State واضح.
- دعم تكبير النص.
- أحجام لمس مناسبة للموبايل.
- نص بديل للصور غير الزخرفية.
- عدم قصر معنى الحالة على لون Badge.

──────────────────────────────────────────────────────────────────
الفصل 18 — الشاشات المشتركة
──────────────────────────────────────────────────────────────────

SCREEN S-001: Staff Login
────────────────────────

Purpose:
دخول موظف إلى نظام المطبعة.

Actors:
Super Admin / Admin / Data Entry / Designer / Accountant.

Layout:
- شعار المطبعة.
- عنوان "تسجيل دخول الموظفين".
- حقل البريد الإلكتروني.
- حقل كلمة المرور.
- زر تسجيل الدخول.
- رسالة خطأ في مكان واضح.

Fields:
email: required, email format.
password: required.

Actions:
- Sign In.
- Show / Hide Password.

Behavior:
1. التحقق من الحقول محليًا.
2. إرسال بيانات الاعتماد للـBackend.
3. التأكد من Active Account.
4. إنشاء Session.
5. جلب صلاحيات المستخدم.
6. توجيهه إلى Dashboard الخاصة بدوره.

Errors:
- بيانات دخول غير صحيحة.
- الحساب غير نشط.
- محاولات دخول كثيرة.
- تعذر الاتصال بالخادم.

Security:
لا تكشف الرسالة أي معلومات إضافية عن حسابات الآخرين.
لا يتم تخزين كلمة المرور كنص صريح في المتصفح.

SCREEN S-002: Top Bar / Global Header
────────────────────────────────────

Actors:
جميع الموظفين.

Elements:
- زر فتح/غلق Sidebar على الموبايل.
- Page Title أو Breadcrumb.
- Global Search.
- Search by Image Shortcut عند الصلاحية.
- Notification Bell.
- User Avatar / Profile Menu.

User Menu:
- My Profile.
- Logout.

Behavior:
عند وجود Action أو Notification جديدة يتحدث العداد دون
الحاجة إلى Refresh كامل للصفحة.

SCREEN S-003: My Profile
────────────────────────

Purpose:
عرض البيانات الشخصية الوظيفية.

Fields:
- الاسم.
- البريد الإلكتروني.
- الدور.
- حالة الحساب.
- رقم الهاتف الداخلي، إن كان مستخدمًا.
- معلومات التخصص للمصمم.
- آخر دخول، إن كان مسجلًا.

Actions:
- عرض البيانات.
- تعديل البيانات الشخصية غير الحساسة إذا سُمح بذلك.
- Logout.

Restrictions:
لا يُسمح للموظف بتعديل Role أو Permissions الخاصة به.

SCREEN S-004: Notification Center
─────────────────────────────────

Purpose:
عرض إشعارات الموظف.

Tabs:
- All.
- Unread.

Notification Card:
- Icon.
- Title.
- Description.
- Related Order / Item.
- Created At.
- Read / Unread Indicator.

Actions:
- Open Related Record.
- Mark Read للإشعارات العادية.
- Mark All Read للإشعارات التي لا تمثل Action مطلوبة.

Important:
قراءة Notification لا تكمل Action مرتبطة بها.

Empty:
"لا توجد إشعارات جديدة."

SCREEN S-005: Requires Action Center
────────────────────────────────────

Purpose:
عرض الأعمال التي تحتاج تنفيذًا.

Tabs:
- All Actions.
- Order Requests.
- Password Recovery.
- Customer Notifications.
- Other Actions.

Default:
All Actions — Oldest First.

Columns / Cards:
- Action Type.
- Title.
- Related Customer.
- Related Order.
- Created At.
- Assigned / Claimed By.
- Status.
- Primary Action.

Actions by type:
Review Request → Open Request Details.
Password Reset → Handle Request.
Manual WhatsApp → Open Message / Copy / Confirm Sent.
Assign Task → Open Assignment Dialog.

Validation:
لا يمكن إكمال إجراء بطريقة لا تنفذ وظيفته الحقيقية.

Empty:
"مفيش إجراءات مطلوبة منك حاليًا."

SCREEN S-006: Action History
────────────────────────────

Purpose:
عرض الإجراءات المكتملة.

Filters:
- Date Range.
- Action Type.
- Employee.
- Related Entity.
- Status.

Columns:
- Action ID.
- Type.
- Created At.
- Completed At.
- Completed By.
- Result.

Actions:
- View Details.
- Open Related Entity حسب الصلاحية.

No Edit/Delete:
لا يُعدل تاريخ الإجراءات من هذه الشاشة.

──────────────────────────────────────────────────────────────────
الفصل 19 — شاشات الإدارة الرئيسية
──────────────────────────────────────────────────────────────────

SCREEN S-007: Admin Dashboard
─────────────────────────────

Purpose:
إعطاء الإدارة صورة لحظية عن الشغل.

Audience:
Super Admin / Admin.

Section A — KPI Cards:
- Pending Requests.
- Unassigned Items.
- In Progress Designs.
- Revision Requested.
- Awaiting Approval.
- In Printing.
- Ready for Pickup.
- Ready for Delivery.
- Out for Delivery.
- Completed Orders.

Section B — Financial Snapshot:
- Collections Today.
- Collections This Week.
- Outstanding Receivables.
- Order Value.
- Refund Due.

Section C — Requires Action Preview:
أقدم الإجراءات المفتوحة.

Section D — Recent Orders:
رقم الأوردر، العميل، الحالة، تاريخ التحديث.

Section E — Operational Alerts:
بنود بدون مصمم، تصميمات متأخرة إذا وجدت مواعيد،
وأوردرات تحتاج متابعة.

Interactions:
- Click KPI → Filtered List.
- Click Action → Related Detail.
- Click Order → Order Details.
- Change KPI Date Range عندما يكون المؤشر زمنيًا.

Permission:
Financial KPIs للإدارة المالية المخولة فقط.

Loading:
Skeleton Cards.

Empty:
يعرض أصفارًا مناسبة وشرحًا عند عدم وجود شغل.

SCREEN S-008: Data Entry Dashboard
──────────────────────────────────

Purpose:
تجهيز موظف التشغيل لإنجاز شغله اليومي.

Visible KPIs:
- Pending Requests.
- Unassigned Items.
- Active Designs.
- Awaiting Approval.
- Revision Requested.
- In Printing.
- Ready for Pickup.
- Ready for Delivery.
- Out for Delivery.

Quick Actions:
- Create Order.
- Search Customer.
- Search by Image.
- Open Action Center.

Hidden:
- Total Shop Revenue.
- Collections Company-Wide.
- Full Outstanding Financial Statements.
- Detailed Global Payment History.

Behavior:
الأرقام التشغيلة مرتبطة بقوائم فلاتر قابلة للفتح.

SCREEN S-009: Accountant Dashboard
──────────────────────────────────

Purpose:
إظهار الحالة المالية اليومية.

KPI Cards:
- Gross Collections Today.
- Gross Collections This Week.
- Net Collections.
- Outstanding Receivables.
- Pending Payment Proofs.
- Refund Due.
- Refund Paid.
- Open Financial Exceptions.

Sections:
- Pending Payment Proofs.
- Recent Confirmed Payments.
- Refunds Awaiting Payout.
- High Outstanding Customer Balances.
- Quick Links to Reports.

Actions:
- Review Proof.
- Record Payment.
- Open Ledger.
- Record Refund.
- View Financial Report.

No Access:
إدارة تصميم أو تعديل بنود الأوردر من الداشبورد المالية.

──────────────────────────────────────────────────────────────────
الفصل 20 — شاشات الطلبات بالتفصيل
──────────────────────────────────────────────────────────────────

SCREEN S-010: Orders List
─────────────────────────

Purpose:
البحث والفرز والمتابعة لكل الأوردرات المسموح للمستخدم برؤيتها.

Header:
- Page Title: "الأوردرات".
- Total Results.
- + New Order.
- Search Field.
- Filter Button.
- Search by Image Shortcut.

Table:
Order Number.
Customer Name.
Customer Phone.
Items Count.
Order Status.
Grand Total.
Amount Due.
Delivery Method.
Created At.
Last Updated.
Actions.

Filters:
- Status.
- Date From / To.
- Payment State.
- Delivery Method.
- Customer.
- Designer مرتبط ببند.
- Active / Closed.
- Sorting.

Row Click:
Open Order Details.

Row Actions:
- View.
- Copy Order Number.
- Open Customer Profile عند الصلاحية.

Responsive:
على الموبايل يظهر رقم الأوردر والعميل والحالة وتاريخ الإنشاء
والمتبقي المسموح بعرضه ثم View.

Empty:
"لا توجد أوردرات مطابقة للفلاتر."

Permissions:
إخفاء الأعمدة غير المسموحة، مع تطبيق الفلترة نفسها في Backend.

SCREEN S-011: Create New Order Wizard
─────────────────────────────────────

Purpose:
إنشاء أوردر فعلي بواسطة موظف مخول.

Layout:
Stepper من خمس خطوات.
شريط ملخص جانبي على Desktop إن سمحت المساحة.
ملخص قابل للفتح على Mobile.

STEP 1 — CUSTOMER

Components:
- Customer Search Input.
- Search Results.
- Selected Customer Card.
- + Add Customer Modal.

Customer Search:
بالاسم أو رقم الهاتف.

Selected Customer Card:
Name.
Phone.
Pricing Tier.
Address.
Platform Access Status.

Add Customer Modal:
Name — required.
Phone — required.
Address — optional.
Notes — optional.

Validation:
لا يمكن التالي دون Customer ID صحيح.
فحص رقم الهاتف المكرر.

Buttons:
Back عند الحاجة.
Next.
Add Customer.

STEP 2 — ORDER ITEMS

Components:
- Product Selector.
- Product Category.
- Product Specifications Form.
- Quantity Input.
- Attachments Uploader.
- Notes Textarea.
- Items Summary.
- Add Another Item.
- Remove Item.

Fields:
Product — required.
Quantity — required.
Options — required حسب تهيئة المنتج.
Size — required إذا كان المنتج يستلزم مقاسًا.
Notes — optional.
Attachments — optional أو حسب نوع العمل.

Behavior:
عند تغيير المنتج تُحدّث الخيارات المتاحة.
عند تغيير Option أو Quantity يُعاد حساب السعر.
عند إضافة بند جديد يُنشأ Card مستقل.
يجب وجود بند صالح واحد على الأقل.

Price Preview:
Unit Base.
Option Additions.
Tier Adjustment.
Unit Final.
Quantity.
Item Total.

STEP 3 — PRICING

Fields:
Items Subtotal — calculated.
Discount Type — NONE / FIXED / PERCENT.
Discount Value — permission-based.
Delivery Fee — في حالة Delivery.
Grand Total — calculated.

Components:
- Itemized Price Summary.
- Customer Tier Badge.
- Discount Form.
- Grand Total.

Validation:
خصم % من 0 إلى 100.
خصم ثابت لا يتجاوز Subtotal.
Grand Total لا يكون سالبًا.
السعر النهائي يُحسب في السيرفر عند الحفظ مهما كان حساب
المتصفح.

STEP 4 — DELIVERY & PRINTING ETA

Fields:
Delivery Method — required.
Delivery Address — required عند Delivery.
Delivery Fee — editable حسب الصلاحيات.
Expected Printing Days — default or custom.
General Order Notes — optional.

UI:
Radio / Segmented Control:
Pickup | Delivery.

عند Pickup:
إخفاء Delivery Address وعدم اشتراطه.

عند Delivery:
إظهار العنوان وتعبئته مبدئيًا من ملف العميل إن وجد،
مع السماح بتخصيص عنوان لهذا الأوردر.

STEP 5 — REVIEW & CREATE

Review Sections:
Customer.
Items.
Specifications.
Files.
Pricing.
Delivery.
ETA.

Actions:
Edit Customer.
Edit Items.
Edit Pricing.
Edit Delivery.
Create Order.

On Submit:
- Disable duplicate submit.
- Show Loading.
- Backend validates all data.
- Create Order Transaction.
- Return Order ID.
- Navigate to Order Details.

Success:
"تم إنشاء الأوردر بنجاح."

For Link-Based Customer:
Show Copy Link + WhatsApp Shortcut.

For Registered Customer:
Order appears in My Orders and notification is created.

Error:
إبقاء بيانات الـWizard دون ضياع.
عرض الحقل أو الخطوة المسببة للخطأ.

SCREEN S-012: Order Details — Overview
──────────────────────────────────────

Purpose:
المركز الرئيسي للأوردر.

Header:
Order Number.
Status.
Customer Name.
Customer Phone.
Created At.
Updated At.
Delivery Method.

Financial Summary:
Subtotal.
Discount.
Delivery Fee.
Grand Total.
Paid.
Due.

Main Tabs:
Overview.
Items.
Payments.
Delivery.
Files.
Activity Log.

Overview Cards:
- Customer.
- Fulfillment Status.
- Printing ETA.
- Approval Progress.
- Order Source.
- Order Link Status إن وجد.
- General Notes.

Approval Progress:
مثال:
2 من 3 بنود معتمدة.

Actions:
- Edit Order عند السماح.
- Copy Link.
- Send WhatsApp.
- Print Invoice.
- Print Job Ticket.
- Complete Printing.
- Complete Order.
- Cancel Order.

Business Conditions:
كل زر يظهر وفق الحالة والصلاحية.

If In Printing:
لا تظهر أدوات تعديل المواصفات التشغيلية.
Complete Printing متاح للموظف المخول.

If Completed:
عرض Read Only باستثناء الإجراءات المالية المنفصلة.

If Cancelled:
يظهر Cancel Reason وRefund Summary.

SCREEN S-013: Order Details — Items Tab
───────────────────────────────────────

Purpose:
متابعة بنود الأوردر.

Item Card:
Item Number.
Product Name.
Quantity.
Specifications Summary.
Assigned Designer.
Design State.
Latest Version.
Approved Version عند وجودها.
Item Price لمن له صلاحية.
Last Activity.

Actions:
- View Item.
- Edit Item قبل الطباعة وبحسب الصلاحية.
- Add Item.
- Remove / Cancel Item.
- Reassign Designer.
- View Design History.

Add Item:
Product + Options + Quantity + Notes + Files.

Remove Item:
Confirmation Dialog.
Reason عند الإلغاء المنطقي بعد إنشاء نشاط.
Update Pricing.
Update Approval Completion Check.

Special Rule:
إذا كان البند Approved وتغيير المواصفات يؤثر على التصميم،
لا يسمح بإبقاء Approved على مواصفات جديدة من غير
إعادة فتح التصميم بواسطة الإدارة وقبل الطباعة.

SCREEN S-014: Order Item Details
────────────────────────────────

Purpose:
عرض جميع المعلومات الخاصة ببند واحد.

Top:
Item ID.
Order ID.
Product.
Design State.
Assigned Designer.

Tabs:
- Specifications.
- Customer Files.
- Design Versions.
- Chat.
- Activity.

Specifications:
Name.
Quantity.
Size.
Material.
Paper.
Color Mode.
Print Sides.
Selected Options.
Item Notes.

Customer Files:
Thumbnail / File Name / Type / Upload Date.

Design Versions:
Version Number.
Submitted At.
Submitted By.
Files Count.
Approval State.
Open Preview.

Chat:
Read / Send حسب صلاحية الدور وحالة البند.

Activity:
Start Design.
File Changes.
Messages.
Version Submissions.
Approval.
Reopen.
Assignment Transfers.

Actions:
- Reassign Designer — management.
- Reopen Design — Admin/SA قبل Printing.
- Open Approved Preview.

SCREEN S-015: Order Edit
────────────────────────

Purpose:
تعديل الأوردر قبل الطباعة.

Fields:
Delivery Method.
Delivery Address.
Printing ETA.
General Notes.
Items and Specifications حسب الصلاحية.
Pricing حسب صلاحية التعديل.

Restrictions:
إذا توجد Payment مؤكدة:
تعديل السعر Admin/SA فقط.

إذا دخل In Printing:
تعديل المواصفات والكميات والتصميمات مقفول.

إذا Approved Item يحتاج تعديلًا يمس التصميم:
إجراء Reopen Design يجب أن يحدث أولًا.

Actions:
Save.
Discard.

Dialog عند وجود تعديلات مؤثرة:
يعرض Old Value / New Value.
يحذر من أثرها على السعر أو اعتماد التصميم.

Audit:
تسجيل كل تعديل مهم وقيمته القديمة والجديدة.

SCREEN S-016: Order Cancellation Dialog
───────────────────────────────────────

Actor:
Admin / Super Admin.

Fields:
Cancellation Reason — required.
Optional Notes.

Preview:
- Order Total.
- Payments Allocated.
- Current Due.
- Expected Refund Due.

Warning:
"سيتم إلغاء الأوردر، وإغلاق رابط العميل، وتحويل المدفوعات
الخاصة به إلى مبالغ مستحقة الرد."

Actions:
Back.
Confirm Cancellation.

On Success:
Order → Cancelled.
Current Due → 0.
Refund Due calculated.
Chats closed.
Link closed.
Audit event.

Restrictions:
Completed cannot be cancelled.
Exceptionally, order In Printing may be cancelled by Admin/SA.

SCREEN S-017: Order Links Management
────────────────────────────────────

Purpose:
إدارة رابط العميل العادي.

Visible:
Current Link State.
Created At.
Last Regenerated At.
Current Access Status.

Actions:
- Copy Link.
- Open WhatsApp Message.
- Suspend Link.
- Reactivate Suspended Link.
- Regenerate Link.

Regenerate Confirmation:
"سيتم إيقاف الرابط القديم فورًا."

Rules:
Completed / Cancelled links stay closed.
Regenerate cannot reopen completed order.

Security:
الرابط لا يحتوي على Phone أو Order ID مكشوفين كمفتاح وصول.

SCREEN S-018: Print Job Ticket
──────────────────────────────

Purpose:
عرض بطاقة التشغيل قبل طباعتها.

Preview:
Print Shop Logo.
Order Number.
Customer.
Printing Date / Created Date.
Items.
Quantities.
Specifications.
Approved Version Numbers.
Operational Notes.
Delivery Method.
ETA.

Actions:
Print.
Download PDF للإدارة.
Back to Order.

Rule:
البطاقة داخلية وليست تصميم Preview للعميل أو فاتورة مالية.

SCREEN S-019: Order Requests List
─────────────────────────────────

Tabs:
Pending Review.
In Review.
Accepted.
Rejected.

Columns:
Request Number.
Customer.
Created At.
Items Count.
Quoted Total.
State.
Reviewer.
Actions.

Actions:
View Details.

Filter:
Date.
State.
Customer.
Reviewer.

Rule:
لا يظهر Accept / Reject المباشر في Dashboard أو Row Action.
القرار يتم بعد دخول شاشة المراجعة.

SCREEN S-020: Review Order Request
──────────────────────────────────

Layout:
Request Header.
Customer Information.
Items Editor.
Pricing Summary.
Delivery.
Attachments.
Review History.

Initial State:
PENDING_REVIEW.

Read-Only Before Start Review:
يمكن مشاهدة المحتوى.

Primary Action:
Start Review.

After Claim:
تصبح حقول التحرير متاحة للمراجع الذي حجز الطلب.

Editable:
All Request Details وفق صلاحياته.

Buttons:
Save Review Changes.
Accept Request.
Reject Request.

Accept Dialog:
يعرض ملخص التفاصيل النهائية.
يؤكد إنشاء Order فعلي.
لا ينشئ أوردرين عند ضغطتين.

Reject Dialog:
Dropdown للأسباب.
Custom Explanation عند Other.
Reject button.

After Accept:
Linked Order Number يظهر في الشاشة.
أزرار فتح Order Details.

After Reject:
Reason يظهر في Request History.
لا يمكن تحويل المرفوض إلى Pending مرة أخرى.

Concurrency Error:
"الطلب قيد المراجعة بواسطة موظف آخر."

SCREEN S-021: Request Review History
────────────────────────────────────

Purpose:
إظهار نتيجة مراجعة الطلب.

Visible:
Original Submitted Data Snapshot.
Review Started By / At.
Final Edited Data.
Accepted / Rejected By.
Decision At.
Rejection Reason if applicable.
Linked Order if accepted.

Rule:
لا يُعدّل التاريخ بعد القرار.

──────────────────────────────────────────────────────────────────
الفصل 21 — شاشات العملاء
──────────────────────────────────────────────────────────────────

SCREEN S-022: Customers List
────────────────────────────

Purpose:
عرض جميع العملاء والبحث عنهم.

Header:
+ Add Customer.
Search.
Filters.

Columns:
Customer Name.
Phone.
Pricing Tier.
Platform Access.
Orders Count.
Outstanding Balance عند الصلاحية.
Created At.
Actions.

Filters:
Pricing Tier.
Platform Access.
Outstanding Due فقط للموظف المخول.
Created Date.

Actions:
Open Customer.
Create Order for Customer عند صلاحية إنشاء أوردر.

Validation:
لا يتم إظهار Ledger تفصيلي لموظف Data Entry.

SCREEN S-023: Add / Edit Customer
─────────────────────────────────

Fields:
Customer Name — required.
Phone — required.
Address — optional.
Pricing Tier — default.
Internal Notes — optional.
Notification Preference — default.

Validation:
Name nonempty.
Phone valid normalized.
Duplicate Phone warning.
Tier must exist and be active.

Actions:
Save.
Cancel.

On Save:
Audit important changes.
Existing Orders keep their price snapshots.

SCREEN S-024: Customer Profile — Overview
─────────────────────────────────────────

Header:
Customer Name.
Phone.
Pricing Tier.
Platform Access Badge.
Create Order Button.

Tabs:
Overview.
Orders.
Financial Summary.
Payments.
Refunds.
Platform Access.
Activity.

Overview:
Name.
Phone.
Address.
Tier.
Notification Preference.
Customer Notes.
Total Orders.
Last Order Date.

Actions:
Edit Customer.
Create New Order.
Manage Platform Access بحسب الصلاحية.

SCREEN S-025: Customer Profile — Orders
───────────────────────────────────────

Purpose:
جميع أوردرات العميل.

Columns:
Order Number.
Date.
State.
Items Count.
Total.
Paid.
Due.
Delivery Method.

Filters:
Active / Completed / Cancelled.
Date.
Payment State.

Actions:
Open Order.
Create Another Order.

Rule:
عرض قيم الأموال بما يتناسب مع صلاحية الموظف.

SCREEN S-026: Customer Profile — Financial Summary
──────────────────────────────────────────────────

Visible to:
Admin / Accountant.
Data Entry يحصل فقط على المؤشرات المحدودة المسموحة.

Admin / Accountant Cards:
Order Value.
Confirmed Payments.
Outstanding Due.
Refund Due.
Refund Paid.

Ledger Preview:
Date.
Transaction Type.
Order.
Debit / Credit.
Balance / Reference.

Data Entry:
يعرض المستحق الحالي اللازم للتعامل مع العميل، وليس
تفاصيل دفتر الأستاذ أو كل حركاته.

SCREEN S-027: Customer Profile — Payments
─────────────────────────────────────────

Admin / Accountant:
Payment History.
Payment Allocations.
Payment Details.
Record Payment.
Correct Payment.

Data Entry:
Record New Payment.
Current Due Summary.
لا يرى سجل المدفوعات الكامل المحجوب.
لا يستطيع تعديل Payment محفوظة.

SCREEN S-028: Record Payment Modal
──────────────────────────────────

Fields:
Customer — auto selected.
Payment Scope:
  Specific Order | General Customer Payment.
Order Selector — required if Specific.
Amount — required, positive.
Payment Method — required.
Payment Date — default now, بحسب الصلاحية.
Transfer Proof — optional.
Notes — optional.

Live Summary:
Customer Outstanding Due.
Selected Order Due إن وجد.
Allocation Preview للدفعة العامة.

Validation:
Amount > 0.
Amount <= target due أو customer total due.
Customer must exist.
Payment Method active.
No double submit.

Actions:
Record Payment.
Cancel.

Result:
Payment ID.
Updated Due.
Receipt Shortcut.

SCREEN S-029: Payment Details
─────────────────────────────

Visible:
Payment ID.
Customer.
Original Amount.
Confirmed Amount.
Method.
Recorded By.
Recorded At.
Proof.
Allocations.
Corrections History.

Actions:
Print Receipt.
Correct Payment — Admin / Accountant.
View Customer Ledger.

Rule:
No Delete of confirmed financial history.

SCREEN S-030: Customer Profile — Refunds
────────────────────────────────────────

Visible:
Cancelled Order.
Refund Due.
Refund Paid.
Remaining Refund.
Refund State.
Last Refund Date.

Actions:
Open Refund.
Record Refund Paid — Admin / Accountant.

Data Entry:
لا يسجل الاسترداد، ويمكن إظهار الحالة المرتبطة بالأوردر
إذا احتاجها للتعامل مع استفسار العميل.

SCREEN S-031: Customer Platform Access
──────────────────────────────────────

Purpose:
إدارة دخول العميل صاحب الحساب.

Fields / Indicators:
Access Enabled.
Login Phone.
Last Password Reset At.
Account State.
Notification Preference.

Actions:
Enable Platform Access.
Disable Platform Access.
Generate Initial Password.
Reset Password وفق التفويض.

Enable Flow:
Confirm.
Generate temporary password.
Display once.
Copy Securely.
Manual WhatsApp Message.
Save Audit.

Reset Flow:
ينفذ من Password Recovery Action أو من ملف العميل
للمخول فقط.

Important:
لا يوجد View Existing Password.
لا يوجد Self-Service Password Change للعميل.

SCREEN S-032: Customer Activity
───────────────────────────────

Shows:
Profile Changes.
Tier Changes.
Platform Access Changes.
Password Reset Events.
Order Creation References.
Financial Event References بحسب الصلاحية.

Columns:
Time.
Actor.
Action.
Entity.
Details.

No edit.

──────────────────────────────────────────────────────────────────
الفصل 22 — شاشات المنتجات والتسعير
──────────────────────────────────────────────────────────────────

SCREEN S-033: Products List
───────────────────────────

Audience:
Admin / Super Admin / Users with product.view.

Columns:
Product Name.
Category.
Base Unit Price.
Minimum Quantity.
Status.
Required Designer Specialty.
Updated At.

Filters:
Category.
Active / Inactive.
Specialty.
Name.

Actions:
Add Product — management.
View.
Edit — management.
Deactivate / Activate — management.

Rule:
عدم حذف منتج مستخدم في أوردرات بشكل يكسر التاريخ.

SCREEN S-034: Product Editor
────────────────────────────

Layout:
Tabs:
- Basic Information.
- Specifications.
- Pricing.
- Designer Routing.
- Activity.

Basic Fields:
Name — required.
Category — required.
Description — optional.
Status — Active / Inactive.

Pricing:
Base Unit Price — required, nonnegative.
Minimum Quantity — optional positive integer.

Specifications:
Available Option Groups.
Required Option Groups.
Allowed Values.
Option Unit Additions.
Size Values.
Material Values.
Paper Values.
Print Sides.
Color Modes.

Designer Routing:
Required Specialty / Set of matching specialties.

Actions:
Save Draft إن احتاجت واجهة إدارة تغييرات.
Save Product.
Deactivate Product.

Validation:
No negative price.
Required option contains active values.
Option selections valid.
Minimum Quantity >= 1 when configured.

Existing Orders:
No repricing after catalog change.

SCREEN S-035: Product Option Group Editor
─────────────────────────────────────────

Purpose:
إدارة خيارات المنتج.

Fields:
Group Name.
Option Code.
Selection Type:
  Single Choice / Multiple Choice عند تهيئة المنتج.
Required.
Display Order.
Values.

Each Value:
Label.
Unit Addition.
Active.
Sort Order.

Example:
Group: Lamination.
Values:
None: +0.
Matte: +0.50.
Glossy: +0.40.

Rule:
الزيادة محسوبة لكل وحدة.
لا يجوز أن تصبح تكوينات قديمة غير قابلة للعرض بعد تعطيل Option.

SCREEN S-036: Pricing Tiers List
────────────────────────────────

Columns:
Tier Name.
Pricing Mode.
Products Configured Count.
Customers Count.
Status.

Actions:
Add Tier.
Edit Tier.
Deactivate Tier.
Open Tier Products.

SCREEN S-037: Tier Pricing Editor
─────────────────────────────────

Fields:
Tier Name.
Pricing Mode.
Percent Discount or Fixed Product Base Prices.

Percentage Mode:
Discount Percentage on base + additions.

Fixed Base Mode:
Per Product Tier Base Unit Price.
Option additions remain unchanged.

Validation:
Percentage 0–100.
Fixed Price >= 0.
Tier Name unique.

Preview:
Standard Product Price.
Tier Product Price.
Example Quantity Total.

Important:
Editing tier affects future orders only.

SCREEN S-038: Order Discount Dialog
───────────────────────────────────

Audience:
Admin / Privileged Data Entry.

Fields:
Discount Type.
Discount Value.
Optional Internal Reason.

Live Preview:
Subtotal.
Discount Amount.
Delivery Fee.
Grand Total.

Validation:
Cannot exceed eligible subtotal.
Cannot result in less than confirmed paid amount.
After first payment: Admin/SA only if discount modifies order price.

Actions:
Apply.
Cancel.

──────────────────────────────────────────────────────────────────
الفصل 23 — شاشات المصممين والتصميمات
──────────────────────────────────────────────────────────────────

SCREEN S-039: Design Management Overview
────────────────────────────────────────

Audience:
Admin / Data Entry operational view.

Sections:
Unassigned Tasks.
Designer Workload.
Designs In Progress.
Revision Requested.
Awaiting Customer Approval.
Approved Items.

Filters:
Designer.
Product Specialty.
Task State.
Date.
Order Number.

Actions:
View Task.
Assign / Reassign عند الصلاحية.
Open Designer Profile.

Data Entry:
Read-only access to customer/designer chat.
No Chat Composer.

SCREEN S-040: Designers List
────────────────────────────

Cards:
Designer Name.
Active / Inactive.
Available / On Leave / Unavailable.
Specialties.
Active Work Count.
Awaiting Approval Count.
Completed Count.

Actions:
Open Details.
Change Availability عند الصلاحية.
Manage Specialties عند الصلاحية.

SCREEN S-041: Designer Details — Management
───────────────────────────────────────────

Tabs:
Overview.
Active Tasks.
Awaiting Approval.
Completed.
Assignment History.
Availability.

Overview:
Name.
Specialties.
Status.
Active Workload.

Tasks:
Item ID.
Product.
Order.
Task State.
Last Activity.
Target Date إن وجد.

Actions:
Open Task.
Reassign.
Change Availability.

Financial:
لا تعرض هذه الشاشة مبالغ حسابات العملاء دون سبب وصلاحية.

SCREEN S-042: Assign / Reassign Designer Dialog
───────────────────────────────────────────────

Fields:
Item — selected.
Required Specialty — read only.
Candidate Designer — required.
Current Designer.
Optional Transfer Reason.

Candidate List:
Name.
Specialties.
Availability.
Active Work Count.

Validation:
Candidate active.
Candidate available.
Candidate qualified.
Order not completed/cancelled.
Assignment transition allowed.

On Reassign:
Old designer access removed.
New designer receives history.
Action audited.
Notification created.

SCREEN S-043: Designer Dashboard
────────────────────────────────

Audience:
Designer.

Tabs:
New Tasks.
In Progress.
Revision Requested.
Awaiting Approval.
Completed.

Task Card:
Order Number.
Item Number.
Product.
Customer Display Name.
Specifications Summary.
Files Count.
Messages Unread.
Last Update.
Task Status.

Actions:
Open Task.
Start Design for New Task.
Open Revision for Revision Requested.

No Pricing Fields.
No Other Designers' Tasks.

SCREEN S-044: Designer Task Details
───────────────────────────────────

Header:
Item Number.
Product.
Task Status.
Customer Name.
Last Updated.

Tabs:
Specifications.
Customer Files.
Chat.
Design Versions.
Activity.

Specifications:
Product.
Quantity.
Size.
Paper.
Material.
Color Mode.
Print Sides.
Notes.

Customer Files:
Thumbnail / Filename / Preview / Download حسب النوع.

Chat:
Realtime messages and attachments.

Design Versions:
Version cards with files and approval status.

Actions based on state:
NEW_TASK → Start Design.
IN_PROGRESS → Upload Version / Submit.
REVISION_REQUESTED → Open Feedback / Work / Submit New Version.
AWAITING_APPROVAL → View Submitted Version.
APPROVED → Read Only.

SCREEN S-045: Design Version Editor
───────────────────────────────────

Purpose:
إنشاء أو تعديل نسخة غير معتمدة.

Fields:
Version Number — generated.
Version Notes — optional.
Files — one or more images/PDFs.

Upload Components:
Add File.
Remove File.
Replace File.
Reorder Preview Files إن لزم.
Thumbnail Preview.
PDF Preview.

Required:
Version must be complete.
Every expected face/page must exist according to design context.
At least one valid preview file.

Actions:
Save Changes.
Submit for Approval.

Behavior:
Save Changes داخل النسخة غير المعتمدة لا يخلق Version Number جديدًا.
Submit after revision creates numbered Version جديدة.

Rules:
Approved Version immutable.
Audit file replacements.
No extra customer notification for silent replacement.

SCREEN S-046: Design Preview
────────────────────────────

Actors:
Customer.
Designer.
Admin authorized.

UI:
Large preview area.
Image Zoom.
PDF Page Navigation.
File / Page Counter.
Version Number.
Submission Date.
Approval State.

Customer Actions:
View.
Zoom.
Navigate.
Approve only when awaiting approval.

Not Available to Customer:
Official Preview Download Button.
Direct Public Asset URL.

Warning:
لا يمكن منع تصوير الشاشة بصورة مطلقة.

SCREEN S-047: Item Chat
───────────────────────

Layout:
Header:
Item Name.
Current Designer.
Design State.

Message List:
Sender.
Time.
Content.
Attachment Previews.
Voice Player.
Read Markers where applicable.

Composer:
Text Box.
Voice Record.
Image Upload.
PDF Upload.
Multiple Attachments.
Send.

Behavior:
Realtime update.
Scroll to latest relevant message.
Unread count.
Load older messages.
Prevent duplicate sends.

Restrictions:
If Item Approved:
Customer and Designer Composer locked.

If Order In Printing:
All item chats locked.

If Completed / Cancelled:
Read Only internally; link customer access closed.

Data Entry:
Can read but cannot send.

Admin:
يشاهد المحادثة، ويمكن تقييد المشاركة الإدارية بصلاحية
مستقلة إذا فُعّلت.

SCREEN S-048: Approve Design Dialog
───────────────────────────────────

Exact Text:

هل أنت متأكد من اعتماد التصميم؟
بعد الاعتماد، لن تتمكن من طلب تعديلات إضافية على هذا التصميم.

[رجوع]    [تأكيد الاعتماد]

Behavior:
Return → no action.
Confirm → backend checks version and files revision.
On success → item Approved, chat locked.
If all items approved → order In Printing.

SCREEN S-049: Reopen Design Dialog
──────────────────────────────────

Audience:
Admin / Super Admin.

Visible only:
Item Approved.
Order not yet In Printing.

Fields:
Reason — required.

Warning:
Approval will remain in history, but a new approval is required
before printing.

Actions:
Cancel.
Confirm Reopen.

On Success:
Item returns to active review state.
Chat unlocks.
Prior approval preserved in audit/history.

SCREEN S-050: Design History
────────────────────────────

Timeline:
Version Submitted.
Files Changed Before Approval.
Customer Messages.
Revision Requested.
Approval.
Reopen.
New Approval.
Designer Reassignment.

Details:
Actor.
Time.
Version.
File Reference.
Event Type.

Approved Files:
Immutable.
Previous versions remain accessible internally.

──────────────────────────────────────────────────────────────────
الفصل 24 — الشاشات المالية
──────────────────────────────────────────────────────────────────

SCREEN S-051: Payments List
───────────────────────────

Audience:
Admin / Accountant.

Columns:
Payment ID.
Customer.
Amount.
Method.
Date.
Recorded By.
Allocation State.
Proof.
Actions.

Filters:
Date Range.
Method.
Customer.
Employee.
Amount Range.

Actions:
View Payment.
Record Payment.
Correct Payment.
Print Receipt.

SCREEN S-052: Payment Proof Review
──────────────────────────────────

Purpose:
مراجعة إثبات رفعه العميل.

Visible:
Customer.
Order.
Claimed Amount.
Method.
Proof Image.
Submission Time.
Existing Confirmed Payments.
Order Due.

Actions:
Confirm Payment.
Reject Proof.

Confirm Preconditions:
Proof pending.
Amount positive.
Amount within allowed due.
No duplicate confirmation.

Reject Dialog:
Reason required.

On Confirm:
Create real Payment once.
Allocate to order.
Update due.
Close related Action.
Audit.

On Reject:
Status Rejected.
Reason saved.
Customer can upload new proof.

SCREEN S-053: Customer Ledger
─────────────────────────────

Audience:
Admin / Accountant.

Header:
Customer Name.
Phone.
Outstanding Due.
Refund Due.

Ledger Entries:
Date.
Order.
Entry Type.
Description.
Debit.
Credit.
Balance / Allocation Reference.

Filters:
Date.
Order.
Transaction Type.

Actions:
Open Transaction.
Record Payment.
Print Statement بحسب سياسة المستندات.
Open Order.

Rule:
Refund Due يظهر منفصلًا عن الديون المستحقة على العميل.

SCREEN S-054: Receivables List
──────────────────────────────

Purpose:
عرض مديونيات العملاء.

Columns:
Customer.
Phone.
Outstanding Amount.
Oldest Unpaid Order.
Last Payment Date.
Open Orders Count.

Filters:
Amount Range.
Last Payment Date.
Customer.
Order Age.

Actions:
Open Customer Ledger.
View Outstanding Orders.
Record Payment.

SCREEN S-055: Refunds List
──────────────────────────

Tabs:
Refund Due.
Partially Refunded.
Refunded.

Columns:
Refund Record.
Customer.
Cancelled Order.
Refund Due Original.
Paid Back.
Remaining.
Created At.
Last Payment Back.

Actions:
View Refund.
Record Refund Paid.

SCREEN S-056: Record Refund Paid Dialog
───────────────────────────────────────

Fields:
Customer — read only.
Cancelled Order — read only.
Refund Remaining — read only.
Refund Amount — required.
Refund Method — required.
Refund Date — required/default now.
Proof — optional.
Notes — optional.

Validation:
Amount > 0.
Amount <= remaining refund.
Order Cancelled.
User Admin or Accountant.

Actions:
Confirm Refund Paid.
Cancel.

Result:
Updated Remaining Refund.
Refund Receipt.
Audit Event.

SCREEN S-057: Invoice Preview
─────────────────────────────

Visible:
Print Shop Identity.
Invoice Number.
Order Number.
Customer.
Issue Date.
Itemized Products.
Quantities.
Unit Prices.
Tier-adjusted totals.
Order Discount.
Delivery Fee.
Grand Total.
Paid.
Due.
Payment Instructions if desired.

Actions:
Print.
Download PDF.

Customer:
Can download invoice.
Cannot download protected Design Preview through invoice links.

SCREEN S-058: Financial Correction Dialog
─────────────────────────────────────────

Audience:
Admin / Accountant.

Visible:
Original Transaction.
Current Allocations.
Resulting Balances.

Fields:
Corrected Amount / Metadata according to allowed correction type.
Reason — required.

Preview:
Before / After values.
Affected Orders.
Changed Due Values.

Actions:
Confirm Correction.
Cancel.

Backend:
Atomic reversal / adjustment.
Recalculate relevant allocations.
Preserve history.
Reject invalid negative balances.

──────────────────────────────────────────────────────────────────
الفصل 25 — التوصيل والتقارير والبحث
──────────────────────────────────────────────────────────────────

SCREEN S-059: Delivery Management
─────────────────────────────────

Tabs:
Ready for Pickup.
Ready for Delivery.
Out for Delivery.
Completed.

Columns:
Order Number.
Customer.
Phone.
Method.
Address when Delivery.
Status.
Ready Date.
Dispatched Date.
Actions.

Actions:
Open Order.
Mark Out for Delivery.
Complete Order.
Prepare Manual WhatsApp Message.

Rules:
Pickup → Complete.
Delivery → Out for Delivery → Complete manually or automatically.
Financial Due is not a completion blocker.

SCREEN S-060: Operational Reports
──────────────────────────────────

Reports:
- Orders by Status.
- Orders by Date.
- Design Tasks by State.
- Revisions Count.
- Designer Workload.
- Designer Completed Tasks.
- Awaiting Customer Approval.
- Printing Queue.
- Ready for Pickup.
- Delivery Status.

Filters:
Date Range.
Product.
Designer.
Order State.

Visualizations:
KPI Cards.
Bar / Line Charts when useful.
Data Tables.

Actions:
Apply Filters.
Reset Filters.
Export authorized data.

SCREEN S-061: Financial Reports
───────────────────────────────

Audience:
Admin / Super Admin / Accountant.

Reports:
- Order Value.
- Gross Collections.
- Net Collections.
- Receivables.
- Payments by Method.
- Refund Due.
- Refund Paid.
- Customer Balances.

Filters:
Date Range.
Customer.
Payment Method.
Order Status.

Important:
Each KPI must have clear calculation rules.

SCREEN S-062: Global Search
───────────────────────────

Input:
Free Text.

Supported:
Order Number.
Item Number.
Customer Name.
Phone.
Designer Name if authorized.

Results grouped:
Orders.
Customers.
Items.
Design Tasks if authorized.

Each result:
Title.
Matching Text.
Entity Type.
Status.
Open Link.

Empty:
"لم يتم العثور على نتائج مطابقة."

SCREEN S-063: Search by Image
─────────────────────────────

Header:
"البحث بالصورة".

Input Panel:
Take Photo.
Upload Image.
Image Preview.
Change Image.
Search.

Options:
Active Orders default.
Include Archived Orders toggle.

Result Card:
Thumbnail.
Similarity Rank.
Order Number.
Item Number.
Customer Name if allowed.
Order Status.
Open Order.

Loading:
"جارٍ مقارنة الصورة بالتصميمات المحفوظة..."

No Match:
"لم نعثر على مطابقة مناسبة. جرّب صورة أوضح أو البحث برقم
الأوردر أو العميل."

Error:
"تعذر إتمام البحث بالصورة حاليًا."

Security:
لا تكشف نتيجة غير مصرح بها.
صورة الاستعلام مؤقتة.
المقارنة لا تعدل بيانات أوردرات.

SCREEN S-064: Image Result Details
──────────────────────────────────

Purpose:
مراجعة نتيجة مرشحة قبل فتح الأوردر.

Visible:
Query Image small preview.
Reference Design Thumbnail.
Similarity Information.
Order and Item Summary.

Actions:
Open Item / Order.
Back to Search Results.

No Automatic Match Confirmation:
الموظف يختار النتيجة ولا يغير السيستم أوردرًا بناءً عليها.

──────────────────────────────────────────────────────────────────
الفصل 26 — شاشات الموظفين والإعدادات والتدقيق
──────────────────────────────────────────────────────────────────

SCREEN S-065: Employees List
────────────────────────────

Audience:
Admin / Super Admin.

Columns:
Employee Name.
Email.
Role.
Status.
Designer Availability if applicable.
Created At.
Last Login when available.

Actions:
Add Employee.
View Details.
Edit Staff.
Deactivate Staff.
Reset Staff Credentials according to policy.

Restrictions:
Admin cannot edit Admin or Super Admin.

SCREEN S-066: Employee Editor
─────────────────────────────

Fields:
Full Name — required.
Email — required.
Role — required/controlled.
Account Status.
Password on creation/reset.
Specialties if Designer.
Extra Permissions for eligible staff.

Actions:
Save.
Deactivate.
Reset Credentials.

Validation:
Unique Email.
Valid Role Assignment.
No unauthorized promotion.
No self privilege change.
No edit of peer Admin by Admin.

SCREEN S-067: Permissions Editor
────────────────────────────────

Layout:
Groups:
Customers.
Orders.
Requests.
Pricing.
Design.
Finance.
Reports.
Employees.
Settings.
Audit.

Each Permission:
Name.
Description.
Assigned / Not Assigned.
Fixed Role Restriction where applicable.

Header:
Employee.
Base Role.
Current Extra Permissions.

Actions:
Save Permissions.
Cancel.

Confirmation:
Show Before / After.
Actor must have authority to grant every permission.

Audit:
Record changes.

SCREEN S-068: Settings Home
───────────────────────────

Cards:
General.
Orders.
Products.
Pricing.
Payments.
WhatsApp.
Designers.
Invoices.
Files.
Security.
System.

Each Card:
Description.
Last Updated.
Open Settings.

Permission:
عرض وتعديل كل مجموعة حسب التفويض.

SCREEN S-069: General Settings
──────────────────────────────

Fields:
Print Shop Name.
Logo.
Phone.
WhatsApp Number.
Address.
Currency.
Timezone.
Language.

Actions:
Save.
Restore Unsaved Values.

Validation:
Shop Name required.
Currency valid.
Phone format valid.

SCREEN S-070: Order Settings
────────────────────────────

Fields:
Default Printing ETA.
Order Number Format.
Order Rejection Reasons.
Default Customer Message Templates.

Rules:
لا يتم تعديل قاعدة "كل البنود معتمدة قبل الطباعة" من Settings.
لا يتم إلغاء شرط Cancel Reason عبر Toggle.

SCREEN S-071: WhatsApp Settings
───────────────────────────────

Fields:
Default Notification Mode.
Integration Enabled.
Sender Account / Credentials Reference.
Message Templates.
Manual Message Preview.

Template Types:
Design Ready for Review.
Order Link Sharing.
Other approved manual customer communication.

Actions:
Save.
Test Configuration if integration is available.
Preview Template.

Security:
API credentials masked and protected.
No secret returned raw to ordinary users.

SCREEN S-072: Payment Settings
──────────────────────────────

Fields:
Enabled Payment Methods.
InstaPay Details.
Wallet Number.
Bank Transfer Details.
Customer-Facing Instructions.

Actions:
Save.
Enable / Disable Method.

Rule:
تغيير تفاصيل الدفع لا يغير السجلات المالية القديمة.

SCREEN S-073: File Settings
───────────────────────────

Fields:
Allowed Mime Types.
Per-File Max Size.
Attachment Count Limit.
Voice Recording Limit.
Retention Policy Reference.

Actions:
Save.

Security:
Backend enforces all limits independently.

SCREEN S-074: Designer Settings
───────────────────────────────

Fields:
Specialties Catalog.
Designer Availability Options.
Auto Assignment Rule Display.
Workload Calculation Rule Display.

Actions:
Manage Specialties.
Manage Availability.

Important:
لا يمكن للإدارة العادية تغيير منطق توزيع الشغل إلى توزيع
عشوائي دون تعديل واضح للمتطلبات.

SCREEN S-075: Invoice Settings
───────────────────────────────

Fields:
Invoice Header.
Logo.
Company Contact.
Document Number Prefix.
Footer Notes.
Payment Instructions.

Actions:
Preview Invoice.
Save.

SCREEN S-076: Security Settings
───────────────────────────────

Audience:
Super Admin by default.

Config:
Password Policy.
Session Expiry.
Login Rate Limits.
Customer Link Security.
Sensitive Operation Logging.
Backup / Security References.

Rule:
لا تسمح الشاشة بإيقاف حماية API أو تجاوز صلاحيات المستخدمين.

SCREEN S-077: Audit Logs
────────────────────────

Columns:
Event ID.
Actor.
Actor Role.
Entity Type.
Entity ID.
Action.
Occurred At.
Reason.
Old / New Values Indicator.

Filters:
User.
Role.
Entity.
Event Type.
Date.

Actions:
View Event Details.
Open Related Entity.
Export if authorized.

No Edit / Delete.

SCREEN S-078: Audit Event Details
─────────────────────────────────

Fields:
Event Name.
Actor.
Timestamp.
Entity Reference.
Reason.
Old Values.
New Values.
Technical Correlation ID where relevant.

Sensitive Data:
Passwords / Tokens / Secrets never logged as plain text.

──────────────────────────────────────────────────────────────────
الفصل 27 — شاشات العملاء الخارجيين
──────────────────────────────────────────────────────────────────

SCREEN S-079: Registered Customer Login
───────────────────────────────────────

Fields:
Phone Number.
Password.

Actions:
Sign In.
Forgot Password.

Validation:
Phone required.
Password required.

Error:
Wrong credentials.
Account disabled.
Too many attempts.

SCREEN S-080: Forgot Password Request
─────────────────────────────────────

Fields:
Phone Number or detected customer identity.

Actions:
Submit Recovery Request.

Result:
"تم إرسال طلب استرجاع كلمة المرور إلى المطبعة.
سيتم التواصل معك لاستلام بيانات الدخول الجديدة."

Backend:
Creates Password Recovery Action.
Does not expose whether another person's account exists
in a way that enables account enumeration.

SCREEN S-081: Customer Dashboard
────────────────────────────────

Sections:
Current Orders.
Requests Awaiting Review.
Designs Awaiting Approval.
Notifications.
Recent Completed Orders.

Quick Action:
Create Order Request.

Cards:
Order Number.
Status.
Items Count.
Date.
Open Details.

No Other Customers' Data.

SCREEN S-082: Create Order Request
──────────────────────────────────

Steps:
Products.
Specifications.
Files.
Delivery.
Review & Submit.

Fields:
Product.
Quantity.
Product Options.
Notes.
Attachments.
Pickup / Delivery.
Delivery Address if needed.

Price:
Calculated using current customer tier.

Submit:
Creates Pending Review Request.
Does not create Designer Tasks yet.

Success:
"تم إرسال طلبك للمراجعة."

SCREEN S-083: My Requests
─────────────────────────

Tabs:
Pending.
In Review.
Accepted.
Rejected.

Request Card:
Number.
Date.
Products.
Status.
Quoted Total.
Open Details.

Accepted:
Shows linked Order.
Rejected:
Shows reason.

No edit/reopen rejected request.

SCREEN S-084: My Orders
───────────────────────

Tabs:
Active.
Completed.
Cancelled.

Order Card:
Order Number.
Date.
State.
Total.
Due.
Items.
Open.

Completed Order:
Details remain visible.
Approved Previews View Only.
Chats closed.

SCREEN S-085: Customer Order Details
────────────────────────────────────

Sections:
Order Overview.
Items.
Pricing Summary.
Payment Summary.
Delivery Status.
Invoice.

During Design Stage:
Open Item Preview / Chat.
Approve Design.

During Printing:
Simplified Printing Status.

Completed:
Read Only order details and approved design viewing
for registered customers.

SCREEN S-086: Link Customer Order — Design Stage
────────────────────────────────────────────────

Access:
Private Order Link only.

Header:
Print Shop Identity.
Order Number.
Overall State.

Items Cards:
Product.
Quantity.
Design State.
Thumbnail.
Open Design & Chat.

Financial Area:
Order Total.
Paid.
Due.
Payment Details.
Upload Proof when applicable.

Contact:
Print Shop Phone.

No login.
No access to other orders.

SCREEN S-087: Link Customer — Item Review
─────────────────────────────────────────

Header:
Item Name.
Version.
Status.

Tabs / Sections:
Design Preview.
Chat.
Attachments.

Preview:
View Only.
Zoom / PDF Navigation.
Approve Design button if awaiting approval.

Chat:
Text.
Voice.
Images.
PDF.
Download ordinary chat attachments.

When Approved:
Composer locked.
Approve button removed.
Approved indicator visible.

SCREEN S-088: Customer Approval Dialog
──────────────────────────────────────

النص المعتمد حرفيًا:

هل أنت متأكد من اعتماد التصميم؟
بعد الاعتماد، لن تتمكن من طلب تعديلات إضافية على هذا التصميم.

رجوع        تأكيد الاعتماد

After approval:
Item approved.
Chat locked.
Other unapproved items remain open.

SCREEN S-089: Printing Status Page
──────────────────────────────────

Display:
"طلبك قيد الطباعة"
Order Number.
Estimated Printing Duration.
Print Shop Contact Phone.

No Design Chat Composer.
No Customer Request Revision Action.

SCREEN S-090: Ready for Pickup Page
───────────────────────────────────

Display:
"طلبك جاهز للاستلام"
Order Number.
Print Shop Name.
Shop Address.
Contact Phone.

SCREEN S-091: Ready for Delivery Page
─────────────────────────────────────

Display:
"طلبك جاهز للتوصيل"
Order Number.
Delivery State.
Contact Phone.

SCREEN S-092: Out for Delivery Page
───────────────────────────────────

Display:
"طلبك خرج للتوصيل"
Order Number.
Status.
Contact Phone.

No invented GPS tracking or real-time driver location.

SCREEN S-093: Closed Link Page
──────────────────────────────

Triggered by:
Completed.
Cancelled.
Suspended or invalid link with suitable generic wording.

Message:
"هذا الطلب لم يعد متاحًا من خلال الرابط.
للاستفسار يُرجى التواصل مع المطبعة."

Shows:
Print Shop Name.
Phone.

Does Not Show:
Order Details.
Customer Data.
Design Files.
Payment Data.
Chat.

SCREEN S-094: Customer Invoice
──────────────────────────────

Accessible:
Registered customer's own orders.
Link customer while link is valid.

Actions:
View.
Download PDF.

Restrictions:
Invoice contains no direct protected design download links.

──────────────────────────────────────────────────────────────────
الفصل 28 — التفاعلات ورسائل النظام والحالات الاستثنائية
──────────────────────────────────────────────────────────────────

28.1 States Required for Every Screen

LOADING:
عرض Skeleton أو Spinner مناسب.

EMPTY:
رسالة تشرح عدم وجود بيانات.

ERROR:
رسالة مفهومة وإمكانية Retry.

SUCCESS:
تأكيد العملية.

FORBIDDEN:
عدم الوصول إلى الوظيفة.

STALE:
البيانات تغيرت أثناء فتح الصفحة؛ يجب Refresh قبل إجراء حساس.

28.2 Form Validation

Frontend:
تحقق سريع لتقليل الأخطاء.

Backend:
المرجع النهائي للتحقق.

مثال:
يظهر Frontend أن Amount يجب ألا يتجاوز 500 جنيه.
لو كانت هناك دفعة أخرى تمت في نفس اللحظة، يعيد Backend
حساب المتبقي ويمنع تسجيل مبلغ زائد.

28.3 Double Submit

عند الضغط على:
- Create Order.
- Accept Request.
- Approve Design.
- Record Payment.
- Record Refund.
- Complete Order.

يُعطل الزر مؤقتًا حتى تصل النتيجة.
لكن هذا وحده لا يكفي؛ Backend يستخدم Idempotency.

28.4 Optimistic / Concurrency Feedback

إذا عدّل موظف بيانات تغيرت بواسطة موظف آخر:
تظهر رسالة تشرح أن البيانات تغيرت ويجب مراجعة النسخة الحالية.

لا يتم الكتابة فوق تغييرات الآخرين بصمت.

28.5 Error Copy Examples

"لا يمكن حفظ الأوردر بدون بند واحد على الأقل."

"الكمية أقل من الحد الأدنى المسموح لهذا المنتج."

"ليس لديك صلاحية تعديل السعر بعد تسجيل أول دفعة."

"قيمة الدفعة أكبر من المبلغ المتبقي."

"التصميم تم اعتماده ولا يمكن تعديل هذه النسخة."

"لا يمكن إعادة فتح التصميم بعد بدء الطباعة."

"هذا الطلب قيد المراجعة بواسطة موظف آخر."

"يجب كتابة سبب الإلغاء."

"لا يوجد مصمم متاح يطابق تخصص هذا المنتج."

"تغيّرت ملفات التصميم منذ فتح المعاينة. راجع النسخة المحدثة
قبل الاعتماد."

28.6 Responsive Behavior

Desktop:
Sidebar + Main Content + Tables.

Tablet:
Collapsible Sidebar + Condensed Tables.

Mobile:
Drawer Navigation.
Cards instead of wide tables.
Sticky primary action when useful.
Full-screen modals for complex forms.
Comfortable chat composer and voice recorder.

28.7 Visual Separation of Financial Information

Customer Due:
يمكن إظهاره للـData Entry في سياق الخدمة والتحصيل.

Full Ledger:
Admin / Accountant only.

Shop-Wide Revenue:
Admin / Super Admin / Accountant according to view.

Designer:
No order pricing.

28.8 Content Design

كل زر يوصل إلى فعل واضح.
يُفضّل استخدام "إتمام الطباعة" بدل كلمة عامة مثل "تحديث".
ويُفضّل استخدام "تسجيل دفعة" بدل "إضافة".
ويُفضّل استخدام "اعتماد التصميم" بدل "موافق" بدون سياق.

══════════════════════════════════════════════════════════════════
══════════════════════════════════════════════════════════════════
القسم الرابع: TECHNICAL ARCHITECTURE
══════════════════════════════════════════════════════════════════

الفصل 29 — المعمارية العامة للنظام
──────────────────────────────────────────────────────────────────

29.1 الهدف الهندسي

بناء نظام:
- سهل التطوير والصيانة.
- قابل للتوسع مع زيادة عدد الأوردرات والملفات.
- يحافظ على دقة البيانات المالية.
- يحمي تصميمات العملاء.
- يدعم محادثات وإشعارات لحظية.
- ينفذ الصلاحيات بدقة.
- لا يضيف تعقيد Microservices غير ضروري.

29.2 Architectural Style

[تصميم تنفيذي]
Modular Monolith هو الاختيار المبدئي المناسب.

تطبيق Backend واحد منظم داخليًا إلى Modules واضحة،
مع فصل المسؤوليات والعلاقات بين المكونات.

Modules:
- Identity & Access.
- Employees.
- Customers.
- Catalog.
- Pricing.
- Orders.
- Order Requests.
- Design & Assignment.
- Chat.
- Files.
- Printing & Delivery.
- Payments & Ledger.
- Refunds.
- Notifications & Actions.
- Search.
- Image Search.
- Reports.
- Settings.
- Audit.

29.3 Architecture Layers

Presentation Layer:
Web UI / Customer Portal.

API Layer:
Routes / Controllers / Request Validation.

Application Layer:
Use Cases / Services / Commands.

Domain Layer:
Entities / Business Rules / State Machines.

Persistence Layer:
Repositories / Database.

Infrastructure Layer:
Object Storage / Queue / Realtime / WhatsApp / PDF / Image Index.

29.4 تقنيات ممكنة دون تثبيت إطار إلزامي

Frontend:
React أو Vue مع TypeScript.

Backend:
Laravel أو NestJS أو إطار Backend ناضج مكافئ.

Database:
PostgreSQL مفضل للعلاقات والمعاملات المالية.

Queue:
Redis-backed queue أو بديل موثوق.

Realtime:
WebSockets / Server Events حسب الإطار المختار.

Object Storage:
Private S3-compatible storage.

Image Search:
Image Embeddings + Vector Index / Search Engine.

الاختيار النهائي للتقنيات يجب أن يكون موحدًا مع خبرة فريق التطوير
ومتطلبات النشر والاستضافة، ولا يغير منطق المشروع.

29.5 Request Lifecycle

Browser:
User Action.

Frontend:
Client Validation + Request.

API:
Authentication + Authorization.

Application Service:
Business Rules.

Database Transaction:
Commit Business State.

Domain Event:
Emit event after successful commit.

Async Workers:
Notifications / Image Index / PDF Generation.

Frontend:
Receive Response + Realtime Update.

29.6 Source of Truth

Database هي مصدر الحقيقة للحالات والمدفوعات والاعتمادات.

Frontend Cache ليست مصدر الحقيقة.

Realtime Event لا يثبت حدوث العملية وحده.

Storage Object لا يُعتبر ملفًا تابعًا للأوردر حتى يُسجل
الربط الخاص به بنجاح.

29.7 Transaction Boundary Examples

Create Order:
إنشاء Order + Items + Pricing Snapshot + Initial Activity
في معاملة منطقية متسقة.

Approve Design:
التحقق من النسخة + تثبيت الاعتماد + تحديث حالة البند
+ فحص شرط اكتمال كل البنود + انتقال الأوردر للطباعة،
كعملية متسقة.

Record Payment:
إنشاء Payment + تخصيص Allocations + تحديث الأرصدة
بصورة متسقة.

Cancel Order:
تغيير الحالة + إلغاء الذمم المتبقية + إثبات Refund Due
+ إقفال الوصول، دون اختلاف مالي.

29.8 Failure Isolation

إذا فشل إرسال إشعار WhatsApp:
لا يتراجع إنشاء الأوردر الصحيح.

إذا فشل بناء Image Search Index:
لا يفشل رفع ملف العميل أو التصميم.

إذا انقطع WebSocket:
تظل الرسالة المحفوظة موجودة.

إذا فشل توليد PDF:
تظل الفاتورة أو الحركة المالية محفوظة ويمكن إعادة التوليد.

──────────────────────────────────────────────────────────────────
الفصل 30 — مواصفات Frontend
──────────────────────────────────────────────────────────────────

30.1 مسؤولية Frontend

Frontend مسؤول عن:
- عرض البيانات الصحيحة للمستخدم المناسب.
- توفير واجهات إنشاء وتعديل السجلات.
- تنفيذ التنقل بين الشاشات.
- التحقق الأولي من إدخالات المستخدم.
- التعامل مع حالات Loading / Error / Empty / Success.
- حماية تجربة المستخدم من الضغط المكرر.
- دعم المحادثات الحية.
- إدارة رفع الملفات والـPreview.
- تنفيذ Responsive Layout.
- دعم العربية وRTL.
- عدم كشف واجهات أو بيانات غير مصرح بها.

Frontend لا يقرر وحده:
- هل المستخدم مخول ماليًا؟
- هل يمكن بدء الطباعة؟
- هل المبلغ يتجاوز المستحق؟
- هل النسخة قابلة للاعتماد؟
- هل يجوز إلغاء الأوردر؟

هذه قرارات Backend.

30.2 Frontend Architecture

[تصميم تنفيذي]

اقتراح تقسيم المشروع:

src/
  app/
    routes/
    layouts/
    providers/
  features/
    auth/
    dashboard/
    orders/
    order-requests/
    customers/
    catalog/
    pricing/
    design/
    chat/
    accounting/
    delivery/
    notifications/
    actions/
    search/
    image-search/
    employees/
    settings/
    reports/
  components/
    ui/
    forms/
    tables/
    dialogs/
    status/
    files/
  services/
    api/
    realtime/
    upload/
  hooks/
  stores/
  types/
  utils/
  i18n/
  styles/

الهدف هو فصل Feature Components بدل وضع المشروع في مجموعة
صفحات كبيرة يصعب صيانتها.

30.3 Layouts

StaffLayout:
Sidebar + Header + Main Content.

DesignerLayout:
Simplified Tasks Navigation.

AccountantLayout:
Financial Navigation.

CustomerPortalLayout:
Customer Navigation.

LinkCustomerLayout:
Minimal, order-specific interface.

AuthLayout:
Login / Password Recovery.

30.4 Route Guards

كل Route تحتوي متطلبات وصول واضحة.

Example:
Admin Customers Route:
customers.view

Pricing Editor:
products.manage / pricing.tiers.manage

Financial Ledger:
customers.view_ledger

Designer Task Route:
design.tasks.view_own + ownership validation.

UI Guard يوجّه المستخدم بشكل مناسب.
لكن Backend يعيد Authorization Check لكل Request.

30.5 Server State Management

[تصميم تنفيذي]
استخدام مكتبة منظمة لإدارة Server State مثل TanStack Query
أو بديل مناسب للتقنية المختارة.

Data Examples:
orders.list.
orders.details(id).
customers.details(id).
designer.tasks(state).
payments.list(filters).

Benefits:
- Query caching.
- Request deduplication.
- Refetch.
- Loading / error states.
- Invalidation after mutation.

30.6 Form Management

لكل فورم:
- Default Values.
- Validation Schema.
- Dirty State.
- Submission State.
- Server Errors.
- Reset / Cancel Behavior.

Create Order Wizard:
State يستمر بين الخطوات.
لا يُفقد عند الرجوع خطوة.
يمكن الاحتفاظ مؤقتًا بمحتوى Draft داخل المتصفح أثناء الجلسة
مع مراعاة خصوصية الملفات والبيانات.

30.7 Client-Side Pricing Preview

يسمح Frontend بحساب معاينة سعر فورية.

لكن عند Create / Update:
يرجع Backend السعر النهائي المحسوب بالقواعد المحفوظة.

إذا اختلف السعر:
تعرض الواجهة الفرق قبل اعتماد عملية إنشاء الأوردر أو تعديلها.

لا تُرسل الواجهة Grand Total باعتباره حقيقة مالية موثوقة.

30.8 File Upload UX

States:
Selected.
Validating.
Uploading.
Processing.
Uploaded.
Failed.
Removed.

Requirements:
- Drag & Drop على Desktop.
- File Picker على Mobile.
- Camera capture عند Search by Image.
- Progress indicator.
- Retry when safe.
- Validation type/size.
- Thumbnail.
- Error details.
- منع Submit مع ملف مطلوب لم يكتمل رفعه.

30.9 Chat Frontend

Components:
MessageList.
MessageBubble.
AttachmentPreview.
VoiceRecorder.
AudioPlayer.
ChatComposer.
UnreadIndicator.
ConnectionStatus.

Behavior:
- Realtime messages.
- Pagination للرسائل القديمة.
- Optimistic message display بحالة Pending.
- تأكيد Server عند الحفظ.
- Retry عند فشل إرسال الرسالة.
- عدم إرسال نفس الرسالة مرتين بعد إعادة الاتصال.

30.10 Design Preview Frontend

Requirements:
Images:
Zoom.
Pan where useful.
Responsive fit.

PDF:
Page navigation.
Zoom.
Page indicator.

Version:
Number.
Submitted time.
File ordering.
Approval status.

Security UX:
No Download Button for customer.
No exposed direct public file URL.
No misleading claim of preventing screenshots.

30.11 Permissions in Components

يمكن استخدام:
Can(permission)
CanViewOrder(order)
CanEditOrder(order)
CanApproveDesign(item)
CanCorrectPayment(payment)

لكن هذه مجرد UI helpers.
الـBackend يظل المرجع النهائي.

30.12 Frontend Error Handling

HTTP 400:
Invalid request.

HTTP 401:
Unauthenticated → Login.

HTTP 403:
No Permission → Forbidden message.

HTTP 404:
Not found / inaccessible resource.

HTTP 409:
Business or concurrency conflict.

HTTP 422:
Validation errors.

HTTP 429:
Rate limit.

HTTP 500:
Unexpected server error.

تُعرض رسائل عربية مفهومة.

30.13 Date & Money Display

Money:
Amount + EGP.

Storage/API:
Numeric minor units أو decimal واضح متفق عليه.

Date:
تاريخ ووقت وفق المنطقة الزمنية للمطبعة.

يجب عدم استخدام حسابات Floating Point غير مضبوطة
في العمليات المالية.

30.14 Realtime Event Handling

عند:
new_message.
task_assigned.
task_reassigned.
version_submitted.
design_approved.
notification_created.
action_completed.
order_status_changed.
payment_recorded.

Frontend:
- يجلب أو يحدث البيانات المتأثرة.
- لا يفترض تنفيذ حركة مالية من حدث Socket فقط.
- يتحقق من صلاحية المستخدم الحالية.

30.15 Frontend Testing

- Component Tests.
- Form Validation Tests.
- Route Guard Tests.
- Integration Tests.
- E2E Customer Journeys.
- Responsive Tests.
- RTL Tests.
- Accessibility Checks.

30.16 Definition of Done للـFrontend Screen

لا تعتبر الشاشة مكتملة إلا إذا:
- تعرض البيانات الحقيقية من API.
- تحترم الصلاحيات.
- تدعم Loading / Empty / Error.
- تدعم Desktop / Mobile.
- تعرض Validation واضحًا.
- تنفذ الأزرار بشكل صحيح.
- تتعامل مع التزامن وتحديث البيانات.
- لا تكشف حقولًا ممنوعة.
- يوجد اختبار مناسب للوظائف المهمة.

──────────────────────────────────────────────────────────────────
الفصل 31 — مواصفات Backend
──────────────────────────────────────────────────────────────────

31.1 مسؤولية Backend

Backend مسؤول عن:
- Authentication.
- Authorization.
- Business State Machines.
- Price Calculation.
- Order Transactions.
- Designer Auto Assignment.
- Version Approval Integrity.
- Chat Persistence.
- Payment Allocation.
- Refund Liability.
- Invoice Generation.
- Link Security.
- Notifications / Actions.
- Audit.
- Reporting.
- Image Search Index and Query.
- Scheduled Automation.

31.2 Layer Separation

Controller:
تحويل HTTP Request إلى Use Case مناسب.

Request Validator:
التحقق من الصيغة والحقول.

Authorization Policy:
التحقق من الدور ونطاق الوصول.

Application Service:
تنسيق العملية.

Domain Service:
حساب قاعدة العمل.

Repository:
قراءة وحفظ البيانات.

Event Handler:
تشغيل الإجراءات اللاحقة.

31.3 Business Services المطلوبة

CustomerService.
CustomerAccessService.
PasswordRecoveryService.
ProductCatalogService.
PricingService.
OrderService.
OrderRequestService.
AssignmentService.
DesignerTaskService.
DesignVersionService.
ApprovalService.
ChatService.
PrintingService.
DeliveryService.
PaymentService.
PaymentAllocationService.
RefundService.
InvoiceService.
NotificationService.
ActionService.
OrderLinkService.
ImageSearchService.
ReportingService.
AuditService.
SettingsService.

31.4 OrderService

CreateOrder(command):
1. Authorize creator.
2. Validate customer.
3. Validate items.
4. Calculate pricing from catalog snapshots.
5. Validate delivery.
6. Create order transaction.
7. Create item snapshots.
8. Record audit.
9. Commit.
10. Dispatch assignment events.

UpdateOrder(command):
1. Load with concurrency protection.
2. Authorize actor.
3. Validate current status.
4. Check payment-sensitive pricing rule.
5. Ensure approved design integrity.
6. Recalculate price safely.
7. Record old/new values.
8. Commit.

CancelOrder(command):
1. Admin/SA only.
2. Verify not Completed.
3. Require reason.
4. Lock affected finance records.
5. Calculate confirmed allocated payments.
6. Remove outstanding receivable for order.
7. Create Refund Due obligation.
8. Mark Cancelled.
9. Revoke external link.
10. Close chats/tasks.
11. Audit and commit.

31.5 PricingService

Inputs:
Product pricing snapshot.
Selected Options.
Quantity.
Customer Tier.
Order Discount.
Delivery Fee.

Outputs:
Base Unit Price.
Option Unit Additions.
Tier Adjustment.
Final Unit Price.
Item Total.
Subtotal.
Discount Amount.
Delivery Fee.
Grand Total.

Rules:
- Decimal-safe arithmetic.
- MOQ enforcement.
- No negative totals.
- Percentage bounded.
- Correct tier mode.
- No repricing historical orders.
- No final price below paid amount.

31.6 AssignmentService

Inputs:
Order Item.
Required Specialty.

Algorithm:
Get active designers matching specialty and availability.
Compute active workload.
Choose least loaded qualified designer.
If none:
Leave Unassigned.
Create Action.
Else:
Assign Designer.
Create Notification.
Audit.

Manual Reassign:
Authorization.
Validate destination designer.
Remove prior active access.
Assign new user.
Preserve history.
Audit.

31.7 DesignVersionService

CreateVersion:
Allowed assigned designer.
Allowed item state.
Complete preview manifest.
Generate next version number.

ReplaceUnapprovedFile:
Verify version not approved.
Update file manifest.
Increment revision counter.
Write audit.

SubmitForApproval:
Verify version files are valid and complete.
Update item Awaiting Approval.
Create customer notification path.

31.8 ApprovalService

Approve(item, version, manifest_revision, actor):
1. Validate customer access to item.
2. Lock item row.
3. Verify item Awaiting Approval.
4. Verify selected version is current.
5. Verify manifest revision.
6. Save approval record.
7. Mark item Approved.
8. Lock item chat.
9. Check all active order items.
10. If all approved → order In Printing.
11. Commit and publish events.

Reopen(item, reason, actor):
1. Admin/SA only.
2. Order not In Printing or later.
3. Reason required.
4. Preserve approval history.
5. Clear current active approval state without deleting record.
6. Unlock item review/chat.
7. Audit.

31.9 PaymentService

RecordPayment:
- Authorize.
- Validate amount/method/customer.
- Lock balances to prevent overpayment.
- Create payment.
- Allocate targeted or FIFO.
- Commit with audit.
- Generate receipt reference.

CorrectPayment:
- Admin/Accountant only.
- Reason required.
- Preserve original financial history.
- Recalculate impacted allocations.
- Validate no invalid balance.
- Commit with audit.

31.10 PaymentAllocationService

Targeted:
Allocate only to chosen order up to due.

General:
Get oldest eligible outstanding orders.
Sort by order date and stable ID.
Allocate to each until payment amount exhausted.
Reject remainder if positive and no due remains.

Invariant:
Sum allocations == confirmed applicable payment amount
for payments fully applied under current no-credit policy.

31.11 RefundService

OnCancellation:
Calculate eligible paid amount of cancelled order.
Create Refund Obligation.

RecordRefund:
Authorize Admin/Accountant.
Validate actual payment back.
Check remaining refundable balance.
Create Refund Payout.
Update remaining liability.
Generate refund receipt.
Audit.

Invariant:
Sum Refund Payouts <= Refund Obligation.

31.12 OrderRequestService

StartReview:
Atomic claim if state Pending Review.

Accept:
Only claimed reviewer.
Validate final data.
Create order exactly once.
Mark request Accepted.
Link resulting order.

Reject:
Only claimed reviewer.
Reason required.
Mark Rejected.

31.13 ActionService

CreateAction:
Use unique event/entity/business key when appropriate.

ClaimAction:
Atomic compare-and-set.

CompleteAction:
Verify required business operation succeeded.
Set completed_by and completed_at.

Do not complete action merely when Notification is read.

31.14 LinkService

Generate random access token.
Store securely, preferably hash of token.
Return raw token only through authorized workflow.
Validate Active state and order lifecycle.
Regenerate → revoke prior token.
Suspend → deny access temporarily.
Complete/Cancel → permanently close.

31.15 Backend Testing

Unit:
Pricing rules.
State transition rules.
Allocation.
Refund math.
Specialty assignment.

Integration:
Database transactions.
Concurrent writes.
File metadata.
Event outbox.
Authorization.

E2E:
Customer and employee workflows.

Security:
Cross-account access.
Expired links.
Role escalation.
Replay attacks.
Double submits.

──────────────────────────────────────────────────────────────────
الفصل 32 — نموذج البيانات والعلاقات
──────────────────────────────────────────────────────────────────

32.1 ملاحظات تصميم البيانات

[تصميم تنفيذي]

الأسماء التالية Logical Schema.
يمكن تحويلها إلى جداول فعلية في PostgreSQL.

كل جدول تشغيلي يحتاج عند الحاجة:
id.
created_at.
updated_at.
created_by.
status.
version / concurrency counter.

لا نستخدم Soft Delete بشكل عشوائي للسجلات المالية أو التاريخية.

32.2 Users

users:
id UUID / BIGINT.
full_name.
email unique.
password_hash.
role_id.
status ACTIVE / INACTIVE.
last_login_at.
created_at.
updated_at.

32.3 Roles

roles:
id.
code.
name.
is_system_role.

codes:
SUPER_ADMIN.
ADMIN.
DATA_ENTRY.
DESIGNER.
ACCOUNTANT.

32.4 Permissions

permissions:
id.
code unique.
description.
module.

role_permissions:
role_id.
permission_id.

user_permission_overrides:
user_id.
permission_id.
granted.
granted_by.
granted_at.

32.5 Customers

customers:
id.
name.
phone_normalized.
phone_display.
address.
pricing_tier_id.
platform_access_enabled.
notification_mode.
notes.
created_by.
created_at.
updated_at.

Index:
phone_normalized.

Phone uniqueness:
يجب تحديد سياسة واضحة لو العميل يستخدم أكثر من رقم.
النسخة الأساسية تتعامل مع رقم رئيسي واحد مميز.

32.6 Customer Credentials

customer_credentials:
customer_id.
password_hash.
status.
password_created_at.
last_reset_at.
last_login_at.
session_version.

Raw password never stored.

32.7 Password Recovery Requests

password_recovery_requests:
id.
customer_id.
status.
claimed_by nullable.
claimed_at nullable.
completed_by nullable.
completed_at nullable.
created_at.

32.8 Product Categories

product_categories:
id.
name.
sort_order.
is_active.

32.9 Products

products:
id.
category_id.
name.
description.
base_unit_price.
minimum_quantity.
required_specialty_id nullable.
is_active.
created_at.
updated_at.

32.10 Option Groups

product_option_groups:
id.
product_id.
code.
name.
selection_type.
is_required.
sort_order.
is_active.

32.11 Option Values

product_option_values:
id.
option_group_id.
name.
unit_price_addition.
sort_order.
is_active.

32.12 Pricing Tiers

pricing_tiers:
id.
name.
mode PERCENTAGE / FIXED_BASE.
discount_percentage nullable.
is_active.

32.13 Tier Product Prices

tier_product_prices:
id.
tier_id.
product_id.
base_unit_price_override.

Constraint:
Unique (tier_id, product_id).

32.14 Designer Specialties

designer_specialties:
id.
name.
is_active.

designer_specialty_memberships:
designer_id.
specialty_id.

designer_availability:
designer_id.
status.
updated_at.
updated_by.

32.15 Order Requests

order_requests:
id.
request_number unique.
customer_id.
status.
submitted_snapshot.
final_review_snapshot.
reviewed_by nullable.
reviewed_at nullable.
decision_by nullable.
decision_at nullable.
rejection_reason_code nullable.
rejection_reason_text nullable.
result_order_id nullable.
created_at.

32.16 Order Request Items

order_request_items:
id.
request_id.
product_id.
quantity.
selected_options_snapshot.
requested_unit_price_snapshot.
notes.
sort_order.

Important:
عند القبول تُنشأ Order Items جديدة ولا يضيع أصل الطلب.

32.17 Orders

orders:
id.
order_number unique.
customer_id.
source_type.
source_request_id nullable.
status.
delivery_method.
delivery_address_snapshot.
printing_eta_days nullable.
printing_eta_label nullable.
subtotal.
discount_type.
discount_value.
discount_amount.
delivery_fee.
grand_total.
created_by.
completed_at nullable.
completion_source nullable.
cancelled_at nullable.
cancelled_by nullable.
cancellation_reason nullable.
created_at.
updated_at.
row_version.

Money:
استخدام DECIMAL مضبوط أو Minor Units Integer بشكل موحد.

32.18 Order Items

order_items:
id.
order_id.
item_number.
product_id.
product_name_snapshot.
product_options_snapshot.
quantity.
base_unit_price_snapshot.
option_unit_total_snapshot.
tier_price_snapshot.
final_unit_price.
item_total.
designer_id nullable.
design_state.
approved_version_id nullable.
is_cancelled.
cancelled_at nullable.
cancel_reason nullable.
created_at.
updated_at.
row_version.

Constraints:
Unique(order_id, item_number).
quantity > 0.

32.19 Designer Assignment History

item_assignment_history:
id.
item_id.
from_designer_id nullable.
to_designer_id.
assigned_by.
reason.
created_at.

32.20 Design Versions

design_versions:
id.
item_id.
version_number.
notes.
submitted_at nullable.
submitted_by.
file_manifest_revision.
is_submitted.
is_approved.
created_at.
updated_at.

Unique(item_id, version_number).

32.21 Design Version Files

design_version_files:
id.
design_version_id.
file_id.
sort_order.
face_label nullable.
created_at.

Approved manifests should be immutable.

32.22 Design Approvals

design_approvals:
id.
item_id.
design_version_id.
manifest_revision.
approved_by_customer_id nullable.
approval_channel REGISTERED / PRIVATE_LINK / AUTHORIZED_EXCEPTION.
approved_at.
link_access_reference nullable.
is_superseded.
reopened_by nullable.
reopened_at nullable.
reopen_reason nullable.

Important:
Keep prior approval records after Reopen.

32.23 Conversations

conversations:
id.
item_id unique.
status OPEN / LOCKED.
locked_at nullable.

32.24 Messages

messages:
id.
conversation_id.
sender_type.
sender_id nullable.
message_type TEXT / VOICE / ATTACHMENT / SYSTEM.
text_body nullable.
client_message_id nullable.
sent_at.
created_at.

Index:
(conversation_id, sent_at).

Client Message ID:
يستخدم لمنع تكرار إرسال نفس الرسالة عند Retry.

32.25 Message Attachments

message_attachments:
id.
message_id.
file_id.
sort_order.

32.26 Files

files:
id.
storage_key.
original_filename.
mime_type.
size_bytes.
category.
uploaded_by_type.
uploaded_by_id.
checksum optional.
created_at.

Storage Key لا يُرسل كـPublic URL.

32.27 Order Links

order_links:
id.
order_id.
token_hash.
status ACTIVE / SUSPENDED / CLOSED.
created_at.
revoked_at nullable.
revoked_by nullable.
last_used_at nullable.

Constraint:
At most one current active access token per order where applicable.

32.28 Payments

payments:
id.
payment_number unique.
customer_id.
amount.
method.
proof_file_id nullable.
recorded_by.
recorded_at.
status CONFIRMED / ADJUSTED / REVERSED.
reference.
created_at.

32.29 Payment Allocations

payment_allocations:
id.
payment_id.
order_id.
allocated_amount.
allocation_order.
created_at.

Constraints:
allocated_amount > 0.
No over-allocation.

32.30 Financial Adjustments

payment_adjustments:
id.
payment_id.
adjustment_type.
old_amount.
new_amount.
reason.
performed_by.
created_at.

Detailed ledger entries may be used instead of mutating payment history.

32.31 Payment Proofs

payment_proofs:
id.
customer_id.
order_id.
claimed_amount.
method.
file_id.
status PENDING / CONFIRMED / REJECTED.
reviewed_by nullable.
reviewed_at nullable.
rejection_reason nullable.
linked_payment_id nullable.
submitted_at.

32.32 Refund Obligations

refund_obligations:
id.
order_id.
customer_id.
original_refundable_amount.
status DUE / PARTIALLY_PAID / PAID.
created_at.

32.33 Refund Payouts

refund_payouts:
id.
refund_obligation_id.
amount.
method.
payout_date.
proof_file_id nullable.
notes.
recorded_by.
created_at.

32.34 Invoices

invoices:
id.
invoice_number unique.
order_id.
document_snapshot.
issued_at.
issued_by.
pdf_file_id nullable.
status.

32.35 Receipts

receipts:
id.
receipt_number unique.
type PAYMENT / REFUND.
payment_id nullable.
refund_payout_id nullable.
document_snapshot.
issued_at.
pdf_file_id nullable.

32.36 Notifications

notifications:
id.
recipient_type.
recipient_id.
event_type.
title.
body.
entity_type.
entity_id.
read_at nullable.
created_at.

32.37 Actions

actions:
id.
action_type.
entity_type.
entity_id.
title.
status.
claimed_by nullable.
claimed_at nullable.
completed_by nullable.
completed_at nullable.
outcome nullable.
dedupe_key nullable.
created_at.

Unique index on dedupe_key where present.

32.38 Audit Logs

audit_logs:
id.
actor_type.
actor_id.
actor_role_snapshot.
entity_type.
entity_id.
action.
old_values_json.
new_values_json.
reason.
correlation_id.
created_at.

Append-only at application level.

32.39 Settings

settings:
id.
group.
key.
value_json.
updated_by.
updated_at.

لا تخزن API Secrets بنص صريح في إعدادات عادية.
تُستخدم آلية Secrets آمنة.

32.40 Image Search References

image_search_references:
id.
file_id.
order_id.
item_id.
reference_type.
preview_file_id nullable.
embedding_vector_reference.
index_status.
indexed_at nullable.
created_at.

32.41 Image Search Jobs

image_index_jobs:
id.
file_id.
status.
attempts.
last_error_code.
created_at.
updated_at.

32.42 Database Indexes

Important Indexes:
orders(order_number).
orders(customer_id, created_at).
orders(status, created_at).
order_items(order_id).
order_items(designer_id, design_state).
customers(phone_normalized).
payment_allocations(order_id).
payments(customer_id, recorded_at).
actions(status, created_at).
messages(conversation_id, sent_at).
order_requests(status, submitted_at).
design_versions(item_id, version_number).
audit_logs(entity_type, entity_id, created_at).

32.43 Database Constraints

يجب ألا تعتمد صحة البيانات على API Logic وحده.

Examples:
Positive amounts.
Unique order numbers.
Valid foreign keys.
No duplicate accepted request orders.
Valid payment allocations.
No refund payouts exceeding due.
Non-null required fields.
No duplicate version number within item.

32.44 Data Migration

إذا كان هناك نظام قديم أو ملفات Excel مستقبلًا:
Import Customer.
Import Orders.
Import Outstanding Balances.

لكن الاستيراد يجب أن يميز بين:
Imported Historical Data.
Live Operational Transactions.

ولا يُفترض أن هذه الوظيفة موجودة في V1 ما لم تُحدد بيانات فعلية للاستيراد.

──────────────────────────────────────────────────────────────────
الفصل 33 — تصميم واجهات API
──────────────────────────────────────────────────────────────────

33.1 API Guidelines

[تصميم تنفيذي]

Base URL:
 /api/v1

Authentication:
Authenticated staff/customer session حسب الواجهة.

Response Format:
Consistent JSON envelopes.

Pagination:
page / per_page أو cursor عند الحاجة.

Filtering:
query parameters واضحة.

Errors:
HTTP Status + stable error code + Arabic display message.

Audit:
Sensitive operations include actor server-side.

Idempotency:
Keys on financially or operationally critical POST requests.

33.2 Response Envelope — Logical Contract

Success:
success: true.
data: object or list.
meta: pagination / totals when relevant.

Failure:
success: false.
error:
  code.
  message.
  field_errors optional.
  correlation_id optional.

33.3 Authentication APIs

POST /staff/auth/login
POST /staff/auth/logout
GET  /staff/auth/me
GET  /staff/auth/permissions

POST /customer/auth/login
POST /customer/auth/logout
GET  /customer/auth/me
POST /customer/password-recovery-requests

Behavior:
Distinct guards and scopes for employee and customer interfaces.

33.4 Customers APIs

GET    /customers
POST   /customers
GET    /customers/{id}
PATCH  /customers/{id}
GET    /customers/{id}/orders
GET    /customers/{id}/financial-summary
GET    /customers/{id}/ledger

POST   /customers/{id}/platform-access/enable
POST   /customers/{id}/platform-access/disable
POST   /customers/{id}/password-reset

GET    /password-recovery-requests
POST   /password-recovery-requests/{id}/claim
POST   /password-recovery-requests/{id}/complete

Authorization:
Ledger requires finance permission.
Password reset requires dedicated permission.

33.5 Products APIs

GET    /products
POST   /products
GET    /products/{id}
PATCH  /products/{id}
POST   /products/{id}/deactivate
POST   /products/{id}/activate

GET    /product-categories
POST   /product-categories

GET    /products/{id}/options
POST   /products/{id}/options
PATCH  /product-options/{id}

GET    /pricing-tiers
POST   /pricing-tiers
PATCH  /pricing-tiers/{id}

POST   /pricing/quote

Pricing Quote Input:
Customer ID / Tier.
Items array.
Product ID.
Selected Options.
Quantity.
Discount if authorized.
Delivery Fee.

Pricing Quote Output:
Item unit prices.
Tier adjustments.
Subtotal.
Discount.
Grand total.
Validation messages.

Important:
Quote is not automatically a confirmed invoice or stored order.

33.6 Order Request APIs

GET  /order-requests
POST /customer/order-requests
GET  /order-requests/{id}
POST /order-requests/{id}/start-review
PATCH /order-requests/{id}/review-details
POST /order-requests/{id}/accept
POST /order-requests/{id}/reject

Accept Request:
Requires claimed reviewer.
Requires idempotency.
Returns linked order ID.

Reject:
Requires reason.

33.7 Orders APIs

GET   /orders
POST  /orders
GET   /orders/{id}
PATCH /orders/{id}

GET   /orders/{id}/items
POST  /orders/{id}/items
PATCH /orders/{id}/items/{itemId}
POST  /orders/{id}/items/{itemId}/cancel

POST  /orders/{id}/complete-printing
POST  /orders/{id}/out-for-delivery
POST  /orders/{id}/complete
POST  /orders/{id}/cancel

GET   /orders/{id}/activity
GET   /orders/{id}/files
GET   /orders/{id}/invoice
GET   /orders/{id}/job-ticket

State transition restrictions enforced server-side.

33.8 Order Link APIs

POST /orders/{id}/link/suspend
POST /orders/{id}/link/reactivate
POST /orders/{id}/link/regenerate
GET  /orders/{id}/link/status

Customer Link Routes:
GET  /public/order/{token}
GET  /public/order/{token}/items/{itemId}
POST /public/order/{token}/items/{itemId}/approve

Note:
Actual sensitive token handling may use secure path token/session exchange.
Never trust order ID alone as authorization for link access.

33.9 Designer APIs

GET  /designers
GET  /designers/{id}/workload
GET  /designer/tasks
GET  /designer/tasks/{itemId}
POST /designer/tasks/{itemId}/start

POST /items/{itemId}/assign-designer
POST /items/{itemId}/reassign-designer

POST /items/{itemId}/versions
GET  /items/{itemId}/versions
GET  /items/{itemId}/versions/{versionId}
PATCH /items/{itemId}/versions/{versionId}
POST /items/{itemId}/versions/{versionId}/submit

POST /items/{itemId}/reopen-design

Ownership check for designer task routes.

33.10 Chat APIs

GET  /items/{itemId}/messages
POST /items/{itemId}/messages
GET  /items/{itemId}/chat-status

Message fields:
client_message_id.
type.
text.
attachments.

Server validates:
User belongs to allowed conversation.
Chat is open.
Attachment type/size allowed.

Realtime:
Authorized per-conversation channels.

33.11 Upload APIs

POST /files/uploads/prepare
POST /files/uploads/complete
GET  /files/{id}/preview
GET  /files/{id}/download

Upload Prepare:
Authenticate.
Authorize target entity.
Validate intended category and mime/size.

Upload Complete:
Validate actual uploaded file.
Store metadata.
Bind to allowed entity.

Preview / Download:
Different permissions.
No arbitrary public file URLs.

33.12 Accounting APIs

GET  /payments
POST /payments
GET  /payments/{id}
POST /payments/{id}/correct

GET  /payment-proofs
GET  /payment-proofs/{id}
POST /payment-proofs/{id}/confirm
POST /payment-proofs/{id}/reject

GET  /customers/{id}/ledger
GET  /receivables

GET  /refunds
GET  /refunds/{id}
POST /refunds/{id}/payouts

GET  /invoices/{id}
GET  /receipts/{id}

Payment Create Input:
customer_id.
scope.
order_id when targeted.
amount.
method.
date.
proof_file_id optional.
notes.

Response:
payment_id.
allocations.
affected_order_dues.
receipt_id.

33.13 Notifications / Actions APIs

GET  /notifications
POST /notifications/{id}/read

GET  /actions
GET  /actions/history
POST /actions/{id}/claim
POST /actions/{id}/complete

Complete Action:
Business-specific validation before marking complete.

33.14 Reports APIs

GET /reports/operational/orders
GET /reports/operational/design
GET /reports/operational/delivery
GET /reports/financial/collections
GET /reports/financial/receivables
GET /reports/financial/refunds

Query:
from.
to.
filters.

Authorization:
Financial reports strictly restricted.

33.15 Search APIs

GET  /search/global?q=...
POST /search/image

Image Search Input:
Image file or temporary upload reference.
include_archived boolean.

Output:
results:
  item_id.
  order_id.
  thumbnail.
  similarity_rank.
  similarity_score optional.
  accessible metadata.

33.16 Settings APIs

GET   /settings/{group}
PATCH /settings/{group}

Dedicated endpoints may exist for:
Product Categories.
Rejection Reasons.
Designer Specialties.
Payment Methods.
WhatsApp Templates.

33.17 Employees / Permissions APIs

GET   /employees
POST  /employees
GET   /employees/{id}
PATCH /employees/{id}
POST  /employees/{id}/deactivate
POST  /employees/{id}/activate

GET   /permissions
GET   /employees/{id}/permissions
PUT   /employees/{id}/permissions

Admin-specific operations:
Separate policy or endpoints requiring Super Admin.

33.18 Audit APIs

GET /audit-logs
GET /audit-logs/{id}

No public mutation endpoint for editing audit records.

33.19 API Contract Requirements

Each endpoint must document:
- Method.
- Path.
- Authentication.
- Required Permissions.
- Ownership / Entity Scope.
- Input Schema.
- Output Schema.
- Validation.
- Business Preconditions.
- Transaction Boundary.
- Error Codes.
- Audit Events.
- Realtime Events if any.

33.20 Common Business Error Codes

CUSTOMER_ALREADY_EXISTS.
PRODUCT_INACTIVE.
QUANTITY_BELOW_MINIMUM.
INVALID_PRODUCT_OPTION.
ORDER_LOCKED_FOR_PRINTING.
ORDER_ALREADY_COMPLETED.
ORDER_CANCELLED.
REQUEST_ALREADY_CLAIMED.
REQUEST_ALREADY_DECIDED.
DESIGN_VERSION_STALE.
DESIGN_ALREADY_APPROVED.
DESIGN_REOPEN_FORBIDDEN.
INSUFFICIENT_PERMISSION.
PAYMENT_EXCEEDS_DUE.
PAYMENT_ALREADY_PROCESSED.
REFUND_EXCEEDS_DUE.
INVALID_ORDER_TRANSITION.
LINK_CLOSED.
FILE_ACCESS_DENIED.
IMAGE_SEARCH_UNAVAILABLE.

These codes should be stable so Frontend can display appropriate Arabic text.

──────────────────────────────────────────────────────────────────
الفصل 34 — Domain Events وBackground Jobs
──────────────────────────────────────────────────────────────────

34.1 Event Types

OrderCreated.
OrderRequestSubmitted.
OrderRequestReviewStarted.
OrderRequestAccepted.
OrderRequestRejected.
ItemAssigned.
ItemReassigned.
DesignStarted.
DesignVersionSubmitted.
RevisionRequested.
DesignApproved.
DesignReopened.
AllItemsApproved.
OrderPrintingStarted.
OrderPrintingCompleted.
OrderReadyForPickup.
OrderReadyForDelivery.
OrderOutForDelivery.
OrderCompleted.
OrderCancelled.
PaymentProofSubmitted.
PaymentProofConfirmed.
PaymentProofRejected.
PaymentRecorded.
PaymentCorrected.
RefundDueCreated.
RefundPaidRecorded.
CustomerPasswordRecoveryRequested.
CustomerPasswordReset.
OrderLinkRegenerated.
ActionCompleted.

34.2 Event Processing Rules

- Event must reference a committed database state.
- Duplicate delivery of event should be safe.
- Consumer retries should not duplicate financial entries.
- Failed notification does not rollback business transaction.
- Event handlers log failures without leaking customer data.

34.3 Outbox Pattern

[تصميم تنفيذي]
For critical business events:
1. Save entity changes.
2. Save corresponding outbox event in same transaction.
3. Commit.
4. Worker sends event or processes notification.
5. Mark outbox event delivered.

Benefit:
No lost notifications after successful business commit.

34.4 Scheduled Jobs

DeliveryAutoCompletionJob:
Find Out for Delivery > 24 hours.
Verify not already completed or cancelled.
Mark Completed once.
Log completion source.
Close link.

ImageIndexingJob:
Process newly uploaded reference images.
Generate embeddings.
Update image search index.

NotificationRetryJob:
Retry eligible failed automatic customer notices.

DocumentGenerationJob:
Generate or regenerate invoices/receipts safely.

BackupJob:
Create scheduled backups.

34.5 Retry Policy

Use bounded retry with backoff.
Distinguish temporary errors from permanent validation errors.
Never retry rejected business operation indefinitely.

34.6 Job Observability

For each job:
- Job ID.
- Type.
- Related Entity.
- Status.
- Attempts.
- Last Error Code.
- Started/Finished timestamps.

──────────────────────────────────────────────────────────────────
الفصل 35 — Security وFiles وRealtime والتكاملات
──────────────────────────────────────────────────────────────────

35.1 Security Principles

Least Privilege.
Server-Side Authorization.
Private File Storage.
Strong Authentication.
Audit Sensitive Actions.
No Secret Exposure.
No Trust in Client Calculations.

35.2 Staff Authentication

Email + Password.
Account must be Active.
Session expiration.
Rate-limited login.
Password hashing.
Session invalidation after deactivation.

35.3 Customer Authentication

Phone + Generated Password.
Enabled Platform Access required.
No self-service password change under approved flow.
Recovery goes through authorized staff.

35.4 Authentication Session Choice

[تصميم تنفيذي]
Prefer secure HTTP-only cookies for browser sessions when the
deployment architecture supports them.

Use:
Secure.
HttpOnly.
SameSite.
CSRF protection where relevant.
Short-lived access with controlled renewal.

Avoid exposing privileged tokens in localStorage when safer
session mechanisms are practical.

35.5 Customer Link Security

Token must be unpredictable.
Do not derive from order number or phone.

Recommended:
Store hash of link token.
Validate token against order and link state.
Revoke on Complete / Cancel.
Revoke old token on Regenerate.
Rate-limit access.
Prevent search-engine indexing.
Avoid leaking token in external referrer contexts.

35.6 File Security

Object Storage private by default.

File access:
API checks actor and parent entity permission.
Returns protected preview stream or short-lived scoped access
as appropriate.

Customer Design Preview:
Preview-only authorized channel.
No intentional download route for customer.
No public object key.

Chat Attachments:
Download allowed to customer/designer authorized participants.

35.7 File Upload Safety

Validate:
- MIME type.
- Actual file signature.
- Size.
- Allowed category.
- Entity ownership.
- Maximum count.

Optional:
Malware scanning for uploaded documents, where practical.

Never execute uploaded file content.

35.8 Realtime Security

Socket authentication.
Authorization per channel:
order-item-{id}.
user-notifications-{id}.
actions-user-{id}.

On Designer Reassignment:
Old designer must lose future access.
Realtime channel membership must be revalidated.

35.9 Audit Security

Sensitive events:
Employee rights.
Admin creation.
Pricing edits.
Cancellation.
Design approval/reopen.
Payment creation/correction.
Refund payout.
Order link regeneration.
Password reset.

Never log:
Raw passwords.
Raw secret tokens.
Complete API credentials.
Sensitive card-like data beyond operational need.

35.10 WhatsApp Integration

Manual Mode:
Prepare message.
Employee sends via WhatsApp.
Employee confirms action.

Automatic Mode:
Check integration configured.
Check customer's notification preference.
Send approved template/event.
Record provider response.

Failure:
Retry or surface manual intervention Action.

35.11 PDF Security

Invoices:
Can be downloaded by authorized customer.

Job Ticket:
Internal staff only.

Design Preview:
Never turn into unrestricted PDF download simply because
PDF rendering is implemented.

35.12 Data Retention

Keep:
Completed order details.
Approved versions.
Chat history.
Payments and refunds.
Audit Logs.

Retention duration:
Must be configured according to operational/legal requirements.
Do not silently delete business history on order completion.

──────────────────────────────────────────────────────────────────
الفصل 36 — Search by Image Architecture
──────────────────────────────────────────────────────────────────

36.1 Functional Goal

Find order items from a photo of printed work, even where:
- Lighting differs.
- Paper is photographed at an angle.
- The image is cropped.
- Printed colors vary somewhat.
- User does not know order number.

36.2 Why Normal Filename Search Is Insufficient

Input is a visual photo, not an exact filename.

Image comparison is needed.
Exact pixel comparison is not enough due to physical photography.

36.3 Recommended Pipeline

Reference Image Upload
→ Normalize / Resize
→ Create Preview
→ Generate Visual Embedding
→ Store Embedding + Item Reference
→ Index in Similarity Search Database.

Image Query
→ Validate Image
→ Normalize
→ Generate Embedding
→ Vector Similarity Search
→ Filter by Allowed Order Scope
→ Rank Candidates
→ Return Top 5–10.

36.4 PDF Handling

For PDF design previews:
Generate page thumbnails.
Index eligible pages separately or as a group.

Result should map back to the correct Order Item and Version.

36.5 Duplicated Designs

Different customers might print highly similar cards or labels.

System does not auto-select a single result.

Show multiple ranked matches and identifying metadata permitted
by user permissions.

36.6 Query Image Retention

Do not save the uploaded search photo as permanent customer file.

Temporary processing storage should expire and be cleaned.

36.7 Similarity Score

A numerical score can be displayed, but must be labeled
"درجة تشابه تقريبية" rather than guaranteed matching probability.

If the implementation's score is not calibrated, ranking is more
important than percentage.

36.8 Security Design

Query can search only the reference set permitted to the user,
or backend may search a broad index then enforce secure filtering
before exposing results.

Never send unauthorized thumbnail or metadata to client.

36.9 Performance Design

- Precompute reference embeddings.
- Keep image index updated asynchronously.
- Cache permitted metadata judiciously.
- Support background reindex.
- Provide text search fallback.

36.10 Evaluation Plan

Create test set:
Sample printed cards.
Banners.
Stickers.
Brochures.
Similar designs from different orders.

Vary:
Light.
Rotation.
Scale.
Crop.
Background.
Image quality.

Measure:
Top-1 Accuracy.
Top-5 Recall.
Top-10 Recall.
Average Query Time.
Failure Rate.

[قيد التحقق التقني]
لا يتم الوعد بدقة ثابتة قبل الاختبار على شغل المطبعة الفعلي.

──────────────────────────────────────────────────────────────────
الفصل 37 — إعدادات النظام التفصيلية
──────────────────────────────────────────────────────────────────

37.1 Settings Architecture

Settings divided by group.
Each group has:
- Keys.
- Defaults.
- Validation.
- Allowed Editor Role.
- Audit Requirement.

37.2 General

shop_name.
shop_logo_file_id.
main_phone.
whatsapp_phone.
address.
currency = EGP.
timezone = Africa/Cairo.
language = ar.
rtl = true.

37.3 Orders

default_printing_eta_label = "يوم إلى يومين".
default_printing_eta_days when explicit numeric period is used.
order_number_prefix.
rejection_reason_catalog.
customer_status_message_templates.

Fixed business rules should not become casual toggles.

37.4 Customer Notifications

default_design_notification_mode:
MANUAL or AUTOMATIC depending on configured business default.

Customer override:
SYSTEM_DEFAULT.
MANUAL.
AUTOMATIC.

Automatic requires configured provider.
If unavailable, create recoverable manual workflow rather than
silently marking notification sent.

37.5 WhatsApp

provider_enabled.
sender_reference.
design_ready_template.
order_link_template.
manual_message_template.

Credentials stored in secret management, not visible ordinary settings.

37.6 Products

categories.
materials.
paper_types.
sizes.
color_modes.
finishing_options.
specialty_mappings.

37.7 Pricing

pricing_tiers.
rounding_policy.
discount_permission_policy.
default_tier.

Rounding must be consistent between quote, order, invoice, and ledger.

37.8 Payments

enabled_methods:
CASH.
INSTAPAY.
VODAFONE_CASH.
BANK_TRANSFER.

payment_instructions.
instapay_identifier.
wallet_number.
bank_details.

37.9 Invoices

invoice_prefix.
receipt_prefix.
logo.
header.
footer.
contact_information.
notes.

37.10 Designers

specialties.
availability_statuses.
assignment_policy = MATCH_SPECIALTY_THEN_MIN_ACTIVE_WORK.
tie_breaker_policy for equal workload.

37.11 Files

allowed_mime_types.
max_size_by_file_category.
max_attachments_per_message.
voice_recording_max_size_or_duration.
retention_policy.

37.12 Security

staff_session_policy.
customer_session_policy.
login_attempt_limit.
link_access_rate_limit.
password_policy.
admin_security_controls.

37.13 Audit

audit_retention_policy.
financial_audit_immutability.
security_event_logging.
allowed_audit_export_roles.

37.14 Changes to Settings

For each sensitive setting change:
- Validate actor.
- Validate new value.
- Save version.
- Audit old/new.
- Apply new rule to future actions.

Historical orders maintain their own snapshots.

──────────────────────────────────────────────────────────────────
الفصل 38 — Logging وMonitoring وBackup
──────────────────────────────────────────────────────────────────

38.1 Types of Logs

Application Logs:
Errors and operational events.

Security Logs:
Login failures, sensitive access denials, account changes.

Audit Logs:
Business changes and who performed them.

Financial Logs:
Payments, allocations, corrections, refunds.

Job Logs:
Background processing outcomes.

38.2 Monitoring Metrics

- API Error Rate.
- API Response Time.
- Database Health.
- Queue Backlog.
- Failed Jobs.
- Chat Connection Failures.
- File Upload Failures.
- WhatsApp Delivery Failures.
- Image Indexing Failures.
- Search Latency.

38.3 Health Checks

GET /health/live
GET /health/ready

Ready check should verify critical service dependencies.

38.4 Backup

[تصميم تنفيذي]
Daily database backup as baseline.
Object storage backup / lifecycle strategy.
Encrypted backup access.
Regular restore testing.
Retention according to approved policy.

38.5 Disaster Recovery

Document:
- How to restore database.
- How to restore files.
- How to recover secrets.
- How to resume queues.
- How to verify financial integrity after recovery.
- How to verify customer links and design approval records.

38.6 Deployment Environments

Development.
Staging.
Production.

Staging should contain anonymized sample data, not unrestricted
real customer secrets.

38.7 Release Safety

- Database migrations tested.
- Rollback plan.
- Feature toggles only where operationally appropriate.
- Backup before critical migration.
- Smoke tests after deployment.
- Monitoring for errors and financial inconsistencies.

══════════════════════════════════════════════════════════════════
══════════════════════════════════════════════════════════════════
القسم الخامس: QUALITY, DELIVERY & ACCEPTANCE
══════════════════════════════════════════════════════════════════

الفصل 39 — تعريف المؤشرات والتقارير
──────────────────────────────────────────────────────────────────

39.1 الهدف

التقارير يجب أن تكون مبنية على تعريفات ثابتة للأرقام.
لا يجوز أن يعرض النظام رقم "المبيعات" دون تحديد المقصود به،
ولا أن يخلط قيمة الأوردرات بالمبالغ التي تم تحصيلها فعلًا.

39.2 Order Value

قيمة الأوردرات المقبولة خلال فترة محددة.

المقترح:
Sum(Grand Total) للأوردرات الفعلية المنشأة خلال الفترة،
مع استبعاد الأوردرات الملغية من إجمالي المبيعات التشغيلية
الصافية، وإظهار قيمة الإلغاءات بصورة منفصلة.

يمكن عرض:
- Gross Order Value.
- Cancelled Order Value.
- Net Active Order Value.

يجب أن تكون التسميات واضحة للمحاسب والإدارة.

39.3 Gross Collections

مجموع عمليات الدفع المؤكدة فعليًا خلال الفترة.

لا يشمل:
- Payment Proofs المعلقة.
- إثباتات الدفع المرفوضة.
- المبالغ المستحقة الرد.
- قيمة الأوردرات غير المدفوعة.

39.4 Refunds Paid

مجموع المبالغ التي تم ردها للعملاء فعلًا خلال الفترة.

لا يساوي Refund Due.

39.5 Net Collections

Gross Collections - Refunds Paid.

يُحسب وفق تواريخ العمليات المالية وليس فقط تاريخ إنشاء الأوردر.

39.6 Outstanding Receivables

مجموع المبالغ المستحقة على جميع الأوردرات غير الملغية،
بما فيها أوردرات Completed التي لم تُسدد بالكامل.

Outstanding لا يختفي عند إتمام الأوردر.

39.7 Refund Due

مجموع المبالغ التي تدين بها المطبعة للعملاء بسبب الإلغاءات،
ولم تُرد فعليًا بعد.

يظهر منفصلًا عن Outstanding Receivables.

39.8 Pending Requests

عدد Order Requests بحالة Pending Review.

39.9 In Review Requests

عدد الطلبات المحجوزة حاليًا لمراجعين.

39.10 Active Design Tasks

عدد البنود الجاري تنفيذ تصميماتها فعليًا وفق حالات العبء
النشط المعتمدة.

39.11 Awaiting Approval

عدد البنود التي رُفعت لها نسخة ويُنتظر اعتماد العميل.

39.12 Revision Requested

عدد البنود التي أرسل بشأنها العميل ملاحظات بعد رفع التصميم،
وتحتاج متابعة من المصمم.

39.13 Designer Completion

عدد البنود التي وصل تصميمها إلى Approved خلال فترة محددة.

لا يجب الخلط بين اكتمال التصميم واكتمال الأوردر ماليًا
أو اكتمال طباعته.

39.14 Printing Queue

عدد الأوردرات بحالة In Printing.

لا يتم ضرب الرقم في عدد البنود أو اعتبار كل بند
مهمة طباعة مستقلة.

39.15 Ready for Pickup

عدد الأوردرات بحالة Ready for Pickup.

39.16 Ready for Delivery

عدد الأوردرات بحالة Ready for Delivery.

39.17 Out for Delivery

عدد الأوردرات بحالة Out for Delivery.

39.18 Completed Orders

عدد الأوردرات التي وصلت Completed خلال الفترة.

يمكن تمييز:
Manual Pickup Completion.
Manual Delivery Completion.
Automatic Delivery Completion.

39.19 Reports Filtering

كل تقرير زمني يحتاج توضيح الحقل المستخدم في التاريخ.

أمثلة:
Order Value → created_at أو accepted_at وفق التعريف.
Collections → payment recorded/confirmed time.
Refund Paid → actual payout date.
Completed Orders → completed_at.

تغيير التاريخ المرجعي يجب ألا يحدث بصمت.

39.20 Reports Permissions

Operational Reports:
الإدارة وبعض الموظفين التشغيليين المخولين.

Financial Reports:
Super Admin / Admin / Accountant.

Designer:
إحصاءات مهامه المسموحة فقط.

Data Entry:
لا يرى Company-Wide Revenue أو Full Customer Ledger.

39.21 Reports Export

[تصميم تنفيذي]
PDF للطباعة.
CSV للجداول المفصلة.

التصدير يخضع للصلاحيات نفسها الخاصة بعرض البيانات.

──────────────────────────────────────────────────────────────────
الفصل 40 — الحالات الاستثنائية وقواعد الحماية
──────────────────────────────────────────────────────────────────

40.1 عميل مكرر

Situation:
الموظف يحاول إنشاء عميل برقم هاتف موجود.

Expected:
عرض السجل الحالي والتنبيه بالتكرار.
لا يتم دمج ملفات العملاء آليًا.

40.2 منتج غير نشط

Situation:
موظف يحاول إضافته لأوردر جديد.

Expected:
منع اختياره في أوردر جديد.
يظل ظاهرًا في الأوردرات التاريخية.

40.3 تغيير سعر المنتج

Situation:
الإدارة تعدل Base Price.

Expected:
الأوردرات الجديدة تستخدم السعر الجديد.
الأوردرات القديمة تبقى كما كانت.

40.4 تغيير فئة سعر العميل

Expected:
تنطبق الفئة الجديدة على الأوردرات الجديدة فقط.

40.5 كمية غير صالحة

Expected:
رفض الكمية السالبة أو الصفر أو الأقل من Minimum Quantity.

40.6 أوردر بدون بنود

Expected:
لا ينشأ أوردر فعلي بلا بند صالح واحد على الأقل.

40.7 عدم وجود مصمم مناسب

Expected:
Item = Unassigned.
إنشاء Action للإدارة.
لا يتم إسناده لمصمم خارج تخصصه تلقائيًا.

40.8 مصمم غير متاح

Expected:
لا يتلقى مهام جديدة تلقائيًا.
يستطيع تسجيل الدخول إذا كان حسابه Active.

40.9 تغيير مصمم أثناء تنفيذ الشغل

Expected:
القديم يفقد الوصول.
الجديد يحصل على الملفات والشات والنسخ السابقة.
يُسجل النقل.

40.10 عميل يرسل ملاحظة بعد رفع التصميم

Expected:
Revision Requested.
Notification للمصمم.
لا يحتاج زر Request Revision منفصل.

40.11 تعديل ملفات النسخة الحالية

Expected:
نفس Version Number إذا لم تُعتمد.
سجل تعديل.
لا إشعار مراجعة جديد بسبب الاستبدال وحده.

40.12 اعتماد نسخة تغيّرت أثناء المشاهدة

Expected:
رفض تأكيد النسخة القديمة.
إعادة فتح المعاينة المحدثة للعميل.

40.13 محاولة تعديل Version Approved

Expected:
منع العملية.

40.14 محاولة العميل إعادة فتح التصميم

Expected:
منع العملية.
Admin/SA فقط قبل الطباعة مع سبب.

40.15 أوردر فيه بنود معتمدة وغير معتمدة

Expected:
لا يدخل In Printing.

40.16 اعتماد آخر بند

Expected:
انتقال Order إلى In Printing مرة واحدة.
قفل جميع Chats الخاصة بالتصميم.
تغيير واجهة رابط العميل.

40.17 محاولة تغيير المواصفات أثناء الطباعة

Expected:
رفض التعديل التشغيلي.
السماح فقط بالاستثناءات الإدارية والمالية المعتمدة.

40.18 محاولة إلغاء Order Completed

Expected:
رفض.

40.19 إلغاء أوردر بعد بدء الطباعة

Expected:
متاح فقط Admin/SA كاستثناء.
سبب إلزامي.
Refund Due بحسب المدفوع المخصص.

40.20 دفعة أكبر من المستحق

Expected:
رفض.

40.21 دفعتان في نفس اللحظة

Situation:
موظفان يسجلان 300 جنيه على أوردر المتبقي فيه 400 جنيه.

Expected:
لا ينجح تسجيل 600 جنيه.
تتم حماية الرصيد بمعاملة متزامنة صحيحة.

40.22 تكرار الضغط على Record Payment

Expected:
دفعة واحدة فقط، وليس دفعتين.

40.23 دفعة عامة عبر أكثر من أوردر

Expected:
FIFO.
Payment واحدة.
Allocations متعددة.
لا تضاعف في Collections.

40.24 إلغاء أوردر حصل على جزء من دفعة عامة

Expected:
Refund Due للجزء المخصص لهذا الأوردر.
لا ترحيل تلقائي إلى أوردر آخر.
بقاء بقية التخصيصات صحيحة.

40.25 رد جزئي للفلوس

Situation:
Refund Due = 300.
Refund Paid = 100.

Expected:
Remaining Refund Due = 200.
Refund status = Partially Refunded.

40.26 محاولة Refund أكبر من المطلوب

Expected:
رفض.

40.27 إتمام أوردر عليه مديونية

Expected:
Completed مسموح.
المديونية تبقى في Ledger.

40.28 العميل يفتح رابطًا مغلقًا

Expected:
رسالة عامة دون بيانات أوردر.

40.29 رابط قديم بعد Regenerate

Expected:
لا يعمل.
الرابط الجديد فقط يستطيع الوصول.

40.30 موظف يحاول فتح ملف بند غير مصرح به

Expected:
403 أو إخفاء وجود السجل حسب سياسة API.
لا تسريب للملف.

40.31 مصمم يحاول قراءة بنود زميله

Expected:
رفض.

40.32 Data Entry يحاول إرسال رسالة في Designer Chat

Expected:
رفض حتى لو أرسل API Request يدويًا.

40.33 Data Entry يحاول تعديل دفعة

Expected:
رفض.

40.34 Admin يحاول تعديل صلاحيات نفسه

Expected:
رفض.

40.35 Admin يحاول إنشاء Admin آخر

Expected:
رفض.

40.36 جلسة موظف بعد إيقاف حسابه

Expected:
إنهاء صلاحية الجلسة.
رفض الطلبات الجديدة.

40.37 تعطل WhatsApp Integration

Expected:
الأوردر محفوظ.
نسخة التصميم محفوظة.
يظهر فشل الإرسال أو Action يدوي مناسب.

40.38 تعطل Image Search Service

Expected:
باقي النظام يعمل.
تظهر رسالة خطأ مفهومة.
البحث النصي متاح.

40.39 صورة بحث غير واضحة

Expected:
عرض النتائج المحتملة إن وجدت.
لا اختيار قاطع آلي.

40.40 فقد الاتصال أثناء Chat Send

Expected:
رسالة Pending / Failed.
Retry آمن.
لا تكرار للرسالة إذا وصل إرسالها بالفعل.

40.41 قفل المراجعة

Situation:
موظف بدأ مراجعة Order Request ثم تركها.

Expected:
المراجعة تبقى مرتبطة به وفق القرار الحالي.
تظهر للإدارة بيانات المراجع والحالة.
لا يُضاف Auto Unlock عشوائيًا.

40.42 Complete Delivery مرتين

Expected:
لا ينتج حدثا إتمام أو تغيير رصيد مرتين.

40.43 Auto Completion والتأكيد اليدوي في اللحظة نفسها

Expected:
عملية واحدة تنجح.
الثانية تتحقق أن الأوردر Completed بالفعل.
يحفظ Completion Source الفعلي.

──────────────────────────────────────────────────────────────────
الفصل 41 — خطة الاختبار ومعايير القبول
──────────────────────────────────────────────────────────────────

41.1 Test Strategy

Unit Tests:
Business calculations and isolated rules.

Integration Tests:
Database + services + permissions.

API Tests:
Requests, responses, authorization, validation.

Frontend Tests:
Forms, states, interactions.

E2E:
Real workflows from customer to delivery.

Security Tests:
Access boundaries and session rules.

Performance Tests:
Search, uploads, chat, reports.

UAT:
Real print-shop scenarios tested by business owner/staff.

41.2 Test Cases — Authentication & Permissions

TC-001
Given: Employee Active.
When: Correct login.
Then: Opens role-specific interface.

TC-002
Given: Employee Inactive.
When: Login attempted.
Then: Access denied.

TC-003
Given: Admin.
When: Attempts to create Admin.
Then: Forbidden.

TC-004
Given: Super Admin.
When: Creates Admin.
Then: Succeeds and audit recorded.

TC-005
Given: Admin.
When: Edits own permissions.
Then: Forbidden.

TC-006
Given: Designer A.
When: Requests Designer B item.
Then: Forbidden.

TC-007
Given: Data Entry.
When: Requests financial report.
Then: Forbidden.

TC-008
Given: Data Entry.
When: Attempts chat send to designer conversation.
Then: Forbidden.

TC-009
Given: Data Entry with discount permission.
When: Applies discount to unpaid eligible order.
Then: Allowed within pricing constraints.

TC-010
Given: Data Entry without discount permission.
When: Applies discount.
Then: Forbidden.

41.3 Test Cases — Customers & Accounts

TC-011
New customer with name and phone:
Created successfully.

TC-012
New customer without phone:
Rejected.

TC-013
Existing normalized phone:
Duplicate warning or rejection.

TC-014
Change customer tier:
Old order prices unchanged.

TC-015
Enable Platform Access:
Customer can login with issued credentials.

TC-016
Disable Platform Access:
Customer cannot login.

TC-017
Customer requests password reset:
Action created for authorized staff.

TC-018
Two staff claim same reset:
Only one claim succeeds.

TC-019
Authorized reset generates new password:
Old credential invalidated.

41.4 Test Cases — Product Pricing

TC-020
Product Base = 10, Options = 2, Quantity = 5:
Standard total = 60.

TC-021
Percentage Tier 20%:
Unit price = 9.6.

TC-022
Fixed Tier Base = 7 with Options = 2:
Unit price = 9.

TC-023
Quantity below minimum:
Rejected.

TC-024
Negative option price not allowed if policy disallows negative
additions:
Validation applied consistently.

TC-025
Modify catalog price:
Historical order retains previous snapshot.

TC-026
Order discount 100%:
Allowed only where resulting total obeys all rules.

TC-027
Order discount exceeds allowed subtotal:
Rejected.

TC-028
After first payment, Data Entry changes price:
Forbidden.

TC-029
Admin lowers order total below paid:
Rejected.

41.5 Test Cases — Order Requests

TC-030
Registered customer submits request:
Pending Review.

TC-031
Open request details without Start Review:
No claim.

TC-032
Employee starts review:
In Review and claimed.

TC-033
Second employee edits claimed request:
Rejected.

TC-034
Reviewer changes quantities/specifications:
Saved.

TC-035
Reviewer accepts:
One Order created.

TC-036
Reviewer presses Accept twice:
No duplicate order.

TC-037
Reviewer rejects without reason:
Rejected operation.

TC-038
Reviewer rejects with preset reason:
Request Rejected and reason visible.

TC-039
Customer tries to edit rejected request:
Forbidden.
Can create a new request.

41.6 Test Cases — Designer Assignment

TC-040
Eligible designer with lowest active workload:
Chosen.

TC-041
No qualified available designer:
Unassigned + Action.

TC-042
Designer On Leave:
Excluded from auto assignment.

TC-043
Designer On Leave but Account Active:
Can sign in.

TC-044
Reassign item:
Old designer loses access.

TC-045
Reassign item:
New designer can read prior versions and chat.

41.7 Test Cases — Design Versions & Chat

TC-046
Designer opens New Task:
Still New Task.

TC-047
Designer presses Start Design:
In Progress.

TC-048
Submit two images as one version:
Both stored under same version number.

TC-049
Replace unapproved file:
Same version number, revision updated.

TC-050
Approved version modification:
Rejected.

TC-051
Customer sends chat message while awaiting approval:
Revision Requested.

TC-052
Customer sends voice note:
Stored and playable.

TC-053
Customer downloads ordinary chat attachment:
Allowed.

TC-054
Customer tries official preview download API:
Denied.

TC-055
Customer approves current version:
Approved and chat locked.

TC-056
Approved one of three items:
Order does not start printing.

TC-057
Approved final active item:
Order transitions to In Printing.

TC-058
Admin reopens approved item before printing:
Allowed with reason.

TC-059
Admin reopens after printing started:
Rejected.

TC-060
Preview changed while customer approving:
Stale version check prevents wrong approval.

41.8 Test Cases — Printing & Delivery

TC-061
In Printing + Complete Printing + Pickup:
Ready for Pickup.

TC-062
In Printing + Complete Printing + Delivery:
Ready for Delivery.

TC-063
Ready for Pickup + Complete Order:
Completed.

TC-064
Completed order with remaining debt:
Debt remains.

TC-065
Ready for Delivery + Out for Delivery:
Dispatched timestamp saved.

TC-066
Out for Delivery + manual completion:
Completed.

TC-067
Out for Delivery for 24 hours:
Auto completion.

TC-068
Manual and scheduled completion concurrently:
Exactly one completion.

TC-069
Completed link customer opens token:
Closed page.

TC-070
Registered customer opens completed order:
Read Only details and approved designs.

41.9 Test Cases — Accounting

TC-071
Record targeted payment:
Only chosen order due reduced.

TC-072
Record general payment:
Oldest due settled first.

TC-073
Overpayment:
Rejected.

TC-074
Double-submit same payment:
One transaction.

TC-075
Payment proof uploaded:
No automatic confirmed collection.

TC-076
Payment proof confirmed:
Payment created and allocated.

TC-077
Payment proof rejected:
Reason stored, no payment created.

TC-078
Data Entry corrects saved payment:
Forbidden.

TC-079
Accountant corrects payment:
Audit + balance recalculation.

TC-080
Cancel unpaid order:
No refund due, order receivable removed.

TC-081
Cancel partially paid order:
Refund Due equals allocated confirmed amount.

TC-082
Cancel order funded from general payment:
Refund only related allocation.

TC-083
Partial refund payout:
Remaining refund due updated.

TC-084
Refund payout exceeds obligation:
Rejected.

TC-085
Print payment receipt:
Correct transaction details.

TC-086
Download invoice:
Correct order snapshot and totals.

41.10 Test Cases — Links, Actions & Search

TC-087
Regenerate order link:
Old token invalid.

TC-088
Suspend link:
Access blocked.

TC-089
Close order:
Access blocked.

TC-090
Read Action notification:
Action remains open.

TC-091
Complete underlying Action:
Action moves to History.

TC-092
Two employees claim recovery Action:
Only first succeeds.

TC-093
Upload image of known printed work:
Correct item appears among reasonable top results
according to test dataset.

TC-094
Image similarity result unauthorized:
No customer information leaked.

TC-095
Image Search unavailable:
Appropriate error and text search fallback.

TC-096
Failed image indexing:
Order and design files remain available.

41.11 Security Acceptance

- No broken object-level authorization.
- No privilege escalation.
- No public customer design storage.
- No ability to edit approved versions.
- No arbitrary file reads through ID manipulation.
- No double financial transactions from retries.
- No raw password storage.
- No secrets in logs.
- No closed customer link data leak.

41.12 Performance Acceptance

[تصميم تنفيذي]
يجب تحديد هدف قابل للقياس قبل الإطلاق لكل عملية رئيسية.

مثال أهداف مبدئية للاختبار، وليست ضمانات:
- فتح قائمة أوردرات شائعة بسرعة مناسبة مع Pagination.
- البحث برقم الهاتف دون مسح كل جدول.
- إرسال الرسالة وظهورها لحظيًا في ظروف اتصال عادية.
- البحث بالصورة خلال زمن عملي مقبول.
- إنشاء أوردر دون تعطل بسبب توليد فهرس الصورة.

الحدود النهائية تُضبط حسب حجم البيانات والاستضافة.

──────────────────────────────────────────────────────────────────
الفصل 42 — خطة التنفيذ وتوزيع مسؤوليات الفريق
──────────────────────────────────────────────────────────────────

42.1 Product Owner / Business Owner

مسؤول عن:
- تأكيد طريقة شغل المطبعة.
- تحديد المنتجات والأسعار الحقيقية.
- تحديد الموظفين والصلاحيات الفعلية.
- مراجعة الشاشات من منظور الاستخدام.
- تجربة سيناريوهات التشغيل.
- اعتماد نتيجة UAT.

غير مسؤول عن:
كتابة كود Backend أو Frontend أو تصميم كل جدول قاعدة بيانات.

42.2 Business Analyst

مسؤول عن:
- توثيق Business Rules.
- مراجعة التعارضات.
- تحديد Scope.
- وصف User Journeys.
- تعريف حالات الأوردر.
- توثيق Acceptance Criteria.
- الحفاظ على Traceability بين المتطلبات والشاشات والاختبارات.

Deliverables:
BRD.
Functional Specification.
Use Cases.
State Diagrams.
Acceptance Criteria.

42.3 UI/UX Designer

مسؤول عن:
- Information Architecture.
- Navigation.
- User Flows.
- Wireframes.
- High-Fidelity Screens.
- Responsive Views.
- Design System.
- Component States.
- Forms / Dialogs / Tables.
- User Testing.

لا يجوز للـUI/UX Designer:
اختراع زر يسمح للعميل بإلغاء اعتماد تصميم.
أو وضع طباعة لكل بند خلافًا للقواعد.
أو إظهار تقارير مالية للمصمم.

Deliverables:
Sitemap.
Wireframes.
Interactive Prototype.
Design System.
Screen States.
Developer Handoff.

42.4 Frontend Developer

مسؤول عن:
- Implement Screens.
- Integrate APIs.
- Client Validation.
- Responsive Layout.
- RTL Support.
- Realtime Chat UI.
- File Upload UX.
- State Management.
- Error Handling.
- Route Guards.
- Frontend Tests.

لا يجوز له:
الاعتماد على إخفاء زر كوسيلة حماية وحيدة.
أو حساب إجمالي مالي نهائي دون تأكيد Backend.

Deliverables:
Frontend Application.
Reusable Components.
Tested User Flows.
API Integration.
Responsive Interfaces.

42.5 Backend Developer

مسؤول عن:
- Domain Models.
- Business Services.
- Database.
- State Machines.
- Authorization.
- Pricing.
- Payment Allocation.
- Refund Calculations.
- API Endpoints.
- Realtime Events.
- Audit.
- Background Jobs.
- Secure File Access.

Deliverables:
Backend Application.
Database Migrations.
API Documentation.
Automated Tests.
Background Workers.
Security Controls.

42.6 Database Engineer / Backend Owner

مسؤول عن:
- Schema Design.
- Relationships.
- Constraints.
- Indexes.
- Transactions.
- Financial Data Integrity.
- Migration.
- Performance Queries.

قد يؤدي Backend Developer الدور نفسه إذا كان الفريق صغيرًا.

42.7 QA Engineer

مسؤول عن:
- Test Plan.
- Test Cases.
- API Tests.
- E2E Scenarios.
- Regression Testing.
- Permission Tests.
- Financial Tests.
- UAT Support.
- Bug Tracking.

لا يكتفي باختبار الشكل؛ يجب اختبار قواعد الحسابات
والصلاحيات والتزامن.

42.8 DevOps / Deployment Owner

مسؤول عن:
- Environments.
- CI/CD.
- Hosting.
- Database Configuration.
- Storage.
- Queue Workers.
- Monitoring.
- Backup.
- Restore Tests.
- SSL / Secrets.
- Deployment and Rollback.

42.9 مراحل التنفيذ

PHASE 1: Foundation

Backend:
Authentication.
Employees.
Roles.
Permissions.
Customers.

Frontend:
Login.
Layouts.
Profile.
Customers List.
Customer Details.

QA:
Access and authorization tests.

PHASE 2: Catalog & Pricing

Backend:
Products.
Options.
Pricing Tiers.
Pricing Engine.

Frontend:
Product Editor.
Tier Editor.
Pricing Preview.

QA:
Price formulas.
MOQ.
Tier mode cases.

PHASE 3: Orders & Requests

Backend:
Order Creation.
Order Requests.
Review Lock.
Order State.

Frontend:
Create Order Wizard.
Orders List.
Order Details.
Request Review.

QA:
Creation, edit, accept, reject.

PHASE 4: Design Workflow

Backend:
Designer Assignment.
Task States.
Versions.
Approval.

Frontend:
Designer Dashboard.
Task Details.
Version Editor.
Approval.

QA:
Task state / approval invariants.

PHASE 5: Chat & Customer Views

Backend:
Chat.
Realtime.
Protected Files.
Order Links.

Frontend:
Customer Portal.
Private Link Views.
Chat UI.
Voice Messages.
Previews.

QA:
Realtime, access, files, locked chats.

PHASE 6: Printing & Delivery

Backend:
Order-Wide Printing.
Pickup.
Delivery.
24h Completion Job.

Frontend:
Printing Status.
Ready Status.
Delivery Management.

QA:
Transitions and link closure.

PHASE 7: Finance

Backend:
Payments.
FIFO.
Proof Review.
Refunds.
Receipts.

Frontend:
Accounting Dashboard.
Ledger.
Payment Dialogs.
Refund Dialogs.

QA:
Financial accuracy and concurrency.

PHASE 8: Actions, WhatsApp & Search

Backend:
Notifications.
Action Center.
WhatsApp integration.
Global Search.
Image Search.

Frontend:
Action Center.
Notifications.
Search Views.

QA:
Deduplication.
Authorization.
Image matching evaluation.

PHASE 9: Reports, Settings, Security

Backend:
Reports.
Settings.
Audit.
Monitoring.

Frontend:
Reports.
Settings.
Audit Logs.

QA:
Role-specific reporting.
Settings impact.
Regression.

PHASE 10: UAT & Production Launch

- Realistic print-shop dataset.
- Real product prices.
- Realistic designer assignments.
- Real chat and approval flow.
- Realistic customer debts.
- Cancellation/refund tests.
- Printed documents review.
- Backup restore test.
- Staff training.
- Final acceptance.

42.10 Dependency Rules

Accounting depends on Orders and Pricing.
Design Approval depends on Items and Protected Files.
Printing depends on Approval States.
Customer Links depend on Orders and Access Tokens.
Search by Image depends on uploaded reference images.
Reports depend on defined business state and accounting metrics.

──────────────────────────────────────────────────────────────────
الفصل 43 — تعريف اكتمال المشروع
──────────────────────────────────────────────────────────────────

43.1 Feature Complete

الميزة تعتبر Feature Complete إذا:
- Business Rules implemented.
- Screen implemented.
- APIs implemented.
- Permissions applied.
- Validation applied.
- Audit added where needed.
- Error states handled.
- Automated tests added.
- Documentation updated.

43.2 Order Flow Complete

يمكن تنفيذ سيناريو كامل:

Create Customer
→ Create Order
→ Add Multiple Items
→ Auto Assign Designers
→ Designer Starts
→ Submit Design Version
→ Customer Revision
→ New Version
→ Customer Approves All Items
→ Order In Printing
→ Complete Printing
→ Ready for Pickup
→ Complete Order
→ Link Closed.

43.3 Customer Portal Complete

- Registered login.
- My Orders.
- Create Order Request.
- Notifications.
- Design Review.
- Chat.
- Approval.
- Completed History.
- Invoice PDF.

43.4 Finance Complete

- Pricing correctly calculated.
- Payment entered once.
- General payment allocated FIFO.
- Due correctly updated.
- Overpayment blocked.
- Payment proof review.
- Financial correction audit.
- Cancelled order refund due.
- Actual refund payout.
- Receipts / invoices correct.

43.5 Security Complete

- Every endpoint authorized.
- Every file access authorized.
- Closed tokens invalid.
- Designer scope respected.
- Data Entry limitations respected.
- Admin hierarchy respected.
- Financial data protected.

43.6 Search by Image Complete

The feature exists and works from real camera photos.
Returns ranked results.
Respects permissions.
Does not break core operations if indexing fails.
Meets measured practical accuracy agreed during evaluation.

43.7 Operations Complete

- Monitoring active.
- Backup configured.
- Restore tested.
- Queue worker running.
- Realtime functioning.
- Error logging configured.
- Deployment documented.

43.8 Documentation Complete

- All implemented routes documented.
- All roles documented.
- All settings documented.
- All data migrations documented.
- All critical business invariants documented.
- Known limitations documented.

43.9 User Acceptance

يُراجع النظام مع من سيستخدمونه فعلًا:

Admin:
هل يستطيع متابعة المطبعة بدون تدخل برمجي؟

Data Entry:
هل يستطيع إنشاء الأوردر بسرعة مع منع الأخطاء؟

Designer:
هل يرى مهامه ومحادثاته ونسخه بوضوح؟

Accountant:
هل الأرصدة والمدفوعات والاستردادات صحيحة؟

Customer:
هل يستطيع مراجعة التصميم واعتماده بسهولة؟

إذا نجحت الشاشات شكليًا لكنها فشلت في السيناريوهات،
فالمشروع لم يكتمل بعد.

──────────────────────────────────────────────────────────────────
الفصل 44 — ملحق القواعد غير القابلة للكسر
──────────────────────────────────────────────────────────────────

هذه القواعد أعلى من أي اختيار تصميمي أو تقني مقترح.

BR-001
كل عميل له Customer Profile داخلي.

BR-002
اسم العميل ورقم هاتفه إجباريان.

BR-003
تفعيل Platform Access منفصل عن إنشاء Customer Profile.

BR-004
العميل العادي يتابع أوردره عبر رابط خاص به.

BR-005
الرابط الخاص يفتح أوردرًا واحدًا فقط.

BR-006
الرابط يغلق عند Completed أو Cancelled.

BR-007
العميل الدائم يدخل برقم الهاتف وكلمة مرور ينشئها موظف مخول.

BR-008
العميل الدائم يستطيع إنشاء Order Request وليس أوردرًا
تشغيليًا مقبولًا تلقائيًا.

BR-009
Order Request يحتاج مراجعة بشرية وقبولًا أو رفضًا.

BR-010
المراجعة تُحجز للموظف عند Start Review.

BR-011
الرفض يحتاج سببًا.

BR-012
Order Request المرفوض لا يعاد فتحه؛ يمكن إنشاء طلب جديد.

BR-013
الأوردر يمكن أن يحتوي على أكثر من بند.

BR-014
كل بند له مصمم وشات ونسخ تصميم خاصة به.

BR-015
التوزيع التلقائي حسب التخصص ثم أقل ضغط عمل نشط.

BR-016
المهام الجديدة والمنتظرة لموافقة العميل لا تُحتسب ضمن
العمل الجاري فعليًا.

BR-017
لا يسند النظام تلقائيًا مهمة لمصمم غير مؤهل للتخصص.

BR-018
المصمم يبدأ المهمة صراحةً باستخدام Start Design.

BR-019
كل Version يجب أن تحتوي ملفات التصميم الكاملة.

BR-020
يمكن تغيير ملفات Version غير معتمدة داخل نفس رقم النسخة.

BR-021
Version المعتمدة غير قابلة للتعديل.

BR-022
Design Preview الرسمي View Only للعميل.

BR-023
مرفقات الشات العادية قابلة للتحميل حسب صلاحية الطرف.

BR-024
العميل يطلب التعديلات من خلال الشات، وليس زرًا مستقلًا.

BR-025
التعديلات غير محدودة بعدد ثابت في النسخة الحالية.

BR-026
العميل يعتمد كل بند بصورة مستقلة.

BR-027
اعتماد البند يقفل شاته.

BR-028
العميل لا يلغي اعتماده بنفسه.

BR-029
Admin/SA يعيد فتح التصميم فقط قبل بدء الطباعة وبسبب موثق.

BR-030
لا يبدأ طباعة أي بند حتى تعتمد جميع البنود النشطة.

BR-031
الطباعة عملية واحدة على مستوى الأوردر.

BR-032
يتم إكمال الطباعة بزر Complete Printing واحد للأوردر.

BR-033
المدة الافتراضية للطباعة يوم إلى يومين مع إمكانية تخصيص
عدد أيام للأوردر كاملًا.

BR-034
بعد بدء الطباعة يتغير رابط العميل إلى شاشة متابعة مبسطة.

BR-035
الشات يقفل عند دخول الأوردر الطباعة.

BR-036
الأوردر Pickup ينتقل إلى Ready for Pickup بعد الطباعة.

BR-037
الأوردر Delivery ينتقل إلى Ready for Delivery بعد الطباعة.

BR-038
الأوردر Delivery يمكن نقله إلى Out for Delivery يدويًا.

BR-039
الأوردر Out for Delivery يُغلق يدويًا عند التأكيد، أو
تلقائيًا بعد يوم وفق القرار المعتمد.

BR-040
Completed لا يشترط سداد كل المبلغ.

BR-041
المديونية تظل في Ledger بعد Completed.

BR-042
الإلغاء للإدارة فقط وبسبب إلزامي.

BR-043
يسمح بإلغاء إداري استثنائي بعد بدء الطباعة ما لم يكن Completed.

BR-044
الأوردر الملغي لا يبقى عليه مبلغ مستحق من العميل.

BR-045
الدفعات المخصصة للأوردر الملغي تصبح Refund Due.

BR-046
Refund Due لا يساوي Refund Paid.

BR-047
المدفوع على الأوردر الملغي يُرد فعليًا ولا يُرحّل تلقائيًا
إلى أوردر جديد.

BR-048
Admin/Accountant يسجلان Refund Paid.

BR-049
كل عميل له حساب مالي موحد.

BR-050
General Payments تتوزع FIFO على أقدم المستحقات.

BR-051
Targeted Payment يُخصص للأوردر المعين فقط.

BR-052
لا يُسمح بالدفعات الزائدة أو الرصيد الدائن من Overpayment
العادي.

BR-053
Data Entry يسجل دفعة لكنه لا يعدل دفعة محفوظة.

BR-054
Admin/Accountant يصححان الدفعات مع Audit.

BR-055
بعد أول دفعة، تعديل سعر الأوردر للإدارة فقط.

BR-056
لا يجوز تخفيض الإجمالي دون المدفوع.

BR-057
أسعار المنتجات وفئات العملاء لا تعيد تسعير الأوردرات القديمة.

BR-058
خصم فئة Percentage يُطبق على السعر الأساسي والإضافات.

BR-059
فئة Fixed Base تستبدل السعر الأساسي ثم تضيف الخيارات.

BR-060
خصم الأوردر يحتاج صلاحية.

BR-061
رسوم التوصيل تضاف بصورة منفصلة.

BR-062
التوصيل يحتاج عنوانًا.

BR-063
الفاتورة والإيصالات قابلة للطباعة.

BR-064
العميل يمكنه تنزيل الفاتورة PDF.

BR-065
الموظفون يحصلون على إشعارات داخل النظام فقط.

BR-066
Action Required لا ينتهي بمجرد قراءة Notification.

BR-067
Action Center الافتراضي مرتب بالأقدم أولًا.

BR-068
عميل الرابط العادي يمكن تنبيهه بالتصميم الجاهز تلقائيًا أو
يدويًا حسب إعداداته.

BR-069
لا يوجد واتساب تلقائي لحدث جاهزية الاستلام أو التوصيل.

BR-070
Data Entry يستطيع متابعة شات التصميم دون إرسال رسائل داخله.

BR-071
Designer لا يرى أسعار الأوردر أو شغل مصمم آخر.

BR-072
Admin لا ينشئ Admin ولا يعدل صلاحياته أو صلاحيات Admin آخر.

BR-073
Super Admin وحده يدير حسابات Admin.

BR-074
Search by Image موجود في V1.

BR-075
البحث بالصورة يرجع نتائج مرشحة، ولا يقرر المطابقة وحده.

BR-076
Search by Image يحترم الصلاحيات ولا يكشف بيانات محجوبة.

BR-077
لا يوجد نظام مخزون أو رواتب أو تشغيل ماكينات ضمن V1.

BR-078
لا يوجد حساب مندوب توصيل منفصل في النطاق الحالي.

BR-079
Completed Orders محفوظة للرجوع الداخلي والتقارير.

BR-080
العميل المسجل يرى أوردراته المكتملة وتصميماتها المعتمدة
View Only، لكن الشات مغلق.

BR-081
الأوردر المكتمل لا يعاد فتحه تشغيليًا.

BR-082
التصحيحات المالية الموثقة تظل ممكنة وفق الصلاحيات.

BR-083
كل عملية حساسة تُحفظ في Audit Log.

BR-084
الصلاحيات تُنفذ داخل Backend وليس بمجرد إخفاء الأزرار.

BR-085
كل حركة دفع تُسجل مرة واحدة مهما تعددت تخصيصاتها.

BR-086
الإرسال الفوري للشات لا يغني عن التخزين الدائم للرسائل.

BR-087
إيقاف حساب الموظف لا يحذف سجله التاريخي.

BR-088
لا يتم السماح بملف تصميم معتمد قابل للاستبدال بصمت.

BR-089
لا يتم تعطيل الأوردر بسبب فشل إشعار واتساب أو فهرسة الصورة.

BR-090
القرارات الأحدث في هذا المشروع تتقدم على نصوص المسودة V0.3.

══════════════════════════════════════════════════════════════════
ملحق A — الربط بين الشخصيات والشاشات
══════════════════════════════════════════════════════════════════

SUPER ADMIN:
Staff Login.
Admin Dashboard.
Action Center.
Orders.
Order Requests.
Customers.
Products.
Pricing.
Design Management.
Accounting.
Delivery.
Reports.
Search.
Search by Image.
Employees.
Admin Management.
Permissions.
Audit.
Settings.

ADMIN:
Staff Login.
Admin Dashboard.
Action Center.
Orders.
Order Requests.
Customers.
Products.
Pricing.
Design Management.
Accounting.
Delivery.
Reports.
Search.
Search by Image.
Employees — non-admin staff only.
Staff Permissions.
Audit.
Allowed Settings.

DATA ENTRY:
Staff Login.
Operational Dashboard.
Action Center.
Orders.
Create Order.
Order Requests.
Customers.
Customer Summary.
Operational Design Overview.
Delivery.
Search.
Search by Image.
Additional delegated screens only.

DESIGNER:
Staff Login.
My Tasks.
Task Details.
Specifications.
Customer Files.
Item Chat.
Design Versions.
Notifications.
Profile.

ACCOUNTANT:
Staff Login.
Accounting Dashboard.
Payments.
Payment Proofs.
Customer Ledger.
Receivables.
Refunds.
Invoices.
Receipts.
Financial Reports.
Financial Audit.
Customer Lookup.

REGISTERED CUSTOMER:
Customer Login.
Customer Dashboard.
Create Order Request.
My Requests.
My Orders.
Item Design Review.
Item Chat.
Notifications.
Invoices.
Profile.
Password Recovery Request.

LINK-BASED CUSTOMER:
Private Order Link.
Design Stage.
Item Preview.
Item Chat.
Approve Design.
Payment Proof.
Invoice.
Printing Status.
Ready Status.
Out for Delivery.
Closed Link.

══════════════════════════════════════════════════════════════════
ملحق B — الربط بين المكونات الهندسية
══════════════════════════════════════════════════════════════════

FEATURE: CREATE ORDER

Frontend:
Create Order Wizard.
Pricing Preview.
Customer Picker.
Item Options Forms.

Backend:
OrderService.
PricingService.
AssignmentService.

Database:
customers.
orders.
order_items.
products.
pricing_tiers.
item_assignment_history.

Events:
OrderCreated.
ItemAssigned.

Tests:
Create order.
Pricing.
MOQ.
Permissions.
Unassigned designer.

──────────────────────────────────────────────────────────────────

FEATURE: DESIGN APPROVAL

Frontend:
Design Preview.
Approval Dialog.
Chat State.

Backend:
ApprovalService.
DesignVersionService.

Database:
design_versions.
design_version_files.
design_approvals.
order_items.
orders.
conversations.

Events:
DesignApproved.
AllItemsApproved.
OrderPrintingStarted.

Tests:
Correct version.
Immutable approval.
All-items rule.
Chat lock.
Concurrency.

──────────────────────────────────────────────────────────────────

FEATURE: PAYMENT

Frontend:
Payment Dialog.
Customer Financial Summary.
Payment Details.

Backend:
PaymentService.
PaymentAllocationService.

Database:
payments.
payment_allocations.
orders.
payment_adjustments.

Events:
PaymentRecorded.
PaymentCorrected.

Tests:
Targeted payment.
FIFO.
Overpayment prevention.
Double submit.
Audit.

──────────────────────────────────────────────────────────────────

FEATURE: REFUND

Frontend:
Refunds List.
Record Refund Dialog.
Refund Receipt.

Backend:
RefundService.
OrderService.

Database:
refund_obligations.
refund_payouts.
orders.
payment_allocations.

Events:
RefundDueCreated.
RefundPaidRecorded.

Tests:
Cancellation liability.
Partial payout.
No automatic transfer.
Refund overpayment prevention.

──────────────────────────────────────────────────────────────────

FEATURE: SEARCH BY IMAGE

Frontend:
Camera Capture.
Upload Image.
Image Preview.
Results Grid.

Backend:
ImageSearchService.
Image Index Worker.
Authorization Policy.

Database:
files.
image_search_references.
image_index_jobs.
order_items.
orders.

Events:
ReferenceImageUploaded.
ImageIndexReady.
ImageIndexFailed.

Tests:
Top-K matching.
Real camera images.
Permissions.
Archived filter.
Failure fallback.

══════════════════════════════════════════════════════════════════
ملحق C — متطلبات تسليم كل شاشة من فريق التصميم
══════════════════════════════════════════════════════════════════

يجب أن يحتوي ملف تسليم أي شاشة إلى المطور على:

01. Screen ID.
02. Screen Name.
03. Persona / Role.
04. Business Goal.
05. Entry Points.
06. Visible Data.
07. Required Fields.
08. Optional Fields.
09. Default Values.
10. Primary Action.
11. Secondary Actions.
12. Conditional Actions.
13. Permission Rules.
14. Validation Messages.
15. Confirmation Dialogs.
16. Loading State.
17. Empty State.
18. Error State.
19. Success State.
20. Mobile Layout.
21. Desktop Layout.
22. API Dependencies.
23. State Transition Effects.
24. Audit Requirements.
25. Acceptance Criteria.

لا يُعتبر تصميم الشاشة جاهزًا للتطوير بمجرد وجود صورة
شكلها جميل في Figma.

══════════════════════════════════════════════════════════════════
ملحق D — متطلبات تسليم كل API
══════════════════════════════════════════════════════════════════

01. Endpoint Name.
02. HTTP Method.
03. Route.
04. Authentication Type.
05. Required Permission.
06. Object-Level Access Rules.
07. Request Schema.
08. Response Schema.
09. Field Validation.
10. Business Preconditions.
11. State Changes.
12. Database Transactions.
13. Idempotency Requirements.
14. Concurrency Behavior.
15. Audit Entry.
16. Emitted Events.
17. Background Jobs.
18. Error Codes.
19. Unit Tests.
20. Integration Tests.

══════════════════════════════════════════════════════════════════
ملحق E — القرارات التنفيذية التي تستلزم ضبطًا قبل الإطلاق
══════════════════════════════════════════════════════════════════

النظام يمكن بناءه بالقواعد السابقة من غير العودة إلى مناقشة
كل زر، لكن هذه المعايير تحتاج ضبطًا على البيئة الحقيقية:

1. الحد الأقصى لحجم الملفات.
2. الحد الأقصى لمدة التسجيلات الصوتية.
3. عدد المرفقات في الرسالة.
4. سياسة الاحتفاظ بالملفات.
5. سياسة النسخ الاحتياطي ومدد الاستعادة.
6. اختيار مزود WhatsApp Integration.
7. اختبار فعلي لمقارنة الصور على عينات المطبعة.
8. تحديد عدد الأوردرات المتوقع.
9. تحديد متطلبات أداء الاستضافة.
10. اختبار طباعة الفاتورة وبطاقة التشغيل.
11. مراجعة متطلبات الفواتير القانونية إن لزم.
12. سياسة معالجة طلب Review يظل محجوزًا بسبب انقطاع الموظف.
13. القواعد الدقيقة لتقريب الأسعار والكسور النقدية.
14. حدود وتفويض عرض بيانات العملاء الحساسة.
15. طريقة حفظ إثباتات التحويل والوصول إليها.
16. آلية الاحتفاظ بسجلات التصحيح المالي.
17. سياسة معالجة الملفات الضارة أو غير الصالحة.
18. تحديد العينة ومعيار القبول للبحث بالصورة.

هذه ليست دعوة لتغيير Business Flow المعتمد، وإنما إجراءات
جودة وأمان لازمة عند ضبط النظام للإنتاج الفعلي.

══════════════════════════════════════════════════════════════════
الخاتمة التنفيذية
══════════════════════════════════════════════════════════════════

Printing Business Management System هو نظام موحد لمطبعة واحدة.

يمكّن الإدارة من:
- استقبال الأوردرات.
- إدارة العملاء.
- حساب الأسعار.
- توزيع التصميمات.
- متابعة التنفيذ.
- متابعة الطباعة.
- متابعة التسليم.
- إدارة التحصيلات والمديونيات.
- تسجيل الاستردادات.
- مراجعة التقارير.
- التحكم في الصلاحيات والإعدادات.

ويمكّن المصمم من:
- استلام المهام.
- تنفيذ التصميم.
- التواصل مع العميل.
- إنشاء نسخ التصميم.
- معالجة التعديلات.
- الوصول للاعتماد النهائي.

ويمكّن العميل من:
- تقديم طلبات جديدة إذا كان لديه حساب.
- متابعة شغله.
- مراجعة التصميم.
- إرسال ملاحظاته.
- اعتماد النسخ النهائية.
- مشاهدة حالة الطباعة والتسليم.
- الاطلاع على الفاتورة.

ويضمن Backend:
- سلامة حالات الأوردر.
- سلامة الموافقات.
- سلامة الحسابات.
- صحة توزيع الدفعات.
- حماية الروابط والملفات.
- حماية صلاحيات المستخدمين.
- عدم ضياع السجلات التاريخية.
- إمكانية تدقيق كل عملية مهمة.

وتضمن طبقة UI/UX:
- سهولة استخدام النظام.
- وضوح مسؤولية كل شخص.
- سرعة الوصول للإجراء المطلوب.
- منع الأخطاء الشائعة.
- دعم العربية والموبايل.
- وضوح الحالات والإشعارات.

وتضمن خطة QA:
- تنفيذ الفلو الحقيقي.
- اختبار الحالات الاستثنائية.
- اختبار التزامن.
- اختبار العمليات المالية.
- اختبار الصلاحيات.
- اختبار البحث بالصورة.
- التأكد من الجاهزية الفعلية للإطلاق.

النتيجة المستهدفة:
نظام تشغيل يومي تستطيع المطبعة الاعتماد عليه في إدارة
عملائها وأوردراتها وتصميماتها ومدفوعاتها، مع وجود سجل
واضح ومسؤولية محددة لكل خطوة.

══════════════════════════════════════════════════════════════════
                 END OF MASTER PROJECT CONTENT
                       PBMS — VERSION 1.0
══════════════════════════════════════════════════════════════════