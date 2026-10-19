import { StaffLayout } from '@/components/shell/staff-layout';
import { type ReactNode } from 'react';

/** واجهة المصمم تستعمل الشيل المشترك (شريط جانبي + شريط علوي) بقائمة المصمم؛ المحتوى محاذى لليمين كما في التصميم. */
export function DesignerLayout({ children, gap = 16 }: { children: ReactNode; name?: string; gap?: number; sidebar?: number }) {
    return (
        <StaffLayout>
            <div className="flex w-full shrink-0 flex-col items-end" style={{ gap }}>
                {children}
            </div>
        </StaffLayout>
    );
}
