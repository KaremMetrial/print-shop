import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataGrid, ListHead, Pill, RowBtn, SearchBox, TabsBar } from '@/components/pen/lists';
import { PenFilterMenu, PenPagination } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

type Tab = 'printing' | 'pickup' | 'delivery' | 'out' | 'done';
interface Props {
    orders: {
        data: {
            id: number;
            number: string;
            customer: string;
            phone: string;
            method: string;
            address: string | null;
            updated_at: string;
            status: string;
        }[];
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
    };
    tab: Tab;
    counts: Record<Tab, number>;
    filters: Record<string, string>;
    can: { printing: boolean; delivery: boolean; complete: boolean };
}
const TABS: [Tab, string][] = [
    ['printing', 'قيد الطباعة'],
    ['pickup', 'جاهز للاستلام'],
    ['delivery', 'جاهز للتوصيل'],
    ['out', 'خرج للتوصيل'],
    ['done', 'مكتمل'],
];
const TITLE: Record<Tab, string> = {
    printing: 'الأوردرات قيد الطباعة',
    pickup: 'الأوردرات الجاهزة للاستلام',
    delivery: 'الأوردرات الجاهزة للتوصيل',
    out: 'الأوردرات التي خرجت للتوصيل',
    done: 'الأوردرات المكتملة',
};
const EMPTY: Record<Tab, string> = {
    printing: 'لا توجد أوردرات قيد الطباعة.',
    pickup: 'لا توجد أوردرات جاهزة للاستلام. ستظهر هنا بعد انتهاء طباعتها وتجهيزها للاستلام.',
    delivery: 'لا توجد أوردرات جاهزة للتوصيل.',
    out: 'لا توجد أوردرات خارجة للتوصيل.',
    done: 'لا توجد أوردرات مكتملة.',
};

/** S-059 — الطباعة والتسليم. الانتقال يتم عبر زر واحد للأوردر كله (BR-031/032) وبتأكيد. */
export default function Delivery({ orders, tab, counts, filters, can }: Props) {
    const go = (n: Record<string, string | undefined>) => router.get('/delivery', { tab, ...filters, ...n }, { preserveState: true, preserveScroll: true });
    const [pending, setPending] = useState<{ id: number; s: string; msg: string } | null>(null);
    const step = (id: number, s: string, msg: string) => setPending({ id, s, msg });
    return (
        <AppLayout active="/delivery">
            <Head title="الطباعة والتسليم" />
            <ConfirmDialog
                open={pending !== null}
                onOpenChange={(o) => !o && setPending(null)}
                title="تأكيد الإجراء"
                description={pending?.msg ?? ''}
                confirmLabel="تأكيد"
                onConfirm={() => {
                    if (pending)
                        router.post(
                            `/orders/${pending.id}/${pending.s}`,
                            {},
                            { preserveScroll: true, headers: { 'Idempotency-Key': crypto.randomUUID() } },
                        );
                    setPending(null);
                }}
            />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <ListHead
                    crumbs={[{ label: 'الرئيسية', href: '/dashboard' }, 'الطباعة والتسليم']}
                    title="الطباعة والتسليم"
                    subtitle="متابعة تنفيذ الأوردرات وتجهيزها للتسليم."
                />
                <TabsBar tabs={TABS.map(([k, l]) => [k, `${l} (${counts[k]})`])} value={tab} onChange={(t) => go({ tab: t, page: undefined })} />
                <div className="flex w-full shrink-0 items-center gap-[12px]">
                    <PenFilterMenu
                        label="طريقة التسليم"
                        value={filters.method ?? ''}
                        options={[{ value: '', label: 'طريقة التسليم: الكل' }, { value: 'PICKUP', label: 'استلام' }, { value: 'DELIVERY', label: 'توصيل' }]}
                        onChange={(v) => go({ method: v || undefined })}
                    />
                    <SearchBox value={filters.q ?? ''} onSubmit={(q) => go({ q: q || undefined })} placeholder="ابحث برقم الأوردر أو اسم العميل" />
                </div>
                <div className="w-full text-right text-[18px] leading-[28px] font-[700] text-[var(--ink)]">{TITLE[tab]}</div>
                <DataGrid
                    empty={EMPTY[tab]}
                    rows={orders.data}
                    cols={[
                        {
                            h: 'الإجراءات',
                            w: 220,
                            cell: (o) => (
                                <div className="flex gap-[6px]">
                                    <RowBtn href={`/orders/${o.id}`}>عرض الأوردر</RowBtn>
                                    {tab === 'printing' && can.printing && (
                                        <RowBtn primary onClick={() => step(o.id, 'complete-printing', 'تأكيد إتمام طباعة الأوردر بالكامل؟')}>
                                            إتمام الطباعة
                                        </RowBtn>
                                    )}
                                    {tab === 'delivery' && can.delivery && (
                                        <RowBtn primary onClick={() => step(o.id, 'out-for-delivery', 'تأكيد خروج الأوردر للتوصيل؟')}>
                                            خرج للتوصيل
                                        </RowBtn>
                                    )}
                                    {(tab === 'pickup' || tab === 'out') && can.complete && (
                                        <RowBtn primary onClick={() => step(o.id, 'complete', 'تأكيد إتمام الأوردر؟ سيُغلق رابط العميل.')}>
                                            إتمام الأوردر
                                        </RowBtn>
                                    )}
                                </div>
                            ),
                        },
                        { h: 'آخر تحديث', w: 160, cell: (o) => `${formatDate(o.updated_at, { year: false })}، ${formatTime(o.updated_at)}` },
                        {
                            h: 'التسليم',
                            w: 90,
                            cell: (o) => (
                                <Pill bg="#EFF6FF" fg="#2563EB">
                                    {o.method === 'DELIVERY' ? 'توصيل' : 'استلام'}
                                </Pill>
                            ),
                        },
                        { h: 'العنوان', cell: (o) => o.address ?? '—' },
                        { h: 'العميل', w: 150, cell: (o) => o.customer },
                        { h: 'رقم الأوردر', w: 110, cell: (o) => <span className="font-[700] text-[var(--primary)]">{o.number}</span> },
                    ]}
                />
                <PenPagination
                    page={orders.current_page}
                    pages={orders.last_page}
                    summary={`عرض ${orders.from ?? 0}–${orders.to ?? 0} من ${orders.total}`}
                    onPage={(p) => go({ page: String(p) })}
                />
            </div>
        </AppLayout>
    );
}
