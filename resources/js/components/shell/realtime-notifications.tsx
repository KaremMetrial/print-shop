import { useRealtime } from '@/hooks/use-realtime';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Payload {
    id: number;
    title: string;
    body: string | null;
    link: string | null;
    type: string;
    unread: number;
}

/**
 * إشعارات لحظية عبر Reverb على القناة الخاصة للمستخدم: تحديث عدّاد الجرس فورًا + تنبيه منبثق قصير،
 * وتحديث صفحة الإشعارات/الإجراءات المفتوحة. عند انقطاع الاتصال يبقى التحديث عند التنقل (Inertia) وكل 60 ثانية كشبكة أمان.
 */
export function RealtimeNotifications() {
    const { auth } = usePage<SharedData>().props;
    const [toasts, setToasts] = useState<Payload[]>([]);
    const timers = useRef<number[]>([]);

    const refresh = useCallback(() => {
        const path = window.location.pathname;
        const full = path.startsWith('/notifications') || path.startsWith('/actions');
        router.reload(full ? {} : { only: ['unread'] });
    }, []);

    useRealtime<Payload>(`App.Models.User.${auth.user.id}`, '.notification.created', (e) => {
        setToasts((t) => [e, ...t].slice(0, 3));
        timers.current.push(window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== e.id)), 8000));
        refresh();
    });

    useEffect(() => {
        const pending = timers.current;
        const t = window.setInterval(() => document.visibilityState === 'visible' && router.reload({ only: ['unread'] }), 60000);
        return () => {
            clearInterval(t);
            pending.forEach(clearTimeout);
        };
    }, []);

    if (!toasts.length) return null;
    return (
        <div
            dir="rtl"
            role="status"
            aria-live="polite"
            className="fixed top-[78px] left-4 z-50 flex w-[340px] max-w-[calc(100vw-32px)] flex-col gap-[8px]"
        >
            {toasts.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                        setToasts((x) => x.filter((y) => y.id !== t.id));
                        router.visit(t.link ?? '/notifications');
                    }}
                    className="flex flex-col gap-[2px] rounded-[12px] bg-[var(--surface)] p-[12px_14px] text-right shadow-lg [outline:1px_solid_var(--border)]"
                >
                    <div className="text-[13px] font-[700] text-[var(--ink)]">{t.title}</div>
                    {t.body && <div className="text-[12px] text-[var(--muted-foreground)]">{t.body}</div>}
                </button>
            ))}
        </div>
    );
}
