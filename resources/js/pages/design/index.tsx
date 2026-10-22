import { PenBreadcrumb, PenFilterMenu } from '@/components/pen/primitives';
import { PenSelect } from '@/components/pen/form';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    kpis: { unassigned: number; in_design: number; revision: number; awaiting: number };
    unassigned: { id: number; code: string; order_number: string; product: string; specialty: string; created_at: string }[];
    tasks: { id: number; code: string; order_number: string; product: string; designer: string; state: string; state_label: string; updated_at: string }[];
    workload: { id: number; name: string; availability: string; availability_value: string; active: number }[];
    designers: { id: number; name: string }[];
    orders: { value: string; label: string }[];
    specialties: { value: string; label: string }[];
    filters: Record<string, string>;
    can: { assign: boolean };
}

const PILL: Record<string, [string, string]> = {
    UNASSIGNED: ['#FFF3D9', '#895A0D'],
    NEW: ['#EEF2F6', '#475569'],
    IN_DESIGN: ['#E8F1FF', '#1D5FB8'],
    REVISION_REQUESTED: ['#FFF0EF', '#B42318'],
    AWAITING_APPROVAL: ['#FFF3D9', '#895A0D'],
    APPROVED: ['#E6F5EA', '#237A4B'],
};
const AV: Record<string, [string, string]> = { AVAILABLE: ['#E6F5EA', '#237A4B'], ON_LEAVE: ['#FFF3D9', '#895A0D'], UNAVAILABLE: ['#FFF0EF', '#B42318'] };
const STATE_NAMES: Record<string, string> = { NEW: 'مهمة جديدة', IN_DESIGN: 'قيد التنفيذ', REVISION_REQUESTED: 'مطلوب تعديل', AWAITING_APPROVAL: 'بانتظار اعتماد العميل', APPROVED: 'معتمد' };
const th = 'flex h-[44px] shrink-0 items-center justify-end gap-[6px] whitespace-nowrap text-right text-[12px] leading-[17px] font-[600] text-[#475569]';
const td = 'flex h-[56px] shrink-0 items-center justify-end gap-[6px] whitespace-nowrap text-right text-[12px] leading-[17px] font-[400] text-[var(--ink)]';
const act = 'flex h-[36px] w-fit shrink-0 items-center justify-center rounded-[7px] bg-[var(--surface)] p-[0px_10px] text-center text-[12px] leading-[normal] font-[600] whitespace-nowrap text-[var(--primary)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] focus-visible:outline-2 focus-visible:outline-[var(--primary)]';
const dshort = (iso: string) => `${formatDate(iso, { year: false })}، ${formatTime(iso)}`;
const dlong = (iso: string) => `${formatDate(iso)}، ${formatTime(iso)}`;

function Pill({ k, children }: { k: string; children: string }) {
    const [bg, fg] = PILL[k] ?? PILL.NEW;
    return (
        <div className="flex h-[26px] w-fit shrink-0 items-center rounded-[13px] p-[0px_8px]" style={{ background: bg }}>
            <div className="text-left text-[11px] leading-[normal] font-[700] whitespace-nowrap" style={{ color: fg }}>{children}</div>
        </div>
    );
}

