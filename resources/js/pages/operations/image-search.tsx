import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

interface Result {
    file_id: number;
    similarity: number;
    order: string;
    order_id: number;
    item_id: number;
    customer: string;
    product: string;
    status: string;
    preview: boolean;
}
interface Props {
    mode: 'form' | 'results' | 'compare';
    token?: string | null;
    archived?: boolean;
    failed?: boolean;
    results?: Result[];
    candidate?: { file_id: number; available: boolean; order: string; order_id: number; item_id: number; customer: string; product: string } | null;
    errors?: Record<string, string>;
}
const card =
    'flex w-full shrink-0 flex-col gap-[20px] rounded-[14px] bg-[var(--surface)] p-[24px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const sec =
    'flex h-[44px] items-center rounded-[9px] bg-[var(--surface)] p-[0px_16px] text-[14px] text-[var(--primary)] [outline:1px_solid_var(--control-border)]';

function Heading({ title }: { title: string }) {
    return (
        <div className="flex w-full items-center gap-[16px]">
            <Link href="/search" className={sec}>
                البحث النصي
            </Link>
            <h1 className="flex-1 text-right text-[28px] leading-[normal] text-[var(--ink)]">{title}</h1>
        </div>
    );
}

/** التقاط صورة بالكاميرا (getUserMedia). يتطلب https أو localhost؛ وإلا تظهر رسالة «الكاميرا غير متاحة» ويبقى الرفع. */
function CameraCapture({ onCapture, onClose }: { onCapture: (f: File) => void; onClose: () => void }) {
    const video = useRef<HTMLVideoElement>(null);
    const stream = useRef<MediaStream | null>(null);
    const [err, setErr] = useState('');
    const [ready, setReady] = useState(false);
    useEffect(() => {
        let dead = false;
        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
            .then((st) => {
                if (dead) return st.getTracks().forEach((t) => t.stop());
                stream.current = st;
                if (video.current) {
                    video.current.srcObject = st;
                    void video.current.play().then(() => setReady(true));
                }
            })
            .catch((e: DOMException) =>
                setErr(
                    e.name === 'NotAllowedError'
                        ? 'تم رفض إذن الكاميرا. اسمح بالوصول من إعدادات المتصفح أو ارفع صورة.'
                        : 'تعذر تشغيل الكاميرا على هذا الجهاز. يمكنك رفع صورة.',
                ),
            );
        return () => {
            dead = true;
            stream.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);
    const snap = () => {
        const v = video.current;
        if (!v || !v.videoWidth) return;
        const c = document.createElement('canvas');
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        c.getContext('2d')?.drawImage(v, 0, 0);
        c.toBlob((b) => b && onCapture(new File([b], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })), 'image/jpeg', 0.9);
    };
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[560px] max-w-[95vw] gap-[14px] rounded-[12px] p-[20px]" dir="ltr">
                <DialogTitle className="w-full text-right text-[20px] font-[700] text-[var(--ink)]">التقاط صورة</DialogTitle>
                <DialogDescription className="w-full text-right text-[13px] text-[var(--muted-foreground)]">
                    وجّه الكاميرا نحو الشغل المطبوع بحيث يظهر التصميم كاملًا ثم اضغط التقاط.
                </DialogDescription>
                {err ? (
                    <div role="alert" className="w-full rounded-[10px] bg-[var(--background)] p-[24px] text-center text-[14px] text-[#B91C1C]">
                        {err}
                    </div>
                ) : (
                    <video
                        ref={video}
                        playsInline
                        muted
                        aria-label="معاينة الكاميرا"
                        className="max-h-[360px] w-full rounded-[10px] bg-black object-contain"
                    />
                )}
                <div className="flex w-full justify-end gap-[12px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-[40px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_14px] text-[13px] font-[600] text-[var(--ink)] [outline:1px_solid_var(--border)]"
                    >
                        إلغاء
                    </button>
                    <button
                        type="button"
                        disabled={!ready || !!err}
                        onClick={snap}
                        className="flex h-[40px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_14px] text-[13px] font-[600] text-white disabled:opacity-60"
                    >
                        التقاط
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/** S-063-01/02 · S-064 — البحث بالصورة. pendev: BZd0X / TZEtn / F18pg. الصورة تُستخدم مؤقتًا ولا تُضاف لأوردر أو عميل. */
export default function ImageSearch(p: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [archived, setArchived] = useState(false);
    const [busy, setBusy] = useState(false);
    const [drag, setDrag] = useState(false);
    const [cam, setCam] = useState(false);
    const camOk = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && (window.isSecureContext ?? false);
    const [preview, setPreview] = useState<string | null>(null);
    useEffect(() => {
        if (!file) return setPreview(null);
        const u = URL.createObjectURL(file);
        setPreview(u);
        return () => URL.revokeObjectURL(u);
    }, [file]);
    const input = useRef<HTMLInputElement>(null);
    const shot = useRef<HTMLInputElement>(null); // احتياطي للهواتف عندما لا يتوفر getUserMedia (مثلًا http): يفتح كاميرا الجهاز مباشرة
    const err = p.errors?.image;
    const run = (f: File | null = file, a = archived) => {
        if (!f) return;
        setBusy(true);
        router.post('/search/image', { image: f, archived: a } as never, { forceFormData: true, onFinish: () => setBusy(false) });
    };
    const pick = (f: File | null | undefined) => f && setFile(f);

    if (p.mode === 'compare') {
        const c = p.candidate;
        return (
            <AppLayout active="/search">
                <Head title="مقارنة الصور" />
                <div className="flex w-full flex-col gap-[20px]">
                    <Heading title="مقارنة الصور" />
                    {!c || !c.available ? (
                        <div className={`${card} items-center text-center`}>
                            <div className="text-[18px] font-[700] text-[var(--ink)]">تعذر تحميل بيانات المرشح.</div>
                            <div className="text-[14px] text-[var(--muted-foreground)]">أعد فتح النتيجة للتحقق من إتاحتها وصلاحية الوصول.</div>
                            <Link href="/search/image" className={sec}>
                                العودة إلى النتائج
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="flex w-full gap-[16px]">
                                <div className={`${card} flex-1 items-center`}>
                                    <div className="text-[16px] font-[700] text-[var(--ink)]">الصورة الموجودة بالنظام</div>
                                    <img src={`/files/${c.file_id}/preview`} alt="الصورة الموجودة بالنظام" className="max-h-[420px] object-contain" />
                                </div>
                                <div className={`${card} flex-1 items-center`}>
                                    <div className="text-[16px] font-[700] text-[var(--ink)]">صورة البحث</div>
                                    <img src={`/search/image/query/${p.token}`} alt="صورة البحث" className="max-h-[420px] object-contain" />
                                </div>
                            </div>
                            <div className="flex w-full items-center justify-end gap-[12px]">
                                <Link href={`/orders/${c.order_id}/items/${c.item_id}`} className={sec}>
                                    فتح البند
                                </Link>
                                <Link
                                    href={`/orders/${c.order_id}`}
                                    className="flex h-[44px] items-center rounded-[9px] bg-[var(--primary)] p-[0px_16px] text-[14px] text-white"
                                >
                                    عرض الأوردر
                                </Link>
                            </div>
                            <div className="w-full text-right text-[13px] text-[var(--muted-foreground)]">{`${c.order} • ${c.customer} • ${c.product}`}</div>
                        </>
                    )}
                </div>
            </AppLayout>
        );
    }

    if (p.mode === 'results') {
        return (
            <AppLayout active="/search">
                <Head title="نتائج البحث بالصورة" />
                <div className="flex w-full flex-col gap-[20px]">
                    <Heading title="نتائج البحث بالصورة" />
                    {p.failed ? (
                        <div className={`${card} items-center text-center`}>
                            <div className="text-[18px] font-[700] text-[var(--ink)]">تعذر إتمام البحث بالصورة حاليًا.</div>
                            <div className="text-[14px] text-[var(--muted-foreground)]">احتفظ بالصورة وأعد المحاولة، أو استخدم البحث النصي.</div>
                            <div className="flex gap-[12px]">
                                <Link href="/search" className={sec}>
                                    البحث النصي
                                </Link>
                                <Link href="/search/image" className={sec}>
                                    بحث جديد
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex w-full items-center justify-between">
                                <Link href="/search/image" className={sec}>
                                    تغيير الصورة
                                </Link>
                                <div className="text-right text-[14px] text-[var(--muted-foreground)]">{`${p.archived ? 'كل الأوردرات' : 'الأوردرات النشطة'} • عدد المرشحين: ${p.results?.length ?? 0}`}</div>
                            </div>
                            <div className="flex w-full gap-[16px]">
                                <div className={`${card} w-[260px] shrink-0 items-center`}>
                                    <div className="text-[14px] font-[700] text-[var(--ink)]">صورة البحث</div>
                                    <img src={`/search/image/query/${p.token}`} alt="صورة البحث" className="max-h-[220px] object-contain" />
                                </div>
                                <div className="flex flex-1 flex-col gap-[12px]">
                                    {(p.results ?? []).length === 0 && (
                                        <div className={`${card} items-center text-[14px] text-[var(--muted-foreground)]`}>
                                            لا توجد نتائج مشابهة. جرّب صورة أوضح أو أدرج الأوردرات المؤرشفة أو استخدم البحث النصي.
                                        </div>
                                    )}
                                    {(p.results ?? []).map((r) => (
                                        <div
                                            key={r.file_id}
                                            className="flex items-center gap-[16px] rounded-[12px] bg-[var(--surface)] p-[12px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]"
                                        >
                                            <Link
                                                href={`/search/image/compare?file=${r.file_id}&q=${p.token}`}
                                                className="flex h-[40px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_14px] text-[13px] text-white"
                                            >
                                                مقارنة
                                            </Link>
                                            <div className="w-[70px] text-center text-[16px] font-[700] text-[var(--primary)]">{`${r.similarity}%`}</div>
                                            <div className="flex-1 text-right">
                                                <div className="text-[14px] font-[700] text-[var(--ink)]">{`${r.order} • ${r.product}`}</div>
                                                <div className="text-[12px] text-[var(--muted-foreground)]">{`${r.customer} • ${r.status}`}</div>
                                            </div>
                                            {r.preview ? (
                                                <img
                                                    src={`/files/${r.file_id}/preview`}
                                                    alt=""
                                                    className="h-[64px] w-[64px] rounded-[8px] object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-[64px] w-[64px] items-center justify-center rounded-[8px] bg-[var(--background)] text-center text-[10px] text-[var(--muted-foreground)]">
                                                    المعاينة غير متاحة
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="w-full text-right text-[12px] text-[var(--muted-foreground)]">
                                الترتيب يقترح مرشحين فقط. تحقق من الصور وبيانات الأوردر قبل الاختيار.
                            </div>
                        </>
                    )}
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout active="/search">
            <Head title="البحث بالصورة" />
            {cam && (
                <CameraCapture
                    onCapture={(f) => {
                        setFile(f);
                        setCam(false);
                    }}
                    onClose={() => setCam(false)}
                />
            )}
            <div className="flex w-full flex-col gap-[20px]">
                <Heading title="البحث بالصورة" />
                <div className="w-full text-right text-[15px] text-[#475569]">صوّر الشغل المطبوع أو ارفع صورته للعثور على أوردرات مشابهة.</div>
                <div className={card}>
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDrag(true);
                        }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDrag(false);
                            pick(e.dataTransfer.files[0]);
                        }}
                        className="flex w-full flex-col items-center gap-[8px] rounded-[14px] bg-[var(--background)] p-[32px]"
                        style={{ outline: `1px ${drag ? 'dashed var(--primary)' : 'solid #CBD5E1'}` }}
                    >
                        <div className="text-[20px] font-[600] text-[var(--ink)]">{file ? file.name : 'ارفع صورة الشغل'}</div>
                        <div className="text-[14px] text-[var(--muted-foreground)]">اسحب الصورة هنا أو اخترها من جهازك.</div>
                        <input
                            ref={input}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            capture="environment"
                            aria-label="اختيار صورة"
                            hidden
                            onChange={(e) => pick(e.target.files?.[0])}
                        />
                        <button
                            type="button"
                            onClick={() => input.current?.click()}
                            className="flex h-[46px] items-center rounded-[10px] bg-[var(--background)] p-[0px_14px] text-[14px] font-[600] text-[var(--ink)] [outline:1px_solid_#CBD5E1]"
                        >
                            اختيار صورة
                        </button>
                    </div>
                    {preview && <img src={preview} alt="الصورة المختارة" className="max-h-[240px] self-center rounded-[10px] object-contain" />}
                    <div className="flex w-full items-center justify-end gap-[16px]">
                        {!camOk && (
                            <div className="flex-1 text-right text-[13px] text-[var(--muted-foreground)]">
                                المعاينة الحية غير متاحة هنا؛ سيفتح زر الالتقاط كاميرا الجهاز إن وُجدت، أو ارفع صورة.
                            </div>
                        )}
                        <input
                            ref={shot}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            aria-label="التقاط بكاميرا الجهاز"
                            hidden
                            onChange={(e) => pick(e.target.files?.[0])}
                        />
                        <button
                            type="button"
                            onClick={() => (camOk ? setCam(true) : shot.current?.click())}
                            className="flex h-[44px] items-center rounded-[9px] bg-[var(--primary)] p-[0px_16px] text-[14px] text-white"
                        >
                            التقاط صورة
                        </button>
                    </div>
                    {err && (
                        <div role="alert" className="w-full text-right text-[13px] text-[#DC2626]">
                            {err}
                        </div>
                    )}
                    <div className="text-right text-[18px] text-[var(--ink)]">نطاق البحث</div>
                    <div className="text-right text-[14px] text-[var(--ink)]">الأوردرات النشطة</div>
                    <label className="flex items-center justify-end gap-[10px] text-[14px] text-[var(--ink)]">
                        تضمين الأوردرات المؤرشفة
                        <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} className="h-[20px] w-[20px]" />
                    </label>
                    <div className="text-right text-[13px] text-[var(--muted-foreground)]">يمكنك تضمين الأوردرات القديمة لتوسيع نطاق البحث.</div>
                    <div className="flex w-full justify-end">
                        <button
                            type="button"
                            disabled={!file || busy}
                            onClick={() => run()}
                            className="flex h-[44px] items-center rounded-[9px] p-[0px_16px] text-[14px] disabled:cursor-not-allowed"
                            style={{ background: file ? 'var(--primary)' : '#E2E8F0', color: file ? '#fff' : '#64748B' }}
                        >
                            {busy ? 'جارٍ البحث…' : 'البحث بالصورة'}
                        </button>
                    </div>
                </div>
                <div className="w-full text-right text-[14px] text-[#475569]">صوّر الشغل بوضوح وحاول تخلي التصميم كامل داخل الصورة.</div>
                <div className="w-full text-right text-[12px] text-[var(--muted-foreground)]">
                    تُستخدم الصورة مؤقتًا للبحث، ولا تُضاف إلى أوردر أو عميل.
                </div>
            </div>
        </AppLayout>
    );
}
