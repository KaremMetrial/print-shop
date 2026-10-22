import { router } from '@inertiajs/react';

/**
 * مفتاح منع التكرار (Idempotency-Key) للطلبات المعدِّلة.
 * - ثابت أثناء الطلب الجاري (ضغطتان سريعتان = نفس المفتاح فيرفض الخادم التكرار).
 * - يتجدد بعد انتهاء أي طلب (نجاح أو فشل) فلا تُعاد استجابة قديمة لإجراء مختلف أو لمحاولة بعد تصحيح خطأ.
 * (كان المفتاح يُنشأ مرة لكل نافذة/صفحة فيُعاد استخدامه بين إجراءات مختلفة، فتبدو الأزرار «لا تعمل».)
 */
/** crypto.randomUUID غير متاح خارج السياقات الآمنة (http على الشبكة المحلية) فنستعمل بديلًا. */
export const uuid = (): string => {
    const c: Crypto = crypto;
    if (typeof c.randomUUID === 'function') return c.randomUUID();
    const b = c.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');

    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

let key = uuid();
router.on('finish', () => {
    key = uuid();
});

export const idemHeaders = (): Record<string, string> => ({ 'Idempotency-Key': key });
