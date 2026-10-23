import { uuid as uid } from '@/lib/idempotency';
import { useRealtime } from '@/hooks/use-realtime';
import { formatDate, formatDateTimeShort, formatTime } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Msg {
    id: number;
    sender: string;
    label: string | null;
    body: string;
    at: string;
    client_id: string;
    file?: { id: number; name: string; mime: string; kind: 'image' | 'audio' | 'pdf' } | null;
}
interface Meta {
    locked: boolean;
    can_send: boolean;
    label: string;
}

const xsrf = (): string => decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');

/** شات البند — يعمل بالـpolling كل 4 ثوانٍ (يتحمل انقطاع الشبكة) وإرسال idempotent بـclient_id يُعاد استخدامه عند إعادة المحاولة. */
/** اشتراك Reverb خاص بالموظف/المصمم فقط (العميل بلا حساب موظف فلا يشترك ويعتمد على الـpolling). */
function ChatRealtime({ itemId, onMessage }: { itemId: number; onMessage: () => void }) {
    useRealtime(`item-chat.${itemId}`, '.message.sent', onMessage);

    return null;
}

const iso = (v: string | number) => `\u2066${v}\u2069`;
const mCtl = 'flex h-[46px] w-full items-center rounded-[10px] bg-[#F8FAFC] p-[0px_14px] [outline:1px_solid_#CBD5E1] [outline-offset:-0.5px] focus-within:[outline:2px_solid_#2563EB]';

/**
 * fileUrl: رابط عرض المرفق حسب الجهة (رابط العميل/البوابة/الموظف). variant="mobile" = M-B03 (المحادثة الكاملة + المؤلف).
 * seed: رسائل جاهزة بلا شبكة (وضع مقارنة الـpen المحلي فقط).
 */
