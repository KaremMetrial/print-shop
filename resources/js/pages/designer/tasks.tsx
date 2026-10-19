import { DesignerLayout } from '@/components/shell/designer-layout';
import { arDigits, formatDateTimeShort } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

type Tab = 'new' | 'in_progress' | 'revision' | 'awaiting' | 'done';
interface Task {
    id: number;
    code: string;
    order_number: string;
    product: string;
    customer: string;
    specs: string;
    updated_at: string;
    files_count: number;
    unread: number;
    state: string;
    line?: string;
}
interface Props {
    tab: Tab;
    counts: Record<Tab, number>;
    tasks: Task[];
    workload: number;
    designer: { name: string };
    filters: Record<string, string>;
}

const TABS: [Tab, string][] = [
    ['done', 'المكتملة'],
    ['awaiting', 'بانتظار الاعتماد'],
    ['revision', 'مطلوب تعديل'],
    ['in_progress', 'قيد التنفيذ'],
    ['new', 'مهام جديدة'],
];
const TITLE: Record<Tab, string> = { new: 'المهام الجديدة', in_progress: 'مهام قيد التنفيذ', revision: 'مهام مطلوب تعديلها', awaiting: 'مهام بانتظار الاعتماد', done: 'المهام المكتملة' };
const CRUMB: Record<Tab, string> = { new: 'المهام الجديدة', in_progress: 'مهام قيد التنفيذ', revision: 'مطلوب تعديل', awaiting: 'بانتظار الاعتماد', done: 'المكتملة' };
const ST: Record<string, [string, string, string]> = {
    NEW: ['مهمة جديدة', '#EFF6FF', '#2563EB'],
    IN_DESIGN: ['قيد التنفيذ', '#FFF7E9', '#9A5B09'],
    REVISION_REQUESTED: ['مطلوب تعديل', '#FEF1F1', '#B42318'],
    AWAITING_APPROVAL: ['بانتظار اعتماد العميل', '#FFF3D9', '#895A0D'],
    APPROVED: ['معتمدة', '#E6F5EA', '#237A4B'],
};
const filt = 'flex h-[46px] w-fit shrink-0 items-center justify-between gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] text-[14px] leading-[normal] font-[400] text-[var(--ink)]';
const plural = (n: number, one: string, two: string, many: string, none: string) => (n === 0 ? none : n === 1 ? one : n === 2 ? two : `${arDigits(n)} ${many}`);

function summary(tab: Tab, n: number, workload: number) {
    if (tab === 'new') return `${n === 2 ? 'مهمتان' : n === 1 ? 'مهمة واحدة' : `${arDigits(n)} مهام`} مسندتان إليك • عبء العمل النشط: ${arDigits(workload)}`.replace('مسندتان', n === 2 ? 'مسندتان' : 'مسندة');
    if (tab === 'in_progress') return `${n === 1 ? 'لديك مهمة واحدة قيد التنفيذ' : `لديك ${arDigits(n)} مهام قيد التنفيذ`} • عبء العمل النشط: ${arDigits(workload)}`;
    if (tab === 'revision') return n === 1 ? 'لديك مهمة واحدة تتطلب التعديل.' : `لديك ${arDigits(n)} مهام تتطلب التعديل.`;
    if (tab === 'awaiting') return n === 1 ? 'لديك مهمة واحدة بانتظار اعتماد العميل.' : `لديك ${arDigits(n)} مهام بانتظار اعتماد العميل.`;
    return `${arDigits(n)} مهام مكتملة.`;
}

