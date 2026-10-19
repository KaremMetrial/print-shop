import { DataGrid, ListHead, Pill, RowBtn, SearchBox, TabsBar } from '@/components/pen/lists';
import { PenInput, PenTextarea } from '@/components/pen/form';
import { PenPagination } from '@/components/pen/primitives';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoneyFixed, formatTime } from '@/lib/money';
import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

interface Proof {
    id: number;
    number: string;
    customer: string;
    order: string;
    order_id: number;
    amount_minor: number;
    method: string;
    at: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    file_id: number;
    file_name: string;
    is_image: boolean;
    reference: string | null;
    reject_reason: string | null;
}
interface Props {
    proofs: { data: Proof[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    status: Proof['status'];
    filters: Record<string, string>;
    methods: Record<string, string>;
    counts: Record<Proof['status'], number>;
}
const STATUS = { PENDING: ['#FFF7ED', '#9A3412', 'بانتظار المراجعة'], APPROVED: ['#E6F5EA', '#237A4B', 'تم التأكيد'], REJECTED: ['#FEF0F0', '#B42318', 'مرفوضة'] } as const;
const btn = 'flex h-[38px] items-center justify-center rounded-[8px] p-[0px_14px] text-[13px] font-[600] disabled:opacity-60';

function Review({ p, onClose }: { p: Proof; onClose: () => void }) {
    const [mode, setMode] = useState<'view' | 'reject'>('view');
    const [amount, setAmount] = useState((p.amount_minor / 100).toString());
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const key = useRef(crypto.randomUUID());
    const done = { preserveScroll: true, onFinish: () => setBusy(false), onSuccess: onClose, headers: { 'Idempotency-Key': key.current } };
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[640px] max-w-[95vw] gap-[14px] rounded-[12px] p-[20px]" dir="ltr">
                <DialogTitle className="w-full text-right text-[20px] font-[700] text-[var(--ink)]">{`مراجعة الإثبات ${p.number}`}</DialogTitle>
                <DialogDescription className="w-full text-right text-[13px] text-[var(--muted-foreground)]">{`${p.customer} • ${p.order} • ${p.method}${p.reference ? ` • مرجع ${p.reference}` : ''}`}</DialogDescription>
                <div className="flex max-h-[320px] w-full items-center justify-center overflow-hidden rounded-[8px] bg-[var(--background)] [outline:1px_solid_var(--border)]">
                    {p.is_image ? <img src={`/files/${p.file_id}/preview`} alt="إثبات الدفع" className="max-h-[320px] object-contain" /> : <a href={`/files/${p.file_id}/download`} className="p-[24px] text-[14px] text-[var(--primary)]">{p.file_name} — تنزيل</a>}
                </div>
                {mode === 'view' ? (
                    <>
                        <PenInput v3 label="المبلغ المؤكد (ج.م) — عدّله إن اختلف عن المدّعى" value={amount} inputMode="decimal" onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
                        <div className="text-right text-[12px] text-[var(--muted-foreground)]">اعتماد الإثبات يسجّل دفعة فعلية ويوزّعها على الأوردر. الإثبات وحده لا يغيّر الحسابات.</div>
                        <div className="flex w-full justify-end gap-[12px]">
                            <button type="button" className={`${btn} bg-[var(--surface)] text-[#B42318] [outline:1px_solid_var(--border)]`} onClick={() => setMode('reject')}>رفض</button>
                            <button type="button" disabled={busy || !Number(amount)} className={`${btn} bg-[var(--primary)] text-white`} onClick={() => { setBusy(true); router.post(`/accounting/proofs/${p.id}/approve`, { amount_minor: Math.round(Number(amount) * 100) }, done); }}>اعتماد وتسجيل الدفعة</button>
                        </div>
                    </>
                ) : (
                    <>
                        <PenTextarea v3 label="سبب الرفض *" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="اكتب السبب ليظهر للعميل…" />
                        <div className="flex w-full justify-end gap-[12px]">
                            <button type="button" className={`${btn} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`} onClick={() => setMode('view')}>رجوع</button>
                            <button type="button" disabled={busy || !reason.trim()} className={`${btn} bg-[#DC2626] text-white`} onClick={() => { setBusy(true); router.post(`/accounting/proofs/${p.id}/reject`, { reason }, done); }}>تأكيد الرفض</button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

/** S-052-01 طابور إثباتات الدفع + S-052-02 مراجعة الإثبات (نافذة). pendev: byHTX / cYMXm */
export default function Proofs({ proofs, status, filters, counts }: Props) {
    const [sel, setSel] = useState<Proof | null>(null);
    const go = (n: Record<string, string | undefined>) => router.get('/accounting/proofs', { status, ...filters, ...n }, { preserveState: true });
    return (
        <AppLayout active="/accounting">
            <Head title="إثباتات الدفع" />
            {sel && <Review p={sel} onClose={() => setSel(null)} />}
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <ListHead crumbs={[{ label: 'المحاسبة', href: '/accounting' }, 'إثباتات الدفع']} title="إثباتات الدفع" subtitle="مراجعة إثباتات التحويل التي أرسلها العملاء." />
                <TabsBar value={status} onChange={(s) => router.get('/accounting/proofs', { status: s })} tabs={[['PENDING', `بانتظار المراجعة (${counts.PENDING})`], ['APPROVED', `تم التأكيد (${counts.APPROVED})`], ['REJECTED', `مرفوضة (${counts.REJECTED})`]]} />
                <SearchBox value={filters.q ?? ''} onSubmit={(q) => go({ q: q || undefined })} placeholder="ابحث باسم العميل أو رقم الأوردر" />
                <DataGrid
                    empty="لا توجد إثباتات في هذه الحالة."
                    rows={proofs.data}
                    cols={[
                        { h: 'الإجراء', w: 154, cell: (p) => (p.status === 'PENDING' ? <RowBtn primary onClick={() => setSel(p)}>مراجعة الإثبات</RowBtn> : p.reject_reason ?? null) },
                        { h: 'الحالة', w: 154, cell: (p) => <Pill bg={STATUS[p.status][0]} fg={STATUS[p.status][1]}>{STATUS[p.status][2]}</Pill> },
                        { h: 'تاريخ الإرسال', w: 136, cell: (p) => `${formatDate(p.at, { year: false })}، ${formatTime(p.at)}` },
                        { h: 'طريقة الدفع', w: 110, cell: (p) => p.method },
                        { h: 'مبلغ الإثبات', w: 110, cell: (p) => <b>{formatMoneyFixed(p.amount_minor)}</b> },
                        { h: 'الأوردر', w: 110, cell: (p) => p.order },
                        { h: 'العميل', w: 182, cell: (p) => p.customer },
                        { h: 'رقم الإثبات', w: 100, cell: (p) => p.number },
                    ]}
                />
                <PenPagination page={proofs.current_page} pages={proofs.last_page} summary={`عرض ${proofs.from ?? 0}–${proofs.to ?? 0} من ${proofs.total}`} onPage={(p) => go({ page: String(p) })} />
            </div>
        </AppLayout>
    );
}
