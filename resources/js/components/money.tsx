import { formatMoney } from '@/lib/money';

export function Money({ minor, className }: { minor: number; className?: string }) {
    return (
        <bdi dir="rtl" className={className}>
            {formatMoney(minor)}
        </bdi>
    );
}
