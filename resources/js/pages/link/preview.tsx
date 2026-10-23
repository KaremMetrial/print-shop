import { iso, mBtnPrimary } from '@/components/shell/customer-mobile';
import { useIsMobile } from '@/hooks/use-mobile';
import { idemHeaders } from '@/lib/idempotency';
import { LinkLayout } from '@/components/shell/link-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { ChatPanel } from '@/components/chat/chat-panel';
import { Head, Link, router } from '@inertiajs/react';
import {useState} from 'react';

interface Props {
    token: string;
    order: { number: string; customer: string };
    item: { id: number; name: string; quantity: number; state: string };
    version: { id: number; no: number; status: string; revision: number; sent_at: string | null; files: { id: number; name: string; mime: string }[] } | null;
    pen?: { seed: React.ComponentProps<typeof ChatPanel>['seed'] };
}
const ORD = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
const box = 'flex w-full shrink-0 flex-col items-end bg-[var(--surface)]';

/** S-087-01 — معاينة التصميم (عرض فقط، BR-022) واعتماد البند (BR-026). التبويبان المحادثة/المرفقات تُفعَّلان مع وحدة الشات. */
export default function LinkPreview({ token, order, item, version: v, pen }: Props) {
    const [cur, setCur] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [confirm, setConfirm] = useState(false);
    const [tab, setTab] = useState<'preview' | 'chat'>(() => (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'chat' ? 'chat' : 'preview'));
    const [failed, setFailed] = useState<Record<number, number>>({});
    const [full, setFull] = useState(false);
    const isMobile = useIsMobile();
    const approved = v?.status === 'APPROVED';
    const label = v ? `${approved ? 'معتمد' : 'بانتظار اعتماد العميل'} • النسخة ${ORD[v.no] ?? v.no}` : 'لا توجد نسخة بعد';
    const f = v?.files[cur];
    const broken = !f || (failed[f.id] ?? -1) >= 0;
    const canApprove = !!v && !approved && !broken;
    const iconBtn = 'flex h-[48px] flex-1 items-center justify-center rounded-[8px] bg-[#F8FAFC]';
    const goto = (n: number) => v && setCur((c) => Math.min(v.files.length - 1, Math.max(0, c + n)));
    const grayBtn = 'flex h-[48px] w-full items-center justify-center rounded-[10px] bg-[#E2E8F0] text-[15px] leading-[normal] font-[700] text-[#64748B]';
    const whiteBtn = 'flex h-[48px] w-full items-center justify-center rounded-[10px] bg-white text-[15px] leading-[normal] font-[700] text-[#2563EB]';
    const mobile =
        tab === 'chat' ? (
            <div dir="ltr" className="flex min-h-[calc(100vh-61.5px)] w-full flex-col items-end gap-[12px] p-[16px_16px_12px_16px] lg:hidden">
                <div className="w-full text-right text-[14px] leading-[normal] font-[700] text-[#2563EB]">{`${approved ? 'معتمد' : 'بانتظار اعتمادك'} · ${iso(order.number)}`}</div>
                <button type="button" onClick={() => setTab('preview')} className={whiteBtn}>
                    العودة إلى التصميم
                </button>
                <div className="flex w-full flex-1 flex-col items-end gap-[12px]">
                    {(isMobile === true || !!pen) && <ChatPanel variant="mobile" url={`/l/${token}/items/${item.id}/chat`} mine={['link']} fileUrl={(id) => `/l/${token}/files/${id}`} seed={pen?.seed} />}
                </div>
            </div>
        ) : (
            <div dir="ltr" className="flex min-h-[calc(100vh-61.5px)] w-full flex-col items-end lg:hidden">
                <div className="flex w-full flex-1 flex-col items-end gap-[8px] p-[12px_16px_0px_16px]">
                    <div className="w-full text-right text-[22px] leading-[normal] font-[700] text-[#0F172A]">{item.name}</div>
                    <div className="w-full text-right text-[14px] leading-[normal] font-[700] text-[#2563EB]">{v ? `النسخة ${ORD[v.no] ?? v.no} · ${approved ? 'معتمد' : 'بانتظار اعتمادك'}` : 'لا توجد نسخة بعد'}</div>
                    <div className="flex w-full flex-col items-end gap-[8px] rounded-[14px] bg-[#F6F8FC] [outline:1px_solid_#F6F8FC]">
                        <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#475569]">{v ? `الملف ${iso(cur + 1)} من ${iso(v.files.length)}` : ''}</div>
                        <div className="flex h-[350px] w-full flex-col items-center justify-center gap-[10px] overflow-hidden rounded-[10px] bg-[#EDF2F7] p-[20px]">
                            {broken ? (
                                <>
                                    <Icon name="file-image" className="h-[48px] w-[48px]" color="#94A3B8" />
                                    <div className="w-full text-center text-[14px] leading-[normal] font-[400] text-[#64748B]">{v ? 'تعذّر تحميل المعاينة.' : 'لا توجد معاينة متاحة بعد.'}</div>
                                    {v && f && (
                                        <button type="button" onClick={() => setFailed((x) => ({ ...x, [f.id]: -1 }))} className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-white text-[15px] leading-[normal] font-[600] text-[#2563EB]">
                                            إعادة المحاولة
                                        </button>
                                    )}
                                </>
                            ) : f.mime === 'application/pdf' ? (
                                <iframe title={f.name} src={`/l/${token}/files/${f.id}#toolbar=0`} className="h-full w-full" />
                            ) : (
                                <img key={`${f.id}-${failed[f.id]}`} src={`/l/${token}/files/${f.id}`} alt={f.name} draggable={false} onContextMenu={(e) => e.preventDefault()} onError={() => setFailed((x) => ({ ...x, [f.id]: 1 }))} style={{ transform: `scale(${zoom})` }} className="max-h-full max-w-full object-contain" />
                            )}
                        </div>
                        <div className="flex h-[50px] w-full gap-[4px]">
                            <button type="button" aria-label="الملف التالي" onClick={() => goto(1)} className={iconBtn}><Icon name="chevron-left" className="h-[20px] w-[20px]" color="#2563EB" /></button>
                            <button type="button" aria-label="عرض كامل" onClick={() => !broken && setFull(true)} className={iconBtn}><Icon name="maximize" className="h-[20px] w-[20px]" color="#2563EB" /></button>
                            <button type="button" aria-label="تكبير" onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className={iconBtn}><Icon name="plus" className="h-[20px] w-[20px]" color="#2563EB" /></button>
                            <button type="button" aria-label="تصغير" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className={iconBtn}><Icon name="minus" className="h-[20px] w-[20px]" color="#2563EB" /></button>
                            <button type="button" aria-label="ملاءمة العرض" onClick={() => setZoom(1)} className={iconBtn}><Icon name="scan" className="h-[20px] w-[20px]" color="#2563EB" /></button>
                            <button type="button" aria-label="الملف السابق" onClick={() => goto(-1)} className={iconBtn}><Icon name="chevron-right" className="h-[20px] w-[20px]" color="#2563EB" /></button>
                        </div>
                    </div>
                </div>
                <div className="sticky bottom-0 mt-[16px] flex w-full flex-col items-end gap-[8px] bg-white p-[12px_16px_24px_16px] [outline:1px_solid_#E2E8F0] [outline-offset:-0.5px]">
                    {v && !approved && (
                        <button type="button" disabled={!canApprove} onClick={() => setConfirm(true)} className={canApprove ? mBtnPrimary : grayBtn}>
                            اعتماد التصميم
                        </button>
                    )}
                    <button type="button" onClick={() => setTab('chat')} className={whiteBtn}>
                        مراسلة المصمم
                    </button>
                </div>
                {full && f && (
                    <div role="dialog" aria-modal onClick={() => setFull(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-[8px]">
                        <img src={`/l/${token}/files/${f.id}`} alt={f.name} draggable={false} onContextMenu={(e) => e.preventDefault()} className="max-h-full max-w-full object-contain" />
                    </div>
                )}
            </div>
        );
    return (
        <LinkLayout orderRef={order} backHref={`/l/${token}`}>
            <Head title="معاينة التصميم" />
            {mobile}
            <div className="hidden w-full flex-col items-end gap-[14px] p-[16px] lg:flex lg:p-[24px_48px]">
                <div className="text-left text-[11px] leading-[normal] font-[400] whitespace-pre text-[var(--muted-foreground)]">{`تفاصيل الأوردر ‹ ${item.name} ‹ معاينة التصميم`}</div>
                <div className="flex w-full shrink-0 items-start justify-between">
                    <Link href={`/l/${token}`} className="flex h-[40px] w-fit items-center rounded-[8px] bg-[var(--surface)] p-[0px_13px] text-left text-[12px] leading-[normal] font-[700] text-[var(--primary)]">
                        العودة إلى الأوردر
                    </Link>
                    <div className="flex w-fit shrink-0 flex-col items-end gap-[4px]">
                        <h1 className="text-left text-[24px] leading-[normal] font-[700] text-[var(--ink)]">معاينة التصميم</h1>
                        <div className="text-left text-[13px] leading-[normal] whitespace-pre text-[#475569]">{`${item.name} • الكمية ⁦${item.quantity}⁩ • ⁦${order.number}⁩`}</div>
                        <div className="flex w-fit items-center rounded-[13px] bg-[#FFF4DD] p-[3px_9px]">
                            <div className="text-left text-[11px] leading-[normal] font-[700] whitespace-nowrap text-[#925B10]">{label}</div>
                        </div>
                    </div>
                </div>
                <div className="flex h-[47.5px] w-full shrink-0 rounded-[8px] bg-[var(--surface)] [border-bottom:1px_solid_var(--border)]">
                    {[['المرفقات', false, null], ['المحادثة', tab === 'chat', 'chat'], ['معاينة التصميم', tab === 'preview', 'preview']].map(([l, on, k]) => (
                        <div key={l as string} onClick={() => k && setTab(k as 'chat' | 'preview')} className="flex flex-1 items-center justify-center cursor-pointer text-left text-[13px] leading-[normal]" style={{ color: on ? '#2563EB' : '#475569', fontWeight: on ? 700 : 600, borderBottom: on ? '3px solid #2563EB' : undefined }}>
                            {l as string}
                        </div>
                    ))}
                </div>
                {tab === 'chat' && isMobile === false && !pen && <ChatPanel url={`/l/${token}/items/${item.id}/chat`} mine={['link']} fileUrl={(id) => `/l/${token}/files/${id}`} />}
                <div className={`flex w-full shrink-0 flex-col items-stretch gap-[18px] lg:flex-row lg:items-start ${tab === 'chat' ? 'hidden' : ''}`}>
                    <div className="flex w-full shrink-0 lg:w-[350px] flex-col items-end gap-[12px]">
                        <div className={`${box} gap-[12px] rounded-[9px] p-[18px]`}>
                            <div className="text-left text-[15px] leading-[normal] font-[700] text-[var(--ink)]">معلومات النسخة</div>
                            {v &&
                                [['النسخة', `النسخة ${ORD[v.no] ?? v.no}`], ['الحالة', approved ? 'معتمد' : 'بانتظار اعتماد العميل'], ['عدد الملفات', `⁦${v.files.length}⁩ ملفات`], ['تاريخ الإرسال', v.sent_at ? `${formatDate(v.sent_at)}، ${formatTime(v.sent_at)}` : '—']].map(([k, val]) => (
                                    <div key={k} className="flex w-full justify-between">
                                        <div className="text-left text-[12px] leading-[normal] font-[700] text-[var(--ink)]">{val}</div>
                                        <div className="text-left text-[12px] leading-[normal] text-[var(--muted-foreground)]">{k}</div>
                                    </div>
                                ))}
                        </div>
                        {v && !approved && (
                            <div className="flex w-full flex-col items-end gap-[8px]">
                                <button type="button" onClick={() => setConfirm(true)} className="flex h-[38px] w-fit items-center rounded-[8px] bg-[var(--primary)] p-[0px_13px] text-left text-[12px] leading-[normal] font-[700] text-white">
                                    اعتماد التصميم
                                </button>
                                <div className="flex h-[38px] w-fit items-center rounded-[8px] bg-[var(--surface)] p-[0px_13px] text-left text-[12px] leading-[normal] font-[700] text-[var(--primary)]">مراسلة المصمم</div>
                            </div>
                        )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-end gap-[10px]">
                        <div className={`${box} gap-[10px] rounded-[10px] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]`}>
                            <div className="flex h-[36px] w-full shrink-0 items-center justify-between">
                                <div className="flex gap-[8px]">
                                    {[['تكبير +', () => setZoom((z) => Math.min(3, z + 0.25))], ['ملاءمة', () => setZoom(1)], ['تصغير −', () => setZoom((z) => Math.max(0.5, z - 0.25))]].map(([l, fn]) => (
                                        <button key={l as string} type="button" onClick={fn as () => void} className="flex h-[30px] items-center rounded-[6px] bg-[var(--background)] p-[0px_8px] text-left text-[11px] leading-[normal] font-[600] text-[var(--ink)]">
                                            {l as string}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-[10px]">
                                    <div className="text-left text-[12px] leading-[normal] font-[700] whitespace-pre text-[var(--muted-foreground)]">{v ? `الملف ⁦${cur + 1}⁩ من ⁦${v.files.length}⁩ • صفحات PDF حسب الملف` : ''}</div>
                                    <div className="text-left text-[13px] leading-[normal] font-[700] text-[var(--ink)]">{v ? `النسخة ${ORD[v.no] ?? v.no}` : ''}</div>
                                </div>
                            </div>
                            <div className="flex h-[395px] w-full shrink-0 items-center justify-center overflow-auto rounded-[8px] bg-[#E7EDF5]">
                                {f ? (
                                    f.mime === 'application/pdf' ? (
                                        <iframe title={f.name} src={`/l/${token}/files/${f.id}#toolbar=0`} className="h-full w-full" style={{ transform: `scale(${zoom})` }} />
                                    ) : (
                                        <img src={`/l/${token}/files/${f.id}`} alt={f.name} draggable={false} onContextMenu={(e) => e.preventDefault()} className="max-h-full max-w-full object-contain" style={{ transform: `scale(${zoom})` }} />
                                    )
                                ) : (
                                    <div className="flex flex-col items-center gap-[10px]">
                                        <Icon name="file-image" className="h-[34px] w-[34px]" color="var(--muted-foreground)" />
                                        <div className="text-[13px] text-[var(--muted-foreground)]">لا توجد معاينة متاحة بعد.</div>
                                    </div>
                                )}
                            </div>
                            <div className="flex h-[95px] w-full shrink-0 justify-end gap-[10px]">
                                {(v?.files ?? []).map((x, i) => (
                                    <button key={x.id} type="button" onClick={() => setCur(i)} className="flex h-full w-[120px] flex-col items-center justify-center rounded-[7px] bg-[var(--background)]" style={{ outline: i === cur ? '2px solid #2563EB' : undefined }}>
                                        <Icon name="files" className="h-[20px] w-[20px]" color="var(--muted-foreground)" />
                                        <div className="text-left text-[10px] leading-[normal] text-[var(--muted-foreground)]">{`ملف ⁦${i + 1}⁩`}</div>
                                    </button>
                                ))}
                            </div>
                            <div className="text-left text-[12px] leading-[normal] text-[var(--muted-foreground)]">معاينة رسمية للعرض فقط</div>
                        </div>
                    </div>
                </div>
            </div>
            {confirm && v && (
                <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]">
                    <div dir="rtl" className="flex w-[440px] max-w-full flex-col gap-[14px] rounded-[12px] bg-[var(--surface)] p-[24px]">
                        <div className="text-[16px] leading-[26px] font-[700] text-[var(--ink)]">اعتماد التصميم</div>
                        <div className="text-[13px] leading-[21px] text-[var(--muted-foreground)]">بعد الاعتماد لا يمكنك التراجع بنفسك. تأكد من مراجعة كل الملفات قبل المتابعة.</div>
                        <div className="flex justify-end gap-[12px]">
                            <button type="button" onClick={() => setConfirm(false)} className="flex h-[40px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_16px] text-[14px] [outline:1px_solid_var(--border)]">
                                رجوع
                            </button>
                            <button type="button" onClick={() => router.post(`/l/${token}/items/${item.id}/approve`, { version_id: v.id, revision: v.revision } as never, { headers: idemHeaders(), onFinish: () => setConfirm(false) })} className="flex h-[40px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_16px] text-[14px] font-[600] text-white">
                                تأكيد الاعتماد
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </LinkLayout>
    );
}
