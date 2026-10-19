// مُولَّد بالأداة tools/ui-compare/pen2tsx.mjs من pendev/untitled.pen — نقطة بداية فقط، يُعاد تنظيمه وتُربط بياناته.
import { Icon } from '@/pen/icon';

export default function S001() {
  return (
    <div className="flex flex-col bg-[var(--background)] shrink-0 gap-[32px] h-[1160px] overflow-hidden p-[48px] w-[1440px]">{ /* S-001 — تسجيل دخول الموظفين */}
      <div className="flex items-center justify-between shrink-0 gap-[12px] w-full">{ /* Login header */}
        <div className="text-[var(--muted-foreground)] flex-1 text-[13px] font-[400] leading-[21px] text-right">{ /* وصول آمن للموظفين فقط */}
          وصول آمن للموظفين فقط
        </div>
        <div className="text-[var(--primary)] flex-1 text-[24px] font-[700] leading-[34px] text-right">{ /* PBMS / مطبعة الإتقان */}
          PBMS / مطبعة الإتقان
        </div>
      </div>
      <div className="flex items-center justify-center flex-1 gap-[12px] w-full">{ /* Authentication area */}
        <div className="flex flex-col bg-[var(--surface)] rounded-[12px] shrink-0 gap-[24px] [outline-offset:-0.5px] [outline:1px_solid_var(--border)] p-[40px] w-[480px]">{ /* Staff authentication */}
          <div className="flex items-center justify-end shrink-0 gap-[12px] w-full">{ /* Secure access */}
            <Icon name="shield-check" className="shrink-0 h-[32px] w-[32px]" color="var(--primary)" />{ /* shield-check */}
          </div>
          <div className="text-[var(--ink)] text-[28px] font-[700] leading-[39px] text-right w-full">{ /* تسجيل دخول الموظفين */}
            تسجيل دخول الموظفين
          </div>
          <div className="text-[var(--muted-foreground)] text-[14px] font-[400] leading-[22px] text-right w-full">{ /* ادخل إلى مساحة عملك الآمنة لمتابعة الطلبات وعمليات المطبعة اليومية. */}
            ادخل إلى مساحة عملك الآمنة لمتابعة الطلبات وعمليات المطبعة اليومية.
          </div>
          <div className="flex flex-col shrink-0 gap-[8px] w-full">{ /* البريد الإلكتروني * */}
            <div className="text-[var(--ink)] text-[14px] font-[600] leading-[22px] text-right w-full">{ /* البريد الإلكتروني * */}
              البريد الإلكتروني *
            </div>
            <div className="flex items-center bg-[var(--background)] rounded-[10px] shrink-0 gap-[12px] h-[48px] [outline-offset:-0.5px] [outline:1px_solid_var(--control-border)] p-[0px_14px] w-full">{ /* Input البريد الإلكتروني * */}
              <div className="text-[var(--ink)] flex-1 text-[14px] font-[400] leading-[22px] text-left">{ /* ahmed.hassan@aletqan.eg */}
                name@company.com
              </div>
            </div>
          </div>
          <div className="flex flex-col shrink-0 gap-[8px] w-full">{ /* كلمة المرور * */}
            <div className="text-[var(--ink)] text-[14px] font-[600] leading-[22px] text-right w-full">{ /* كلمة المرور * */}
              كلمة المرور *
            </div>
            <div className="flex items-center bg-[var(--background)] rounded-[10px] shrink-0 gap-[12px] h-[48px] [outline-offset:-0.5px] [outline:1px_solid_var(--control-border)] p-[0px_14px] w-full">{ /* Input كلمة المرور * */}
              <Icon name="eye" className="shrink-0 h-[20px] w-[20px]" color="var(--muted-foreground)" />{ /* eye */}
              <div className="text-[var(--muted-foreground)] flex-1 text-[14px] font-[400] leading-[22px] text-right">{ /* •••••••••••• */}
                أدخل كلمة المرور
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center bg-[var(--primary)] rounded-[10px] shrink-0 h-[48px] p-[0px_16px] w-full">{ /* تسجيل الدخول */}
            <div className="text-[var(--surface)] text-[14px] font-[600] leading-[normal] text-left whitespace-nowrap">{ /* Label */}
              تسجيل الدخول
            </div>
          </div>
          <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[19px] text-right w-full">{ /* للمساعدة في الوصول، تواصل مع مسؤول النظام. */}
            للمساعدة في الوصول، تواصل مع مسؤول النظام.
          </div>
        </div>
      </div>
      <div className="text-[var(--muted-foreground)] text-[12px] font-[400] leading-[19px] text-center w-full">{ /* PBMS  •  نظام داخلي لإدارة مطبعة واحدة  •  جميع الاتصالات محمية */}
        PBMS • نظام داخلي لإدارة مطبعة واحدة • جميع الاتصالات محمية
      </div>
    </div>
  );
}
