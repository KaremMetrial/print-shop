import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

/** Dialog / Delete order: يوضح ما سيحدث وما لا يُتراجع عنه، زر إلغاء آمن + تأكيد واضح (§17.8). */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    warning,
    confirmLabel,
    danger,
    reasonLabel,
    reasonRequired,
    processing,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    title: string;
    description: string;
    warning?: string;
    confirmLabel: string;
    danger?: boolean;
    reasonLabel?: string;
    reasonRequired?: boolean;
    processing?: boolean;
    onConfirm: (reason: string) => void;
}) {
    const [reason, setReason] = useState('');
    const blocked = !!reasonLabel && !!reasonRequired && reason.trim().length < 3;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {warning && <div className="bg-danger-soft rounded-control text-[13px] p-3 text-[#B91C1C]">{warning}</div>}
                {reasonLabel && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-text-secondary text-[13px] font-semibold">
                            {reasonLabel}
                            {reasonRequired && <span className="text-danger ms-0.5">*</span>}
                        </label>
                        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
                    </div>
                )}
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        إلغاء
                    </Button>
                    <Button variant={danger ? 'destructive' : 'default'} disabled={processing || blocked} onClick={() => onConfirm(reason.trim())}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
