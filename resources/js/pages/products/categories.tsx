import { PenInput } from '@/components/pen/form';
import { DataGrid, ListHead, Pill, RowBtn } from '@/components/pen/lists';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

interface Cat {
    id: number;
    name: string;
    active: boolean;
    sort: number;
    products: number;
}
const btn = 'flex h-[38px] items-center rounded-[8px] p-[0px_14px] text-[13px] font-[600] disabled:opacity-60';

function Form({ cat, onClose }: { cat: Cat | null; onClose: () => void }) {
    const [name, setName] = useState(cat?.name ?? '');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const key = useRef(crypto.randomUUID());
    const go = () => {
        if (!name.trim()) return setErr('اسم التصنيف مطلوب.');
        setBusy(true);
        const o = { preserveScroll: true, onFinish: () => setBusy(false), onSuccess: onClose, onError: (e: Record<string, string>) => setErr(Object.values(e)[0]), headers: { 'Idempotency-Key': key.current } };
        if (cat) router.patch(`/categories/${cat.id}`, { name }, o);
        else router.post('/categories', { name }, o);
    };
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[420px] max-w-[95vw] gap-[14px] rounded-[12px] p-[20px]" dir="ltr">
                <DialogTitle className="w-full text-right text-[20px] font-[700] text-[var(--ink)]">{cat ? 'تعديل التصنيف' : 'إضافة تصنيف'}</DialogTitle>
                <PenInput v3 label="اسم التصنيف" value={name} error={err || undefined} onChange={(e) => { setName(e.target.value); setErr(''); }} />
                <div className="flex w-full justify-end gap-[12px]">
                    <button type="button" onClick={onClose} className={`${btn} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`}>إلغاء</button>
                    <button type="button" disabled={busy} onClick={go} className={`${btn} bg-[var(--primary)] text-white`}>حفظ</button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/** تصنيفات المنتجات — إدارة بسيطة (لا يوجد frame مخصص في الـpen؛ انظر 11-ui-deviations). */
export default function Categories({ categories, can }: { categories: Cat[]; can: { manage: boolean } }) {
    const [edit, setEdit] = useState<Cat | null | 'new'>(null);
    return (
        <AppLayout active="/categories">
            <Head title="تصنيفات المنتجات" />
            {edit !== null && <Form cat={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <ListHead crumbs={[{ label: 'الرئيسية', href: '/dashboard' }, 'التصنيفات']} title="تصنيفات المنتجات" subtitle="تنظيم المنتجات في تصنيفات." actions={can.manage ? <button type="button" onClick={() => setEdit('new')} className="flex h-[46px] items-center rounded-[10px] bg-[var(--primary)] p-[0px_18px] text-[14px] font-[600] text-white">إضافة تصنيف</button> : undefined} />
                <DataGrid
                    empty="لا توجد تصنيفات."
                    rows={categories}
                    cols={[
                        { h: 'الإجراءات', w: 220, cell: (c) => can.manage ? <div className="flex gap-[6px]"><RowBtn onClick={() => setEdit(c)}>تعديل</RowBtn><RowBtn onClick={() => router.post(`/categories/${c.id}/toggle`)}>{c.active ? 'إيقاف' : 'تفعيل'}</RowBtn></div> : null },
                        { h: 'الحالة', w: 100, cell: (c) => (c.active ? <Pill bg="#E6F5EA" fg="#237A4B">نشط</Pill> : <Pill bg="#F1F5F9" fg="#475569">موقوف</Pill>) },
                        { h: 'المنتجات', w: 100, cell: (c) => c.products },
                        { h: 'الاسم', cell: (c) => <b>{c.name}</b> },
                    ]}
                />
            </div>
        </AppLayout>
    );
}
