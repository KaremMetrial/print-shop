import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/** مساعد UX فقط (إظهار/إخفاء). الصلاحية الحقيقية دائمًا على الـBackend (BR-084). */
export function usePermissions() {
    const perms = new Set(usePage<SharedData>().props.auth.user?.permissions ?? []);
    const can = (code: string) => perms.has(code);
    const canAny = (codes: string | string[]) => (Array.isArray(codes) ? codes : [codes]).some((c) => perms.has(c));
    return { can, canAny };
}
