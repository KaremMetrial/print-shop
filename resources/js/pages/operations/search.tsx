import { ListHead, SearchBox } from '@/components/pen/lists';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';

type R = { id: number; title: string; sub: string; status: string; href: string };
interface Props {
    q: string;
    results: { orders: R[]; customers: R[]; items: R[]; products: R[] };
}
const GROUPS: [keyof Props['results'], string][] = [
    ['orders', 'الأوردرات'],
    ['customers', 'العملاء'],
    ['items', 'بنود الأوردرات'],
    ['products', 'المنتجات'],
];

/** S-062 — البحث العام. المجموعات تُعرض بحسب صلاحية المستخدم (يحددها الخادم). */
export default function Search({ q, results }: Props) {
    const total = GROUPS.reduce((n, [k]) => n + results[k].length, 0);
    return (
        <AppLayout active="/search">
            <Head title="البحث" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <ListHead crumbs={[{ label: 'الرئيسية', href: '/dashboard' }, 'البحث']} title="البحث" subtitle="ابحث في الأوردرات والعملاء والبنود والمنتجات." />
                <div className="flex w-full">
                    <SearchBox value={q} onSubmit={(v) => router.get('/search', { q: v })} placeholder="ابحث برقم الأوردر أو اسم العميل أو المنتج…" />
                </div>
                {q.length < 2 && <div className="w-full rounded-[12px] bg-[var(--surface)] p-[40px] text-center text-[14px] text-[var(--muted-foreground)] [outline:1px_solid_var(--border)]">اكتب حرفين على الأقل لبدء البحث.</div>}
                {q.length >= 2 && total === 0 && <div className="w-full rounded-[12px] bg-[var(--surface)] p-[40px] text-center text-[14px] text-[var(--muted-foreground)] [outline:1px_solid_var(--border)]">لا توجد نتائج مطابقة لـ «{q}».</div>}
                {GROUPS.map(([k, l]) =>
                    results[k].length ? (
                        <div key={k} className="flex w-full shrink-0 flex-col gap-[8px]">
                            <div className="w-full text-right text-[16px] leading-[26px] font-[700] text-[var(--ink)]">
                                {l} ({results[k].length})
                            </div>
                            <div className="flex w-full flex-col rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                                {results[k].map((r) => (
                                    <Link key={`${k}${r.id}`} href={r.href} className="flex min-h-[56px] items-center justify-between gap-[12px] p-[8px_16px] [border-bottom:1px_solid_var(--border)] last:border-b-0 hover:bg-[var(--surface-subtle)]">
                                        <div className="text-[12px] text-[var(--muted-foreground)]">{r.status}</div>
                                        <div className="text-[12px] text-[var(--muted-foreground)]">{r.sub}</div>
                                        <div className="flex-1 text-right text-[14px] font-[600] text-[var(--ink)]">{r.title}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ) : null,
                )}
            </div>
        </AppLayout>
    );
}
