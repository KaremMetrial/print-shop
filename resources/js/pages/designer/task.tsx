import { idemHeaders } from '@/lib/idempotency';
import { PageTabs } from '@/components/pen/page-tabs';
import { DesignerLayout } from '@/components/shell/designer-layout';
import { arDigits, arNum, formatDateTimeShort } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { ChatPanel } from '@/components/chat/chat-panel';
import { Head, Link, router } from '@inertiajs/react';
import { type ReactNode } from 'react';

type Tab = 'specs' | 'files' | 'chat' | 'versions' | 'activity';
interface Props {
    tab: Tab;
    designer: { name: string };
    task: {
        id: number;
        code: string;
        order_number: string;
        product: string;
        customer: string;
        designer?: string;
        state: 'NEW' | 'IN_DESIGN' | 'REVISION_REQUESTED' | 'AWAITING_APPROVAL' | 'APPROVED';
        updated_at: string;
        quantity: number;
        specs_list: { group: string; value: string }[];
        notes: string | null;
        customer_note?: { text: string; at: string } | null;
        last_version?: { label: string; sent_at: string; faces: string } | null;
        files?: { name: string; kind: string; size: string }[];
    };
    versions: { id: number; no: number; label?: string; status: string; status_label?: string; submitted_at: string | null; files: { id: number; name: string }[] }[];
    has_draft: boolean;
    can: { start: boolean; version: boolean };
}

const TABS: [Tab, string][] = [
    ['activity', 'النشاط'],
    ['versions', 'نسخ التصميم'],
    ['chat', 'المحادثة'],
    ['files', 'ملفات العميل'],
    ['specs', 'المواصفات'],
];
const ST: Record<string, [string, string, string]> = {
    NEW: ['مهمة جديدة', '#EFF6FF', '#2563EB'],
    IN_DESIGN: ['قيد التنفيذ', '#FFF7E9', '#9A5B09'],
    REVISION_REQUESTED: ['مطلوب تعديل', '#FEF1F1', '#B42318'],
    AWAITING_APPROVAL: ['بانتظار اعتماد العميل', '#FFF3D9', '#895A0D'],
    APPROVED: ['معتمدة', '#E6F5EA', '#237A4B'],
};
const ORD = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
const card = 'flex w-full shrink-0 flex-col rounded-[10px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const btn38 = 'flex h-[38px] w-fit shrink-0 items-center justify-center rounded-[8px] p-[0px_16px] text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap [outline-offset:-0.5px]';
const sec = 'text-left text-[16px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]';
const link12 = 'text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]';

const Spec = ({ k, v, w }: { k: string; v: string; w?: number }) => (
    <div className="flex flex-col items-end gap-[2px] p-[4px_8px]" style={w ? { width: w } : { flex: '1 1 0' }}>
        <div className="text-left text-[11px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">{k}</div>
        <div className="text-left text-[13px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]">{v}</div>
    </div>
);

