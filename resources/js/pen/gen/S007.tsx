// مُولَّد بالأداة tools/ui-compare/pen2tsx.mjs من pendev/untitled.pen — نقطة بداية فقط، يُعاد تنظيمه وتُربط بياناته.
import { Icon } from '@/pen/icon';

export default function S007() {
  return (
    <div className="flex bg-[var(--background)] shrink-0 h-[1560px] overflow-hidden w-[1440px]">{ /* S-007 — لوحة التحكم */}
      <div className="flex flex-col flex-1 h-full">{ /* Application workspace */}
        <div className="flex items-center bg-[var(--surface)] [border-color:var(--border)] [border-style:solid] [border-width:0px_0px_1px_0px] shrink-0 gap-[16px] h-[65.5px] [margin:0px_0px_-0.5px_0px] p-[0px_24px] w-[1176px]">{ /* Global topbar · V3 */}
          <div className="flex items-center flex-1 gap-[16px] h-[66px]">{ /* Preserved staff context and utilities */}
            <div className="flex items-center shrink-0 gap-[8px] w-fit">{ /* Profile menu */}
              <Icon name="chevron-down" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* chevron-down */}
              <div className="text-[var(--ink)] text-[14px] font-[400] leading-[22px] text-left whitespace-nowrap">{ /* Admin name */}
                أحمد حسن
              </div>
              <div className="flex flex-col items-center justify-center bg-[#DBEAFE] rounded-[18px] shrink-0 gap-[16px] h-[36px] w-[36px]">{ /* Avatar */}
                <div className="text-[var(--primary)] text-[13px] font-[700] leading-[21px] text-left whitespace-nowrap">{ /* Initials */}
                  أح
                </div>
              </div>
            </div>
            <div className="flex items-center shrink-0 gap-[6px] w-fit">{ /* Notifications unread */}
              <div className="text-[var(--primary)] text-[12px] font-[400] leading-[19px] text-left whitespace-nowrap">{ /* Unread count */}
                4
              </div>
              <Icon name="bell" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* bell */}
            </div>
            <div className="flex items-center shrink-0 gap-[8px] w-fit">{ /* Image search shortcut */}
              <div className="text-[var(--muted-foreground)] text-[13px] font-[400] leading-[21px] text-left whitespace-nowrap">{ /* Image search */}
                بحث بالصورة
              </div>
              <Icon name="scan-search" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* scan-search */}
            </div>
            <div className="flex items-center bg-[var(--background)] rounded-[10px] flex-1 gap-[12px] h-[46px] [outline-offset:-0.5px] [outline:1px_solid_var(--control-border)] p-[0px_14px]">{ /* Global search */}
              <div className="text-[var(--muted-foreground)] flex-1 text-[14px] font-[400] leading-[22px] text-right">{ /* ابحث عن طلب، عميل أو منتج… */}
                ابحث عن طلب، عميل أو منتج…
              </div>
              <Icon name="search" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* search */}
            </div>
          </div>
        </div>
        <div className="flex flex-col shrink-0 gap-[20px] p-[32px] w-full">{ /* Page content */}
          <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[19px] text-right w-full">{ /* الرئيسية  ‹  لوحة التحكم */}
            الرئيسية ‹ لوحة التحكم
          </div>
          <div className="flex items-center justify-between shrink-0 gap-[12px] w-full">{ /* Page header */}
            <div className="flex items-center shrink-0 gap-[12px] w-fit">{ /* Header controls */}
              <div className="flex items-center justify-center bg-[var(--primary)] rounded-[10px] shrink-0 h-[46px] p-[0px_16px] w-fit">{ /* طلب جديد */}
                <div className="text-[var(--surface)] text-[14px] font-[600] leading-[normal] text-left whitespace-nowrap">{ /* Label */}
                  طلب جديد
                </div>
              </div>
            </div>
            <div className="flex flex-col flex-1 gap-[4px]">{ /* Page title */}
              <div className="text-[var(--ink)] text-[28px] font-[700] leading-[39px] text-right w-full">{ /* لوحة التحكم */}
                لوحة التحكم
              </div>
              <div className="text-[var(--muted-foreground)] text-[14px] font-[400] leading-[22px] text-right w-full">{ /* صباح الخير، أحمد. إليك ما يحتاج اهتمامك اليوم. */}
                صباح الخير، أحمد. إليك ما يحتاج اهتمامك اليوم.
              </div>
            </div>
          </div>
          <div className="flex items-center shrink-0 gap-[12px] w-full">{ /* Date and overview controls */}
            <div className="flex items-center justify-center bg-[var(--surface)] rounded-[10px] shrink-0 h-[46px] [outline-offset:-0.5px] [outline:1px_solid_var(--control-border)] p-[0px_16px] w-fit">{ /* هذا اليوم ⌄ */}
              <div className="text-[var(--ink)] text-[14px] font-[600] leading-[normal] text-left whitespace-nowrap">{ /* Label */}
                هذا اليوم ⌄
              </div>
            </div>
            <div className="flex items-center justify-center bg-[var(--surface)] rounded-[10px] shrink-0 h-[46px] [outline-offset:-0.5px] [outline:1px_solid_var(--control-border)] p-[0px_16px] w-fit">{ /* تحديث */}
              <div className="text-[var(--ink)] text-[14px] font-[600] leading-[normal] text-left whitespace-nowrap">{ /* Label */}
                تحديث
              </div>
            </div>
            <div className="text-[var(--muted-foreground)] flex-1 text-[13px] font-[400] leading-[21px] text-right">{ /* الأربعاء، 18 يونيو 2025  •  آخر تحديث 09:42 ص */}
              الأربعاء، 18 يونيو 2025 • آخر تحديث 09:42 ص
            </div>
          </div>
          <div className="flex items-center bg-[var(--warning-soft)] rounded-[10px] shrink-0 gap-[12px] p-[12px_16px] w-full">{ /* Urgent operational alert */}
            <div className="flex items-center justify-center bg-[var(--surface)] rounded-[10px] shrink-0 h-[46px] [outline-offset:-0.5px] [outline:1px_solid_var(--control-border)] p-[0px_16px] w-fit">{ /* مراجعة الإجراءات */}
              <div className="text-[var(--ink)] text-[14px] font-[600] leading-[normal] text-left whitespace-nowrap">{ /* Label */}
                مراجعة الإجراءات
              </div>
            </div>
            <div className="text-[var(--warning-text)] flex-1 text-[14px] font-[600] leading-[22px] text-right">{ /* 3 طلبات تجاوزت موعد التسليم • 4 مهام تصميم لم تُسند بعد */}
              3 طلبات تجاوزت موعد التسليم • 4 مهام تصميم لم تُسند بعد
            </div>
          </div>
          <div className="text-[var(--ink)] text-[18px] font-[700] leading-[29px] text-right w-full">{ /* نظرة على العمليات */}
            نظرة على العمليات
          </div>
          <div className="flex shrink-0 gap-[16px] w-full">{ /* Primary operational KPIs — 5 priorities */}
            <div className="flex flex-col bg-[var(--surface)] rounded-[12px] flex-1 gap-[4px] [outline-offset:-0.5px] [outline:1px_solid_var(--border)] p-[16px]">{ /* KPI جاهز للاستلام */}
              <div className="text-[var(--muted-foreground)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* جاهز للاستلام */}
                جاهز للاستلام أو التوصيل
              </div>
              <div className="text-[var(--ink)] text-[28px] font-[700] leading-[39px] text-right w-full">{ /* 8 */}
                14
              </div>
              <div className="text-[var(--primary)] text-[12px] font-[400] leading-[19px] text-right w-full">{ /* تنسيق الاستلام  ← */}
                عرض الطلبات الجاهزة ←
              </div>
            </div>
            <div className="flex flex-col bg-[var(--surface)] rounded-[12px] flex-1 gap-[4px] [outline-offset:-0.5px] [outline:1px_solid_var(--border)] p-[16px]">{ /* KPI قيد الطباعة */}
              <div className="text-[var(--muted-foreground)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* قيد الطباعة */}
                قيد الطباعة
              </div>
              <div className="text-[var(--ink)] text-[28px] font-[700] leading-[39px] text-right w-full">{ /* 14 */}
                14
              </div>
              <div className="text-[var(--primary)] text-[12px] font-[400] leading-[19px] text-right w-full">{ /* متابعة الإنتاج  ← */}
                متابعة الإنتاج ←
              </div>
            </div>
            <div className="flex flex-col bg-[var(--surface)] rounded-[12px] flex-1 gap-[4px] [outline-offset:-0.5px] [outline:1px_solid_var(--border)] p-[16px]">{ /* KPI تعديل مطلوب */}
              <div className="text-[var(--muted-foreground)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* تعديل مطلوب */}
                تصاميم تحتاج متابعة
              </div>
              <div className="text-[var(--ink)] text-[28px] font-[700] leading-[39px] text-right w-full">{ /* 3 */}
                12
              </div>
              <div className="text-[var(--primary)] text-[12px] font-[400] leading-[19px] text-right w-full">{ /* متابعة التعديلات  ← */}
                3 تعديلات • 9 موافقات ←
              </div>
            </div>
            <div className="flex flex-col bg-[var(--surface)] rounded-[12px] flex-1 gap-[4px] [outline-offset:-0.5px] [outline:1px_solid_var(--border)] p-[16px]">{ /* KPI عناصر غير مسندة */}
              <div className="text-[var(--muted-foreground)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* عناصر غير مسندة */}
                مهام تصميم غير مسندة
              </div>
              <div className="text-[var(--ink)] text-[28px] font-[700] leading-[39px] text-right w-full">{ /* 4 */}
                4
              </div>
              <div className="text-[var(--primary)] text-[12px] font-[400] leading-[19px] text-right w-full">{ /* إسناد المهام  ← */}
                إسناد المهام ←
              </div>
            </div>
            <div className="flex flex-col bg-[var(--surface)] rounded-[12px] shrink-0 gap-[4px] [outline-offset:-0.5px] [outline:1px_solid_var(--border)] p-[16px] w-[210px]">{ /* KPI طلبات معلقة */}
              <div className="text-[var(--muted-foreground)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* طلبات معلقة */}
                طلبات أوردرات معلّقة
              </div>
              <div className="text-[var(--ink)] text-[28px] font-[700] leading-[39px] text-right w-full">{ /* 7 */}
                7
              </div>
              <div className="text-[var(--primary)] text-[12px] font-[400] leading-[19px] text-right w-full">{ /* مراجعة الطلبات  ← */}
                مراجعة الطلبات ←
              </div>
            </div>
          </div>
          <div className="flex bg-[var(--surface)] rounded-[12px] shrink-0 gap-[24px] [outline-offset:-0.5px] [outline:1px_solid_var(--border)] p-[16px_20px] w-full">{ /* Compact operational summary */}
            <div className="flex flex-col bg-[#FFFFFF00] flex-1 gap-[4px]">{ /* KPI بانتظار الموافقة */}
              <div className="text-[var(--muted-foreground)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* بانتظار الموافقة */}
                بانتظار الموافقة
              </div>
              <div className="text-[var(--ink)] text-[20px] font-[700] leading-[32px] text-right w-full">{ /* 9 */}
                9
              </div>
              <div className="text-[var(--primary)] text-[11px] font-[400] leading-[18px] text-right w-full">{ /* مراجعة الموافقات  ← */}
                مراجعة الموافقات ←
              </div>
            </div>
            <div className="flex flex-col bg-[#FFFFFF00] flex-1 gap-[4px]">{ /* KPI تصاميم قيد التنفيذ */}
              <div className="text-[var(--muted-foreground)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* تصاميم قيد التنفيذ */}
                تصاميم قيد التنفيذ
              </div>
              <div className="text-[var(--ink)] text-[20px] font-[700] leading-[32px] text-right w-full">{ /* 12 */}
                12
              </div>
              <div className="text-[var(--primary)] text-[11px] font-[400] leading-[18px] text-right w-full">{ /* إدارة التصميم  ← */}
                إدارة التصميم ←
              </div>
            </div>
            <div className="flex flex-col bg-[#FFFFFF00] flex-1 gap-[4px]">{ /* KPI خارج للتسليم */}
              <div className="text-[var(--muted-foreground)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* خارج للتسليم */}
                خارج للتسليم
              </div>
              <div className="text-[var(--ink)] text-[20px] font-[700] leading-[32px] text-right w-full">{ /* 5 */}
                5
              </div>
              <div className="text-[var(--primary)] text-[11px] font-[400] leading-[18px] text-right w-full">{ /* تتبع التوصيل  ← */}
                تتبع التوصيل ←
              </div>
            </div>
            <div className="flex flex-col bg-[#FFFFFF00] flex-1 gap-[4px]">{ /* KPI طلبات مكتملة */}
              <div className="text-[var(--muted-foreground)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* طلبات مكتملة */}
                طلبات مكتملة
              </div>
              <div className="text-[var(--ink)] text-[20px] font-[700] leading-[32px] text-right w-full">{ /* 124 */}
                124
              </div>
              <div className="text-[var(--primary)] text-[11px] font-[400] leading-[18px] text-right w-full">{ /* عرض الطلبات  ← */}
                عرض الطلبات ←
              </div>
            </div>
            <div className="flex flex-col bg-[#FFFFFF00] flex-1 gap-[4px]">{ /* KPI جاهز للتوصيل */}
              <div className="text-[var(--muted-foreground)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* جاهز للتوصيل */}
                استلام / توصيل
              </div>
              <div className="text-[var(--ink)] text-[20px] font-[700] leading-[32px] text-right w-full">{ /* 6 */}
                8 / 6
              </div>
              <div className="text-[var(--primary)] text-[11px] font-[400] leading-[18px] text-right w-full">{ /* جدولة التوصيل  ← */}
                جدولة التوصيل ←
              </div>
            </div>
          </div>
          <div className="flex flex-col bg-[var(--surface)] rounded-[12px] shrink-0 gap-[12px] [outline-offset:-0.5px] [outline:1px_solid_var(--border)] p-[20px] w-full">{ /* Authorized admin financial snapshot */}
            <div className="flex items-center shrink-0 gap-[12px] w-full">{ /* Financial title */}
              <div className="flex flex-col bg-[var(--surface-subtle)] rounded-[8px] shrink-0 gap-[16px] p-[4px_10px] w-fit">{ /* Status Admin فقط */}
                <div className="text-[var(--text-secondary)] text-[12px] font-[600] leading-[19px] text-left whitespace-nowrap">{ /* Admin فقط */}
                  للمسؤول فقط
                </div>
              </div>
              <div className="text-[var(--ink)] flex-1 text-[18px] font-[700] leading-[29px] text-right">{ /* الملخص المالي */}
                الملخص المالي
              </div>
            </div>
            <div className="flex items-center shrink-0 gap-[24px] w-full">{ /* Financial metrics */}
              <div className="flex flex-col flex-1 gap-[4px]">{ /* مبالغ مستحقة للرد */}
                <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[19px] text-right w-full">{ /* مبالغ مستحقة للرد */}
                  مبالغ مستحقة للرد
                </div>
                <div className="text-[var(--ink)] text-[20px] font-[700] leading-[32px] text-right w-full">{ /* 1,250 ج.م */}
                  1,250 ج.م
                </div>
              </div>
              <div className="flex flex-col flex-1 gap-[4px]">{ /* قيمة الطلبات اليوم */}
                <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[19px] text-right w-full">{ /* قيمة الطلبات اليوم */}
                  قيمة الطلبات اليوم
                </div>
                <div className="text-[var(--ink)] text-[20px] font-[700] leading-[32px] text-right w-full">{ /* 42,600 ج.م */}
                  42,600 ج.م
                </div>
              </div>
              <div className="flex flex-col flex-1 gap-[4px]">{ /* مستحقات العملاء */}
                <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[19px] text-right w-full">{ /* مستحقات العملاء */}
                  مستحقات العملاء
                </div>
                <div className="text-[var(--ink)] text-[20px] font-[700] leading-[32px] text-right w-full">{ /* 86,400 ج.م */}
                  86,400 ج.م
                </div>
              </div>
              <div className="flex flex-col flex-1 gap-[4px]">{ /* تحصيلات الأسبوع */}
                <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[19px] text-right w-full">{ /* تحصيلات الأسبوع */}
                  تحصيلات الأسبوع
                </div>
                <div className="text-[var(--ink)] text-[20px] font-[700] leading-[32px] text-right w-full">{ /* 128,750 ج.م */}
                  128,750 ج.م
                </div>
              </div>
              <div className="flex flex-col flex-1 gap-[4px]">{ /* تحصيلات اليوم */}
                <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[19px] text-right w-full">{ /* تحصيلات اليوم */}
                  تحصيلات اليوم
                </div>
                <div className="text-[var(--ink)] text-[20px] font-[700] leading-[32px] text-right w-full">{ /* 18,450 ج.م */}
                  18,450 ج.م
                </div>
              </div>
            </div>
            <div className="text-[var(--muted-foreground)] text-[11px] font-[400] leading-[18px] text-right w-full">{ /* جميع القيم بالجنيه المصري (EGP) • الأرقام المالية ظاهرة وفق صلاحياتك الإدارية. */}
              جميع القيم بالجنيه المصري (EGP) • الأرقام المالية ظاهرة وفق صلاحياتك الإدارية.
            </div>
          </div>
          <div className="flex shrink-0 gap-[24px] w-full">{ /* Action and operational alerts */}
            <div className="flex flex-col bg-[var(--surface)] rounded-[12px] flex-1 gap-[12px] [outline-offset:-0.5px] [outline:1px_solid_var(--border)] p-[20px]">{ /* Operational alerts */}
              <div className="text-[var(--ink)] text-[18px] font-[700] leading-[29px] text-right w-full">{ /* تنبيهات التشغيل */}
                تنبيهات التشغيل
              </div>
              <div className="text-[var(--warning-text)] text-[14px] font-[700] leading-[22px] text-right w-full">{ /* موعد تسليم قريب */}
                موعد تسليم قريب
              </div>
              <div className="text-[var(--muted-foreground)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* طلب 0148 لشركة النور مستحق اليوم الساعة 02:00 م. */}
                طلب 0148 لشركة النور مستحق اليوم الساعة 02:00 م.
              </div>
              <div className="text-[#B91C1C] text-[14px] font-[700] leading-[22px] text-right w-full">{ /* ملف يحتاج مراجعة */}
                ملف يحتاج مراجعة
              </div>
              <div className="text-[var(--muted-foreground)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* طلب 0146: دقة ملف البانر أقل من المطلوب للطباعة. */}
                طلب 0146: دقة ملف البانر أقل من المطلوب للطباعة.
              </div>
            </div>
            <div className="flex flex-col bg-[var(--surface)] rounded-[12px] flex-1 gap-[12px] [outline-offset:-0.5px] [outline:1px_solid_var(--border)] p-[20px]">{ /* Requires action preview */}
              <div className="flex items-center shrink-0 gap-[12px] w-full">{ /* Actions heading */}
                <div className="text-[var(--primary)] text-[12px] font-[400] leading-[19px] text-right whitespace-nowrap">{ /* كل الإجراءات ← */}
                  كل الإجراءات ←
                </div>
                <div className="text-[var(--ink)] flex-1 text-[18px] font-[700] leading-[29px] text-right">{ /* يتطلب إجراءً • 14 */}
                  يتطلب إجراءً • 14
                </div>
              </div>
              <div className="flex items-center shrink-0 gap-[12px] w-full">{ /* مراجعة طلب أوردر جديد */}
                <div className="text-[var(--primary)] shrink-0 text-[12px] font-[400] leading-[19px] text-right w-[60px]">{ /* فتح ← */}
                  فتح ←
                </div>
                <div className="flex flex-col flex-1">{ /* Action summary */}
                  <div className="text-[var(--ink)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* مراجعة طلب أوردر جديد */}
                    مراجعة طلب أوردر جديد
                  </div>
                  <div className="text-[var(--muted-foreground)] text-[11px] font-[400] leading-[18px] text-right w-full">{ /* شركة النور • منذ ساعتين */}
                    شركة النور • منذ يومين
                  </div>
                </div>
              </div>
              <div className="flex items-center shrink-0 gap-[12px] w-full">{ /* إسناد تصميم غير معيّن */}
                <div className="text-[var(--primary)] shrink-0 text-[12px] font-[400] leading-[19px] text-right w-[60px]">{ /* فتح ← */}
                  فتح ←
                </div>
                <div className="flex flex-col flex-1">{ /* Action summary */}
                  <div className="text-[var(--ink)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* إسناد تصميم غير معيّن */}
                    إسناد تصميم غير معيّن
                  </div>
                  <div className="text-[var(--muted-foreground)] text-[11px] font-[400] leading-[18px] text-right w-full">{ /* بطاقات أعمال • طلب 0147 */}
                    بطاقات أعمال • طلب 0149
                  </div>
                </div>
              </div>
              <div className="flex items-center shrink-0 gap-[12px] w-full">{ /* إرسال إشعار واتساب يدوي */}
                <div className="text-[var(--primary)] shrink-0 text-[12px] font-[400] leading-[19px] text-right w-[60px]">{ /* فتح ← */}
                  فتح ←
                </div>
                <div className="flex flex-col flex-1">{ /* Action summary */}
                  <div className="text-[var(--ink)] text-[13px] font-[400] leading-[21px] text-right w-full">{ /* إرسال إشعار واتساب يدوي */}
                    إرسال إشعار واتساب يدوي
                  </div>
                  <div className="text-[var(--muted-foreground)] text-[11px] font-[400] leading-[18px] text-right w-full">{ /* مقهى ورد • طلب 0142 */}
                    مقهى ورد • طلب 0142
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col bg-[var(--surface)] rounded-[10px] shrink-0 [outline-offset:-0.5px] [outline:1px_solid_var(--border)] overflow-hidden w-full">{ /* Recent orders */}
            <div className="flex items-center shrink-0 gap-[12px] p-[16px_24px] w-full">{ /* Recent orders heading */}
              <div className="text-[var(--primary)] flex-1 text-[12px] font-[400] leading-[19px] text-right">{ /* جميع الطلبات ← */}
                جميع الطلبات ←
              </div>
              <div className="text-[var(--ink)] flex-1 text-[18px] font-[700] leading-[29px] text-right">{ /* أحدث الطلبات */}
                أحدث الطلبات
              </div>
            </div>
            <div className="flex items-center bg-[var(--surface-subtle)] [border-color:var(--border)] [border-style:solid] [border-width:0px_0px_1px_0px] shrink-0 gap-[12px] h-[43.5px] [margin:0px_0px_-0.5px_0px] p-[0px_16px] w-[1112px]">{ /* Column headers */}
              <div className="text-[var(--text-secondary)] shrink-0 text-[12px] font-[600] leading-[19px] text-right w-[104px]">{ /* الإجراء */}
                الإجراء
              </div>
              <div className="text-[var(--text-secondary)] shrink-0 text-[12px] font-[600] leading-[19px] text-right w-[130px]">{ /* الإجمالي */}
                الإجمالي
              </div>
              <div className="text-[var(--text-secondary)] shrink-0 text-[12px] font-[600] leading-[19px] text-right w-[136px]">{ /* موعد التسليم */}
                موعد التسليم
              </div>
              <div className="text-[var(--text-secondary)] shrink-0 text-[12px] font-[600] leading-[19px] text-right w-[136px]">{ /* الحالة */}
                الحالة
              </div>
              <div className="text-[var(--text-secondary)] flex-1 text-[12px] font-[600] leading-[19px] text-right">{ /* العميل / المنتج */}
                العميل / المنتج
              </div>
              <div className="text-[var(--text-secondary)] shrink-0 text-[12px] font-[600] leading-[19px] text-right w-[88px]">{ /* رقم الطلب */}
                رقم الطلب
              </div>
            </div>
            <div className="flex items-center bg-[var(--surface)] [border-color:var(--border)] [border-style:solid] [border-width:0px_0px_1px_0px] shrink-0 gap-[12px] h-[71.5px] [margin:0px_0px_-0.5px_0px] p-[0px_16px] w-[1112px]">{ /* Order 0148 */}
              <div className="flex items-center justify-end shrink-0 gap-[8px] h-[32px] w-[104px]">{ /* Row actions */}
                <div className="flex items-center justify-center bg-[var(--surface)] rounded-[8px] shrink-0 gap-[6px] h-[32px] [outline-offset:-0.5px] [outline:1px_solid_var(--border)] p-[0px_10px] w-fit">{ /* Table action / عرض الطلب */}
                  <div className="text-[var(--ink)] text-[12px] font-[600] leading-[19px] text-left whitespace-nowrap">{ /* Action label */}
                    عرض الطلب
                  </div>
                </div>
              </div>
              <div className="text-[var(--ink)] shrink-0 text-[13px] font-[400] leading-[21px] text-right w-[130px]">{ /* 4,850 ج.م */}
                4,850 ج.م
              </div>
              <div className="text-[var(--ink)] shrink-0 text-[13px] font-[400] leading-[21px] text-right w-[136px]">{ /* 18 يونيو */}
                18 يونيو
              </div>
              <div className="flex justify-end shrink-0 w-[136px]">{ /* Status cell */}
                <div className="flex bg-[var(--primary-soft)] rounded-[8px] shrink-0 p-[3px_10px] w-fit">{ /* Status / قيد الطباعة */}
                  <div className="text-[var(--primary-hover)] text-[12px] font-[600] leading-[19px] text-left whitespace-nowrap">{ /* قيد الطباعة */}
                    قيد الطباعة
                  </div>
                </div>
              </div>
              <div className="text-[var(--ink)] flex-1 text-[13px] font-[400] leading-[21px] text-right">{ /* شركة النور / بروشور */}
                شركة النور / بروشور
              </div>
              <div className="text-[var(--ink)] shrink-0 text-[13px] font-[400] leading-[21px] text-right w-[88px]">{ /* 0148 */}
                0148
              </div>
            </div>
            <div className="flex items-center bg-[var(--surface)] [border-color:var(--border)] [border-style:solid] [border-width:0px_0px_1px_0px] shrink-0 gap-[12px] h-[71.5px] [margin:0px_0px_-0.5px_0px] p-[0px_16px] w-[1112px]">{ /* Order 0147 */}
              <div className="flex items-center justify-end shrink-0 gap-[8px] h-[32px] w-[104px]">{ /* Row actions */}
                <div className="flex items-center justify-center bg-[var(--surface)] rounded-[8px] shrink-0 gap-[6px] h-[32px] [outline-offset:-0.5px] [outline:1px_solid_var(--border)] p-[0px_10px] w-fit">{ /* Table action / عرض الطلب */}
                  <div className="text-[var(--ink)] text-[12px] font-[600] leading-[19px] text-left whitespace-nowrap">{ /* Action label */}
                    عرض الطلب
                  </div>
                </div>
              </div>
              <div className="text-[var(--ink)] shrink-0 text-[13px] font-[400] leading-[21px] text-right w-[130px]">{ /* 1,200 ج.م */}
                1,200 ج.م
              </div>
              <div className="text-[var(--ink)] shrink-0 text-[13px] font-[400] leading-[21px] text-right w-[136px]">{ /* 19 يونيو */}
                19 يونيو
              </div>
              <div className="flex justify-end shrink-0 w-[136px]">{ /* Status cell */}
                <div className="flex bg-[#F5F3FF] rounded-[8px] shrink-0 p-[3px_10px] w-fit">{ /* Status / قيد التصميم */}
                  <div className="text-[#6D28D9] text-[12px] font-[600] leading-[19px] text-left whitespace-nowrap">{ /* قيد التصميم */}
                    قيد التصميم
                  </div>
                </div>
              </div>
              <div className="text-[var(--ink)] flex-1 text-[13px] font-[400] leading-[21px] text-right">{ /* مقهى ورد / منيو */}
                مقهى ورد / منيو
              </div>
              <div className="text-[var(--ink)] shrink-0 text-[13px] font-[400] leading-[21px] text-right w-[88px]">{ /* 0147 */}
                0147
              </div>
            </div>
            <div className="flex items-center bg-[var(--surface)] [border-color:var(--border)] [border-style:solid] [border-width:0px_0px_1px_0px] shrink-0 gap-[12px] h-[71.5px] [margin:0px_0px_-0.5px_0px] p-[0px_16px] w-[1112px]">{ /* Order 0146 */}
              <div className="flex items-center justify-end shrink-0 gap-[8px] h-[32px] w-[104px]">{ /* Row actions */}
                <div className="flex items-center justify-center bg-[var(--surface)] rounded-[8px] shrink-0 gap-[6px] h-[32px] [outline-offset:-0.5px] [outline:1px_solid_var(--border)] p-[0px_10px] w-fit">{ /* Table action / عرض الطلب */}
                  <div className="text-[var(--ink)] text-[12px] font-[600] leading-[19px] text-left whitespace-nowrap">{ /* Action label */}
                    عرض الطلب
                  </div>
                </div>
              </div>
              <div className="text-[var(--ink)] shrink-0 text-[13px] font-[400] leading-[21px] text-right w-[130px]">{ /* 6,400 ج.م */}
                6,400 ج.م
              </div>
              <div className="text-[var(--ink)] shrink-0 text-[13px] font-[400] leading-[21px] text-right w-[136px]">{ /* 20 يونيو */}
                20 يونيو
              </div>
              <div className="flex justify-end shrink-0 w-[136px]">{ /* Status cell */}
                <div className="flex bg-[var(--warning-soft)] rounded-[8px] shrink-0 p-[3px_10px] w-fit">{ /* Status / تعديل مطلوب */}
                  <div className="text-[var(--warning-text)] text-[12px] font-[600] leading-[19px] text-left whitespace-nowrap">{ /* تعديل مطلوب */}
                    تعديل مطلوب
                  </div>
                </div>
              </div>
              <div className="text-[var(--ink)] flex-1 text-[13px] font-[400] leading-[21px] text-right">{ /* مدار / بانر */}
                مؤسسة مدار / بانر
              </div>
              <div className="text-[var(--ink)] shrink-0 text-[13px] font-[400] leading-[21px] text-right w-[88px]">{ /* 0146 */}
                0146
              </div>
            </div>
          </div>
          <div className="flex items-center shrink-0 gap-[12px] w-full">{ /* Dashboard footer */}
            <div className="text-[var(--muted-foreground)] flex-1 text-[12px] font-[400] leading-[19px] text-right">{ /* عرض البيانات حسب صلاحيات المسؤول */}
              عرض البيانات حسب صلاحيات المسؤول
            </div>
            <div className="text-[var(--muted-foreground)] flex-1 text-[12px] font-[400] leading-[19px] text-right">{ /* 18 يونيو 2025 • الفرع الرئيسي */}
              18 يونيو 2025 • الفرع الرئيسي
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-[var(--surface)] [border-color:var(--border)] [border-style:solid] [border-width:0px_0px_0px_1px] shrink-0 gap-[16px] h-full p-[20px_12px] w-[264px]">{ /* Right sidebar · V3 */}
        <div className="flex flex-col shrink-0 gap-[2px] p-[0px_8px] w-full">{ /* PBMS branding */}
          <div className="text-[var(--primary)] text-[28px] font-[400] leading-[39px] text-right w-full">{ /* PBMS */}
            PBMS
          </div>
          <div className="text-[var(--ink)] text-[14px] font-[700] leading-[22px] text-right w-full">{ /* مطبعة الإتقان */}
            مطبعة الإتقان
          </div>
          <div className="text-[var(--muted-foreground)] text-[11px] font-[400] leading-[18px] text-right w-full">{ /* إدارة أعمال الطباعة */}
            إدارة أعمال الطباعة
          </div>
        </div>
        <div className="flex flex-col flex-1 gap-[4px] w-full">{ /* Authorized navigation — grouped original scope */}
          <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[normal] text-right w-full">{ /* Group الرئيسية */}
            الرئيسية
          </div>
          <div className="flex items-center bg-[var(--primary-soft)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / لوحة التحكم */}
            <div className="text-[var(--primary)] flex-1 text-[14px] font-[600] leading-[normal] text-right">{ /* Navigation label */}
              لوحة التحكم
            </div>
            <Icon name="layout-dashboard" className="shrink-0 h-[20px] w-[20px]" color="var(--primary)" />{ /* Navigation icon */}
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / مركز الإجراءات */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              مركز الإجراءات
            </div>
            <Icon name="list-checks" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
          <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[normal] text-right w-full">{ /* Group إدارة الأوردرات */}
            إدارة الأوردرات
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / الطلبات */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              الطلبات
            </div>
            <Icon name="clipboard-list" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / طلبات الأوردرات */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              طلبات الأوردرات
            </div>
            <Icon name="inbox" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / العملاء */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              العملاء
            </div>
            <Icon name="users" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
          <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[normal] text-right w-full">{ /* Group المنتجات والتسعير */}
            المنتجات والتسعير
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / المنتجات */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              المنتجات
            </div>
            <Icon name="package" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / التسعير */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              التسعير
            </div>
            <Icon name="tags" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
          <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[normal] text-right w-full">{ /* Group التشغيل */}
            التشغيل
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / إدارة التصميم */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              إدارة التصميم
            </div>
            <Icon name="pen-tool" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / التسليم */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              التسليم
            </div>
            <Icon name="truck" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
          <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[normal] text-right w-full">{ /* Group الماليات */}
            الماليات
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / المحاسبة */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              المحاسبة
            </div>
            <Icon name="wallet" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
          <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[normal] text-right w-full">{ /* Group المتابعة */}
            المتابعة
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / التقارير */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              التقارير
            </div>
            <Icon name="chart-no-axes-combined" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / البحث */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              البحث
            </div>
            <Icon name="search" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
          <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[normal] text-right w-full">{ /* Group الإدارة والنظام */}
            الإدارة والنظام
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / الموظفون */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              الموظفون
            </div>
            <Icon name="contact" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / سجل التدقيق */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              سجل التدقيق
            </div>
            <Icon name="history" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
          <div className="flex items-center bg-[var(--surface)] rounded-[10px] shrink-0 gap-[10px] h-[44px] p-[0px_12px] w-full">{ /* Navigation / الإعدادات */}
            <div className="text-[var(--text-secondary)] flex-1 text-[14px] font-[500] leading-[normal] text-right">{ /* Navigation label */}
              الإعدادات
            </div>
            <Icon name="settings" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* Navigation icon */}
          </div>
        </div>
        <div className="flex flex-col bg-[var(--background)] rounded-[10px] shrink-0 gap-[4px] p-[12px] w-full">{ /* Workspace identity */}
          <div className="text-[var(--ink)] text-[12px] font-[400] leading-[19px] text-right w-full">{ /* الفرع الرئيسي • القاهرة */}
            الفرع الرئيسي • القاهرة
          </div>
          <div className="text-[var(--muted-foreground)] text-[11px] font-[400] leading-[18px] text-right w-full">{ /* حساب إداري • اتصال آمن */}
            حساب إداري • اتصال آمن
          </div>
        </div>
      </div>
    </div>
  );
}
