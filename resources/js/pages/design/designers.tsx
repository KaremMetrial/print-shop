import { idemHeaders } from '@/lib/idempotency';
import { PenBreadcrumb, PenFilterMenu } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { Icon } from '@/pen/icon';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface D {
    id: number;
    name: string;
    specialty: string;
    status: string;
    availability: string;
    availability_value: string;
    stats: { active: number; new: number; awaiting: number; done: number };
}
interface Props {
    designers: D[];
    specialties: { id: number; name: string }[];
    filters: Record<string, string>;
    can: { availability: boolean };
}
const AV: Record<string, [string, string]> = { AVAILABLE: ['#E8F1FF', '#1D5FB8'], ON_LEAVE: ['#FFF3D9', '#895A0D'], UNAVAILABLE: ['#FFF0EF', '#B42318'] };
const btn = 'flex h-[36px] w-fit shrink-0 items-center rounded-[7px] bg-[var(--surface)] p-[0px_12px] text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-[var(--primary)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
export const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('-');

/** S-040 — المصممون (pendev: eM5xP). */
export default function Designers({ designers, specialties, filters, can }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const go = (n: Record<string, string | undefined>) => router.get('/design/designers', { ...filters, ...n }, { preserveState: true, preserveScroll: true });
    const cycle = (d: D) => router.post(`/design/designers/${d.id}/availability`, { status: d.availability_value === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE' } as never, { headers: idemHeaders() });
    return (
        <AppLayout active="/design">
            <Head title="المصممون" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'إدارة التصميمات', href: '/design' }, 'المصممون']} />
                <div className="flex w-full shrink-0 items-center justify-between">
                    <div className="flex h-[30px] w-fit shrink-0 items-center rounded-[15px] bg-[#EDF4FF] p-[0px_10px]">
                        <div className="text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]">{designers.length === 1 ? 'مصمم واحد' : `${designers.length} مصممين`}</div>
                    </div>
                    <h1 className="flex-1 text-right text-[28px] leading-[42px] font-[700] text-[var(--ink)]">المصممون</h1>
                </div>
                <form
                    role="search"
                    onSubmit={(e) => {
                        e.preventDefault();
                        go({ q: q || undefined });
                    }}
                    className="flex h-[46px] w-full shrink-0 items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px]"
                >
                    <Icon name="search" className="h-[18px] w-[18px] shrink-0" color="var(--muted-foreground)" />
                    <input dir="rtl" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم المصمم" aria-label="بحث" className="min-w-0 flex-1 bg-transparent text-right text-[14px] leading-[21px] outline-hidden placeholder:text-[var(--muted-foreground)]" />
                </form>
                <div className="flex w-full shrink-0 justify-end gap-[8px]">
                    <PenFilterMenu
                        label="التخصص"
                        value={filters.specialty ?? ''}
                        options={[{ value: '', label: 'الكل' }, ...specialties.map((s) => ({ value: String(s.id), label: s.name }))]}
                        onChange={(v) => go({ specialty: v || undefined })}
                    />
                    <PenFilterMenu
                        label="الحالة الوظيفية"
                        value={filters.status ?? ''}
                        options={[{ value: '', label: 'الكل' }, { value: 'ACTIVE', label: 'نشط' }, { value: 'INACTIVE', label: 'معطّل' }]}
                        onChange={(v) => go({ status: v || undefined })}
                    />
                    <PenFilterMenu
                        label="حالة التوفر"
                        value={filters.availability ?? ''}
                        options={[{ value: '', label: 'حالة التوفر' }, { value: 'AVAILABLE', label: 'متاح' }, { value: 'UNAVAILABLE', label: 'غير متاح' }, { value: 'ON_LEAVE', label: 'في إجازة' }]}
                        onChange={(v) => go({ availability: v || undefined })}
                    />
                </div>
                <div className="flex w-full shrink-0 gap-[12px]">
                    {designers.map((d) => (
                        <div key={d.id} className="flex h-[320px] flex-1 flex-col gap-[12px] rounded-[10px] bg-[var(--surface)] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                            <div className="flex w-full shrink-0 items-center gap-[12px]">
                                <div className="flex flex-1 flex-col gap-[3px]">
                                    <div className="w-full text-right text-[17px] leading-[26px] font-[700] text-[var(--ink)]">{d.name}</div>
                                    <div className="w-full text-right text-[12px] leading-[18px] text-[var(--muted-foreground)]">{d.specialty}</div>
                                </div>
                                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[21px] bg-[#E8F1FF]">
                                    <div className="text-left text-[13px] leading-[normal] font-[700] text-[var(--primary)]">{initials(d.name)}</div>
                                </div>
                            </div>
                            <div className="flex w-full shrink-0 items-center justify-end gap-[8px]">
                                <div className="flex h-[26px] w-fit shrink-0 items-center rounded-[13px] bg-[#E6F5EA] p-[0px_9px]">
                                    <div className="text-left text-[11px] leading-[normal] font-[700] text-[#237A4B]">{d.status === 'ACTIVE' ? 'نشط' : 'معطّل'}</div>
                                </div>
                                <div className="flex h-[26px] w-fit shrink-0 items-center rounded-[13px] p-[0px_9px]" style={{ background: AV[d.availability_value]?.[0] }}>
                                    <div className="text-left text-[11px] leading-[normal] font-[700]" style={{ color: AV[d.availability_value]?.[1] }}>{d.availability}</div>
                                </div>
                            </div>
                            <div className="flex w-full shrink-0 flex-col gap-[6px] p-[10px_0px] [border-color:var(--border)] [border-style:solid] [border-width:1px_0px_1px_0px]">
                                {[['المهام النشطة', d.stats.active], ['المهام الجديدة', d.stats.new], ['بانتظار الاعتماد', d.stats.awaiting], ['المهام المكتملة', d.stats.done]].map(([k, v]) => (
                                    <div key={k} className="flex w-full shrink-0 justify-between">
                                        <div className="text-left text-[13px] leading-[normal] font-[700] text-[var(--ink)]">{v}</div>
                                        <div className="text-left text-[12px] leading-[normal] text-[var(--muted-foreground)]">{k}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex w-full shrink-0 justify-end gap-[8px]">
                                {can.availability && (
                                    <button type="button" onClick={() => cycle(d)} className={btn}>
                                        تغيير حالة التوفر
                                    </button>
                                )}
                                <Link href={`/design/designers/${d.id}`} className={btn}>
                                    عرض الملف
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
