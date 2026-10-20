import { PageTabs } from '@/components/pen/page-tabs';
import { PenBreadcrumb } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Head, Link, router } from '@inertiajs/react';
import { initials } from './designers';

type Tab = 'overview' | 'active' | 'awaiting' | 'done' | 'history' | 'availability';
interface Task {
    id: number;
    code: string;
    order_number: string;
    product: string;
    state: string;
    state_label: string;
    updated_at: string;
}
interface Props {
    designer: { id: number; name: string; specialty: string; status: string; availability: string; availability_value: string; stats: { active: number; new: number; awaiting: number; done: number } };
    tab: Tab;
    tasks: Task[];
    history: { mode: string; reason: string | null; at: string; item_id: number }[];
    can: { availability: boolean };
    availabilityOptions: { value: string; label: string }[];
}
const TABS: [Tab, string][] = [
    ['availability', 'حالة التوفر'],
    ['history', 'سجل الإسناد'],
    ['done', 'المهام المكتملة'],
    ['awaiting', 'بانتظار الاعتماد'],
    ['active', 'المهام النشطة'],
    ['overview', 'نظرة عامة'],
];
const PILL: Record<string, [string, string]> = { NEW: ['#EEF2F6', '#475569'], IN_DESIGN: ['#E8F1FF', '#1D5FB8'], REVISION_REQUESTED: ['#FFF0EF', '#B42318'], AWAITING_APPROVAL: ['#FFF3D9', '#895A0D'], APPROVED: ['#E6F5EA', '#237A4B'] };
const box = 'flex flex-col gap-[10px] rounded-[10px] bg-[var(--surface)] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const h17 = 'w-full text-right text-[17px] leading-[26px] font-[700] text-[var(--ink)]';
const th = 'flex h-[44px] shrink-0 items-center text-right text-[12px] leading-[18px] font-[600] text-[#475569]';
const td = 'flex h-[56px] shrink-0 items-center text-right text-[12px] leading-[18px] text-[var(--ink)]';
const Row = ({ k, v, h = 35.5, big }: { k: string; v: string | number; h?: number; big?: boolean }) => (
    <div className="flex w-full shrink-0 justify-between p-[6px_0px] [border-bottom:1px_solid_var(--border)]" style={{ height: h }}>
        <div className="text-left leading-[normal] font-[600] text-[var(--ink)]" style={{ fontSize: big ? 14 : 13, fontWeight: big ? 700 : 600 }}>{v}</div>
        <div className="text-left text-[12px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{k}</div>
    </div>
);

