import { PenSelect } from '@/components/pen/form';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

/** تغيير/إسناد مصمم لبند (صلاحية designers.assignment.manage). المصمم الجديد يرى البند فورًا والسابق يفقد وصوله. */
export function AssignDesignerDialog({
    item,
    designers,
    onClose,
}: {
    item: { id: number; label: string; designer_id: number | null };
    designers: { id: number; name: string }[];
    onClose: () => void;
}) {
    const [d, setD] = useState(item.designer_id ? String(item.designer_id) : '');
    const [busy, setBusy] = useState(false);
    const key = useRef(crypto.randomUUID());
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[440px] max-w-[95vw] gap-[14px] rounded-[12px] p-[20px]" dir="ltr">
                <DialogTitle className="w-full text-right text-[20px] font-[700] text-[var(--ink)]">تغيير المصمم</DialogTitle>
                <DialogDescription className="w-full text-right text-[13px] text-[var(--muted-foreground)]">{item.label}</DialogDescription>
                <PenSelect
                    v3
                    label="المصمم"
                    value={d}
                    placeholder="اختر المصمم"
                    options={designers.map((x) => ({ value: String(x.id), label: x.name }))}
                    onValueChange={setD}
                />
                <div className="flex w-full justify-end gap-[12px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-[34px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_12px] text-[12px] font-[600] text-[var(--ink)] [outline:1px_solid_var(--border)]"
                    >
                        الرجوع
                    </button>
                    <button
                        type="button"
                        disabled={!d || busy || Number(d) === item.designer_id}
                        onClick={() => {
                            setBusy(true);
                            router.post(
                                `/design/items/${item.id}/assign`,
                                { designer_id: Number(d) },
                                {
                                    headers: { 'Idempotency-Key': key.current },
                                    preserveScroll: true,
                                    onFinish: () => setBusy(false),
                                    onSuccess: onClose,
                                },
                            );
                        }}
                        className="flex h-[34px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_12px] text-[12px] font-[600] text-white disabled:opacity-60"
                    >
                        حفظ
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
