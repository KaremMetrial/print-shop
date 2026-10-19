import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Icon } from '@/pen/icon';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type Tone = 'success' | 'warning' | 'danger';
interface Msg {
    tone: Tone;
    title: string;
    body?: string;
    secret?: string;
}
const TONE: Record<Tone, { icon: string; color: string; bg: string }> = {
    success: { icon: 'circle-check', color: '#15803D', bg: '#F0FDF4' },
    warning: { icon: 'triangle-alert', color: '#B45309', bg: '#FFFBEB' },
    danger: { icon: 'circle-alert', color: '#B91C1C', bg: '#FEF2F2' },
};

/**
 * كل رسائل الاستجابة (نجاح/خطأ/كلمة مرور مؤقتة) تظهر في نافذة منبثقة (modal) بدل شريط داخل الصفحة.
 * كلمة المرور المؤقتة تُعرض مرة واحدة (S-031) وتُنسخ بنقرة.
 */
export function FlashMessages() {
    const { flash, errors, ...rest } = usePage<SharedData & { errors: Record<string, string> }>().props;
    const [queue, setQueue] = useState<Msg[]>([]);
    const [copied, setCopied] = useState(false);
    const key = JSON.stringify([flash?.success, flash?.generated_password, errors?.business, (rest as { url?: string }).url]);

    useEffect(() => {
        const next: Msg[] = [];
        if (flash?.success) next.push({ tone: 'success', title: flash.success });
        if (flash?.generated_password) next.push({ tone: 'warning', title: 'كلمة المرور المؤقتة', body: 'تظهر مرة واحدة فقط. انسخها الآن وسلّمها للمستخدم.', secret: flash.generated_password });
        if (errors?.business) next.push({ tone: 'danger', title: 'تعذر تنفيذ العملية', body: errors.business });
        setQueue(next);
        setCopied(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const m = queue[0];
    const t = m ? TONE[m.tone] : TONE.success;
    return (
        <Dialog open={!!m} onOpenChange={(o) => !o && setQueue((q) => q.slice(1))}>
            <DialogContent dir="rtl" className="w-[440px] max-w-[95vw] gap-[14px] rounded-[12px] p-[24px] text-right">
                {m && (
                    <>
                        <div className="flex items-center gap-[12px]">
                            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full" style={{ background: t.bg }}>
                                <Icon name={t.icon} className="h-[22px] w-[22px]" color={t.color} />
                            </div>
                            <DialogTitle className="flex-1 text-[16px] leading-[26px] font-[700] text-[var(--ink)]">{m.title}</DialogTitle>
                        </div>
                        {m.body && <DialogDescription className="text-[13px] leading-[21px] text-[var(--muted-foreground)]">{m.body}</DialogDescription>}
                        {m.secret && (
                            <div className="flex items-center justify-between gap-[12px] rounded-[10px] bg-[var(--background)] p-[12px_14px] [outline:1px_solid_var(--control-border)]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard?.writeText(m.secret!);
                                        setCopied(true);
                                    }}
                                    className="text-[12px] font-[700] text-[var(--primary)]"
                                >
                                    {copied ? 'تم النسخ' : 'نسخ'}
                                </button>
                                <bdi dir="ltr" className="font-mono text-[16px] font-[700] select-all">
                                    {m.secret}
                                </bdi>
                            </div>
                        )}
                        <div className="flex justify-end">
                            <button type="button" onClick={() => setQueue((q) => q.slice(1))} className="flex h-[40px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_18px] text-[14px] font-[600] text-white">
                                حسنًا
                            </button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
