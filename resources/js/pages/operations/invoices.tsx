import { DataGrid, ListHead, Pill, RowBtn, SearchBox, TabsBar } from '@/components/pen/lists';
import { PenPagination } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoneyFixed } from '@/lib/money';
import { Head, router } from '@inertiajs/react';

interface Inv {
    id: number;
    number: string;
    order: string;
    order_id: number;
    customer: string;
    status: 'ISSUED' | 'VOIDED';
    total_minor: number;
    at: string;
}
interface Props {
    invoices: { data: Inv[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    filters: Record<string, string>;
}

/** S-056 — الفواتير. تُصدر من صفحة الأوردر بعد الطباعة. */
export default function Invoices({ invoices, filters }: Props) {
    const go = (n: Record<string, string | undefined>) => router.get('/invoices', { ...filters, page: undefined, ...n }, { preserveState: true });
    return (
        <AppLayout active="/invoices">
            <Head title="الفواتير" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <ListHead crumbs={[{ label: 'الرئيسية', href: '/dashboard' }, 'الفواتير']} title="الفواتير" subtitle="فواتير داخلية صادرة للأوردرات. تُصدر من صفحة الأوردر بعد دخوله الطباعة." />
                <TabsBar value={filters.status ?? ''} onChange={(s) => go({ status: s || undefined })} tabs={[['', 'الكل'], ['ISSUED', 'سارية'], ['VOIDED', 'ملغاة']]} />
                <SearchBox value={filters.q ?? ''} onSubmit={(q) => go({ q: q || undefined })} placeholder="ابحث برقم الفاتورة أو الأوردر أو اسم العميل" />
                <DataGrid
                    empty="لا توجد فواتير مطابقة."
                    rows={invoices.data}
                    cols={[
                        { h: 'الإجراء', w: 120, cell: (i) => <RowBtn href={`/invoices/${i.id}`}>معاينة</RowBtn> },
                        { h: 'الحالة', w: 90, cell: (i) => (i.status === 'ISSUED' ? <Pill bg="#E6F5EA" fg="#237A4B">سارية</Pill> : <Pill bg="#FEF0F0" fg="#B42318">ملغاة</Pill>) },
                        { h: 'الإجمالي', w: 120, cell: (i) => <b>{formatMoneyFixed(i.total_minor)}</b> },
                        { h: 'التاريخ', w: 130, cell: (i) => formatDate(i.at) },
                        { h: 'الأوردر', w: 110, cell: (i) => i.order },
                        { h: 'العميل', cell: (i) => i.customer },
                        { h: 'رقم الفاتورة', w: 110, cell: (i) => <b>{i.number}</b> },
                    ]}
                />
                <PenPagination page={invoices.current_page} pages={invoices.last_page} summary={`عرض ${invoices.from ?? 0}–${invoices.to ?? 0} من ${invoices.total}`} onPage={(p) => go({ page: String(p) })} />
            </div>
        </AppLayout>
    );
}
