import { DataGrid, RowBtn, TabsBar } from '@/components/pen/lists';
import { PenPagination } from '@/components/pen/primitives';
import { CustomerLayout } from '@/components/shell/customer-layout';
import { formatDate } from '@/lib/money';
import { Head, Link, router } from '@inertiajs/react';

interface Props {
    requests: { data: { id: number; number: string; at: string; items: number; status: string; order_id: number | null }[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    tab: string;
    counts: Record<string, number>;
}
/** S-083-01..04 — طلباتي حسب الحالة. */
export default function PortalRequests({ requests, tab, counts }: Props) {
    const T: [string, string][] = [['PENDING', 'بانتظار المراجعة'], ['IN_REVIEW', 'قيد المراجعة'], ['ACCEPTED', 'المقبولة'], ['REJECTED', 'المرفوضة']];
    return (
        <CustomerLayout>
            <Head title="طلباتي" />
            <div className="flex w-full items-center justify-between">
                <Link href="/portal/requests/new" className="flex h-[44px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_18px] text-[14px] font-[600] text-white">
                    طلب أوردر جديد
                </Link>
                <h1 className="text-right text-[28px] leading-[40px] font-[700] text-[var(--ink)]">طلباتي</h1>
            </div>
            <TabsBar value={tab} onChange={(t) => router.get('/portal/requests', { tab: t })} tabs={T.map(([k, l]) => [k, `${l} (${counts[k] ?? 0})`])} />
            <DataGrid
                empty="لا توجد طلبات في هذا القسم."
                rows={requests.data}
                cols={[
                    { h: 'الإجراءات', w: 130, cell: (r) => <RowBtn href={`/portal/requests/${r.id}`}>عرض الطلب</RowBtn> },
                    { h: 'الحالة', w: 130, cell: (r) => r.status },
                    { h: 'البنود', w: 80, cell: (r) => r.items },
                    { h: 'تاريخ الإرسال', cell: (r) => formatDate(r.at) },
                    { h: 'رقم الطلب', w: 120, cell: (r) => <b>{r.number}</b> },
                ]}
            />
            <PenPagination page={requests.current_page} pages={requests.last_page} summary={`عرض ${requests.from ?? 0}–${requests.to ?? 0} من ${requests.total}`} onPage={(p) => router.get('/portal/requests', { tab, page: p }, { preserveState: true })} />
        </CustomerLayout>
    );
}