export function ChatPanel({ url, mine, itemId, fileUrl, variant = 'desktop', seed }: { url: string; mine: string[]; itemId?: number; fileUrl?: (id: number) => string; variant?: 'desktop' | 'mobile'; seed?: { msgs: Msg[]; meta: Meta } }) {
    const [msgs, setMsgs] = useState<Msg[]>(seed?.msgs ?? []);
    const [meta, setMeta] = useState<Meta | null>(seed?.meta ?? null);
    const [attach, setAttach] = useState<File | null>(null);
    const [rec, setRec] = useState<MediaRecorder | null>(null);
    const picker = useRef<HTMLInputElement>(null);
    const seeded = !!seed;
    const [text, setText] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const pending = useRef<string | null>(null);
    const last = useRef(0);
    const end = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        if (seeded) return;
        try {
            const r = await fetch(`${url}?after=${last.current}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            if (!r.ok) return;
            const j = (await r.json()) as { data: Msg[]; meta: Meta };
            setMeta(j.meta);
            if (j.data.length) {
                last.current = j.data[j.data.length - 1].id;
                setMsgs((p) => [...p, ...j.data.filter((m) => !p.some((x) => x.id === m.id))]);
            }
        } catch {
            /* انقطاع مؤقت: المحاولة القادمة تكمل من آخر رسالة */
        }
    }, [url, seeded]);

    useEffect(() => {
        void load();
        const t = setInterval(() => void load(), itemId ? 20000 : 4000);
        return () => clearInterval(t);
    }, [load, itemId]);
    useEffect(() => {
        end.current?.scrollIntoView({ block: 'end' });
    }, [msgs.length]);

    async function send() {
        const body = text.trim();
        if ((!body && !attach) || busy) return;
        setBusy(true);
        setErr('');
        pending.current ??= uid();
        try {
            const form = attach ? new FormData() : null;
            if (form) {
                if (body) form.append('body', body);
                form.append('client_id', pending.current);
                form.append('file', attach as File);
            }
            const r = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: form ? { Accept: 'application/json', 'X-XSRF-TOKEN': xsrf() } : { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': xsrf() },
                body: form ?? JSON.stringify({ body, client_id: pending.current }),
            });
            if (r.ok) {
                pending.current = null;
                setText('');
                setAttach(null);
                await load();
            } else {
                const j = (await r.json().catch(() => ({}))) as { error?: { message?: string }; message?: string };
                setErr(j.error?.message ?? j.message ?? 'تعذر إرسال الرسالة.');
                if (r.status !== 0 && r.status < 500) pending.current = null;
            }
        } catch {
            setErr('انقطع الاتصال — اضغط إرسال لإعادة المحاولة (لن تتكرر الرسالة).');
        } finally {
            setBusy(false);
        }
    }

    async function toggleVoice() {
        if (rec) {
            rec.stop();
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream);
            const chunks: Blob[] = [];
            mr.ondataavailable = (e) => chunks.push(e.data);
            mr.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
                setRec(null);
                if (chunks.length) setAttach(new File(chunks, 'voice.webm', { type: mr.mimeType || 'audio/webm' }));
            };
            mr.start();
            setRec(mr);
            setErr('');
        } catch {
            setErr('تعذّر تشغيل الميكروفون. اسمح بالوصول للميكروفون أو أرفق ملفًا صوتيًا.');
        }
    }
    const Attachment = ({ m, light }: { m: Msg; light?: boolean }) => {
        if (!m.file || !fileUrl) return null;
        const u = fileUrl(m.file.id);
        if (m.file.kind === 'image') return <img src={u} alt={m.file.name} className="max-h-[180px] max-w-full rounded-[8px] object-contain" draggable={false} />;
        if (m.file.kind === 'audio') return <audio controls src={u} className="max-w-full" />;
        return (
            <a href={u} target="_blank" rel="noreferrer" className={`text-[13px] font-[700] underline ${light ? 'text-white' : 'text-[#2563EB]'}`}>
                📎 {m.file.name}
            </a>
        );
    };
    const fileInput = <input ref={picker} type="file" accept="image/png,image/jpeg,image/webp,application/pdf,audio/*" aria-label="مرفق المحادثة" className="sr-only" onChange={(e) => { setAttach(e.target.files?.[0] ?? null); e.target.value = ''; }} />;
    const attachChip = attach && (
        <div className="flex w-full items-center justify-end gap-[8px] text-right text-[13px] text-[#334155]">
            <button type="button" aria-label="إزالة المرفق" onClick={() => setAttach(null)} className="text-[#64748B]">✕</button>
            <span>{attach.name === 'voice.webm' ? '🎤 رسالة صوتية' : `📎 ${attach.name}`}</span>
        </div>
    );
    const src = (m: Msg) => `${m.label ?? ''} · ${iso(new Date(m.at).getDate())} ${formatDate(m.at).split(' ')[1]} ${iso(new Date(m.at).getFullYear())}، ${iso(formatTime(m.at).replace(/^0/, '').replace(' ص', '').replace(' م', ''))} ${formatTime(m.at).endsWith('ص') ? 'ص' : 'م'}`;

    if (variant === 'mobile') {
        return (
            <>
                {itemId && <ChatRealtime itemId={itemId} onMessage={() => void load()} />}
                <div dir="ltr" className="flex w-full flex-col items-end gap-[14px] rounded-[14px] bg-[#F6F8FC] [outline:1px_solid_#F6F8FC]">
                    {msgs.length === 0 && <div className="w-full text-right text-[14px] text-[#64748B]">لا توجد رسائل بعد.</div>}
                    {msgs.map((m) =>
                        m.sender === 'system' ? (
                            <div key={m.id} className="flex w-full flex-col items-end gap-[10px] rounded-[14px] bg-[#F6F8FC] p-[8px] [outline:1px_solid_#F6F8FC]">
                                <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#334155]">{m.body}</div>
                            </div>
                        ) : (
                            <div key={m.id} className={`flex w-full ${mine.includes(m.sender) ? 'justify-end p-[0px_0px_0px_30px]' : 'p-[0px_30px_0px_0px]'}`}>
                                <div className={`flex flex-1 flex-col items-end gap-[10px] rounded-[12px] p-[12px] [outline-offset:-0.5px] ${mine.includes(m.sender) ? 'bg-[#EFF6FF] [outline:1px_solid_#DBEAFE]' : 'bg-white [outline:1px_solid_#E2E8F0]'}`}>
                                    <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#64748B]">{src(m)}</div>
                                    {m.body && <div className="w-full text-right text-[15px] leading-[normal] font-[400] whitespace-pre-wrap text-[#0F172A]">{m.body}</div>}
                                    <Attachment m={m} />
                                </div>
                            </div>
                        ),
                    )}
                    <div ref={end} />
                </div>
                {meta?.locked && <div className="w-full rounded-[10px] bg-white p-[12px] text-right text-[13px] text-[#64748B]">المحادثة مغلقة — تم اعتماد البند أو بدأت الطباعة.</div>}
                {meta?.can_send && (
                    <div className="sticky bottom-0 -mx-[16px] flex w-[calc(100%+32px)] flex-col items-end gap-[10px] bg-white p-[12px_16px_24px_16px] [outline:1px_solid_#E2E8F0] [outline-offset:-0.5px]">
                        <label className="flex w-full flex-col gap-[6px]">
                            <span className="w-full text-right text-[14px] leading-[21px] font-[600] text-[#475569]">الرسالة</span>
                            <div className={mCtl}>
                                <input dir="rtl" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="اكتب رسالتك هنا..." onKeyDown={(e) => e.key === 'Enter' && void send()} className="min-w-0 flex-1 bg-transparent text-right text-[15px] leading-[23px] text-[#0F172A] outline-none placeholder:text-[#64748B]" />
                            </div>
                        </label>
                        {attachChip}
                        {err && <div role="alert" className="w-full text-right text-[13px] text-[#DC2626]">{err}</div>}
                        <div className="flex h-[46px] w-full gap-[8px]">
                            <button type="button" onClick={() => picker.current?.click()} className="flex flex-1 items-center justify-center gap-[7px] rounded-[10px] bg-[#F8FAFC] text-[14px] leading-[normal] font-[700] text-[#2563EB]">
                                <span>إرفاق</span>
                                <Icon name="paperclip" className="h-[18px] w-[18px]" color="#2563EB" />
                            </button>
                            <button type="button" onClick={() => void toggleVoice()} className="flex flex-1 items-center justify-center gap-[7px] rounded-[10px] bg-[#F8FAFC] text-[14px] leading-[normal] font-[700] text-[#2563EB]">
                                <span>{rec ? 'إيقاف' : 'صوت'}</span>
                                <Icon name="mic" className="h-[18px] w-[18px]" color={rec ? '#DC2626' : '#2563EB'} />
                            </button>
                        </div>
                        {fileInput}
                        <button type="button" onClick={() => void send()} disabled={busy} className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-[#2563EB] text-[15px] leading-[normal] font-[700] text-white disabled:opacity-60">
                            {busy ? '…' : 'إرسال الرسالة'}
                        </button>
                    </div>
                )}
            </>
        );
    }

    return (
        <>
            {itemId && <ChatRealtime itemId={itemId} onMessage={() => void load()} />}
            <div
                dir="rtl"
                className="flex w-full flex-col gap-[10px] rounded-[10px] bg-[var(--surface)] p-[14px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]"
            >
                <div className="flex max-h-[360px] min-h-[160px] flex-col gap-[8px] overflow-y-auto">
                    {msgs.length === 0 && <div className="m-auto text-[13px] text-[var(--muted-foreground)]">لا توجد رسائل بعد.</div>}
                    {msgs.map((m) => {
                        const me = mine.includes(m.sender);
                        return (
                            <div key={m.id} className={`flex flex-col gap-[2px] ${me ? 'items-start' : 'items-end'}`}>
                                <div
                                    className={`max-w-[80%] rounded-[10px] px-[12px] py-[8px] text-[13px] leading-[1.5] whitespace-pre-wrap ${me ? 'bg-[var(--primary)] text-white' : 'bg-[var(--background)] text-[var(--ink)]'}`}
                                >
                                    {m.body}
                                    <Attachment m={m} light={me} />
                                </div>
                                <div className="text-[10px] text-[var(--muted-foreground)]">
                                    {m.label} · {formatDateTimeShort(m.at)}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={end} />
                </div>
                {meta?.locked && (
                    <div className="rounded-[8px] bg-[var(--background)] p-[10px] text-center text-[12px] text-[var(--muted-foreground)]">
                        المحادثة مغلقة — تم اعتماد البند أو بدأت الطباعة.
                    </div>
                )}
                {err && (
                    <div role="alert" className="text-[12px] text-[var(--danger,#DC2626)]">
                        {err}
                    </div>
                )}
                {meta?.can_send && attachChip}
                {meta?.can_send && (
                    <div className="flex items-end gap-[8px]">
                        {fileInput}
                        <button type="button" aria-label="إرفاق ملف" onClick={() => picker.current?.click()} className="h-[38px] rounded-[8px] px-[10px] text-[13px] font-[600] text-[var(--primary)] [outline:1px_solid_var(--border)]">إرفاق</button>
                        <button type="button" aria-label="تسجيل صوت" onClick={() => void toggleVoice()} className="h-[38px] rounded-[8px] px-[10px] text-[13px] font-[600] text-[var(--primary)] [outline:1px_solid_var(--border)]">{rec ? 'إيقاف' : 'صوت'}</button>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            maxLength={2000}
                            rows={2}
                            placeholder="اكتب رسالتك…"
                            className="flex-1 resize-none rounded-[8px] bg-[var(--background)] p-[10px] text-[13px] [outline:1px_solid_var(--border)] outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => void send()}
                            disabled={busy || (!text.trim() && !attach)}
                            className="h-[38px] rounded-[8px] bg-[var(--primary)] px-[16px] text-[13px] font-[600] text-white disabled:opacity-50"
                        >
                            {busy ? '…' : 'إرسال'}
                        </button>
                    </div>
                )}
                {meta && !meta.can_send && !meta.locked && (
                    <div className="text-center text-[12px] text-[var(--muted-foreground)]">عرض فقط — لا تملك صلاحية الإرسال.</div>
                )}
            </div>
        </>
    );
}
