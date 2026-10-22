import { DataGrid, RowBtn, TabsBar } from '@/components/pen/lists';
import { PenPagination } from '@/components/pen/primitives';
import { CustomerLayout } from '@/components/shell/customer-layout';
import { CustomerMobileShell, iso, mArrowBack, mCard, mMoney } from '@/components/shell/customer-mobile';
import { formatDate, formatMoneyFixed } from '@/lib/money';
import { Head, Link, router } from '@inertiajs/react';

interface Props {
    orders: { data: { id: number; number: string; status: string; at: string; total_minor: number }[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    tab: string;
    cards?: { id: number; number: string; status: string; status_key: string; products: string[]; total_minor: number }[];
    summary?: { active: number; done: number; cancelled: number };
}
/** S-084 — أوردراتي (نشطة/مكتملة/ملغاة). */
export default function PortalOrders({ orders, tab, cards = [], summary = { active: 0, done: 0, cancelled: 0 } }: Props) {
    const mobile = (
        <CustomerMobileShell title="أوردراتي" tab="orders" lead={mArrowBack} leadSide="right">
            <div className="w-full text-right text-[22px] leading-[normal] font-[700] text-[#0F172A]">أوردراتي</div>
            <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#64748B]">{`نشط ${iso(summary.active)} · مكتمل ${iso(summary.done)} · ملغي ${iso(summary.cancelled)}`}</div>
            {cards.length === 0 && <div className={`${mCard} text-right text-[14px] text-[#64748B]`}>لا توجد أوردرات بعد.</div>}
            {cards.map((o) => (
                <div key={o.id} className={mCard}>
                    <div className="w-full text-right text-[19px] leading-[normal] font-[700] text-[#0F172A]">{iso(o.number)}</div>
                    <div className="w-full text-right text-[14px] leading-[normal] font-[700] text-[#2563EB]">{o.status}</div>
                    <div className="w-full text-right text-[15px] leading-[normal] font-[400] text-[#334155]">{o.products.join(' · ')}</div>
                    <div className="w-full text-right text-[17px] leading-[normal] font-[700] text-[#0F172A]">{`الإجمالي ${mMoney(o.total_minor)}`}</div>
                    <Link href={`/portal/orders/${o.id}`} className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-[#2563EB] text-[15px] leading-[normal] font-[700] text-white">
                        عرض الأوردر
                    </Link>
                </div>
            ))}
            <Link href="/portal/requests/new" className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-white text-[15px] leading-[normal] font-[700] text-[#2563EB] [outline:1px_solid_#CBD5E1] [outline-offset:-0.5px]">
                طلب أوردر جديد
            </Link>
        </CustomerMobileShell>
    );
    return (
        <CustomerLayout mobile={mobile}>
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
