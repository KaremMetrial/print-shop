import { PenInput, PenSelect } from '@/components/pen/form';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

export interface CatalogProduct {
    id: number;
    name: string;
    minimum_quantity: number | null;
    groups: { id: number; name: string; is_required: boolean; values: { id: number; name: string }[] }[];
}
const btn =
    'flex h-[34px] w-fit shrink-0 items-center justify-center rounded-[8px] p-[0px_12px] text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap [outline-offset:-0.5px] disabled:opacity-60';

/** إضافة بند لأوردر في مرحلة التصميم: المنتج + الكمية + الخيارات. السعر يحسبه السيرفر ويُسند البند لمصمم تلقائيًا. */
export function AddItemDialog({ orderId, catalog, onClose }: { orderId: number; catalog: CatalogProduct[]; onClose: () => void }) {
    const [pid, setPid] = useState('');
    const [qty, setQty] = useState('');
    const [opts, setOpts] = useState<Record<number, number[]>>({});
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const key = useRef(crypto.randomUUID());
    const p = catalog.find((x) => String(x.id) === pid);
    const submit = () => {
        if (!p || !Number(qty) || p.groups.some((g) => g.is_required && !opts[g.id]?.length))
            return setErr('اختر المنتج والكمية وكل الخيارات المطلوبة.');
        setBusy(true);
        router.post(`/orders/${orderId}/items`, { product_id: p.id, quantity: Number(qty), options: opts } as never, {
            headers: { 'Idempotency-Key': crypto.randomUUID() },
            preserveScroll: true,
            onFinish: () => setBusy(false),
            onSuccess: onClose,
        });
    };
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[520px] max-w-[95vw] gap-[14px] rounded-[12px] p-[20px]" dir="ltr">
                <DialogTitle className="w-full text-right text-[20px] leading-[30px] font-[700] text-[var(--ink)]">إضافة بند</DialogTitle>
                <DialogDescription className="w-full text-right text-[13px] leading-[21px] text-[var(--muted-foreground)]">
                    يُحسب السعر تلقائيًا بشريحة العميل ويُسند البند لمصمم مناسب.
                </DialogDescription>
                <PenSelect
                    v3
                    label="المنتج"
                    value={pid}
                    placeholder="اختر المنتج"
                    options={catalog.map((x) => ({ value: String(x.id), label: x.name }))}
                    onValueChange={(v) => {
                        setPid(v);
                        setOpts({});
                        setErr('');
                    }}
                />
                <PenInput
                    v3
                    label={`الكمية${p?.minimum_quantity ? ` (الحد الأدنى ${p.minimum_quantity})` : ''}`}
                    value={qty}
                    inputMode="numeric"
                    onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))}
                />
                {p?.groups.map((g) => (
                    <PenSelect
                        key={g.id}
                        v3
                        label={g.name}
                        value={opts[g.id]?.[0] ? String(opts[g.id][0]) : ''}
                        placeholder={g.is_required ? 'اختر' : 'بدون'}
                        options={g.values.map((v) => ({ value: String(v.id), label: v.name }))}
                        onValueChange={(v) => setOpts({ ...opts, [g.id]: [Number(v)] })}
                    />
                ))}
                {err && (
                    <div role="alert" className="w-full text-right text-[12px] text-[#DC2626]">
                        {err}
                    </div>
                )}
                <div className="flex w-full items-center justify-end gap-[12px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`${btn} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`}
                    >
                        الرجوع
                    </button>
                    <button type="button" disabled={busy} onClick={submit} className={`${btn} bg-[var(--primary)] text-white`}>
                        إضافة البند
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
