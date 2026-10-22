import { idemHeaders } from '@/lib/idempotency';
import { CustomerLayout } from '@/components/shell/customer-layout';
import { Head, Link, router } from '@inertiajs/react';
import {useState} from 'react';

interface Props {
    order: { id: number; number: string };
    item: { id: number; name: string; quantity: number };
    version: { id: number; no: number; status: string; revision: number; files: { id: number; name: string; mime: string }[] } | null;
}
/** معاينة تصميم البند للعميل المسجّل (عرض فقط) واعتماده؛ الاعتماد مستقل لكل بند وبفحص stale. */
export default function PortalItemPreview({ order, item, version: v }: Props) {
    const [cur, setCur] = useState(0);
    const [confirm, setConfirm] = useState(false);
    const f = v?.files[cur];
    const approved = v?.status === 'APPROVED';
    return (
        <CustomerLayout>
            <Head title="معاينة التصميم" />
            <div className="flex w-full items-center justify-between">
                <Link href={`/portal/orders/${order.id}`} className="flex h-[40px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_14px] text-[13px] font-[600] text-[var(--primary)] [outline:1px_solid_var(--border)]">
                    العودة للأوردر
                </Link>
                <div className="flex flex-col gap-[4px]">
                    <h1 className="text-right text-[26px] font-[700]">معاينة التصميم — {item.name}</h1>
                    <div className="text-right text-[13px] text-[var(--muted-foreground)]">{order.number} • الكمية {item.quantity}{v ? ` • النسخة ${v.no}` : ''}{approved ? ' • معتمد' : ''}</div>
                </div>
            </div>
            <div className="flex h-[420px] w-full items-center justify-center overflow-hidden rounded-[12px] bg-[#E7EDF5]">
                {f ? f.mime === 'application/pdf' ? <iframe title={f.name} src={`/portal/files/${f.id}#toolbar=0`} className="h-full w-full" /> : <img src={`/portal/files/${f.id}`} alt={f.name} draggable={false} onContextMenu={(e) => e.preventDefault()} className="max-h-full max-w-full object-contain" /> : <span className="text-[14px] text-[var(--muted-foreground)]">لا توجد معاينة بعد.</span>}
            </div>
            <div className="flex w-full justify-end gap-[8px]">
                {v?.files.map((x, i) => (
                    <button key={x.id} type="button" onClick={() => setCur(i)} className="h-[40px] rounded-[8px] bg-[var(--surface)] p-[0px_14px] text-[12px] [outline:1px_solid_var(--border)]" style={{ outline: i === cur ? '2px solid #2563EB' : undefined }}>
                        ملف {i + 1}
                    </button>
                ))}
            </div>
            <div className="w-full text-right text-[12px] text-[var(--muted-foreground)]">معاينة رسمية للعرض فقط</div>
            {v && !approved && (
                <div className="flex w-full justify-start">
                    <button type="button" onClick={() => setConfirm(true)} className="h-[44px] rounded-[8px] bg-[var(--primary)] p-[0px_22px] text-[14px] font-[600] text-white">
                        اعتماد التصميم
                    </button>
                </div>
            )}
            {confirm && v && (
                <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]">
                    <div dir="rtl" className="flex w-[440px] max-w-full flex-col gap-[14px] rounded-[12px] bg-[var(--surface)] p-[24px]">
                        <div className="text-[16px] font-[700]">اعتماد التصميم</div>
                        <div className="text-[13px] text-[var(--muted-foreground)]">بعد الاعتماد لا يمكنك التراجع بنفسك. تأكد من مراجعة كل الملفات.</div>
                        <div className="flex justify-end gap-[12px]">
                            <button type="button" onClick={() => setConfirm(false)} className="h-[40px] rounded-[8px] p-[0px_16px] text-[14px] [outline:1px_solid_var(--border)]">رجوع</button>
                            <button type="button" onClick={() => router.post(`/portal/orders/${order.id}/items/${item.id}/approve`, { version_id: v.id, revision: v.revision } as never, { headers: idemHeaders(), onFinish: () => setConfirm(false) })} className="h-[40px] rounded-[8px] bg-[var(--primary)] p-[0px_16px] text-[14px] font-[600] text-white">
                                تأكيد الاعتماد
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </CustomerLayout>
    );
}