/** S-044-01..04 — تفاصيل المهمة (pendev: Y1f0aq · r6g1bA · L5E7x · n211M). المصمم لا يرى أسعارًا (BR-071). */
export default function DesignerTask({ tab, designer, task: t, versions, can }: Props) {
    const [label, bg, fg] = ST[t.state];
    const revision = t.state === 'REVISION_REQUESTED';
    const view = tab === 'versions' ? 'versions' : revision && tab === 'specs' ? 'revision' : 'specs';
    const post = (url: string) => router.post(url, {}, { headers: idemHeaders() });
    const spec = (g: string) => t.specs_list.find((s) => s.group === g)?.value ?? '—';
    const rowA = ['نوع الورق', 'المقاس', 'الكمية', 'المنتج'];
    const rowB = ['خيارات المنتج', 'عدد الأوجه', 'نظام الألوان'];
    const values: Record<string, string> = { 'الكمية': `${arNum(t.quantity)} نسخة`, 'المنتج': t.product };

    return (
        <DesignerLayout name={designer.name} gap={t.state === 'IN_DESIGN' && view === 'specs' ? 10 : 16}>
            <Head title={`تفاصيل المهمة ${t.code}`} />
            <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">
                <Link href="/designer/tasks">مهامي</Link> {revision || view === 'versions' ? '/' : '>'} تفاصيل المهمة
            </div>
            <div className="flex w-full shrink-0 items-center justify-between">
                <div className="flex w-fit shrink-0 items-center gap-[8px]">
                    <Link href="/designer/tasks" className={`${btn38} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`}>
                        العودة إلى مهامي
                    </Link>
                    {revision && (
                        <>
                            <Link href={`/designer/tasks/${t.id}?tab=chat`} className={`${btn38} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`}>
                                عرض المحادثة
                            </Link>
                            <Link href={`/designer/tasks/${t.id}/versions/new`} className={`${btn38} bg-[var(--primary)] text-white [outline:1px_solid_var(--primary)]`}>
                                إعداد نسخة جديدة
                            </Link>
                        </>
                    )}
                    {!revision && can.start && (
                        <button type="button" onClick={() => post(`/designer/tasks/${t.id}/start`)} className={`${btn38} bg-[var(--primary)] text-white [outline:1px_solid_var(--primary)]`}>
                            بدء التصميم
                        </button>
                    )}
                    {!revision && !can.start && can.version && view !== 'versions' && (
                        <Link href={`/designer/tasks/${t.id}/versions/new`} className={`${btn38} bg-[var(--primary)] text-white [outline:1px_solid_var(--primary)]`}>
                            إضافة نسخة تصميم
                        </Link>
                    )}
                </div>
                <div className="flex w-fit shrink-0 flex-col items-end gap-[2px]">
                    <h1 className="text-left text-[24px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">تفاصيل المهمة</h1>
                    <div className="text-left text-[14px] leading-[normal] font-[400] whitespace-pre text-[var(--muted-foreground)]">{`${t.product}  •  ${t.code}`}</div>
                </div>
            </div>
            <div className="flex h-[58px] w-full shrink-0 items-center justify-end gap-[20px] rounded-[9px] bg-[var(--surface)] p-[0px_16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                <div className="flex h-[27px] w-fit shrink-0 items-center rounded-[14px] p-[0px_10px]" style={{ background: bg }}>
                    <div className="text-left text-[11px] leading-[normal] font-[700] whitespace-nowrap" style={{ color: fg }}>{label}</div>
                </div>
                <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">آخر تحديث {formatDateTimeShort(t.updated_at)}</div>
                <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">العميل {t.customer}</div>
                {t.designer && <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">المصمم {t.designer}</div>}
                <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">الأوردر {t.order_number}</div>
            </div>
            <PageTabs label="أقسام المهمة" value={tab} tabs={TABS.map(([key, label]) => ({ key, label, href: `/designer/tasks/${t.id}${key === 'specs' ? '' : `?tab=${key}`}` }))} />

            {view === 'specs' && (
                <>
                    {!can.start && t.state === 'IN_DESIGN' && versions.length === 0 && (
                        <div className="flex h-[58px] w-full shrink-0 items-center justify-between rounded-[8px] bg-[#EFF6FF] p-[0px_14px]">
                            <Link href={`/designer/tasks/${t.id}/versions/new`} className="flex h-[36px] w-fit shrink-0 items-center rounded-[7px] bg-[var(--surface)] p-[0px_13px] text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)] [outline:1px_solid_var(--primary)] [outline-offset:-0.5px]">
                                إضافة أول نسخة
                            </Link>
                            <div className="flex w-fit shrink-0 flex-col items-end gap-[1px]">
                                <div className="text-left text-[13px] leading-[normal] font-[700] text-[var(--ink)]">نسخ التصميم</div>
                                <div className="text-left text-[12px] leading-[normal] font-[400] text-[var(--muted-foreground)]">لم تتم إضافة أي نسخ تصميم بعد.</div>
                            </div>
                        </div>
                    )}
                    <div className={`${card} gap-[12px] p-[16px]`}>
                        <div className="flex w-full shrink-0 justify-between">
                            <div className="text-left text-[11px] leading-[normal] font-[400] text-[var(--muted-foreground)]">قراءة فقط</div>
                            <div className={sec}>مواصفات البند</div>
                        </div>
                        <div className="flex w-full shrink-0 justify-end gap-[12px]">
                            {rowA.map((g) => (
                                <Spec key={g} k={g} v={values[g] ?? spec(g)} />
                            ))}
                        </div>
                        <div className="flex w-full shrink-0 justify-end gap-[12px]">
                            {rowB.map((g, i) => (
                                <Spec key={g} k={g} v={spec(g)} w={i === 2 ? 365 : undefined} />
                            ))}
                        </div>
                    </div>
                    <div className={`${card} gap-[7px] p-[16px]`}>
                        <div className="flex w-full shrink-0 justify-between">
                            <div className="text-left text-[11px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{(t.files?.length ?? 0) === 2 ? 'ملفان' : `${arDigits(t.files?.length ?? 0)} ملفات`}</div>
                            <div className={sec}>ملفات العميل</div>
                        </div>
                        {(t.files ?? []).map((f) => (
                            <div key={f.name} className="flex h-[33.5px] w-full shrink-0 items-center justify-between gap-[10px] [border-bottom:1px_solid_var(--border)]">
                                <div className="flex w-fit shrink-0 gap-[16px]">
                                    <div className="text-left text-[11px] leading-[normal] font-[700] text-[var(--primary)]">تنزيل</div>
                                    <div className="text-left text-[11px] leading-[normal] font-[700] text-[var(--primary)]">معاينة</div>
                                </div>
                                <div className="flex w-fit shrink-0 gap-[14px]">
                                    <div className="text-left text-[11px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">{f.kind} • {f.size}</div>
                                    <div className="text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]">{f.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex w-full shrink-0 flex-col items-end gap-[3px] rounded-[9px] bg-[var(--surface)] p-[10px_16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                        <div className="text-left text-[14px] leading-[normal] font-[700] text-[var(--ink)]">ملاحظات العميل</div>
                        <div className="text-left text-[12px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{t.notes || 'لا توجد ملاحظات إضافية.'}</div>
                    </div>
                    {t.state === 'IN_DESIGN' && (
                        <div className="flex w-full shrink-0 justify-end gap-[22px] rounded-[9px] bg-[#EFF6FF] p-[10px_16px]">
                            <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">آخر تحديث: {formatDateTimeShort(t.updated_at)}</div>
                            <div className="text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]">حالة المهمة: {label}</div>
                            <div className="text-left text-[14px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">حالة التصميم</div>
                        </div>
                    )}
                </>
            )}

            {view === 'revision' && (
                <>
                    {t.customer_note && (
                        <div className={`${card} items-end gap-[8px] p-[16px]`}>
                            <div className="flex w-full shrink-0 justify-between">
                                <div className="text-left text-[11px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{formatDateTimeShort(t.customer_note.at)}</div>
                                <div className={sec}>ملاحظات العميل</div>
                            </div>
                            <div className="text-left text-[13px] leading-[normal] font-[400] text-[var(--ink)]">{t.customer_note.text}</div>
                            <Link href={`/designer/tasks/${t.id}?tab=chat`} className={link12}>
                                عرض المحادثة ←
                            </Link>
                        </div>
                    )}
                    {t.last_version && (
                        <div className={`${card} items-end gap-[8px] p-[16px]`}>
                            <div className="flex w-full shrink-0 items-center justify-between">
                                <div className="flex w-fit shrink-0 gap-[14px]">
                                    <Link href={`/designer/tasks/${t.id}?tab=versions`} className={link12}>
                                        عرض سجل النسخ
                                    </Link>
                                    <Link href={`/designer/tasks/${t.id}?tab=versions`} className={link12}>
                                        معاينة النسخة
                                    </Link>
                                </div>
                                <div className={sec}>آخر نسخة مرسلة • النسخة {t.last_version.label}</div>
                            </div>
                            <div className="flex w-fit shrink-0 items-center justify-end gap-[10px]">
                                <div className="text-left text-[11px] leading-[normal] font-[400] whitespace-pre text-[var(--muted-foreground)]">{`أُرسلت ${formatDateTimeShort(t.last_version.sent_at)}  •  ${t.last_version.faces}`}</div>
                                <div className="flex h-[25px] w-fit shrink-0 items-center rounded-[13px] bg-[#FEF2F2] p-[0px_9px]">
                                    <div className="text-left text-[11px] leading-[normal] font-[700] text-[#B42318]">تم طلب تعديل</div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className={`${card} items-end gap-[8px] p-[16px]`}>
                        <div className={sec}>مواصفات البند • للقراءة فقط</div>
                        <div className="flex w-full shrink-0 justify-end gap-[18px]">
                            {[...rowB, ...rowA].map((g) => (
                                <div key={g} className="text-left text-[11px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">
                                    {g}: {values[g] ?? spec(g)}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {view === 'versions' && (
                <div className={`${card} items-end gap-[10px] p-[18px]`}>
                    {versions.map((v) => {
                        const cur = v.status === 'SUBMITTED' || v.status === 'DRAFT';
                        return (
                            <div key={v.id} className="flex w-full shrink-0 flex-col items-end gap-[12px] p-[14px_0px] [border-bottom:1px_solid_var(--border)]" style={{ height: 165.5 }}>
                                <div className="flex w-full shrink-0 items-center justify-between">
                                    <div className="flex w-fit shrink-0 items-center gap-[8px]">
                                        <Link href={`/designer/versions/${v.id}`} className={`${btn38} ${cur ? 'bg-[var(--primary)] text-white [outline:1px_solid_var(--primary)]' : 'bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]'}`}>
                                            معاينة النسخة
                                        </Link>
                                        {v.status !== 'SUPERSEDED' && v.status !== 'APPROVED' && (
                                            <Link href={`/designer/versions/${v.id}`} className={`${btn38} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`}>
                                                تعديل ملفات النسخة
                                            </Link>
                                        )}
                                    </div>
                                    <div className="flex w-fit shrink-0 items-center gap-[9px]">
                                        <div className="flex h-[25px] w-fit shrink-0 items-center rounded-[13px] p-[0px_9px]" style={{ background: cur ? '#FFF4DD' : '#F1F5F9' }}>
                                            <div className="text-left text-[11px] leading-[normal] font-[700] whitespace-nowrap" style={{ color: cur ? '#925B10' : '#64748B' }}>
                                                {v.status_label ?? (v.status === 'SUBMITTED' ? 'بانتظار اعتماد العميل' : v.status === 'APPROVED' ? 'معتمدة' : v.status === 'DRAFT' ? 'قيد التجهيز' : 'نسخة سابقة')}
                                            </div>
                                        </div>
                                        <div className="text-left text-[15px] leading-[normal] font-[700] whitespace-pre text-[var(--ink)]">{`النسخة ${v.label ?? ORD[v.no]}  •  النسخة ${arDigits(v.no)}`}</div>
                                    </div>
                                </div>
                                <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-pre text-[var(--muted-foreground)]">
                                    {`أُرسلت: ${v.submitted_at ? formatDateTimeShort(v.submitted_at) : '—'}  •  ${v.files.length === 2 ? 'ملفان' : `${arDigits(v.files.length)} ملفات`}`}
                                </div>
                                <div className="flex w-full shrink-0 justify-end gap-[10px]">
                                    {[...v.files].reverse().map((f) => (
                                        <div key={f.id} className="flex h-[54px] w-[170px] shrink-0 items-center gap-[8px] rounded-[7px] bg-[var(--background)] p-[8px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                                            <div className="flex-1 text-left text-[11px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]">{f.name}</div>
                                            <Icon name="image" className="h-[22px] w-[22px] shrink-0" color="var(--primary)" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {tab === 'chat' && <ChatPanel url={`/chat/items/${t.id}`} mine={['staff']} itemId={t.id} fileUrl={(id) => `/files/${id}/preview`} />}
            {(tab === 'files' || tab === 'activity') && <ReactPlaceholder tab={tab} />}
        </DesignerLayout>
    );
}

function ReactPlaceholder({ tab }: { tab: Tab }): ReactNode {
    return (
        <div className={`${card} items-center p-[32px] text-[14px] text-[var(--muted-foreground)]`}>
            {tab === 'files' ? 'ملفات العميل تظهر هنا.' : 'سجل النشاط يظهر هنا.'}
        </div>
    );
}
