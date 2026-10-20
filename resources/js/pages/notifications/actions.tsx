import { PageTabs } from '@/components/pen/page-tabs';
import { PenBreadcrumb, PenPagination } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface A {
    id: number;
    type: string;
    title: string;
    customer: string | null;
    order_ref: string | null;
    link: string | null;
    status: 'OPEN' | 'CLAIMED';
    claimed_by: string | null;
    mine: boolean;
    created_at: string;
}
interface Props {
    actions: { data: A[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    filters: Record<string, string>;
    counts: { total: number; open: number; claimed: number };
}
const TYPES: [string, string][] = [
    ['', 'جميع الإجراءات'],
    ['ORDER_REQUEST', 'طلبات الأوردرات'],
    ['PASSWORD_RECOVERY', 'استرجاع كلمات المرور'],
    ['CUSTOMER_NOTICE', 'إشعارات العملاء'],
    ['ASSIGN_DESIGNER', 'إسناد تصميم'],
    ['OTHER', 'إجراءات أخرى'],
];
const TYPE_LABEL: Record<string, string> = { ORDER_REQUEST: 'طلب أوردر', PASSWORD_RECOVERY: 'استرجاع مرور', CUSTOMER_NOTICE: 'إشعار عميل', ASSIGN_DESIGNER: 'إسناد تصميم', OTHER: 'إجراء آخر' };
const th = 'flex h-[44px] shrink-0 items-center text-right text-[12px] leading-[normal] font-[600] text-[#475569]';
const td = 'flex shrink-0 items-center text-right text-[12px] leading-[19px] text-[var(--ink)]';
const btn = 'flex h-[36px] w-fit shrink-0 items-center rounded-[8px] bg-[var(--surface)] p-[0px_12px] text-left text-[12px] leading-[normal] font-[500] whitespace-nowrap text-[var(--ink)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';

/** S-005 — الإجراءات المطلوبة. الأقدم أولًا (BR-067). الإجراء لا يُغلق إلا بتنفيذه لا بقراءة إشعاره (BR-066). */
export default function Actions({ actions: p, filters, counts }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const go = (n: Record<string, string | undefined>) => router.get('/actions', { ...filters, ...n }, { preserveState: true });
    const post = (url: string) => router.post(url, {}, { preserveScroll: true, headers: { 'Idempotency-Key': crypto.randomUUID() } });
    return (
        <AppLayout active="/actions">
            <Head title="الإجراءات المطلوبة" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, 'الإجراءات المطلوبة']} />
                <div className="flex w-full shrink-0 items-center justify-between">
                    <Link href="/actions/log" className={`${btn} h-[46px]`}>
                        سجل الإجراءات
                    </Link>
                    <div className="flex flex-1 flex-col gap-[4px]">
                        <h1 className="w-full text-right text-[32px] leading-[44px] font-[700] text-[var(--ink)]">الإجراءات المطلوبة</h1>
                        <div className="w-full text-right text-[14px] leading-[22px] text-[var(--muted-foreground)]">ابدأ بالأقدم، ونفّذ العملية المطلوبة لإغلاق الإجراء.</div>
                    </div>
                </div>
                <div className="flex w-full shrink-0 gap-[16px]">
                    {[['إجمالي الإجراءات', counts.total], ['مفتوحة', counts.open], ['تحت المتابعة', counts.claimed]].map(([k, v]) => (
                        <div key={k} className="flex h-[82px] flex-1 items-center justify-between rounded-[12px] bg-[var(--surface)] p-[0px_24px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                            <div className="text-left text-[32px] leading-[normal] font-[700] text-[var(--ink)]">{v}</div>
                            <div className="text-right text-[14px] text-[var(--muted-foreground)]">{k}</div>
                        </div>
                    ))}
                </div>
                <PageTabs label="نوع الإجراء" value={filters.type ?? ''} onChange={(k) => go({ type: k || undefined })} tabs={[...TYPES].reverse().map(([key, label]) => ({ key, label }))} />
                <div className="flex w-full shrink-0 items-center gap-[12px]">
                    <button type="button" onClick={() => router.get('/actions')} className={`${btn} h-[46px]`}>
                        مسح
                    </button>
                    <select value={filters.status ?? ''} onChange={(e) => go({ status: e.target.value || undefined })} aria-label="الحالة" className="h-[46px] rounded-[10px] bg-[var(--background)] p-[0px_14px] text-[14px] [outline:1px_solid_var(--control-border)]">
                        <option value="">الحالة: مفتوح ومسند</option>
                        <option value="OPEN">مفتوح</option>
                        <option value="CLAIMED">مسند</option>
                    </select>
                    <form
                        className="flex h-[46px] flex-1 items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px]"
                        onSubmit={(e) => {
                            e.preventDefault();
                            go({ q: q || undefined });
                        }}
                    >
                        <Icon name="search" className="h-[16px] w-[16px]" color="var(--muted-foreground)" />
                        <input dir="rtl" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بعنوان الإجراء أو رقم الطلب…" aria-label="بحث" className="min-w-0 flex-1 bg-transparent text-right text-[14px] outline-hidden placeholder:text-[var(--muted-foreground)]" />
                    </form>
                </div>
                <div className="w-full text-right text-[12px] text-[var(--muted-foreground)]">الأولوية للأعمال المتأخرة وغير المسندة • الأقدم أولًا</div>
                <div className="flex w-full shrink-0 flex-col rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <div className="flex h-[44px] w-full shrink-0 items-center gap-[8px] bg-[var(--background)] p-[0px_16px]">
                        <div className={`${th} w-[170px]`}>الإجراء</div>
                        <div className={`${th} w-[90px]`}>الحالة</div>
                        <div className={`${th} w-[110px]`}>الموظف</div>
                        <div className={`${th} w-[120px]`}>وقت الإنشاء</div>
                        <div className={`${th} w-[90px]`}>الطلب</div>
                        <div className={`${th} w-[130px]`}>العميل</div>
                        <div className={`${th} flex-1`}>العنوان</div>
                        <div className={`${th} w-[100px]`}>نوع الإجراء</div>
                    </div>
                    {p.data.length === 0 && <div className="w-full p-[40px] text-center text-[14px] text-[var(--muted-foreground)]">لا توجد إجراءات مطلوبة. غيّر التصفية لعرض إجراءات أخرى.</div>}
                    {p.data.map((a) => (
                        <div key={a.id} className="flex min-h-[72px] w-full shrink-0 items-center gap-[8px] p-[10px_16px] [border-top:1px_solid_var(--border)]">
                            <div className={`${td} w-[170px] gap-[6px]`}>
                                {a.status === 'OPEN' && (
                                    <button type="button" onClick={() => post(`/actions/${a.id}/claim`)} className={btn}>
                                        أخذ الإجراء
                                    </button>
                                )}
                                {a.link && (
                                    <Link href={a.link} className={btn}>
                                        فتح
                                    </Link>
                                )}
                                {(a.status === 'OPEN' || a.mine) && (
                                    <button type="button" onClick={() => post(`/actions/${a.id}/complete`)} className={btn}>
                                        إتمام
                                    </button>
                                )}
                            </div>
                            <div className={`${td} w-[90px]`}>
                                <div className="rounded-[10px] p-[3px_8px] text-[11px] font-[700]" style={{ background: a.status === 'OPEN' ? '#FFF3D9' : '#E8F1FF', color: a.status === 'OPEN' ? '#895A0D' : '#1D5FB8' }}>
                                    {a.status === 'OPEN' ? 'مفتوح' : 'مسند'}
                                </div>
                            </div>
                            <div className={`${td} w-[110px] ${a.claimed_by ? '' : 'text-[#B45309]'}`}>{a.claimed_by ?? 'غير مسند'}</div>
                            <div className={`${td} w-[120px] text-[var(--muted-foreground)]`}>{`${formatDate(a.created_at, { year: false })}، ${formatTime(a.created_at)}`}</div>
                            <div className={`${td} w-[90px]`}>{a.order_ref ?? '—'}</div>
                            <div className={`${td} w-[130px]`}>{a.customer ?? '—'}</div>
                            <div className={`${td} flex-1 font-[500]`}>{a.title}</div>
                            <div className={`${td} w-[100px]`}>{TYPE_LABEL[a.type] ?? a.type}</div>
                        </div>
                    ))}
                </div>
                <PenPagination page={p.current_page} pages={p.last_page} summary={`عرض ${p.from ?? 0}–${p.to ?? 0} من ${p.total} إجراء`} onPage={(n) => go({ page: String(n) })} />
            </div>
        </AppLayout>
    );
}
