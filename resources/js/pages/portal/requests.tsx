import { DataGrid, RowBtn, TabsBar } from '@/components/pen/lists';
import { PenPagination } from '@/components/pen/primitives';
import { CustomerLayout } from '@/components/shell/customer-layout';
import { CustomerMobileShell, iso, mArrowBack, mBtnPrimary, mCard, mMoney } from '@/components/shell/customer-mobile';
import { formatDate } from '@/lib/money';
import { Head, Link, router } from '@inertiajs/react';

interface Props {
    requests: { data: { id: number; number: string; at: string; items: number; status: string; order_id: number | null }[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    tab: string;
    counts: Record<string, number>;
    cards?: { id: number; number: string; status: string; status_key: string; items: number; total_minor: number | null; at: string; order_number: string | null }[];
}
const itemsText = (n: number) => (n === 1 ? 'منتج واحد' : n === 2 ? 'منتجان' : `${n} منتجات`);
const statusColor: Record<string, string> = { ACCEPTED: '#15803D', REJECTED: '#B91C1C' };
const note = (c: { status_key: string; order_number: string | null }) => (c.status_key === 'ACCEPTED' && c.order_number ? `مرتبط بـ ${iso(c.order_number)}` : c.status_key === 'REJECTED' ? 'تم رفض الطلب' : c.status_key === 'IN_REVIEW' ? 'قيد المراجعة' : 'طلب جديد');
const dateText = (at: string) => { const d = new Date(at); return `قُدّم في ${iso(d.getDate())} ${formatDate(d).split(' ')[1]} ${iso(d.getFullYear())}`; };
/** S-083-01..04 — طلباتي حسب الحالة. */
export default function PortalRequests({ requests, tab, counts, cards = [] }: Props) {
    const T: [string, string][] = [['PENDING', 'بانتظار المراجعة'], ['IN_REVIEW', 'قيد المراجعة'], ['ACCEPTED', 'المقبولة'], ['REJECTED', 'المرفوضة']];
    const pending = cards.filter((c) => c.status_key === 'PENDING').length;
    const mobile = (
        <CustomerMobileShell title="طلباتي" tab="requests" lead={mArrowBack} leadSide="right">
            <div className="w-full text-right text-[22px] leading-[normal] font-[700] text-[#0F172A]">طلبات الأوردر</div>
            <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#64748B]">{pending === 0 ? 'لا توجد طلبات بانتظار المراجعة' : pending === 1 ? 'طلب واحد بانتظار المراجعة' : `${pending} طلبات بانتظار المراجعة`}</div>
            {cards.length === 0 && <div className={`${mCard} text-right text-[14px] text-[#64748B]`}>لا توجد طلبات بعد.</div>}
            {cards.map((c) => (
                <div key={c.id} className={mCard}>
                    <div className="w-full text-right text-[18px] leading-[34px] font-[700] text-[#0F172A]">{iso(c.number)}</div>
                    <div className="w-full text-right text-[14px] leading-[normal] font-[700] text-[#2563EB]" style={{ color: statusColor[c.status_key] }}>{c.status}</div>
                    <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#475569]">{itemsText(c.items)} · {note(c)}</div>
                    {c.total_minor !== null && <div className="w-full text-right text-[17px] leading-[normal] font-[700] text-[#0F172A]">{mMoney(c.total_minor)}</div>}
                    <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#64748B]">{dateText(c.at)}</div>
                    <Link href={`/portal/requests/${c.id}`} className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-white text-[15px] leading-[normal] font-[700] text-[#2563EB]">
                        عرض الطلب
                    </Link>
                </div>
            ))}
            <Link href="/portal/requests/new" className={mBtnPrimary}>
                طلب أوردر جديد
            </Link>
        </CustomerMobileShell>
    );
    return (
        <CustomerLayout mobile={mobile}>
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
            <PenPagination page={requests.current_page} pages={requests.last_page} summary={`عرض ${requests.from ?? 0}–${requests.to ?? 0} من ${requests.total}`} onPage={(p) => router.get('/portal/requests', { tab, page: p }, { preserveState: true, preserveScroll: true })} />
        </CustomerLayout>
    );
}
