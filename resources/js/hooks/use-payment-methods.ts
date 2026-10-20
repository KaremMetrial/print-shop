import { usePage } from '@inertiajs/react';

/** طرق الدفع من الإعدادات (المفعّل للإدخال الجديد + كل التسميات للعرض). مصدرها الخادم: PaymentMethod. */
export function usePaymentMethods(): { enabled: Record<string, string>; labels: Record<string, string> } {
    const p = usePage().props as { paymentMethods?: Record<string, string>; paymentMethodLabels?: Record<string, string> };

    return { enabled: p.paymentMethods ?? {}, labels: p.paymentMethodLabels ?? {} };
}