/** S-039 — إدارة التصميمات (pendev: xxcUy). */
export default function DesignIndex({ kpis, unassigned, tasks, workload, designers, orders, specialties, filters, can }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const [assigning, setAssigning] = useState<number | null>(null);
    const [designer, setDesigner] = useState('');
    const cards: [string, number, string][] = [
        ['بانتظار اعتماد العميل', kpis.awaiting, '#895A0D'],
        ['مطلوب تعديل', kpis.revision, '#B42318'],
        ['قيد التنفيذ', kpis.in_design, '#2563EB'],
        ['مهام غير مسندة', kpis.unassigned, '#B45309'],
    ];
    const go = (next: Record<string, string | undefined>) => router.get('/design', { ...filters, ...next }, { preserveState: true, preserveScroll: true });
    return (
        <AppLayout active="/design">
            <Head title="إدارة التصميمات" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, 'إدارة التصميمات']} />
                <div className="flex w-full shrink-0 flex-col-reverse items-stretch justify-between gap-[12px] sm:flex-row sm:items-center">
                    <Link href="/design/designers" className="flex h-[40px] w-fit shrink-0 items-center justify-center rounded-[8px] bg-[var(--surface)] p-[0px_14px] text-center text-[13px] leading-[normal] font-[600] whitespace-nowrap text-[var(--primary)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] focus-visible:outline-2 focus-visible:outline-[var(--primary)]">
                        عرض المصممين
                    </Link>
                    <div className="flex flex-1 flex-col gap-[3px]">
                        <h1 className="w-full text-right text-[28px] leading-[42px] font-[700] text-[var(--ink)]">إدارة التصميمات</h1>
                        <div className="w-full text-right text-[14px] leading-[21px] font-[400] text-[var(--muted-foreground)]">متابعة مهام التصميم وتوزيع العمل على المصممين.</div>
                    </div>
                </div>
                <div className="flex w-full shrink-0 flex-wrap gap-[12px]">
                    {[...cards].reverse().map(([l, n, c]) => (
                        <div key={l} className="flex min-w-[150px] flex-1 flex-col gap-[4px] rounded-[9px] bg-[var(--surface)] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                            <div className="h-[3px] w-[32px] rounded-[2px]" style={{ background: c }} />
                            <div className="w-full text-right text-[25px] leading-[38px] font-[700]" style={{ color: c }}>{n}</div>
                            <div className="w-full text-right text-[13px] leading-[20px] font-[600] text-[var(--ink)]">{l}</div>
                        </div>
                    ))}
                </div>
                <div className="flex w-full shrink-0 flex-col gap-[10px]">
                    <form
                        role="search"
                        onSubmit={(e) => {
                            e.preventDefault();
                            go({ q: q || undefined });
                        }}
                        className="flex h-[46px] w-full shrink-0 items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px]"
                    >
                        <Icon name="search" className="h-[18px] w-[18px] shrink-0" color="var(--muted-foreground)" />
                        <input dir="rtl" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم الأوردر أو البند" aria-label="بحث" className="min-w-0 flex-1 bg-transparent text-right text-[14px] leading-[21px] font-[400] text-[var(--ink)] outline-hidden placeholder:text-[var(--muted-foreground)]" />
                    </form>
                    <div className="flex w-full shrink-0 flex-wrap justify-end gap-[8px]">
                        <PenFilterMenu
                            label="رقم الأوردر"
                            value={filters.order ?? ''}
                            options={[{ value: '', label: 'الكل' }, ...orders]}
                            onChange={(v) => go({ order: v || undefined })}
                        />
                        <PenFilterMenu
                            label="الفترة الزمنية"
                            value={filters.period ?? ''}
                            options={[{ value: '', label: 'الكل' }, { value: 'today', label: 'اليوم' }, { value: 'week', label: 'آخر 7 أيام' }, { value: 'month', label: 'آخر 30 يومًا' }]}
                            onChange={(v) => go({ period: v || undefined })}
                        />
                        <PenFilterMenu
                            label="التخصص"
                            value={filters.specialty ?? ''}
                            options={[{ value: '', label: 'الكل' }, ...specialties]}
                            onChange={(v) => go({ specialty: v || undefined })}
                        />
                        <PenFilterMenu
                            label="المصمم"
                            value={filters.designer ?? ''}
                            options={[{ value: '', label: 'المصمم' }, ...designers.map((d) => ({ value: String(d.id), label: d.name }))]}
                            onChange={(v) => go({ designer: v || undefined })}
                        />
                        <PenFilterMenu
                            label="حالة المهمة"
                            value={filters.state ?? ''}
                            options={[{ value: '', label: 'حالة المهمة' }, ...Object.entries(STATE_NAMES).map(([k, l]) => ({ value: k, label: l }))]}
                            onChange={(v) => go({ state: v || undefined })}
                        />
                    </div>
                </div>

                <div className="flex w-full shrink-0 flex-col gap-[8px]">
                    <div className="w-full text-right text-[18px] leading-[26px] font-[700] text-[var(--ink)]">مهام غير مسندة</div>
                    <div className="w-full overflow-x-auto rounded-[9px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                      <div className="flex w-full min-w-[980px] shrink-0 flex-col">
                        <div className="flex h-[43.5px] w-full shrink-0 items-center bg-[var(--background)] p-[0px_16px]">
                            <div className={`${th} w-[220px] justify-start`}>الإجراءات</div>
                            <div className={`${th} w-[120px]`}>الحالة</div>
                            <div className={`${th} w-[160px]`}>تاريخ الإنشاء</div>
                            <div className={`${th} w-[170px]`}>التخصص المطلوب</div>
                            <div className={`${th} w-[100px]`}>المنتج</div>
                            <div className={`${th} w-[160px]`}>رقم البند</div>
                            <div className={`${th} flex-1`}>رقم الأوردر</div>
                        </div>
                        {unassigned.length === 0 && <div className="w-full p-[24px] text-center text-[13px] text-[var(--muted-foreground)]">لا توجد مهام غير مسندة.</div>}
                        {unassigned.map((u) => (
                            <div key={u.id} className="flex h-[55.5px] w-full shrink-0 items-center border-b border-[var(--border)] bg-[var(--surface)] p-[0px_16px] last:border-b-0">
                                <div className={`${td} w-[220px] justify-start`}>
                                    <Link href={`/orders/${u.code.split('-')[1]}?tab=items`} className={act}>
                                        عرض المهمة
                                    </Link>
                                    {can.assign && (
                                        <button type="button" onClick={() => setAssigning(u.id)} className={act}>
                                            إسناد مصمم
                                        </button>
                                    )}
                                </div>
                                <div className={`${td} w-[120px]`}>
                                    <Pill k="UNASSIGNED">غير مسند</Pill>
                                </div>
                                <div className={`${td} w-[160px]`}>{dlong(u.created_at)}</div>
                                <div className={`${td} w-[170px]`}>{u.specialty}</div>
                                <div className={`${td} w-[100px]`}>{u.product}</div>
                                <div className={`${td} w-[160px] font-[600] text-[var(--primary)]`}>{u.code}</div>
                                <div className={`${td} flex-1 font-[600] text-[var(--primary)]`}>{u.order_number}</div>
                            </div>
                        ))}
                      </div>
                    </div>
                </div>

                <div className="flex w-full shrink-0 flex-col gap-[8px]">
                    <div className="w-full text-right text-[18px] leading-[26px] font-[700] text-[var(--ink)]">حالة مهام التصميم</div>
                    <div className="w-full overflow-x-auto rounded-[9px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                      <div className="flex w-full min-w-[880px] shrink-0 flex-col">
                        <div className="flex h-[43.5px] w-full shrink-0 items-center bg-[var(--background)] p-[0px_16px]">
                            <div className={`${th} w-[120px] justify-start`}>الإجراءات</div>
                            <div className={`${th} w-[170px]`}>آخر تحديث</div>
                            <div className={`${th} w-[185px]`}>حالة التصميم</div>
                            <div className={`${th} w-[150px]`}>المصمم</div>
                            <div className={`${th} w-[100px]`}>المنتج</div>
                            <div className={`${th} w-[160px]`}>الأوردر</div>
                            <div className={`${th} flex-1`}>رقم البند</div>
                        </div>
                        {tasks.map((t) => (
                            <div key={t.id} className="flex h-[55.5px] w-full shrink-0 items-center border-b border-[var(--border)] bg-[var(--surface)] p-[0px_16px] last:border-b-0">
                                <div className={`${td} w-[120px] justify-start`}>
                                    <Link href={`/orders/${t.code.split('-')[1]}?tab=items`} className={act}>
                                        عرض المهمة
                                    </Link>
                                </div>
                                <div className={`${td} w-[170px]`}>{dshort(t.updated_at)}</div>
                                <div className={`${td} w-[185px]`}>
                                    <Pill k={t.state}>{t.state_label}</Pill>
                                </div>
                                <div className={`${td} w-[150px]`}>{t.designer}</div>
                                <div className={`${td} w-[100px]`}>{t.product}</div>
                                <div className={`${td} w-[160px]`}>{t.order_number}</div>
                                <div className={`${td} flex-1 font-[600] text-[var(--primary)]`}>{t.code}</div>
                            </div>
                        ))}
                      </div>
                    </div>
                </div>

                <div className="flex w-full shrink-0 flex-col gap-[8px]">
                    <div className="w-full text-right text-[18px] leading-[26px] font-[700] text-[var(--ink)]">عبء عمل المصممين</div>
                    <div className="flex w-full shrink-0 flex-wrap gap-[12px]">
                        {workload.map((w) => (
                            <div key={w.id} className="flex min-w-[220px] flex-1 flex-col gap-[8px] rounded-[10px] bg-[var(--surface)] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                                <div className="flex w-full shrink-0 items-center justify-between">
                                    <div className="flex h-[26px] w-fit shrink-0 items-center rounded-[13px] p-[0px_9px]" style={{ background: AV[w.availability_value]?.[0] }}>
                                        <div className="text-left text-[11px] leading-[normal] font-[700] whitespace-nowrap" style={{ color: AV[w.availability_value]?.[1] }}>{w.availability}</div>
                                    </div>
                                    <div className="text-left text-[15px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">{w.name}</div>
                                </div>
                                <div className="flex w-full shrink-0 justify-between">
                                    <div className="text-left text-[13px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{w.active}</div>
                                    <div className="text-left text-[13px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">المهام النشطة:</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {assigning !== null && (
                <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]">
                    <div className="flex w-[440px] max-w-full flex-col gap-[14px] rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)]">
                        <div className="w-full text-right text-[16px] leading-[26px] font-[700] text-[var(--ink)]">إسناد مصمم</div>
                        <PenSelect
                            label="المصمم"
                            value={designer}
                            placeholder="اختر المصمم"
                            options={designers.map((d) => ({ value: String(d.id), label: d.name }))}
                            onValueChange={setDesigner}
                        />
                        <div className="flex w-full shrink-0 justify-end gap-[12px]">
                            <button type="button" onClick={() => setAssigning(null)} className="flex h-[40px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_16px] text-[14px] [outline:1px_solid_var(--border)]">
                                الرجوع
                            </button>
                            <button
                                type="button"
                                disabled={!designer}
                                onClick={() => router.post(`/design/items/${assigning}/assign`, { designer_id: Number(designer) } as never, { headers: { 'Idempotency-Key': crypto.randomUUID() }, onSuccess: () => setAssigning(null) })}
                                className="flex h-[40px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_16px] text-[14px] font-[600] text-white disabled:opacity-60"
                            >
                                إسناد
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
