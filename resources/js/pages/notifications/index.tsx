import { PageTabs } from '@/components/pen/page-tabs';
import { PenBreadcrumb, PenPagination } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { Head, Link, router } from '@inertiajs/react';

interface N {
    id: number;
    type: string;
    title: string;
    body: string | null;
    link: string | null;
    action_id: number | null;
    read: boolean;
    created_at: string;
    action_open: boolean;
}
interface Props {
    notifications: { data: N[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    tab: 'all' | 'unread';
    counts: { all: number; unread: number };
}
const ICON: Record<string, string> = { ACTION_REQUIRED: 'inbox', PRINTING_STARTED: 'printer', PAYMENT: 'wallet', DELIVERY: 'truck' };
const btn = 'flex h-[36px] w-fit shrink-0 items-center rounded-[8px] bg-[var(--surface)] p-[0px_12px] text-left text-[12px] leading-[normal] font-[500] whitespace-nowrap text-[var(--ink)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const when = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    return `${d.toDateString() === today.toDateString() ? 'اليوم' : formatDate(d, { year: false })}، ${formatTime(d)}`;
};

/** S-004 — الإشعارات. قراءة الإشعار لا تُغلق الإجراء المرتبط (BR-066). */
export default function Notifications({ notifications: p, tab, counts }: Props) {
    const go = (t: string) => router.get('/notifications', { tab: t }, { preserveState: true });
    const post = (url: string) => router.post(url, {}, { preserveScroll: true });
    return (
        <AppLayout>
            <Head title="الإشعارات" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, 'الإشعارات']} />
                <div className="flex w-full shrink-0 items-center justify-between">
                    <button type="button" onClick={() => post('/notifications/read-all')} disabled={counts.unread === 0} className={`${btn} h-[46px] disabled:opacity-50`}>
                        تعليم الإشعارات العادية كمقروءة
                    </button>
                    <div className="flex flex-1 flex-col gap-[4px]">
                        <h1 className="w-full text-right text-[32px] leading-[44px] font-[700] text-[var(--ink)]">الإشعارات</h1>
                        <div className="w-full text-right text-[14px] leading-[22px] text-[var(--muted-foreground)]">آخر تحديثات الطلبات والتصميم والتسليم في مكان واحد.</div>
                    </div>
                </div>
                <PageTabs label="الإشعارات" value={tab} onChange={go} tabs={[{ key: 'all', label: `الكل (${counts.all})` }, { key: 'unread', label: `غير المقروءة (${counts.unread})` }]} />
                <div className="flex w-full shrink-0 flex-col rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    {p.data.length === 0 && <div className="w-full p-[40px] text-center text-[14px] text-[var(--muted-foreground)]">{tab === 'unread' ? 'لا توجد إشعارات غير مقروءة. أنت مطّلع على آخر التحديثات.' : 'لا توجد إشعارات بعد.'}</div>}
                    {p.data.map((n) => (
                        <div key={n.id} className="flex w-full shrink-0 items-start gap-[16px] p-[16px_24px] [border-bottom:1px_solid_var(--border)] last:border-b-0">
                            <div className="flex w-fit shrink-0 items-center gap-[8px] pt-[6px]">
                                {!n.read && (
                                    <button type="button" onClick={() => post(`/notifications/${n.id}/read`)} className={btn}>
                                        تعليم كمقروء
                                    </button>
                                )}
                                {n.link && (
                                    <Link href={n.link} className={btn}>
                                        {n.action_open ? 'فتح الإجراء' : 'فتح السجل'}
                                    </Link>
                                )}
                            </div>
                            <div className="w-[130px] shrink-0 pt-[6px] text-right text-[12px] leading-[normal]" style={{ color: n.read ? 'var(--muted-foreground)' : '#2563EB' }}>
                                {n.read ? 'مقروء' : 'غير مقروء'}
                                <div className="mt-[10px] text-[12px] text-[var(--muted-foreground)]">{when(n.created_at)}</div>
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col items-end gap-[4px]">
                                <div className="w-full text-right text-[16px] leading-[26px] font-[700] text-[var(--ink)]">{n.title}</div>
                                {n.body && <div className="w-full text-right text-[13px] leading-[21px] text-[var(--muted-foreground)]">{n.body}</div>}
                                {n.action_open && <div className="w-full text-right text-[12px] leading-[19px] text-[#B45309]">إجراء مطلوب • يبقى مفتوحًا حتى تنفيذه</div>}
                            </div>
                            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-[#DBEAFE]">
                                <Icon name={ICON[n.type] ?? 'bell'} className="h-[20px] w-[20px]" color="var(--primary)" />
                            </div>
                        </div>
                    ))}
                </div>
                <PenPagination page={p.current_page} pages={p.last_page} summary={`عرض ${p.from ?? 0} من ${p.total} إشعارًا • ${counts.unread} غير مقروء`} onPage={(n) => router.get('/notifications', { tab, page: n }, { preserveState: true })} />
            </div>
        </AppLayout>
    );
}