/** S-043-01..04 — مهامي (pendev: FSGkX · PM7wz · UOvaG · zCk7b). */
export default function DesignerTasks({ tab, counts, tasks, workload, designer, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const go = (t: Tab) => router.get('/designer/tasks', { tab: t }, { preserveState: true });
    const [dateLabel, productLabel] = tab === 'new' ? ['تاريخ الإسناد', 'المنتج'] : tab === 'in_progress' ? ['تاريخ الإسناد', 'المنتج'] : ['تاريخ التحديث', 'المنتج'];
    return (
        <DesignerLayout name={designer.name}>
            <Head title="مهامي" />
            <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">مهامي / {CRUMB[tab]}</div>
            <div className="flex w-full shrink-0 flex-col items-end gap-[1px]">
                <h1 className="text-left text-[26px] leading-[normal] font-[700] text-[var(--ink)]">مهامي</h1>
                <div className="text-left text-[13px] leading-[normal] font-[400] text-[var(--muted-foreground)]">تابع مهام التصميم المسندة إليك.</div>
            </div>
            <div className="flex h-[47.5px] w-full shrink-0 items-center justify-end gap-[8px] [border-bottom:1px_solid_var(--border)]">
                {TABS.map(([k, l]) => {
                    const on = k === tab;
                    return (
                        <button key={k} type="button" onClick={() => go(k)} className="flex h-[38px] w-fit shrink-0 items-center gap-[6px] rounded-[7px] p-[0px_13px]" style={{ background: on ? '#EFF6FF' : '#FFFFFF' }}>
                            <div className="text-left text-[12px] leading-[normal] whitespace-nowrap" style={{ color: on ? '#2563EB' : '#64748B', fontWeight: on ? 700 : 400 }}>{l}</div>
                            <div className="text-left text-[11px] leading-[normal] font-[700]" style={{ color: on ? '#2563EB' : '#64748B' }}>{arDigits(counts[k])}</div>
                        </button>
                    );
                })}
            </div>
            <div className="flex w-full shrink-0 items-center justify-between">
                <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">{summary(tab, counts[tab], workload)}</div>
                <div className="text-left text-[18px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">{TITLE[tab]}</div>
            </div>
            <div className="flex h-[46px] w-full shrink-0 items-center gap-[8px]">
                <div className={filt}>
                    <Icon name="chevron-down" className="h-[16px] w-[16px] shrink-0" color="var(--muted-foreground)" />
                    {dateLabel}
                </div>
                <div className={filt}>
                    <Icon name="chevron-down" className="h-[16px] w-[16px] shrink-0" color="var(--muted-foreground)" />
                    {productLabel}
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get('/designer/tasks', { tab, q: q || undefined });
                    }}
                    className="flex h-[46px] flex-1 items-center justify-end gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px]"
                >
                    <input dir="rtl" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم الأوردر أو اسم المنتج" aria-label="بحث في المهام" className="min-w-0 flex-1 bg-transparent text-right text-[14px] leading-[normal] font-[400] text-[var(--ink)] outline-hidden placeholder:text-[var(--muted-foreground)]" />
                    <Icon name="search" className="h-[16px] w-[16px] shrink-0" color="var(--muted-foreground)" />
                </form>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-[12px]">
                {tasks.length === 0 && <div className="w-full rounded-[10px] bg-[var(--surface)] p-[32px] text-center text-[14px] text-[var(--muted-foreground)] [outline:1px_solid_var(--border)]">لا توجد مهام في هذا القسم.</div>}
                {tasks.map((t) => {
                    const [label, bg, fg] = ST[t.state] ?? ST.NEW;
                    return (
                        <div key={t.id} className="flex w-full shrink-0 flex-col gap-[11px] rounded-[10px] bg-[var(--surface)] p-[18px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                            <div className="flex w-full shrink-0 items-center justify-between">
                                <div className="flex w-fit shrink-0 items-center gap-[8px]">
                                    {tab === 'new' && (
                                        <button type="button" onClick={() => router.post(`/designer/tasks/${t.id}/start`, {}, { headers: { 'Idempotency-Key': crypto.randomUUID() } })} className="flex h-[38px] w-fit shrink-0 items-center justify-center rounded-[8px] bg-[var(--primary)] p-[0px_16px] text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap text-white [outline:1px_solid_var(--primary)] [outline-offset:-0.5px]">
                                            بدء التصميم
                                        </button>
                                    )}
                                    <Link href={`/designer/tasks/${t.id}`} className={`flex h-[38px] w-fit shrink-0 items-center justify-center rounded-[8px] p-[0px_16px] text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap [outline-offset:-0.5px] ${tab === 'new' || tab === 'revision' && false ? 'bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]' : 'bg-[var(--primary)] text-white [outline:1px_solid_var(--primary)]'}`}>
                                        {tab === 'new' ? 'عرض التفاصيل' : tab === 'revision' ? 'عرض التفاصيل' : 'فتح المهمة'}
                                    </Link>
                                </div>
                                <div className="flex w-fit shrink-0 items-center gap-[10px]">
                                    <div className="flex h-[28px] w-fit shrink-0 items-center rounded-[14px] p-[0px_10px]" style={{ background: bg }}>
                                        <div className="text-left text-[11px] leading-[normal] font-[700] whitespace-nowrap" style={{ color: fg }}>{label}</div>
                                    </div>
                                    <div className="text-left text-[17px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">{t.product}</div>
                                </div>
                            </div>
                            <div className="flex w-full shrink-0 justify-end gap-[16px]">
                                <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--ink)]">{t.customer}</div>
                                <div className="text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-[var(--muted-foreground)]">{t.code}</div>
                                <div className="text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-[var(--muted-foreground)]">{t.order_number}</div>
                            </div>
                            {t.line ? (
                                <div className="w-full text-right text-[12px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{t.line}</div>
                            ) : (
                                <>
                                    <div className="w-full text-right text-[12px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{t.specs}</div>
                                    <div className="flex w-full shrink-0 justify-end gap-[22px]">
                                        <div className="text-left text-[11px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">آخر تحديث {formatDateTimeShort(t.updated_at)}</div>
                                        <div className="text-left text-[11px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">رسائل جديدة {plural(t.unread, 'رسالة جديدة واحدة', 'رسالتان جديدتان', 'رسائل جديدة', 'لا توجد رسائل جديدة')}</div>
                                        <div className="text-left text-[11px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">عدد الملفات {plural(t.files_count, 'ملف واحد', 'ملفان', 'ملفات', 'لا توجد مرفقات')}</div>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </DesignerLayout>
    );
}
