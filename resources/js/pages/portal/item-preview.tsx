import { idemHeaders } from '@/lib/idempotency';
import { ChatPanel } from '@/components/chat/chat-panel';
import { CustomerLayout } from '@/components/shell/customer-layout';
import { CustomerMobileShell, mArrowBack, mBtnOutline, mBtnPrimary, mCard } from '@/components/shell/customer-mobile';
import { Icon } from '@/pen/icon';
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
    const [failed, setFailed] = useState<Record<number, boolean>>({});
    const [zoom, setZoom] = useState(1);
    const [full, setFull] = useState(false);
    const [chat, setChat] = useState(false);
    const f = v?.files[cur];
    const approved = v?.status === 'APPROVED';
    const ORD = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
    const broken = !f || failed[f.id];
    const canApprove = !!v && !approved && !broken;
    const dialog = confirm && v && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]">
            <div dir="rtl" className="flex w-[440px] max-w-full flex-col gap-[14px] rounded-[12px] bg-white p-[24px]">
                <div className="text-[16px] font-[700]">اعتماد التصميم</div>
                <div className="text-[13px] text-[#64748B]">بعد الاعتماد لا يمكنك التراجع بنفسك. تأكد من مراجعة كل الملفات.</div>
                <div className="flex justify-end gap-[12px]">
                    <button type="button" onClick={() => setConfirm(false)} className="h-[40px] rounded-[8px] p-[0px_16px] text-[14px] [outline:1px_solid_#E2E8F0]">رجوع</button>
                    <button type="button" onClick={() => router.post(`/portal/orders/${order.id}/items/${item.id}/approve`, { version_id: v.id, revision: v.revision } as never, { headers: idemHeaders(), onFinish: () => setConfirm(false) })} className="h-[40px] rounded-[8px] bg-[#2563EB] p-[0px_16px] text-[14px] font-[600] text-white">تأكيد الاعتماد</button>
                </div>
            </div>
        </div>
    );
    const mobile = (
        <CustomerMobileShell title="تفاصيل الأوردر" tab="orders" lead={<Link href={`/portal/orders/${order.id}`} aria-label="رجوع">{mArrowBack}</Link>} leadSide="right">
            <div className="w-full text-right text-[22px] leading-[normal] font-[700] text-[#0F172A]">{item.name}</div>
            <div className="w-full text-right text-[15px] leading-[normal] font-[700] text-[#2563EB]">{v ? `النسخة ${ORD[v.no - 1] ?? v.no} · ${approved ? 'معتمد' : 'بانتظار اعتمادك'}` : 'لا توجد معاينة رسمية بعد'}</div>
            <div className={mCard}>
                <div className="w-full text-right text-[17px] leading-[normal] font-[700] text-[#0F172A]">معاينة التصميم الرسمية</div>
                <div className="flex h-[360px] w-full flex-col items-center justify-center gap-[10px] overflow-hidden rounded-[10px] bg-[#F1F5F9] p-[24px]">
                    {broken ? (
                        <>
                            <Icon name="file-image" className="h-[42px] w-[42px]" color="#94A3B8" />
                            <div className="w-full text-center text-[14px] leading-[normal] font-[400] text-[#64748B]">{v ? 'تعذّر تحميل المعاينة.' : 'لا توجد معاينة بعد.'}</div>
                        </>
                    ) : f.mime === 'application/pdf' ? (
                        <iframe title={f.name} src={`/portal/files/${f.id}#toolbar=0`} className="h-full w-full" />
                    ) : (
                        <img src={`/portal/files/${f.id}`} alt={f.name} draggable={false} onContextMenu={(e) => e.preventDefault()} onError={() => setFailed((x) => ({ ...x, [f.id]: true }))} style={{ transform: `scale(${zoom})` }} className="max-h-full max-w-full object-contain" />
                    )}
                </div>
                {v && v.files.length > 1 && (
                    <div className="flex w-full justify-end gap-[8px]">
                        {v.files.map((x, i) => (
                            <button key={x.id} type="button" onClick={() => setCur(i)} className="h-[36px] rounded-[8px] bg-white p-[0px_12px] text-[12px]" style={{ outline: i === cur ? '2px solid #2563EB' : '1px solid #E2E8F0' }}>
                                ملف {i + 1}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex w-full justify-end gap-[16px] text-[14px] leading-[normal] font-[700] text-[#2563EB]">
                    <button type="button" aria-label="تصغير" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>−</button>
                    <button type="button" onClick={() => !broken && setFull(true)}>عرض كامل</button>
                    <button type="button" aria-label="تكبير" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>+</button>
                    <button type="button" onClick={() => setZoom(1)}>ملاءمة العرض</button>
                </div>
            </div>
            <button type="button" disabled={!canApprove} onClick={() => setConfirm(true)} className={canApprove ? mBtnPrimary : 'flex h-[48px] w-full items-center justify-center rounded-[10px] bg-[#E2E8F0] text-[15px] leading-[normal] font-[700] text-[#64748B]'}>
                اعتماد التصميم
            </button>
            <button type="button" onClick={() => setChat((c) => !c)} className={mBtnOutline.replace(/ \[outline[^ ]*/g, '') + ' ' + (chat ? '[outline:1px_solid_#2563EB]' : '')}>
                محادثة البند
            </button>
            {chat && (
                <div className="w-full">
                    <ChatPanel url={`/portal/orders/${order.id}/items/${item.id}/chat`} mine={['customer']} fileUrl={(id) => `/portal/files/${id}`} />
                </div>
            )}
            {full && f && (
                <div role="dialog" aria-modal onClick={() => setFull(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-[8px]">
                    <img src={`/portal/files/${f.id}`} alt={f.name} draggable={false} onContextMenu={(e) => e.preventDefault()} className="max-h-full max-w-full object-contain" />
                </div>
            )}
            {dialog}
        </CustomerMobileShell>
    );
    return (
        <CustomerLayout mobile={mobile}>
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
            {dialog}
        </CustomerLayout>
    );
}
