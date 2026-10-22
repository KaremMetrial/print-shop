import { idemHeaders } from '@/lib/idempotency';
import { DesignerLayout } from '@/components/shell/designer-layout';
import { arDigits, formatDateTimeShort } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { Head, Link, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

interface FileRow {
    id: number;
    name: string;
    label?: string;
    type: string;
    size: number | string;
}
interface Props {
    designer: { name: string };
    mode?: 'first' | 'edit' | 'revision';
    task: { id: number; code: string; order_number: string; product: string; customer: string; designer?: string; state: string };
    version: { id: number; no: number; status: string; notes: string | null; files: FileRow[] };
    previous: { id: number; no: number } | null;
    revision_note: { note: string | null; created_at: string } | null;
    customer_note?: { text: string; at: string } | null;
}

const ORD = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة'];
const xsrf = () => decodeURIComponent(document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? '');
const sizeLabel = (s: number | string) => (typeof s === 'string' ? s : `${arDigits((s / 1048576).toFixed(1)).replace('.', '٫')} م.ب`);
const kind = (t: string) => (t.includes('pdf') ? 'PDF' : t.replace('image/', '').toUpperCase());
const card = 'flex w-full shrink-0 flex-col items-end rounded-[10px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const btnB = (h: number, px: number) => `flex w-fit shrink-0 items-center justify-center rounded-[8px] p-[0px_${px}px] text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap [outline-offset:-0.5px] disabled:opacity-60`;

/** S-045-01..03 — إضافة/تعديل نسخة تصميم (pendev: RhbvE · Qe2iZ · q72jlD). */
export default function DesignerVersion({ designer, task: t, version: v, previous, revision_note, customer_note, mode }: Props) {
    const m: 'first' | 'edit' | 'revision' = mode ?? (v.status === 'SUBMITTED' ? 'edit' : v.no === 1 ? 'first' : 'revision');
    const [files, setFiles] = useState<FileRow[]>(v.files);
    const [notes, setNotes] = useState(v.notes ?? '');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const input = useRef<HTMLInputElement>(null);
    const ordLabel = ORD[v.no] ?? arDigits(v.no);
    const title = m === 'first' ? 'إضافة نسخة تصميم' : m === 'edit' ? `تعديل ملفات النسخة ${ordLabel}` : 'إعداد نسخة جديدة';
    const note = customer_note ?? (revision_note?.note ? { text: revision_note.note, at: revision_note.created_at } : null);

    const upload = async (list: FileList | null) => {
        if (!list) return;
        setErr(null);
        for (const f of Array.from(list)) {
            const fd = new FormData();
            fd.append('file', f);
            fd.append('category', 'design_preview');
            const r = await fetch('/files', { method: 'POST', body: fd, headers: { Accept: 'application/json', 'X-XSRF-TOKEN': xsrf() } });
            const j = await r.json();
            if (!r.ok) return setErr(j.error?.message ?? j.message ?? 'تعذر رفع الملف.');
            setFiles((x) => [...x, { id: j.data.id, name: j.data.original_filename, type: j.data.mime_type, size: j.data.size_bytes }]);
        }
    };
    const save = (submit: boolean) => {
        setBusy(true);
        router.put(`/designer/versions/${v.id}`, { file_ids: files.map((f) => f.id), notes, submit } as never, { headers: idemHeaders(), onFinish: () => setBusy(false), onError: (e) => setErr(Object.values(e)[0] as string) });
    };
    const compact = m === 'revision';
    const rowH = compact ? 58 : 70;

    return (
        <DesignerLayout name={designer.name} gap={m === 'first' ? 14 : m === 'edit' ? 14 : 12} sidebar={m === 'revision' ? 224 : 264}>
            <Head title={title} />
            <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">
                <Link href="/designer/tasks">مهامي</Link> {'>'} <Link href={`/designer/tasks/${t.id}`}>تفاصيل المهمة</Link> {'>'} {m === 'first' ? 'إضافة نسخة تصميم' : m === 'edit' ? 'تعديل ملفات النسخة' : 'إعداد نسخة جديدة'}
            </div>
            <div className="flex w-full shrink-0 items-center justify-between">
                <Link href={`/designer/tasks/${t.id}`} className={`${btnB(38, 15)} h-[38px] bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`} style={m === 'revision' ? { height: 36 } : undefined}>
                    العودة للمهمة
                </Link>
                <div className="flex w-fit shrink-0 flex-col items-end gap-[1px]">
                    <h1 className="text-left text-[24px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">{title}</h1>
                    <div className="text-left text-[13px] leading-[normal] font-[400] whitespace-pre text-[var(--muted-foreground)]">{`${t.product}  •  ${t.code}`}</div>
                </div>
            </div>
            <div className="flex w-full shrink-0 items-center justify-end rounded-[9px] bg-[var(--surface)] p-[0px_15px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]" style={{ height: compact ? 52 : 56, gap: compact ? 15 : 16 }}>
                {[
                    [`المصمم ${t.designer ?? designer.name}`, 0],
                    [`العميل ${t.customer}`, 0],
                    [`البند ${t.code}`, 0],
                    [`الأوردر ${t.order_number}`, 0],
                ].map(([x]) => (
                    <div key={x as string} className="text-left text-[11px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">{x}</div>
                ))}
                <div className="flex w-fit shrink-0 items-center rounded-[14px] p-[0px_9px]" style={{ height: compact ? 26 : 27, background: m === 'revision' ? '#FEF2F2' : m === 'edit' ? '#FFF4DD' : '#FFF7E9' }}>
                    <div className="text-left text-[11px] leading-[normal] font-[700] whitespace-nowrap" style={{ color: m === 'revision' ? '#B42318' : '#925B10' }}>{m === 'revision' ? 'مطلوب تعديل' : m === 'edit' ? 'بانتظار اعتماد العميل' : 'قيد التنفيذ'}</div>
                </div>
            </div>
            <div className={`${card} gap-[8px] p-[14px]`}>
                <div className="flex w-full shrink-0 items-center justify-between">
                    <div className="flex h-[26px] w-fit shrink-0 items-center rounded-[13px] p-[0px_9px]" style={{ background: m === 'edit' ? '#FFF4DD' : '#EFF6FF' }}>
                        <div className="text-left text-[11px] leading-[normal] font-[700] whitespace-nowrap" style={{ color: m === 'edit' ? '#925B10' : '#2563EB' }}>{m === 'edit' ? 'بانتظار اعتماد العميل' : m === 'revision' ? `النسخة ${arDigits(v.no)} • قيد التجهيز` : 'قيد التجهيز'}</div>
                    </div>
                    <div className="text-left text-[16px] leading-[normal] font-[700] whitespace-pre text-[var(--ink)]">{m === 'first' ? `إضافة النسخة الأولى  •  النسخة ${arDigits(v.no)}` : m === 'edit' ? `تعديل ملفات النسخة ${ordLabel}  •  النسخة ${arDigits(v.no)}` : `إعداد النسخة ${ordLabel}`}</div>
                </div>
                <div className="text-left text-[12px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{m === 'first' ? 'أضف معاينة الفلاير كاملة بوجهيها قبل إرسالها للعميل للمراجعة.' : m === 'edit' ? 'يمكنك تعديل ملفات النسخة ما دامت غير معتمدة.' : 'أضف الوجهين كاملين، حتى إن تغيّر أحدهما فقط.'}</div>
            </div>

            {m === 'revision' && note && (
                <div className={`${card} gap-[8px] p-[14px]`}>
                    <div className="flex w-full shrink-0 justify-between">
                        <div className="text-left text-[11px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{formatDateTimeShort(note.at)}</div>
                        <div className="text-left text-[15px] leading-[normal] font-[700] text-[var(--ink)]">ملاحظات العميل</div>
                    </div>
                    <div className="text-left text-[13px] leading-[normal] font-[400] text-[var(--ink)]">{note.text}</div>
                    <Link href={`/designer/tasks/${t.id}?tab=chat`} className="text-left text-[11px] leading-[normal] font-[700] text-[var(--primary)]">
                        عرض المحادثة ←
                    </Link>
                </div>
            )}
            {m === 'revision' && previous && (
                <div className="flex w-full shrink-0 items-center justify-between rounded-[8px] bg-[#F0F6FF] p-[12px_14px]">
                    <Link href={`/designer/tasks/${t.id}?tab=versions`} className="text-left text-[12px] leading-[normal] font-[700] text-[var(--primary)]">
                        معاينة النسخة السابقة ←
                    </Link>
                    <div className="text-left text-[13px] leading-[normal] font-[700] whitespace-pre text-[var(--ink)]">{`النسخة السابقة  •  النسخة ${arDigits(previous.no)}`}</div>
                </div>
            )}

            <div className={`${card} p-[${compact ? 14 : 16}px]`} style={{ gap: compact ? 8 : 10, padding: compact ? 14 : 16, borderRadius: compact ? 9 : 10 }}>
                <div className="flex w-full shrink-0 items-center justify-between">
                    {m === 'first' ? (
                        <button type="button" onClick={() => input.current?.click()} className={`${btnB(38, 15)} h-[38px] bg-[var(--primary)] text-white [outline:1px_solid_var(--primary)]`}>
                            إضافة ملفات
                        </button>
                    ) : (
                        <button type="button" onClick={() => input.current?.click()} className={`${btnB(38, 15)} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`} style={{ height: compact ? 36 : 38 }}>
                            إضافة ملف
                        </button>
                    )}
                    <div className="text-left text-[16px] leading-[normal] font-[700] whitespace-pre text-[var(--ink)]" style={{ fontSize: compact ? 15 : 16 }}>
                        {m === 'first' ? 'ملفات التصميم' : m === 'edit' ? `ملفات النسخة  •  النسخة ${arDigits(v.no)}` : 'ملفات النسخة الجديدة  •  وجهان مطلوبان'}
                    </div>
                </div>
                <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={(e) => upload(e.target.files)} />
                {m === 'first' && (
                    <button type="button" onClick={() => input.current?.click()} className="flex h-[94px] w-full shrink-0 flex-col items-center justify-center gap-[2px] rounded-[8px] bg-[var(--background)] [outline:1px_solid_#AFC9F7] [outline-offset:-0.5px]">
                        <Icon name="cloud-upload" className="h-[22px] w-[22px]" color="var(--primary)" />
                        <div className="text-left text-[12px] leading-[normal] font-[400] text-[var(--muted-foreground)]">اسحب الصور أو ملفات PDF هنا، أو اخترها من جهازك.</div>
                    </button>
                )}
                {err && <div className="w-full text-right text-[12px] text-[var(--danger-text)]">{err}</div>}
                {files.map((f) => (
                    <div key={f.id} className="flex w-full shrink-0 items-center justify-between gap-[12px] bg-[var(--background)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]" style={{ height: rowH, borderRadius: compact ? 7 : 8, padding: compact ? '0px 10px' : '0px 12px' }}>
                        <div className="flex w-fit shrink-0 gap-[8px]" style={{ gap: compact ? 12 : 8 }}>
                            <a href={`/files/${f.id}/preview`} target="_blank" className="text-left text-[11px] leading-[normal] font-[700] text-[var(--primary)]">معاينة</a>
                            <button type="button" onClick={() => input.current?.click()} className="text-left text-[11px] leading-[normal] font-[700] text-[var(--primary)]">استبدال</button>
                            <button type="button" onClick={() => setFiles((x) => x.filter((y) => y.id !== f.id))} className="text-left text-[11px] leading-[normal] font-[700] text-[#DC2626]">حذف</button>
                        </div>
                        <div className="flex w-fit shrink-0 flex-col items-end">
                            <div className="text-left text-[12px] leading-[normal] font-[700] whitespace-pre text-[var(--ink)]">{f.label ? `${f.label}  •  ${f.name}` : f.name}</div>
                            <div className="text-left text-[11px] leading-[normal] font-[400] whitespace-pre text-[var(--muted-foreground)]">{`${kind(f.type)}  •  ${sizeLabel(f.size)}  •  مرفوع`}</div>
                        </div>
                        <div className="flex shrink-0 items-center justify-center rounded-[6px] bg-[#EAF2FF]" style={{ height: compact ? 42 : 50, width: compact ? 43 : 52 }}>
                            <Icon name={f.type.includes('pdf') ? 'file-text' : 'image'} className="h-[23px] w-[23px]" color="var(--primary)" />
                        </div>
                    </div>
                ))}
                {m === 'first' && files.length > 0 && <div className="text-left text-[11px] leading-[normal] font-[400] whitespace-pre text-[var(--primary)]">الصفحة ١: الوجه الأمامي  •  الصفحة ٢: الوجه الخلفي ‹ ›</div>}
            </div>

            {m === 'edit' ? (
                <div className="flex w-full shrink-0 items-center justify-end rounded-[8px] bg-[#EFF6FF] p-[10px_14px]">
                    <div className="text-left text-[12px] leading-[normal] font-[400] text-[var(--primary)]">يجب الإبقاء على الوجه الأمامي والخلفي قبل حفظ أي تغيير. تُسجّل تعديلات الملفات في نشاط البند.</div>
                </div>
            ) : (
                <div className={`${card} p-[${compact ? 14 : 16}px]`} style={{ gap: compact ? 8 : 10, padding: compact ? 14 : 16, borderRadius: compact ? 9 : 10 }}>
                    <div className="text-left text-[14px] leading-[normal] font-[700] whitespace-pre text-[var(--ink)]" style={{ fontSize: compact ? 13 : 14 }}>ملاحظات النسخة  •  اختياري</div>
                    {compact ? (
                        <input dir="rtl" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-[46px] w-full rounded-[10px] bg-[var(--background)] p-[0px_14px] text-right text-[14px] leading-[normal] text-[var(--ink)] outline-hidden [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px]" />
                    ) : (
                        <textarea dir="rtl" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أضف ملاحظات توضيحية عن التصميم إن وجدت" className="h-[100px] w-full resize-none rounded-[10px] bg-[var(--background)] p-[14px] text-right text-[14px] leading-[normal] text-[var(--ink)] outline-hidden [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] placeholder:text-[var(--muted-foreground)]" />
                    )}
                </div>
            )}
            <div className="flex w-full shrink-0 justify-end gap-[8px]">
                {m === 'edit' ? (
                    <>
                        <button type="button" disabled={busy} onClick={() => save(false)} className={`${btnB(38, 15)} h-[38px] bg-[var(--primary)] text-white [outline:1px_solid_var(--primary)]`}>
                            حفظ التغييرات
                        </button>
                        <Link href={`/designer/tasks/${t.id}?tab=versions`} className={`${btnB(38, 15)} h-[38px] bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`}>
                            العودة إلى نسخ التصميم
                        </Link>
                    </>
                ) : (
                    <>
                        <button type="button" disabled={busy || files.length === 0} onClick={() => save(true)} className={`${btnB(38, compact ? 14 : 15)} bg-[var(--primary)] text-white [outline:1px_solid_var(--primary)]`} style={{ height: compact ? 36 : 38 }}>
                            إرسال للمراجعة
                        </button>
                        <button type="button" disabled={busy} onClick={() => save(false)} className={`${btnB(38, compact ? 14 : 15)} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`} style={{ height: compact ? 36 : 38 }}>
                            حفظ التغييرات
                        </button>
                        <Link href={`/designer/tasks/${t.id}`} className={`${btnB(38, compact ? 14 : 15)} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`} style={{ height: compact ? 36 : 38 }}>
                            إلغاء
                        </Link>
                    </>
                )}
            </div>
        </DesignerLayout>
    );
}
