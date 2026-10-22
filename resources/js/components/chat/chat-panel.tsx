import { uuid as uid } from '@/lib/idempotency';
import { useRealtime } from '@/hooks/use-realtime';
import { formatDateTimeShort } from '@/lib/money';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Msg {
    id: number;
    sender: string;
    label: string | null;
    body: string;
    at: string;
    client_id: string;
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

export function ChatPanel({ url, mine, itemId }: { url: string; mine: string[]; itemId?: number }) {
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [text, setText] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const pending = useRef<string | null>(null);
    const last = useRef(0);
    const end = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
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
    }, [url]);

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
        if (!body || busy) return;
        setBusy(true);
        setErr('');
        pending.current ??= uid();
        try {
            const r = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': xsrf() },
                body: JSON.stringify({ body, client_id: pending.current }),
            });
            if (r.ok) {
                pending.current = null;
                setText('');
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
                {meta?.can_send && (
                    <div className="flex items-end gap-[8px]">
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
                            disabled={busy || !text.trim()}
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
