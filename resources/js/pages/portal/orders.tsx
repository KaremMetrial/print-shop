import { DataGrid, RowBtn, TabsBar } from '@/components/pen/lists';
import { PenPagination } from '@/components/pen/primitives';
import { CustomerLayout } from '@/components/shell/customer-layout';
import { formatDate, formatMoneyFixed } from '@/lib/money';
import { Head, router } from '@inertiajs/react';

interface Props {
    orders: { data: { id: number; number: string; status: string; at: string; total_minor: number }[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    tab: string;
}
/** S-084 — أوردراتي (نشطة/مكتملة/ملغاة). */
export default function PortalOrders({ orders, tab }: Props) {
    return (
        <CustomerLayout>
            <Head title="أوردراتي" />
            <h1 className="w-full text-right text-[28px] leading-[40px] font-[700] text-[var(--ink)]">أوردراتي</h1>
            <TabsBar value={tab} onChange={(t) => router.get('/portal/orders', { tab: t })} tabs={[['active', 'النشطة'], ['done', 'المكتملة'], ['cancelled', 'الملغاة']]} />
            <DataGrid
                empty="لا توجد أوردرات في هذا القسم."
                rows={orders.data}
                cols={[
                    { h: 'الإجراءات', w: 130, cell: (o) => <RowBtn href={`/portal/orders/${o.id}`}>عرض التفاصيل</RowBtn> },
                    { h: 'الإجمالي', w: 130, cell: (o) => formatMoneyFixed(o.total_minor) },
                    { h: 'التاريخ', w: 140, cell: (o) => formatDate(o.at) },
                    { h: 'الحالة', cell: (o) => o.status },
                    { h: 'رقم الأوردر', w: 120, cell: (o) => <b>{o.number}</b> },
                ]}
            />
            <PenPagination page={orders.current_page} pages={orders.last_page} summary={`عرض ${orders.from ?? 0}–${orders.to ?? 0} من ${orders.total}`} onPage={(p) => router.get('/portal/orders', { tab, page: p }, { preserveState: true, preserveScroll: true })} />
        </CustomerLayout>
    );
}
