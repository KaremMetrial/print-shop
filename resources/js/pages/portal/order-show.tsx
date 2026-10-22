import { ProofDialog } from '@/components/finance/proof-dialog';
import { CustomerLayout } from '@/components/shell/customer-layout';
import { formatDate, formatMoneyFixed } from '@/lib/money';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    order: {
        id: number;
        number: string;
        status: string;
        created_at: string;
        delivery_method: string;
        delivery_address: string | null;
        delivery_fee_minor: number;
        grand_total_minor: number;
        has_invoice: boolean;
        paid_minor: number;
        remaining_minor: number;
        items: { id: number; name: string; quantity: number; state: string; approved: boolean; total_minor: number }[];
        payments: { number: string; at: string; amount_minor: number }[];
    };
}
const card = 'flex w-full flex-col gap-[10px] rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)]';
const STATE: Record<string, string> = { NEW: 'قيد الإعداد', IN_DESIGN: 'قيد التصميم', REVISION_REQUESTED: 'يتم التعديل', AWAITING_APPROVAL: 'بانتظار اعتمادك', APPROVED: 'معتمد' };
const KV = ({ k, v }: { k: string; v: string }) => (
    <div className="flex w-full justify-between text-[14px]">
        <b>{v}</b>
        <span className="text-[var(--muted-foreground)]">{k}</span>
    </div>
);

/** S-085 — تفاصيل الأوردر للعميل المسجّل: بنود، مدفوعات، تسليم. */
export default function PortalOrderShow({ order: o }: Props) {
    const [proof, setProof] = useState(false);
    return (
        <CustomerLayout>
            <Head title={`الأوردر ${o.number}`} />
            <div className="flex w-full flex-col gap-[4px]">
                <h1 className="text-right text-[28px] leading-[40px] font-[700]">الأوردر {o.number}</h1>
                <div className="text-right text-[14px] text-[var(--muted-foreground)]">{o.status} • {formatDate(o.created_at)}</div>
            </div>
            <div className={card}>
                <div className="text-right text-[18px] font-[700]">البنود</div>
                {o.items.map((i) => (
                    <div key={i.id} className="flex w-full items-center justify-between p-[8px_0px] [border-bottom:1px_solid_var(--border)]">
                        {i.state === 'AWAITING_APPROVAL' ? (
                            <Link href={`/portal/orders/${o.id}/items/${i.id}`} className="flex h-[38px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_14px] text-[13px] font-[600] text-white">
                                راجع التصميم
                            </Link>
                        ) : (
                            <Link href={`/portal/orders/${o.id}/items/${i.id}`} className="text-[13px] font-[600] text-[var(--primary)]">
                                عرض التصميم
                            </Link>
                        )}
                        <span className="text-[13px]">{formatMoneyFixed(i.total_minor)}</span>
                        <span className="text-[13px] text-[var(--muted-foreground)]">{STATE[i.state] ?? i.state}</span>
                        <span className="text-[13px]">الكمية: {i.quantity.toLocaleString('en-US')}</span>
                        <b className="text-[15px]">{i.name}</b>
                    </div>
                ))}
            </div>
            <div className="flex w-full flex-col gap-[16px] lg:flex-row">
                <div className={`${card} flex-1`}>
                    <div className="text-right text-[18px] font-[700]">ملخص الدفع</div>
                    <KV k="الإجمالي" v={formatMoneyFixed(o.grand_total_minor)} />
                    <KV k="المدفوع المؤكد" v={formatMoneyFixed(o.paid_minor)} />
                    <KV k="المتبقي عليك" v={formatMoneyFixed(o.remaining_minor)} />
                    {o.has_invoice && (
                        <Link href={`/portal/orders/${o.id}/invoice`} className="text-right text-[13px] font-[700] text-[var(--primary)]">عرض الفاتورة الداخلية</Link>
                    )}
                    {o.remaining_minor > 0 && (
                        <button type="button" onClick={() => setProof(true)} className="text-right text-[13px] font-[700] text-[var(--primary)]">إرسال إثبات دفع</button>
                    )}
                    {proof && <ProofDialog url={`/portal/orders/${o.id}/proofs`} remainingMinor={o.remaining_minor} onClose={() => setProof(false)} />}
                    {o.payments.map((p) => (
                        <div key={p.number} className="flex justify-between text-[12px] text-[var(--muted-foreground)]">
                            <span>{formatMoneyFixed(p.amount_minor)}</span>
                            <span>{p.number} • {formatDate(p.at)}</span>
                        </div>
                    ))}
                </div>
                <div className={`${card} flex-1`}>
                    <div className="text-right text-[18px] font-[700]">التسليم</div>
                    <KV k="الطريقة" v={o.delivery_method === 'DELIVERY' ? 'توصيل' : 'استلام من المطبعة'} />
                    {o.delivery_method === 'DELIVERY' && <KV k="العنوان" v={o.delivery_address ?? '—'} />}
                    {o.delivery_method === 'DELIVERY' && <KV k="الرسوم" v={formatMoneyFixed(o.delivery_fee_minor)} />}
                </div>
            </div>
        </CustomerLayout>
    );
}
