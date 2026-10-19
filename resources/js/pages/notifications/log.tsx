import { PenBreadcrumb, PenPagination } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Head, Link, router } from '@inertiajs/react';

interface Props {
    actions: { data: { id: number; title: string; order_ref: string | null; customer: string | null; completed_by: string; completed_at: string; note: string | null }[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
}
const th = 'flex h-[44px] shrink-0 items-center text-right text-[12px] font-[600] text-[#475569]';

/** S-006 — سجل الإجراءات (المنتهية). للقراءة فقط. */
export default function ActionsLog({ actions: p }: Props) {
    return (
        <AppLayout active="/actions">
            <Head title="سجل الإجراءات" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'الإجراءات المطلوبة', href: '/actions' }, 'سجل الإجراءات']} />
                <div className="flex w-full shrink-0 items-center justify-between">
                    <Link href="/actions" className="flex h-[46px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_14px] text-[12px] font-[500] [outline:1px_solid_var(--border)]">
                        الإجراءات المطلوبة
                    </Link>
                    <h1 className="flex-1 text-right text-[32px] leading-[44px] font-[700] text-[var(--ink)]">سجل الإجراءات</h1>
                </div>
                <div className="flex w-full shrink-0 flex-col rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <div className="flex h-[44px] w-full shrink-0 items-center gap-[8px] bg-[var(--background)] p-[0px_16px]">
                        <div className={`${th} w-[160px]`}>وقت الإنهاء</div>
                        <div className={`${th} w-[130px]`}>أنهاه</div>
                        <div className={`${th} w-[90px]`}>الطلب</div>
                        <div className={`${th} w-[140px]`}>العميل</div>
                        <div className={`${th} flex-1`}>الإجراء</div>
                    </div>
                    {p.data.length === 0 && <div className="w-full p-[40px] text-center text-[14px] text-[var(--muted-foreground)]">لا توجد إجراءات منتهية بعد.</div>}
                    {p.data.map((a) => (
                        <div key={a.id} className="flex min-h-[56px] w-full shrink-0 items-center gap-[8px] p-[8px_16px] text-right text-[12px] [border-top:1px_solid_var(--border)]">
                            <div className="w-[160px] text-[var(--muted-foreground)]">{`${formatDate(a.completed_at, { year: false })}، ${formatTime(a.completed_at)}`}</div>
                            <div className="w-[130px]">{a.completed_by}</div>
                            <div className="w-[90px]">{a.order_ref ?? '—'}</div>
                            <div className="w-[140px]">{a.customer ?? '—'}</div>
                            <div className="flex-1 font-[500]">
                                {a.title}
                                {a.note && <span className="text-[var(--muted-foreground)]"> — {a.note}</span>}
                            </div>
                        </div>
                    ))}
                </div>
                <PenPagination page={p.current_page} pages={p.last_page} summary={`عرض ${p.from ?? 0}–${p.to ?? 0} من ${p.total}`} onPage={(n) => router.get('/actions/log', { page: n }, { preserveState: true })} />
            </div>
        </AppLayout>
    );
}
