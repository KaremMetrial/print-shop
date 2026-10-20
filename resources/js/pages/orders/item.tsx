import { PageTabs } from '@/components/pen/page-tabs';
import { ChatPanel } from '@/components/chat/chat-panel';
import { PenSelect } from '@/components/pen/form';
import { PenBreadcrumb } from '@/components/pen/primitives';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney, formatMoneyFixed, formatTime } from '@/lib/money';
import { Head, Link, router } from '@inertiajs/react';
import { useRef, useState, type ReactNode } from 'react';

type Tab = 'specs' | 'files' | 'versions' | 'chat' | 'activity';
interface Props {
    tab: Tab;
    order: { id: number; number: string; customer: string; status: string; created_at: string | null };
    item: { id: number; code: string; product: string; quantity: number; state: string; state_label: string; designer: string | null; designer_id: number | null; notes: string | null; options: { group: string; value: string; addition_minor: number }[]; cancelled: boolean; cancel_reason: string | null; updated_at: string; total_minor?: number };
    versions: { id: number; no: number; status: string; submitted_at: string | null; notes: string | null; files: { id: number; name: string }[] }[];
    activity: { id: number; action: string; at: string; note: string | null }[];
    audit: { id: number; action: string; at: string }[];
    designers: { id: number; name: string }[];
    can: { assign: boolean; chat: boolean; price: boolean };
}
const TABS: [Tab, string][] = [['specs', 'المواصفات'], ['files', 'ملفات العميل'], ['versions', 'نسخ التصميم'], ['chat', 'المحادثة'], ['activity', 'سجل النشاط']];
const dt = (iso: string) => `${formatDate(iso)}، ${formatTime(iso)}`;
const panel = 'flex w-full shrink-0 flex-col gap-[14px] rounded-[12px] bg-[var(--surface)] p-[18px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const btn34 = 'flex h-[34px] w-fit shrink-0 items-center justify-center rounded-[8px] bg-[var(--surface)] p-[0px_12px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]';

const Row = ({ k, v, big }: { k: string; v: ReactNode; big?: boolean }) => (
    <div className={`flex w-full shrink-0 items-center gap-[12px] [border-bottom:1px_solid_var(--border)] ${big ? 'p-[7px_0px]' : 'p-[6px_0px]'}`}>
        <div className={`flex-1 text-right font-[600] text-[var(--ink)] ${big ? 'text-[13px] leading-[21px]' : 'text-[12px] leading-[19px]'}`}>{v}</div>
        <div className={`flex-1 text-right font-[400] text-[var(--muted-foreground)] ${big ? 'text-[12px] leading-[19px]' : 'text-[11px] leading-[18px]'}`}>{k}</div>
    </div>
);

