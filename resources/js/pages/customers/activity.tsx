import { CustomerShell, type CustomerHead } from '@/components/pen/customer-shell';
import { PenFilterMenu, PenPagination, PenRowAction } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Head, router } from '@inertiajs/react';

interface Item {
    id: number;
    action: string;
    summary: string;
    ref: string;
    at: string;
    actor: string;
}
interface Opt {
    value: string;
    label: string;
}
interface Props {
    customer: CustomerHead;
    activity: { data: Item[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    filters: Record<string, string | null>;
    actors: Opt[];
    types: Opt[];
}
const th = 'shrink-0 text-right text-[11px] leading-[18px] font-[600] text-[var(--text-secondary)]';

/** S-032 — سجل نشاط العميل (pendev: wIzzt). للقراءة فقط. */
export default function CustomerActivity({ customer, activity, filters, actors, types }: Props) {
    const go = (n: Record<string, string | undefined>) => router.get(`/customers/${customer.id}/activity`, { ...filters, page: undefined, ...n }, { preserveState: true, replace: true });
    return (
        <AppLayout>
            <Head title="نشاط العميل" />
            <CustomerShell customer={customer} active="activity" title="سجل نشاط العميل" crumb="نشاط العميل">
                <div className="flex w-full shrink-0 items-center gap-[12px]">
                    <PenFilterMenu label="السجل المرتبط" value="" onChange={() => {}} options={[{ value: '', label: 'الكل' }]} />
                    <PenFilterMenu label="الموظف" value={filters.actor ?? ''} onChange={(v) => go({ actor: v || undefined })} options={[{ value: '', label: 'الكل' }, ...actors]} />
                    <PenFilterMenu label="نوع النشاط" value={filters.type ?? ''} onChange={(v) => go({ type: v || undefined })} options={[{ value: '', label: 'الكل' }, ...types]} />
                    <PenFilterMenu label="الفترة الزمنية" value={filters.days ?? '90'} onChange={(v) => go({ days: v })} options={[{ value: '7', label: 'آخر 7 أيام' }, { value: '30', label: 'آخر 30 يومًا' }, { value: '90', label: 'آخر 90 يومًا' }, { value: '365', label: 'آخر سنة' }]} />
                </div>
                <div className="flex w-full shrink-0 flex-col gap-[16px] rounded-[10px] bg-[var(--surface-subtle)] p-[12px]">
                    <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">سجل للقراءة فقط.</div>
                </div>
                <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-[10px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <div className="flex h-[44px] w-full shrink-0 items-center gap-[10px] bg-[var(--surface-subtle)] p-[0px_14px]">
                        <div className={`${th} w-[190px]`}>الإجراءات</div>
                        <div className={`${th} flex-1`}>التفاصيل</div>
                        <div className={`${th} w-[110px]`}>السجل المرتبط</div>
                        <div className={`${th} w-[156px]`}>النشاط</div>
                        <div className={`${th} w-[108px]`}>التاريخ والوقت / المنفذ</div>
                    </div>
                    {activity.data.length === 0 && <div className="p-8 text-center text-[13px] text-[var(--muted-foreground)]">لا توجد أنشطة في الفترة المحددة.</div>}
                    {activity.data.map((a) => (
                        <div key={a.id} className="flex h-[75.5px] w-full shrink-0 items-center gap-[10px] p-[0px_14px] [border-bottom:1px_solid_var(--border)] last:border-b-0">
                            <div className="flex w-[190px] shrink-0 items-center gap-[6px]">
                                <PenRowAction href={`/customers/${customer.id}`}>فتح السجل</PenRowAction>
                                <PenRowAction>عرض التفاصيل</PenRowAction>
                            </div>
                            <div className="flex-1 text-right text-[12px] leading-[19px] font-[400] text-[var(--ink)]">{a.summary}</div>
                            <div className="w-[110px] shrink-0 text-right text-[11px] leading-[18px] font-[400] text-[var(--primary)]">{a.ref}</div>
                            <div className="w-[156px] shrink-0 text-right text-[12px] leading-[19px] font-[600] text-[var(--ink)]">{a.action}</div>
                            <div className="w-[108px] shrink-0 text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">
                                {formatDate(a.at, { year: false })}، {formatTime(a.at)}
                                <br />
                                {a.actor}
                            </div>
                        </div>
                    ))}
                </div>
                <PenPagination page={activity.current_page} pages={activity.last_page} summary={`${activity.from ?? 0}–${activity.to ?? 0} من ${activity.total} نشاطًا`} onPage={(p) => router.get(`/customers/${customer.id}/activity`, { ...filters, page: p }, { preserveState: true })} />
            </CustomerShell>
        </AppLayout>
    );
}