/** S-041-01..06 — ملف المصمم (pendev: XJ88N · BIU7A · lKqz4 · FDQiS · Tdt8J · ZDtcI). */
export default function Designer({ designer: d, tab, tasks, history, can, availabilityOptions }: Props) {
    const [, pillFg] = PILL.IN_DESIGN;
    void pillFg;
    const stateRows = (rows: Task[]) => (
        <div className="flex w-full shrink-0 flex-col rounded-[9px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
            <div className="flex h-[43.5px] w-full shrink-0 items-center bg-[var(--background)] p-[0px_16px] [border-bottom:1px_solid_var(--border)]">
                <div className={`${th} w-[120px]`}>الإجراءات</div>
                <div className={`${th} w-[190px]`}>آخر تحديث</div>
                <div className={`${th} w-[180px]`}>حالة المهمة</div>
                <div className={`${th} w-[130px]`}>المنتج</div>
                <div className={`${th} w-[230px]`}>رقم البند</div>
                <div className={`${th} flex-1`}>رقم الأوردر</div>
            </div>
            {rows.length === 0 && <div className="w-full p-[24px] text-center text-[13px] text-[var(--muted-foreground)]">لا توجد مهام.</div>}
            {rows.map((t) => (
                <div key={t.id} className="flex h-[55.5px] w-full shrink-0 items-center bg-[var(--surface)] p-[0px_16px] [border-bottom:1px_solid_var(--border)]">
                    <div className={`${td} w-[120px]`}>
                        <Link href={`/orders/${t.code.split('-')[1]}?tab=items`} className="flex h-[38px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_14px] text-[13px] leading-[normal] font-[600] text-[var(--primary)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                            عرض المهمة
                        </Link>
                    </div>
                    <div className={`${td} w-[190px]`}>{`${formatDate(t.updated_at, { year: false })}، ${formatTime(t.updated_at)}`}</div>
                    <div className={`${td} w-[180px] justify-end`}>
                        <div className="flex h-[26px] items-center rounded-[13px] p-[0px_8px]" style={{ background: PILL[t.state]?.[0] }}>
                            <div className="text-[11px] leading-[normal] font-[700] whitespace-nowrap" style={{ color: PILL[t.state]?.[1] }}>{t.state_label}</div>
                        </div>
                    </div>
                    <div className={`${td} w-[130px]`}>{t.product}</div>
                    <div className={`${td} w-[230px] font-[600] text-[var(--primary)]`}>{t.code}</div>
                    <div className={`${td} flex-1 font-[600] text-[var(--primary)]`}>{t.order_number}</div>
                </div>
            ))}
        </div>
    );
    return (
        <AppLayout active="/design">
            <Head title={`ملف المصمم ${d.name}`} />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'إدارة التصميمات', href: '/design' }, { label: 'المصممون', href: '/design/designers' }, d.name]} />
                <div className="flex w-full shrink-0 items-center justify-between">
                    <div className="flex w-fit shrink-0 gap-[8px]">
                        {can.availability && (
                            <Link href={`/design/designers/${d.id}?tab=availability`} className="flex h-[38px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_14px] text-[13px] leading-[normal] font-[600] text-[var(--primary)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                                تغيير حالة التوفر
                            </Link>
                        )}
                        <Link href="/design" className="flex h-[38px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_14px] text-[13px] leading-[normal] font-[600] text-[var(--primary)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                            عرض جميع المهام
                        </Link>
                    </div>
                    <div className="flex flex-1 flex-col gap-[4px]">
                        <h1 className="w-full text-right text-[28px] leading-[42px] font-[700] text-[var(--ink)]">ملف المصمم</h1>
                        <div className="w-full text-right text-[15px] leading-[23px] text-[var(--muted-foreground)]">{d.name}</div>
                    </div>
                </div>
                <div className="flex w-full shrink-0 items-center gap-[16px] rounded-[10px] bg-[var(--surface)] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <div className="flex h-[28px] w-fit shrink-0 items-center rounded-[14px] bg-[#E8F1FF] p-[0px_10px]">
                        <div className="text-[12px] leading-[normal] font-[700] text-[#1D5FB8]">{d.availability}</div>
                    </div>
                    <div className="flex h-[28px] w-fit shrink-0 items-center rounded-[14px] bg-[#E6F5EA] p-[0px_10px]">
                        <div className="text-[12px] leading-[normal] font-[700] text-[#237A4B]">{d.status === 'ACTIVE' ? 'نشط' : 'معطّل'}</div>
                    </div>
                    <div className="flex flex-1 flex-col gap-[3px]">
                        <div className="w-full text-right text-[19px] leading-[29px] font-[700] text-[var(--ink)]">{d.name}</div>
                        <div className="w-full text-right text-[13px] leading-[20px] text-[var(--muted-foreground)]">مصمم • {d.specialty}</div>
                    </div>
                    <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[24px] bg-[#E8F1FF]">
                        <div className="text-[15px] leading-[normal] font-[700] text-[var(--primary)]">{initials(d.name).replace('-', '')}</div>
                    </div>
                </div>
                <PageTabs label="أقسام المصمم" value={tab} tabs={TABS.map(([key, label]) => ({ key, label, href: `/design/designers/${d.id}${key === 'overview' ? '' : `?tab=${key}`}` }))} />
                {tab === 'overview' && (
                    <>
                        <div className="flex w-full shrink-0 gap-[16px]">
                            <div className={`${box} w-[430px]`}>
                                <div className={h17}>معلومات المصمم</div>
                                <Row k="الاسم" v={d.name} />
                                <Row k="التخصصات" v={d.specialty} />
                                <Row k="الحالة الوظيفية" v={d.status === 'ACTIVE' ? 'نشط' : 'معطّل'} />
                                <Row k="حالة التوفر" v={d.availability} />
                            </div>
                            <div className={`${box} flex-1`}>
                                <div className={h17}>ملخص العمل</div>
                                <Row k="المهام الجديدة" v={d.stats.new} h={37.5} big />
                                <Row k="المهام النشطة" v={d.stats.active} h={37.5} big />
                                <Row k="بانتظار الاعتماد" v={d.stats.awaiting} h={37.5} big />
                                <Row k="المهام المكتملة" v={d.stats.done} h={37.5} big />
                            </div>
                        </div>
                        <div className="flex w-full shrink-0 flex-col gap-[8px]">
                            <div className="w-full text-right text-[18px] leading-[27px] font-[700] text-[var(--ink)]">آخر المهام</div>
                            {stateRows(tasks)}
                        </div>
                    </>
                )}
                {(tab === 'active' || tab === 'awaiting' || tab === 'done') && stateRows(tasks)}
                {tab === 'history' && (
                    <div className={`${box} w-full`}>
                        <div className={h17}>سجل الإسناد</div>
                        {history.length === 0 && <div className="w-full text-right text-[13px] text-[var(--muted-foreground)]">لا يوجد سجل إسناد.</div>}
                        {history.map((h, i) => (
                            <Row key={i} k={`${h.mode === 'AUTO' ? 'تلقائي' : 'يدوي'} • ${formatDate(h.at)}`} v={h.reason ?? `بند #${h.item_id}`} />
                        ))}
                    </div>
                )}
                {tab === 'availability' && (
                    <div className={`${box} w-full`}>
                        <div className={h17}>حالة التوفر</div>
                        <div className="w-full text-right text-[13px] text-[var(--muted-foreground)]">حالة استقبال المهام مستقلة عن تسجيل الدخول. الحالية: {d.availability}</div>
                        {can.availability && (
                            <div className="flex w-full shrink-0 justify-end gap-[8px]">
                                {availabilityOptions.map((o) => (
                                    <button key={o.value} type="button" disabled={o.value === d.availability_value} onClick={() => router.post(`/design/designers/${d.id}/availability`, { status: o.value } as never, { headers: { 'Idempotency-Key': crypto.randomUUID() } })} className="flex h-[40px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_16px] text-[13px] font-[600] text-[var(--primary)] [outline:1px_solid_var(--border)] disabled:opacity-50">
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
