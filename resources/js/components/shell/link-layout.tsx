import { Head, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';

/** رابط خاص (pendev: S-086…093): هوية المطبعة + مرجع الأوردر فقط، بلا قائمة أو حساب (BR-005). noindex + no-referrer. DOM LTR-literal. */
export function LinkLayout({ orderRef, children }: { orderRef?: { number: string; customer: string }; children: ReactNode }) {
    const shop = usePage<{ name: string } & Record<string, unknown>>().props.name;
    return (
        <div dir="ltr" className="flex min-h-screen w-full flex-col items-end bg-[#F6F8FC]">
            <Head>
                <meta name="robots" content="noindex,nofollow" />
                <meta name="referrer" content="no-referrer" />
            </Head>
            <header className="hidden h-[75.5px] w-full shrink-0 items-center justify-between bg-[var(--surface)] p-[0px_48px] lg:flex [border-bottom:1px_solid_var(--border)]">
                {orderRef ? (
                    <div className="flex w-fit shrink-0 flex-col items-end gap-[2px]">
                        <div className="text-left text-[13px] leading-[normal] font-[700] whitespace-pre text-[var(--ink)]">{`⁦${orderRef.number}⁩ • ${orderRef.customer}`}</div>
                        <div className="text-left text-[11px] leading-[normal] font-[400] text-[var(--muted-foreground)]">تجربة الأوردر عبر الرابط</div>
                    </div>
                ) : (
                    <div />
                )}
                <div className="flex w-fit shrink-0 flex-col items-end gap-[1px]">
                    <div className="text-left text-[22px] leading-[normal] font-[800] text-[var(--primary)]">PBMS</div>
                    <div className="text-left text-[11px] leading-[normal] font-[400] text-[#475569]">{shop}</div>
                </div>
            </header>
            <div className="flex h-[61.5px] w-full shrink-0 items-center justify-end gap-[12px] bg-[var(--surface)] p-[0px_16px] [border-bottom:1px_solid_var(--border)] lg:hidden">
                <div className="flex flex-1 flex-col items-end">
                    <div className="text-[15px] leading-[normal] font-[700] text-[var(--ink)]">{shop}</div>
                    {orderRef && <div className="text-[12px] leading-[normal] text-[var(--muted-foreground)]">{orderRef.number}</div>}
                </div>
            </div>
            {children}
        </div>
    );
}
