import { DataGrid, ListHead, RowBtn } from '@/components/pen/lists';
import { PenPagination } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface L {
    id: number;
    action: string;
    actor: string;
    role: string | null;
    entity: string;
    entity_id: number | null;
    reason: string | null;
    at: string;
    old: { k: string; v: string }[];
    new: { k: string; v: string }[];
}
interface Props {
    logs: { data: L[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    filters: Record<string, string>;
    actors: { id: number; name: string }[];
    actions: { value: string; label: string }[];
    entities: { value: string; label: string }[];
}
const fld =
    'h-[46px] rounded-[10px] bg-[var(--background)] p-[0px_14px] text-[14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px]';

/** S-077/078 — سجل التدقيق (للقراءة فقط) وتفاصيل الحدث. */
export default function Audit({ logs, filters, actors, actions, entities }: Props) {
    const [open, setOpen] = useState<L | null>(null);
    const go = (n: Record<string, string | undefined>) => router.get('/audit', { ...filters, ...n }, { preserveState: true });
    return (
        <AppLayout active="/audit">
            <Head title="سجل التدقيق" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <ListHead
                    crumbs={[{ label: 'الرئيسية', href: '/dashboard' }, 'سجل التدقيق']}
                    title="سجل التدقيق"
                    subtitle="السجل للقراءة فقط — لا تعديل أو حذف أو مسح للسجل."
                />
                <div className="flex w-full shrink-0 flex-wrap justify-end gap-[8px] rounded-[12px] bg-[var(--surface)] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <input
                        type="date"
                        aria-label="إلى"
                        value={filters.to ?? ''}
                        onChange={(e) => go({ to: e.target.value || undefined })}
                        className={fld}
                    />
                    <input
                        type="date"
                        aria-label="من"
                        value={filters.from ?? ''}
                        onChange={(e) => go({ from: e.target.value || undefined })}
                        className={fld}
                    />
                    <select
                        aria-label="نوع الكيان"
                        value={filters.entity ?? ''}
                        onChange={(e) => go({ entity: e.target.value || undefined })}
                        className={fld}
                    >
                        <option value="">كل الكيانات</option>
                        {entities.map((x) => (
                            <option key={x.value} value={x.value}>
                                {x.label}
                            </option>
                        ))}
                    </select>
                    <select
                        aria-label="الإجراء"
                        value={filters.action ?? ''}
                        onChange={(e) => go({ action: e.target.value || undefined })}
                        className={fld}
                    >
                        <option value="">كل الإجراءات</option>
                        {actions.map((x) => (
                            <option key={x.value} value={x.value}>
                                {x.label}
                            </option>
                        ))}
                    </select>
                    <select
                        aria-label="الموظف"
                        value={filters.actor ?? ''}
                        onChange={(e) => go({ actor: e.target.value || undefined })}
                        className={fld}
                    >
                        <option value="">كل الموظفين</option>
                        {actors.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                </div>
                <DataGrid
                    empty="لا توجد أحداث مطابقة."
                    rows={logs.data}
                    cols={[
                        { h: 'الإجراءات', w: 110, cell: (r) => <RowBtn onClick={() => setOpen(r)}>عرض التفاصيل</RowBtn> },
                        { h: 'السبب', w: 160, cell: (r) => r.reason ?? '—' },
                        { h: 'التاريخ والوقت', w: 170, cell: (r) => `${formatDate(r.at)}، ${formatTime(r.at)}` },
                        { h: 'الكيان', w: 150, cell: (r) => `${r.entity}${r.entity_id ? ` #${r.entity_id}` : ''}` },
                        { h: 'الإجراء', cell: (r) => r.action },
                        { h: 'الدور', w: 90, cell: (r) => r.role ?? '—' },
                        { h: 'الموظف', w: 130, cell: (r) => r.actor },
                        { h: 'رقم الحدث', w: 80, cell: (r) => r.id },
                    ]}
                />
                <PenPagination
                    page={logs.current_page}
                    pages={logs.last_page}
                    summary={`عرض ${logs.from ?? 0}–${logs.to ?? 0} من ${logs.total}`}
                    onPage={(p) => go({ page: String(p) })}
                />
            </div>
            {open && (
                <div
                    role="dialog"
                    aria-modal
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]"
                    onClick={() => setOpen(null)}
                >
                    <div
                        dir="rtl"
                        onClick={(e) => e.stopPropagation()}
                        className="flex max-h-[85vh] w-[640px] max-w-full flex-col gap-[12px] overflow-auto rounded-[12px] bg-[var(--surface)] p-[24px]"
                    >
                        <div className="text-[18px] font-[700]">تفاصيل الحدث #{open.id}</div>
                        <div className="text-[13px] text-[var(--muted-foreground)]">
                            {open.actor} • {open.action} • {formatDate(open.at)}، {formatTime(open.at)}
                        </div>
                        {open.reason && <div className="text-[13px]">السبب: {open.reason}</div>}
                        {[
                            ['القيم السابقة', open.old],
                            ['القيم الجديدة', open.new],
                        ].map(([k, v]) => (
                            <div key={k as string}>
                                <div className="text-[13px] font-[700]">{k as string}</div>
                                {(v as L['old']).length === 0 ? (
                                    <div className="mt-[4px] text-[13px] text-[var(--muted-foreground)]">—</div>
                                ) : (
                                    <div className="mt-[4px] flex flex-col rounded-[8px] bg-[var(--background)] p-[8px_12px]">
                                        {(v as L['old']).map((f) => (
                                            <div
                                                key={f.k}
                                                className="flex justify-between gap-[12px] p-[4px_0px] text-[13px] [border-bottom:1px_solid_var(--border)] last:border-b-0"
                                            >
                                                <div className="font-[600] text-[var(--ink)]">{f.v}</div>
                                                <div className="text-[var(--muted-foreground)]">{f.k}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setOpen(null)}
                                className="h-[40px] rounded-[8px] bg-[var(--primary)] p-[0px_18px] text-[14px] font-[600] text-white"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