function AssignDialog({ p, onClose }: { p: Props; onClose: () => void }) {
    const [d, setD] = useState(p.item.designer_id ? String(p.item.designer_id) : '');
    const key = useRef(crypto.randomUUID());
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[440px] max-w-[95vw] gap-[14px] rounded-[12px] p-[20px]" dir="ltr">
                <DialogTitle className="w-full text-right text-[20px] font-[700] text-[var(--ink)]">تغيير المصمم</DialogTitle>
                <DialogDescription className="w-full text-right text-[13px] text-[var(--muted-foreground)]">{p.item.code} — {p.item.product}</DialogDescription>
                <PenSelect v3 label="المصمم" value={d} placeholder="اختر المصمم" options={p.designers.map((x) => ({ value: String(x.id), label: x.name }))} onValueChange={setD} />
                <div className="flex w-full justify-end gap-[12px]">
                    <button type="button" onClick={onClose} className={btn34}>الرجوع</button>
                    <button type="button" disabled={!d} onClick={() => router.post(`/design/items/${p.item.id}/assign`, { designer_id: Number(d) }, { headers: { 'Idempotency-Key': key.current }, preserveScroll: true, onSuccess: onClose })} className="flex h-[34px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_12px] text-[12px] font-[600] text-white disabled:opacity-60">حفظ</button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/** S-014 (01..05) — تفاصيل البند للموظف. pendev: wxQzD / S9TD0 / Togdi / NsP4Z / k9FrO */
export default function OrderItemPage(p: Props) {
    const { order: o, item: i, tab, can } = p;
    const [assign, setAssign] = useState(false);
    const [first, ...rest] = i.options;
    return (
        <AppLayout active="/orders">
            <Head title={`تفاصيل البند ${i.code}`} />
            {assign && <AssignDialog p={p} onClose={() => setAssign(false)} />}
            <div className="flex w-full shrink-0 flex-col gap-[18px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'الأوردرات', href: '/orders' }, { label: o.number, href: `/orders/${o.id}?tab=items` }, i.code]} />
                <div className="flex w-full shrink-0 justify-between gap-[12px]">
                    <div className="flex flex-1 flex-col gap-[4px]">
                        <h1 className="w-full text-right text-[28px] leading-[39px] font-[700] text-[var(--ink)]">تفاصيل البند</h1>
                        <div className="w-full text-right text-[14px] leading-[22px] text-[var(--muted-foreground)]">{`${i.code} • ${i.product}`}</div>
                        <div className="w-full text-right text-[12px] leading-[19px] text-[var(--muted-foreground)]">{`${o.number} • ${o.customer}${o.created_at ? ` • تم الإنشاء ${dt(o.created_at)}` : ''} • آخر تحديث ${dt(i.updated_at)}`}</div>
                    </div>
                    <div className="flex w-fit flex-col items-end gap-[8px]">
                        <div className="flex w-fit items-center rounded-[8px] bg-[#FEF3C7] p-[4px_10px]">
                            <div className="text-[11px] font-[700] whitespace-nowrap text-[#92400E]">{i.state_label}</div>
                        </div>
                        <div className="text-right text-[13px] leading-[21px] text-[var(--muted-foreground)]">{`المصمم: ${i.designer ?? 'غير معيّن'}`}</div>
                    </div>
                </div>
                <PageTabs label="أقسام البند" value={tab} tabs={[...TABS].reverse().filter(([k]) => k !== 'chat' || can.chat).map(([key, label]) => ({ key, label, href: `/orders/${o.id}/items/${i.id}?tab=${key}` }))} />

                {tab === 'specs' && (
                    <>
                        <div className="w-full text-right text-[19px] leading-[30px] font-[700] text-[var(--ink)]">بيانات البند</div>
                        <div className={panel}>
                            <Row big k="رقم البند" v={i.code} />
                            <Row big k="اسم المنتج" v={i.product} />
                            <Row big k="الكمية" v={i.quantity} />
                            {can.price && i.total_minor !== undefined && <Row big k="سعر البند" v={formatMoney(i.total_minor)} />}
                            <Row big k="المصمم المسؤول" v={i.designer ?? 'غير معيّن'} />
                            <Row big k="حالة التصميم" v={i.state_label} />
                        </div>
                        <div className="flex w-full shrink-0 gap-[14px]">
                            <div className={`${panel} min-w-0 flex-1`}>
                                <div className="w-full text-right text-[17px] leading-[27px] font-[700] text-[var(--ink)]">مواصفات الطباعة</div>
                                {i.options.length ? i.options.map((x, n) => <Row key={n} k={x.group} v={x.value} />) : <div className="text-right text-[12px] text-[var(--muted-foreground)]">لا توجد مواصفات.</div>}
                            </div>
                            <div className={`${panel} min-w-0 flex-1`}>
                                <div className="w-full text-right text-[17px] leading-[27px] font-[700] text-[var(--ink)]">الخيارات المحددة</div>
                                {first && <Row k={first.group} v={first.value} />}
                                {can.price && <Row k="الزيادة على سعر الوحدة" v={formatMoneyFixed(i.options.reduce((a, x) => a + x.addition_minor, 0))} />}
                                <Row k="الحالة" v={i.cancelled ? 'ملغي' : 'نشط'} />
                                {rest.length === 0 && null}
                            </div>
                        </div>
                        <div className="flex w-full shrink-0 flex-col gap-[14px] rounded-[12px] bg-[var(--surface)] p-[14px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                            <div className="w-full text-right text-[16px] leading-[26px] font-[700] text-[var(--ink)]">ملاحظات البند</div>
                            <div className="w-full text-right text-[12px] leading-[19px] text-[var(--muted-foreground)]">{i.cancelled ? `ملغي: ${i.cancel_reason ?? ''}` : (i.notes ?? 'لا توجد ملاحظات.')}</div>
                        </div>
                        <div className="flex w-full shrink-0 items-center justify-end gap-[12px]">
                            {can.assign && (
                                <button type="button" onClick={() => setAssign(true)} className={btn34}>تغيير المصمم</button>
                            )}
                            <Link href={`/orders/${o.id}?tab=items`} className="flex h-[34px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_12px] text-[12px] font-[600] text-white">العودة لبنود الأوردر</Link>
                        </div>
                    </>
                )}
                {tab === 'files' && <div className={`${panel} items-center text-[14px] text-[var(--muted-foreground)]`}>لا توجد ملفات مرفوعة من العميل لهذا البند.</div>}
                {tab === 'versions' && (
                    <div className="flex w-full shrink-0 flex-col gap-[12px]">
                        {p.versions.length === 0 && <div className={`${panel} items-center text-[14px] text-[var(--muted-foreground)]`}>لم يُرفع أي تصميم بعد.</div>}
                        {p.versions.map((v) => (
                            <div key={v.id} className={panel}>
                                <Row k={`النسخة ${v.no}`} v={`${{ DRAFT: 'مسودة', SUBMITTED: 'مرسلة للعميل', APPROVED: 'معتمدة', SUPERSEDED: 'مستبدلة' }[v.status] ?? v.status}${v.submitted_at ? ` • ${dt(v.submitted_at)}` : ''}`} />
                                <div className="text-right text-[12px] text-[var(--muted-foreground)]">{v.files.map((f) => f.name).join(' • ') || 'بدون ملفات'}{v.notes ? ` — ${v.notes}` : ''}</div>
                            </div>
                        ))}
                    </div>
                )}
                {tab === 'chat' && can.chat && <ChatPanel url={`/chat/items/${i.id}`} mine={['staff']} />}
                {tab === 'activity' && (
                    <div className={panel}>
                        {p.activity.length === 0 && <div className="text-right text-[13px] text-[var(--muted-foreground)]">لا يوجد نشاط بعد.</div>}
                        {p.activity.map((a) => (
                            <Row key={a.id} k={dt(a.at)} v={`${a.action}${a.note ? ` — ${a.note}` : ''}`} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
